export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/requireAdminApi";
import {
  adminCreateAndClaimBusiness,
  parseAdminManualBusinessFields,
  parseAdminManualOwnerFields,
  parseAdminManualOwnerRequired,
} from "@/lib/admin/adminBusinessManualOps";
import { sendAdminManualClaimPasswordSetupEmail } from "@/lib/admin/sendAdminManualClaimPasswordSetupEmail";

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const fields = parseAdminManualBusinessFields(body);
  if ("error" in fields) {
    return NextResponse.json({ error: fields.error }, { status: 400 });
  }

  const owner = parseAdminManualOwnerFields(body);
  const ownerCheck = parseAdminManualOwnerRequired(owner);
  if (!ownerCheck.ok) {
    return NextResponse.json({ error: ownerCheck.error }, { status: 400 });
  }

  const claimImmediately = body.claimImmediately !== false;
  if (!claimImmediately) {
    return NextResponse.json(
      { error: "Admin create requires claimImmediately (owner assignment)." },
      { status: 400 },
    );
  }

  const result = await adminCreateAndClaimBusiness(auth.admin, fields, owner);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const emailResult = await sendAdminManualClaimPasswordSetupEmail({
    to: owner.email,
    ownerFirstName: owner.firstName,
    businessName: fields.name,
    isNewAccount: result.result.ownerCreated,
  });

  return NextResponse.json({
    ok: true,
    businessId: result.result.businessId,
    slug: result.result.slug,
    ownerUserId: result.result.ownerUserId,
    ownerCreated: result.result.ownerCreated,
    passwordSetupEmailSent: emailResult.ok,
    ...(emailResult.ok ? {} : { emailError: emailResult.error }),
  });
}
