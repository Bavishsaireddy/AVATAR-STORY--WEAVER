"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CreativityPreference, Genre, SavedStoryListItem } from "@/types/story";
import { GENRE_EMOJIS } from "@/types/story";
import StoryLibrary from "@/components/StoryLibrary";
import { CREATIVITY_OPTIONS } from "@/lib/creativityOptions";
import { accentAlpha, SETUP_GENRES, SETUP_UI, type SetupPageTokens } from "@/lib/setupUiTokens";
import { springSnappy } from "@/lib/motionVariants";

const GENRE_DESCRIPTIONS: Record<Genre, string> = {
  Fantasy: "Magic, myth, and worlds beyond imagination",
  "Sci-Fi": "Technology, space, and the future of humanity",
  Mystery: "Secrets, clues, and the truth hidden in shadows",
  Romance: "Connection, longing, and the heart's deepest desires",
  Horror: "Fear, dread, and the darkness that follows",
  Comedy: "Wit, chaos, and the absurdity of existence",
};

const HOOK_PLACEHOLDERS: Record<Genre, string> = {
  Fantasy:
    "A young cartographer discovers a map to a city that has been erased from all records — and realizes someone is hunting anyone who has seen it...",
  "Sci-Fi":
    "The last generation ship in orbit receives a distress signal from a planet that, according to all records, was sterilized three centuries ago...",
  Mystery:
    "A renowned forger is found dead in a locked museum vault, surrounded by perfect copies of masterpieces — but the originals are gone...",
  Romance:
    "Two rival food critics are assigned to review the same tiny restaurant in Tuscany and discover they have been anonymously writing to each other for years...",
  Horror:
    "Every house on Elm Street has been sold three times in the past year. The realtor notices all the buyers have the same eyes...",
  Comedy:
    "A professional disaster-avoider is hired to prevent anything from going wrong at a billionaire's wedding — and promptly causes twelve new disasters...",
};

interface SetupScreenProps {
  onStart: (title: string, genre: Genre, hook: string, creativity: CreativityPreference) => void;
  isLoading: boolean;
  error: string | null;
  onClearError: () => void;
  savedStories: SavedStoryListItem[];
  libraryLoading: boolean;
  dbEnabled: boolean;
  savedStoryId: string | null;
  onOpenSavedStory: (id: string) => void;
  onDeleteSavedStory: (id: string) => void;
}

