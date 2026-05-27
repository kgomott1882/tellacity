"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type QueuePhoto = {
  id: string;
  business_id: string;
  url: string;
  section: string | null;
  status: string | null;
  published_at: string | null;
  created_at: string | null;
  moderation_status: "pending" | "approved" | "rejected" | "flagged" | string;
  moderation_reason: string | null;
  is_live: boolean | null;
  is_suspected_collage: boolean | null;
  collage_score: number | null;
};

type QueueGroup = {
  businessId: string;
  businessName: string | null;
  businessSlug: string | null;
  ownerId: string | null;
  ownerEmail: string | null;
  ownerName: string | null;
  pendingCount: number;
  photos: QueuePhoto[];
};

type QueueResponse = {
  pendingCount: number;
  businessCount: number;
  groups: QueueGroup[];
};

const REJECT_REASONS: ReadonlyArray<string> = [
  "Collage / picmix",
  "Low quality",
  "Promotional content",
  "Not representative of the business",
  "Contains personal information",
  "Guideline violation",
] as const;

type RejectTarget = { group: QueueGroup; photo: QueuePhoto };

/** Max photos that can be selected at once for bulk admin actions. */
const MAX_ADMIN_BULK_SELECTION = 50;

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString();
}

export default function PhotoUploadsQueue() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [groups, setGroups] = useState<QueueGroup[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);
  const [previewing, setPreviewing] = useState<QueuePhoto | null>(null);
  const [rejecting, setRejecting] = useState<RejectTarget | null>(null);
  const [rejectReasonPreset, setRejectReasonPreset] = useState<string>(
    REJECT_REASONS[0]
  );
  const [rejectReasonCustom, setRejectReasonCustom] = useState("");
  const [deleting, setDeleting] = useState<RejectTarget | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkRejecting, setBulkRejecting] = useState(false);
  const [bulkBusy, setBulkBusy] = useState<"approve" | "reject" | "delete" | null>(
    null
  );

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/photo-uploads", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const data = (await res.json()) as QueueResponse;
      setGroups(Array.isArray(data.groups) ? data.groups : []);
      setPendingCount(
        typeof data.pendingCount === "number" ? data.pendingCount : 0
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load queue");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(null), 4500);
    return () => window.clearTimeout(t);
  }, [flash]);

  const totalBusinesses = groups.length;
  const totalPhotosInView = useMemo(
    () => groups.reduce((acc, g) => acc + g.photos.length, 0),
    [groups]
  );

  const photoLookup = useMemo(() => {
    const m = new Map<string, { group: QueueGroup; photo: QueuePhoto }>();
    for (const g of groups) {
      for (const p of g.photos) {
        m.set(p.id, { group: g, photo: p });
      }
    }
    return m;
  }, [groups]);

  useEffect(() => {
    const valid = new Set<string>();
    for (const g of groups) {
      for (const p of g.photos) valid.add(p.id);
    }
    setSelectedIds((prev) => {
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (valid.has(id)) next.add(id);
        else changed = true;
      }
      if (!changed && next.size === prev.size) return prev;
      return next;
    });
  }, [groups]);

  const selectedCount = selectedIds.size;
  const selectionAtCap = selectedCount >= MAX_ADMIN_BULK_SELECTION;

  const toggleSelected = useCallback((photoId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
        return next;
      }
      if (next.size >= MAX_ADMIN_BULK_SELECTION) return prev;
      next.add(photoId);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectAllInGroup = useCallback((group: QueueGroup) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const p of group.photos) {
        if (next.size >= MAX_ADMIN_BULK_SELECTION) break;
        next.add(p.id);
      }
      return next;
    });
  }, []);

  // Optimistically remove a photo from the queue so a freshly-approved or
  // rejected item disappears immediately. We then silently refetch so the
  // sidebar badge and pendingCount reconcile with the server.
  const removePhotoLocally = useCallback((photoId: string) => {
    setGroups((prev) => {
      const next: QueueGroup[] = [];
      for (const g of prev) {
        const remaining = g.photos.filter((p) => p.id !== photoId);
        if (remaining.length > 0) {
          next.push({ ...g, photos: remaining, pendingCount: remaining.length });
        }
      }
      return next;
    });
    setPendingCount((n) => Math.max(0, n - 1));
    setSelectedIds((prev) => {
      if (!prev.has(photoId)) return prev;
      const next = new Set(prev);
      next.delete(photoId);
      return next;
    });
  }, []);

  const removeManyLocally = useCallback((photoIds: string[]) => {
    if (photoIds.length === 0) return;
    const idSet = new Set(photoIds);
    setGroups((prev) => {
      const next: QueueGroup[] = [];
      for (const g of prev) {
        const remaining = g.photos.filter((p) => !idSet.has(p.id));
        if (remaining.length > 0) {
          next.push({ ...g, photos: remaining, pendingCount: remaining.length });
        }
      }
      return next;
    });
    setPendingCount((n) => Math.max(0, n - photoIds.length));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of photoIds) next.delete(id);
      return next;
    });
  }, []);

  const postModerate = useCallback(
    async (
      businessId: string,
      photoId: string,
      action: "approve" | "reject" | "flag",
      reason?: string
    ): Promise<{ ok: true; emailStatus?: string } | { ok: false; error: string }> => {
      const res = await fetch(
        `/api/admin/businesses/${encodeURIComponent(businessId)}/photos/${encodeURIComponent(photoId)}/moderate`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, reason }),
        }
      );
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        emailStatus?: string;
      };
      if (!res.ok) {
        return { ok: false, error: body.error ?? "Moderation failed" };
      }
      return { ok: true, emailStatus: body.emailStatus };
    },
    []
  );

  const moderate = useCallback(
    async (
      group: QueueGroup,
      photo: QueuePhoto,
      action: "approve" | "reject" | "flag",
      reason?: string
    ) => {
      setBusyId(photo.id);
      setFlash(null);
      try {
        const result = await postModerate(group.businessId, photo.id, action, reason);
        if (!result.ok) {
          setFlash({ type: "error", text: result.error });
          return;
        }

        let suffix = "";
        if (action === "reject") {
          if (result.emailStatus === "sent") suffix = ", owner notified by email";
          else if (result.emailStatus === "no_owner_email")
            suffix = ", no owner email on file";
        }
        setFlash({
          type: "success",
          text: `Photo ${action}d${suffix}.`,
        });
        removePhotoLocally(photo.id);
        void load(true);
      } catch (e) {
        setFlash({
          type: "error",
          text: e instanceof Error ? e.message : "Moderation failed",
        });
      } finally {
        setBusyId(null);
      }
    },
    [load, postModerate, removePhotoLocally]
  );

  const openReject = (group: QueueGroup, photo: QueuePhoto) => {
    setRejecting({ group, photo });
    setRejectReasonPreset(REJECT_REASONS[0]);
    setRejectReasonCustom("");
  };

  // Hard-delete removes the DB row + storage object. Frees a slot under
  // the business's plan cap (the cap is enforced at INSERT time only), so
  // the owner immediately gets the upload credit back.
  const postDeletePhoto = useCallback(
    async (
      businessId: string,
      photoId: string
    ): Promise<
      { ok: true; storageCleanup?: string } | { ok: false; error: string }
    > => {
      const res = await fetch(
        `/api/admin/businesses/${encodeURIComponent(businessId)}/photos/${encodeURIComponent(photoId)}`,
        { method: "DELETE", credentials: "same-origin" }
      );
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        storageCleanup?: string;
      };
      if (!res.ok) {
        return { ok: false, error: body.error ?? "Delete failed" };
      }
      return { ok: true, storageCleanup: body.storageCleanup };
    },
    []
  );

  const deletePhoto = useCallback(
    async (group: QueueGroup, photo: QueuePhoto) => {
      setBusyId(photo.id);
      setFlash(null);
      try {
        const result = await postDeletePhoto(group.businessId, photo.id);
        if (!result.ok) {
          setFlash({ type: "error", text: result.error });
          return;
        }
        const cleanupSuffix =
          result.storageCleanup === "failed"
            ? ", storage file kept (logged for cleanup)"
            : "";
        setFlash({
          type: "success",
          text: `Photo deleted, slot returned to the business${cleanupSuffix}.`,
        });
        removePhotoLocally(photo.id);
        void load(true);
      } catch (e) {
        setFlash({
          type: "error",
          text: e instanceof Error ? e.message : "Delete failed",
        });
      } finally {
        setBusyId(null);
      }
    },
    [load, postDeletePhoto, removePhotoLocally]
  );

  const bulkApprove = useCallback(async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (
      !window.confirm(
        `Approve ${ids.length} selected photo${ids.length === 1 ? "" : "s"}? They will go live immediately.`
      )
    ) {
      return;
    }
    setBulkBusy("approve");
    setFlash(null);
    const succeeded: string[] = [];
    const failures: string[] = [];
    for (const id of ids) {
      const row = photoLookup.get(id);
      if (!row) continue;
      const r = await postModerate(row.group.businessId, id, "approve");
      if (r.ok) succeeded.push(id);
      else failures.push(`${id.slice(0, 8)}…: ${r.error}`);
    }
    if (succeeded.length) removeManyLocally(succeeded);
    if (failures.length === 0) {
      setFlash({
        type: "success",
        text: `Approved ${succeeded.length} photo${succeeded.length === 1 ? "" : "s"}.`,
      });
    } else {
      setFlash({
        type: succeeded.length ? "success" : "error",
        text:
          `Approved ${succeeded.length}, failed ${failures.length}. ` +
          failures.slice(0, 3).join(" · ") +
          (failures.length > 3 ? " …" : ""),
      });
    }
    void load(true);
    setBulkBusy(null);
  }, [photoLookup, postModerate, removeManyLocally, selectedIds, load]);

  const bulkDelete = useCallback(async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (
      !window.confirm(
        `Permanently delete ${ids.length} selected photo${ids.length === 1 ? "" : "s"}? This cannot be undone. Slots return to each business.`
      )
    ) {
      return;
    }
    setBulkBusy("delete");
    setFlash(null);
    const succeeded: string[] = [];
    const failures: string[] = [];
    for (const id of ids) {
      const row = photoLookup.get(id);
      if (!row) continue;
      const r = await postDeletePhoto(row.group.businessId, id);
      if (r.ok) succeeded.push(id);
      else failures.push(`${id.slice(0, 8)}…: ${r.error}`);
    }
    if (succeeded.length) removeManyLocally(succeeded);
    if (failures.length === 0) {
      setFlash({
        type: "success",
        text: `Deleted ${succeeded.length} photo${succeeded.length === 1 ? "" : "s"}.`,
      });
    } else {
      setFlash({
        type: succeeded.length ? "success" : "error",
        text:
          `Deleted ${succeeded.length}, failed ${failures.length}. ` +
          failures.slice(0, 3).join(" · ") +
          (failures.length > 3 ? " …" : ""),
      });
    }
    void load(true);
    setBulkBusy(null);
  }, [photoLookup, postDeletePhoto, removeManyLocally, selectedIds, load]);

  const confirmRejectBulk = useCallback(async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    const reason =
      rejectReasonPreset === "Other / custom"
        ? rejectReasonCustom.trim()
        : rejectReasonPreset;
    if (!reason) {
      setFlash({
        type: "error",
        text: "Please enter a custom rejection reason.",
      });
      return;
    }
    setBulkRejecting(false);
    setBulkBusy("reject");
    setFlash(null);
    const succeeded: string[] = [];
    const failures: string[] = [];
    for (const id of ids) {
      const row = photoLookup.get(id);
      if (!row) continue;
      const r = await postModerate(row.group.businessId, id, "reject", reason);
      if (r.ok) succeeded.push(id);
      else failures.push(`${id.slice(0, 8)}…: ${r.error}`);
    }
    if (succeeded.length) removeManyLocally(succeeded);
    if (failures.length === 0) {
      setFlash({
        type: "success",
        text: `Rejected ${succeeded.length} photo${succeeded.length === 1 ? "" : "s"} (owners emailed when an address is on file).`,
      });
    } else {
      setFlash({
        type: succeeded.length ? "success" : "error",
        text:
          `Rejected ${succeeded.length}, failed ${failures.length}. ` +
          failures.slice(0, 3).join(" · ") +
          (failures.length > 3 ? " …" : ""),
      });
    }
    void load(true);
    setBulkBusy(null);
  }, [
    photoLookup,
    postModerate,
    removeManyLocally,
    rejectReasonCustom,
    rejectReasonPreset,
    selectedIds,
    load,
  ]);

  const confirmReject = async () => {
    if (!rejecting) return;
    const reason =
      rejectReasonPreset === "Other / custom"
        ? rejectReasonCustom.trim()
        : rejectReasonPreset;
    if (!reason) {
      setFlash({
        type: "error",
        text: "Please enter a custom rejection reason.",
      });
      return;
    }
    const { group, photo } = rejecting;
    setRejecting(null);
    await moderate(group, photo, "reject", reason);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-800">
          {pendingCount} pending
        </span>
        <span className="text-xs text-neutral-500">
          {totalBusinesses} business{totalBusinesses === 1 ? "" : "es"} awaiting review
        </span>
        <button
          type="button"
          onClick={() => void load(false)}
          disabled={loading}
          className="ml-auto inline-flex items-center rounded-md border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {flash ? (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            flash.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
          role="status"
          aria-live="polite"
        >
          {flash.text}
        </div>
      ) : null}

      {selectedCount > 0 ? (
        <div
          className="sticky top-0 z-20 flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white/95 p-3 shadow-md backdrop-blur sm:flex-row sm:flex-wrap sm:items-center"
          role="region"
          aria-label="Bulk actions"
        >
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-neutral-900">
              {selectedCount} selected
            </span>
            <span className="text-xs text-neutral-500">
              (max {MAX_ADMIN_BULK_SELECTION} at a time)
            </span>
            <button
              type="button"
              onClick={clearSelection}
              disabled={bulkBusy !== null}
              className="text-xs font-medium text-neutral-600 underline-offset-2 hover:underline disabled:opacity-50"
            >
              Clear selection
            </button>
          </div>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <button
              type="button"
              disabled={bulkBusy !== null}
              onClick={() => void bulkApprove()}
              className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {bulkBusy === "approve" ? "Approving…" : "Bulk approve"}
            </button>
            <button
              type="button"
              disabled={bulkBusy !== null}
              onClick={() => {
                setRejecting(null);
                setRejectReasonPreset(REJECT_REASONS[0]);
                setRejectReasonCustom("");
                setBulkRejecting(true);
              }}
              className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-900 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {bulkBusy === "reject" ? "Rejecting…" : "Bulk reject"}
            </button>
            <button
              type="button"
              disabled={bulkBusy !== null}
              onClick={() => void bulkDelete()}
              className="inline-flex items-center rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {bulkBusy === "delete" ? "Deleting…" : "Bulk delete"}
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {loading && groups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 py-10 text-center text-sm text-neutral-500">
          Loading queue…
        </div>
      ) : null}

      {!loading && groups.length === 0 && !error ? (
        <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 py-10 text-center text-sm text-neutral-600">
          <p className="font-medium text-neutral-800">All clear.</p>
          <p className="mt-1 text-xs text-neutral-500">
            Nothing is waiting on admin review. The sidebar notification will stay off
            until a business publishes new photos.
          </p>
        </div>
      ) : null}

      {groups.length > 0 ? (
        <ul className="space-y-6">
          {groups.map((group) => (
            <li
              key={group.businessId}
              className="rounded-xl border border-neutral-200 bg-white"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/businesses/${group.businessId}`}
                      className="truncate text-sm font-semibold text-neutral-900 hover:underline"
                    >
                      {group.businessName?.trim() || "Untitled business"}
                    </Link>
                    <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-800">
                      {group.pendingCount} pending
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {group.ownerEmail ? (
                      <>
                        Owner:{" "}
                        <span className="font-medium text-neutral-700">
                          {group.ownerName || group.ownerEmail}
                        </span>{" "}
                        ({group.ownerEmail})
                      </>
                    ) : (
                      <span className="text-amber-700">
                        No claimed owner, rejection emails will be skipped.
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={bulkBusy !== null || group.photos.length === 0}
                    onClick={() => selectAllInGroup(group)}
                    className="inline-flex items-center rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Select all in group
                  </button>
                  {group.businessSlug ? (
                    <Link
                      href={`/b/${group.businessSlug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      View public page ↗
                    </Link>
                  ) : null}
                  <Link
                    href={`/admin/businesses/${group.businessId}`}
                    className="inline-flex items-center rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    Open business
                  </Link>
                </div>
              </div>

              <ul className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.photos.map((p) => {
                  const rowBusy = busyId === p.id;
                  const panelLocked = busyId !== null || bulkBusy !== null;
                  const isSelected = selectedIds.has(p.id);
                  return (
                    <li
                      key={p.id}
                      className={`flex flex-col overflow-hidden rounded-lg border ${
                        isSelected
                          ? "border-[#1FAF9E] ring-2 ring-[#1FAF9E]/30"
                          : "border-neutral-200"
                      }`}
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
                        <label className="absolute bottom-2 left-2 z-10 flex cursor-pointer items-center gap-1.5 rounded-md bg-white/95 px-2 py-1 text-[11px] font-medium text-neutral-800 shadow ring-1 ring-black/5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={
                              panelLocked ||
                              (!isSelected && selectionAtCap)
                            }
                            onChange={() => toggleSelected(p.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-3.5 w-3.5 rounded border-neutral-300"
                            aria-label={`Select photo ${p.id.slice(0, 8)}`}
                          />
                          Select
                        </label>
                        <button
                          type="button"
                          onClick={() => setPreviewing(p)}
                          className="relative block h-full w-full overflow-hidden text-left"
                          title="Click to preview full-size"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.url}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        </button>
                        <span className="pointer-events-none absolute left-2 top-2 inline-flex rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-800">
                          Pending
                        </span>
                        {p.is_live ? (
                          <span className="pointer-events-none absolute right-2 top-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                            Live
                          </span>
                        ) : null}
                        {p.is_suspected_collage ? (
                          <span className="pointer-events-none absolute bottom-2 right-2 inline-flex rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-800">
                            Collage?
                            {typeof p.collage_score === "number"
                              ? ` ${(p.collage_score * 100).toFixed(0)}%`
                              : ""}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex flex-1 flex-col gap-2 p-3 text-xs text-neutral-500">
                        <div>
                          <span className="font-medium text-neutral-700">Section:</span>{" "}
                          {p.section || "gallery"}
                        </div>
                        <div>
                          <span className="font-medium text-neutral-700">Uploaded:</span>{" "}
                          {formatDateTime(p.created_at)}
                        </div>
                        {p.published_at ? (
                          <div>
                            <span className="font-medium text-neutral-700">
                              Published:
                            </span>{" "}
                            {formatDateTime(p.published_at)}
                          </div>
                        ) : null}

                        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            disabled={rowBusy || bulkBusy !== null}
                            onClick={() => void moderate(group, p, "approve")}
                            className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {rowBusy ? "…" : "Approve"}
                          </button>
                          <button
                            type="button"
                            disabled={rowBusy || bulkBusy !== null}
                            onClick={() => openReject(group, p)}
                            className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-800 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            disabled={rowBusy || bulkBusy !== null}
                            onClick={() => setDeleting({ group, photo: p })}
                            className="inline-flex items-center rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Hard-delete this photo and return the slot to the business"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewing(p)}
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
            </li>
          ))}
        </ul>
      ) : null}

      {totalPhotosInView === 0 && pendingCount > 0 && !loading ? (
        <p className="text-xs text-neutral-500">
          The queue reports {pendingCount} pending photo{pendingCount === 1 ? "" : "s"} server-side.
          Refresh to reload.
        </p>
      ) : null}

      {/* ---------- Preview lightbox ---------- */}
      {previewing ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewing(null)}
        >
          <div
            className="relative max-h-[92vh] max-w-[92vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewing.url}
              alt=""
              className="max-h-[92vh] max-w-[92vw] rounded-lg object-contain shadow-xl"
            />
            <button
              type="button"
              onClick={() => setPreviewing(null)}
              className="absolute right-2 top-2 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-neutral-900 shadow hover:bg-white"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      {/* ---------- Reject modal ---------- */}
      {rejecting ? (
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
              Pick the reason. The owner will be emailed a short note
              referencing Tellacity&apos;s photo guidelines, and the photo will
              be pulled down from the public page immediately.
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
                onClick={() => setRejecting(null)}
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

      {/* ---------- Bulk reject modal ---------- */}
      {bulkRejecting ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[1010] flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-neutral-900">
              Reject {selectedCount} photo{selectedCount === 1 ? "" : "s"}
            </h3>
            <p className="mt-1 text-sm text-neutral-600">
              The same reason is applied to every selected photo. Each owner
              with an email on file is notified separately. Photos are pulled
              from public pages immediately.
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
                placeholder="Describe the reason (shown to each business owner in the email)"
                rows={3}
                className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
              />
            ) : null}
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setBulkRejecting(false)}
                disabled={bulkBusy !== null}
                className="inline-flex items-center rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkBusy !== null}
                onClick={() => void confirmRejectBulk()}
                className="inline-flex items-center rounded-md border border-rose-200 bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {bulkBusy === "reject" ? "Rejecting…" : "Reject all & notify owners"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ---------- Delete confirm modal ---------- */}
      {deleting ? (
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
              business dashboard, and this admin queue. The storage file is
              also deleted. The business gets its photo slot back and can
              upload a replacement right away.
            </p>
            <div className="mt-3 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={deleting.photo.url}
                alt=""
                className="block max-h-48 w-full object-cover"
              />
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="inline-flex items-center rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = deleting;
                  setDeleting(null);
                  void deletePhoto(target.group, target.photo);
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
