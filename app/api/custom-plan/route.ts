import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      fullName,
      companyName,
      email,
      volume,
      message,
    }: {
      fullName?: string;
      companyName?: string;
      email?: string;
      volume?: string;
      message?: string;
    } = body || {};

    if (!fullName || !companyName || !email) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Email service not configured." },
        { status: 500 }
      );
    }

    const html = `
      <h2>New Custom Plan Request — Tellacity</h2>
      <p><strong>Full Name:</strong> ${fullName}</p>
      <p><strong>Company Name:</strong> ${companyName}</p>
      <p><strong>Work Email:</strong> ${email}</p>
      <p><strong>Estimated Monthly Review Volume:</strong> ${volume || "Not specified"}</p>
      <p><strong>Message:</strong></p>
      <p>${message || "No additional message provided."}</p>
    `;

    const resend = new Resend(process.env.RESEND_API_KEY!);

    await resend.emails.send({
      from: "Tellacity Custom Plan <notifications@tellacity.com>",
      to: ["sales@tellacity.com"],
      replyTo: email,
      subject: "New Custom Plan Request — Tellacity",
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Custom plan request failed", error);
    return NextResponse.json(
      { error: "Failed to send custom plan request." },
      { status: 500 }
    );
  }
}

