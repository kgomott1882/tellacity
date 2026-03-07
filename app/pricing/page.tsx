"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, TrendingUp, BarChart3 } from "lucide-react";

type Plan = {
  name: string;
  price: string;
  priceSub?: string;
  description: string;
  features: string[];
  connectors?: string[];
  highlight?: boolean;
};

const plans: Plan[] = [
  {
    name: "Free",
    price: "$0",
    description: "Basic tools for getting started with reputation management.",
    features: [
      "Claim your business profile",
      "Verified Business Dashboard access",
      "Receive unlimited consumer reviews",
      "25 review invites per month",
      "Basic Email review invitations",
    ],
  },
  {
    name: "Grow",
    price: "$69",
    priceSub: "/ month",
    description: "Essential tools to actively build trust and collect reviews.",
    features: [
      "100 review invites per month",
      "Email & SMS review invitations",
      "Customisable email invite templates",
      "QR code reviews",
      "Photo reviews (with proof upload)",
      "Standard on-site widget library",
      "Review & invite performance analytics",
    ],
    connectors: ["Shopify", "WooCommerce", "WordPress"],
  },
  {
    name: "Premium",
    price: "$199",
    priceSub: "/ month",
    description: "Advanced features to scale visibility and automate growth.",
    features: [
      "Everything in Grow",
      "500 review invites per month",
      "Automated review invitation flows",
      "Expanded widget library (customisable)",
      "Advanced analytics & sentiment analysis",
      "Multi-location review management",
      "Team alerts & notifications",
      "Premium Credibility Badge",
      "Multi-user logins (10 users)",
      "API access (read-only)",
    ],
    connectors: ["Twilio", "Klaviyo", "Magento", "HubSpot", "Slack", "Zendesk"],
    highlight: true,
  },
  {
    name: "Elite",
    price: "$489",
    priceSub: "/ month",
    description: "Enterprise-grade brand management & strategic insights.",
    features: [
      "Everything in Premium",
      "3,000 review invites per month",
      "Bulk upload & automation rules",
      "White-label solution options",
      "Full API access (read/write)",
      "Strategic insights & benchmarking",
      'Priority placement ("Featured")',
      "Role-based team access (Unlimited)",
      "Custom enterprise integrations",
      "Scheduled auto-exports",
      "Dedicated account manager",
    ],
    connectors: ["Zapier", "SAP", "Salesforce", "NetSuite", "Marketo"],
  },
];

const pricingButtonClass =
  "w-full mt-6 rounded-xl bg-black text-white py-3 font-semibold shadow-lg shadow-black/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-95";

/** Feature row: [Feature label, Free, Grow, Premium, Elite] */
type FeatureRow = [string, string, string, string, string];

const comparisonTableRows: Array<{ type: "section"; label: string } | { type: "feature"; row: FeatureRow }> = [
  { type: "section", label: "COLLECT" },
  { type: "feature", row: ["Review invitations / month", "25", "100", "500", "3,000"] },
  { type: "feature", row: ["Email invites", "✓", "✓", "✓", "✓"] },
  { type: "feature", row: ["Customisable email templates", "–", "✓", "✓", "✓"] },
  { type: "feature", row: ["QR code reviews", "–", "✓", "✓", "✓"] },
  { type: "feature", row: ["API access", "–", "–", "Read-only", "Full Read/Write"] },
  { type: "section", label: "VERIFY" },
  { type: "feature", row: ["Photo reviews with proof", "–", "✓", "✓", "✓"] },
  { type: "feature", row: ["Credibility & visibility", "Profile", "Verified Badge", "Premium Badge", "Featured placement"] },
  { type: "section", label: "MANAGE" },
  { type: "feature", row: ["Multi-location management", "–", "–", "✓", "✓"] },
  { type: "feature", row: ["Notifications & alerts", "Basic", "Standard", "Team alerts", "Custom enterprise"] },
  { type: "feature", row: ["Team access", "1 User", "3 Users", "10 Users", "Unlimited (SSO)"] },
  { type: "section", label: "SHOWCASE" },
  { type: "feature", row: ["On-site widget library", "Basic", "Standard", "Expanded", "Full + Custom CSS"] },
  { type: "feature", row: ["White-label solution", "–", "–", "–", "✓"] },
  { type: "section", label: "UNDERSTAND" },
  { type: "feature", row: ["Reviews & invite analytics", "Basic", "Standard", "Advanced", "Advanced + exports"] },
  { type: "feature", row: ["Strategic insights", "–", "–", "Sentiment", "Sentiment + Benchmarks"] },
  { type: "feature", row: ["Data exports", "–", "CSV", "CSV + JSON", "Scheduled auto-exports"] },
  { type: "section", label: "INTEGRATE" },
  { type: "feature", row: ["Integration connectors", "–", "3", "Unlimited", "Unlimited"] },
  { type: "feature", row: ["Custom enterprise integrations", "–", "–", "–", "✓"] },
];

