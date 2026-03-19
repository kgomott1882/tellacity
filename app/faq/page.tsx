const faqItems = [
  {
    question: "What is Tellacity?",
    answer:
      "Tellacity is a global customer reviews and feedback platform where people share real experiences about businesses. Reviews are protected by verification and fraud-prevention systems to ensure they are genuine. Businesses use Tellacity to collect authentic customer reviews, build trust, strengthen their reputation, and gain insights to improve their services and grow.",
  },
  {
    question: "How does Tellacity ensure reviews are trustworthy?",
    answer:
      "Tellacity uses several layers of verification to maintain trust. Reviewers may provide proof of purchase such as receipts, invoices, or order confirmations. Our systems also detect suspicious activity like duplicate accounts, spam, or unusual review patterns. Businesses and users can flag reviews that violate our guidelines, and our moderation team reviews them through a transparent dispute process.",
  },
  {
    question: "Can businesses respond to reviews?",
    answer:
      "Yes. Businesses can publicly reply to customer reviews-both positive and negative. This encourages open communication and allows businesses to resolve issues directly with customers. When a business responds, the reply is marked with an “Owner Responded” badge so readers can clearly see the conversation.",
  },
  {
    question: "What is a ‘Verified Review’?",
    answer:
      "A Verified Review is marked with a badge showing the reviewer provided proof of their transaction, such as a receipt, booking number, or payment confirmation. Verified Reviews carry greater credibility and may receive higher visibility because they confirm the reviewer had a real experience with the business.",
  },
  {
    question: "How can I claim my business on Tellacity?",
    answer:
      "Claiming your business is simple. Search for your business on Tellacity and click “Claim Business.” You’ll be asked to verify ownership through methods such as email verification, domain verification, or official documentation. Once approved, you can manage reviews, access analytics, and use Tellacity tools to grow your reputation.",
  },
  {
    question: "Is Tellacity free to use?",
    answer:
      "Yes. Consumers can read, write, and share reviews for free. Businesses can also claim their profile and respond to reviews using our Free Plan. Paid plans such as Grow, Premium, and Elite unlock additional features like advanced analytics, integrations, and automated review collection tools.",
  },
  {
    question: "How do I report a fake or inappropriate review?",
    answer:
      "If you believe a review violates our Community Guidelines, click the “Report Review” option below the review. Select the reason (such as spam, offensive content, or conflict of interest), and our moderation team will investigate. During this process, the review may be temporarily marked as “Under Review.”",
  },
  {
    question: "Do I need an account to write a review?",
    answer:
      "Yes. Creating a free Tellacity account helps prevent spam, links reviews to real users, and allows you to manage or update your reviews later.",
  },
  {
    question: "Can I edit or delete my review?",
    answer:
      "Yes. You can edit your review shortly after posting to correct mistakes or add details. You can also delete your review at any time from your user dashboard.",
  },
  {
    question: "Will the business see my contact details?",
    answer:
      "No. Your email address and phone number remain private. Businesses only see your public profile name and the content of your review. If a dispute arises, you may choose to share additional details privately.",
  },
  {
    question: "What benefits do businesses get by claiming their profile?",
    answer:
      "Claiming your profile gives businesses access to tools that help manage and grow their reputation. These include responding to reviews, tracking ratings and customer sentiment, improving search visibility, integrating with platforms like Shopify or Paystack, and displaying verified trust badges on their website.",
  },
  {
    question: "What payment methods does Tellacity support?",
    answer:
      "Tellacity supports major credit cards and several local payment methods through our payment partners, including Paystack, PayFast, and PayPal, making subscription management easy for businesses worldwide.",
  },
  {
    question: "Can multiple team members manage one business account?",
    answer:
      "Yes. Businesses can invite team members and assign roles such as Admin or Manager. This allows customer support, marketing, or operations teams to manage reviews and analytics without sharing a single login.",
  },
  {
    question: "How are disputes handled?",
    answer:
      "When a business disputes a review, the review enters a mediation process. The reviewer may be asked to provide proof of experience or clarification. Our moderation team evaluates the evidence fairly. If the review violates our guidelines, it is removed; otherwise, it remains visible.",
  },
  {
    question: "What happens if a business tries to delete negative reviews?",
    answer:
      "Businesses cannot delete legitimate customer reviews. Transparency is a core principle of Tellacity. Reviews remain visible unless they violate our content policies, such as containing spam, hate speech, or fraudulent content.",
  },
  {
    question: "How does Tellacity protect against manipulation?",
    answer:
      "Tellacity actively monitors for review manipulation, including bulk fake reviews, paid review schemes, or coordinated attacks. Our systems analyze patterns such as IP activity, account behavior, and review timing. Violations can lead to content removal, account suspension, or warnings placed on a business profile.",
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
                    className="group rounded-md border border-gray-200 bg-white"
                  >
                    <summary className="flex cursor-pointer items-center justify-between px-5 py-3 text-left text-sm text-[#0E0E0E] hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
                      <span className="font-normal group-open:font-semibold">
                        {item.question}
                      </span>
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
