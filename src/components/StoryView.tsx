"use client";

import { useEffect, useRef, useState } from "react";
import type { StoryState, StoryChoice } from "@/types/story";
import { GENRE_THEMES, GENRE_EMOJIS } from "@/types/story";
import StorySegment from "./StorySegment";
import ChoiceCards from "./ChoiceCards";
import ActionBar from "./ActionBar";
import Controls from "./Controls";
import CharacterTracker from "./CharacterTracker";
import StoryDNA from "./StoryDNA";
import ReadingMode from "./ReadingMode";
import ErrorBanner from "./ErrorBanner";

interface StoryViewProps {
  state: StoryState;
  onContinue: (userInput?: string) => void;
  onGetChoices: () => void;
  onSelectChoice: (choice: StoryChoice) => void;
  onDismissChoices: () => void;
  onConclude: () => void;
  onUndo: () => void;
  onExport: () => void;
  onReset: () => void;
  onTemperatureChange: (val: number) => void;
  onClearError: () => void;
}

export default function StoryView({
  state,
  onContinue,
  onGetChoices,
  onSelectChoice,
  onDismissChoices,
  onConclude,
  onUndo,
  onExport,
  onReset,
  onTemperatureChange,
  onClearError,
}: StoryViewProps) {
  const theme = GENRE_THEMES[state.genre];
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isReadingMode, setIsReadingMode] = useState(false);

  const aiSegmentCount = state.segments.filter((s) => s.role === "ai").length;
  const canUndo = aiSegmentCount > 0 && !state.isLoading;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [state.segments.length, state.isLoading]);

  return (
    <>
      {isReadingMode && (
        <ReadingMode
          title={state.title}
          segments={state.segments}
          theme={theme}
          onClose={() => setIsReadingMode(false)}
        />
      )}

      <div className={`min-h-screen ${theme.pageBg} flex flex-col transition-colors duration-700`}>
        <div
          className="fixed inset-0 pointer-events-none transition-all duration-700"
          style={{ background: theme.glowStyle }}
        />

        {/* Header */}
        <header className={`sticky top-0 z-20 ${theme.headerBg} backdrop-blur border-b ${theme.divider} px-4 sm:px-6 py-3`}>
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xl shrink-0">{GENRE_EMOJIS[state.genre]}</span>
              <div className="min-w-0">
                <h1 className={`font-bold text-base sm:text-lg truncate leading-tight ${theme.storyText}`}>
                  {state.title}
                </h1>
                <p className={`text-xs ${theme.accentText} opacity-40`}>
                  {state.genre} · {state.segments.length} segments
                </p>
              </div>
            </div>
            <div className={`text-xs ${theme.accentText} opacity-30 hidden sm:block`}>
              Story Weaver
            </div>
          </div>
        </header>

        {/* Main layout */}
        <div className="relative flex-1 max-w-6xl mx-auto w-full flex gap-6 px-4 sm:px-6 py-6">

          {/* Story column */}
          <div className="flex-1 flex flex-col min-w-0">

            {state.error && (
              <div className="mb-4">
                <ErrorBanner error={state.error} onDismiss={onClearError} />
              </div>
            )}

            <div
              className={`flex-1 ${theme.panelBg} rounded-2xl border ${theme.panelBorder} p-6 sm:p-10 mb-4 overflow-y-auto`}
              style={{ maxHeight: "calc(100vh - 280px)" }}
            >
              {state.segments.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className={`${theme.accentText} opacity-20 text-center`}>Your story begins here...</p>
                </div>
              ) : (
                <>
                  {state.segments.map((seg, idx) => (
                    <StorySegment
                      key={seg.id}
                      segment={seg}
                      theme={theme}
                      isLast={idx === state.segments.length - 1}
                      isStreaming={state.isLoading && idx === state.segments.length - 1}
                    />
                  ))}

                  {state.phase === "concluded" && !state.isLoading && (
                    <div className="mt-10 mb-4 flex flex-col items-center gap-3">
                      <div className={`w-24 h-px border-t ${theme.accentBorder}`} />
                      <p className={`text-sm font-bold uppercase tracking-[0.3em] ${theme.accentText} opacity-60`}>
                        The End
                      </p>
                      <div className={`w-24 h-px border-t ${theme.accentBorder}`} />
                      <p className={`text-xs ${theme.accentText} opacity-30 mt-2`}>
                        Export your story or start a new one
                      </p>
                    </div>
                  )}

                  <div ref={bottomRef} />
                </>
              )}
            </div>

            {state.pendingChoices.length > 0 && (
              <div className="mb-4">
                <ChoiceCards
                  choices={state.pendingChoices}
                  theme={theme}
                  onSelect={onSelectChoice}
                  onDismiss={onDismissChoices}
                />
              </div>
            )}

            <div className={`rounded-2xl border ${theme.panelBorder} ${theme.panelBg} overflow-hidden`}>
              <ActionBar
                theme={theme}
                isLoading={state.isLoading}
                hasPendingChoices={state.pendingChoices.length > 0}
                isConcluded={state.phase === "concluded"}
                onContinue={onContinue}
                onGetChoices={onGetChoices}
                onConclude={onConclude}
              />
            </div>
          </div>

          {/* Right sidebar */}
          <aside className="hidden lg:flex flex-col gap-4 w-64 shrink-0">
            <Controls
              genre={state.genre}
              theme={theme}
              temperature={state.temperature}
              segmentCount={state.segments.length}
              canUndo={canUndo}
              onTemperatureChange={onTemperatureChange}
              onUndo={onUndo}
              onExport={onExport}
              onReset={onReset}
              onReadingMode={() => setIsReadingMode(true)}
            />
            <CharacterTracker characters={state.characters} theme={theme} />
            <StoryDNA dna={state.dna} theme={theme} />
          </aside>
        </div>

        {/* Mobile bottom controls */}
        <div className={`lg:hidden border-t ${theme.divider} px-4 py-3 ${theme.pageBg} flex gap-2 flex-wrap`}>
          <button
            onClick={() => setIsReadingMode(true)}
            disabled={state.segments.length === 0}
            className={`text-xs px-3 py-1.5 rounded-lg border ${theme.accentBorder} ${theme.accentText} ${theme.accentBg} transition disabled:opacity-30`}
          >
            ⬤ Read
          </button>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`text-xs px-3 py-1.5 rounded-lg border ${theme.panelBorder} ${theme.storyText} transition disabled:opacity-30`}
          >
            ↩ Undo
          </button>
          <button
            onClick={onExport}
            disabled={state.segments.length === 0}
            className={`text-xs px-3 py-1.5 rounded-lg border ${theme.panelBorder} ${theme.storyText} transition disabled:opacity-30`}
          >
            ↓ Export
          </button>
          <button
            onClick={onReset}
            className={`text-xs px-3 py-1.5 rounded-lg border border-slate-900 text-slate-700 transition`}
          >
            ✕ New
          </button>
        </div>
      </div>
    </>
  );
}
