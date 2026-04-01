"use client";

import type { StoryChoice, Genre, GenreTheme } from "@/types/story";
import GenreKeywordText from "./GenreKeywordText";

interface ChoiceCardsProps {
  choices: StoryChoice[];
  genre: Genre;
  theme: GenreTheme;
  onSelect: (choice: StoryChoice) => void;
  onDismiss: () => void;
}

export default function ChoiceCards({ choices, genre, theme, onSelect, onDismiss }: ChoiceCardsProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div>
          <p className={`text-xs font-bold uppercase tracking-widest ${theme.accentText}`}>
            ✦ Choose your path
          </p>
          <p className={`text-[10px] mt-1 leading-snug ${theme.labelText} opacity-45 max-w-[min(100%,20rem)]`}>
            Highlighted phrases lean into your {genre} tone so you can scan stakes and flavor fast.
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className={`touch-manipulation ${theme.accentText} opacity-50 hover:opacity-100 text-xs transition-colors active:scale-95`}
        >
          Dismiss ✕
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {choices.map((choice, index) => (
          <button
            key={choice.id}
            type="button"
            onClick={() => onSelect(choice)}
            className={`
              touch-manipulation text-left p-4 rounded-xl border transition-all duration-200
              hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]
              ${theme.choiceCardBase} ${theme.choiceCardHover}
              shadow-md shadow-zinc-200/50 hover:shadow-lg hover:shadow-zinc-300/40
              group
            `}
            style={{ transitionDelay: `${Math.min(index * 35, 200)}ms` }}
          >
            <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${theme.accentText} opacity-60`}>
              Path {choice.id}
            </div>
            <div className={`font-semibold text-sm mb-2 leading-snug ${theme.storyText}`}>
              <GenreKeywordText text={choice.title} genre={genre} theme={theme} strong />
            </div>
            <div className={`text-xs leading-relaxed opacity-60 group-hover:opacity-85 transition-opacity ${theme.storyText}`}>
              <GenreKeywordText text={choice.description} genre={genre} theme={theme} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
