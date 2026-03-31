"use client";

import { useEffect } from "react";
import type { StorySegment, GenreTheme } from "@/types/story";

interface ReadingModeProps {
  title: string;
  segments: StorySegment[];
  theme: GenreTheme;
  onClose: () => void;
}

export default function ReadingMode({ title, segments, theme, onClose }: ReadingModeProps) {
  const aiSegments = segments.filter((s) => s.role === "ai");

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 ${theme.pageBg} overflow-y-auto`}
      style={{ background: `linear-gradient(to bottom, ${theme.glowStyle.replace("radial-gradient", "radial-gradient").slice(0, -1)}, transparent) , var(--page-color, #050505)` }}
    >
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: theme.glowStyle }}
      />

      {/* Close button */}
      <div className="fixed top-4 right-4 z-10">
        <button
          onClick={onClose}
          className={`${theme.accentText} opacity-40 hover:opacity-100 transition text-sm px-3 py-1.5 rounded-lg border ${theme.accentBorder} ${theme.accentBg}`}
        >
          ✕ Exit Reading
        </button>
      </div>

      {/* Story content */}
      <div className="relative max-w-2xl mx-auto px-6 py-20">
        <h1 className={`${theme.storyFont} ${theme.storyText} text-3xl font-bold mb-2 leading-tight`}>
          {title}
        </h1>
        <div className={`w-16 h-px ${theme.accentBg} border-t ${theme.accentBorder} mb-10`} />

        {aiSegments.map((seg, segIdx) => {
          const paragraphs = seg.text.split(/\n\n+/).filter(Boolean);
          return (
            <div key={seg.id} className={segIdx > 0 ? "mt-8" : ""}>
              {paragraphs.map((para, i) => (
                <p
                  key={i}
                  className={`text-xl leading-[2.1] mb-6 ${theme.storyFont} ${theme.storyText}`}
                  style={{ textIndent: i === 0 && segIdx === 0 ? "0" : "2em" }}
                >
                  {para.trim()}
                </p>
              ))}
            </div>
          );
        })}

        {/* End marker */}
        <div className="mt-16 flex flex-col items-center gap-3">
          <div className={`w-8 h-px border-t ${theme.accentBorder}`} />
          <p className={`text-xs uppercase tracking-widest ${theme.accentText} opacity-40`}>
            The story continues...
          </p>
        </div>
      </div>
    </div>
  );
}
