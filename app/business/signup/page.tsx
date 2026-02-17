"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { supabase } from "@/lib/supabaseClient";
import PasswordSetupPopup from "./_components/PasswordSetupPopup";

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

const EMPLOYEE_RANGES = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001-5000",
  "5001+",
];

const REVENUE_RANGES = [
  "Less than $100K",
  "$100K - $500K",
  "$500K - $1M",
  "$1M - $5M",
  "$5M - $10M",
  "$10M - $50M",
  "$50M+",
];

export default function BusinessSignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const allowedPlans = ["free", "grow", "premium", "elite"];
  const paramPlan = searchParams.get("plan");
  const initialPlan = allowedPlans.includes(paramPlan || "") ? (paramPlan as string) : "free";
  const [website, setWebsite] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [country, setCountry] = useState("US");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [numberOfEmployees, setNumberOfEmployees] = useState("");
  const [annualRevenue, setAnnualRevenue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    
    if (!website.trim() || !companyName.trim() || !firstName.trim() || !lastName.trim() || !jobTitle.trim() || !workEmail.trim() || !phoneNumber.trim() || !numberOfEmployees || !annualRevenue) {
      setError("Please complete all required fields.");
      return;
    }

    // Show password setup popup instead of directly creating account
    setShowPasswordPopup(true);
  };

  const handleGoogleSignup = async () => {
    setError("");
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("tellacity_auth_redirect", "true");
      }
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/business/dashboard`
              : undefined,
        },
      });
      if (oauthError) {
        setError(oauthError.message);
      }
    } catch (oauthErr) {
      setError(
        oauthErr instanceof Error
          ? oauthErr.message
          : "Unable to start Google sign-up. Please try again."
      );
    }
  };

  const fullName = `${firstName.trim()} ${lastName.trim()}`;

  return (
    <main className="min-h-screen bg-white">
      <PasswordSetupPopup
        isOpen={showPasswordPopup}
        onClose={() => setShowPasswordPopup(false)}
        fullName={fullName}
        email={workEmail.trim()}
        businessData={{
          website,
          companyName,
          firstName,
          lastName,
          jobTitle,
          country,
          phoneNumber,
          numberOfEmployees,
          annualRevenue,
          plan: selectedPlan,
        }}
      />
      <div className="flex min-h-screen">
        <div className="hidden lg:flex lg:w-1/2 flex-col bg-[#F8F4F0] px-12 py-16">
          <Link href="/for-business" className="text-sm text-gray-600 hover:text-[#0E0E0E] mb-12">
            ← Back
          </Link>
          <div className="mb-12">
            <img
              src="/brand/Tellacity%20-Business%20Logo.png"
              alt="Tellacity Business"
              className="h-10 w-auto mb-8"
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
                  Collect authentic customer feedback on an open, transparent platform people rely on.
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
                  Tellacity ratings and reviews help turn visitors into customers more often than competing platforms.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex flex-col overflow-y-auto">
          <div className="flex-1 px-6 py-8 lg:px-12 lg:py-16">
            <div className="lg:hidden mb-6">
              <Link href="/for-business" className="text-sm text-gray-600 hover:text-[#0E0E0E] mb-4 inline-block">
                ← Back
              </Link>
              <img
                src="/brand/Tellacity%20-Business%20Logo.png"
                alt="Tellacity Business"
                className="h-8 w-auto"
              />
            </div>

            <div className="max-w-md mx-auto lg:mx-0">
              <h1 className="text-2xl font-semibold text-[#0E0E0E] mb-6">
                Create a free account
              </h1>

              <div className="mb-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-sm text-neutral-600">Selected Plan:</p>
                <p className="text-lg font-semibold capitalize">
                  {selectedPlan}
                </p>
                <p className="text-xs text-neutral-500 mt-2">
                  You can change your plan later inside your dashboard.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:border-[#1FAF9E] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      d="M23.49 12.27c0-.81-.07-1.6-.2-2.36H12v4.48h6.47a5.54 5.54 0 01-2.4 3.64v3.02h3.88c2.27-2.09 3.54-5.18 3.54-8.78z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 24c3.24 0 5.97-1.07 7.96-2.91l-3.88-3.02c-1.08.72-2.46 1.15-4.08 1.15-3.14 0-5.8-2.12-6.75-4.97H1.25v3.12A12 12 0 0012 24z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.25 14.25a7.2 7.2 0 010-4.5V6.63H1.25a12 12 0 000 10.74l4-3.12z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 4.78c1.76 0 3.35.6 4.6 1.77l3.45-3.45C17.96 1.14 15.23 0 12 0 7.3 0 3.22 2.69 1.25 6.63l4 3.12C6.2 6.9 8.86 4.78 12 4.78z"
                      fill="#EA4335"
                    />
                  </svg>
                  Sign up with Google
                </button>

                <div className="flex items-center gap-3 my-6">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-xs text-gray-400">OR</span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                <p className="text-sm font-semibold text-[#0E0E0E] mb-4">
                  Sign up with email
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="website" className="text-sm font-medium text-[#0E0E0E]">
                      Website
                    </label>
                    <input
                      id="website"
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      disabled={loading}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                      placeholder="example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="company-name" className="text-sm font-medium text-[#0E0E0E]">
                      Company name
                    </label>
                    <input
                      id="company-name"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      disabled={loading}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="first-name" className="text-sm font-medium text-[#0E0E0E]">
                      First name
                    </label>
                    <input
                      id="first-name"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={loading}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="last-name" className="text-sm font-medium text-[#0E0E0E]">
                      Last name
                    </label>
                    <input
                      id="last-name"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={loading}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="job-title" className="text-sm font-medium text-[#0E0E0E]">
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

                  <div>
                    <label htmlFor="work-email" className="text-sm font-medium text-[#0E0E0E]">
                      Work email
                    </label>
                    <input
                      id="work-email"
                      type="email"
                      value={workEmail}
                      onChange={(e) => setWorkEmail(e.target.value)}
                      disabled={loading}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="country" className="text-sm font-medium text-[#0E0E0E]">
                        Country
                      </label>
                      <select
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        disabled={loading}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20 bg-white"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="phone" className="text-sm font-medium text-[#0E0E0E]">
                        Phone number
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled={loading}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="employees" className="text-sm font-medium text-[#0E0E0E]">
                      Number of employees
                    </label>
                    <select
                      id="employees"
                      value={numberOfEmployees}
                      onChange={(e) => setNumberOfEmployees(e.target.value)}
                      disabled={loading}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20 bg-white"
                    >
                      <option value="">Select...</option>
                      {EMPLOYEE_RANGES.map((range) => (
                        <option key={range} value={range}>
                          {range}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="revenue" className="text-sm font-medium text-[#0E0E0E]">
                      Annual revenue
                    </label>
                    <select
                      id="revenue"
                      value={annualRevenue}
                      onChange={(e) => setAnnualRevenue(e.target.value)}
                      disabled={loading}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20 bg-white"
                    >
                      <option value="">Select...</option>
                      {REVENUE_RANGES.map((range) => (
                        <option key={range} value={range}>
                          {range}
                        </option>
                      ))}
                    </select>
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786] disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {loading ? "Processing..." : "Create a free account"}
                  </button>
                </form>

                <div className="mt-6 space-y-3 text-xs text-gray-500">
                  <p>
                    This site is protected by reCAPTCHA and the Google{" "}
                    <Link href="/privacy-policy" className="text-[#1FAF9E] hover:underline">
                      Privacy Policy
                    </Link>{" "}
                    and{" "}
                    <Link href="/terms-of-service" className="text-[#1FAF9E] hover:underline">
                      Terms of Service
                    </Link>{" "}
                    apply.
                  </p>
                  <p>
                    By submitting this form you accept our{" "}
                    <Link href="/privacy-policy" className="text-[#1FAF9E] hover:underline">
                      Privacy Policy
                    </Link>{" "}
                    and agree to receive emails or calls from Tellacity about our products and services. You may unsubscribe at anytime by clicking the unsubscribe link at the bottom of the email or by contacting us at{" "}
                    <a href="mailto:privacy@tellacity.com" className="text-[#1FAF9E] hover:underline">
                      privacy@tellacity.com
                    </a>
                    . Tellacity's calls may be recorded for training and quality purposes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
