"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { getActiveCountry } from "@/lib/getActiveCountry";

type PasswordSetupPopupProps = {
  isOpen: boolean;
  onClose: () => void;
  fullName: string;
  email: string;
  businessData: {
    website: string;
    companyName: string;
    firstName: string;
    lastName: string;
    jobTitle: string;
    country: string;
    phoneNumber: string;
    numberOfEmployees: string;
    annualRevenue: string;
  };
};

export default function PasswordSetupPopup({
  isOpen,
  onClose,
  fullName,
  email,
  businessData,
}: PasswordSetupPopupProps) {
  const router = useRouter();
  const [step, setStep] = useState<"password" | "otp">("password");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizeSignupError = (message: string) => {
    const normalized = message.toLowerCase();
    if (
      normalized.includes("already been registered") ||
      normalized.includes("already exists")
    ) {
      return "Account already exists. Please log in.";
    }
    return message;
  };

  const callEdgeFunction = async (name: string, body: Record<string, unknown>) => {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!baseUrl || !anonKey) {
      throw new Error("Supabase configuration missing.");
    }
    const response = await fetch(`${baseUrl}/functions/v1/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify(body),
    });
    let payload: any = null;
    try {
      payload = await response.json();
    } catch (_error) {
      payload = null;
    }
    if (!response.ok) {
      const message =
        (payload && payload.error) || "Something went wrong. Please try again.";
      throw new Error(message);
    }
    return payload;
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!password || !confirmPassword) {
      setError("Please complete all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await callEdgeFunction("send-signup-otp", { email, password });
      setLoading(false);
      setStep("otp");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setLoading(false);
      setError(normalizeSignupError(message));
    }
  };

  const handleVerify = async () => {
    setError("");
    if (otp.trim().length !== 4) {
      setError("Enter the 4-digit code.");
      return;
    }
    setLoading(true);
    try {
      const payload = await callEdgeFunction("verify-signup-otp", {
        email,
        code: otp.trim(),
      });
      setLoading(false);
      if (payload?.session?.access_token && payload?.session?.refresh_token) {
        await supabaseBrowser.auth.setSession({
          access_token: payload.session.access_token,
          refresh_token: payload.session.refresh_token,
        });
        
        // Update user metadata with display name
        const { error: updateUserError } = await supabaseBrowser.auth.updateUser({
          data: { display_name: fullName.trim() },
        });
        if (updateUserError) {
          setError(updateUserError.message);
          return;
        }

        // Create business profile - handle duplicate email by updating existing profile
        // First check if profile exists with this email but different ID
        const { data: existingByEmail } = await supabaseBrowser
          .from("business_profiles")
          .select("id")
          .eq("email", email.trim())
          .maybeSingle();

        if (existingByEmail && existingByEmail.id !== payload.session.user.id) {
          // Profile exists with different ID - migrate it
          const tempEmail = `${email.trim()}.old.${Date.now()}`;
          await supabaseBrowser
            .from("business_profiles")
            .update({ email: tempEmail })
            .eq("id", existingByEmail.id);
        }

        // Now create/update profile for current user
        const { error: profileUpsertError } = await supabaseBrowser
          .from("business_profiles")
          .upsert({
            id: payload.session.user.id,
            email: email.trim(),
            business_name: businessData.companyName.trim(),
          }, {
            onConflict: "id"
          });

        // If still error, try update by id
        if (profileUpsertError && profileUpsertError.code === "23505") {
          await supabaseBrowser
            .from("business_profiles")
            .update({
              business_name: businessData.companyName.trim(),
            })
            .eq("id", payload.session.user.id);
        }

        // Create business record
        const { data: businessRecord, error: businessError } = await supabaseBrowser
          .from("businesses")
          .insert({
            name: businessData.companyName.trim(),
            website: businessData.website.trim(),
            owner_id: payload.session.user.id,
            country_code: businessData.country || getActiveCountry() || "",
          })
          .select()
          .single();

        if (businessError) {
          const errorMessage = businessError.message || "";
          const errorCode = businessError.code || "";
          const errorString = JSON.stringify(businessError);
          
          // Check if it's a duplicate/unique constraint error or empty error object
          const isDuplicateError = 
            errorMessage.toLowerCase().includes("duplicate") ||
            errorMessage.toLowerCase().includes("unique") ||
            errorMessage.toLowerCase().includes("already exists") ||
            errorCode === "23505" || // PostgreSQL unique violation
            errorString === "{}" || // Empty error object
            Object.keys(businessError).length === 0; // Empty error object
          
          // Only log if it's a real error (not duplicate/empty)
          if (!isDuplicateError && errorMessage) {
            console.error("Business creation error:", businessError);
          }
          // Don't block the flow - user is already logged in
        }

        // Auto-login successful, redirect to dashboard
        router.push("/business/dashboard");
        return;
      }
      setError("Unable to create session. Please try again.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setLoading(false);
      setError(normalizeSignupError(message));
    }
  };

  const handleResend = async () => {
    setError("");
    setLoading(true);
    try {
      await callEdgeFunction("send-signup-otp", { email, password });
      setLoading(false);
      setError("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setLoading(false);
      setError(normalizeSignupError(message));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F8F4F0] px-4">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          ×
        </button>

        {step === "password" ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-[#0E0E0E]">Create account</h2>
            </div>

            <div>
              <label htmlFor="full-name" className="text-sm font-medium text-[#0E0E0E]">
                Full name
              </label>
              <input
                id="full-name"
                type="text"
                value={fullName}
                disabled
                className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm text-gray-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-medium text-[#0E0E0E]">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                disabled
                className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm text-gray-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium text-[#0E0E0E]">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-[#0E0E0E] focus:border-[#2fb2a8] focus:outline-none focus:ring-2 focus:ring-[#2fb2a8]/20"
                placeholder="Enter your password"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="text-sm font-medium text-[#0E0E0E]">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-[#0E0E0E] focus:border-[#2fb2a8] focus:outline-none focus:ring-2 focus:ring-[#2fb2a8]/20"
                placeholder="Confirm your password"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#2fb2a8] px-6 py-3 text-sm font-semibold text-white hover:bg-[#27a39a] disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {loading ? "Sending code..." : "Create account"}
            </button>

            <p className="text-center text-xs text-gray-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push("/business/login");
                }}
                className="font-semibold text-[#2fb2a8] hover:underline"
              >
                Sign in
              </button>
            </p>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-[#0E0E0E]">Verify your email</h2>
              <p className="mt-2 text-sm text-gray-600">
                We sent a 4-digit code to <span className="font-semibold">{email}</span>
              </p>
            </div>

            <div>
              <label htmlFor="otp" className="text-sm font-medium text-[#0E0E0E]">
                Enter code
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                disabled={loading}
                maxLength={4}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-center text-lg font-semibold tracking-widest text-[#0E0E0E] focus:border-[#2fb2a8] focus:outline-none focus:ring-2 focus:ring-[#2fb2a8]/20"
                placeholder="0000"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="button"
              onClick={handleVerify}
              disabled={loading || otp.length !== 4}
              className="w-full rounded-lg bg-[#2fb2a8] px-6 py-3 text-sm font-semibold text-white hover:bg-[#27a39a] disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="text-sm font-semibold text-[#2fb2a8] hover:underline disabled:text-gray-400"
              >
                Resend code
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
