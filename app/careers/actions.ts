"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CareerApplyState = {
  error?: string;
  success?: boolean;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt"];
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/octet-stream", // some browsers send this for PDFs
];

function hasAllowedExtension(name: string): boolean {
  const lower = name.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function validateFile(file: File | null, required: boolean): string | null {
  if (!file || (typeof file.size === "number" && file.size === 0))
    return required ? "Resume is required." : null;
  if (file.size > MAX_FILE_SIZE) return "File must be 5MB or less.";
  const name = file.name || "";
  const validType =
    !file.type ||
    file.type === "application/octet-stream" ||
    ALLOWED_MIME_TYPES.includes(file.type);
  const validName = hasAllowedExtension(name);
  if (!validType && !validName)
    return "Accepted formats: PDF, DOC, DOCX, TXT.";
  if (validType || validName) return null;
  return "Accepted formats: PDF, DOC, DOCX, TXT.";
}

async function sendApplicationEmail(params: {
  to: string;
  jobTitle: string;
  fullName: string;
  email: string;
  phone: string | null;
  linkedin: string | null;
  message: string | null;
  resumeFilename: string | null;
  resumeBase64?: string;
  coverFilename: string | null;
  coverBase64?: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "Tellacity <no-reply@tellacity.com>";
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set; skipping career application email.");
    return false;
  }

  const body = [
    `New career application: ${params.jobTitle}`,
    "",
    `Name: ${params.fullName}`,
    `Email: ${params.email}`,
    params.phone ? `Phone: ${params.phone}` : null,
    params.linkedin ? `LinkedIn: ${params.linkedin}` : null,
    params.resumeFilename ? `Resume: ${params.resumeFilename}` : null,
    params.coverFilename ? `Cover: ${params.coverFilename}` : null,
    params.message ? `\nWhy join Tellacity:\n${params.message}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const attachments: { filename: string; content: string }[] = [];
  if (params.resumeBase64 && params.resumeFilename)
    attachments.push({
      filename: params.resumeFilename,
      content: params.resumeBase64,
    });
  if (params.coverBase64 && params.coverFilename)
    attachments.push({
      filename: params.coverFilename,
      content: params.coverBase64,
    });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: `Career application: ${params.jobTitle} – ${params.fullName}`,
      text: body,
      attachments: attachments.length ? attachments : undefined,
    }),
  });

  if (!res.ok) {
    console.error("Resend career email error:", await res.text());
    return false;
  }
  return true;
}

export async function submitCareerApplication(
  _prev: CareerApplyState,
  formData: FormData
): Promise<CareerApplyState> {
  const fullName = (formData.get("fullName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const jobSlug = (formData.get("jobSlug") as string)?.trim();
  const jobTitle = (formData.get("jobTitle") as string)?.trim();
  const resume = formData.get("resume") as File | null;
  const coverLetter = formData.get("coverLetter") as File | null;

  if (!fullName) return { error: "Full name is required." };
  if (!email) return { error: "Email is required." };
  if (!jobSlug || !jobTitle) return { error: "Invalid job. Please try again." };

  const fileError = validateFile(resume, true) || validateFile(coverLetter, false);
  if (fileError) return { error: fileError };

  const resumeFilename = resume?.name ?? null;
  const coverFilename = coverLetter?.name ?? null;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const linkedin = (formData.get("linkedin") as string)?.trim() || null;
  const message = (formData.get("message") as string)?.trim() || null;

  let resumeBase64: string | undefined;
  let coverBase64: string | undefined;
  try {
    if (resume && resume.size > 0 && resume.size <= MAX_FILE_SIZE) {
      const buf = await resume.arrayBuffer();
      resumeBase64 = Buffer.from(buf).toString("base64");
    }
    if (coverLetter && coverLetter.size > 0 && coverLetter.size <= MAX_FILE_SIZE) {
      const buf = await coverLetter.arrayBuffer();
      coverBase64 = Buffer.from(buf).toString("base64");
    }
  } catch (e) {
    console.error("Career application file read error:", e);
  }

  const contactEmail =
    process.env.CONTACT_EMAIL ||
    process.env.CAREERS_EMAIL ||
    "hello@tellacity.com";

  const emailSent = await sendApplicationEmail({
    to: contactEmail,
    jobTitle,
    fullName,
    email,
    phone,
    linkedin,
    message,
    resumeFilename,
    resumeBase64,
    coverFilename,
    coverBase64,
  });

  let dbInserted = false;
  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("career_applications").insert({
      job_slug: jobSlug,
      job_title: jobTitle,
      full_name: fullName,
      email,
      phone,
      linkedin_url: linkedin,
      message,
      resume_filename: resumeFilename,
      cover_filename: coverFilename,
      resume_url: null,
      cover_url: null,
    });
    if (!error) dbInserted = true;
    else console.error("Career application insert error:", error);
  } catch (e) {
    console.error("Career application DB error:", e);
  }

  if (emailSent || dbInserted) {
    return { success: true };
  }

  return {
    error:
      "Your application could not be sent. Please try again or email us at " +
      contactEmail,
  };
}
