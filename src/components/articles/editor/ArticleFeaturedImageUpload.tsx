"use client";

import { ImageIcon, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";

type Props = {
  imageUrl: string | null;
  disabled?: boolean;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => void;
};

export default function ArticleFeaturedImageUpload({
  imageUrl,
  disabled = false,
  onUpload,
  onRemove,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (disabled || !file.type.startsWith("image/")) return;
      setUploading(true);
      try {
        await onUpload(file);
      } finally {
        setUploading(false);
      }
    },
    [disabled, onUpload],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        This image will be used as the article card thumbnail and for social sharing.
      </p>

      {imageUrl ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="max-h-80 w-full object-cover" />
          {!disabled ? (
            <div className="flex gap-2 border-t border-gray-200 bg-white p-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || uploading}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-16 text-center transition-colors ${
            dragging
              ? "border-[#1FAF9E] bg-[#1FAF9E]/5"
              : "border-gray-300 bg-white hover:border-[#1FAF9E]/60 hover:bg-gray-50/80"
          } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#1FAF9E]/10 text-[#1FAF9E]">
            {uploading ? (
              <Upload className="h-6 w-6 animate-pulse" />
            ) : (
              <ImageIcon className="h-6 w-6" />
            )}
          </div>
          <p className="text-base font-semibold text-gray-900">
            Drag image here or click to browse
          </p>
          <p className="mt-1 text-sm text-gray-500">PNG, JPG or WebP · recommended 1200×630px</p>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
