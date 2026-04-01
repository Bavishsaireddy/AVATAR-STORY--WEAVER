"use client";

import type { Genre, GenreTheme } from "@/types/story";
import GenreKeywordText from "./GenreKeywordText";

interface LiveSummaryProps {
  genre: Genre;
  summary: string;
  hasSummary: boolean;
  isAiWriting: boolean;
  theme: GenreTheme;
  /** Tighter scroll area on small screens */
  compact?: boolean;
}

export default function LiveSummary({
  genre,
  summary,
  hasSummary,
  isAiWriting,
  theme,
  compact,
}: LiveSummaryProps) {
  return (
    <div
      className={`rounded-xl border ${theme.panelBorder} ${theme.panelBg} overflow-hidden shadow-md shadow-zinc-200/40`}
    >
      <div
        className={`flex items-center justify-between gap-2 pl-3 pr-4 py-2.5 border-b ${theme.divider} ${theme.accentBg} border-l-2 ${theme.accentBorder}`}
      >
        <span
          className={`text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] ${theme.labelText}`}
        >
          Live summary
        </span>
        {isAiWriting ? (
          <span className={`text-[10px] font-medium ${theme.storyText} opacity-80`} aria-live="polite">
            After this beat…
          </span>
        ) : hasSummary ? (
          <span className={`text-[10px] font-medium ${theme.accentText} opacity-90`} title="Genre terms highlighted">
            {genre}
          </span>
        ) : null}
      </div>
      <div
        className={`px-4 py-3 ${compact ? "max-h-36" : "max-h-72"} overflow-y-auto`}
        style={{ scrollbarWidth: "thin" }}
      >
        {hasSummary ? (
          <GenreKeywordText
            as="p"
            text={summary.trim()}
            genre={genre}
            theme={theme}
            className={`m-0 text-xs sm:text-[13px] leading-relaxed text-justify ${theme.storyFont} ${theme.storyText} opacity-100`}
          />
        ) : (
          <p className={`text-xs leading-relaxed ${theme.storyText} opacity-80`}>
            Recap appears after the first AI reply and updates with each new segment (same pass as Story DNA).
          </p>
        )}
      </div>
    </div>
  );
}
