"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import type { GenreTheme } from "@/types/story";

export type RichStoryEditorHandle = {
  getHTML: () => string;
  clear: () => void;
  insertText: (text: string) => void;
};

interface RichStoryEditorProps {
  theme: GenreTheme;
  disabled: boolean;
  placeholder: string;
  onModEnter: () => void;
}

function ToolbarBtn({
  active,
  onClick,
  children,
  theme,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  theme: GenreTheme;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`
        rounded-md px-2 py-1 text-xs font-semibold transition-all duration-150
        ${active
          ? `${theme.accentBg} ${theme.accentText} ring-1 ring-white/20`
          : `${theme.accentText} opacity-50 hover:opacity-95 hover:bg-white/10`
        }
      `}
    >
      {children}
    </button>
  );
}

function isHttpsImageUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

const RichStoryEditor = forwardRef<RichStoryEditorHandle, RichStoryEditorProps>(
  function RichStoryEditor({ theme, disabled, placeholder, onModEnter }, ref) {
    const onModEnterRef = useRef(onModEnter);
    onModEnterRef.current = onModEnter;

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: false,
          codeBlock: false,
        }),
        Image.configure({
          inline: false,
          allowBase64: false,
        }),
        TextAlign.configure({
          types: ["paragraph", "blockquote", "listItem"],
        }),
        Placeholder.configure({
          placeholder,
          emptyEditorClass: "is-editor-empty",
        }),
      ],
      content: "",
      immediatelyRender: false,
      editable: !disabled,
      editorProps: {
        attributes: {
          class: `rich-story-editor-content ${theme.storyText} text-base leading-7 min-h-[28px] max-h-32 overflow-y-auto focus:outline-none text-justify`,
        },
        handleDOMEvents: {
          keydown: (_view, event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              onModEnterRef.current();
              return true;
            }
            return false;
          },
        },
      },
    });

    useEffect(() => {
      editor?.setEditable(!disabled);
    }, [disabled, editor]);

    useImperativeHandle(
      ref,
      () => ({
        getHTML: () => editor?.getHTML() ?? "",
        clear: () => {
          editor?.commands.clearContent();
        },
        insertText: (text: string) => {
          editor?.chain().focus().insertContent(text).run();
        },
      }),
      [editor]
    );

    const run = useCallback(
      (fn: () => boolean) => {
        if (!disabled) fn();
      },
      [disabled]
    );

    const insertImage = useCallback(() => {
      if (disabled || !editor) return;
      const url = window.prompt(
        "Image URL (https only — paste a direct link to .jpg, .png, .webp, etc.)"
      );
      if (!url?.trim()) return;
      if (!isHttpsImageUrl(url)) {
        window.alert("Please use a secure https:// image URL.");
        return;
      }
      editor.chain().focus().setImage({ src: url.trim(), alt: "" }).run();
    }, [disabled, editor]);

    if (!editor) {
      return (
        <div
          className={`min-h-[28px] flex-1 rounded-lg border ${theme.inputBorder} ${theme.inputBg} animate-pulse`}
        />
      );
    }

    return (
      <div className="rich-story-editor flex min-w-0 flex-1 flex-col gap-2">
        <div
          className={`flex flex-wrap items-center gap-1 rounded-lg border px-1.5 py-1 ${theme.inputBorder} ${theme.panelBg} bg-zinc-50`}
        >
          <ToolbarBtn
            theme={theme}
            title="Bold"
            active={editor.isActive("bold")}
            onClick={() => run(() => editor.chain().focus().toggleBold().run())}
          >
            B
          </ToolbarBtn>
          <ToolbarBtn
            theme={theme}
            title="Italic"
            active={editor.isActive("italic")}
            onClick={() => run(() => editor.chain().focus().toggleItalic().run())}
          >
            <span className="italic">I</span>
          </ToolbarBtn>
          <ToolbarBtn
            theme={theme}
            title="Strikethrough"
            active={editor.isActive("strike")}
            onClick={() => run(() => editor.chain().focus().toggleStrike().run())}
          >
            S
          </ToolbarBtn>
          <span className={`mx-0.5 h-4 w-px ${theme.divider} bg-current opacity-30`} aria-hidden />
          <ToolbarBtn
            theme={theme}
            title="Bullet list"
            active={editor.isActive("bulletList")}
            onClick={() => run(() => editor.chain().focus().toggleBulletList().run())}
          >
            • List
          </ToolbarBtn>
          <ToolbarBtn
            theme={theme}
            title="Numbered list"
            active={editor.isActive("orderedList")}
            onClick={() => run(() => editor.chain().focus().toggleOrderedList().run())}
          >
            1. List
          </ToolbarBtn>
          <ToolbarBtn
            theme={theme}
            title="Quote"
            active={editor.isActive("blockquote")}
            onClick={() => run(() => editor.chain().focus().toggleBlockquote().run())}
          >
            “ ”
          </ToolbarBtn>
          <span className={`mx-0.5 h-4 w-px ${theme.divider} bg-current opacity-30`} aria-hidden />
          <ToolbarBtn theme={theme} title="Insert image (https URL)" active={false} onClick={insertImage}>
            🖼
          </ToolbarBtn>
          <span className={`mx-0.5 h-4 w-px ${theme.divider} bg-current opacity-30`} aria-hidden />
          <ToolbarBtn
            theme={theme}
            title="Align left"
            active={editor.isActive({ textAlign: "left" })}
            onClick={() => run(() => editor.chain().focus().setTextAlign("left").run())}
          >
            L
          </ToolbarBtn>
          <ToolbarBtn
            theme={theme}
            title="Align center"
            active={editor.isActive({ textAlign: "center" })}
            onClick={() => run(() => editor.chain().focus().setTextAlign("center").run())}
          >
            C
          </ToolbarBtn>
          <ToolbarBtn
            theme={theme}
            title="Align right"
            active={editor.isActive({ textAlign: "right" })}
            onClick={() => run(() => editor.chain().focus().setTextAlign("right").run())}
          >
            R
          </ToolbarBtn>
          <ToolbarBtn
            theme={theme}
            title="Justify"
            active={editor.isActive({ textAlign: "justify" })}
            onClick={() => run(() => editor.chain().focus().setTextAlign("justify").run())}
          >
            ≡
          </ToolbarBtn>
        </div>
        <EditorContent editor={editor} />
      </div>
    );
  }
);

export default RichStoryEditor;
