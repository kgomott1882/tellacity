"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { getActiveCountry } from "@/lib/getActiveCountry";

function slugFromCompanyName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return base || "business";
}

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
    plan?: string;
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
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizeSignupError = (message: string) => {
    const normalized = message.toLowerCase();
    if (
      normalized.includes("already been registered") ||
      normalized.includes("already exists") ||
      normalized.includes("user already registered")
    ) {
      return "Account already exists. Please log in.";
    }
    return message;
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

    const emailTrim = email.trim();
    const supabase = supabaseBrowser();

    setLoading(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: emailTrim,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: "business",
          },
        },
      });

      if (signUpError) {
        setError(normalizeSignupError(signUpError.message));
        return;
      }

      let session = signUpData.session;
      let userId = signUpData.user?.id ?? null;

      if (!session && userId) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: emailTrim,
          password,
        });
        if (signInError) {
          setError(
            "Account created. Confirm your email using the link we sent, then sign in here."
          );
          return;
        }
        session = signInData.session;
        userId = signInData.user?.id ?? userId;
      }

      if (!session || !userId) {
        setError("Sign up did not return a session. Check your email or try signing in.");
        return;
      }

      const { error: metaError } = await supabase.auth.updateUser({
        data: { display_name: fullName.trim() },
      });
      if (metaError) {
        setError(metaError.message);
        return;
      }

      const { data: existingByEmail } = await supabase
        .from("business_profiles")
        .select("id")
        .eq("email", emailTrim)
        .maybeSingle();

      if (existingByEmail && existingByEmail.id !== userId) {
        const tempEmail = `${emailTrim}.old.${Date.now()}`;
        await supabase.from("business_profiles").update({ email: tempEmail }).eq("id", existingByEmail.id);
      }

      const { error: profileUpsertError } = await supabase.from("business_profiles").upsert(
        {
          id: userId,
          email: emailTrim,
          business_name: businessData.companyName.trim(),
        },
        { onConflict: "id" }
      );

      if (profileUpsertError) {
        setError(profileUpsertError.message || "Could not create business profile.");
        return;
      }

      const slug = `${slugFromCompanyName(businessData.companyName)}-${userId.replace(/-/g, "").slice(0, 12)}`;

      const { error: businessError } = await supabase.from("businesses").insert({
        name: businessData.companyName.trim(),
        website: businessData.website.trim(),
        owner_id: userId,
        status: "active",
        country_code: businessData.country || getActiveCountry() || "",
        slug,
      });

      if (businessError) {
        setError(businessError.message || "Could not create your business. Please contact support.");
        return;
      }

      if (typeof window !== "undefined") {
        window.location.href = `${window.location.origin}/business/dashboard`;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(normalizeSignupError(message));
    } finally {
      setLoading(false);
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
              className="mt-2 w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm text-gray-600"
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
              className="mt-2 w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm text-gray-600"
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
              autoComplete="new-password"
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
              autoComplete="new-password"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-[#0E0E0E] focus:border-[#2fb2a8] focus:outline-none focus:ring-2 focus:ring-[#2fb2a8]/20"
              placeholder="Confirm your password"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#2fb2a8] px-6 py-3 text-sm font-semibold text-white hover:bg-[#27a39a] disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {loading ? "Creating account…" : "Create account"}
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
      </div>
    </div>
  );
}
