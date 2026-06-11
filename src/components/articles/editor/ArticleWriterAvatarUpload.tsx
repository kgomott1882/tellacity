"use client";

import { Camera, Settings2, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import WriterAvatarPhotoSettings from "@/components/articles/editor/WriterAvatarPhotoSettings";
import { resolveImageSourceForEditing } from "@/lib/articles/writerAvatarCrop";

type Props = {
  imageUrl: string | null;
  writerName?: string;
  disabled?: boolean;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => void;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export default function ArticleWriterAvatarUpload({
  imageUrl,
  writerName = "",
  disabled = false,
  onUpload,
  onRemove,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [preparingSettings, setPreparingSettings] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSourceUrl, setSettingsSourceUrl] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState("");
  const blobUrlRef = useRef<string | null>(null);

  const revokeBlobUrl = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  useEffect(() => () => revokeBlobUrl(), [revokeBlobUrl]);

  const beginSettings = useCallback(
    async (source: string | File) => {
      setSettingsError("");
      setPreparingSettings(true);
      try {
        const { url, revokeWhenDone } = await resolveImageSourceForEditing(source);
        revokeBlobUrl();
        if (revokeWhenDone) {
          blobUrlRef.current = url;
        }
        setSettingsSourceUrl(url);
        setSettingsOpen(true);
      } catch {
        setSettingsError("Could not open photo settings. Try choosing the image again.");
      } finally {
        setPreparingSettings(false);
      }
    },
    [revokeBlobUrl],
  );

  const closeSettings = () => {
    setSettingsOpen(false);
    setSettingsSourceUrl(null);
    revokeBlobUrl();
  };

  const handleFilePicked = (file: File) => {
    if (disabled || !file.type.startsWith("image/")) return;
    void beginSettings(file);
  };

  const handleSaveCropped = async (file: File) => {
    setSaving(true);
    try {
      await onUpload(file);
      closeSettings();
    } finally {
      setSaving(false);
    }
  };

  const fallbackInitials = initialsFromName(writerName);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative h-20 w-20 shrink-0">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              className="h-20 w-20 rounded-full border border-gray-200 object-cover"
            />
          ) : (
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-gray-300 bg-[#F8FBFA] text-lg font-semibold text-[#0E4E45]"
              aria-hidden
            >
              {fallbackInitials !== "?" ? (
                fallbackInitials
              ) : (
                <User className="h-8 w-8 text-[#1FAF9E]/70" />
              )}
            </div>
          )}
          {!disabled ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={saving || preparingSettings}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60"
              aria-label={imageUrl ? "Change writer photo" : "Upload writer photo"}
            >
              <Camera className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm text-gray-600">
            Optional photo for the &quot;Written by&quot; card. Upload, crop, then save.
          </p>
          {!disabled ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={saving || preparingSettings}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60"
              >
                {preparingSettings
                  ? "Preparing…"
                  : imageUrl
                    ? "Replace photo"
                    : "Upload photo"}
              </button>
              {imageUrl ? (
                <>
                  <button
                    type="button"
                    onClick={() => imageUrl && void beginSettings(imageUrl)}
                    disabled={saving || preparingSettings || settingsOpen}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#1FAF9E]/40 bg-[#1FAF9E]/5 px-3 py-1.5 text-sm font-medium text-[#0E4E45] hover:bg-[#1FAF9E]/10 disabled:opacity-60"
                  >
                    <Settings2 className="h-3.5 w-3.5" aria-hidden />
                    Photo settings
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closeSettings();
                      onRemove();
                    }}
                    disabled={saving || preparingSettings}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    Remove
                  </button>
                </>
              ) : null}
            </div>
          ) : null}
          {settingsError ? <p className="text-sm text-red-600">{settingsError}</p> : null}
          <p className="text-xs text-gray-500">PNG, JPG or WebP · square crop recommended</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFilePicked(f);
            e.target.value = "";
          }}
        />
      </div>

      {settingsOpen && settingsSourceUrl ? (
        <WriterAvatarPhotoSettings
          sourceUrl={settingsSourceUrl}
          onSave={handleSaveCropped}
          onCancel={closeSettings}
          saving={saving}
        />
      ) : null}
    </div>
  );
}
