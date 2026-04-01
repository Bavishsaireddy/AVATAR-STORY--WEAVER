"use client";

import { useState } from "react";
import type { Character, GenreTheme } from "@/types/story";

interface CharacterTrackerProps {
  characters: Character[];
  theme: GenreTheme;
}

export default function CharacterTracker({ characters, theme }: CharacterTrackerProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={`rounded-xl border ${theme.panelBorder} ${theme.panelBg} overflow-hidden shadow-md shadow-zinc-200/40`}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`w-full flex items-center justify-between pl-3 pr-4 py-3 text-left ${theme.accentBg} border-b ${theme.divider} border-l-2 ${theme.accentBorder}`}
      >
        <span className={`text-xs font-semibold uppercase tracking-[0.15em] ${theme.labelText}`}>
          Characters {characters.length > 0 && `(${characters.length})`}
        </span>
        <span className={`${theme.mutedText} text-xs`}>{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-1">
          {characters.length === 0 ? (
            <p className={`${theme.storyText} opacity-80 text-xs leading-relaxed`}>
              Characters appear here as they&apos;re introduced.
            </p>
          ) : (
            <ul className="space-y-3">
              {characters.map((char, i) => (
                <li key={i} className={`border-t ${theme.divider} pt-3 first:border-0 first:pt-0`}>
                  <div className={`text-sm font-semibold ${theme.storyText} mb-0.5`}>
                    {char.name}
                  </div>
                  <div className={`${theme.storyText} opacity-85 text-xs leading-relaxed`}>
                    {char.description}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
