"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageSquareText,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

function DashboardMock() {
  return (
    <div className="relative h-72 w-full max-w-md rounded-3xl border border-neutral-200 bg-gradient-to-br from-[#F5FAF9] via-white to-[#E5F4F2] shadow-sm mx-auto overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-200 bg-white/70 backdrop-blur-sm">
        <div className="h-2 w-2 rounded-full bg-emerald-400" />
        <div className="h-2 w-2 rounded-full bg-amber-400" />
        <div className="h-2 w-2 rounded-full bg-rose-400" />
        <p className="ml-2 text-xs font-medium text-gray-600">Trust Overview</p>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="rounded-xl bg-white/80 p-3 shadow-sm">
            <p className="text-[10px] text-gray-500">TrustScore</p>
            <p className="mt-1 text-lg font-semibold text-[#0E0E0E]">4.6</p>
            <p className="mt-1 text-[10px] text-emerald-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +0.3
            </p>
          </div>
          <div className="rounded-xl bg-white/80 p-3 shadow-sm">
            <p className="text-[10px] text-gray-500">New reviews</p>
            <p className="mt-1 text-lg font-semibold text-[#0E0E0E]">132</p>
            <p className="mt-1 text-[10px] text-gray-500">Last 30 days</p>
          </div>
          <div className="rounded-xl bg-white/80 p-3 shadow-sm">
            <p className="text-[10px] text-gray-500">Response rate</p>
            <p className="mt-1 text-lg font-semibold text-[#0E0E0E]">93%</p>
            <p className="mt-1 text-[10px] text-gray-500">Under 24 hours</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white/80 p-3 shadow-sm">
          <p className="text-[10px] text-gray-500 mb-1">Review volume</p>
          <div className="flex items-end gap-1 h-20">
            {[30, 40, 55, 50, 70, 68].map((height, i) => (
              <div
                key={i}
                className="flex-1 rounded-full bg-[#1FAF9E]/20 overflow-hidden"
              >
                <div
                  className="w-full rounded-full bg-[#1FAF9E]"
                  style={{ height: `${height}%` }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <div className="rounded-xl bg-white/80 p-2.5 shadow-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <div>
              <p className="font-medium text-gray-800">Verified reviews</p>
              <p className="text-[10px] text-gray-500">Fraud checks enabled</p>
            </div>
          </div>
          <div className="rounded-xl bg-white/80 p-2.5 shadow-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-sky-500" />
            <div>
              <p className="font-medium text-gray-800">Conversion impact</p>
              <p className="text-[10px] text-gray-500">+18% at checkout</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FloatingReview({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: -8 }}
      transition={{
        delay,
        duration: 1.2,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
      }}
      className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm flex items-start gap-2 text-xs max-w-xs"
    >
      <div className="mt-0.5">
        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
      </div>
      <div>
        <p className="font-semibold text-gray-800">“Excellent support”</p>
        <p className="text-[11px] text-gray-600">
          We saw more reviews in 90 days than the previous 18 months.
        </p>
      </div>
    </motion.div>
  );
}

export default function SolutionPage() {
  return (
    <main className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-neutral-200 bg-gradient-to-b from-[#F5FAF9] via-white to-white">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -left-20 top-10 h-56 w-56 rounded-full bg-[#1FAF9E]/10 blur-3xl" />
          <div className="absolute right-0 bottom-0 h-64 w-64 rounded-full bg-[#0E3B36]/10 blur-3xl" />
        </div>

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16 md:flex-row md:items-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-10 flex-1 space-y-5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
              Solutions for Businesses
            </p>
            <h1 className="text-3xl font-bold text-[#0E0E0E] sm:text-4xl md:text-5xl">
              Turn Customer Feedback Into Business Growth.
            </h1>
            <p className="max-w-xl text-sm md:text-base text-gray-600">
              Collect, manage, and showcase verified reviews to build trust that drives conversions across
              every touchpoint in the customer journey.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/business/signup"
                className="inline-flex items-center rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition"
              >
                Get Started
              </Link>
              <Link
                href="/partner-program/contact"
                className="inline-flex items-center rounded-lg border border-neutral-300 px-6 py-3 text-sm font-semibold text-[#0E0E0E] hover:bg-neutral-50 transition"
              >
                Book a Demo
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
              <div className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                <span>Verified reviews</span>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1">
                <BarChart3 className="h-3 w-3 text-sky-500" />
                <span>Reputation insights</span>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1">
                <MessageSquareText className="h-3 w-3 text-indigo-500" />
                <span>Social proof widgets</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative z-10 flex-1"
          >
            <DashboardMock />

            <div className="pointer-events-none absolute inset-0">
              <FloatingReview delay={0.4} />
              <div className="absolute bottom-4 right-0">
                <FloatingReview delay={0.8} />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Built for Different Goals */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            Built for Different Goals. Designed for Trust.
          </h2>
          <p className="mt-3 text-sm text-gray-600">
            Whether you&apos;re launching your first store or managing a global footprint, Tellacity adapts to
            how your team builds and maintains trust.
          </p>
        </motion.div>

        <div className="mt-10 space-y-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              By Business Goal
            </p>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              className="mt-4 grid gap-6 md:grid-cols-2"
            >
              {[
                {
                  icon: MessageSquareText,
                  title: "Engage with feedback",
                  copy:
                    "Respond to reviews publicly, resolve issues transparently, and show customers you're listening.",
                },
                {
                  icon: TrendingUp,
                  title: "Accelerate conversions",
                  copy:
                    "Use verified reviews and on-site social proof to build confidence at critical decision moments.",
                },
                {
                  icon: BarChart3,
                  title: "Improve with insights",
                  copy:
                    "Understand sentiment, themes, and reputation trends that inform product and CX decisions.",
                },
                {
                  icon: ShieldCheck,
                  title: "Grow with trust",
                  copy:
                    "Create a defensible trust moat that compounds across word-of-mouth, referrals, and retention.",
                },
              ].map((item) => (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  className="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#1FAF9E]/10 text-[#0E3B36]">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-[#0E0E0E]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    {item.copy}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              By Business Size
            </p>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              className="mt-4 grid gap-6 md:grid-cols-2"
            >
              {[
                {
                  icon: Sparkles,
                  title: "Small & Growing Businesses",
                  copy:
                    "Get started quickly, build early credibility, and compete with larger brands on trust, not just ad spend.",
                },
                {
                  icon: ShieldCheck,
                  title: "Established & Multi-Location Businesses",
                  copy:
                    "Standardise how reviews are collected, moderated, and surfaced across locations and teams.",
                },
              ].map((item) => (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  className="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#0E3B36]/10 text-[#0E3B36]">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-[#0E0E0E]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    {item.copy}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Capabilities - Alternating Rows */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            Everything You Need to Scale Trust
          </h2>
          <p className="mt-3 text-sm text-gray-600">
            From invitations to insights, Tellacity is the central place to run your trust and reputation workflows.
          </p>
        </div>

        <div className="mt-10 space-y-10">
          {[
            {
              title: "Automated Review Invites",
              bullets: [
                "Trigger invites from orders, bookings, or CRM events.",
                "Send on-brand email and SMS with native templates.",
                "Respect customer preferences and frequency caps.",
              ],
            },
            {
              title: "Verified Reviews",
              bullets: [
                "Tie feedback to real transactions and customers.",
                "Apply fraud checks and moderation workflows.",
                "Display badges that signal authenticity.",
              ],
            },
            {
              title: "Review Management",
              bullets: [
                "Manage all channels in one unified inbox.",
                "Assign, tag, and filter by sentiment or topic.",
                "Respond faster with saved replies and context.",
              ],
            },
            {
              title: "Insights & Analytics",
              bullets: [
                "Track trends by location, product, or segment.",
                "Spot themes driving satisfaction or churn.",
                "Share insight snapshots with stakeholders.",
              ],
            },
          ].map((capability, index) => (
            <motion.div
              key={capability.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`grid gap-8 md:grid-cols-2 items-center ${
                index % 2 === 1 ? "md:flex-row-reverse" : ""
              }`}
            >
              <div>
                <h3 className="text-lg font-semibold text-[#0E0E0E]">
                  {capability.title}
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  {capability.bullets.map((bullet) => (
                    <li key={bullet}>• {bullet}</li>
                  ))}
                </ul>
              </div>
              <div className="md:justify-self-end">
                <DashboardMock />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust Impact Strip */}
      <section className="bg-[#0E0E0E] text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
          <div>
            <h2 className="text-2xl font-semibold">
              Trust that shows up in the numbers.
            </h2>
            <p className="mt-3 text-sm text-gray-300 max-w-xl">
              Teams use Tellacity to improve how customers experience their brand, and it&apos;s reflected across key
              metrics.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
            {[
              { label: "conversion lift", value: "+42%" },
              { label: "faster issue resolution", value: "3×" },
              { label: "trust verified feedback", value: "78%" },
              { label: "higher repeat purchases", value: "↑" },
            ].map((metric) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm"
              >
                <p className="text-2xl font-semibold">
                  {metric.value}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wide text-gray-300">
                  {metric.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#0E0E0E] via-[#0E3B36] to-[#1FAF9E]">
        <motion.div
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),transparent_60%)]" />
        </motion.div>

        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-6 py-16 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-semibold">
            Ready to Build Trust at Scale?
          </h2>
          <p className="mt-3 max-w-2xl text-sm md:text-base text-gray-100/90">
            Create your business profile and start collecting reviews in minutes. Turn every customer interaction into a
            trust signal.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
            <Link
              href="/business/signup"
              className="inline-flex items-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#0E0E0E] shadow-sm hover:bg-gray-100 transition"
            >
              Create Business Account
            </Link>
          </div>
          <p className="mt-3 text-[11px] text-gray-100/80">
            Start free — no card required.
          </p>
        </div>
      </section>
    </main>
  );
}


