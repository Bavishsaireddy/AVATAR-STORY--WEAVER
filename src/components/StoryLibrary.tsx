"use client";

import type { SavedStoryListItem, GenreTheme } from "@/types/story";
import type { SetupPageTokens } from "@/lib/setupUiTokens";
import { GENRE_EMOJIS, coerceGenre } from "@/types/story";

type StoryLibraryBase = {
  stories: SavedStoryListItem[];
  currentId: string | null;
  loading?: boolean;
  disabled?: boolean;
  disabledHint?: string;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
};

type StoryLibraryProps = StoryLibraryBase &
  ({ variant: "story"; theme: GenreTheme } | { variant: "setup"; tokens: SetupPageTokens });

function formatUpdated(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function StoryLibrary(props: StoryLibraryProps) {
  const {
    stories,
    currentId,
    loading,
    disabled,
    disabledHint,
    onSelect,
    onDelete,
    variant,
  } = props;

  const isSetup = variant === "setup";
  const theme = isSetup ? null : props.theme;
  const tokens = isSetup ? props.tokens : null;

  const shellClass = isSetup
    ? "rounded-xl border px-3 py-3 shadow-sm"
    : `rounded-xl border ${theme!.panelBorder} ${theme!.panelBg} px-3 py-3 shadow-md shadow-zinc-200/40`;

  const shellStyle = isSetup
    ? {
        background: tokens!.surface,
        borderColor: tokens!.border,
      }
    : undefined;

  const labelClass = isSetup ? "text-[9px] font-bold uppercase tracking-[0.2em]" : `text-[9px] font-bold uppercase tracking-[0.2em] ${theme!.labelText}`;
  const labelStyle = isSetup ? { color: tokens!.textMuted } : undefined;

  const hintClass = isSetup ? "text-[10px] leading-snug mt-2" : `text-[10px] leading-snug mt-2 ${theme!.mutedText}`;
  const hintStyle = isSetup ? { color: tokens!.textMuted, opacity: 0.85 } : undefined;

  return (
    <div className={shellClass} style={shellStyle}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className={labelClass} style={labelStyle}>
          Previous stories
        </span>
        {loading ? (
          <span className={`text-[10px] ${isSetup ? "" : theme!.mutedText}`} style={isSetup ? { color: tokens!.textMuted } : undefined}>
            …
          </span>
        ) : null}
      </div>

      {disabled && disabledHint ? (
        <p className={hintClass} style={hintStyle}>
          {disabledHint}
        </p>
      ) : null}

      {!disabled && stories.length === 0 && !loading ? (
        <p className={hintClass} style={hintStyle}>
          Saved tales appear here once PostgreSQL is configured and you finish an opening beat.
        </p>
      ) : null}

      <ul className="max-h-52 overflow-y-auto space-y-1.5 pr-0.5" style={{ scrollbarWidth: "thin" }}>
        {stories.map((s) => {
          const active = s.id === currentId;
          const baseBtn =
            "w-full text-left rounded-lg border px-2.5 py-2 text-xs transition-colors duration-200 flex items-start gap-2 group touch-manipulation active:scale-[0.99]";
          const storyBtnClass = isSetup
            ? ""
            : active
              ? `${baseBtn} ${theme!.accentBorder} ${theme!.accentBg}`
              : `${baseBtn} ${theme!.panelBorder} ${theme!.panelBg} hover:brightness-[0.98]`;

          const btnStyle = isSetup
            ? {
                borderColor: active ? tokens!.accent : tokens!.border,
                background: active ? `${tokens!.accent}14` : "transparent",
                color: tokens!.text,
              }
            : undefined;

          return (
            <li key={s.id}>
              <div className="flex items-stretch gap-1">
                <button
                  type="button"
                  className={isSetup ? baseBtn : storyBtnClass}
                  style={btnStyle}
                  onClick={() => onSelect(s.id)}
                  title={s.title}
                >
                  <span className="shrink-0 text-sm opacity-90" aria-hidden>
                    {GENRE_EMOJIS[coerceGenre(s.genre)]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold truncate leading-tight">{s.title || "Untitled"}</span>
                    <span
                      className={`block text-[10px] mt-0.5 ${isSetup ? "" : theme!.mutedText}`}
                      style={isSetup ? { color: tokens!.textMuted } : undefined}
                    >
                      {coerceGenre(s.genre)} · {s.beatCount} beats · {formatUpdated(s.updatedAt)}
                    </span>
                  </span>
                </button>
                {onDelete ? (
                  <button
                    type="button"
                    className={`touch-manipulation shrink-0 px-2 rounded-lg border text-[11px] opacity-60 hover:opacity-100 active:scale-95 transition-transform ${
                      isSetup ? "" : `${theme!.panelBorder} ${theme!.mutedText}`
                    }`}
                    style={isSetup ? { borderColor: tokens!.border, color: tokens!.textMuted } : undefined}
                    title="Delete from library"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete “${s.title || "Untitled"}”?`)) onDelete(s.id);
                    }}
                  >
                    ×
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
