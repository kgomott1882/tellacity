"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { dashboardApiGet } from "@/lib/dashboardApiFetch";

const INVITES_SENT_OVERVIEW =
  "/business/dashboard/get-reviews/overview#invites-sent";

type InviteRow = {
  id: string;
  recipient_email: string | null;
  sent_at: string | null;
  opened_at: string | null;
  review_submitted_at: string | null;
  expires_at: string | null;
  status: string | null;
};

type InviteDisplay = InviteRow & { statusLabel: string };

function statusLabelForInvite(invite: InviteRow): string {
  const now = new Date();

  if (invite.review_submitted_at) {
    return "Completed";
  }
  if (invite.expires_at && new Date(invite.expires_at) < now) {
    return "Expired";
  }
  if (invite.opened_at) {
    return "Opened";
  }

  return "Pending";
}

function InviteSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-14 animate-pulse rounded-lg bg-neutral-700/50" />
      ))}
    </div>
  );
}

export function RecentReviewInvitesCard({ businessId }: { businessId: string | null }) {
  const [invites, setInvites] = useState<InviteDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const invitesRef = useRef<InviteDisplay[]>([]);
  const lastFetchedBusinessIdRef = useRef<string | null>(null);

  useEffect(() => {
    invitesRef.current = invites;
  }, [invites]);

  const fetchInvites = useCallback(async (options?: { retry?: boolean }) => {
    if (!businessId) {
      return;
    }

    const switchingBusiness = lastFetchedBusinessIdRef.current !== businessId;
    if (switchingBusiness) {
      lastFetchedBusinessIdRef.current = businessId;
      setInvites([]);
    }

    const hadRows = switchingBusiness ? false : invitesRef.current.length > 0;
    if (options?.retry || !hadRows) {
      setLoading(true);
    }
    if (options?.retry) {
      setError(null);
    }

    try {
      const path = `/api/review-invites/sent?businessId=${encodeURIComponent(
        businessId
      )}&limit=5`;
      const json = await dashboardApiGet<{
        items?: InviteRow[];
        error?: string;
      }>(path);

      const rows = (json.items ?? []) as InviteRow[];
      setInvites(
        rows.map((invite) => ({
          ...invite,
          statusLabel: statusLabelForInvite(invite),
        }))
      );
      setError(null);
    } catch (err) {
      console.warn(
        "[RecentReviewInvitesCard]",
        err instanceof Error ? err.message : err
      );
      setError("Failed to load invites");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      setInvites([]);
      setError(null);
      return;
    }
    void fetchInvites();
  }, [businessId, fetchInvites]);

  return (
    <div className="rounded-xl border border-neutral-700 bg-neutral-800 p-6">
      <div className="mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Recent Review Invites
        </h3>
        <p className="mt-0.5 text-xs text-neutral-500">Latest outreach for this business.</p>
      </div>

      {loading ? (
        <InviteSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <p className="text-center text-sm text-red-400/90">{error}</p>
          <button
            type="button"
            onClick={() => void fetchInvites({ retry: true })}
            disabled={loading}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-neutral-600 bg-neutral-900/60 text-neutral-100 transition hover:border-[#2fb2a8]/60 hover:bg-neutral-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2fb2a8] disabled:pointer-events-none disabled:opacity-50"
            aria-label="Reload invites"
          >
            <RefreshCw
              className={`h-5 w-5 ${loading ? "animate-spin" : ""}`}
              aria-hidden
            />
          </button>
          <span className="text-xs text-neutral-500">Tap to retry</span>
        </div>
      ) : !invites.length ? (
        <p className="py-6 text-center text-sm text-neutral-400">No invites sent yet</p>
      ) : (
        <div className="space-y-2">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="invite-row flex flex-col gap-1 rounded-lg border border-neutral-700/80 bg-neutral-900/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <p className="min-w-0 truncate text-sm font-medium text-neutral-100">
                {invite.recipient_email ?? "-"}
              </p>
              <p className="shrink-0 text-sm text-neutral-300">{invite.statusLabel}</p>
              <p className="shrink-0 text-xs text-neutral-500 sm:text-sm">
                {invite.sent_at
                  ? new Date(invite.sent_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "-"}
              </p>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && (
        <div className="mt-4 border-t border-neutral-700 pt-4 text-center">
          <Link
            href={INVITES_SENT_OVERVIEW}
            className="text-sm font-medium text-[#2fb2a8] transition hover:text-[#26a099]"
          >
            See more
          </Link>
        </div>
      )}
    </div>
  );
}
