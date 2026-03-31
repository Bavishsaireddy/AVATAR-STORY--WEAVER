"use client";

import { useState } from "react";
import type { Genre } from "@/types/story";
import { GENRE_EMOJIS, GENRE_THEMES } from "@/types/story";

const GENRES: Genre[] = ["Fantasy", "Sci-Fi", "Mystery", "Romance", "Horror", "Comedy"];

const GENRE_DESCRIPTIONS: Record<Genre, string> = {
  Fantasy:  "Magic, myth & epic worlds",
  "Sci-Fi": "Future, space & technology",
  Mystery:  "Clues, secrets & suspense",
  Romance:  "Love, longing & connection",
  Horror:   "Dread, fear & the unknown",
  Comedy:   "Wit, chaos & laughter",
};

const HOOK_PLACEHOLDERS: Record<Genre, string> = {
  Fantasy: "Deep in the Whispering Forest, where the trees remember the names of gods long forgotten, a young cartographer discovers a map that should not exist...",
  "Sci-Fi": "The colony ship Odyssey had been drifting for 200 years when the distress beacon from the long-dead planet finally reached them...",
  Mystery: "The locked room on the 13th floor hadn't been opened in forty years — until the morning they found a fresh set of footprints leading nowhere...",
  Romance: "After years of anonymous letters exchanged through a crumbling postal box, they finally agreed to meet at the fountain in Marseille at noon...",
  Horror: "Everyone in Millhaven knew not to walk past the Creedmore house after dark — but nobody could explain why those who did never quite came back the same...",
  Comedy: "The world's most overqualified barista had exactly three weeks to convince a food critic, a dragon, and her ex-boyfriend that her new café deserved a Michelin star...",
};

interface SetupScreenProps {
  onStart: (title: string, genre: Genre, hook: string) => void;
  isLoading: boolean;
  error: string | null;
  onClearError: () => void;
}

export default function SetupScreen({ onStart, isLoading, error, onClearError }: SetupScreenProps) {
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState<Genre>("Fantasy");
  const [hook, setHook] = useState("");

  const theme = GENRE_THEMES[genre];
  const canStart = title.trim().length > 0 && hook.trim().length > 0 && !isLoading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canStart) onStart(title.trim(), genre, hook.trim());
  };

  return (
    <div className={`min-h-screen ${theme.pageBg} flex flex-col items-center justify-center px-4 py-12 transition-colors duration-700`}>
      {/* Genre-specific background glow */}
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-700"
        style={{ background: theme.glowStyle }}
      />

      <div className="relative w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4 transition-all duration-300">{GENRE_EMOJIS[genre]}</div>
          <h1 className={`text-4xl font-bold tracking-tight mb-2 ${theme.storyText}`}>
            Story Weaver
          </h1>
          <p className={`text-lg ${theme.accentText} opacity-70`}>
            AI-powered collaborative storytelling
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 flex items-start gap-3 bg-red-950/60 border border-red-500/30 rounded-xl px-4 py-3">
            <span className="text-red-400 text-lg shrink-0">⚠</span>
            <p className="flex-1 text-red-300 text-sm leading-relaxed">{error}</p>
            <button onClick={onClearError} className="text-red-500 hover:text-red-300 text-sm transition">✕</button>
          </div>
        )}

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className={`${theme.panelBg} backdrop-blur border ${theme.panelBorder} rounded-2xl p-8 shadow-2xl space-y-7 transition-colors duration-700`}
        >
          {/* Title */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme.accentText}`}>
              Story Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your story a name..."
              maxLength={80}
              className={`w-full ${theme.inputBg} border ${theme.inputBorder} ${theme.storyText} placeholder-current placeholder-opacity-30 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-1 focus:ring-current transition`}
            />
          </div>

          {/* Genre picker */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${theme.accentText}`}>
              Genre
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {GENRES.map((g) => {
                const t = GENRE_THEMES[g];
                const isSelected = genre === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenre(g)}
                    className={`
                      relative ${t.accentBg} border rounded-xl p-3 text-left
                      transition-all duration-200
                      ${isSelected
                        ? `${t.accentBorder} ring-1 ring-current shadow-lg`
                        : `${t.panelBorder} opacity-60 hover:opacity-90`
                      }
                    `}
                  >
                    <div className="text-xl mb-1">{GENRE_EMOJIS[g]}</div>
                    <div className={`font-semibold text-sm ${t.accentText}`}>{g}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{GENRE_DESCRIPTIONS[g]}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hook / Setting */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme.accentText}`}>
              Initial Hook / Setting
              <span className="font-normal opacity-50 ml-2">— where does it begin?</span>
            </label>
            <textarea
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              placeholder={HOOK_PLACEHOLDERS[genre]}
              rows={4}
              className={`w-full ${theme.inputBg} border ${theme.inputBorder} ${theme.storyText} placeholder-current placeholder-opacity-25 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-1 focus:ring-current transition resize-none leading-relaxed`}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canStart}
            className={`
              w-full py-4 rounded-xl font-semibold text-base transition-all duration-200
              ${canStart
                ? `${theme.primaryBtn} shadow-lg hover:shadow-xl active:scale-[0.98]`
                : "bg-slate-800 text-slate-600 cursor-not-allowed"
              }
            `}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-3">
                <span className="inline-flex gap-1">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="w-1.5 h-1.5 bg-current rounded-full animate-bounce opacity-60"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </span>
                Writing your opening...
              </span>
            ) : (
              "Start the Story →"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
