"use client";

import type { StorySegment as StorySegmentType, GenreTheme } from "@/types/story";

interface StorySegmentProps {
  segment: StorySegmentType;
  theme: GenreTheme;
  isLast?: boolean;
  isStreaming?: boolean;
}

export default function StorySegment({ segment, theme, isLast = false, isStreaming = false }: StorySegmentProps) {
  if (segment.role === "user") {
    const isChoiceNote = segment.text.startsWith("[Chose path:");

    if (isChoiceNote) {
      const displayText = segment.text
        .replace("[Chose path: ", "↳ ")
        .replace("]", "");
      return (
        <div className={`my-4 px-4 py-2 rounded-lg border-l-2 ${theme.accentBorder} ${theme.accentBg}`}>
          <p className={`text-xs font-medium ${theme.accentText} opacity-60 leading-relaxed`}>
            {displayText}
          </p>
        </div>
      );
    }

    return (
      <div className={`my-5 pl-4 border-l-2 ${theme.accentBorder}`}>
        <p className={`text-xs uppercase tracking-widest font-semibold mb-1.5 ${theme.accentText} opacity-50`}>
          You wrote
        </p>
        <p className={`text-base leading-relaxed italic ${theme.storyText} opacity-70`}>
          {segment.text}
        </p>
      </div>
    );
  }

  // AI segment — main story prose with genre-specific font
  const paragraphs = segment.text.split(/\n\n+/).filter(Boolean);

  return (
    <div className="my-6">
      {paragraphs.map((para, i) => (
        <p
          key={i}
          className={`text-lg leading-[1.95] mb-4 ${theme.storyFont} ${theme.storyText} tracking-wide`}
          style={{ textIndent: i === 0 ? "0" : "1.5em" }}
        >
          {para.trim()}
        </p>
      ))}

      {/* End-of-turn marker — only shown on the last AI segment when not actively streaming */}
      {isLast && !isStreaming && segment.text.length > 0 && (
        <div className="flex items-center gap-3 mt-6 mb-2">
          <div className={`flex-1 h-px border-t ${theme.divider} opacity-40`} />
          <span className={`text-xs ${theme.accentText} opacity-40 font-medium tracking-widest uppercase`}>
            your turn
          </span>
          <div className={`flex-1 h-px border-t ${theme.divider} opacity-40`} />
        </div>
      )}
    </div>
  );
}
