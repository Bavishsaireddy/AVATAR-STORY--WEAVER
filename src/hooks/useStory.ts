"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { htmlToPlainText, isRichInputEmpty } from "@/lib/htmlToPlainText";
import { formatToxicityUserMessage } from "@/lib/toxicityMessages";
import {
  coerceGenre,
  type StoryState,
  type StorySegment,
  type Genre,
  type StoryChoice,
  type StoryDNA,
  type Character,
  type CreativityPreference,
  type SavedStoryListItem,
} from "@/types/story";
import { storyPersistenceHeaders } from "@/lib/storyClientId";

const DEFAULT_STATE: StoryState = {
  title: "",
  genre: "Fantasy",
  hook: "",
  segments: [],
  characters: [],
  dna: null,
  creativityPreference: "balanced",
  isLoading: false,
  error: null,
  phase: "setup",
  pendingChoices: [],
};

function makeSegment(role: "user" | "ai", text: string): StorySegment {
  return { id: uuidv4(), role, text, timestamp: Date.now() };
}

function toPersistBody(s: StoryState) {
  return {
    title: s.title,
    genre: s.genre,
    hook: s.hook,
    segments: s.segments,
    characters: s.characters,
    dna: s.dna,
    creativityPreference: s.creativityPreference,
    phase: s.phase,
    pendingChoices: s.pendingChoices,
  };
}

