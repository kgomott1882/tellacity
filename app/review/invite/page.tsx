import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import InviteReviewFlow from "./InviteReviewFlow";
import { getServerEnv } from "@/lib/serverEnv";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm max-w-md w-full text-center">
        <h1 className="text-xl font-semibold text-gray-900">Unable to open invite</h1>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
}

type InviteRow = {
  id: string;
  business_id: string;
  recipient_email?: string | null;
  review_submitted_at?: string | null;
  opened_at?: string | null;
  expires_at?: string | null;
};

function parseRatingParam(raw: string | undefined): number | undefined {
  if (raw == null || raw === "") return undefined;
  const n = Number.parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n < 1 || n > 5) return undefined;
  return n;
}

export default async function InvitePage(props: {
  searchParams: Promise<{ token?: string; rating?: string }>;
}) {
  const searchParams = await props.searchParams;
  const rawToken = searchParams.token;
  const token = typeof rawToken === "string" ? rawToken.trim() : "";
  const initialRating = parseRatingParam(
    typeof searchParams.rating === "string" ? searchParams.rating : undefined,
  );

  if (!token) {
    return <ErrorState message="Missing invite token" />;
  }

  let supabase: ReturnType<typeof createClient>;
  try {
    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    supabase = createClient(supabaseUrl, serviceRoleKey);
  } catch {
    return <ErrorState message="Invalid invite link" />;
  }

  const { data, error } = await supabase
    .from("review_invites")
    .select("*")
    .eq("token", token.trim())
    .maybeSingle();

  if (error) {
    console.error("Invite lookup error:", error);
    return <ErrorState message="Invalid invite link" />;
  }

  if (!data) {
    return <ErrorState message="Invalid invite link" />;
  }

  const invite = data as InviteRow;

  if (invite.review_submitted_at) {
    return <ErrorState message="This invite has already been used." />;
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return <ErrorState message="Invite expired" />;
  }

  const businessId = invite.business_id;
  if (typeof businessId !== "string" || !businessId) {
    return <ErrorState message="Invalid invite link" />;
  }

  const { data: biz } = await supabase
    .from("businesses")
    .select("name, slug")
    .eq("id", businessId)
    .maybeSingle();

  const businessName =
    biz && typeof biz === "object" && "name" in biz
      ? (biz as { name: string | null }).name
      : null;
  const businessSlug =
    biz && typeof biz === "object" && "slug" in biz
      ? (biz as { slug: string | null }).slug
      : null;

  const inviteId = invite.id;
  if (typeof inviteId !== "string" || !inviteId) {
    return <ErrorState message="Invalid invite link" />;
  }

  // Mark as opened (timestamp only). Do not change invite status.
  if (invite.opened_at == null) {
    try {
      const sb = supabase as any;
      await sb.from("review_invites").update({ opened_at: new Date().toISOString() }).eq("id", inviteId);
    } catch {
      // If `opened_at` isn't present in the current schema, ignore.
    }
  }

  const recipientEmail = String(invite.recipient_email ?? "").trim();
  if (!recipientEmail) {
    return <ErrorState message="Invalid invite link" />;
  }

  return (
    <InviteReviewFlow
      inviteId={inviteId}
      initialBusinessId={businessId}
      initialBusinessSlug={businessSlug}
      initialBusinessName={businessName}
      reviewerEmail={recipientEmail}
      initialRating={initialRating}
    />
  );
}
