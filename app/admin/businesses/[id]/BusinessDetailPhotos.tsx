"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type AdminPhotoRow = {
  id: string;
  business_id: string;
  url: string;
  section: string | null;
  status: string | null;
  published_at: string | null;
  created_at: string | null;
  moderation_status: "pending" | "approved" | "rejected" | "flagged";
  moderation_reason: string | null;
  is_suspected_collage: boolean | null;
  collage_score: number | null;
  moderated_at: string | null;
  moderated_by: string | null;
};

type InitialData = {
  businessId: string;
  businessName: string | null;
  ownerEmail: string | null;
  ownerName: string | null;
  photos: AdminPhotoRow[];
};

const REJECT_REASONS: ReadonlyArray<string> = [
  "Collage / picmix",
  "Low quality",
  "Promotional content",
  "Not representative of the business",
  "Contains personal information",
  "Guideline violation",
] as const;

const FILTER_OPTIONS: ReadonlyArray<{
  key: "all" | "pending" | "flagged" | "approved" | "rejected";
  label: string;
}> = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "flagged", label: "Flagged" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString();
}

function statusPillClass(
  status: AdminPhotoRow["moderation_status"]
): string {
  const base =
    "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide";
  if (status === "approved")
    return `${base} border-emerald-200 bg-emerald-50 text-emerald-800`;
  if (status === "rejected")
    return `${base} border-rose-200 bg-rose-50 text-rose-800`;
  if (status === "flagged")
    return `${base} border-orange-200 bg-orange-50 text-orange-800`;
  return `${base} border-slate-200 bg-slate-100 text-slate-700`;
}

