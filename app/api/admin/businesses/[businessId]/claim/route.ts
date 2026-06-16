export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/requireAdminApi";
import {
  adminClaimBusinessForUser,
  parseAdminManualOwnerFields,
  parseAdminManualOwnerRequired,
  resolveOrCreateOwnerUser,
} from "@/lib/admin/adminBusinessManualOps";
import { sendAdminManualClaimPasswordSetupEmail } from "@/lib/admin/sendAdminManualClaimPasswordSetupEmail";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteParams = { params: Promise<{ businessId: string }> };

export async function POST(req: Request, ctx: RouteParams) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const { businessId } = await ctx.params;
  if (!UUID_RE.test(businessId)) {
    return NextResponse.json({ error: "Invalid business id." }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const owner = parseAdminManualOwnerFields(body);
  const ownerCheck = parseAdminManualOwnerRequired(owner);
  if (!ownerCheck.ok) {
    return NextResponse.json({ error: ownerCheck.error }, { status: 400 });
  }

  const { data: biz } = await auth.admin
    .from("businesses")
    .select("id, name")
    .eq("id", businessId)
    .maybeSingle();

  if (!biz) {
    return NextResponse.json({ error: "Business not found." }, { status: 404 });
  }

  const ownerResolved = await resolveOrCreateOwnerUser(auth.admin, owner);
  if (!ownerResolved.ok) {
    return NextResponse.json({ error: ownerResolved.error }, { status: 400 });
  }

  const claim = await adminClaimBusinessForUser(auth.admin, businessId, ownerResolved.userId, {
    businessName: String(biz.name ?? "").trim(),
    owner,
  });
  if (!claim.ok) {
    return NextResponse.json({ error: claim.error }, { status: 400 });
  }

  const emailResult = await sendAdminManualClaimPasswordSetupEmail({
    to: owner.email,
    ownerFirstName: owner.firstName,
    businessName: String(biz.name ?? "").trim(),
    isNewAccount: ownerResolved.created,
  });

  return NextResponse.json({
    ok: true,
    businessId,
    ownerUserId: ownerResolved.userId,
    ownerCreated: ownerResolved.created,
    passwordSetupEmailSent: emailResult.ok,
    ...(emailResult.ok ? {} : { emailError: emailResult.error }),
  });
}
