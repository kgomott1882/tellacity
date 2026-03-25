"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseBrowser";

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
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [invites, setInvites] = useState<InviteDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const invitesRef = useRef<InviteDisplay[]>([]);
  const lastFetchedBusinessIdRef = useRef<string | null>(null);

  const userId = session?.user?.id;

  useEffect(() => {
    invitesRef.current = invites;
  }, [invites]);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthChecked(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchInvites = useCallback(async () => {
    if (!businessId || !userId) {
      return;
    }

    const switchingBusiness = lastFetchedBusinessIdRef.current !== businessId;
    if (switchingBusiness) {
      lastFetchedBusinessIdRef.current = businessId;
      setInvites([]);
    }

    const hadRows = switchingBusiness ? false : invitesRef.current.length > 0;
    if (!hadRows) {
      setLoading(true);
    }

    try {
      const { data, error: queryError } = await supabase
        .from("review_invites")
        .select(
          "id, recipient_email, sent_at, opened_at, review_submitted_at, expires_at, status"
        )
        .eq("business_id", businessId)
        .order("sent_at", { ascending: false })
        .limit(5);

      if (queryError) {
        setError("Failed to load invites");
        return;
      }

      const rows = (data ?? []) as InviteRow[];
      setInvites(
        rows.map((invite) => ({
          ...invite,
          statusLabel: statusLabelForInvite(invite),
        }))
      );
      setError(null);
    } catch (err) {
      console.error("RecentReviewInvitesCard:", err);
      setError("Unexpected error");
    } finally {
      setLoading(false);
    }
  }, [businessId, userId]);

  useEffect(() => {
    if (!authChecked) {
      return;
    }
    if (!businessId || !userId) {
      setLoading(false);
      return;
    }
    void fetchInvites();
  }, [authChecked, businessId, userId, fetchInvites]);

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
        <p className="py-4 text-center text-sm text-red-400/90">{error}</p>
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
                {invite.recipient_email ?? "—"}
              </p>
              <p className="shrink-0 text-sm text-neutral-300">{invite.statusLabel}</p>
              <p className="shrink-0 text-xs text-neutral-500 sm:text-sm">
                {invite.sent_at
                  ? new Date(invite.sent_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
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
