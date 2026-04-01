"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import type { StorySegment, GenreTheme, Genre } from "@/types/story";
import { springSnappy } from "@/lib/motionVariants";

interface ReadingModeProps {
  title: string;
  genre: Genre;
  hook: string;
  segments: StorySegment[];
  theme: GenreTheme;
  onClose: () => void;
}

export default function ReadingMode({
  title,
  genre,
  hook,
  segments,
  theme,
  onClose,
}: ReadingModeProps) {
  const aiSegments = segments.filter((s) => s.role === "ai");

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const overlay = (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reading-mode-title"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
      style={{
        backgroundColor: "rgba(255,255,255,0.82)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        isolation: "isolate",
      }}
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        className={`relative z-[1] flex w-full max-w-2xl flex-col rounded-2xl border-2 shadow-2xl ${theme.panelBorder} bg-white`}
        style={{
          maxHeight: "88vh",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.06), 0 25px 60px -12px rgba(0,0,0,0.12)",
        }}
        initial={false}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={springSnappy}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`pointer-events-none absolute inset-0 rounded-2xl ${theme.panelBg} opacity-[0.92]`}
          style={{ mixBlendMode: "normal" }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-40"
          style={{ background: theme.glowStyle }}
          aria-hidden
        />

        <div
          className={`relative z-[2] shrink-0 rounded-t-2xl border-b px-5 py-5 sm:px-8 sm:py-6 ${theme.panelBorder} bg-zinc-50 text-center`}
        >
          <div className="flex items-start justify-end absolute top-3 right-3 sm:top-4 sm:right-4">
            <motion.button
              type="button"
              onClick={onClose}
              title="Close (Esc)"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors duration-150 ${theme.accentText} ${theme.accentBorder} ${theme.accentBg} hover:opacity-100 opacity-80`}
            >
              <span aria-hidden>✕</span>
              <span className="hidden sm:inline">Close</span>
            </motion.button>
          </div>
          <span
            className={`inline-block text-[10px] font-semibold uppercase tracking-[0.4em] ${theme.accentText} opacity-60 mb-2`}
          >
            Reading mode
          </span>
          <h2
            id="reading-mode-title"
            className={`text-xl sm:text-2xl md:text-3xl font-bold leading-tight px-2 ${theme.storyText} ${theme.storyFont}`}
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
          >
            {title}
          </h2>
          <span
            className={`mt-2 inline-flex items-center rounded-md border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${theme.accentBorder} ${theme.accentText} bg-zinc-100`}
          >
            {genre}
          </span>
        </div>

        {hook.trim() ? (
          <div
            className={`relative z-[2] mx-4 sm:mx-6 mt-4 rounded-xl border-l-4 px-4 py-3 ${theme.accentBorder} bg-gradient-to-r from-zinc-100 via-white to-white ring-1 ring-zinc-200/80`}
          >
            <p
              className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-2 ${theme.accentText} opacity-90`}
            >
              Premise · story summary
            </p>
            <p className={`text-sm sm:text-base leading-relaxed text-justify ${theme.storyFont} ${theme.storyText} opacity-92`}>
              {hook.trim()}
            </p>
          </div>
        ) : null}

        <div
          className="relative z-[2] min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-8"
          style={{ scrollbarWidth: "thin" }}
        >
          <div className={`mb-8 flex items-center gap-3`}>
            <div className={`h-px flex-1 border-t ${theme.accentBorder} opacity-50`} />
            <span className={`text-[10px] uppercase tracking-[0.3em] ${theme.accentText} opacity-45`}>
              ✦ Story ✦
            </span>
            <div className={`h-px flex-1 border-t ${theme.accentBorder} opacity-50`} />
          </div>

          {aiSegments.length === 0 ? (
            <p className={`text-center italic ${theme.labelText}`}>No AI prose yet. Continue the story first.</p>
          ) : null}

          {aiSegments.map((seg, segIdx) => {
            const paragraphs = seg.text.split(/\n\n+/).filter(Boolean);
            return (
              <motion.div
                key={seg.id}
                className={segIdx > 0 ? "mt-8" : ""}
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springSnappy, delay: Math.min(segIdx * 0.04, 0.2) }}
              >
                {paragraphs.map((para, i) => (
                  <p
                    key={`${seg.id}-${i}`}
                    className={`mb-5 text-justify text-[1.05rem] leading-[1.95] sm:text-[1.1rem] sm:leading-[2] ${theme.storyFont} ${theme.storyText}`}
                    style={{
                      textIndent: i === 0 && segIdx === 0 ? "0" : "1.5em",
                    }}
                  >
                    {para.trim()}
                  </p>
                ))}
              </motion.div>
            );
          })}

          <div className="mb-4 mt-12 flex flex-col items-center gap-2">
            <div className={`h-px w-12 border-t ${theme.accentBorder} opacity-40`} />
            <p className={`text-[10px] uppercase tracking-[0.25em] ${theme.accentText} opacity-35`}>
              The story continues…
            </p>
          </div>
        </div>

        <div
          className={`relative z-[2] flex shrink-0 items-center justify-between rounded-b-2xl border-t px-5 py-3 sm:px-6 ${theme.panelBorder} bg-zinc-50`}
        >
          <span className={`text-[11px] ${theme.labelText} opacity-55`}>
            {aiSegments.length} segment{aiSegments.length !== 1 ? "s" : ""}
          </span>
          <span className={`text-[11px] ${theme.labelText} opacity-40`}>
            <kbd className={`rounded border px-1.5 py-0.5 text-[10px] ${theme.accentBorder}`}>Esc</kbd>{" "}
            to close
          </span>
        </div>
      </motion.div>
    </motion.div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(overlay, document.body);
}
