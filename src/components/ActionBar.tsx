"use client";

import { useState, useRef, useEffect } from "react";
import type { GenreTheme } from "@/types/story";

interface ActionBarProps {
  theme: GenreTheme;
  isLoading: boolean;
  hasPendingChoices: boolean;
  isConcluded: boolean;
  onContinue: (userInput?: string) => void;
  onGetChoices: () => void;
  onConclude: () => void;
}

export default function ActionBar({
  theme,
  isLoading,
  hasPendingChoices,
  isConcluded,
  onContinue,
  onGetChoices,
  onConclude,
}: ActionBarProps) {
  const [userInput, setUserInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [userInput]);

  const handleContinue = () => {
    onContinue(userInput || undefined);
    setUserInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !isLoading) {
      e.preventDefault();
      handleContinue();
    }
  };

  const disabled = isLoading || hasPendingChoices || isConcluded;

  return (
    <div className={`border-t ${theme.divider} px-4 sm:px-6 py-4`}>
      {/* Streaming indicator */}
      {isLoading && (
        <div className={`flex items-center gap-2 mb-3 px-1 ${theme.accentText} opacity-60`}>
          <span className="inline-flex gap-1">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </span>
          <span className="text-sm">Writing your story...</span>
        </div>
      )}

      {/* Input row */}
      <div className={`flex gap-3 items-end rounded-xl border ${theme.inputBorder} ${theme.inputBg} px-4 py-3 transition-all ${disabled ? "opacity-50" : ""}`}>
        <textarea
          ref={textareaRef}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={
            hasPendingChoices
              ? "Select a path above to continue..."
              : "Add your own sentences, or leave blank to let AI continue... (⌘↵)"
          }
          rows={1}
          className={`flex-1 bg-transparent ${theme.storyText} placeholder-current placeholder-opacity-25 text-base resize-none focus:outline-none min-h-[28px] max-h-32 leading-7`}
        />
        <button
          onClick={handleContinue}
          disabled={disabled}
          className={`
            shrink-0 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200
            ${!disabled
              ? `${theme.primaryBtn} active:scale-95`
              : "bg-slate-800 text-slate-600 cursor-not-allowed"
            }
          `}
        >
          Continue AI
        </button>
      </div>

      {/* Buttons row */}
      <div className="flex items-center justify-between mt-3 px-1 gap-2 flex-wrap">
        <p className={`${theme.accentText} opacity-30 text-xs hidden sm:block`}>
          ⌘↵ to continue
        </p>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={onGetChoices}
            disabled={disabled}
            className={`
              px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200
              ${!disabled
                ? `${theme.accentBorder} ${theme.accentText} ${theme.accentBg} hover:opacity-80 active:scale-95`
                : "border-slate-800 text-slate-600 cursor-not-allowed"
              }
            `}
          >
            Give Me Choices ✦
          </button>
          <button
            onClick={onConclude}
            disabled={disabled}
            title="Ask the AI to write a proper ending"
            className={`
              px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200
              ${!disabled
                ? "border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-400 active:scale-95"
                : "border-slate-800 text-slate-600 cursor-not-allowed"
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