const integrationLogos: Record<string, string> = {
  Shopify: "shopify.jpg",
  WooCommerce: "woocommerce.jpg",
  WordPress: "WordPress.jpg",
  Twilio: "Twilio.jpg",
  Klaviyo: "Klaviyo.jpg",
  Magento: "Magento.jpg",
  HubSpot: "HubSpot.jpg",
  Slack: "Slack.jpg",
  Zendesk: "Zendesk.jpg",
  Zapier: "Zapier.jpg",
  SAP: "sap.jpg",
  Salesforce: "Salesforce.jpg",
  NetSuite: "netsuite.jpg",
  Marketo: "marketo.jpg",
};

const faqs = [
  {
    question: "Can I start on the Free plan and upgrade later?",
    answer:
      "Yes. Many businesses start on the Free plan to establish their profile and move to Grow, Premium, or Elite as their review volume and requirements increase.",
  },
  {
    question: "Do you charge extra fees for integrations?",
    answer:
      "Tellacity only charges for access to connectors within your plan. Any third‑party platform fees (for example Shopify, Twilio, or Salesforce) are billed separately by those providers.",
  },
  {
    question: "Is there a long‑term contract?",
    answer:
      "Plans are available on flexible terms. You can start monthly and move to an annual agreement when your team is ready for longer‑term optimisation.",
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isCustomPlanOpen, setIsCustomPlanOpen] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [customPlanLoading, setCustomPlanLoading] = useState(false);
  const [customPlanError, setCustomPlanError] = useState<string | null>(null);
  const [customPlanForm, setCustomPlanForm] = useState({
    fullName: "",
    companyName: "",
    email: "",
    volume: "",
    message: "",
  });
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const prices = {
    grow: {
      monthly: 69,
      annual: 55,
    },
    premium: {
      monthly: 199,
      annual: 159,
    },
    elite: {
      monthly: 489,
      annual: 399,
    },
  } as const;

  const sparkles = Array.from({ length: 20 }).map((_, index) => ({
    id: index,
    top: (index * 17) % 100,
    left: (index * 31) % 100,
  }));

  return (
    <main className="bg-[#F7F8FA]">
      {/* HERO */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16 grid gap-10 md:grid-cols-2 items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="space-y-5"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
            Pricing
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold text-[#0E0E0E]">
            Simple, Transparent Pricing That Scales With Your Business.
          </h1>
          <p className="text-sm md:text-base text-gray-600 max-w-xl">
            Start free. Upgrade when you grow. No hidden fees.
          </p>

          <div className="mt-4 inline-flex items-center gap-3 rounded-full bg-white p-1 shadow-sm">
            <div className="relative flex rounded-full bg-neutral-100">
              <motion.div
                className="absolute inset-y-0 w-1/2 rounded-full bg-[#0E0E0E]"
                animate={{ x: billing === "monthly" ? 0 : "100%" }}
                transition={{ type: "tween", duration: 0.25 }}
              />
              {["monthly", "annual"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setBilling(mode as "monthly" | "annual")}
                  className={`relative z-10 px-4 py-2 text-xs font-semibold transition-colors ${
                    billing === mode ? "text-white" : "text-gray-600"
                  }`}
                >
                  {mode === "monthly" ? "Monthly" : "Annual"}
                </button>
              ))}
            </div>
            <span className="inline-flex items-center rounded-full bg-[#FCD34D]/30 px-3 py-1 text-[10px] font-semibold text-[#B45309]">
              Save 20% on annual billing
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={billing}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="text-[11px] text-gray-500"
            >
              {billing === "monthly"
                ? "Prices shown are monthly. Switch to annual when you’re ready for longer-term optimisation."
                : "Annual agreements reflect approximately 20% savings vs month‑to‑month, billed yearly."}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="relative hidden md:block"
        >
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-[#1FAF9E]/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-[#0E3B36]/10 blur-3xl" />
          <motion.div
            animate={{ y: [-6, 6] }}
            transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
            className="relative mx-auto max-w-md rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
              <span className="font-semibold text-[#0E0E0E]">Tellacity Plans</span>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                Trusted pricing
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-[11px]">
              {plans
                .filter((plan) => plan.name !== "Free")
                .map((plan) => (
                  <div
                    key={plan.name}
                    className={`rounded-2xl p-3 ${
                      plan.name === "Premium"
                        ? "bg-[#0E0E0E] text-white"
                        : "bg-[#F7F8FA] text-[#0E0E0E]"
                    }`}
                  >
                    <p className={plan.name === "Premium" ? "text-gray-200" : "text-gray-500"}>
                      {plan.name}
                    </p>
                    <p
                      className={`mt-1 text-lg font-semibold ${
                        plan.name === "Premium" ? "" : "text-[#0E0E0E]"
                      }`}
                    >
                      {plan.price}
                    </p>
                    <p
                      className={`mt-1 text-[10px] ${
                        plan.name === "Premium" ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      {plan.name === "Grow"
                        ? "Best for scaling"
                        : plan.name === "Premium"
                        ? "Advanced teams"
                        : "Enterprise support"}
                    </p>
                  </div>
                ))}
            </div>
            <div className="mt-4 rounded-2xl bg-[#F7F8FA] p-3 text-[11px] text-gray-600">
              <p className="font-semibold text-[#0E0E0E]">Predictable, usage‑based invites</p>
              <p className="mt-1">
                Move between plans as review volume changes. No setup fees or surprise line items.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* PRICING CARDS */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-8">
        <div className="flex items-center justify-center gap-3 mb-8">
          <button
            type="button"
            onClick={() => setBilling("monthly")}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              billing === "monthly"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBilling("annual")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              billing === "annual"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            <span>Annual</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              Save 20%
            </span>
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="relative"
            >
              {plan.highlight && (
                <motion.div
                  className="absolute -inset-1 rounded-3xl bg-[#1FAF9E]/10 blur-xl"
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />
              )}
              <div
                className={`relative flex h-full flex-col rounded-3xl border ${
                  plan.highlight
                    ? "border-[#1FAF9E] bg-white shadow-xl scale-[1.03]"
                    : "border-neutral-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1"
                } p-6 transition-all duration-300`}
              >
                {plan.highlight && (
                  <div className="absolute inset-x-0 -top-4 flex justify-center">
                    <span className="rounded-full bg-gradient-to-r from-[#1FAF9E] to-[#0E3B36] px-4 py-1 text-[10px] font-semibold text-white shadow-sm">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="mt-2 text-sm font-semibold text-[#0E0E0E]">
                  {plan.name}
                </h3>
                <p className="mt-2 text-xs text-gray-600">{plan.description}</p>
                <div className="mt-5">
                  {plan.name === "Free" ? (
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-semibold text-[#0E0E0E]">
                        {plan.price}
                      </span>
                    </div>
                  ) : (
                    <>
                      <motion.div
                        key={billing}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-end gap-1"
                      >
                        <span className="text-3xl font-semibold text-[#0E0E0E]">
                          $
                          {plan.name === "Grow"
                            ? billing === "monthly"
                              ? prices.grow.monthly
                              : prices.grow.annual
                            : plan.name === "Premium"
                            ? billing === "monthly"
                              ? prices.premium.monthly
                              : prices.premium.annual
                            : billing === "monthly"
                            ? prices.elite.monthly
                            : prices.elite.annual}
                        </span>
                        <span className="pb-1 text-sm font-normal text-gray-500">
                          /mo
                        </span>
                      </motion.div>
                      {billing === "annual" && (
                        <p className="text-xs text-gray-500 mt-1">
                          Billed annually
                        </p>
                      )}
                    </>
                  )}
                </div>
                <ul className="mt-5 space-y-3 text-xs text-gray-600">
                  {plan.features.map((feature) => (
                    <motion.li
                      key={feature}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3 }}
                      className="flex items-start gap-2"
                    >
                      <span className="mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#1FAF9E] text-[10px] font-semibold text-[#1FAF9E]">
                        ✓
                      </span>
                      <span>{feature}</span>
                    </motion.li>
                  ))}
                </ul>
                {plan.name !== "Free" && plan.connectors && plan.connectors.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
                      Connectors included
                    </p>
                    <div className="flex flex-wrap gap-x-2 gap-y-1">
                      {plan.connectors.map((connector) => (
                        <span
                          key={connector}
                          className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200 whitespace-nowrap"
                        >
                          {connector}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const key =
                      plan.name.toLowerCase() as "free" | "grow" | "premium" | "elite";
                    setSelectedPlan(key);
                    setShowUpgradeModal(true);
                  }}
                  className={pricingButtonClass}
                >
                  Choose This Plan
                </button>
                {plan.name === "Premium" && (
                  <p className="mt-2 text-xs text-gray-500 text-center opacity-70">
                    Most businesses choose this plan.
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white px-6 py-6 text-xs text-gray-600 shadow-sm">
          <p className="font-semibold text-[#0E0E0E] text-center mb-1">
            Need custom pricing?
          </p>
          <p className="mt-1 text-xs text-gray-600 text-center">
            For larger teams or unique enterprise needs, request a Custom Plan.
          </p>
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => {
                setCustomPlanError(null);
                setIsCustomPlanOpen(true);
              }}
              className="rounded-xl bg-black px-5 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-neutral-800"
            >
              Custom Plan
            </button>
          </div>
        </div>

        <div className="mt-8 max-w-6xl mx-auto rounded-2xl border border-gray-200 bg-white px-8 py-8 text-xs text-gray-600 shadow-sm">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Integrations &amp; Add-Ons
              </h3>
              <p className="mt-1 text-xs text-gray-600">
                Connect Tellacity with your existing tools. Enterprise systems available on request.
              </p>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold text-gray-500">
                Core Integrations
              </p>
              <div className="flex flex-wrap gap-3">
                {[
                  "Shopify",
                  "WooCommerce",
                  "WordPress",
                  "Twilio",
                  "Klaviyo",
                  "Magento",
                  "HubSpot",
                  "Slack",
                  "Zendesk",
                  "Zapier",
                ].map((name) => {
                  const logoFile = integrationLogos[name];
                  return (
                    <span
                      key={name}
                      className="flex items-center bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-gray-700 shadow-xs hover:shadow-sm transition-all"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {logoFile && (
                        <img
                          src={`/brand/${logoFile}`}
                          alt={`${name} logo`}
                          className="mr-2 h-8 w-8 object-contain opacity-90"
                        />
                      )}
                      <span>{name}</span>
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-6">
              <p className="mb-2 text-[11px] font-semibold text-gray-500">
                Enterprise Add-Ons
              </p>
              <div className="flex flex-wrap gap-3">
                {["SAP", "Salesforce", "NetSuite", "Marketo"].map((name) => {
                  const logoFile = integrationLogos[name];
                  return (
                    <span
                      key={name}
                      className="flex items-center bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-gray-700 shadow-xs hover:shadow-sm transition-all"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {logoFile && (
                        <img
                          src={`/brand/${logoFile}`}
                          alt={`${name} logo`}
                          className="mr-2 h-8 w-8 object-contain opacity-90"
                        />
                      )}
                      <span>{name}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE COMPARISON */}
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            Detailed Feature Comparison
          </h2>
          <p className="mt-2 text-xs text-gray-600">
            Compare all features and limits across plans
          </p>
        </div>
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-[11px] font-semibold text-[#0E0E0E]">
                <tr>
                  <th className="px-4 py-3">Feature</th>
                  <th className="px-4 py-3">Free</th>
                  <th className="px-4 py-3">Grow</th>
                  <th className="px-4 py-3">Premium</th>
                  <th className="px-4 py-3">Elite</th>
                </tr>
              </thead>
              <tbody>
                {comparisonTableRows.map((item) =>
                  item.type === "section" ? (
                    <tr
                      key={item.label}
                      className="border-t border-gray-200 bg-gray-50"
                    >
                      <td
                        colSpan={5}
                        className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-600"
                      >
                        {item.label}
                      </td>
                    </tr>
                  ) : (
                    <motion.tr
                      key={item.row[0]}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-[#0E0E0E] md:sticky md:left-0 bg-white">
                        {item.row[0]}
                      </td>
                      <td className="px-4 py-3">{item.row[1]}</td>
                      <td className="px-4 py-3">{item.row[2]}</td>
                      <td className="px-4 py-3">{item.row[3]}</td>
                      <td className="px-4 py-3">{item.row[4]}</td>
                    </motion.tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ ACCORDION */}
      <section className="bg-white py-14">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="text-base font-semibold text-[#0E0E0E]">
              Still have questions?
            </h3>
            <p className="mt-2 text-xs text-gray-600">
              Our team is here to help you choose the right plan for your business needs.
            </p>
          </div>

          <div className="mx-auto mt-6 max-w-2xl space-y-3">
            {faqs.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={item.question}
                  className="rounded-2xl border border-gray-200 bg-[#F7F8FA] p-3 text-xs text-gray-700 shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <span className="font-semibold text-[#0E0E0E]">
                      {item.question}
                    </span>
                    <span className="ml-3 text-gray-400">
                      {isOpen ? "–" : "+"}
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <p className="mt-3 text-gray-600">
                          {item.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CUSTOM PLAN MODAL */}
      {isCustomPlanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Request a Custom Plan
              </h3>
              <button
                type="button"
                onClick={() => setIsCustomPlanOpen(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <form
              className="mt-4 space-y-3 text-xs"
              onSubmit={async (e) => {
                e.preventDefault();
                if (customPlanLoading) return;
                setCustomPlanLoading(true);
                setCustomPlanError(null);
                try {
                  const res = await fetch("/api/custom-plan", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      fullName: customPlanForm.fullName,
                      companyName: customPlanForm.companyName,
                      email: customPlanForm.email,
                      volume: customPlanForm.volume,
                      message: customPlanForm.message,
                    }),
                  });
                  if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error || "Failed to send request.");
                  }
                  setIsCustomPlanOpen(false);
                  setRequestSent(true);
                  setCustomPlanForm({
                    fullName: "",
                    companyName: "",
                    email: "",
                    volume: "",
                    message: "",
                  });
                } catch (error: any) {
                  setCustomPlanError(error.message || "Something went wrong.");
                } finally {
                  setCustomPlanLoading(false);
                }
              }}
            >
              <div>
                <label className="block text-[11px] font-semibold text-gray-700">
                  Full Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customPlanForm.fullName}
                  onChange={(e) =>
                    setCustomPlanForm((prev) => ({
                      ...prev,
                      fullName: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-[#0E0E0E]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700">
                  Company Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customPlanForm.companyName}
                  onChange={(e) =>
                    setCustomPlanForm((prev) => ({
                      ...prev,
                      companyName: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-[#0E0E0E]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700">
                  Work Email<span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={customPlanForm.email}
                  onChange={(e) =>
                    setCustomPlanForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-[#0E0E0E]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700">
                  Estimated Monthly Review Volume
                </label>
                <select
                  value={customPlanForm.volume}
                  onChange={(e) =>
                    setCustomPlanForm((prev) => ({
                      ...prev,
                      volume: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-[#0E0E0E]"
                >
                  <option value="">Select an option</option>
                  <option value="3,000-5,000">3,000–5,000</option>
                  <option value="5,001-10,000">5,001–10,000</option>
                  <option value="10,001-25,000">10,001–25,000</option>
                  <option value="25,001-50,000">25,001–50,000</option>
                  <option value="50,000+">50,000+</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700">
                  Message
                </label>
                <textarea
                  rows={3}
                  value={customPlanForm.message}
                  onChange={(e) =>
                    setCustomPlanForm((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-[#0E0E0E]"
                />
              </div>
              {customPlanError && (
                <p className="text-[11px] text-red-600">{customPlanError}</p>
              )}
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomPlanOpen(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={customPlanLoading}
                  className="rounded-lg bg-[#0E0E0E] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:opacity-60"
                >
                  {customPlanLoading ? "Sending..." : "Send Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM PLAN SUCCESS OVERLAY */}
      {requestSent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl text-center"
          >
            <p className="text-sm font-semibold text-[#0E0E0E]">
              ✅ Request Sent Successfully
            </p>
            <p className="mt-2 text-xs text-gray-600">
              Our sales team has received your request. We’ll contact you shortly at your work email.
            </p>
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setRequestSent(false)}
                className="rounded-xl bg-black px-5 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-neutral-800"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* FINAL CTA */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#0E0E0E] via-[#0E3B36] to-[#1FAF9E] py-16">
        <motion.div
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 0.9 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="absolute inset-0 pointer-events-none">
            {sparkles.map((sparkle) => (
              <motion.span
                key={sparkle.id}
                className="absolute h-1 w-1 rounded-full bg-white/40"
                style={{
                  top: `${sparkle.top}%`,
                  left: `${sparkle.left}%`,
                }}
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: sparkle.id * 0.1,
                }}
              />
            ))}
          </div>
        </motion.div>

        <div className="relative mx-auto w-full max-w-6xl px-6 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-semibold">
            Start Free. Scale With Confidence.
          </h2>
          <p className="mt-3 text-sm md:text-base text-gray-100 max-w-2xl mx-auto">
            Build trust before you pay. Create your business profile and start collecting verified reviews.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/business/signup"
              className="inline-flex items-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#0E0E0E] shadow-sm hover:bg-gray-100 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* UPGRADE CONFIRMATION MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-2">Confirm Your Plan</h2>
            <p className="text-neutral-600 mb-6">
              You selected the{" "}
              <span className="font-semibold capitalize">{selectedPlan}</span> plan.
            </p>

            <div className="rounded-xl border p-4 mb-6 bg-neutral-50">
              {selectedPlan === "free" && (
                <ul className="space-y-2 text-sm">
                  <li>✓ 25 review invites/month</li>
                  <li>✓ Basic dashboard</li>
                  <li>✓ Email invites</li>
                </ul>
              )}

              {selectedPlan === "grow" && (
                <ul className="space-y-2 text-sm">
                  <li>✓ 100 review invites/month</li>
                  <li>✓ Email &amp; SMS invites</li>
                  <li>✓ Performance analytics</li>
                </ul>
              )}

              {selectedPlan === "premium" && (
                <ul className="space-y-2 text-sm">
                  <li>✓ 500 review invites/month</li>
                  <li>✓ Multi-location management</li>
                  <li>✓ Advanced analytics</li>
                  <li>✓ Premium credibility badge</li>
                </ul>
              )}

              {selectedPlan === "elite" && (
                <ul className="space-y-2 text-sm">
                  <li>✓ 3,000 review invites/month</li>
                  <li>✓ White-label options</li>
                  <li>✓ API access</li>
                  <li>✓ Dedicated account manager</li>
                </ul>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="px-5 py-2 rounded-lg border"
              >
                Cancel
              </button>

              <a
                href={`/business/signup?plan=${selectedPlan ?? ""}`}
                className="px-6 py-2 rounded-lg bg-black text-white font-semibold shadow-lg shadow-black/20 hover:shadow-xl transition-all"
              >
                Confirm &amp; Continue
              </a>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP STICKY CONVERSION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-50 hidden md:flex items-center justify-between px-10 py-4 bg-white border-t shadow-sm">
        <div className="text-sm font-semibold text-[#0E0E0E]">
          Premium – <span className="text-base font-bold">$199/mo</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedPlan("premium");
            setShowUpgradeModal(true);
          }}
          className="rounded-full bg-black px-6 py-3 text-white font-semibold shadow-lg shadow-black/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
        >
          Start Now
        </button>
      </div>
    </main>
  );
}

