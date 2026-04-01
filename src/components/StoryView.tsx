"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type {
  StoryState,
  StoryChoice,
  CreativityPreference,
  Genre,
  SavedStoryListItem,
} from "@/types/story";
import { GENRE_THEMES, GENRE_EMOJIS, coerceGenre } from "@/types/story";
import { htmlToPlainText } from "@/lib/htmlToPlainText";
import StorySegment from "./StorySegment";
import ChoiceCards from "./ChoiceCards";
import ActionBar from "./ActionBar";
import Controls from "./Controls";
import CharacterTracker from "./CharacterTracker";
import StoryDNA from "./StoryDNA";
import LiveSummary from "./LiveSummary";
import ReadingMode from "./ReadingMode";
import ErrorBanner from "./ErrorBanner";
import StoryLibrary from "./StoryLibrary";
import { fadeUp, springSnappy, staggerContainer } from "@/lib/motionVariants";

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
  onClearError: () => void;
  onCreativityChange: (preference: CreativityPreference) => void;
  onRemix: (targetGenre: Genre) => void;
  onVisualize: () => Promise<string | null>;
  savedStories: SavedStoryListItem[];
  libraryLoading: boolean;
  dbEnabled: boolean;
  savedStoryId: string | null;
  onOpenSavedStory: (id: string) => void;
  onDeleteSavedStory: (id: string) => void;
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
  onClearError,
  onCreativityChange,
  onRemix,
  onVisualize,
  savedStories,
  libraryLoading,
  dbEnabled,
  savedStoryId,
  onOpenSavedStory,
  onDeleteSavedStory,
}: StoryViewProps) {
  const genre = coerceGenre(state.genre);
  const theme = GENRE_THEMES[genre];
  const storyScrollRef = useRef<HTMLDivElement>(null);
  const [isReadingMode, setIsReadingMode] = useState(false);

  const aiSegmentCount = state.segments.filter((s) => s.role === "ai").length;
  const canUndo = aiSegmentCount > 0 && !state.isLoading;

  let canRemix = false;
  for (let i = state.segments.length - 1; i >= 0; i--) {
    if (state.segments[i].role === "ai") {
      canRemix = htmlToPlainText(state.segments[i].text).trim().length >= 16;
      break;
    }
  }

  const lastSeg = state.segments[state.segments.length - 1];
  const lastSegTextLen = lastSeg?.text?.length ?? 0;

  /** New beat or loading state: follow the story in the scroll pane only (not the whole page). */
  useEffect(() => {
    const el = storyScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [state.segments.length, state.isLoading]);

  /** While streaming, gently follow only if the reader is already near the bottom — avoids snap/jump fights. */
  useEffect(() => {
    if (!state.isLoading) return;
    const el = storyScrollRef.current;
    if (!el) return;
    const slack = 160;
    const distFromBottom = el.scrollHeight - el.clientHeight - el.scrollTop;
    if (distFromBottom <= slack) {
      el.scrollTop = el.scrollHeight;
    }
  }, [state.isLoading, lastSegTextLen]);

  return (
    <>
      {isReadingMode && (
        <ReadingMode
          title={state.title}
          genre={genre}
          hook={state.hook}
          segments={state.segments}
          theme={theme}
          onClose={() => setIsReadingMode(false)}
        />
      )}

      <div className={`relative min-h-screen ${theme.pageBg} flex flex-col transition-colors duration-700`}>
        <div
          className="absolute inset-0 z-0 pointer-events-none transition-all duration-700"
          style={{ background: theme.glowStyle }}
        />

        {/* Header — title-centric */}
        <header
          className={`sticky top-0 z-30 ${theme.headerBg} backdrop-blur-md border-b ${theme.divider} shadow-sm shadow-zinc-200/60`}
        >
          <div className="relative w-full max-w-none mx-auto px-4 sm:px-6 md:px-10 lg:px-14 py-4 sm:py-6 text-center">
            <motion.div
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className={`absolute top-3 right-4 sm:top-4 sm:right-6 text-[9px] uppercase tracking-[0.3em] ${theme.accentText} opacity-30 hidden sm:block`}
            >
              <span className="block">Story</span>
              <span className="font-serif italic normal-case tracking-normal">Weaver</span>
            </motion.div>
            <motion.div
              key={genre}
              initial={false}
              animate={{ scale: 1, rotate: 0 }}
              transition={springSnappy}
              className="text-3xl sm:text-4xl mb-2 drop-shadow-lg select-none inline-block"
              aria-hidden
            >
              {GENRE_EMOJIS[genre]}
            </motion.div>
            <motion.h1
              className={`text-xl sm:text-2xl md:text-3xl font-bold leading-tight px-2 ${theme.storyText}`}
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.06)" }}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springSnappy, delay: 0.05 }}
            >
              {state.title}
            </motion.h1>
            <motion.div
              className="mt-3 flex flex-wrap items-center justify-center gap-2"
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.span
                layout
                className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${theme.accentBorder} ${theme.accentText} bg-zinc-100`}
                whileHover={{ scale: 1.04 }}
              >
                {genre}
              </motion.span>
              <span className={`text-[11px] ${theme.accentText} opacity-45`}>
                {state.segments.length} beats
              </span>
            </motion.div>
          </div>
        </header>

        {/* Opening premise — compact read-only strip (canon for every AI call) */}
        <div className="relative z-10 w-full max-w-none mx-auto px-4 sm:px-6 md:px-10 lg:px-14 -mt-1 mb-3 md:mb-4">
          <motion.div
            variants={fadeUp}
            initial={false}
            animate="show"
            className={`rounded-lg border ${theme.panelBorder} ${theme.panelBg} px-2.5 py-2 sm:px-3 sm:py-2 shadow-md shadow-zinc-200/50`}
            role="region"
            aria-label="Opening premise, locked for this story"
            title="Fixed for this run. New Story to change it."
            whileHover={{ scale: 1.008 }}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${theme.labelText}`}>
                Premise
              </span>
              <span className={`text-[9px] uppercase tracking-wider ${theme.mutedText}`}>Locked</span>
            </div>
            <div
              className={`
                max-h-[3.25rem] sm:max-h-[4rem] overflow-y-auto overscroll-contain pr-0.5
                text-xs sm:text-[13px] leading-snug text-justify ${theme.storyFont} ${theme.storyText}
                opacity-95
              `}
              style={{ scrollbarWidth: "thin" }}
            >
              {state.hook}
            </div>
          </motion.div>
        </div>

        {/* Main layout: full-width row from md+ (768px); narrow screens stack */}
        <div className="relative z-10 flex-1 w-full max-w-none mx-auto flex flex-col md:flex-row items-stretch gap-4 md:gap-5 lg:gap-6 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pb-6">

          {/* Left: genre / creativity / actions only */}
          <motion.aside
            className="order-2 md:order-1 flex flex-col gap-4 w-full md:w-52 lg:w-56 xl:w-60 shrink-0 md:shrink-0 self-stretch"
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springSnappy, delay: 0.04 }}
          >
            <StoryLibrary
              variant="story"
              theme={theme}
              stories={savedStories}
              currentId={savedStoryId}
              loading={libraryLoading}
              disabled={!dbEnabled}
              disabledHint={
                !dbEnabled
                  ? "Set DATABASE_URL to sync stories to PostgreSQL."
                  : undefined
              }
              onSelect={onOpenSavedStory}
              onDelete={onDeleteSavedStory}
            />
            <Controls
              genre={genre}
              theme={theme}
              creativityPreference={state.creativityPreference}
              onCreativityChange={onCreativityChange}
              segmentCount={state.segments.length}
              canRemix={canRemix}
              isLoading={state.isLoading}
              onRemix={onRemix}
              canUndo={canUndo}
              onUndo={onUndo}
              onExport={onExport}
              onReset={onReset}
              onReadingMode={() => setIsReadingMode(true)}
            />
          </motion.aside>

          {/* Center: story — grows to fill remaining width */}
          <div className="order-1 md:order-2 flex-1 flex flex-col min-w-0 w-full md:min-w-0">

            <AnimatePresence mode="popLayout">
              {state.error ? (
                <ErrorBanner
                  key="story-error"
                  error={state.error}
                  onDismiss={onClearError}
                  className="mb-4"
                />
              ) : null}
            </AnimatePresence>

            <motion.div
              ref={storyScrollRef}
              className={`
                flex-1 ${theme.panelBg} rounded-2xl border ${theme.panelBorder} p-6 sm:p-8 md:p-10 mb-4 overflow-y-auto overflow-x-hidden
                max-h-[min(70vh,32rem)] md:max-h-[calc(100vh-220px)] md:min-h-[280px]
                shadow-xl shadow-zinc-200/50
              `}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={springSnappy}
            >
              {state.segments.length === 0 ? (
                <div className="flex items-center justify-center h-full min-h-[12rem]">
                  <motion.p
                    className={`${theme.accentText} text-center text-sm sm:text-base max-w-xs`}
                    initial={false}
                    animate={{ opacity: [0.2, 0.45, 0.2] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                  >
                    Your story begins here… Add a beat below or hit Continue AI.
                  </motion.p>
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

                  <AnimatePresence>
                    {state.phase === "concluded" && !state.isLoading && (
                      <motion.div
                        key="the-end"
                        initial={false}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={springSnappy}
                        className="mt-10 mb-4 flex flex-col items-center gap-3"
                      >
                        <div className={`w-24 h-px border-t ${theme.accentBorder}`} />
                        <p className={`text-sm font-bold uppercase tracking-[0.3em] ${theme.accentText} opacity-60`}>
                          The End
                        </p>
                        <div className={`w-24 h-px border-t ${theme.accentBorder}`} />
                        <p className={`text-xs ${theme.accentText} opacity-30 mt-2`}>
                          Export your story or start a new one
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </>
              )}
            </motion.div>

            <AnimatePresence mode="wait">
              {state.pendingChoices.length > 0 ? (
                <motion.div
                  key="choices-panel"
                  className="mb-4"
                  initial={false}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={springSnappy}
                >
                  <ChoiceCards
                    choices={state.pendingChoices}
                genre={genre}
                theme={theme}
                onSelect={onSelectChoice}
                    onDismiss={onDismissChoices}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>

            <motion.div
              layout
              className={`rounded-2xl border ${theme.panelBorder} ${theme.panelBg} overflow-hidden shadow-lg shadow-zinc-200/45`}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springSnappy, delay: 0.06 }}
            >
              <ActionBar
                theme={theme}
                isLoading={state.isLoading}
                hasPendingChoices={state.pendingChoices.length > 0}
                isConcluded={state.phase === "concluded"}
                onContinue={onContinue}
                onGetChoices={onGetChoices}
                onConclude={onConclude}
                onVisualize={onVisualize}
              />
            </motion.div>
          </div>

          {/* Right: live summary, characters, story DNA */}
          <motion.aside
            className="order-3 md:order-3 flex flex-col gap-4 w-full md:w-56 lg:w-64 xl:w-72 shrink-0 md:shrink-0 self-stretch"
            variants={staggerContainer}
            initial={false}
            animate="show"
          >
            <motion.div variants={fadeUp} initial={false} className="w-full">
              <LiveSummary
                    genre={genre}
                    summary={state.dna?.runningSummary ?? ""}
                hasSummary={Boolean(state.dna?.runningSummary?.trim())}
                isAiWriting={state.isLoading}
                theme={theme}
              />
            </motion.div>
            <motion.div variants={fadeUp} initial={false} className="w-full">
              <CharacterTracker characters={state.characters} theme={theme} />
            </motion.div>
            <motion.div variants={fadeUp} initial={false} className="w-full">
              <StoryDNA dna={state.dna} theme={theme} />
            </motion.div>
          </motion.aside>
        </div>
      </div>
    </>
  );
}
