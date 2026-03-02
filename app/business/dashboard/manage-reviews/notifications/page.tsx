"use client";

import { useEffect, useState } from "react";
import { useBusinessContext } from "../../_context/BusinessContext";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { Bell } from "lucide-react";

type NotificationType = "flag" | "invite" | "moderation";

type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  link?: string;
};

function formatTimestamp(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function getDotColor(type: NotificationType) {
  switch (type) {
    case "flag":
      return "bg-red-500";
    case "invite":
      return "bg-blue-500";
    case "moderation":
      return "bg-orange-500";
    default:
      return "bg-gray-400";
  }
}

export default function GeneralNotificationsPage() {
  const { selectedBusiness } = useBusinessContext();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const businessId = selectedBusiness?.id ?? null;

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!businessId) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [flagsRes, invitesRes, reviewsRes] = await Promise.all([
          supabaseBrowser
            .from("review_flags")
            .select("id, review_id, reason, created_at, resolved_at")
            .eq("business_id", businessId),
          supabaseBrowser
            .from("review_invite_events")
            .select("id, invite_id, event_type, event_at, meta")
            .eq("business_id", businessId),
          supabaseBrowser
            .from("reviews")
            .select("id, status, created_at, updated_at")
            .eq("business_id", businessId),
        ]);

        if (!mounted) return;

        if (flagsRes.error || invitesRes.error || reviewsRes.error) {
          // Log individual errors for diagnostics
          if (flagsRes.error) console.error("review_flags error:", flagsRes.error);
          if (invitesRes.error) console.error("review_invite_events error:", invitesRes.error);
          if (reviewsRes.error) console.error("reviews (moderation) error:", reviewsRes.error);
          setError("Unable to load notifications.");
          setNotifications([]);
          setLoading(false);
          return;
        }

        const flagItems: NotificationItem[] =
          (flagsRes.data ?? []).map((flag: any) => {
            const createdAt = flag.created_at as string;
            const resolvedAt = flag.resolved_at as string | null;

            const statusLabel = resolvedAt ? "Flag resolved" : "Review flagged";
            const description = flag.reason
              ? `Reason: ${flag.reason}`
              : "A review was flagged for moderation.";

            return {
              id: `flag-${flag.id}`,
              type: "flag",
              title: statusLabel,
              description,
              timestamp: resolvedAt ?? createdAt,
              link: `/business/dashboard/manage-reviews/inbox?review=${flag.review_id}`,
            };
          }) ?? [];

        const inviteItems: NotificationItem[] =
          (invitesRes.data ?? []).map((evt: any) => {
            const eventType = (evt.event_type as string | null) ?? "event";
            let title = "Invite activity";

            if (eventType === "sent") title = "Review invite sent";
            else if (eventType === "opened") title = "Review invite opened";
            else if (eventType === "clicked") title = "Review invite link clicked";
            else if (eventType === "bounced") title = "Review invite bounced";

            let description = `Event: ${eventType}`;
            if (evt.meta && typeof evt.meta === "object") {
              const metaSummary = (evt.meta.email as string) || (evt.meta.channel as string);
              if (metaSummary) {
                description += ` · ${metaSummary}`;
              }
            }

            return {
              id: `invite-${evt.id}`,
              type: "invite",
              title,
              description,
              timestamp: evt.event_at as string,
            };
          }) ?? [];

        const moderationItems: NotificationItem[] =
          (reviewsRes.data ?? []).map((review: any) => {
            const status = (review.status as string | null) ?? "updated";
            const ts = (review.updated_at as string | null) ?? (review.created_at as string);

            let title = "Review updated";
            if (status === "published") title = "Review published";
            else if (status === "pending") title = "Review pending review";
            else if (status === "rejected") title = "Review rejected";
            else if (status === "under_review") title = "Review under review";

            const description = `Status: ${status}`;

            return {
              id: `moderation-${review.id}-${ts}`,
              type: "moderation",
              title,
              description,
              timestamp: ts,
              link: `/business/dashboard/manage-reviews/inbox?review=${review.id}`,
            };
          }) ?? [];

        const merged = [...flagItems, ...inviteItems, ...moderationItems].sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setNotifications(merged);
      } catch (err) {
        console.error("General notifications load error:", err);
        if (mounted) {
          setError("Unable to load notifications.");
          setNotifications([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [businessId]);

  if (!selectedBusiness) {
    return (
      <div className="max-w-4xl space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">
          General Notifications
        </h1>
        <p className="text-sm text-gray-500">
          Flags, moderation updates, invite activity and system alerts.
        </p>
        <p className="mt-4 text-sm text-gray-500">No business selected.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          General Notifications
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Flags, moderation updates, invite activity and system alerts.
        </p>
      </div>

      {loading && (
        <div className="space-y-4">
          <div className="h-6 w-40 rounded bg-gray-200 animate-pulse" />
          <div className="h-16 rounded bg-gray-100 animate-pulse" />
          <div className="h-16 rounded bg-gray-100 animate-pulse" />
        </div>
      )}

      {error && !loading && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 rounded-full bg-gray-100 p-3">
            <Bell className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900">No notifications yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Activity and alerts will appear here.
          </p>
        </div>
      )}

      {!loading && !error && notifications.length > 0 && (
        <ul className="space-y-6">
          {notifications.map((item) => (
            <li key={item.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`mt-1 h-2.5 w-2.5 rounded-full ${getDotColor(
                    item.type
                  )}`}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900">
                    {item.title}
                  </p>
                  <span className="text-xs text-gray-400">
                    {formatTimestamp(item.timestamp)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {item.description}
                </p>
                {item.link && (
                  <a
                    href={item.link}
                    className="mt-1 inline-flex text-xs font-medium text-teal-700 hover:underline"
                  >
                    View details
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

