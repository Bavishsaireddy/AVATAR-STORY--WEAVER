"use client";

import { motion } from "framer-motion";
import { sanitizeUserStoryHtml } from "@/lib/sanitizeUserStoryHtml";
import type { StorySegment as StorySegmentType, GenreTheme } from "@/types/story";
import { springSnappy } from "@/lib/motionVariants";

interface StorySegmentProps {
  segment: StorySegmentType;
  theme: GenreTheme;
  isLast?: boolean;
  isStreaming?: boolean;
}

const segmentMotion = {
  initial: false,
  animate: { opacity: 1, y: 0 },
  transition: springSnappy,
};

export default function StorySegment({ segment, theme, isLast = false, isStreaming = false }: StorySegmentProps) {
  const rawText = typeof segment.text === "string" ? segment.text : "";

  if (segment.role === "user") {
    const isChoiceNote = rawText.startsWith("[Chose path:");

    if (isChoiceNote) {
      const displayText = rawText
        .replace("[Chose path: ", "↳ ")
        .replace("]", "");
      return (
        <motion.div
          {...segmentMotion}
          className={`my-4 px-4 py-2 rounded-lg border-l-2 ${theme.accentBorder} ${theme.accentBg}`}
        >
          <p className={`text-xs font-medium ${theme.accentText} opacity-60 leading-relaxed`}>
            {displayText}
          </p>
        </motion.div>
      );
    }

    const looksLikeHtml = rawText.includes("<") && rawText.includes(">");
    const safeHtml = looksLikeHtml ? sanitizeUserStoryHtml(rawText) : "";

    return (
      <motion.div
        {...segmentMotion}
        className={`my-5 pl-4 border-l-2 ${theme.accentBorder}`}
      >
        <p className={`text-xs uppercase tracking-widest font-semibold mb-1.5 ${theme.accentText} opacity-50`}>
          You wrote
        </p>
        {looksLikeHtml ? (
          <div
            className={`story-user-html text-base leading-relaxed text-justify ${theme.storyText} opacity-90`}
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
        ) : (
          <p className={`text-base leading-relaxed text-justify italic ${theme.storyText} opacity-70`}>
            {rawText}
          </p>
        )}
      </motion.div>
    );
  }

  const paragraphs = rawText.split(/\n\n+/).filter(Boolean);

  return (
    <motion.div className="my-6" {...segmentMotion}>
      {isStreaming && isLast ? (
        <p
          className={`text-lg leading-[1.95] text-justify whitespace-pre-wrap ${theme.storyFont} ${theme.storyText} tracking-wide`}
        >
          {rawText}
        </p>
      ) : (
        paragraphs.map((para, i) => (
          <p
            key={i}
            className={`text-lg leading-[1.95] mb-4 text-justify ${theme.storyFont} ${theme.storyText} tracking-wide`}
            style={{ textIndent: i === 0 ? "0" : "1.5em" }}
          >
            {para.trim()}
          </p>
        ))
      )}

      {isLast && !isStreaming && rawText.length > 0 && (
        <motion.div
          className="flex items-center gap-3 mt-6 mb-2"
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className={`flex-1 h-px border-t ${theme.divider} opacity-40`} />
          <span className={`text-xs ${theme.accentText} opacity-40 font-medium tracking-widest uppercase`}>
            your turn
          </span>
          <div className={`flex-1 h-px border-t ${theme.divider} opacity-40`} />
        </motion.div>
      )}

      {isStreaming && isLast && (
        <motion.span
          className={`inline-block mt-2 h-3 w-0.5 rounded-full ${theme.accentText} align-middle ml-0.5`}
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
      )}
    </motion.div>
  );
}