export default function SetupScreen({
  onStart,
  isLoading,
  error,
  onClearError,
  savedStories,
  libraryLoading,
  dbEnabled,
  savedStoryId,
  onOpenSavedStory,
  onDeleteSavedStory,
}: SetupScreenProps) {
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState<Genre>("Fantasy");
  const [hook, setHook] = useState("");
  const [creativityPreference, setCreativityPreference] = useState<CreativityPreference>("balanced");
  const [genreClassifyBusy, setGenreClassifyBusy] = useState(false);
  const [genreClassifyHint, setGenreClassifyHint] = useState<string | null>(null);
  const [hoverGenre, setHoverGenre] = useState<Genre | null>(null);

  const theme: SetupPageTokens = SETUP_UI[genre];
  const canStart = title.trim().length > 0 && hook.trim().length > 0 && !isLoading;
  const combinedSnippet = `${title.trim()}\n\n${hook.trim()}`.trim();
  const canSuggestGenre = combinedSnippet.length >= 12 && !genreClassifyBusy && !isLoading;

  const suggestGenreFromText = async () => {
    setGenreClassifyHint(null);
    setGenreClassifyBusy(true);
    try {
      const res = await fetch("/api/genre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), hook: hook.trim() }),
      });
      const data = (await res.json()) as {
        genre?: Genre;
        model?: string;
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        setGenreClassifyHint(data.message ?? "Could not classify genre.");
        return;
      }
      if (data.genre && SETUP_GENRES.includes(data.genre)) {
        setGenre(data.genre);
        const shortModel = data.model?.split("/").pop() ?? "DistilBERT";
        setGenreClassifyHint(`Selected ${data.genre} · ${shortModel}`);
      }
    } catch {
      setGenreClassifyHint("Network error — try again.");
    } finally {
      setGenreClassifyBusy(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canStart) onStart(title.trim(), genre, hook.trim(), creativityPreference);
  };

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center p-6 sm:p-10 transition-all duration-700"
      style={{
        background: `radial-gradient(ellipse at 30% 20%, ${theme.accentMuted}22 0%, transparent 60%), linear-gradient(135deg, ${theme.gradientFrom} 0%, ${theme.gradientTo} 100%)`,
        fontFamily: theme.fontBody,
        color: theme.text,
      }}
    >
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 70% 80%, ${theme.accent}11 0%, transparent 50%)`,
        }}
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-2xl pointer-events-auto">
        <motion.header
          className="text-center mb-10 sm:mb-12"
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={springSnappy}
        >
          <motion.div
            key={genre}
            initial={false}
            animate={{ scale: 1, opacity: 1 }}
            transition={springSnappy}
            className="text-4xl sm:text-5xl mb-4 select-none"
            aria-hidden
          >
            {GENRE_EMOJIS[genre]}
          </motion.div>
          <div
            className="text-[10px] sm:text-xs font-bold tracking-[0.35em] uppercase mb-3 transition-all duration-500"
            style={{ color: theme.accent, fontFamily: theme.fontDisplay }}
          >
            Story Weaver
          </div>
          <h1
            className="text-3xl sm:text-5xl mb-3 transition-all duration-500 font-semibold"
            style={{ fontFamily: theme.fontDisplay, color: theme.text, lineHeight: 1.12 }}
          >
            Begin Your Tale
          </h1>
          <p className="text-sm" style={{ color: theme.textMuted }}>
            Craft your world. We&apos;ll write it together.
          </p>
        </motion.header>

        <div className="w-full mb-6">
          <StoryLibrary
            variant="setup"
            tokens={theme}
            stories={savedStories}
            currentId={savedStoryId}
            loading={libraryLoading}
            disabled={!dbEnabled}
            disabledHint={
              !dbEnabled
                ? "Set DATABASE_URL and run Prisma migrations to save stories and show them here."
                : undefined
            }
            onSelect={onOpenSavedStory}
            onDelete={onDeleteSavedStory}
          />
        </div>

        <AnimatePresence mode="popLayout">
          {error ? (
            <motion.div
              key="setup-error"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={springSnappy}
              className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
            >
              <span className="text-red-600 text-lg shrink-0" aria-hidden>
                ⚠
              </span>
              <p className="flex-1 text-red-800 text-sm leading-relaxed">{error}</p>
              <button
                type="button"
                onClick={onClearError}
                className="touch-manipulation text-red-600 hover:text-red-800 text-sm shrink-0 rounded-md px-1 active:scale-95 transition-transform"
              >
                ✕
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Genre */}
          <div>
            <label
              className="block text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-3 font-semibold"
              style={{ color: theme.textMuted }}
            >
              Choose your genre
            </label>
            <div className="relative z-20 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
              {SETUP_GENRES.map((g) => {
                const t = SETUP_UI[g];
                const isSelected = g === genre;
                const isHover = hoverGenre === g && !isSelected;

                // Idle / hover use each genre’s own tokens so tiles never look “globally greyed out”
                // (previously all unselected tiles used the *selected* genre’s muted colors).
                let background = t.surface;
                let border = `1px solid ${t.border}`;
                let color = t.text;
                let boxShadow: string | undefined;

                if (isSelected) {
                  background = `linear-gradient(145deg, ${accentAlpha(t.accent, 0.28)} 0%, ${accentAlpha(t.accent, 0.07)} 55%, ${t.surface} 100%)`;
                  border = `2px solid ${t.accent}`;
                  color = t.text;
                  boxShadow = `0 0 0 1px ${accentAlpha(t.accent, 0.35)}, 0 10px 32px ${accentAlpha(t.accent, 0.22)}, inset 0 1px 0 ${accentAlpha(t.accent, 0.2)}`;
                } else if (isHover) {
                  background = accentAlpha(t.accent, 0.14);
                  border = `1px solid ${accentAlpha(t.accent, 0.65)}`;
                  color = t.text;
                  boxShadow = `0 6px 20px ${accentAlpha(t.accent, 0.18)}`;
                }

                return (
                  <button
                    key={g}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setGenre(g)}
                    onMouseEnter={() => setHoverGenre(g)}
                    onMouseLeave={() => setHoverGenre(null)}
                    className="relative touch-manipulation p-3 sm:p-3.5 pl-3.5 sm:pl-4 rounded-xl text-left overflow-hidden min-h-[3.25rem] sm:min-h-0 cursor-pointer select-none transition-[box-shadow,filter] duration-150 active:brightness-95 enabled:hover:brightness-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
                    style={{
                      background,
                      border,
                      color,
                      fontFamily: t.fontDisplay,
                      fontSize: "13px",
                      boxShadow,
                      transition:
                        "background 0.28s ease, border-color 0.28s ease, color 0.28s ease, box-shadow 0.28s ease, filter 0.15s ease",
                    }}
                  >
                    {isSelected ? (
                      <span
                        className="absolute left-0 top-2 bottom-2 w-1 rounded-full"
                        style={{
                          background: `linear-gradient(180deg, ${t.accent}, ${t.accentMuted})`,
                          boxShadow: `0 0 10px ${accentAlpha(t.accent, 0.9)}`,
                        }}
                        aria-hidden
                      />
                    ) : null}
                    <span className="font-bold block relative z-[1] flex items-center gap-2">
                      <span className="text-base opacity-90" aria-hidden>
                        {GENRE_EMOJIS[g]}
                      </span>
                      {t.label}
                    </span>
                    {isSelected ? (
                      <span
                        className="text-[10px] mt-1.5 block leading-snug relative z-[1] transition-all duration-300"
                        style={{
                          color: accentAlpha(t.accent, 0.92),
                          fontFamily: t.fontBody,
                          textShadow: `0 0 24px ${accentAlpha(t.accent, 0.35)}`,
                        }}
                      >
                        {GENRE_DESCRIPTIONS[g]}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={suggestGenreFromText}
                disabled={!canSuggestGenre}
                className="touch-manipulation text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider rounded-lg border px-2.5 py-1.5 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  borderColor: theme.border,
                  color: theme.accent,
                  background: theme.surface,
                }}
              >
                {genreClassifyBusy ? "Classifying…" : "Suggest genre (DistilBERT)"}
              </button>
              {genreClassifyHint ? (
                <span className="text-[10px] sm:text-[11px]" style={{ color: theme.textMuted }}>
                  {genreClassifyHint}
                </span>
              ) : null}
            </div>
          </div>

          {/* Narrative style */}
          <div>
            <label
              className="block text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-2 font-semibold"
              style={{ color: theme.textMuted }}
            >
              Narrative style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CREATIVITY_OPTIONS.map((opt) => {
                const selected = creativityPreference === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCreativityPreference(opt.value)}
                    className="touch-manipulation rounded-xl border px-3 py-2 text-left transition-colors hover:brightness-[1.02] active:scale-[0.98]"
                    style={{
                      background: selected ? `${theme.accent}18` : theme.surface,
                      borderColor: selected ? theme.accent : theme.border,
                      color: selected ? theme.text : theme.textMuted,
                    }}
                    title={opt.hint}
                  >
                    <span className="text-xs font-bold" style={{ color: selected ? theme.accent : theme.text }}>
                      {opt.title}
                    </span>
                    <span className="text-[9px] mt-1 block leading-snug opacity-80">{opt.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label
              className="block text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-2 font-semibold"
              style={{ color: theme.textMuted }}
            >
              Story title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The name your story will carry…"
              maxLength={100}
              className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-300"
              style={{
                background: theme.surface,
                border: `1px solid ${title.trim() ? theme.accent : theme.border}`,
                color: theme.text,
                fontFamily: theme.fontDisplay,
                fontSize: "17px",
              }}
            />
          </div>

          {/* Hook */}
          <div>
            <label
              className="block text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-2 font-semibold"
              style={{ color: theme.textMuted }}
            >
              Opening hook &amp; setting
            </label>
            <textarea
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              placeholder={HOOK_PLACEHOLDERS[genre]}
              rows={5}
              className="w-full px-4 py-3 rounded-xl outline-none resize-y min-h-[140px] transition-all duration-300"
              style={{
                background: theme.surface,
                border: `1px solid ${hook.trim() ? theme.accent : theme.border}`,
                color: theme.text,
                fontFamily: theme.fontBody,
                fontSize: "15px",
                lineHeight: 1.7,
              }}
            />
            <p className="text-xs mt-2" style={{ color: theme.textMuted }}>
              Set the scene and a hook — the AI continues in this genre. You can change creativity above anytime in the sidebar later.
            </p>
          </div>

          <button
            type="submit"
            disabled={!canStart}
            className="touch-manipulation w-full py-4 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 relative overflow-hidden enabled:hover:brightness-105 enabled:active:scale-[0.99] disabled:cursor-not-allowed"
            style={{
              background: !canStart ? theme.border : `linear-gradient(135deg, ${theme.accent}, ${theme.accentMuted})`,
              color: !canStart ? theme.textMuted : theme.bg,
              fontFamily: theme.fontDisplay,
              letterSpacing: "0.08em",
              opacity: !canStart ? 0.65 : 1,
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-3">
                <span
                  className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-90"
                  aria-hidden
                />
                Weaving the opening…
              </span>
            ) : (
              "Begin the story →"
            )}
          </button>
        </form>

        <p
          className="text-center text-[10px] uppercase tracking-[0.28em] mt-10 opacity-35"
          style={{ color: theme.textMuted }}
        >
          Keys stay on the server · you steer every beat
        </p>
      </div>
    </div>
  );
}
