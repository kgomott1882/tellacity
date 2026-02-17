"use server";

import { Resend } from "resend";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ActionState = {
  success: boolean;
  message: string;
};

export async function submitInvestorContactForm(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const subject = String(formData.get("subject") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!name || !email || !subject || !message) {
      return {
        success: false,
        message: "All fields are required.",
      };
    }

    const supabase = createSupabaseServerClient();

    let emailSent = false;
    let dbInserted = false;

    // 1️⃣ Attempt email via Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: "Tellacity <no-reply@tellacity.com>",
          to: "sales@tellacity.com",
          subject: `[Investor Contact] ${subject}`,
          reply_to: email,
          html: `
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, "<br/>")}</p>
          `,
        });

        emailSent = true;
      } catch (err) {
        console.error("Resend error:", err);
      }
    } else {
      console.warn("RESEND_API_KEY not set; skipping contact form email.");
    }

    // 2️⃣ Attempt Supabase insert
    try {
      const { error } = await supabase
        .from("contact_submissions")
        .insert({
          name,
          email,
          subject,
          message,
          source: "investor_relations",
        });

      if (!error) {
        dbInserted = true;
      } else {
        console.error("Contact submission insert error:", error);
      }
    } catch (err) {
      console.error("Database error:", err);
    }

    // 3️⃣ Success if either worked
    if (emailSent || dbInserted) {
      return {
        success: true,
        message: "Your message has been sent successfully.",
      };
    }

    return {
      success: false,
      message:
        "Something went wrong. Please try again or email us directly at sales@tellacity.com.",
    };
  } catch (error) {
    console.error("Unhandled contact form error:", error);

    return {
      success: false,
      message:
        "Something went wrong. Please try again or email us directly at sales@tellacity.com.",
    };
  }
}
