"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Lock, Upload } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { isPhotoLimitResponse } from "@/lib/photoUploadFreeLimit";
import { isPublishLockResponse } from "@/lib/businessPhotoLock";
import type { PlanKey } from "@/lib/plans";
import PhotoLimitModal from "@/components/business/PhotoLimitModal";
import { compressImage } from "@/lib/imageCompression";

const BUCKET = "business_media";
/** Hard ceiling on the original file the user picks (pre-compression). */
const MAX_ORIGINAL_BYTES = 20 * 1024 * 1024;
/** Hard ceiling on what we actually upload (post-compression). */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const BUILTIN_SECTION_HINTS: Record<string, string> = {
  gallery: "Your main image strip on your public profile.",
  products: "What you sell at a glance.",
  services: "How you help customers.",
};

/** Default (fallback) rendering when no dynamic section list is passed. */
const DEFAULT_SECTION_OPTIONS = [
  { value: "gallery", label: "Gallery", hint: BUILTIN_SECTION_HINTS.gallery },
  { value: "products", label: "Products", hint: BUILTIN_SECTION_HINTS.products },
  { value: "services", label: "Other", hint: BUILTIN_SECTION_HINTS.services },
] as const;

export type PhotoUploaderSection = {
  slug: string;
  title: string;
  is_enabled?: boolean;
  is_builtin?: boolean;
};

export type PhotoUploaderProps = {
  businessId: string;
  /** Used to lock non-Gallery sections on Free while keeping all sections visible. */
  planKey: PlanKey;
  /** Increment after upgrade when `planKey` is paid to briefly emphasize non-Gallery rows. */
  paidSectionSpotlightToken?: number;
  /** Per-business section configuration. When omitted, falls back to the 3 built-ins. */
  sections?: PhotoUploaderSection[];
  /** When true, disables the whole uploader (30-day Free lock, etc.). */
  locked?: boolean;
  /** Tooltip text to surface why uploading is disabled. */
  lockedReason?: string;
  onSuccess: () => void;
  /** Non–free-limit failures (validation, storage, other API errors). */
  onError?: (message: string) => void;
};

export default function PhotoUploader({
  businessId,
  planKey,
  paidSectionSpotlightToken = 0,
  sections,
  locked = false,
  lockedReason,
  onSuccess,
  onError,
}: PhotoUploaderProps) {
  const fileInputRefs = useRef<Partial<Record<string, HTMLInputElement>>>({});
  const [uploadingSection, setUploadingSection] = useState<string | null>(null);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [paidSectionsSpotlit, setPaidSectionsSpotlit] = useState(false);

  const sectionOptions = useMemo(() => {
    if (!sections || sections.length === 0) {
      return DEFAULT_SECTION_OPTIONS.map((o) => ({ value: o.value, label: o.label, hint: o.hint }));
    }
    return sections
      .filter((s) => s.is_enabled !== false && !!s.slug && !!s.title)
      .map((s) => ({
        value: s.slug,
        label: s.title,
        hint: BUILTIN_SECTION_HINTS[s.slug] ?? `Photos for "${s.title}".`,
      }));
  }, [sections]);

  useEffect(() => {
    if (!paidSectionSpotlightToken || planKey === "free") return;
    setPaidSectionsSpotlit(true);
    const t = window.setTimeout(() => setPaidSectionsSpotlit(false), 3600);
    return () => {
      window.clearTimeout(t);
    };
  }, [paidSectionSpotlightToken, planKey]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>, uploadSection: string) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !businessId) return;

    if (locked) {
      onError?.(lockedReason ?? "Photo changes are temporarily locked.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      onError?.("Please choose an image file.");
      return;
    }
    if (file.size > MAX_ORIGINAL_BYTES) {
      onError?.("Image must be 20 MB or smaller.");
      return;
    }

    setUploadingSection(uploadSection);
    try {
      // Compress on the client: resize long-edge to 1600 px and re-encode to
      // JPEG (PNG kept only when the source has alpha). Falls back to the
      // original file on any failure so the upload path never breaks.
      const compressed = await compressImage(file, {
        maxDimension: 1600,
        quality: 0.82,
      });
      if (compressed.size > MAX_UPLOAD_BYTES) {
        onError?.("Image is still too large after compression. Try a smaller source file.");
        return;
      }

      const sb = supabaseBrowser();
      const safe = compressed.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
      const path = `${businessId}/${Date.now()}-${safe || "photo"}`;

      const { error: upErr } = await sb.storage.from(BUCKET).upload(path, compressed, {
        upsert: false,
        contentType: compressed.type || "image/jpeg",
      });
      if (upErr) {
        onError?.(
          upErr.message ||
            "Upload to storage failed. Check the business_media bucket and your connection."
        );
        return;
      }

      const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path);
      const publicUrl = pub?.publicUrl?.trim();
      if (!publicUrl) {
        onError?.("Could not get a public URL for this image.");
        return;
      }

      const res = await fetch(`/api/business/${encodeURIComponent(businessId)}/photos/upload`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: publicUrl, section: uploadSection }),
      });

      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        if (isPhotoLimitResponse(res.status, body)) {
          setLimitModalOpen(true);
          return;
        }
        if (isPublishLockResponse(res.status, body)) {
          onError?.(body?.error ?? "Photos are locked until your next edit window.");
          return;
        }
        onError?.(body?.error || `Could not save photo (${res.status}).`);
        return;
      }

      onSuccess();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setUploadingSection(null);
    }
  };

  return (
    <>
      <PhotoLimitModal open={limitModalOpen} onClose={() => setLimitModalOpen(false)} />

      <div className="mt-5 space-y-3">
        {sectionOptions.map((opt) => {
          const rowLocked = locked;
          const busyHere = uploadingSection === opt.value;
          const busyElsewhere = uploadingSection !== null && !busyHere;
          const spotlightRow =
            paidSectionsSpotlit && opt.value !== "gallery";

          return (
            <div
              key={opt.value}
              className={`rounded-lg border p-4 transition-[box-shadow,background-color] duration-500 ${
                rowLocked ? "border-gray-200 bg-gray-50/90" : "border-gray-200 bg-white"
              } ${
                spotlightRow
                  ? "bg-teal-50/50 shadow-[0_0_0_2px_rgba(31,175,158,0.35)] ring-1 ring-[#1FAF9E]/30"
                  : ""
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#0E0E0E]">{opt.label}</h3>
                    {rowLocked ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
                        <Lock className="h-3 w-3 shrink-0" aria-hidden />
                        Locked
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-gray-600 sm:text-sm">{opt.hint}</p>
                </div>

                <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                  {rowLocked ? (
                    <>
                      <button
                        type="button"
                        disabled
                        aria-disabled="true"
                        className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-400"
                      >
                        <Upload className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
                        Upload photo
                      </button>
                      {lockedReason ? (
                        <span className="text-center text-xs text-gray-500 sm:text-right">
                          {lockedReason}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <input
                        ref={(el) => {
                          if (el) fileInputRefs.current[opt.value] = el;
                          else delete fileInputRefs.current[opt.value];
                        }}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        aria-label={`Upload photo to ${opt.label}`}
                        onChange={(ev) => void handleFile(ev, opt.value)}
                      />
                      <button
                        type="button"
                        disabled={busyHere || busyElsewhere}
                        onClick={() => fileInputRefs.current[opt.value]?.click()}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busyHere ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#124541] border-t-transparent" />
                            Uploading…
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 text-gray-500" aria-hidden />
                            Upload photo
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
