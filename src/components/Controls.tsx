"use client";

import type { Genre, GenreTheme } from "@/types/story";
import { GENRE_EMOJIS } from "@/types/story";

interface ControlsProps {
  genre: Genre;
  theme: GenreTheme;
  temperature: number;
  segmentCount: number;
  canUndo: boolean;
  onTemperatureChange: (val: number) => void;
  onUndo: () => void;
  onExport: () => void;
  onReset: () => void;
  onReadingMode: () => void;
}

export default function Controls({
  genre,
  theme,
  temperature,
  segmentCount,
  canUndo,
  onTemperatureChange,
  onUndo,
  onExport,
  onReset,
  onReadingMode,
}: ControlsProps) {
  const creativityLabel =
    temperature < 0.35 ? "Precise"
    : temperature < 0.6 ? "Balanced"
    : temperature < 0.82 ? "Creative"
    : "Chaotic";

  return (
    <div className="space-y-4">
      {/* Genre badge */}
      <div className={`rounded-xl border ${theme.accentBorder} ${theme.accentBg} px-4 py-3`}>
        <p className={`text-xs uppercase tracking-widest font-semibold mb-1 ${theme.accentText} opacity-50`}>Genre</p>
        <div className="flex items-center gap-2">
          <span className="text-lg">{GENRE_EMOJIS[genre]}</span>
          <span className={`font-bold ${theme.accentText}`}>{genre}</span>
        </div>
      </div>

      {/* Creativity slider */}
      <div className={`rounded-xl border ${theme.panelBorder} ${theme.panelBg} px-4 py-4`}>
        <div className="flex items-center justify-between mb-3">
          <p className={`text-xs uppercase tracking-widest font-semibold ${theme.accentText} opacity-50`}>Creativity</p>
          <span className={`text-xs font-bold ${theme.accentText}`}>{creativityLabel}</span>
        </div>
        <input
          type="range"
          min={0.1}
          max={1.0}
          step={0.05}
          value={temperature}
          onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: "currentColor" }}
        />
        <div className="flex justify-between mt-1.5">
          <span className={`${theme.accentText} opacity-30 text-xs`}>Precise</span>
          <span className={`${theme.accentText} opacity-30 text-xs`}>Chaotic</span>
        </div>
      </div>

      {/* Stats */}
      <div className={`rounded-xl border ${theme.panelBorder} ${theme.panelBg} px-4 py-3`}>
        <p className={`text-xs uppercase tracking-widest font-semibold mb-2 ${theme.accentText} opacity-50`}>Story</p>
        <div className={`text-xs space-y-1 ${theme.storyText} opacity-50`}>
          <div className="flex justify-between">
            <span>Segments</span>
            <span className="opacity-100">{segmentCount}</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-2">
        <button
          onClick={onReadingMode}
          disabled={segmentCount === 0}
          className={`
            w-full py-2.5 rounded-xl border text-sm font-medium transition-all duration-200
            ${segmentCount > 0
              ? `${theme.accentBorder} ${theme.accentText} ${theme.accentBg} hover:opacity-80 active:scale-[0.98]`
              : "border-slate-800 text-slate-700 cursor-not-allowed"
            }
          `}
        >
          ⬤ Reading Mode
        </button>

        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`
            w-full py-2.5 rounded-xl border text-sm font-medium transition-all duration-200
            ${canUndo
              ? `${theme.panelBorder} ${theme.storyText} opacity-70 hover:opacity-100 hover:${theme.panelBg} active:scale-[0.98]`
              : "border-slate-900 text-slate-700 cursor-not-allowed"
            }
          `}
        >
          ↩ Undo Last AI Turn
        </button>

        <button
          onClick={onExport}
          disabled={segmentCount === 0}
          className={`
            w-full py-2.5 rounded-xl border text-sm font-medium transition-all duration-200
            ${segmentCount > 0
              ? `${theme.panelBorder} ${theme.storyText} opacity-70 hover:opacity-100 hover:${theme.panelBg} active:scale-[0.98]`
              : "border-slate-900 text-slate-700 cursor-not-allowed"
            }
          `}
        >
          ↓ Export Markdown
        </button>

        <button
          onClick={onReset}
          className={`w-full py-2.5 rounded-xl border border-slate-900 text-slate-700 text-sm font-medium hover:text-slate-500 transition-all duration-200 active:scale-[0.98]`}
        >
          ✕ New Story
        </button>
      </div>
    </div>
  );
}
