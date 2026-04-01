"use client";

import { useState } from "react";
import type { StoryDNA as StoryDNAType, GenreTheme } from "@/types/story";

interface StoryDNAProps {
  dna: StoryDNAType | null;
  theme: GenreTheme;
}

function TensionBar({ level, theme }: { level: number; theme: GenreTheme }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className={`text-xs ${theme.storyText} opacity-80`}>Tension</span>
        <span className={`text-xs font-semibold ${theme.storyText}`}>{level}/10</span>
      </div>
      <div className={`h-1.5 rounded-full ${theme.panelBg} overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${theme.accentBg} border ${theme.accentBorder}`}
          style={{ width: `${level * 10}%`, filter: `brightness(${0.8 + level * 0.05})` }}
        />
      </div>
    </div>
  );
}

export default function StoryDNA({ dna, theme }: StoryDNAProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={`rounded-xl border ${theme.panelBorder} ${theme.panelBg} overflow-hidden shadow-md shadow-zinc-200/40`}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`w-full flex items-center justify-between pl-3 pr-4 py-3 text-left ${theme.accentBg} border-b ${theme.divider} border-l-2 ${theme.accentBorder}`}
      >
        <span className={`text-xs font-semibold uppercase tracking-[0.15em] ${theme.labelText}`}>
          Story DNA
        </span>
        <span className={`${theme.mutedText} text-xs`}>{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-1 space-y-4">
          {!dna ? (
            <p className={`${theme.storyText} opacity-80 text-xs leading-relaxed`}>
              Structure and tension update after the first AI turn.
            </p>
          ) : (
            <>
              {/* Tension meter */}
              <TensionBar level={dna.tensionLevel} theme={theme} />

              {dna.tensionDescription && (
                <p className={`text-xs ${theme.storyText} opacity-90 italic leading-relaxed`}>
                  {dna.tensionDescription}
                </p>
              )}

              {/* Open Mysteries */}
              {dna.mysteries.length > 0 && (
                <div>
                  <p className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${theme.storyText} opacity-75`}>
                    Open mysteries
                  </p>
                  <ul className="space-y-1.5">
                    {dna.mysteries.map((m, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className={`${theme.storyText} opacity-60 text-xs mt-0.5 shrink-0`}>?</span>
                        <span className={`text-xs ${theme.storyText} opacity-90 leading-relaxed`}>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* World Rules */}
              {dna.worldRules.length > 0 && (
                <div className={`border-t ${theme.divider} pt-3`}>
                  <p className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${theme.storyText} opacity-75`}>
                    World rules
                  </p>
                  <ul className="space-y-1.5">
                    {dna.worldRules.map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className={`${theme.storyText} opacity-60 text-xs mt-0.5 shrink-0`}>⬡</span>
                        <span className={`text-xs ${theme.storyText} opacity-90 leading-relaxed`}>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
