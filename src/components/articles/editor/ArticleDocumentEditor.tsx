"use client";

import { Extension, type Editor } from "@tiptap/core";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Dropcursor from "@tiptap/extension-dropcursor";
import Gapcursor from "@tiptap/extension-gapcursor";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Eraser,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Underline as UnderlineIcon,
  Undo2,
  Unlink,
} from "lucide-react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { ArticleContentDoc } from "@/lib/articles/types";
import { emptyArticleDoc } from "@/lib/articles/sanitize";
import { countWordsFromDoc, estimateReadingMinutes } from "@/lib/articles/editorStats";
import { ARTICLE_PAGE_CLASS, ARTICLE_PAGE_MIN_HEIGHT_PX } from "@/lib/articles/articleLayout";
import ArticleImageExtension from "./articleImageExtension";
import ArticleLinkInsertModal, {
  type ArticleLinkModalMode,
  type ArticleLinkModalSubmit,
} from "./ArticleLinkInsertModal";
import "@/styles/article-body.css";

const FONT_SIZES = [
  { label: "Small", value: "14px" },
  { label: "Normal", value: "16px" },
  { label: "Large", value: "20px" },
  { label: "Huge", value: "28px" },
] as const;

const FONT_FAMILIES = [
  { label: "Default", value: "" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Times", value: "Times New Roman, serif" },
  { label: "Courier", value: "Courier New, monospace" },
] as const;

const TEXT_COLORS = [
  { label: "Black", value: "#0E0E0E" },
  { label: "Gray", value: "#404040" },
  { label: "Teal", value: "#1FAF9E" },
  { label: "Red", value: "#DC2626" },
  { label: "Blue", value: "#2563EB" },
  { label: "Purple", value: "#9333EA" },
] as const;

const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return { types: ["textStyle"] as string[] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
});

const FontFamily = Extension.create({
  name: "fontFamily",
  addOptions() {
    return { types: ["textStyle"] as string[] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: (element) => element.style.fontFamily?.replace(/['"]+/g, "") || null,
            renderHTML: (attributes) => {
              if (!attributes.fontFamily) return {};
              return { style: `font-family: ${attributes.fontFamily}` };
            },
          },
        },
      },
    ];
  },
});

