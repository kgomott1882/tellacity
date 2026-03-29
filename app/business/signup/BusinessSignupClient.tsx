"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BUSINESS_SIGNUP_DOMAIN_MISMATCH_MESSAGE } from "@/lib/businessSignupDomainMessage";
import type { BusinessSignupPendingPayload } from "@/lib/businessSignupPayload";
import { normalizeSignupWebsiteInput } from "@/lib/extractDomain";
import { normalizeBusinessDomain } from "@/lib/normalizeBusinessDomain";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import BusinessSignupOtpModal from "./_components/BusinessSignupOtpModal";

const COUNTRIES = [
  { code: "AF", name: "Afghanistan" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "AS", name: "American Samoa" },
  { code: "AD", name: "Andorra" },
  { code: "AO", name: "Angola" },
  { code: "AI", name: "Anguilla" },
  { code: "AQ", name: "Antarctica" },
  { code: "AG", name: "Antigua and Barbuda" },
  { code: "AR", name: "Argentina" },
  { code: "AM", name: "Armenia" },
  { code: "AW", name: "Aruba" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "BS", name: "Bahamas" },
  { code: "BH", name: "Bahrain" },
  { code: "BD", name: "Bangladesh" },
  { code: "BB", name: "Barbados" },
  { code: "BY", name: "Belarus" },
  { code: "BE", name: "Belgium" },
  { code: "BZ", name: "Belize" },
  { code: "BJ", name: "Benin" },
  { code: "BM", name: "Bermuda" },
  { code: "BT", name: "Bhutan" },
  { code: "BO", name: "Bolivia" },
  { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "BW", name: "Botswana" },
  { code: "BV", name: "Bouvet Island" },
  { code: "BR", name: "Brazil" },
  { code: "IO", name: "British Indian Ocean Territory" },
  { code: "BN", name: "Brunei Darussalam" },
  { code: "BG", name: "Bulgaria" },
  { code: "BF", name: "Burkina Faso" },
  { code: "BI", name: "Burundi" },
  { code: "KH", name: "Cambodia" },
  { code: "CM", name: "Cameroon" },
  { code: "CA", name: "Canada" },
  { code: "CV", name: "Cape Verde" },
  { code: "KY", name: "Cayman Islands" },
  { code: "CF", name: "Central African Republic" },
  { code: "TD", name: "Chad" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CX", name: "Christmas Island" },
  { code: "CC", name: "Cocos (Keeling) Islands" },
  { code: "CO", name: "Colombia" },
  { code: "KM", name: "Comoros" },
  { code: "CG", name: "Congo" },
  { code: "CD", name: "Congo, Democratic Republic" },
  { code: "CK", name: "Cook Islands" },
  { code: "CR", name: "Costa Rica" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "HR", name: "Croatia" },
  { code: "CU", name: "Cuba" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "DJ", name: "Djibouti" },
  { code: "DM", name: "Dominica" },
  { code: "DO", name: "Dominican Republic" },
  { code: "EC", name: "Ecuador" },
  { code: "EG", name: "Egypt" },
  { code: "SV", name: "El Salvador" },
  { code: "GQ", name: "Equatorial Guinea" },
  { code: "ER", name: "Eritrea" },
  { code: "EE", name: "Estonia" },
  { code: "ET", name: "Ethiopia" },
  { code: "FK", name: "Falkland Islands" },
  { code: "FO", name: "Faroe Islands" },
  { code: "FJ", name: "Fiji" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "GF", name: "French Guiana" },
  { code: "PF", name: "French Polynesia" },
  { code: "TF", name: "French Southern Territories" },
  { code: "GA", name: "Gabon" },
  { code: "GM", name: "Gambia" },
  { code: "GE", name: "Georgia" },
  { code: "DE", name: "Germany" },
  { code: "GH", name: "Ghana" },
  { code: "GI", name: "Gibraltar" },
  { code: "GR", name: "Greece" },
  { code: "GL", name: "Greenland" },
  { code: "GD", name: "Grenada" },
  { code: "GP", name: "Guadeloupe" },
  { code: "GU", name: "Guam" },
  { code: "GT", name: "Guatemala" },
  { code: "GG", name: "Guernsey" },
  { code: "GN", name: "Guinea" },
  { code: "GW", name: "Guinea-Bissau" },
  { code: "GY", name: "Guyana" },
  { code: "HT", name: "Haiti" },
  { code: "HM", name: "Heard Island and McDonald Islands" },
  { code: "VA", name: "Holy See (Vatican City)" },
  { code: "HN", name: "Honduras" },
  { code: "HK", name: "Hong Kong" },
  { code: "HU", name: "Hungary" },
  { code: "IS", name: "Iceland" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" },
  { code: "IM", name: "Isle of Man" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" },
  { code: "JM", name: "Jamaica" },
  { code: "JP", name: "Japan" },
  { code: "JE", name: "Jersey" },
  { code: "JO", name: "Jordan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "KE", name: "Kenya" },
  { code: "KI", name: "Kiribati" },
  { code: "KP", name: "Korea, North" },
  { code: "KR", name: "Korea, South" },
  { code: "KW", name: "Kuwait" },
  { code: "KG", name: "Kyrgyzstan" },
  { code: "LA", name: "Laos" },
  { code: "LV", name: "Latvia" },
  { code: "LB", name: "Lebanon" },
  { code: "LS", name: "Lesotho" },
  { code: "LR", name: "Liberia" },
  { code: "LY", name: "Libya" },
  { code: "LI", name: "Liechtenstein" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MO", name: "Macao" },
  { code: "MK", name: "Macedonia" },
  { code: "MG", name: "Madagascar" },
  { code: "MW", name: "Malawi" },
  { code: "MY", name: "Malaysia" },
  { code: "MV", name: "Maldives" },
  { code: "ML", name: "Mali" },
  { code: "MT", name: "Malta" },
  { code: "MH", name: "Marshall Islands" },
  { code: "MQ", name: "Martinique" },
  { code: "MR", name: "Mauritania" },
  { code: "MU", name: "Mauritius" },
  { code: "YT", name: "Mayotte" },
  { code: "MX", name: "Mexico" },
  { code: "FM", name: "Micronesia" },
  { code: "MD", name: "Moldova" },
  { code: "MC", name: "Monaco" },
  { code: "MN", name: "Mongolia" },
  { code: "ME", name: "Montenegro" },
  { code: "MS", name: "Montserrat" },
  { code: "MA", name: "Morocco" },
  { code: "MZ", name: "Mozambique" },
  { code: "MM", name: "Myanmar" },
  { code: "NA", name: "Namibia" },
  { code: "NR", name: "Nauru" },
  { code: "NP", name: "Nepal" },
  { code: "NL", name: "Netherlands" },
  { code: "AN", name: "Netherlands Antilles" },
  { code: "NC", name: "New Caledonia" },
  { code: "NZ", name: "New Zealand" },
  { code: "NI", name: "Nicaragua" },
  { code: "NE", name: "Niger" },
  { code: "NG", name: "Nigeria" },
  { code: "NU", name: "Niue" },
  { code: "NF", name: "Norfolk Island" },
  { code: "MP", name: "Northern Mariana Islands" },
  { code: "NO", name: "Norway" },
  { code: "OM", name: "Oman" },
  { code: "PK", name: "Pakistan" },
  { code: "PW", name: "Palau" },
  { code: "PS", name: "Palestinian Territory" },
  { code: "PA", name: "Panama" },
  { code: "PG", name: "Papua New Guinea" },
  { code: "PY", name: "Paraguay" },
  { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" },
  { code: "PN", name: "Pitcairn" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "PR", name: "Puerto Rico" },
  { code: "QA", name: "Qatar" },
  { code: "RE", name: "Réunion" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" },
  { code: "RW", name: "Rwanda" },
  { code: "SH", name: "Saint Helena" },
  { code: "KN", name: "Saint Kitts and Nevis" },
  { code: "LC", name: "Saint Lucia" },
  { code: "PM", name: "Saint Pierre and Miquelon" },
  { code: "VC", name: "Saint Vincent and the Grenadines" },
  { code: "WS", name: "Samoa" },
  { code: "SM", name: "San Marino" },
  { code: "ST", name: "Sao Tome and Principe" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SN", name: "Senegal" },
  { code: "RS", name: "Serbia" },
  { code: "SC", name: "Seychelles" },
  { code: "SL", name: "Sierra Leone" },
  { code: "SG", name: "Singapore" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "SB", name: "Solomon Islands" },
  { code: "SO", name: "Somalia" },
  { code: "ZA", name: "South Africa" },
  { code: "GS", name: "South Georgia and the South Sandwich Islands" },
  { code: "ES", name: "Spain" },
  { code: "LK", name: "Sri Lanka" },
  { code: "SD", name: "Sudan" },
  { code: "SR", name: "Suriname" },
  { code: "SJ", name: "Svalbard and Jan Mayen" },
  { code: "SZ", name: "Swaziland" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "SY", name: "Syria" },
  { code: "TW", name: "Taiwan" },
  { code: "TJ", name: "Tajikistan" },
  { code: "TZ", name: "Tanzania" },
  { code: "TH", name: "Thailand" },
  { code: "TL", name: "Timor-Leste" },
  { code: "TG", name: "Togo" },
  { code: "TK", name: "Tokelau" },
  { code: "TO", name: "Tonga" },
  { code: "TT", name: "Trinidad and Tobago" },
  { code: "TN", name: "Tunisia" },
  { code: "TR", name: "Turkey" },
  { code: "TM", name: "Turkmenistan" },
  { code: "TC", name: "Turks and Caicos Islands" },
  { code: "TV", name: "Tuvalu" },
  { code: "UG", name: "Uganda" },
  { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "UM", name: "United States Minor Outlying Islands" },
  { code: "UY", name: "Uruguay" },
  { code: "UZ", name: "Uzbekistan" },
  { code: "VU", name: "Vanuatu" },
  { code: "VE", name: "Venezuela" },
  { code: "VN", name: "Vietnam" },
  { code: "VG", name: "Virgin Islands, British" },
  { code: "VI", name: "Virgin Islands, U.S." },
  { code: "WF", name: "Wallis and Futuna" },
  { code: "EH", name: "Western Sahara" },
  { code: "YE", name: "Yemen" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" },
];

function formatPhoneInput(raw: string): string {
  const cleaned = raw.replace(/[^\d\s+()-]/g, "");
  return cleaned.replace(/\s{2,}/g, " ");
}

type SignupFieldKey =
  | "website"
  | "companyName"
  | "firstName"
  | "lastName"
  | "workEmail"
  | "password"
  | "confirmPassword"
  | "country";

type SignupFieldErrors = Partial<Record<SignupFieldKey, boolean>>;

const SIGNUP_FIELD_ORDER: { key: SignupFieldKey; wrapId: string }[] = [
  { key: "website", wrapId: "signup-field-wrap-website" },
  { key: "companyName", wrapId: "signup-field-wrap-company-name" },
  { key: "firstName", wrapId: "signup-field-wrap-first-name" },
  { key: "lastName", wrapId: "signup-field-wrap-last-name" },
  { key: "workEmail", wrapId: "signup-field-wrap-work-email" },
  { key: "password", wrapId: "signup-field-wrap-password" },
  { key: "confirmPassword", wrapId: "signup-field-wrap-confirm-password" },
  { key: "country", wrapId: "signup-field-wrap-country" },
];

function domainToName(domain: string): string {
  if (!domain) return "";

  const name = domain.split(".")[0] ?? "";
  if (!name) return "";

  return name.charAt(0).toUpperCase() + name.slice(1);
}

function isWebsiteFilled(raw: string): boolean {
  const t = raw.trim();
  if (!t) return false;
  return t.replace(/^https?:\/\//i, "").trim().length > 0;
}

function inputClassName(hasError: boolean): string {
  const base =
    "mt-2 w-full rounded-lg border px-4 py-2.5 text-sm text-[#0E0E0E] focus:outline-none focus:ring-2";
  return hasError
    ? `${base} border-red-500 focus:border-red-500 focus:ring-red-500/20`
    : `${base} border-gray-300 focus:border-[#1FAF9E] focus:ring-[#1FAF9E]/20`;
}

export default function BusinessSignupClient() {
  const searchParams = useSearchParams();
  const allowedPlans = ["free", "grow", "premium", "elite"];
  const paramPlan = searchParams.get("plan");
  const initialPlan = allowedPlans.includes(paramPlan || "") ? (paramPlan as string) : "free";
  const [website, setWebsite] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry] = useState("US");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpSessionKey, setOtpSessionKey] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({});
  const [workEmailDomainError, setWorkEmailDomainError] = useState("");
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [websiteLookup, setWebsiteLookup] = useState<"idle" | "loading" | "found" | "none">(
    "idle"
  );
  const [websiteMatchedName, setWebsiteMatchedName] = useState<string | null>(null);
  const autoCompanyFromDomainRef = useRef<{ host: string; label: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const domain = normalizeBusinessDomain(website);

    if (!website.trim() || !domain || domain.length < 3) {
      setWebsiteLookup("idle");
      setWebsiteMatchedName(null);
      setSelectedBusinessId(null);
      return;
    }

    setWebsiteLookup("loading");

    const t = window.setTimeout(async () => {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase.rpc("find_active_business_by_domain", {
        p_domain: domain,
      });

      if (cancelled) return;

      if (error) {
        setWebsiteLookup("idle");
        setWebsiteMatchedName(null);
        setSelectedBusinessId(null);
        return;
      }

      const rows = Array.isArray(data) ? data : [];
      const row = rows[0] as { id: string; name: string; website: string } | undefined;
      const rawName = row?.name != null ? String(row.name).trim() : "";

      if (row?.id && rawName) {
        autoCompanyFromDomainRef.current = null;
        setSelectedBusinessId(row.id);
        setCompanyName(rawName);
        setWebsiteMatchedName(rawName);
        setWebsiteLookup("found");
        setFieldErrors((prev) => {
          if (!prev.companyName) return prev;
          const next = { ...prev };
          delete next.companyName;
          return next;
        });
        return;
      }

      setSelectedBusinessId(null);
      setWebsiteMatchedName(null);
      setWebsiteLookup("none");

      const fb = domainToName(domain);
      const snap = autoCompanyFromDomainRef.current;

      setCompanyName((prev) => {
        const trimmed = prev.trim();
        if (!trimmed) {
          autoCompanyFromDomainRef.current = { host: domain, label: fb };
          return fb;
        }
        if (snap && trimmed === snap.label) {
          autoCompanyFromDomainRef.current = { host: domain, label: fb };
          return fb;
        }
        return prev;
      });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [website]);

  const clearFieldError = (key: SignupFieldKey) => {
    if (key === "workEmail") {
      setWorkEmailDomainError("");
    }
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const buildPendingPayload = (): BusinessSignupPendingPayload => ({
    selectedBusinessId,
    website,
    companyName,
    firstName,
    lastName,
    jobTitle,
    country,
    plan: selectedPlan,
    ...(phoneNumber.trim() ? { phoneNumber: phoneNumber.trim() } : {}),
  });

  const sendSignupCode = async (): Promise<{ ok: boolean; error?: string }> => {
    const res = await fetch("/api/business/signup/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailValue.trim().toLowerCase(),
        ...buildPendingPayload(),
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
    };
    if (!res.ok) {
      if (data.error === "domain_mismatch" && data.message) {
        return { ok: false, error: data.message };
      }
      return {
        ok: false,
        error: data.message ?? data.error ?? "Could not send verification email.",
      };
    }
    return { ok: true };
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setWorkEmailDomainError("");

    const nextErrors: SignupFieldErrors = {
      website: !isWebsiteFilled(website),
      companyName: !companyName.trim(),
      firstName: !firstName.trim(),
      lastName: !lastName.trim(),
      workEmail: !emailValue.trim(),
      password: !password,
      confirmPassword: !confirmPassword,
      country: !country.trim(),
    };

    if (password && confirmPassword && password !== confirmPassword) {
      nextErrors.confirmPassword = true;
    }
    if (password && password.length < 6) {
      nextErrors.password = true;
    }

    const hasError = Object.values(nextErrors).some(Boolean);
    if (hasError) {
      setFieldErrors(nextErrors);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const first = SIGNUP_FIELD_ORDER.find((row) => nextErrors[row.key]);
          const el = first ? document.getElementById(first.wrapId) : null;
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
          el?.classList.add("animate-signup-shake");
          window.setTimeout(() => el?.classList.remove("animate-signup-shake"), 480);
        });
      });
      return;
    }

    if (password !== confirmPassword) {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: true }));
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setFieldErrors((prev) => ({ ...prev, password: true }));
      setError("Password must be at least 6 characters.");
      return;
    }

    const websiteDomain = normalizeBusinessDomain(website);
    const email = emailValue.trim().toLowerCase();
    const emailDomain = normalizeBusinessDomain(email.split("@")[1] || "");
    if (!emailDomain || websiteDomain !== emailDomain) {
      setFieldErrors({ workEmail: true });
      setWorkEmailDomainError(BUSINESS_SIGNUP_DOMAIN_MISMATCH_MESSAGE);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const el = document.getElementById("signup-field-wrap-work-email");
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
          el?.classList.add("animate-signup-shake");
          window.setTimeout(() => el?.classList.remove("animate-signup-shake"), 480);
        });
      });
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      const sent = await sendSignupCode();
      if (!sent.ok) {
        if (
          sent.error?.includes("support@tellacity.com") ||
          sent.error === BUSINESS_SIGNUP_DOMAIN_MISMATCH_MESSAGE
        ) {
          setFieldErrors({ workEmail: true });
          setWorkEmailDomainError(
            sent.error ?? BUSINESS_SIGNUP_DOMAIN_MISMATCH_MESSAGE
          );
        } else {
          setError(sent.error ?? "Could not send verification email.");
        }
        return;
      }
      try {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            "signup_business",
            JSON.stringify({
              business_name: companyName.trim(),
              website: website.trim(),
              country: country.trim(),
            })
          );
        }
      } catch {
        /* ignore quota / private mode */
      }
      setOtpSessionKey((k) => k + 1);
      setOtpOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <main className="min-h-screen bg-white">
        <BusinessSignupOtpModal
          key={otpSessionKey}
          open={otpOpen}
          email={emailValue.trim().toLowerCase()}
          password={password}
          onClose={() => setOtpOpen(false)}
          onResend={sendSignupCode}
        />
        <div className="flex min-h-screen">
          <div className="hidden lg:flex lg:w-1/2 flex-col bg-[#F8F4F0] px-12 py-16">
            <div className="mb-12">
              <img
                src="/brand/TELLACITY%20-Line%20Icon.png"
                alt="Tellacity Business"
                className="h-16 w-auto mb-8 sm:h-[4.5rem]"
              />
            </div>
            <div className="space-y-8 max-w-md">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6 text-[#1FAF9E]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#0E0E0E] mb-2">
                    Build trust with real reviews
                  </h2>
                  <p className="text-sm text-gray-600">
                    Collect authentic customer feedback on an open, transparent
                    platform people rely on.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6 text-[#1FAF9E]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#0E0E0E] mb-2">
                    Drive more conversions
                  </h2>
                  <p className="text-sm text-gray-600">
                    Tellacity ratings and reviews help turn visitors into
                    customers more often than competing platforms.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6 text-[#1FAF9E]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#0E0E0E] mb-2">
                    Improve your online reputation
                  </h2>
                  <p className="text-sm text-gray-600">
                    Showcase verified customer reviews that strengthen your brand reputation and increase trust across search engines and digital channels.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6 text-[#1FAF9E]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#0E0E0E] mb-2">
                    Get discovered through customer feedback
                  </h2>
                  <p className="text-sm text-gray-600">
                    Tellacity helps businesses appear when people search for reviews, complaints, and real customer experiences online.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6 text-[#1FAF9E]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#0E0E0E] mb-2">
                    Turn customer insights into growth
                  </h2>
                  <p className="text-sm text-gray-600">
                    Analyze review patterns and customer feedback to understand what customers value most and improve your products and services.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2 flex flex-col overflow-y-auto">
            <div className="flex-1 px-6 py-8 lg:px-12 lg:py-16">
              <div className="lg:hidden mb-6 flex justify-center">
                <img
                  src="/brand/TELLACITY%20-Line%20Icon.png"
                  alt="Tellacity Business"
                  className="h-16 w-auto sm:h-[4.5rem]"
                />
              </div>

              <div className="max-w-md mx-auto lg:mx-0">
                <div className="mb-6 rounded-xl border border-stone-300 bg-[#F8F4F0] p-4">
                  <h1 className="mb-3 text-xl font-semibold text-black sm:text-2xl">
                    Create a Free Business Account
                  </h1>
                  <p className="text-sm text-black">Selected Plan:</p>
                  <p className="text-lg font-semibold capitalize text-black">
                    {selectedPlan}
                  </p>
                  <p className="mt-2 text-xs text-black">
                    You can change your plan later inside your dashboard.
                  </p>
                </div>

                <div className="space-y-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div id="signup-field-wrap-website">
                      <label
                        htmlFor="website"
                        className="text-sm font-medium text-[#0E0E0E]"
                      >
                        Website
                      </label>
                      <input
                        id="website"
                        type="text"
                        inputMode="url"
                        autoComplete="url"
                        value={website}
                        onChange={(e) => {
                          const normalized = normalizeSignupWebsiteInput(e.target.value);
                          setWebsite(normalized);
                          clearFieldError("website");
                        }}
                        disabled={loading}
                        className={inputClassName(Boolean(fieldErrors.website))}
                        placeholder="example.com"
                      />
                      {websiteLookup === "loading" ? (
                        <p className="mt-1 text-xs text-gray-500">Checking…</p>
                      ) : null}
                      {websiteLookup === "found" &&
                      websiteMatchedName &&
                      selectedBusinessId ? (
                        <p className="mt-1 text-sm text-emerald-700">
                          ✅ We found your business: {websiteMatchedName}
                        </p>
                      ) : null}
                      {websiteLookup === "none" &&
                      normalizeBusinessDomain(website).length >= 3 ? (
                        <p className="text-sm text-gray-600 mt-1">
                          No business found.{" "}
                          <span className="text-green-600 font-medium">
                            Continue
                          </span>{" "}
                          to create a new one.
                        </p>
                      ) : null}
                      {fieldErrors.website ? (
                        <p className="mt-1 text-sm text-red-500">
                          Please complete this field
                        </p>
                      ) : null}
                    </div>

                    <div id="signup-field-wrap-company-name">
                      <label
                        htmlFor="company-name"
                        className="text-sm font-medium text-[#0E0E0E]"
                      >
                        Business name
                      </label>
                      <input
                        id="company-name"
                        type="text"
                        value={companyName}
                        onChange={(e) => {
                          const v = e.target.value;
                          setCompanyName(v);
                          const d = normalizeBusinessDomain(website);
                          const fb = domainToName(d);
                          if (d && v.trim() === fb) {
                            autoCompanyFromDomainRef.current = { host: d, label: fb };
                          } else {
                            autoCompanyFromDomainRef.current = null;
                          }
                          clearFieldError("companyName");
                        }}
                        className={inputClassName(Boolean(fieldErrors.companyName))}
                      />
                      {fieldErrors.companyName ? (
                        <p className="mt-1 text-sm text-red-500">
                          Please complete this field
                        </p>
                      ) : null}
                    </div>

                    <div id="signup-field-wrap-first-name">
                      <label
                        htmlFor="first-name"
                        className="text-sm font-medium text-[#0E0E0E]"
                      >
                        First name
                      </label>
                      <input
                        id="first-name"
                        type="text"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          clearFieldError("firstName");
                        }}
                        disabled={loading}
                        className={inputClassName(Boolean(fieldErrors.firstName))}
                      />
                      {fieldErrors.firstName ? (
                        <p className="mt-1 text-sm text-red-500">
                          Please complete this field
                        </p>
                      ) : null}
                    </div>

                    <div id="signup-field-wrap-last-name">
                      <label
                        htmlFor="last-name"
                        className="text-sm font-medium text-[#0E0E0E]"
                      >
                        Last name
                      </label>
                      <input
                        id="last-name"
                        type="text"
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          clearFieldError("lastName");
                        }}
                        disabled={loading}
                        className={inputClassName(Boolean(fieldErrors.lastName))}
                      />
                      {fieldErrors.lastName ? (
                        <p className="mt-1 text-sm text-red-500">
                          Please complete this field
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <label
                        htmlFor="job-title"
                        className="text-sm font-medium text-[#0E0E0E]"
                      >
                        Job title
                      </label>
                      <input
                        id="job-title"
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        disabled={loading}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                      />
                    </div>

                    <div id="signup-field-wrap-work-email">
                      <label
                        htmlFor="work-email"
                        className="text-sm font-medium text-[#0E0E0E]"
                      >
                        Work email
                      </label>
                      <input
                        id="work-email"
                        name="work_email"
                        type="email"
                        value={emailValue}
                        onChange={(e) => {
                          setEmailValue(e.target.value);
                          clearFieldError("workEmail");
                        }}
                        disabled={loading}
                        className={`${inputClassName(
                          Boolean(fieldErrors.workEmail || workEmailDomainError)
                        )} w-full`}
                      />
                      <p
                        className={`mt-1 text-sm transition-colors ${
                          emailValue ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        Use your business email address to verify ownership
                      </p>
                      {fieldErrors.workEmail || workEmailDomainError ? (
                        <p className="mt-1 text-sm text-red-500">
                          {workEmailDomainError || "Please complete this field"}
                        </p>
                      ) : null}
                    </div>

                    <div id="signup-field-wrap-password">
                      <label
                        htmlFor="signup-password"
                        className="text-sm font-medium text-[#0E0E0E]"
                      >
                        Password
                      </label>
                      <input
                        id="signup-password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          clearFieldError("password");
                        }}
                        disabled={loading}
                        className={inputClassName(Boolean(fieldErrors.password))}
                      />
                      {fieldErrors.password ? (
                        <p className="mt-1 text-sm text-red-500">
                          {password.length > 0 && password.length < 6
                            ? "Password must be at least 6 characters."
                            : "Please complete this field"}
                        </p>
                      ) : null}
                    </div>

                    <div id="signup-field-wrap-confirm-password">
                      <label
                        htmlFor="signup-confirm-password"
                        className="text-sm font-medium text-[#0E0E0E]"
                      >
                        Confirm password
                      </label>
                      <input
                        id="signup-confirm-password"
                        name="confirm_password"
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          clearFieldError("confirmPassword");
                        }}
                        disabled={loading}
                        className={inputClassName(Boolean(fieldErrors.confirmPassword))}
                      />
                      {fieldErrors.confirmPassword ? (
                        <p className="mt-1 text-sm text-red-500">
                          Passwords do not match or this field is required.
                        </p>
                      ) : null}
                    </div>

                    <div id="signup-field-wrap-country">
                      <label
                        htmlFor="country"
                        className="text-sm font-medium text-[#0E0E0E]"
                      >
                        Country
                      </label>
                      <select
                        id="country"
                        value={country}
                        onChange={(e) => {
                          setCountry(e.target.value);
                          clearFieldError("country");
                        }}
                        disabled={loading}
                        className={`${inputClassName(Boolean(fieldErrors.country))} bg-white`}
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.country ? (
                        <p className="mt-1 text-sm text-red-500">
                          Please complete this field
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="text-sm font-medium text-[#0E0E0E]"
                      >
                        Phone number (optional)
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={phoneNumber}
                        onChange={(e) =>
                          setPhoneNumber(formatPhoneInput(e.target.value))
                        }
                        disabled={loading}
                        placeholder="e.g. +27 82 123 4567"
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-red-600">{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-lg bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786] disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      {loading ? "Sending code…" : "Create a Free Business Account"}
                    </button>
                  </form>

                  <div className="mt-6 space-y-3 text-xs text-gray-500">
                    <p>
                      This site is protected by reCAPTCHA and the Google{" "}
                      <Link
                        href="/privacy-policy"
                        className="text-[#1FAF9E] hover:underline"
                      >
                        Privacy Policy
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/terms-of-service"
                        className="text-[#1FAF9E] hover:underline"
                      >
                        Terms of Service
                      </Link>{" "}
                      apply.
                    </p>
                    <p>
                      By submitting this form you accept our{" "}
                      <Link
                        href="/privacy-policy"
                        className="text-[#1FAF9E] hover:underline"
                      >
                        Privacy Policy
                      </Link>{" "}
                      and agree to receive emails or calls from Tellacity about
                      our products and services. You may unsubscribe at anytime
                      by clicking the unsubscribe link at the bottom of the
                      email or by contacting us at{" "}
                      <a
                        href="mailto:privacy@tellacity.com"
                        className="text-[#1FAF9E] hover:underline"
                      >
                        privacy@tellacity.com
                      </a>
                      . Tellacity's calls may be recorded for training and
                      quality purposes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
