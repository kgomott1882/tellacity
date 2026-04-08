import { NextResponse } from "next/server";

/**
 * Team membership is completed via POST /api/business/team-access/verify-and-accept
 * after the user enters the 6-digit email code. Direct acceptance without OTP is disabled.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Complete your invitation using the 6-digit verification code sent to your email (verify-and-accept flow).",
    },
    { status: 410 }
  );
}
