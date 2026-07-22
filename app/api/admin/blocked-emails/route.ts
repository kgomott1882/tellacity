export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  adminBlockEmailAndPurge,
  adminBlockGuestNameAndPurge,
  adminUnblockEmail,
  adminUnblockGuestName,
  listBlockedEmails,
  listBlockedGuestNames,
  normalizeBlockEmail,
  normalizeBlockGuestName,
  purgePublishedContentForEmail,
  purgePublishedContentForGuestName,
  recordBlockedEmailPurgeCounts,
} from "@/lib/blockedEmails";
import { requireAdminApi } from "@/lib/admin/requireAdminApi";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const [emails, names] = await Promise.all([
    listBlockedEmails(auth.admin),
    listBlockedGuestNames(auth.admin),
  ]);

  if (emails.error && names.error) {
    return NextResponse.json(
      { error: emails.error, rows: [], guestNameRows: [] },
      { status: 500 },
    );
  }

  return NextResponse.json({
    rows: emails.rows,
    guestNameRows: names.rows,
    error: emails.error ?? names.error,
  });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json().catch(() => null)) as {
    email?: string;
    guestName?: string;
    guest_name?: string;
    reason?: string;
    notes?: string;
    /** When true, only purge content for an already-blocked email (no new block insert required). */
    purgeOnly?: boolean;
  } | null;

  const guestName = normalizeBlockGuestName(body?.guestName ?? body?.guest_name);
  const email = normalizeBlockEmail(body?.email);

  if (body?.purgeOnly === true && email) {
    const purged = await purgePublishedContentForEmail(email);
    if (!purged.ok) {
      return NextResponse.json({ error: purged.error }, { status: 400 });
    }
    try {
      const { supabaseUrl, serviceRoleKey } = getServerEnv();
      const admin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      await recordBlockedEmailPurgeCounts(
        admin,
        purged.email,
        purged.deletedReviews,
        purged.deletedDrafts,
        purged.deletedOtps,
      );
    } catch {
      /* count update best-effort */
    }
    return NextResponse.json({
      ok: true,
      kind: "purge_email",
      email: purged.email,
      deletedReviews: purged.deletedReviews,
      deletedDrafts: purged.deletedDrafts,
      deletedOtps: purged.deletedOtps,
    });
  }

  if (body?.purgeOnly === true && guestName) {
    const purged = await purgePublishedContentForGuestName(guestName);
    if (!purged.ok) {
      return NextResponse.json({ error: purged.error }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      kind: "purge_guest_name",
      guestName: purged.guestName,
      deletedReviews: purged.deletedReviews,
      deletedDrafts: purged.deletedDrafts,
    });
  }

  if (guestName && !email) {
    const result = await adminBlockGuestNameAndPurge({
      guestName,
      reason: body?.reason ?? null,
      notes: body?.notes ?? null,
      createdBy: auth.userId,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      kind: "guest_name",
      guestName: result.guestName,
      deletedReviews: result.deletedReviews,
      deletedDrafts: result.deletedDrafts,
    });
  }

  if (!email) {
    return NextResponse.json(
      { error: "Email or guest name is required." },
      { status: 400 },
    );
  }

  const result = await adminBlockEmailAndPurge({
    email,
    reason: body?.reason ?? null,
    notes: body?.notes ?? null,
    createdBy: auth.userId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Also purge body/title mentions of this scam email (covers Rebecca-style null-email rows)
  // Already included in purge_content_for_email_service via title/body LIKE.

  return NextResponse.json({
    ok: true,
    kind: "email",
    email: result.email,
    deletedReviews: result.deletedReviews,
    deletedDrafts: result.deletedDrafts,
    deletedOtps: result.deletedOtps,
    authUsersBanned: result.authUsersBanned,
  });
}

export async function DELETE(req: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const body = (await req.json().catch(() => null)) as {
    email?: string;
    guestName?: string;
    guest_name?: string;
  } | null;

  const guestName = normalizeBlockGuestName(
    url.searchParams.get("guestName") ??
      url.searchParams.get("guest_name") ??
      body?.guestName ??
      body?.guest_name,
  );
  const email = normalizeBlockEmail(url.searchParams.get("email") ?? body?.email);

  if (guestName && !email) {
    const result = await adminUnblockGuestName(guestName);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, kind: "guest_name", guestName: result.guestName });
  }

  if (!email) {
    return NextResponse.json({ error: "Email or guest name is required." }, { status: 400 });
  }

  const result = await adminUnblockEmail(email);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, kind: "email", email: result.email });
}
