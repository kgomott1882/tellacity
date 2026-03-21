"use server";

import { Resend } from "resend";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ActionState = {
  success: boolean;
  message: string;
};

async function deliverContactChannelEmail(params: {
  to: string;
  channelLabel: string;
  contactRole: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  htmlBodyLines: string[];
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set; skipping contact email.");
    return false;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const htmlList = params.htmlBodyLines
      .map((line) => `<p>${line}</p>`)
      .join("");

    await resend.emails.send({
      from: "Tellacity Support <no-reply@tellacity.com>",
      to: params.to,
      subject: `[${params.channelLabel} · ${params.contactRole}] ${params.subject}`,
      replyTo: params.email,
      html: `
            <p><strong>Name:</strong> ${params.name}</p>
            <p><strong>Email:</strong> ${params.email}</p>
            <p><strong>Channel:</strong> ${params.channelLabel}</p>
            <p><strong>Contacting as:</strong> ${params.contactRole}</p>
            ${htmlList}
            <p><strong>Subject:</strong> ${params.subject}</p>
            <p><strong>Message:</strong></p>
            <p>${params.message.replace(/\n/g, "<br/>")}</p>
          `,
    });

    return true;
  } catch (err) {
    console.error("Resend error:", err);
    return false;
  }
}

export async function submitSalesLeadForm(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const firstName = String(formData.get("first_name") || "").trim();
    const lastName = String(formData.get("last_name") || "").trim();
    const email = String(formData.get("business_email") || "").trim();
    const website = String(formData.get("website") || "").trim();
    const country = String(formData.get("country") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const company = String(formData.get("company_name") || "").trim();
    const jobTitle = String(formData.get("job_title") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (
      !firstName ||
      !lastName ||
      !email ||
      !website ||
      !country ||
      !phone ||
      !company ||
      !jobTitle ||
      !message
    ) {
      return {
        success: false,
        message: "All fields are required.",
      };
    }

    const name = `${firstName} ${lastName}`.trim();
    const subject = `Sales lead: ${company}`;
    const messageForStore = [
      `Website: ${website}`,
      `Country: ${country}`,
      `Phone: ${phone}`,
      `Job title: ${jobTitle}`,
      "",
      message,
    ].join("\n");

    const type = formData.get("type")?.toString()?.trim() || "sales";
    const isSales = type === "sales";
    const recipient = isSales
      ? "sales@tellacity.com"
      : "support@tellacity.com";

    const supabase = createSupabaseServerClient();
    let emailSent = false;
    let dbInserted = false;

    emailSent = await deliverContactChannelEmail({
      to: recipient,
      channelLabel: "Sales",
      contactRole: "Business",
      name,
      email,
      subject,
      message,
      htmlBodyLines: [
        `<strong>Website:</strong> ${website}`,
        `<strong>Country:</strong> ${country}`,
        `<strong>Phone:</strong> ${phone}`,
        `<strong>Company:</strong> ${company}`,
        `<strong>Job title:</strong> ${jobTitle}`,
      ],
    });

    try {
      const { error } = await supabase.from("contact_submissions").insert({
        name,
        email,
        subject,
        message: messageForStore,
        source: "contact_sales",
      });

      if (!error) {
        dbInserted = true;
      } else {
        console.error("Contact submission insert error:", error);
      }
    } catch (err) {
      console.error("Database error:", err);
    }

    if (emailSent || dbInserted) {
      return {
        success: true,
        message: "Your message has been sent successfully.",
      };
    }

    return {
      success: false,
      message: `Something went wrong. Please try again or email us directly at ${
        isSales ? "sales@tellacity.com" : "support@tellacity.com"
      }.`,
    };
  } catch (error) {
    console.error("Unhandled sales lead form error:", error);

    const type = formData.get("type")?.toString()?.trim() || "sales";
    const isSales = type === "sales";

    return {
      success: false,
      message: `Something went wrong. Please try again or email us directly at ${
        isSales ? "sales@tellacity.com" : "support@tellacity.com"
      }.`,
    };
  }
}

export async function submitGeneralContactForm(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const subject = String(formData.get("subject") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const roleRaw = String(formData.get("contact_role") || "").trim();
    const contactRole =
      roleRaw === "business"
        ? "Business"
        : roleRaw === "reviewer"
          ? "Reviewer"
          : "Not specified";
    const type = formData.get("type")?.toString()?.trim() || "support";
    const isSales = type === "sales";
    const recipient = isSales
      ? "sales@tellacity.com"
      : "support@tellacity.com";
    const channelLabel = isSales ? "Sales" : "Support";

    if (!name || !email || !subject || !message) {
      return {
        success: false,
        message: "All fields are required.",
      };
    }

    const supabase = createSupabaseServerClient();

    let emailSent = false;
    let dbInserted = false;

    emailSent = await deliverContactChannelEmail({
      to: recipient,
      channelLabel,
      contactRole,
      name,
      email,
      subject,
      message,
      htmlBodyLines: [],
    });

    // 2️⃣ Insert into Supabase
    try {
      const { error } = await supabase
        .from("contact_submissions")
        .insert({
          name,
          email,
          subject,
          message,
          source: isSales ? "contact_sales" : "contact_support",
        });

      if (!error) {
        dbInserted = true;
      } else {
        console.error("Contact submission insert error:", error);
      }
    } catch (err) {
      console.error("Database error:", err);
    }

    if (emailSent || dbInserted) {
      return {
        success: true,
        message: "Your message has been sent successfully.",
      };
    }

    return {
      success: false,
      message:
        `Something went wrong. Please try again or email us directly at ${isSales ? "sales@tellacity.com" : "support@tellacity.com"}.`,
    };
  } catch (error) {
    console.error("Unhandled contact form error:", error);

    const type = formData.get("type")?.toString()?.trim() || "support";
    const isSales = type === "sales";

    return {
      success: false,
      message: `Something went wrong. Please try again or email us directly at ${
        isSales ? "sales@tellacity.com" : "support@tellacity.com"
      }.`,
    };
  }
}
