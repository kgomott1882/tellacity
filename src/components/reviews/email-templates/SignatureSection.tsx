"use client";

import React from "react";
import { useRouter } from "next/navigation";
import type { PlanKey } from "@/lib/plans";
import SignaturePreview from "./SignaturePreview";
import type { SignatureState } from "./SignaturePreview";
export type { SignatureState } from "./SignaturePreview";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import AvailableToUseLabel from "@/components/dashboard/AvailableToUseLabel";

type Props = {
  plan: PlanKey;
  value: SignatureState;
  onChange: (next: SignatureState) => void;
  businessId: string | null;
  /** When true, omits the large tier explainer (parent accordion covers it). */
  suppressTeaser?: boolean;
};

export function SignatureSection({ plan, value, onChange, businessId, suppressTeaser }: Props) {
  const router = useRouter();
  const isTeaser = plan === "free" || plan === "grow";
  const isElite = plan === "elite";
  const canPersistSignature = plan === "premium" || plan === "elite";
  const [logoError, setLogoError] = React.useState<string | null>(null);
  const [logoUploading, setLogoUploading] = React.useState(false);
  const eliteDetailsRef = React.useRef<HTMLDetailsElement>(null);

  React.useEffect(() => {
    const el = eliteDetailsRef.current;
    if (el) {
      el.open = isElite;
    }
  }, [isElite]);

  const toggleEnabled = () => {
    onChange({
      ...value,
      signature_enabled: !value.signature_enabled,
    });
  };

  const handleFieldChange = (field: keyof SignatureState, next: string | boolean) => {
    onChange({
      ...value,
      [field]: next,
    } as SignatureState);
  };

  const handleLogoFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!businessId) {
      setLogoError("Select a business before uploading a logo.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setLogoError("Please upload an image file (PNG or JPG).");
      return;
    }

    if (file.size > 1024 * 1024) {
      setLogoError("Logo should be under 1MB.");
      return;
    }

    setLogoError(null);
    setLogoUploading(true);

    const safeName = file.name.replace(/\s+/g, "-");
    const path = `${businessId}/${Date.now()}-${safeName}`;

    try {
      const supabase = supabaseBrowser();
      const { error: uploadError } = await supabase.storage
        .from("email-signatures")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        setLogoError(uploadError.message || "Logo upload failed. Please try again.");
        return;
      }

      const { data } = supabase.storage.from("email-signatures").getPublicUrl(path);
      const publicUrl = data?.publicUrl ?? "";

      if (!publicUrl) {
        setLogoError("Unable to generate a public URL for the logo.");
        return;
      }

      handleFieldChange("signature_logo_url", publicUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Logo upload failed. Please try again.";
      setLogoError(message);
    } finally {
      setLogoUploading(false);
      event.target.value = "";
    }
  };

  const handleLogoUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    handleFieldChange("signature_logo_url", url);
  };

  const handleLogoUrlBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const url = event.target.value.trim();
    if (!url) {
      setLogoError(null);
      return;
    }
    if (!url.startsWith("http")) {
      setLogoError("Logo URL should start with http or https.");
    } else {
      setLogoError(null);
    }
  };

  const fileInputDisabled = isTeaser || logoUploading || !businessId;

  return (
    <div className="space-y-4">
      {!suppressTeaser && isTeaser ? (
        <div className="rounded-lg border border-teal-100 bg-teal-50/60 px-3 py-2.5 text-xs text-gray-800">
          <p className="font-medium text-[#124541]">Signature and logo (Premium)</p>
          <p className="mt-1 text-gray-700">
            {plan === "free" ? (
              <>
                Draft below to see the preview. <span className="font-semibold">Premium</span> saves logo and
                signature on real invites; <span className="font-semibold">Elite</span> adds reply-to, CTAs, and
                footer branding (expand “Elite options” when you open this section).
              </>
            ) : (
              <>
                Grow saves your subject and body only. <span className="font-semibold">Premium</span> saves
                everything in this panel to live emails; <span className="font-semibold">Elite</span> unlocks the
                options under “Elite email options”.
              </>
            )}
          </p>
          <button
            type="button"
            onClick={() => router.push("/business/dashboard/settings/usage")}
            className="mt-2 text-xs font-semibold text-[#124541] underline decoration-[#124541]/40 underline-offset-2 hover:decoration-[#124541]"
          >
            View plans and upgrade
          </button>
        </div>
      ) : null}

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-medium text-gray-900">
              Company signature
              {canPersistSignature ? <AvailableToUseLabel /> : null}
            </p>
            <p className="text-xs text-gray-500">
              {isTeaser
                ? "Preview fields below. File upload turns on when you are on Premium or higher."
                : "Shown at the bottom of review invitation emails when enabled."}
            </p>
          </div>
          <label
            className={`inline-flex items-center gap-2 text-xs text-gray-700 ${isTeaser ? "cursor-default" : "cursor-pointer"}`}
          >
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-[#124541] focus:ring-[#124541]"
              checked={value.signature_enabled}
              onChange={toggleEnabled}
            />
            <span>Enable signature on invites</span>
          </label>
        </div>

        {value.signature_enabled && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Name
                </label>
                <input
                  type="text"
                  value={value.signature_name}
                  onChange={(e) => handleFieldChange("signature_name", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0E0E0E]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Title
                </label>
                <input
                  type="text"
                  value={value.signature_title}
                  onChange={(e) => handleFieldChange("signature_title", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0E0E0E]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Phone
                </label>
                <input
                  type="text"
                  value={value.signature_phone}
                  onChange={(e) => handleFieldChange("signature_phone", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0E0E0E]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Website
                </label>
                <input
                  type="text"
                  value={value.signature_website}
                  onChange={(e) => handleFieldChange("signature_website", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0E0E0E]"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Logo
                </label>
                <div className="mt-1 space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    disabled={fileInputDisabled}
                    className="block text-xs text-gray-700 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-[#124541] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-[#0f3a35] disabled:cursor-not-allowed"
                  />
                  <p className="text-[11px] text-gray-500">
                    {isTeaser
                      ? "Logo upload is available on Premium and above."
                      : "Recommended: PNG or JPG under 1MB."}
                  </p>
                  {value.signature_logo_url && (
                    <div className="mt-2">
                      <img
                        src={value.signature_logo_url}
                        alt="Signature logo preview"
                        className="h-16 rounded border bg-white p-2 object-contain"
                      />
                    </div>
                  )}
                  <div className="mt-2">
                    <label className="block text-[11px] font-medium uppercase tracking-wide text-gray-500">
                      Or paste logo URL
                    </label>
                    <input
                      type="text"
                      value={value.signature_logo_url}
                      onChange={handleLogoUrlChange}
                      onBlur={handleLogoUrlBlur}
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0E0E0E]"
                      placeholder="https://…"
                    />
                  </div>
                  {logoError && <p className="text-xs text-red-600">{logoError}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <details
                ref={eliteDetailsRef}
                className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm open:shadow"
              >
                <summary className="cursor-pointer list-none text-sm font-semibold text-gray-900 outline-none [&::-webkit-details-marker]:hidden">
                  <span className="inline-flex flex-wrap items-center gap-2">
                    Elite email options
                    {isElite ? (
                      <AvailableToUseLabel />
                    ) : (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                        Elite
                      </span>
                    )}
                    <span className="text-xs font-normal text-gray-500">
                      (expand) Reply-to, CTAs, address, footer branding
                    </span>
                  </span>
                </summary>
                <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
                  {!isElite ? (
                    <p className="text-[11px] text-gray-500">
                      These fields apply on sent mail when you are on the Elite plan.
                    </p>
                  ) : null}
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                      Address
                    </label>
                    <textarea
                      rows={2}
                      value={value.signature_address}
                      onChange={(e) => handleFieldChange("signature_address", e.target.value)}
                      readOnly={!isElite}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0E0E0E] read-only:bg-gray-50 read-only:text-gray-700"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                        CTA text
                      </label>
                      <input
                        type="text"
                        value={value.signature_cta_text}
                        onChange={(e) => handleFieldChange("signature_cta_text", e.target.value)}
                        readOnly={!isElite}
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0E0E0E] read-only:bg-gray-50 read-only:text-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                        CTA URL
                      </label>
                      <input
                        type="text"
                        value={value.signature_cta_url}
                        onChange={(e) => handleFieldChange("signature_cta_url", e.target.value)}
                        readOnly={!isElite}
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0E0E0E] read-only:bg-gray-50 read-only:text-gray-700"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                      Reply-to email
                    </label>
                    <input
                      type="email"
                      value={value.reply_to_email}
                      onChange={(e) => handleFieldChange("reply_to_email", e.target.value)}
                      readOnly={!isElite}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0E0E0E] read-only:bg-gray-50 read-only:text-gray-700"
                    />
                  </div>
                  <label
                    className={`inline-flex items-center gap-2 text-xs text-gray-700 ${isElite ? "" : "pointer-events-none opacity-60"}`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-[#124541] focus:ring-[#124541]"
                      checked={value.remove_tellacity_branding}
                      onChange={(e) => handleFieldChange("remove_tellacity_branding", e.target.checked)}
                      disabled={!isElite}
                    />
                    <span>Remove “Powered by Tellacity” branding</span>
                  </label>
                </div>
              </details>

              <SignaturePreview signatureEnabled={value.signature_enabled} value={value} />
            </div>
          </div>
        )}

        {isTeaser ? (
          <p className="mt-4 text-[11px] text-gray-500">
            Use <span className="font-medium text-gray-700">Save</span> at the bottom of the page.{" "}
            <span className="font-medium text-gray-700">Grow</span> persists subject and body;{" "}
            <span className="font-medium text-gray-700">Premium</span> also persists signature and logo.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default SignatureSection;
