const faqItems = [
  {
    question: "What is Tellacity?",
    answer:
      "Tellacity is a global trust and reputation platform where consumers can share genuine experiences and businesses can build credibility. Unlike generic review sites, Tellacity uses proof-of-purchase verification and advanced fraud-prevention measures to ensure reviews are real. Businesses gain tools for analytics, engagement, and reputation growth, while consumers get a trusted place to make better decisions.",
  },
  {
    question: "How does Tellacity ensure reviews are trustworthy?",
    answer:
      "We use several layers of verification to maintain integrity: Proof of Purchase: Consumers can upload receipts, invoices, or order numbers to verify their reviews. Fraud Detection: AI-driven systems check for suspicious patterns, duplicate accounts, or spam behavior. Community Guidelines: Every review must follow strict fairness and respect standards. Moderation: Businesses can flag reviews, which are reviewed under our transparent dispute process.",
  },
  {
    question: "Can businesses respond to reviews?",
    answer:
      "Yes. We encourage open communication. Businesses can: Reply publicly to customer feedback (positive or negative). Address disputes by opening a moderated discussion with the reviewer. Show responsiveness with the “Owner Responded” badge. This creates a fair two-way conversation between customers and businesses.",
  },
  {
    question: "What is a ‘Verified Review’?",
    answer:
      "A Verified Review is marked with a badge indicating the consumer provided proof of transaction (invoice, booking number, receipt, or payment record). Verified Reviews carry more weight and rank higher in visibility compared to unverified ones, ensuring customers can trust what they read.",
  },
  {
    question: "How can I claim my business on Tellacity?",
    answer:
      "Claiming is simple and secure: Search for your business in our directory. Click “Claim Business” and follow the verification steps (email/domain match, official documents, or other approved proof). Once approved, you’ll unlock the Free Plan dashboard with tools for managing reviews, analytics, and promotional widgets. You can upgrade anytime to Grow, Premium, or Elite plans for advanced features.",
  },
  {
    question: "Is Tellacity free to use?",
    answer:
      "For consumers: It is 100% free to write, read, and share reviews. For businesses: We offer a robust Free Plan which includes claiming your profile, responding to reviews, and using our basic SEO widget. Paid Plans: Our Grow, Premium, and Elite plans unlock advanced analytics, deeper integrations (Shopify, etc.), and automated review collection tools.",
  },
  {
    question: "How do I report a fake or inappropriate review?",
    answer:
      "If you believe a review is fake, offensive, or violates our Community Guidelines, click the “Report Review” flag icon directly under the review. You'll need to select a reason (e.g., spam, offensive content, conflict of interest). Our moderation team will investigate, and the review may be temporarily labeled as “Under Review” during this process.",
  },
  {
    question: "Do I need an account to write a review?",
    answer:
      "Yes, you need a free Tellacity account. This requirement helps prevent spam, ensures reviews are linked to real people, and allows you to manage your own reviews later.",
  },
  {
    question: "Can I edit or delete my review?",
    answer:
      "Yes. You can edit your review for a short period after posting to correct typos or add details. You can delete your review at any time from your user dashboard if you no longer wish to share your experience.",
  },
  {
    question: "Will the business see my contact details?",
    answer:
      "No. Your email and phone number are private. Businesses only see your public profile name and the content of your review. If a dispute arises, you may choose to share details privately to resolve the issue, but that is entirely up to you.",
  },
  {
    question: "What benefits do businesses get by claiming their profile?",
    answer:
      "Reputation Control: Manage and respond to reviews directly. SEO Boost: Tellacity profile pages rank well on search engines, driving traffic to your brand. Analytics Dashboard: Track review trends, star ratings, and consumer sentiment over time. Integrations: Sync reviews and sales data with platforms like Shopify, Paystack, and others. Trust Badges: Display a Verified Business badge on your website to increase conversion rates.",
  },
  {
    question: "What payment methods does Tellacity support?",
    answer:
      "We support major credit cards and local payment methods via our payment partners, including Paystack, PayFast, and PayPal. We aim to make subscription management easy for businesses globally.",
  },
  {
    question: "Can multiple team members manage one business account?",
    answer:
      "Yes. Our platform allows you to invite team members and assign roles (such as Admin or Manager) so your support or marketing teams can help manage reviews and analytics without sharing a single login.",
  },
  {
    question: "How are disputes handled?",
    answer:
      "When a business disputes a review, our system places the review in a mediation state. We may ask the reviewer for proof of experience or clarification. Our moderation team reviews the evidence impartially. If the review violates guidelines, it is removed; otherwise, it remains visible.",
  },
  {
    question: "What happens if a business tries to delete negative reviews?",
    answer:
      "Businesses cannot delete legitimate consumer reviews. Transparency is our core value. Reviews remain visible unless they violate our content policies (e.g., hate speech, spam). This ensures consumers get an honest picture of the business.",
  },
  {
    question: "How does Tellacity protect against manipulation?",
    answer:
      "We actively monitor for manipulation attempts such as: Bulk fake reviews from the same IP address. Incentivized or paid positive reviews. Competitors leaving malicious negative reviews. Violations can result in content removal, account suspension, or a consumer warning badge placed on the business profile.",
  },
];

export default function FaqPage() {
  const midpoint = Math.ceil(faqItems.length / 2);
  const columns = [faqItems.slice(0, midpoint), faqItems.slice(midpoint)];

  return (
    <main className="bg-white">
      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-16 text-center">
          <h1 className="text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
            Frequently Asked Questions
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm text-gray-600">
            Everything you need to know about Tellacity. Whether you&apos;re a
            consumer looking to share an experience or a business building
            trust, we&apos;re here to help.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 pb-16">
          <div className="grid gap-6 lg:grid-cols-2">
            {columns.map((column, columnIndex) => (
              <div key={`faq-column-${columnIndex}`} className="space-y-4">
                {column.map((item) => (
                  <details
                    key={item.question}
                    className="rounded-md border border-gray-200 bg-white"
                  >
                    <summary className="flex cursor-pointer items-center justify-between px-5 py-3 text-left text-sm font-medium text-[#0E0E0E] hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
                      <span>{item.question}</span>
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </summary>
                    <div className="px-5 pb-4 text-sm text-gray-600">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
