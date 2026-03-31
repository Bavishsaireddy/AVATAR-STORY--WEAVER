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
        <span className={`text-xs ${theme.accentText} opacity-50`}>Tension</span>
        <span className={`text-xs font-bold ${theme.accentText}`}>{level}/10</span>
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
    <div className={`rounded-xl border ${theme.panelBorder} ${theme.panelBg} overflow-hidden`}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className={`text-xs font-bold uppercase tracking-widest ${theme.accentText} opacity-70`}>
          Story DNA
        </span>
        <span className={`${theme.accentText} opacity-40 text-xs`}>{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-4">
          {!dna ? (
            <p className={`${theme.accentText} opacity-30 text-xs italic`}>
              Story structure will be analyzed after the first AI turn.
            </p>
          ) : (
            <>
              {/* Tension meter */}
              <TensionBar level={dna.tensionLevel} theme={theme} />

              {dna.tensionDescription && (
                <p className={`text-xs ${theme.storyText} opacity-50 italic leading-relaxed`}>
                  {dna.tensionDescription}
                </p>
              )}

              {/* Open Mysteries */}
              {dna.mysteries.length > 0 && (
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${theme.accentText} opacity-50`}>
                    Open Mysteries
                  </p>
                  <ul className="space-y-1.5">
                    {dna.mysteries.map((m, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className={`${theme.accentText} opacity-40 text-xs mt-0.5 shrink-0`}>?</span>
                        <span className={`text-xs ${theme.storyText} opacity-50 leading-relaxed`}>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* World Rules */}
              {dna.worldRules.length > 0 && (
                <div className={`border-t ${theme.divider} pt-3`}>
                  <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${theme.accentText} opacity-50`}>
                    World Rules
                  </p>
                  <ul className="space-y-1.5">
                    {dna.worldRules.map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className={`${theme.accentText} opacity-40 text-xs mt-0.5 shrink-0`}>⬡</span>
                        <span className={`text-xs ${theme.storyText} opacity-50 leading-relaxed`}>{r}</span>
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
