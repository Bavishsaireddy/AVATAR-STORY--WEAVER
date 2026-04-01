"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GenreTheme } from "@/types/story";
import RichStoryEditor, { type RichStoryEditorHandle } from "./RichStoryEditor";
import { isRichInputEmpty } from "@/lib/htmlToPlainText";
import { springSnappy } from "@/lib/motionVariants";

interface ActionBarProps {
  theme: GenreTheme;
  isLoading: boolean;
  hasPendingChoices: boolean;
  isConcluded: boolean;
  onContinue: (userInput?: string) => void;
  onGetChoices: () => void;
  onConclude: () => void;
  onVisualize: () => Promise<string | null>;
}

export default function ActionBar({
  theme,
  isLoading,
  hasPendingChoices,
  isConcluded,
  onContinue,
  onGetChoices,
  onConclude,
  onVisualize,
}: ActionBarProps) {
  const editorRef = useRef<RichStoryEditorHandle>(null);
  const [isVisualizing, setIsVisualizing] = useState(false);

  const handleContinue = () => {
    const html = editorRef.current?.getHTML() ?? "";
    const trimmed = html.trim();
    onContinue(isRichInputEmpty(trimmed) ? undefined : trimmed);
    editorRef.current?.clear();
  };

  const handleVisualize = async () => {
    if (isVisualizing || disabled) return;
    setIsVisualizing(true);
    try {
      const prompt = await onVisualize();
      if (prompt) {
        editorRef.current?.insertText(`[Visual prompt] ${prompt}`);
      }
    } finally {
      setIsVisualizing(false);
    }
  };

  const disabled = isLoading || hasPendingChoices || isConcluded;

  return (
    <div className={`border-t ${theme.divider} px-4 sm:px-6 py-4`}>
      <AnimatePresence initial={false}>
        {isLoading && (
          <motion.div
            key="writing"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={springSnappy}
            className={`flex items-center gap-2 mb-3 px-1 overflow-hidden ${theme.accentText} opacity-60`}
          >
            <span className="inline-flex gap-1">
              {[0, 150, 300].map((delay) => (
                <motion.span
                  key={delay}
                  className="w-1.5 h-1.5 bg-current rounded-full"
                  animate={{ y: [0, -5, 0] }}
                  transition={{
                    duration: 0.55,
                    repeat: Infinity,
                    delay: delay / 1000,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </span>
            <span className="text-sm">Writing your story...</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={`flex flex-col sm:flex-row gap-3 sm:items-stretch rounded-xl border ${theme.inputBorder} ${theme.inputBg} px-4 py-3 transition-opacity duration-300 ${disabled ? "opacity-50" : "opacity-100"}`}
      >
        <RichStoryEditor
          ref={editorRef}
          theme={theme}
          disabled={disabled}
          onModEnter={handleContinue}
          placeholder={
            hasPendingChoices
              ? "Select a path above to continue…"
              : "Add your beat — bold, lists, quotes. ⌘↵ or Continue AI…"
          }
        />
        <button
          type="button"
          onClick={handleContinue}
          disabled={disabled}
          className={`
            touch-manipulation shrink-0 self-end sm:self-stretch px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors duration-200 sm:min-w-[120px]
            enabled:active:scale-[0.97] enabled:hover:brightness-105
            ${!disabled
              ? `${theme.primaryBtn}`
              : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
            }
          `}
        >
          Continue AI
        </button>
      </div>

      <div className="flex items-center justify-between mt-3 px-1 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <p className={`${theme.accentText} opacity-35 text-xs hidden lg:block max-w-[260px]`}>
            ⌘↵ · Bold, lists, quotes · 🖼 https image · L/C/R/≡ align
          </p>
          <button
            type="button"
            onClick={handleVisualize}
            disabled={disabled || isVisualizing}
            title="Generate an image prompt from the latest AI story beat"
            className={`
              touch-manipulation px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200 enabled:active:scale-[0.96] flex items-center gap-1.5
              ${
                !disabled && !isVisualizing
                  ? `${theme.accentBorder} ${theme.accentText} ${theme.accentBg} hover:opacity-90`
                  : "border-zinc-200 text-zinc-400 cursor-not-allowed opacity-50"
              }
            `}
          >
            {isVisualizing ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Generating…
              </>
            ) : (
              <>✨ Visualize</>
            )}
          </button>
        </div>
        <div className="flex gap-2 ml-auto">
          <button
            type="button"
            onClick={onGetChoices}
            disabled={disabled}
            className={`
              touch-manipulation px-4 py-2 rounded-lg border text-sm font-medium transition-colors duration-200 enabled:active:scale-[0.96] enabled:hover:brightness-105
              ${!disabled
                ? `${theme.accentBorder} ${theme.accentText} ${theme.accentBg} hover:opacity-90`
                : "border-zinc-200 text-zinc-400 cursor-not-allowed"
              }
            `}
          >
            Give Me Choices ❆
          </button>
          <button
            type="button"
            onClick={onConclude}
            disabled={disabled}
            title="Ask the AI to write a proper ending"
            className={`
              touch-manipulation px-4 py-2 rounded-lg border text-sm font-medium transition-colors duration-200 enabled:active:scale-[0.96] enabled:hover:bg-zinc-100 enabled:hover:border-zinc-400
              ${!disabled
                ? "border-zinc-300 text-zinc-700"
                : "border-zinc-200 text-zinc-400 cursor-not-allowed"
              }
            `}
          >
            Conclude Story ◼
          </button>
        </div>
      </div>
    </div>
  );
}
