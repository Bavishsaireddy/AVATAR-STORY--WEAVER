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
    <div className={`rounded-xl border ${theme.accentBorder} ${theme.accentBg} overflow-hidden`}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className={`text-xs font-bold uppercase tracking-widest ${theme.accentText}`}>
          Characters {characters.length > 0 && `(${characters.length})`}
        </span>
        <span className={`${theme.accentText} opacity-40 text-xs`}>{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="px-4 pb-4">
          {characters.length === 0 ? (
            <p className={`${theme.accentText} opacity-30 text-xs italic`}>
              Characters appear here as they&apos;re introduced.
            </p>
          ) : (
            <ul className="space-y-3">
              {characters.map((char, i) => (
                <li key={i} className={`border-t ${theme.divider} pt-3 first:border-0 first:pt-0`}>
                  <div className={`text-sm font-semibold ${theme.accentText} mb-0.5`}>
                    {char.name}
                  </div>
                  <div className={`${theme.storyText} opacity-50 text-xs leading-relaxed`}>
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