function ToolbarDivider() {
  return <span className="mx-1 h-6 w-px shrink-0 bg-gray-200" aria-hidden />;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
      }}
      onClick={onClick}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-gray-700 transition-colors ${
        active ? "bg-[#1FAF9E]/15 text-[#0E4E45]" : "hover:bg-gray-100"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

function EditorToolbar({
  editor,
  onInsertImage,
  onOpenLinkModal,
  disabled,
}: {
  editor: Editor;
  onInsertImage?: () => void;
  onOpenLinkModal: () => void;
  disabled?: boolean;
}) {
  const run = useCallback(
    (fn: () => void) => {
      if (disabled) return;
      fn();
    },
    [disabled],
  );

  const currentColor =
    (editor.getAttributes("textStyle").color as string | undefined) ?? "#0E0E0E";

  return (
    <div className="sticky top-0 z-30 border-b border-gray-200 bg-[#F3F2EF] shadow-sm">
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2">
        <select
          disabled={disabled}
          className="h-8 max-w-[7rem] rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-700"
          defaultValue=""
          onChange={(e) => {
            const v = e.target.value;
            run(() => {
              if (!v) editor.chain().focus().unsetMark("textStyle").run();
              else editor.chain().focus().setMark("textStyle", { fontFamily: v }).run();
            });
          }}
        >
          <option value="">Font</option>
          {FONT_FAMILIES.filter((f) => f.value).map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        <select
          disabled={disabled}
          className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-700"
          defaultValue=""
          onChange={(e) => {
            const size = e.target.value;
            if (!size) return;
            run(() => editor.chain().focus().setMark("textStyle", { fontSize: size }).run());
          }}
        >
          <option value="">Size</option>
          {FONT_SIZES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <ToolbarDivider />

        <ToolbarButton
          title="Bold  Ctrl+B"
          active={editor.isActive("bold")}
          disabled={disabled}
          onClick={() => run(() => editor.chain().focus().toggleBold().run())}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Italic  Ctrl+I"
          active={editor.isActive("italic")}
          disabled={disabled}
          onClick={() => run(() => editor.chain().focus().toggleItalic().run())}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Underline  Ctrl+U"
          active={editor.isActive("underline")}
          disabled={disabled}
          onClick={() => run(() => editor.chain().focus().toggleUnderline().run())}
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Strikethrough"
          active={editor.isActive("strike")}
          disabled={disabled}
          onClick={() => run(() => editor.chain().focus().toggleStrike().run())}
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Highlight"
          active={editor.isActive("highlight")}
          disabled={disabled}
          onClick={() => run(() => editor.chain().focus().toggleHighlight().run())}
        >
          <Highlighter className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <label
          title="Text color"
          className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-600"
        >
          <span>A</span>
          <input
            type="color"
            disabled={disabled}
            value={currentColor}
            className="h-5 w-5 cursor-pointer border-0 p-0"
            onChange={(e) =>
              run(() => editor.chain().focus().setColor(e.target.value).run())
            }
          />
        </label>

        {TEXT_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            title={c.label}
            disabled={disabled}
            onClick={() => run(() => editor.chain().focus().setColor(c.value).run())}
            className="h-6 w-6 rounded border border-gray-200"
            style={{ backgroundColor: c.value }}
          />
        ))}

        <ToolbarDivider />

        {[1, 2, 3].map((level) => (
          <ToolbarButton
            key={level}
            title={`Heading ${level}`}
            active={editor.isActive("heading", { level })}
            disabled={disabled}
            onClick={() =>
              run(() =>
                editor
                  .chain()
                  .focus()
                  .toggleHeading({ level: level as 1 | 2 | 3 })
                  .run(),
              )
            }
          >
            <span className="text-xs font-bold">H{level}</span>
          </ToolbarButton>
        ))}
        <ToolbarButton
          title="Paragraph"
          active={editor.isActive("paragraph") && !editor.isActive("heading")}
          disabled={disabled}
          onClick={() => run(() => editor.chain().focus().setParagraph().run())}
        >
          <span className="text-xs font-medium">P</span>
        </ToolbarButton>
        <ToolbarButton
          title="Subscript"
          active={editor.isActive("subscript")}
          disabled={disabled}
          onClick={() => run(() => editor.chain().focus().toggleSubscript().run())}
        >
          <SubscriptIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Superscript"
          active={editor.isActive("superscript")}
          disabled={disabled}
          onClick={() => run(() => editor.chain().focus().toggleSuperscript().run())}
        >
          <SuperscriptIcon className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <div className="flex flex-wrap items-center gap-0.5 border-t border-gray-200/80 px-3 py-2">
        <ToolbarButton
          title="Bullet list"
          active={editor.isActive("bulletList")}
          disabled={disabled}
          onClick={() => run(() => editor.chain().focus().toggleBulletList().run())}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Numbered list"
          active={editor.isActive("orderedList")}
          disabled={disabled}
          onClick={() => run(() => editor.chain().focus().toggleOrderedList().run())}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Blockquote"
          active={editor.isActive("blockquote")}
          disabled={disabled}
          onClick={() => run(() => editor.chain().focus().toggleBlockquote().run())}
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Code block"
          active={editor.isActive("codeBlock")}
          disabled={disabled}
          onClick={() => run(() => editor.chain().focus().toggleCodeBlock().run())}
        >
          <Code2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Horizontal rule"
          disabled={disabled}
          onClick={() => run(() => editor.chain().focus().setHorizontalRule().run())}
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {onInsertImage ? (
          <ToolbarButton title="Insert image" disabled={disabled} onClick={() => run(onInsertImage)}>
            <ImagePlus className="h-4 w-4" />
          </ToolbarButton>
        ) : null}
        <ToolbarButton title="Insert link  Ctrl+K" disabled={disabled} onClick={() => run(onOpenLinkModal)}>
          <Link2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Remove link"
          disabled={disabled || !editor.isActive("link")}
          onClick={() => run(() => editor.chain().focus().unsetLink().run())}
        >
          <Unlink className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          title="Align left"
          active={editor.isActive({ textAlign: "left" })}
          disabled={disabled}
          onClick={() => run(() => editor.chain().focus().setTextAlign("left").run())}
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Align center"
          active={editor.isActive({ textAlign: "center" })}
          disabled={disabled}
          onClick={() => run(() => editor.chain().focus().setTextAlign("center").run())}
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Align right"
          active={editor.isActive({ textAlign: "right" })}
          disabled={disabled}
          onClick={() => run(() => editor.chain().focus().setTextAlign("right").run())}
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Justify"
          active={editor.isActive({ textAlign: "justify" })}
          disabled={disabled}
          onClick={() => run(() => editor.chain().focus().setTextAlign("justify").run())}
        >
          <AlignJustify className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          title="Clear formatting"
          disabled={disabled}
          onClick={() =>
            run(() =>
              editor
                .chain()
                .focus()
                .clearNodes()
                .unsetAllMarks()
                .run(),
            )
          }
        >
          <Eraser className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Undo  Ctrl+Z"
          disabled={disabled || !editor.can().undo()}
          onClick={() => run(() => editor.chain().focus().undo().run())}
        >
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Redo  Ctrl+Shift+Z"
          disabled={disabled || !editor.can().redo()}
          onClick={() => run(() => editor.chain().focus().redo().run())}
        >
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
      </div>
    </div>
  );
}

export type ArticleDocumentEditorHandle = {
  insertImage: (url: string, alt?: string) => void;
};

type LinkModalState = {
  open: boolean;
  mode: ArticleLinkModalMode;
  from: number;
  to: number;
  anchorText: string;
  initialUrl: string;
  replacingHref?: string;
};

type ValidateLinkInsertFn = (
  href: string,
  options?: { replacingHref?: string },
) => string | null;

type Props = {
  value: ArticleContentDoc;
  onChange: (doc: ArticleContentDoc) => void;
  onInsertImage?: () => void;
  onInsertImageFile?: (file: File) => void;
  disabled?: boolean;
  externalLinkLimitReached?: boolean;
  validateLinkInsert?: ValidateLinkInsertFn;
  caseStudyFields?: React.ReactNode;
  fillViewport?: boolean;
  onEditorFocus?: () => void;
};

const ArticleDocumentEditor = forwardRef<ArticleDocumentEditorHandle, Props>(
  function ArticleDocumentEditor(
    {
      value,
      onChange,
      onInsertImage,
      onInsertImageFile,
      disabled = false,
      externalLinkLimitReached = false,
      validateLinkInsert,
      caseStudyFields,
      fillViewport = false,
      onEditorFocus,
    },
    ref,
  ) {
    const [linkModal, setLinkModal] = useState<LinkModalState>({
      open: false,
      mode: "url-only",
      from: 0,
      to: 0,
      anchorText: "",
      initialUrl: "https://",
    });
    const [linkValidationError, setLinkValidationError] = useState<string | null>(null);
    const openLinkModalRef = useRef<(options?: { edit?: boolean }) => void>(() => {});

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          horizontalRule: false,
        }),
        HorizontalRule,
        Underline,
        Subscript,
        Superscript,
        TextStyle,
        FontSize,
        FontFamily,
        Color,
        Highlight.configure({ multicolor: false }),
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        ArticleImageExtension,
        Link.configure({
          openOnClick: false,
          autolink: true,
          HTMLAttributes: {
            rel: "noopener noreferrer",
            target: "_blank",
          },
        }),
        Dropcursor.configure({ color: "#1FAF9E", width: 3 }),
        Gapcursor,
        Placeholder.configure({
          placeholder: "Start writing your article here...",
        }),
      ],
      content: value?.content?.length ? value : emptyArticleDoc(),
      editable: !disabled,
      immediatelyRender: false,
      editorProps: {
        handleKeyDown: (_view, event) => {
          if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
            event.preventDefault();
            openLinkModalRef.current();
            return true;
          }
          return false;
        },
        handleDrop: (view, event, _slice, moved) => {
          if (moved || disabled || !onInsertImageFile) return false;
          const files = event.dataTransfer?.files;
          const file = files?.[0];
          if (file && file.type.startsWith("image/")) {
            event.preventDefault();
            onInsertImageFile(file);
            return true;
          }
          return false;
        },
      },
      onUpdate: ({ editor: ed }) => {
        onChange({ type: "doc", content: ed.getJSON().content ?? [] });
      },
      onFocus: () => {
        onEditorFocus?.();
      },
    });

    const closeLinkModal = useCallback(() => {
      setLinkModal((prev) => ({ ...prev, open: false }));
      setLinkValidationError(null);
    }, []);

    const openLinkModal = useCallback(
      (options?: { edit?: boolean }) => {
        if (!editor || disabled) return;

        const isEdit = options?.edit ?? editor.isActive("link");
        if (isEdit) {
          editor.chain().focus().extendMarkRange("link").run();
          const { from, to } = editor.state.selection;
          const href = editor.getAttributes("link").href as string | undefined;
          const anchorText = editor.state.doc.textBetween(from, to, " ");
          setLinkValidationError(null);
          setLinkModal({
            open: true,
            mode: "edit",
            from,
            to,
            anchorText,
            initialUrl: href ?? "https://",
            replacingHref: href,
          });
          return;
        }

        const { from, to, empty } = editor.state.selection;
        const anchorText = empty ? "" : editor.state.doc.textBetween(from, to, " ");
        setLinkValidationError(null);
        setLinkModal({
          open: true,
          mode: empty ? "url-only" : "anchor",
          from,
          to,
          anchorText,
          initialUrl: "https://",
        });
      },
      [editor, disabled],
    );

    openLinkModalRef.current = openLinkModal;

    const applyLink = useCallback(
      (payload: ArticleLinkModalSubmit) => {
        if (!editor) return;

        const { url, linkText } = payload;
        const { from, to, mode, replacingHref } = linkModal;

        const blockReason = validateLinkInsert?.(url, {
          replacingHref: replacingHref ?? undefined,
        });
        if (blockReason) {
          setLinkValidationError(blockReason);
          return;
        }

        closeLinkModal();

        requestAnimationFrame(() => {
          if (mode === "anchor" || mode === "edit") {
            editor.chain().focus().setTextSelection({ from, to }).setLink({ href: url }).run();
            return;
          }

          const displayText = linkText?.trim() || url;
          editor
            .chain()
            .focus()
            .setTextSelection({ from, to })
            .insertContent([
              {
                type: "text",
                text: displayText,
                marks: [{ type: "link", attrs: { href: url } }],
              },
              { type: "text", text: " " },
            ])
            .run();
        });
      },
      [editor, linkModal, validateLinkInsert, closeLinkModal],
    );

    const removeLink = useCallback(() => {
      if (!editor) return;
      const { from, to } = linkModal;
      closeLinkModal();
      requestAnimationFrame(() => {
        editor
          .chain()
          .focus()
          .setTextSelection({ from, to })
          .extendMarkRange("link")
          .unsetLink()
          .run();
      });
    }, [editor, linkModal, closeLinkModal]);

    useEffect(() => {
      if (!editor) return;
      editor.setEditable(!disabled);
    }, [editor, disabled]);

    useImperativeHandle(
      ref,
      () => ({
        insertImage: (url: string, alt = "") => {
          editor
            ?.chain()
            .focus()
            .insertContent({
              type: "image",
              attrs: { src: url, alt, width: "100%", align: "center" },
            })
            .run();
        },
      }),
      [editor],
    );

    const stats = useMemo(() => {
      const words = countWordsFromDoc(value);
      return { words, minutes: estimateReadingMinutes(words) };
    }, [value]);

    if (!editor) {
      return (
        <div className="flex min-h-[400px] items-center justify-center rounded-lg bg-white text-sm text-gray-500 shadow-sm">
          Loading editor…
        </div>
      );
    }

    return (
      <div
        className={`overflow-hidden rounded-lg border border-gray-300/80 shadow-sm ${
          fillViewport ? "flex min-h-0 flex-1 flex-col" : ""
        }`}
      >
        <EditorToolbar
          editor={editor}
          onInsertImage={onInsertImage}
          onOpenLinkModal={openLinkModal}
          disabled={disabled}
        />

        <ArticleLinkInsertModal
          open={linkModal.open}
          mode={linkModal.mode}
          anchorText={linkModal.anchorText}
          initialUrl={linkModal.initialUrl}
          validationError={linkValidationError}
          onClose={closeLinkModal}
          onSubmit={applyLink}
          onRemove={linkModal.mode === "edit" ? removeLink : undefined}
        />

        <div
          className={`article-editor-workspace overflow-y-auto px-3 py-6 sm:px-6 ${
            fillViewport
              ? "min-h-0 flex-1"
              : "max-h-[calc(100vh-12rem)] min-h-[calc(100vh-16rem)]"
          }`}
        >
          <div
            className={`article-editor-sheet article-body-content article-editor-prose ${ARTICLE_PAGE_CLASS} py-12`}
            style={{ minHeight: ARTICLE_PAGE_MIN_HEIGHT_PX }}
          >
            {caseStudyFields}
            <EditorContent editor={editor} />
            {editor ? (
              <BubbleMenu
                editor={editor}
                shouldShow={({ editor: ed }: { editor: Editor }) => ed.isActive("link") && !disabled}
                options={{ placement: "bottom" }}
              >
                <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
                  <button
                    type="button"
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => openLinkModal({ edit: true })}
                  >
                    Edit link
                  </button>
                  <button
                    type="button"
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      editor.chain().focus().extendMarkRange("link").unsetLink().run();
                    }}
                  >
                    Remove link
                  </button>
                </div>
              </BubbleMenu>
            ) : null}
          </div>
          <p className="mx-auto mt-4 max-w-3xl text-center text-xs text-gray-600">
            Page width matches the published article layout — what you see here is what readers see.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 bg-[#F3F2EF] px-4 py-3 text-xs text-gray-600">
          <span>
            Word count: {stats.words.toLocaleString()} words · ~{stats.minutes} min read
          </span>
          <span>Drag image to move · grip to reorder block · corners to resize · toolbar to flip</span>
        </div>
      </div>
    );
  },
);

export default ArticleDocumentEditor;
