"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { useCallback } from "react";
import type { ArticleContentDoc } from "@/lib/articles/types";
import { emptyArticleDoc } from "@/lib/articles/sanitize";

type Props = {
  value: ArticleContentDoc;
  onChange: (doc: ArticleContentDoc) => void;
  onInsertImage?: () => void;
  disabled?: boolean;
};

export default function ArticleTipTapEditor({
  value,
  onChange,
  onInsertImage,
  disabled = false,
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Image.configure({ inline: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({
        placeholder: "Write your blog post…",
      }),
    ],
    content: value?.content?.length ? value : emptyArticleDoc(),
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange({ type: "doc", content: ed.getJSON().content ?? [] });
    },
  });

  const run = useCallback(
    (fn: () => void) => {
      if (!editor || disabled) return;
      fn();
    },
    [editor, disabled],
  );

  if (!editor) {
    return (
      <div className="min-h-[240px] rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
        Loading editor…
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex flex-wrap gap-2 border-b border-gray-100 px-3 py-2">
        <button
          type="button"
          className="rounded-md px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
          onClick={() => run(() => editor.chain().focus().toggleBold().run())}
        >
          Bold
        </button>
        <button
          type="button"
          className="rounded-md px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
          onClick={() => run(() => editor.chain().focus().toggleItalic().run())}
        >
          Italic
        </button>
        <button
          type="button"
          className="rounded-md px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
          onClick={() => run(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}
        >
          H2
        </button>
        <button
          type="button"
          className="rounded-md px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
          onClick={() => run(() => editor.chain().focus().toggleBulletList().run())}
        >
          List
        </button>
        <button
          type="button"
          className="rounded-md px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
          onClick={() => run(() => editor.chain().focus().toggleBlockquote().run())}
        >
          Quote
        </button>
        {onInsertImage ? (
          <button
            type="button"
            className="rounded-md px-2 py-1 text-xs font-medium text-[#0E4E45] hover:bg-[#2fb2a8]/10"
            onClick={onInsertImage}
          >
            Image
          </button>
        ) : null}
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none px-4 py-3 [&_.ProseMirror]:min-h-[280px] [&_.ProseMirror]:outline-none"
      />
    </div>
  );
}
