import React from "react";
import type { PlanKey } from "@/lib/plans";
import SignaturePreview from "./SignaturePreview";
import type { SignatureState } from "./SignaturePreview";
export type { SignatureState } from "./SignaturePreview";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  plan: PlanKey;
  value: SignatureState;
  onChange: (next: SignatureState) => void;
  businessId: string | null;
};

export function SignatureSection({ plan, value, onChange, businessId }: Props) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [logoError, setLogoError] = React.useState<string | null>(null);
  const [logoUploading, setLogoUploading] = React.useState(false);

  if (plan === "free" || plan === "grow") {
    return null;
  }

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

  const isElite = plan === "elite";

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

  return (
    <div className="mt-6">
      {!isEditing ? (
        <div className="border rounded-xl p-5 bg-white shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Email Signature
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {value.signature_name || "No signature configured"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-sm font-medium text-emerald-600 hover:underline"
            >
              Edit
            </button>
          </div>

          {value.signature_logo_url && (
            <div className="mt-4">
              <img
                src={value.signature_logo_url}
                alt="Logo preview"
                className="h-12 object-contain"
              />
            </div>
          )}

          <div className="mt-4 text-sm text-gray-700">
            {value.signature_title && <div>{value.signature_title}</div>}
            {value.signature_phone && <div>{value.signature_phone}</div>}
            {value.signature_website && (
              <div>
                <a
                  href={`https://${String(value.signature_website).replace(/^https?:\/\//, "")}`}
                  className="text-emerald-600 underline"
                >
                  {value.signature_website}
                </a>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="border rounded-xl p-6 bg-gray-50">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Email signature</p>
              <p className="text-xs text-gray-500">
                Add a branded email signature to the bottom of your review invites.
              </p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-[#124541] focus:ring-[#124541]"
                checked={value.signature_enabled}
                onChange={toggleEnabled}
              />
              <span>Enable custom email signature</span>
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
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0E0E0E]"
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
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0E0E0E]"
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
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0E0E0E]"
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
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0E0E0E]"
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
                      disabled={logoUploading || !businessId}
                      className="block text-xs text-gray-700 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-[#124541] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-[#0f3a35] disabled:cursor-not-allowed"
                    />
                    <p className="text-[11px] text-gray-500">
                      Recommended: PNG or JPG under 1MB.
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
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0E0E0E]"
                        placeholder="https://…"
                      />
                    </div>
                    {logoError && (
                      <p className="text-xs text-red-600">
                        {logoError}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {isElite && (
                  <>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                        Address
                      </label>
                      <textarea
                        rows={2}
                        value={value.signature_address}
                        onChange={(e) => handleFieldChange("signature_address", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0E0E0E]"
                      />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                          CTA text
                        </label>
                        <input
                          type="text"
                          value={value.signature_cta_text}
                          onChange={(e) => handleFieldChange("signature_cta_text", e.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0E0E0E]"
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
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0E0E0E]"
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
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0E0E0E]"
                      />
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-[#124541] focus:ring-[#124541]"
                        checked={value.remove_tellacity_branding}
                        onChange={(e) => handleFieldChange("remove_tellacity_branding", e.target.checked)}
                      />
                      <span>Remove “Powered by Tellacity” branding</span>
                    </label>
                  </>
                )}

                <SignaturePreview signatureEnabled={value.signature_enabled} value={value} />
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Save
            </button>

            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SignatureSection;

