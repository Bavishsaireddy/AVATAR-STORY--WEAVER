"use client";

import type { StoryChoice, GenreTheme } from "@/types/story";

interface ChoiceCardsProps {
  choices: StoryChoice[];
  theme: GenreTheme;
  onSelect: (choice: StoryChoice) => void;
  onDismiss: () => void;
}

export default function ChoiceCards({ choices, theme, onSelect, onDismiss }: ChoiceCardsProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className={`text-xs font-bold uppercase tracking-widest ${theme.accentText}`}>
          ✦ Choose your path
        </p>
        <button
          onClick={onDismiss}
          className={`${theme.accentText} opacity-50 hover:opacity-100 text-xs transition`}
        >
          Dismiss ✕
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {choices.map((choice) => (
          <button
            key={choice.id}
            onClick={() => onSelect(choice)}
            className={`
              text-left p-4 rounded-xl border transition-all duration-200
              ${theme.choiceCardBase} ${theme.choiceCardHover}
              hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]
              group
            `}
          >
            <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${theme.accentText} opacity-60`}>
              Path {choice.id}
            </div>
            <div className={`font-semibold text-sm mb-2 leading-snug ${theme.storyText}`}>
              {choice.title}
            </div>
            <div className={`text-xs leading-relaxed opacity-60 group-hover:opacity-80 transition ${theme.storyText}`}>
              {choice.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
