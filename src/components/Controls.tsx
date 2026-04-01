"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { CreativityPreference, Genre, GenreTheme } from "@/types/story";
import { GENRE_EMOJIS } from "@/types/story";
import { preferenceRailPercent } from "@/lib/creativityTemperature";
import { CREATIVITY_OPTIONS } from "@/lib/creativityOptions";
import { fadeUp, staggerContainer } from "@/lib/motionVariants";

const STORY_GENRES: Genre[] = ["Fantasy", "Sci-Fi", "Mystery", "Romance", "Horror", "Comedy"];

interface ControlsProps {
  genre: Genre;
  theme: GenreTheme;
  creativityPreference: CreativityPreference;
  onCreativityChange: (preference: CreativityPreference) => void;
  segmentCount: number;
  canRemix: boolean;
  isLoading: boolean;
  onRemix: (targetGenre: Genre) => void;
  canUndo: boolean;
  onUndo: () => void;
  onExport: () => void;
  onReset: () => void;
  onReadingMode: () => void;
}

export default function Controls({
  genre,
  theme,
  creativityPreference,
  onCreativityChange,
  segmentCount,
  canRemix,
  isLoading,
  onRemix,
  canUndo,
  onUndo,
  onExport,
  onReset,
  onReadingMode,
}: ControlsProps) {
  const railPct = preferenceRailPercent(creativityPreference);
  const remixTargets = useMemo(() => STORY_GENRES.filter((g) => g !== genre), [genre]);
  const [remixGenre, setRemixGenre] = useState<Genre>(() => remixTargets[0] ?? genre);

  useEffect(() => {
    if (!remixTargets.includes(remixGenre)) {
      setRemixGenre(remixTargets[0] ?? genre);
    }
  }, [genre, remixGenre, remixTargets]);

  return (
    <motion.div
      className="space-y-4"
      variants={staggerContainer}
      initial={false}
      animate="show"
    >
      {/* Genre */}
      <motion.div
        variants={fadeUp}
        initial={false}
        className={`rounded-xl border ${theme.panelBorder} ${theme.panelBg} pl-3 pr-4 py-3 border-l-2 ${theme.accentBorder} ${theme.accentBg}`}
        whileHover={{ y: -1 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      >
        <p className={`text-xs uppercase tracking-widest font-semibold mb-2 ${theme.labelText}`}>Genre</p>
        <div className="flex items-center gap-2">
          <span className="text-2xl leading-none">{GENRE_EMOJIS[genre]}</span>
          <span className={`text-lg font-semibold ${theme.accentText}`}>{genre}</span>
        </div>
      </motion.div>

      {/* Creativity — same presets as setup; applies from the next AI call */}
      <motion.div
        variants={fadeUp}
        initial={false}
        className={`rounded-xl border ${theme.panelBorder} ${theme.panelBg} pl-3 pr-4 py-3 border-l-2 ${theme.accentBorder}`}
        whileHover={{ y: -1 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className={`text-xs uppercase tracking-widest font-semibold ${theme.labelText}`}>Creativity</p>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {CREATIVITY_OPTIONS.map((opt) => {
            const selected = creativityPreference === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onCreativityChange(opt.value)}
                title={opt.hint}
                className={`
                  touch-manipulation rounded-lg border px-2 py-1.5 text-left transition-colors text-[10px] leading-tight active:scale-[0.97]
                  ${selected
                    ? `${theme.accentBorder} ${theme.accentBg} ring-1 ring-white/10 font-bold`
                    : `${theme.panelBorder} ${theme.panelBg} opacity-85 hover:opacity-100 font-medium`
                  }
                `}
              >
                <span className={theme.accentText}>{opt.title}</span>
              </button>
            );
          })}
        </div>
        <div className="relative w-full h-5 flex items-center my-2">
          <div className={`relative w-full h-1.5 rounded-full ${theme.panelBg} border ${theme.divider}`}>
            <div
              className={`absolute inset-y-0 left-0 rounded-full ${theme.accentBg} opacity-90`}
              style={{ width: `${railPct}%` }}
              aria-hidden
            />
          </div>
          <div
            className={`pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 ${theme.accentBorder} bg-white shadow-md z-[1]`}
            style={{ left: `${railPct}%` }}
            aria-hidden
          />
        </div>
        <p className={`text-[9px] leading-snug ${theme.mutedText} opacity-90`}>
          Next AI turn uses this preset on the server (optional ± spread via env).
        </p>
      </motion.div>

      {/* Story stats */}
      <motion.div
        variants={fadeUp}
        initial={false}
        className={`rounded-xl border ${theme.panelBorder} ${theme.panelBg} pl-3 pr-4 py-3 border-l-2 ${theme.accentBorder} ${theme.accentBg}`}
        whileHover={{ y: -1 }}
      >
        <p className={`text-xs uppercase tracking-widest font-semibold mb-2 ${theme.labelText}`}>Story</p>
        <div className={`text-xs space-y-1 ${theme.storyText}`}>
          <div className="flex justify-between">
            <span>Segments</span>
            <span className="font-medium">{segmentCount}</span>
          </div>
        </div>
      </motion.div>

      {/* Genre remix — rewrites latest AI beat only; story canon genre unchanged */}
      <motion.div
        variants={fadeUp}
        initial={false}
        className={`rounded-xl border ${theme.panelBorder} ${theme.panelBg} pl-3 pr-4 py-3 border-l-2 ${theme.accentBorder}`}
        whileHover={{ y: -1 }}
      >
        <p className={`text-xs uppercase tracking-widest font-semibold mb-1.5 ${theme.labelText}`}>Genre remix</p>
        <p className={`text-[9px] leading-snug ${theme.mutedText} mb-2`}>
          Recast the <span className={`font-semibold ${theme.accentText}`}>latest AI paragraph</span> in another
          genre’s voice. Plot and facts stay the same.
        </p>
        <label htmlFor="remix-genre" className="sr-only">
          Target genre for remix
        </label>
        <select
          id="remix-genre"
          value={remixGenre}
          onChange={(e) => setRemixGenre(e.target.value as Genre)}
          disabled={!canRemix || isLoading}
          className={`
            w-full rounded-lg border px-2 py-1.5 text-xs mb-2
            ${theme.inputBorder} ${theme.inputBg} ${theme.storyText}
            disabled:opacity-45 disabled:cursor-not-allowed
          `}
        >
          {remixTargets.map((g) => (
            <option key={g} value={g}>
              {GENRE_EMOJIS[g]} {g}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onRemix(remixGenre)}
          disabled={!canRemix || isLoading}
          className={`
            touch-manipulation w-full py-2 rounded-xl border text-xs font-semibold transition-colors duration-200 enabled:active:scale-[0.98]
            ${canRemix && !isLoading
              ? `${theme.panelBorder} ${theme.inputBg} ${theme.storyText} hover:opacity-100 opacity-95`
              : "border-zinc-200 text-zinc-400 cursor-not-allowed opacity-60"
            }
          `}
        >
          Remix last beat
        </button>
      </motion.div>

      {/* Actions */}
      <motion.div variants={fadeUp} initial={false} className="space-y-2">
        <button
          type="button"
          onClick={onReadingMode}
          disabled={segmentCount === 0}
          className={`
            touch-manipulation w-full py-2.5 rounded-xl border text-sm font-medium transition-colors duration-200 enabled:active:scale-[0.98]
            ${segmentCount > 0
              ? `${theme.accentBorder} ${theme.accentBg} ${theme.storyText} hover:brightness-110`
              : "border-zinc-200 text-zinc-400 cursor-not-allowed"
            }
          `}
        >
          ⬤ Reading Mode
        </button>

        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className={`
            touch-manipulation w-full py-2.5 rounded-xl border text-sm font-medium transition-colors duration-200 enabled:active:scale-[0.98]
            ${canUndo
              ? `${theme.panelBorder} ${theme.inputBg} ${theme.storyText} opacity-95 hover:opacity-100`
              : "border-zinc-200 text-zinc-400 cursor-not-allowed"
            }
          `}
        >
          ↩ Undo Last AI Turn
        </button>

        <button
          type="button"
          onClick={onExport}
          disabled={segmentCount === 0}
          className={`
            touch-manipulation w-full py-2.5 rounded-xl border text-sm font-medium transition-colors duration-200 enabled:active:scale-[0.98]
            ${segmentCount > 0
              ? `${theme.panelBorder} ${theme.inputBg} ${theme.storyText} opacity-95 hover:opacity-100`
              : "border-zinc-200 text-zinc-400 cursor-not-allowed"
            }
          `}
        >
          ↓ Export Markdown
        </button>

        <button
          type="button"
          onClick={onReset}
          className="touch-manipulation w-full py-2.5 rounded-xl border border-zinc-300 text-zinc-600 text-sm font-medium hover:text-zinc-800 hover:border-zinc-400 transition-colors duration-200 active:scale-[0.98]"
        >
          ✕ New Story
        </button>
      </motion.div>
    </motion.div>
  );
}
