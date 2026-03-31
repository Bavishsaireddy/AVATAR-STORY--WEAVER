"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import type {
  StoryState,
  StorySegment,
  Genre,
  StoryChoice,
  StoryDNA,
} from "@/types/story";

const DEFAULT_STATE: StoryState = {
  title: "",
  genre: "Fantasy",
  hook: "",
  segments: [],
  characters: [],
  dna: null,
  temperature: 0.7,
  isLoading: false,
  error: null,
  phase: "setup",
  pendingChoices: [],
};

function makeSegment(role: "user" | "ai", text: string): StorySegment {
  return { id: uuidv4(), role, text, timestamp: Date.now() };
}

export function useStory() {
  const [state, setState] = useState<StoryState>(DEFAULT_STATE);
  const stateRef = useRef(state);
  /** Invalidates pending sidebar enrichment when a new turn starts */
  const enrichGenRef = useRef(0);
  const enrichTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    stateRef.current = state;
  });

  const setError = useCallback((error: string | null) => {
    setState((s) => ({ ...s, error, isLoading: false }));
  }, []);

  const handleApiError = useCallback(
    (data: { error?: string; retryAfter?: number }) => {
      if (data.error === "RATE_LIMIT") {
        const secs = data.retryAfter ?? 30;
        setError(`Rate limit reached — please wait ${secs} seconds and try again.`);
      } else if (data.error === "INVALID_KEY") {
        setError("Invalid API key. Check your ANTHROPIC_API_KEY in .env.local.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    },
    [setError]
  );

  // ─── Background enrichment (debounced, sequential — easier on CPU & APIs) ─

  const cancelPendingEnrichment = useCallback(() => {
    enrichGenRef.current += 1;
    if (enrichTimerRef.current) {
      clearTimeout(enrichTimerRef.current);
      enrichTimerRef.current = null;
    }
  }, []);

  const runEnrichmentSerial = useCallback(async (newText: string, gen: number) => {
    try {
      let current = stateRef.current;
      if (gen !== enrichGenRef.current) return;

      const charRes = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characters: current.characters, newText }),
      });
      if (gen !== enrichGenRef.current) return;
      if (charRes.ok) {
        const charData = await charRes.json();
        if (charData.characters) {
          setState((s) => ({ ...s, characters: charData.characters }));
        }
      }

      current = stateRef.current;
      if (gen !== enrichGenRef.current) return;

      const dnaRes = await fetch("/api/dna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dna: current.dna, newText, genre: current.genre }),
      });
      if (gen !== enrichGenRef.current) return;
      if (dnaRes.ok) {
        const dnaData = await dnaRes.json();
        if (dnaData.dna) {
          setState((s) => ({ ...s, dna: dnaData.dna as StoryDNA }));
        }
      }
    } catch {
      // Silent — enrichment is optional
    }
  }, []);

  const scheduleEnrichment = useCallback(
    (newText: string) => {
      if (enrichTimerRef.current) clearTimeout(enrichTimerRef.current);
      const gen = enrichGenRef.current;
      enrichTimerRef.current = setTimeout(() => {
        enrichTimerRef.current = null;
        void runEnrichmentSerial(newText, gen);
      }, 900);
    },
    [runEnrichmentSerial]
  );

  useEffect(
    () => () => {
      if (enrichTimerRef.current) {
        clearTimeout(enrichTimerRef.current);
        enrichTimerRef.current = null;
      }
    },
    []
  );

  // ─── Streaming story fetch ────────────────────────────────────────────────
  // Reads the streamed text and updates the segment in real-time (typewriter effect)

  const streamStoryResponse = useCallback(
    async (
      segId: string,
      fetchPromise: Promise<Response>
    ): Promise<string | null> => {
      let res: Response;
      try {
        res = await fetchPromise;
      } catch {
        setError("Network error — check your connection.");
        return null;
      }

      // Non-2xx means JSON error body
      if (!res.ok) {
        try {
          const data = await res.json();
          handleApiError(data);
        } catch {
          setError("Something went wrong. Please try again.");
        }
        return null;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let lastRender = 0;

      const flush = (text: string) => {
        setState((s) => ({
          ...s,
          segments: s.segments.map((seg) =>
            seg.id === segId ? { ...seg, text } : seg
          ),
        }));
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            flush(fullText);
            break;
          }
          fullText += decoder.decode(value, { stream: true });

          // Throttle re-renders — lighter on weak machines than per-chunk updates
          const now = Date.now();
          if (now - lastRender >= 150) {
            flush(fullText);
            lastRender = now;
          }
        }
      } catch {
        setError("Stream interrupted. Please try again.");
        return null;
      }

      return fullText;
    },
    [handleApiError, setError]
  );

  // ─── Actions ─────────────────────────────────────────────────────────────

  const startStory = useCallback(
    async (title: string, genre: Genre, hook: string) => {
      cancelPendingEnrichment();
      setState((s) => ({
        ...s,
        title,
        genre,
        hook,
        segments: [],
        characters: [],
        dna: null,
        pendingChoices: [],
        isLoading: true,
        error: null,
        phase: "writing",
      }));

      const segId = uuidv4();
      const placeholder: StorySegment = { id: segId, role: "ai", text: "", timestamp: Date.now() };
      setState((s) => ({ ...s, segments: [placeholder] }));

      const fetchPromise = fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          genre,
          hook,
          segments: [],
          characters: [],
          temperature: stateRef.current.temperature,
          mode: "start",
        }),
      });

      const fullText = await streamStoryResponse(segId, fetchPromise);

      if (!fullText) {
        // Keep the error message visible while returning to setup screen
        setState((s) => ({ ...s, phase: "setup", segments: [], isLoading: false }));
        return;
      }

      setState((s) => ({ ...s, isLoading: false }));
      scheduleEnrichment(fullText);
    },
    [cancelPendingEnrichment, scheduleEnrichment, streamStoryResponse]
  );

  const continueStory = useCallback(
    async (userInput?: string) => {
      cancelPendingEnrichment();
      const current = stateRef.current;
      const trimmedInput = userInput?.trim();

      // If user typed something, add it as a user segment first
      const updatedSegments = trimmedInput
        ? [...current.segments, makeSegment("user", trimmedInput)]
        : current.segments;

      setState((s) => ({
        ...s,
        isLoading: true,
        error: null,
        pendingChoices: [],
        segments: updatedSegments,
      }));

      const segId = uuidv4();
      const placeholder: StorySegment = { id: segId, role: "ai", text: "", timestamp: Date.now() };
      setState((s) => ({ ...s, segments: [...s.segments, placeholder] }));

      const fetchPromise = fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: current.title,
          genre: current.genre,
          hook: current.hook,
          segments: updatedSegments,
          characters: current.characters,
          temperature: current.temperature,
          mode: "continue",
          userInput: trimmedInput,
        }),
      });

      const fullText = await streamStoryResponse(segId, fetchPromise);
      if (!fullText) return;

      setState((s) => ({ ...s, isLoading: false }));
      scheduleEnrichment(fullText);
    },
    [cancelPendingEnrichment, scheduleEnrichment, streamStoryResponse]
  );

  const getChoices = useCallback(async () => {
    const current = stateRef.current;
    setState((s) => ({ ...s, isLoading: true, error: null, pendingChoices: [] }));

    try {
      const res = await fetch("/api/choices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: current.title,
          genre: current.genre,
          hook: current.hook,
          segments: current.segments,
          characters: current.characters,
          temperature: Math.min(current.temperature + 0.1, 1.0),
          mode: "continue",
        }),
      });

      const data = await res.json();
      if (!res.ok) { handleApiError(data); return; }

      setState((s) => ({ ...s, pendingChoices: data.choices, isLoading: false }));
    } catch {
      setError("Network error — check your connection.");
    }
  }, [handleApiError, setError]);

  const selectChoice = useCallback(
    async (choice: StoryChoice) => {
      cancelPendingEnrichment();
      const current = stateRef.current;

      const choiceNote = makeSegment("user", `[Chose path: ${choice.title}] ${choice.description}`);
      const updatedSegments = [...current.segments, choiceNote];

      setState((s) => ({
        ...s,
        isLoading: true,
        error: null,
        pendingChoices: [],
        segments: updatedSegments,
      }));

      const segId = uuidv4();
      const placeholder: StorySegment = { id: segId, role: "ai", text: "", timestamp: Date.now() };
      setState((s) => ({ ...s, segments: [...s.segments, placeholder] }));

      const fetchPromise = fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: current.title,
          genre: current.genre,
          hook: current.hook,
          segments: updatedSegments,
          characters: current.characters,
          temperature: current.temperature,
          mode: "choice",
          choiceDescription: choice.description,
        }),
      });

      const fullText = await streamStoryResponse(segId, fetchPromise);
      if (!fullText) return;

      setState((s) => ({ ...s, isLoading: false }));
      scheduleEnrichment(fullText);
    },
    [cancelPendingEnrichment, scheduleEnrichment, streamStoryResponse]
  );

  const concludeStory = useCallback(async () => {
    cancelPendingEnrichment();
    const current = stateRef.current;
    setState((s) => ({ ...s, isLoading: true, error: null, pendingChoices: [] }));

    const segId = uuidv4();
    const placeholder: StorySegment = { id: segId, role: "ai", text: "", timestamp: Date.now() };
    setState((s) => ({ ...s, segments: [...s.segments, placeholder] }));

    const fetchPromise = fetch("/api/story", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: current.title,
        genre: current.genre,
        hook: current.hook,
        segments: current.segments,
        characters: current.characters,
        temperature: Math.min(current.temperature, 0.7),
        mode: "conclude",
      }),
    });

    const fullText = await streamStoryResponse(segId, fetchPromise);
    if (!fullText) return;

    setState((s) => ({ ...s, isLoading: false, phase: "concluded" }));
    scheduleEnrichment(fullText);
  }, [cancelPendingEnrichment, scheduleEnrichment, streamStoryResponse]);

  const undoLastAiTurn = useCallback(() => {
    setState((s) => {
      const segments = [...s.segments];
      while (segments.length && segments[segments.length - 1].role === "ai") segments.pop();
      if (segments.length && segments[segments.length - 1].role === "user") segments.pop();
      return { ...s, segments, pendingChoices: [], error: null };
    });
  }, []);

  const dismissChoices = useCallback(() => {
    setState((s) => ({ ...s, pendingChoices: [] }));
  }, []);

  const exportMarkdown = useCallback(() => {
    const s = stateRef.current;
    const aiSegments = s.segments.filter((seg) => seg.role === "ai");
    const content = [
      `# ${s.title}`,
      `*Genre: ${s.genre}*`,
      "",
      `> ${s.hook}`,
      "",
      "---",
      "",
      ...aiSegments.map((seg) => seg.text),
    ].join("\n\n");

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${s.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const resetStory = useCallback(() => {
    cancelPendingEnrichment();
    setState(DEFAULT_STATE);
  }, [cancelPendingEnrichment]);

  const setTemperature = useCallback((temperature: number) => {
    setState((s) => ({ ...s, temperature }));
  }, []);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  return {
    state,
    startStory,
    continueStory,
    getChoices,
    selectChoice,
    concludeStory,
    undoLastAiTurn,
    dismissChoices,
    exportMarkdown,
    resetStory,
    setTemperature,
    clearError,
  };
}