export default function BusinessDetailPhotos({
  initial,
}: {
  initial: InitialData;
}) {
  const [photos, setPhotos] = useState<AdminPhotoRow[]>(initial.photos);
  const [filter, setFilter] = useState<
    "all" | "pending" | "flagged" | "approved" | "rejected"
  >("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);

  // Preview / reject modal state.
  const [rejectingPhoto, setRejectingPhoto] = useState<AdminPhotoRow | null>(
    null
  );
  const [rejectReasonPreset, setRejectReasonPreset] = useState<string>(
    REJECT_REASONS[0]
  );
  const [rejectReasonCustom, setRejectReasonCustom] = useState<string>("");
  const [previewingPhoto, setPreviewingPhoto] = useState<AdminPhotoRow | null>(
    null
  );
  const [deletingPhoto, setDeletingPhoto] = useState<AdminPhotoRow | null>(null);

  const reload = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/admin/businesses/${encodeURIComponent(initial.businessId)}/photos`,
        { credentials: "same-origin", cache: "no-store" }
      );
      if (!res.ok) return;
      const data = (await res.json()) as { photos?: AdminPhotoRow[] };
      setPhotos(Array.isArray(data.photos) ? data.photos : []);
    } catch {
      /* swallow */
    }
  }, [initial.businessId]);

  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setMessage(null), 4000);
    return () => window.clearTimeout(t);
  }, [message]);

  const filtered = useMemo(() => {
    if (filter === "all") return photos;
    return photos.filter((p) => p.moderation_status === filter);
  }, [photos, filter]);

  const counts = useMemo(() => {
    const c = { pending: 0, flagged: 0, approved: 0, rejected: 0 };
    for (const p of photos) {
      c[p.moderation_status] = (c[p.moderation_status] ?? 0) + 1;
    }
    return c;
  }, [photos]);

  const moderate = useCallback(
    async (
      photo: AdminPhotoRow,
      action: "approve" | "reject" | "flag" | "reset",
      reason?: string
    ) => {
      setBusyId(photo.id);
      setMessage(null);
      try {
        const res = await fetch(
          `/api/admin/businesses/${encodeURIComponent(
            initial.businessId
          )}/photos/${encodeURIComponent(photo.id)}/moderate`,
          {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, reason }),
          }
        );
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          emailStatus?: string;
        };
        if (!res.ok) {
          setMessage({
            type: "error",
            text: data.error ?? "Moderation failed",
          });
          return;
        }

        let suffix = "";
        if (action === "reject") {
          if (data.emailStatus === "sent") suffix = ", owner notified by email";
          else if (data.emailStatus === "no_owner_email")
            suffix = ", no owner email on file (email skipped)";
          else suffix = ", email not sent";
        }
        setMessage({
          type: "success",
          text: `Photo ${action}d${suffix}.`,
        });
        await reload();
      } catch (e) {
        setMessage({
          type: "error",
          text: e instanceof Error ? e.message : "Moderation failed",
        });
      } finally {
        setBusyId(null);
      }
    },
    [initial.businessId, reload]
  );

  // Hard-delete: wipes the DB row + storage object. Because the per-plan
  // photo cap is an INSERT-time trigger (not a stored counter), deleting
  // the row is enough to "give the credit back", the business can
  // immediately upload a replacement up to their cap.
  const deletePhoto = useCallback(
    async (photo: AdminPhotoRow) => {
      setBusyId(photo.id);
      setMessage(null);
      try {
        const res = await fetch(
          `/api/admin/businesses/${encodeURIComponent(
            initial.businessId
          )}/photos/${encodeURIComponent(photo.id)}`,
          { method: "DELETE", credentials: "same-origin" }
        );
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          storageCleanup?: string;
        };
        if (!res.ok) {
          setMessage({
            type: "error",
            text: data.error ?? "Delete failed",
          });
          return;
        }
        const cleanupSuffix =
          data.storageCleanup === "failed"
            ? ", storage file kept (logged for cleanup)"
            : "";
        setMessage({
          type: "success",
          text: `Photo deleted, slot returned to the business${cleanupSuffix}.`,
        });
        setPhotos((prev) => prev.filter((row) => row.id !== photo.id));
        await reload();
      } catch (e) {
        setMessage({
          type: "error",
          text: e instanceof Error ? e.message : "Delete failed",
        });
      } finally {
        setBusyId(null);
      }
    },
    [initial.businessId, reload]
  );

  const openReject = (photo: AdminPhotoRow) => {
    setRejectingPhoto(photo);
    setRejectReasonPreset(REJECT_REASONS[0]);
    setRejectReasonCustom("");
  };

  const confirmReject = async () => {
    if (!rejectingPhoto) return;
    const reason =
      rejectReasonPreset === "Other / custom"
        ? rejectReasonCustom.trim()
        : rejectReasonPreset;
    if (!reason) {
      setMessage({
        type: "error",
        text: "Please enter a custom rejection reason.",
      });
      return;
    }
    const target = rejectingPhoto;
    setRejectingPhoto(null);
    await moderate(target, "reject", reason);
  };

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-col gap-2 border-b border-neutral-100 pb-3">
        <p className="text-sm text-neutral-600">
          Review every photo uploaded for{" "}
          <span className="font-medium text-neutral-900">
            {initial.businessName?.trim() || "this business"}
          </span>
          . Approved photos are the only ones that appear on the public page.
        </p>
        {initial.ownerEmail ? (
          <p className="text-xs text-neutral-500">
            Owner:{" "}
            <span className="font-medium text-neutral-800">
              {initial.ownerName || initial.ownerEmail}
            </span>{" "}
            ({initial.ownerEmail})
          </p>
        ) : (
          <p className="text-xs text-amber-700">
            This business has no claimed owner, rejection emails will be skipped.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTER_OPTIONS.map((opt) => {
          const c =
            opt.key === "all"
              ? photos.length
              : counts[opt.key as keyof typeof counts] ?? 0;
          const active = filter === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setFilter(opt.key)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                active
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              <span>{opt.label}</span>
              <span
                className={`rounded-full px-1.5 text-[10px] font-semibold ${
                  active ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-700"
                }`}
              >
                {c}
              </span>
            </button>
          );
        })}
      </div>

      {message ? (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 py-10 text-center text-sm text-neutral-500">
          No photos match this filter.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => {
            const busy = busyId === p.id;
            return (
              <li
                key={p.id}
                className="flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setPreviewingPhoto(p)}
                  className="relative block aspect-[4/3] w-full overflow-hidden bg-neutral-100 text-left"
                  title="Click to preview full-size"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <span
                    className={`${statusPillClass(p.moderation_status)} absolute left-2 top-2`}
                  >
                    {p.moderation_status}
                  </span>
                  {p.is_suspected_collage ? (
                    <span className="absolute right-2 top-2 inline-flex rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-800">
                      Collage?
                      {typeof p.collage_score === "number"
                        ? ` ${(p.collage_score * 100).toFixed(0)}%`
                        : ""}
                    </span>
                  ) : null}
                </button>

                <div className="flex flex-1 flex-col gap-2 p-3">
                  <div className="text-xs text-neutral-500">
                    <div>
                      <span className="font-medium text-neutral-700">Section:</span>{" "}
                      {p.section || "gallery"}
                    </div>
                    <div>
                      <span className="font-medium text-neutral-700">Uploaded:</span>{" "}
                      {formatDate(p.created_at)}
                    </div>
                    {p.moderated_at ? (
                      <div>
                        <span className="font-medium text-neutral-700">Last action:</span>{" "}
                        {formatDate(p.moderated_at)}
                      </div>
                    ) : null}
                  </div>

                  {p.moderation_reason ? (
                    <div className="rounded-md border border-rose-100 bg-rose-50 px-2 py-1 text-[11px] leading-snug text-rose-800">
                      <span className="font-semibold">Reason:</span>{" "}
                      {p.moderation_reason}
                    </div>
                  ) : null}

                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={busy || p.moderation_status === "approved"}
                      onClick={() => moderate(p, "approve")}
                      className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busy ? "…" : "Approve"}
                    </button>
                    <button
                      type="button"
                      disabled={busy || p.moderation_status === "rejected"}
                      onClick={() => openReject(p)}
                      className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-800 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Reject
                    </button>
                    {p.moderation_status !== "pending" ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => moderate(p, "reset")}
                        className="inline-flex items-center rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Reset
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setDeletingPhoto(p)}
                      className="inline-flex items-center rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Hard-delete this photo and return the slot to the business"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewingPhoto(p)}
                      className="ml-auto inline-flex items-center rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      Preview
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* ---------- Preview lightbox ---------- */}
      {previewingPhoto ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewingPhoto(null)}
        >
          <div
            className="relative max-h-[92vh] max-w-[92vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewingPhoto.url}
              alt=""
              className="max-h-[92vh] max-w-[92vw] rounded-lg object-contain shadow-xl"
            />
            <button
              type="button"
              onClick={() => setPreviewingPhoto(null)}
              className="absolute right-2 top-2 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-neutral-900 shadow hover:bg-white"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      {/* ---------- Reject modal ---------- */}
      {rejectingPhoto ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-neutral-900">
              Reject photo
            </h3>
            <p className="mt-1 text-sm text-neutral-600">
              Pick the reason. The owner will be emailed a short note referencing
              Tellacity&apos;s photo guidelines.
            </p>

            <label className="mt-4 block text-xs font-medium text-neutral-700">
              Reason
            </label>
            <select
              value={rejectReasonPreset}
              onChange={(e) => setRejectReasonPreset(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
            >
              {REJECT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="Other / custom">Other / custom…</option>
            </select>

            {rejectReasonPreset === "Other / custom" ? (
              <textarea
                value={rejectReasonCustom}
                onChange={(e) => setRejectReasonCustom(e.target.value)}
                placeholder="Describe the reason (shown to the business owner in the email)"
                rows={3}
                className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
              />
            ) : null}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingPhoto(null)}
                className="inline-flex items-center rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmReject()}
                className="inline-flex items-center rounded-md border border-rose-200 bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
              >
                Reject &amp; notify owner
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ---------- Delete confirm modal ---------- */}
      {deletingPhoto ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-neutral-900">
              Delete this photo?
            </h3>
            <p className="mt-1 text-sm text-neutral-600">
              This permanently removes the photo from the public page, the
              business dashboard, and this admin view. The storage file is
              also deleted. The business gets its photo slot back and can
              upload a replacement right away.
            </p>
            <div className="mt-3 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={deletingPhoto.url}
                alt=""
                className="block max-h-48 w-full object-cover"
              />
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingPhoto(null)}
                className="inline-flex items-center rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = deletingPhoto;
                  setDeletingPhoto(null);
                  void deletePhoto(target);
                }}
                className="inline-flex items-center rounded-md border border-rose-200 bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
