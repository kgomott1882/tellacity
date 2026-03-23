"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { ensureSessionFresh } from "@/lib/ensureSessionFresh";

// ─── Types ────────────────────────────────────────────────────────────────────

type Invite = {
  recipient_email: string | null;
  channel:         string | null;
  status:          string | null;
  sent_at:         string | null;
  created_at:      string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    const day   = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year  = d.getFullYear();
    const h     = String(d.getHours()).padStart(2, "0");
    const m     = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${h}:${m}`;
  } catch {
    return "-";
  }
}

function formatChannel(raw: string | null | undefined): string {
  if (!raw) return "-";
  const s = raw.toLowerCase();
  if (s === "email") return "Email";
  if (s === "qr")    return "QR";
  if (s === "api")   return "API";
  return raw;
}

function StatusBadge({ status }: { status: string | null }) {
  const s = (status ?? "draft").toLowerCase();
  const styles: Record<string, string> = {
    sent:   "bg-green-500/10 text-green-400 border border-green-500/20",
    opened: "bg-teal-500/10 text-teal-400 border border-teal-500/20",
    draft:  "bg-white/10 text-white/60 border border-white/10",
    failed: "bg-red-500/10 text-red-400 border border-red-500/20",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        styles[s] ?? styles.draft
      }`}
    >
      {s}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RecentReviewInvitesCard({ businessId }: { businessId: string | null }) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) { setLoading(false); return; }

    let cancelled = false;
    (async () => {
      await ensureSessionFresh();
      if (cancelled) return;

    supabaseBrowser()
      .from("review_invites")
      .select("recipient_email, channel, status, sent_at, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error("[RecentReviewInvitesCard]", error.message);
        setInvites((data as Invite[]) ?? []);
        setLoading(false);
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Recent Review Invites</h3>
          <p className="mt-0.5 text-xs text-neutral-600">Latest outreach activity.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      ) : invites.length === 0 ? (
        <p className="py-4 text-center text-sm text-white/40">No recent invites.</p>
      ) : (
        <div className="space-y-3">
          {invites.map((invite, i) => {
            // sent_at is set when actually dispatched; fall back to created_at
            const displayDate = invite.sent_at ?? invite.created_at;
            return (
              <div
                key={i}
                className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <p className="truncate text-sm text-white">
                    {invite.recipient_email ?? "-"}
                  </p>
                  <p className="mt-0.5 text-xs text-white/40">
                    {formatChannel(invite.channel)} &bull; {formatDate(displayDate)}
                  </p>
                </div>
                <StatusBadge status={invite.status} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