export function useStory() {
  const [state, setState] = useState<StoryState>(DEFAULT_STATE);
  const stateRef = useRef(state);
  /** Invalidates pending sidebar enrichment when a new turn starts */
  const enrichGenRef = useRef(0);
  const enrichTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [savedStoryList, setSavedStoryList] = useState<SavedStoryListItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [dbEnabled, setDbEnabled] = useState(false);
  const [savedStoryId, setSavedStoryId] = useState<string | null>(null);

  const actionLockRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  });

  const refreshLibrary = useCallback(async () => {
    setLibraryLoading(true);
    try {
      const res = await fetch("/api/stories", { headers: storyPersistenceHeaders() });
      const data = (await res.json()) as { stories?: SavedStoryListItem[]; db?: boolean };
      setDbEnabled(data.db === true);
      if (Array.isArray(data.stories)) {
        setSavedStoryList(data.stories);
      }
    } catch {
      setSavedStoryList([]);
    } finally {
      setLibraryLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshLibrary();
  }, [refreshLibrary]);

  /** Autosave to Postgres when a story row exists and the user isn’t mid-stream. */
  useEffect(() => {
    if (!dbEnabled || !savedStoryId) return;
    if (state.phase === "setup") return;
    const id = savedStoryId;
    const t = setTimeout(() => {
      const s = stateRef.current;
      if (s.isLoading) return;
      void fetch(`/api/stories/${id}`, {
        method: "PATCH",
        headers: storyPersistenceHeaders(),
        body: JSON.stringify(toPersistBody(s)),
      });
    }, 1200);
    return () => clearTimeout(t);
  }, [
    dbEnabled,
    savedStoryId,
    state.segments,
    state.characters,
    state.dna,
    state.title,
    state.hook,
    state.genre,
    state.phase,
    state.pendingChoices,
    state.creativityPreference,
    state.isLoading,
  ]);

  const setError = useCallback((error: string | null) => {
    setState((s) => ({ ...s, error, isLoading: false }));
  }, []);

  const handleApiError = useCallback(
    (data: { error?: string; retryAfter?: number; message?: string }) => {
      if (data.error === "RATE_LIMIT") {
        const secs = data.retryAfter ?? 30;
        setError(`Rate limit reached — please wait ${secs} seconds and try again.`);
      } else if (data.error === "INVALID_KEY") {
        setError("Invalid API key. Check your ANTHROPIC_API_KEY in .env.local.");
      } else if (data.error === "TOXICITY" && typeof data.message === "string") {
        setError(data.message);
      } else if (data.error === "INVALID_REMIX" && typeof data.message === "string") {
        setError(data.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    },
    [setError]
  );

  /** Client-side Detoxify-class check (toxic-bert). Fail-open if the API errors. */
  const checkTextToxicityClient = useCallback(
    async (plainText: string): Promise<boolean> => {
      const plain = plainText.trim().slice(0, 2500);
      if (plain.length < 8) return true;
      try {
        const res = await fetch("/api/toxicity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: plain }),
        });
        const data = (await res.json()) as {
          flagged?: boolean;
          topLabel?: string;
          maxScore?: number;
          threshold?: number;
        };
        if (!res.ok) return true;
        if (data.flagged) {
          setError(
            formatToxicityUserMessage(
              data.topLabel ?? "",
              typeof data.maxScore === "number" ? data.maxScore : 0,
              typeof data.threshold === "number" ? data.threshold : 0.55
            )
          );
          return false;
        }
        return true;
      } catch {
        return true;
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
      const current = stateRef.current;
      if (gen !== enrichGenRef.current) return;

      /** One LLM call for characters + DNA (was two — halves sidebar rate-limit use). */
      const enrichRes = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characters: current.characters,
          dna: current.dna,
          newText,
          genre: current.genre,
        }),
      });
      if (gen !== enrichGenRef.current) return;
      if (enrichRes.status === 429) return;

      if (enrichRes.ok) {
        const data = (await enrichRes.json()) as {
          characters?: Character[];
          dna?: StoryDNA | null;
        };
        setState((s) => {
          const next = { ...s };
          if (Array.isArray(data.characters)) {
            next.characters = data.characters;
          }
          if (data.dna) {
            const d = data.dna;
            next.dna = {
              mysteries: Array.isArray(d.mysteries) ? d.mysteries : [],
              worldRules: Array.isArray(d.worldRules) ? d.worldRules : [],
              tensionLevel:
                typeof d.tensionLevel === "number" && Number.isFinite(d.tensionLevel)
                  ? Math.min(10, Math.max(1, Math.round(d.tensionLevel)))
                  : 5,
              tensionDescription: typeof d.tensionDescription === "string" ? d.tensionDescription : "",
              runningSummary:
                typeof d.runningSummary === "string" && d.runningSummary.trim()
                  ? d.runningSummary.trim()
                  : (s.dna?.runningSummary ?? ""),
            };
          }
          return next;
        });
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
      }, 1200);
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

      if (!res.body) {
        setError("The server returned an empty body — try again or use npm run dev.");
        return null;
      }

      const reader = res.body.getReader();
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

          // Throttle re-renders (DOM stays stable in StorySegment while streaming — no layout animations)
          const now = Date.now();
          if (now - lastRender >= 90) {
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
    async (title: string, genre: Genre, hook: string, creativityPreference: CreativityPreference) => {
      if (actionLockRef.current) return;
      actionLockRef.current = true;

      try {
        cancelPendingEnrichment();
        const plainHook = htmlToPlainText(hook).trim();
        const toxOk = await checkTextToxicityClient(plainHook);
        if (!toxOk) return;

      setState((s) => ({
        ...s,
        title,
        genre,
        hook,
        creativityPreference,
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

      const cur = stateRef.current;
      const fetchPromise = fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          genre,
          hook,
          segments: [],
          characters: [],
          creativityPreference: cur.creativityPreference,
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

      const snap = stateRef.current;
      try {
        const res = await fetch("/api/stories", {
          method: "POST",
          headers: storyPersistenceHeaders(),
          body: JSON.stringify(toPersistBody(snap)),
        });
        if (res.ok) {
          const data = (await res.json()) as { id?: string };
          if (typeof data.id === "string") {
            setSavedStoryId(data.id);
          }
        }
      } catch {
        // optional persistence
      }
      void refreshLibrary();
      } finally {
        actionLockRef.current = false;
      }
    },
    [cancelPendingEnrichment, checkTextToxicityClient, scheduleEnrichment, streamStoryResponse, refreshLibrary]
  );

  const continueStory = useCallback(
    async (userInput?: string) => {
      if (actionLockRef.current) return;
      actionLockRef.current = true;
      try {
        cancelPendingEnrichment();
        const current = stateRef.current;
        if (!current.hook.trim()) {
          setError("Add your opening premise in the Premise box above before continuing.");
          return;
        }
        const raw = userInput?.trim();
        const hasUserContribution = raw && !isRichInputEmpty(raw);

        if (hasUserContribution && raw) {
          const toxOk = await checkTextToxicityClient(htmlToPlainText(raw));
          if (!toxOk) return;
        }

      const updatedSegments = hasUserContribution
        ? [...current.segments, makeSegment("user", raw)]
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
          creativityPreference: current.creativityPreference,
          mode: "continue",
          userInput: hasUserContribution ? raw : undefined,
        }),
      });

      const fullText = await streamStoryResponse(segId, fetchPromise);
      if (!fullText) {
        setState((s) => {
          let segs = s.segments;
          const last = segs[segs.length - 1];
          if (last?.id === segId && last.role === "ai") {
            segs = segs.slice(0, -1);
          }
          if (hasUserContribution && segs.length > 0) {
            const u = segs[segs.length - 1];
            if (u?.role === "user") {
              segs = segs.slice(0, -1);
            }
          }
          return { ...s, isLoading: false, segments: segs };
        });
        return;
      }

      setState((s) => ({ ...s, isLoading: false }));
      scheduleEnrichment(fullText);
      } finally {
        actionLockRef.current = false;
      }
    },
    [cancelPendingEnrichment, checkTextToxicityClient, scheduleEnrichment, streamStoryResponse]
  );

  const getChoices = useCallback(async () => {
    if (actionLockRef.current) return;
    actionLockRef.current = true;
    try {
      const current = stateRef.current;
      if (!current.hook.trim()) {
        setError("Add your opening premise in the Premise box above before requesting choices.");
        return;
      }
      setState((s) => ({ ...s, isLoading: true, error: null, pendingChoices: [] }));

      const res = await fetch("/api/choices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: current.title,
          genre: current.genre,
          hook: current.hook,
          segments: current.segments,
          characters: current.characters,
          creativityPreference: current.creativityPreference,
          mode: "continue",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        handleApiError(data);
        return;
      }

      setState((s) => ({ ...s, pendingChoices: data.choices, isLoading: false }));
    } catch {
      setError("Network error — check your connection.");
    } finally {
      actionLockRef.current = false;
    }
  }, [handleApiError, setError]);

  const selectChoice = useCallback(
    async (choice: StoryChoice) => {
      if (actionLockRef.current) return;
      actionLockRef.current = true;
      try {
        cancelPendingEnrichment();
        const current = stateRef.current;
        if (!current.hook.trim()) {
          setError("Add your opening premise in the Premise box above before choosing a path.");
          return;
        }
      const snapshotChoices = current.pendingChoices;

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
          creativityPreference: current.creativityPreference,
          mode: "choice",
          choiceDescription: choice.description,
        }),
      });

      const fullText = await streamStoryResponse(segId, fetchPromise);
      if (!fullText) {
        setState((s) => {
          let segs = s.segments;
          const last = segs[segs.length - 1];
          if (last?.id === segId && last.role === "ai") {
            segs = segs.slice(0, -1);
          }
          if (segs.length > 0 && segs[segs.length - 1]?.role === "user") {
            segs = segs.slice(0, -1);
          }
          return {
            ...s,
            isLoading: false,
            segments: segs,
            pendingChoices: snapshotChoices,
          };
        });
        return;
      }

      setState((s) => ({ ...s, isLoading: false }));
      scheduleEnrichment(fullText);
      } finally {
        actionLockRef.current = false;
      }
    },
    [cancelPendingEnrichment, scheduleEnrichment, streamStoryResponse]
  );

  const concludeStory = useCallback(async () => {
    if (actionLockRef.current) return;
    actionLockRef.current = true;
    try {
      cancelPendingEnrichment();
      const current = stateRef.current;
      if (!current.hook.trim()) {
        setError("Add your opening premise in the Premise box above before concluding.");
        return;
      }
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
        creativityPreference: current.creativityPreference,
        mode: "conclude",
      }),
    });

    const fullText = await streamStoryResponse(segId, fetchPromise);
    if (!fullText) return;

    setState((s) => ({ ...s, isLoading: false, phase: "concluded" }));
    scheduleEnrichment(fullText);
    } finally {
      actionLockRef.current = false;
    }
  }, [cancelPendingEnrichment, scheduleEnrichment, streamStoryResponse]);

  const remixLastBeat = useCallback(
    async (targetGenre: Genre) => {
      if (actionLockRef.current) return;
      actionLockRef.current = true;
      try {
        cancelPendingEnrichment();
        const current = stateRef.current;
        if (!current.hook.trim()) {
          setError("Add your opening premise before remixing.");
          return;
        }
        if (targetGenre === current.genre) {
          setError("Pick a different genre than your story — that’s the remix.");
          return;
        }

        const segs = current.segments;
        let lastAi: StorySegment | undefined;
        for (let i = segs.length - 1; i >= 0; i--) {
          if (segs[i].role === "ai") {
            lastAi = segs[i];
            break;
          }
        }
        if (!lastAi) {
          setError("Nothing to remix yet — let the AI write a beat first.");
          return;
        }
        const previousText = lastAi.text;
        if (htmlToPlainText(previousText).trim().length < 16) {
          setError("The last AI beat is too short to remix.");
          return;
        }

        const segId = lastAi.id;
        const fetchPromise = fetch("/api/story", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: current.title,
            genre: current.genre,
            hook: current.hook,
            segments: current.segments,
            characters: current.characters,
            creativityPreference: current.creativityPreference,
            mode: "remix",
            remixTargetGenre: targetGenre,
          }),
        });

        setState((s) => ({
          ...s,
          isLoading: true,
          error: null,
          pendingChoices: [],
          segments: s.segments.map((seg) => (seg.id === segId ? { ...seg, text: "" } : seg)),
        }));

        const fullText = await streamStoryResponse(segId, fetchPromise);
        if (!fullText) {
          setState((s) => ({
            ...s,
            isLoading: false,
            segments: s.segments.map((seg) => (seg.id === segId ? { ...seg, text: previousText } : seg)),
          }));
          return;
        }

        setState((s) => ({ ...s, isLoading: false }));
        scheduleEnrichment(fullText);
      } finally {
        actionLockRef.current = false;
      }
    },
    [cancelPendingEnrichment, scheduleEnrichment, streamStoryResponse, setError]
  );

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
    setSavedStoryId(null);
    setState(DEFAULT_STATE);
  }, [cancelPendingEnrichment]);

  const openSavedStory = useCallback(
    async (id: string) => {
      cancelPendingEnrichment();
      try {
        const res = await fetch(`/api/stories/${id}`, { headers: storyPersistenceHeaders() });
        const data = (await res.json()) as Partial<StoryState> & { error?: string; id?: string };
        if (!res.ok) {
          setError(data.error === "NO_DATABASE" ? "Database not configured — add DATABASE_URL." : "Could not open that story.");
          return;
        }
        setSavedStoryId(id);
        setState({
          title: typeof data.title === "string" ? data.title : "",
          genre: coerceGenre(data.genre),
          hook: typeof data.hook === "string" ? data.hook : "",
          segments: Array.isArray(data.segments) ? data.segments : [],
          characters: Array.isArray(data.characters) ? data.characters : [],
          dna: data.dna ?? null,
          creativityPreference: (data.creativityPreference as CreativityPreference) ?? "balanced",
          phase: (data.phase as StoryState["phase"]) ?? "writing",
          pendingChoices: Array.isArray(data.pendingChoices) ? data.pendingChoices : [],
          isLoading: false,
          error: null,
        });
      } catch {
        setError("Could not open that story.");
      }
    },
    [cancelPendingEnrichment, setError]
  );

  const deleteSavedStory = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/stories/${id}`, {
          method: "DELETE",
          headers: storyPersistenceHeaders(),
        });
        if (!res.ok) return;
        if (savedStoryId === id) {
          cancelPendingEnrichment();
          setSavedStoryId(null);
          setState(DEFAULT_STATE);
        }
        void refreshLibrary();
      } catch {
        // ignore
      }
    },
    [savedStoryId, cancelPendingEnrichment, refreshLibrary]
  );

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  const setCreativityPreference = useCallback((creativityPreference: CreativityPreference) => {
    setState((s) => ({ ...s, creativityPreference }));
  }, []);

  const generateVisualPrompt = useCallback(async (): Promise<string | null> => {
    const s = stateRef.current;
    // Find the last AI segment
    let lastAiText = "";
    for (let i = s.segments.length - 1; i >= 0; i--) {
      if (s.segments[i].role === "ai") {
        lastAiText = s.segments[i].text;
        break;
      }
    }
    if (!lastAiText.trim()) return null;

    try {
      const res = await fetch("/api/visualize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: lastAiText,
          genre: s.genre,
          dna: s.dna,
          characters: s.characters,
        }),
      });
      const data = (await res.json()) as { prompt?: string; error?: string };
      if (data.prompt) return data.prompt;
      return null;
    } catch {
      return null;
    }
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
    clearError,
    setCreativityPreference,
    remixLastBeat,
    generateVisualPrompt,
    savedStoryList,
    libraryLoading,
    dbEnabled,
    savedStoryId,
    refreshLibrary,
    openSavedStory,
    deleteSavedStory,
  };
}
