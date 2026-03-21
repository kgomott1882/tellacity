"use client";

import Link from "next/link";
import {
  useActionState,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { submitGeneralContactForm } from "./actions";
import ContactSuccessModal from "./ContactSuccessModal";

const initialState = {
  success: false,
  message: "",
};

const inputClass =
  "mb-4 w-full rounded-md border border-[#2A2A2A]/30 bg-white px-4 py-3 text-sm text-black placeholder:text-gray-400 focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]";

type FaqItem = { id: string; question: string; answer: string };

const faqForBusinesses: FaqItem[] = [
  {
    id: "biz-listed",
    question: "Why is my business listed?",
    answer:
      "We list businesses so customers can share honest feedback. You can claim your profile to manage your presence, respond to reviews, and update details.",
  },
  {
    id: "biz-claim",
    question: "How do I claim my business?",
    answer:
      "Search for your business on Tellacity, open the profile, and follow the claim flow. You’ll verify ownership by email, domain, or documentation.",
  },
  {
    id: "biz-pay",
    question: "Do I need to pay to use Tellacity?",
    answer:
      "Consumers use Tellacity for free. Businesses can claim a profile and respond on our free tier; paid plans add analytics, integrations, and growth tools.",
  },
];

const faqAboutReviews: FaqItem[] = [
  {
    id: "rev-remove",
    question: "Can businesses remove reviews?",
    answer:
      "Legitimate reviews stay visible. We remove content only when it breaks our guidelines—after moderation.",
  },
  {
    id: "rev-verify",
    question: "How are reviews verified?",
    answer:
      "We combine account signals, optional proof of purchase, fraud detection, and human moderation. Verified experiences may show a badge.",
  },
  {
    id: "rev-edit",
    question: "Can I edit my review?",
    answer:
      "Yes. Sign in and update your review from your account, or delete it anytime from your dashboard.",
  },
];

const faqGeneralSupport: FaqItem[] = [
  {
    id: "gen-what",
    question: "What is Tellacity?",
    answer:
      "Tellacity is a customer reviews platform where people share real experiences and businesses build trust with transparent feedback.",
  },
  {
    id: "gen-support",
    question: "How do I contact support?",
    answer:
      "Use this form for the fastest response, or email support@tellacity.com—we usually reply within one business day.",
  },
];

const faqGeneralSales: FaqItem[] = [
  {
    id: "gen-what",
    question: "What is Tellacity?",
    answer:
      "Tellacity is a customer reviews platform where people share real experiences and businesses build trust with transparent feedback.",
  },
  {
    id: "gen-sales",
    question: "How do I reach sales?",
    answer:
      "Submit this form and our team will follow up about plans and pricing. You can also email sales@tellacity.com.",
  },
];

function FaqAccordionItem({
  item,
  open,
  onToggle,
}: {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="border-b border-[#2A2A2A]/20">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between gap-3 py-3 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-black">{item.question}</span>
        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-300 ease-out ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <p
            className={`mt-2 pb-3 text-sm leading-relaxed text-gray-600 transition-opacity duration-300 ${
              open ? "opacity-100" : "opacity-0"
            }`}
          >
            {item.answer}
          </p>
        </div>
      </div>
    </li>
  );
}

function FaqGroup({
  title,
  items,
  openId,
  setOpenId,
  className = "",
}: {
  title: string;
  items: FaqItem[];
  openId: string | null;
  setOpenId: Dispatch<SetStateAction<string | null>>;
  className?: string;
}) {
  return (
    <div className={className}>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
        {title}
      </h3>
      <ul>
        {items.map((item) => (
          <FaqAccordionItem
            key={item.id}
            item={item}
            open={openId === item.id}
            onToggle={() =>
              setOpenId((prev) => (prev === item.id ? null : item.id))
            }
          />
        ))}
      </ul>
    </div>
  );
}

function ContactFaqPanel({ intent }: { intent: "support" | "sales" }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const general =
    intent === "sales" ? faqGeneralSales : faqGeneralSupport;

  return (
    <div className="bg-[#F5F1EB] p-10 md:p-14">
      <header className="mb-8">
        <h2 className="text-2xl font-semibold text-black">Quick answers</h2>
        <p className="mt-2 text-sm text-gray-600">
          You might find what you need instantly.
        </p>
      </header>

      <FaqGroup
        title="For Businesses"
        items={faqForBusinesses}
        openId={openId}
        setOpenId={setOpenId}
      />
      <FaqGroup
        title="About Reviews"
        items={faqAboutReviews}
        openId={openId}
        setOpenId={setOpenId}
        className="mt-6"
      />
      <FaqGroup
        title="General"
        items={general}
        openId={openId}
        setOpenId={setOpenId}
        className="mt-6"
      />

      <p className="mt-8 text-sm">
        <Link
          href="/faq"
          className="font-medium text-[#1FAF9E] transition hover:underline"
        >
          View all FAQs →
        </Link>
      </p>
    </div>
  );
}

type Props = { intent: "support" | "sales" };

export default function ContactChannelPage({ intent }: Props) {
  const [state, formAction] = useActionState(
    submitGeneralContactForm,
    initialState
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [contactRole, setContactRole] = useState<"reviewer" | "business">(
    intent === "sales" ? "business" : "reviewer"
  );

  useEffect(() => {
    if (state.success) {
      setShowSuccess(true);
    }
  }, [state]);

  useEffect(() => {
    if (!showSuccess) return;
    const timer = setTimeout(() => setShowSuccess(false), 4000);
    return () => clearTimeout(timer);
  }, [showSuccess]);

  const copy =
    intent === "sales"
      ? {
          title: "Talk to our sales team",
          subtitle:
            "We’ll help you choose the right plan and grow with customer feedback.",
        }
      : {
          title: "How can we help you today?",
          subtitle: "We usually respond within 24 hours.",
        };

  return (
    <>
    <div className="min-h-screen bg-[#F5F1EB] px-4 text-black sm:px-6">
      <p className="mx-auto max-w-6xl pt-6 text-sm">
        <Link
          href="/contact"
          className="font-medium text-[#1FAF9E] transition hover:underline"
        >
          ← Back to contact options
        </Link>
      </p>
      <div className="mx-auto mb-20 mt-8 grid max-w-6xl grid-cols-1 items-start gap-y-12 md:grid-cols-2 md:gap-x-12 md:gap-y-0 lg:gap-x-20">
        <div className="bg-transparent p-10 md:py-14 md:pl-0 md:pr-4">
          {state.message && !state.success ? (
            <p className="mb-6 border-l-4 border-red-500 pl-4 text-sm text-red-700">
              {state.message}
            </p>
          ) : null}

          <form action={formAction} className="space-y-0">
            <input type="hidden" name="contact_role" value={contactRole} />
            <input type="hidden" name="type" value={intent} />

            <h1 className="text-2xl font-semibold text-black md:text-[1.65rem]">
              {copy.title}
            </h1>
            <p className="mt-1 text-sm text-gray-600">{copy.subtitle}</p>

            <div className="mb-6 mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setContactRole("reviewer")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  contactRole === "reviewer"
                    ? "bg-[#1FAF9E] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                I&apos;m a reviewer
              </button>
              <button
                type="button"
                onClick={() => setContactRole("business")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  contactRole === "business"
                    ? "bg-[#1FAF9E] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                I&apos;m a business
              </button>
            </div>

            <div>
              <label
                htmlFor="contact-name"
                className="mb-1.5 block text-sm font-medium text-black"
              >
                Full Name
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Your full name"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label
                htmlFor="contact-email"
                className="mb-1.5 block text-sm font-medium text-black"
              >
                Email Address
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label
                htmlFor="contact-subject"
                className="mb-1.5 block text-sm font-medium text-black"
              >
                Subject
              </label>
              <input
                id="contact-subject"
                name="subject"
                type="text"
                placeholder="What is this about?"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label
                htmlFor="contact-message"
                className="mb-1.5 block text-sm font-medium text-black"
              >
                Message
              </label>
              <textarea
                id="contact-message"
                name="message"
                placeholder="Tell us more…"
                rows={5}
                className={`${inputClass} min-h-[120px] resize-y`}
                required
              />
            </div>

            <button
              type="submit"
              className="mt-4 w-full rounded-lg border border-black/10 bg-black py-3 text-sm font-medium text-white transition-colors hover:bg-[#1FAF9E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E] focus-visible:ring-offset-2"
            >
              Send message
            </button>

            <p className="mt-3 text-center text-xs text-gray-500">
              <span aria-hidden>🔒</span> Your information is secure • We
              reply within 24 hours
            </p>
          </form>
        </div>

        <ContactFaqPanel intent={intent} />
      </div>
    </div>

    <ContactSuccessModal
      open={showSuccess}
      onClose={() => setShowSuccess(false)}
    />
    </>
  );
}
