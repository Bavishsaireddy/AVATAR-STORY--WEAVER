"use client";

import { splitByGenreHighlights } from "@/lib/genreHighlightTerms";
import type { Genre, GenreTheme } from "@/types/story";

interface GenreKeywordTextProps {
  text: string;
  genre: Genre;
  theme: GenreTheme;
  /** Slightly stronger chips (e.g. choice titles). */
  strong?: boolean;
  /** Wrapper element for block prose. */
  as?: "span" | "p";
  className?: string;
}

export default function GenreKeywordText({
  text,
  genre,
  theme,
  strong,
  as = "span",
  className,
}: GenreKeywordTextProps) {
  const parts = splitByGenreHighlights(text, genre);
  const ring = strong
    ? "ring-2 ring-white/50 ring-offset-2 ring-offset-zinc-950 shadow-md"
    : "ring-1 ring-white/35 ring-offset-1 ring-offset-zinc-950";
  const hitClass = `${theme.keywordHighlight} ${ring} [text-decoration:none]`;

  const inner = (
    <>
      {parts.map((p, i) =>
        p.hit ? (
          <mark key={i} className={`${hitClass} [text-decoration:none]`}>
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </>
  );

  if (as === "p") {
    return <p className={className}>{inner}</p>;
  }
  return <span className={className}>{inner}</span>;
}
