import type { Metadata } from "next";
import Link from "next/link";

const PAGE_URL = "https://tellacity.com/privacy-policy";

export const metadata: Metadata = {
  title: "Privacy Policy | Tellacity",
  description:
    "Read Tellacity’s Privacy Policy to understand how we collect, use, store, and protect information, including reviews, verification, cookies, and data rights.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Privacy Policy | Tellacity",
    description:
      "Read Tellacity’s Privacy Policy to understand how we collect, use, store, and protect information, including reviews, verification, cookies, and data rights.",
    url: PAGE_URL,
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | Tellacity",
    description:
      "Read Tellacity’s Privacy Policy to understand how we collect, use, store, and protect information, including reviews, verification, cookies, and data rights.",
  },
  robots: { index: true, follow: true },
};

const privacyPolicyJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Privacy Policy | Tellacity",
  description:
    "Tellacity’s Privacy Policy explains how we collect, use, store, and protect information across the platform.",
  url: PAGE_URL,
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://tellacity.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Privacy Policy",
        item: PAGE_URL,
      },
    ],
  },
};

const linkClass =
  "font-medium text-[#124541] underline underline-offset-2 hover:text-[#1FAF9E]";

export default function PrivacyPolicyPage() {
  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(privacyPolicyJsonLd),
        }}
      />

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              Last Updated: September 6, 2025
            </p>
            <p className="mx-auto mt-4 max-w-3xl text-sm text-gray-600 sm:text-base">
              This Privacy Policy explains how Tellacity collects, uses, stores,
              and protects information when you use our website, mobile
              applications, and related services. It also explains how reviews,
              verification, moderation, and data protection rights work across
              the platform.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl space-y-12 px-6 pb-16 text-sm text-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Scope of This Policy
            </h2>
            <p className="mt-3 leading-relaxed">
              This section tells you who the policy applies to and which Tellacity
              services it covers. It applies equally to consumers who write
              reviews and businesses that manage profiles on the platform.
            </p>
            <p className="mt-3 leading-relaxed">
              This Privacy Policy describes how Tellacity (&quot;we&quot;,
              &quot;us&quot;, &quot;our&quot;) collects, uses, processes, and
              discloses your information in connection with your access to and
              use of Tellacity&apos;s website, mobile applications, and other
              online products and services (collectively, the
              &quot;Services&quot;).
            </p>
            <p className="mt-3 leading-relaxed">
              This policy applies to all users of our Services, including
              consumers who write reviews and businesses who use our platform to
              manage their reputation and collect feedback. By using our Services,
              you agree to the collection and use of information in accordance
              with this policy. See also our{" "}
              <Link href="/terms-of-service" className={linkClass}>
                Terms of Service
              </Link>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Information We Collect
            </h2>
            <p className="mt-3 leading-relaxed">
              Tellacity collects account data, review content, usage data, and
              optional proof documents to operate the service, display feedback,
              and protect trust. The categories below describe what we collect
              and why it matters for platform integrity.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Information you provide to us
            </h3>
            <p className="mt-2 leading-relaxed">
              This includes personal identifiers (like name, email address,
              phone number), account credentials, profile information (e.g.,
              username, display name, avatar, bio, country), payment information
              (e.g., billing address, payment method details if you subscribe to
              a paid service), and content you submit (reviews, comments,
              business claims, messages).
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Information we collect automatically
            </h3>
            <p className="mt-2 leading-relaxed">
              When you use our Services, we automatically collect certain
              information, such as IP address, device information (device ID,
              operating system, browser type), usage data (pages viewed,
              features used, time spent on pages), referral URLs, and location
              data (derived from your IP address).
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Review and Proof Information
            </h3>
            <p className="mt-2 leading-relaxed">
              When you submit a review, we collect the content of your review,
              your rating, date of experience, and any optional proof of
              purchase you provide (e.g., receipts, order references,
              invoices). Proof documents are handled separately as described
              under Handling of Proof of Purchase &amp; Receipts.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Information from third-party sources
            </h3>
            <p className="mt-2 leading-relaxed">
              We may receive information about you from third-party services,
              such as social media platforms if you choose to connect through
              them, or from business partners.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              How Reviews Are Stored and Displayed
            </h2>
            <p className="mt-3 leading-relaxed">
              Verified and unverified labels help readers understand how much
              evidence supports a review. Both types may appear on business
              profiles, but they are treated differently for trust and
              moderation purposes.
            </p>
            <p className="mt-3 leading-relaxed">
              To enhance trust and transparency, we categorize reviews based on
              their verification status:
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Unverified Reviews
            </h3>
            <p className="mt-2 leading-relaxed">
              Reviews submitted without acceptable proof of purchase are
              publicly displayed as &quot;Unverified.&quot; While they
              contribute to a business&apos;s overall rating, they are clearly
              marked to indicate their lack of proof.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Verified Reviews
            </h3>
            <p className="mt-2 leading-relaxed">
              Reviews submitted with acceptable proof (e.g., a receipt, order
              confirmation, or invoice) are marked as &quot;Verified.&quot;
              These reviews typically carry more weight and credibility. The
              proof itself is handled as described in Handling of Proof of
              Purchase &amp; Receipts. Learn more in{" "}
              <Link href="/how-tellacity-works" className={linkClass}>
                How Tellacity Works
              </Link>{" "}
              and our{" "}
              <Link href="/reviewer-guidelines" className={linkClass}>
                Reviewer Guidelines
              </Link>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Handling of Proof of Purchase &amp; Receipts
            </h2>
            <p className="mt-3 leading-relaxed">
              Proof documents are private and used only for verification,
              moderation, and dispute handling. They are not shared with
              businesses by default and are not displayed on public review pages.
            </p>
            <p className="mt-3 leading-relaxed">
              Your proof of purchase documents are handled with strict privacy
              and security measures:
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Secure Storage
            </h3>
            <p className="mt-2 leading-relaxed">
              All uploaded receipts, invoices, or other proof documents are
              stored in a private, encrypted, and access-controlled storage
              system. They are not publicly accessible, nor are they visible
              to business owners.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Limited Access
            </h3>
            <p className="mt-2 leading-relaxed">
              Access to these documents is strictly limited to authorized
              Tellacity moderation personnel for the sole purpose of verifying
              the authenticity of your review.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              No Sharing with Businesses
            </h3>
            <p className="mt-2 leading-relaxed">
              We do not share your proof of purchase documents directly with
              the businesses you review. We may inform the business that a
              review has been verified based on submitted proof, but the
              document itself remains confidential.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Data Retention
            </h3>
            <p className="mt-2 leading-relaxed">
              Proof documents are retained only as long as necessary for
              verification, dispute resolution, and audit purposes, in
              accordance with our data retention policies and legal
              obligations. See also{" "}
              <Link href="/data-protection" className={linkClass}>
                Data Protection
              </Link>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              How We Use Your Information
            </h2>
            <p className="mt-3 leading-relaxed">
              We use collected information to run the platform, improve the
              experience, prevent abuse, and send important service messages.
              We do not use personal data in ways that contradict this policy
              or applicable law.
            </p>
            <p className="mt-3 leading-relaxed">
              We use the information we collect for various purposes, including:
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              To provide and maintain our Services
            </h3>
            <p className="mt-2 leading-relaxed">
              This includes operating the platform, processing reviews,
              facilitating business claims, and managing user accounts.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              To improve and personalize our Services
            </h3>
            <p className="mt-2 leading-relaxed">
              We use data to understand usage patterns, develop new features,
              and enhance the user experience.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              For security and fraud prevention
            </h3>
            <p className="mt-2 leading-relaxed">
              We monitor activity to detect and prevent fraudulent reviews,
              unauthorized access, and other malicious activities.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              To communicate with you
            </h3>
            <p className="mt-2 leading-relaxed">
              We use your contact information to send you transactional emails
              (e.g., account notifications, login links), service updates, and,
              if you opt-in, marketing communications.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              For legal compliance
            </h3>
            <p className="mt-2 leading-relaxed">
              We process data to comply with legal obligations, enforce our{" "}
              <Link href="/terms-of-service" className={linkClass}>
                Terms of Service
              </Link>
              , and resolve disputes.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              For analytics and research
            </h3>
            <p className="mt-2 leading-relaxed">
              We analyze user behavior to understand market trends, measure the
              effectiveness of our campaigns, and make data-driven decisions.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Legal Basis for Processing (GDPR)
            </h2>
            <p className="mt-3 leading-relaxed">
              If you are in the EEA or UK, we must identify a lawful basis for
              each type of processing. The categories below explain when we rely
              on contract, legitimate interest, consent, or legal obligation.
            </p>
            <p className="mt-3 leading-relaxed">
              For users in the European Economic Area (EEA) and the UK, we rely
              on the following legal bases for processing your personal data:
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Performance of a contract
            </h3>
            <p className="mt-2 leading-relaxed">
              When processing is necessary to provide the Services you request,
              such as publishing your review or managing your business account.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Legitimate interests
            </h3>
            <p className="mt-2 leading-relaxed">
              For activities like improving our Services, preventing fraud,
              ensuring platform integrity, and marketing (where not requiring
              consent), provided our interests do not override your data
              protection rights.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Consent
            </h3>
            <p className="mt-2 leading-relaxed">
              Where required by law, we will obtain your explicit consent for
              certain processing activities, such as sending marketing
              communications. You have the right to withdraw consent at any
              time.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Legal obligations
            </h3>
            <p className="mt-2 leading-relaxed">
              When processing is necessary to comply with applicable laws and
              regulations. More detail is available on our{" "}
              <Link href="/data-protection" className={linkClass}>
                Data Protection
              </Link>{" "}
              page.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Cookies and Tracking Technologies
            </h2>
            <p className="mt-3 leading-relaxed">
              Cookies and similar technologies help us keep you signed in,
              remember preferences, measure usage, and deliver relevant content.
              You can manage many cookie settings through your browser or our
              consent tools.
            </p>
            <p className="mt-3 leading-relaxed">
              We use cookies and similar tracking technologies (like web beacons
              and pixels) to track activity on our Services and hold certain
              information. These technologies are used for various purposes,
              including:
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Essential cookies
            </h3>
            <p className="mt-2 leading-relaxed">
              Necessary for the operation of our Services (e.g., to keep you
              logged in).
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Analytical/performance cookies
            </h3>
            <p className="mt-2 leading-relaxed">
              To analyze how users interact with our Services, identify areas
              for improvement, and measure the effectiveness of our content.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Functionality cookies
            </h3>
            <p className="mt-2 leading-relaxed">
              To remember your preferences and personalize your experience.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Advertising/targeting cookies
            </h3>
            <p className="mt-2 leading-relaxed">
              Used by us and our advertising partners to deliver relevant
              advertisements to you.
            </p>
            <p className="mt-3 leading-relaxed">
              You can manage your cookie preferences through your browser
              settings or via our cookie consent banner. Please refer to our{" "}
              <Link href="/cookie-policy" className={linkClass}>
                Cookie Policy
              </Link>{" "}
              for more details.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Disclosure of Your Information
            </h2>
            <p className="mt-3 leading-relaxed">
              We share information only in the situations described below. Your
              full name and email are not publicly shared by default when you
              write a review; businesses see your display name and review content
              unless you choose otherwise.
            </p>
            <p className="mt-3 leading-relaxed">
              We may share your information with third parties in the following
              situations:
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              With businesses you review
            </h3>
            <p className="mt-2 leading-relaxed">
              When you write a review, your display name, review content,
              rating, and date of experience are publicly displayed and visible
              to the business. Your email and full name are NOT shared unless
              explicitly consented to (e.g., for direct communication from the
              business).
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              With service providers
            </h3>
            <p className="mt-2 leading-relaxed">
              We engage third-party companies and individuals to facilitate our
              Services, perform service-related functions (e.g., hosting,
              analytics, email delivery, payment processing), or assist us in
              analyzing how our Services are used.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              For legal reasons
            </h3>
            <p className="mt-2 leading-relaxed">
              We may disclose your information if required to do so by law or
              in response to valid requests by public authorities (e.g., a
              court order or government agency).
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              For security purposes
            </h3>
            <p className="mt-2 leading-relaxed">
              To protect the rights, property, or safety of Tellacity, our
              users, or the public.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Business transfers
            </h3>
            <p className="mt-2 leading-relaxed">
              In connection with a merger, acquisition, or sale of assets,
              your personal data may be transferred to a new entity.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              With your consent
            </h3>
            <p className="mt-2 leading-relaxed">
              We may share your information for any other purpose with your
              explicit consent.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              International Data Transfers
            </h2>
            <p className="mt-3 leading-relaxed">
              Because Tellacity operates globally, your information may be
              processed outside your home country. When that happens, we use
              appropriate safeguards so your data remains protected.
            </p>
            <p className="mt-3 leading-relaxed">
              Tellacity operates globally. Your information, including personal
              data, may be transferred to - and maintained on - computers located
              outside of your state, province, country, or other governmental
              jurisdiction where the data protection laws may differ from those
              of your jurisdiction.
            </p>
            <p className="mt-3 leading-relaxed">
              If you are located outside of the jurisdiction where our servers
              are located (e.g., EEA/UK users), please note that we transfer
              personal data to countries that may not have the same data
              protection laws as your country. We take all reasonable steps to
              ensure that your data is treated securely and in accordance with
              this Privacy Policy, including implementing appropriate safeguards
              like standard contractual clauses (SCCs) approved by the European
              Commission, where applicable.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Data Retention
            </h2>
            <p className="mt-3 leading-relaxed">
              We keep personal information only as long as needed for the
              purposes described in this policy, then delete or anonymize it
              when it is no longer required.
            </p>
            <p className="mt-3 leading-relaxed">
              We retain your personal data only for as long as is necessary for
              the purposes set out in this Privacy Policy, unless a longer
              retention period is required or permitted by law (such as tax,
              accounting, or other legal requirements). When we no longer need
              your personal data, we will securely delete or anonymize it.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Your Data Protection Rights
            </h2>
            <p className="mt-3 leading-relaxed">
              Depending on your location, you may have rights to access, correct,
              delete, or restrict how we use your personal data. The list below
              summarizes common GDPR-style rights; local law may provide
              additional protections.
            </p>
            <p className="mt-3 leading-relaxed">
              Depending on your location and applicable laws, you may have the
              following rights regarding your personal data:
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Right to access
            </h3>
            <p className="mt-2 leading-relaxed">
              You can request a copy of the personal data we hold about you.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Right to rectification
            </h3>
            <p className="mt-2 leading-relaxed">
              You can request that we correct any inaccurate or incomplete
              personal data.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Right to erasure
            </h3>
            <p className="mt-2 leading-relaxed">
              You can request that we delete your personal data under certain
              conditions (&quot;right to be forgotten&quot;).
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Right to restrict processing
            </h3>
            <p className="mt-2 leading-relaxed">
              You can request that we restrict the processing of your personal
              data under certain conditions.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Right to object to processing
            </h3>
            <p className="mt-2 leading-relaxed">
              You can object to our processing of your personal data under
              certain conditions.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Right to data portability
            </h3>
            <p className="mt-2 leading-relaxed">
              You can request that we transfer the data we have collected to
              another organization, or directly to you, under certain
              conditions.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Right to withdraw consent
            </h3>
            <p className="mt-2 leading-relaxed">
              If we are relying on your consent to process your personal data,
              you have the right to withdraw that consent at any time.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Right to complain to a supervisory authority
            </h3>
            <p className="mt-2 leading-relaxed">
              You have the right to lodge a complaint with a data protection
              authority in your country.
            </p>
            <p className="mt-3 leading-relaxed">
              To exercise any of these rights, please contact us using the
              information in Contact Us, or manage your preferences directly
              from your account settings. See{" "}
              <Link href="/data-protection" className={linkClass}>
                Data Protection
              </Link>{" "}
              for additional information.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Children&apos;s Privacy
            </h2>
            <p className="mt-3 leading-relaxed">
              Tellacity is not intended for anyone under 18. If we learn that we
              have collected personal data from a child without appropriate
              consent, we take steps to remove it.
            </p>
            <p className="mt-3 leading-relaxed">
              Our Services are not intended for use by individuals under the age
              of 18 (&quot;Children&quot;). We do not knowingly collect
              personally identifiable information from anyone under the age of
              18. If you are a parent or guardian and you are aware that your
              Child has provided us with Personal Data, please contact us. If we
              become aware that we have collected Personal Data from children
              without verification of parental consent, we take steps to remove
              that information from our servers.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Platform Integrity and Moderation
            </h2>
            <p className="mt-3 leading-relaxed">
              We use data to detect abuse, spam, and fraudulent reviews so the
              platform stays fair for consumers and businesses. Moderation
              follows our published guidelines, not payment or business pressure.
            </p>
            <p className="mt-3 leading-relaxed">
              Tellacity&apos;s privacy practices work alongside our trust and
              moderation policies. See{" "}
              <Link href="/safety-trust" className={linkClass}>
                Safety &amp; Trust
              </Link>{" "}
              and{" "}
              <Link href="/reviewer-guidelines" className={linkClass}>
                Reviewer Guidelines
              </Link>
              .
            </p>
            <p className="mt-3 leading-relaxed">
              To maintain a fair and trustworthy platform, we actively moderate
              content and may use data to:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed">
              <li>Identify and remove fraudulent or abusive reviews.</li>
              <li>Investigate complaints or disputes about reviews.</li>
              <li>
                Ensure compliance with our Content Guidelines and Terms of
                Service.
              </li>
              <li>Improve our moderation processes and algorithms.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Security of Your Information
            </h2>
            <p className="mt-3 leading-relaxed">
              No online system is perfectly secure, but Tellacity uses
              encryption, access controls, and regular reviews to protect
              personal data against unauthorized access and misuse.
            </p>
            <p className="mt-3 leading-relaxed">
              The security of your personal data is important to us, but remember
              that no method of transmission over the Internet, or method of
              electronic storage is 100% secure. While we strive to use
              commercially acceptable means to protect your Personal Data, we
              cannot guarantee its absolute security. We implement a variety of
              security measures, including encryption, access controls, and
              regular security audits, to protect your data.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Changes to This Privacy Policy
            </h2>
            <p className="mt-3 leading-relaxed">
              When we update this policy, we post the revised version here and
              change the &quot;Last Updated&quot; date at the top of the page.
              Material changes may also be communicated through the platform
              where appropriate.
            </p>
            <p className="mt-3 leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify
              you of any changes by posting the new Privacy Policy on this page
              and updating the &quot;Last Updated&quot; date at the top of this
              policy. You are advised to review this Privacy Policy periodically
              for any changes. Changes to this Privacy Policy are effective when
              they are posted on this page.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Governing Law
            </h2>
            <p className="mt-3 leading-relaxed">
              This policy is interpreted under applicable data protection and
              privacy laws in the jurisdictions where Tellacity operates and
              serves users.
            </p>
            <p className="mt-3 leading-relaxed">
              This Privacy Policy is governed by applicable data protection laws
              based on the jurisdictions in which Tellacity operates and serves
              users.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Contact Us
            </h2>
            <p className="mt-3 leading-relaxed">
              If you have questions about this policy or want to exercise your
              data protection rights, contact us through the channels below. We
              aim to respond to legitimate requests within applicable legal
              timeframes.
            </p>
            <p className="mt-3 leading-relaxed">
              If you have any questions about this Privacy Policy, your data, or
              want to exercise your data protection rights, please contact us
              via our{" "}
              <Link href="/contact" className={linkClass}>
                contact form
              </Link>{" "}
              or by email at privacy@tellacity.com. You can also visit the{" "}
              <Link href="/help-center" className={linkClass}>
                Help Center
              </Link>{" "}
              for general platform questions.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Related policies and support
            </h2>
            <p className="mt-3 leading-relaxed">
              Learn more about how Tellacity handles trust, verification,
              moderation, and support across the platform.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed">
              <li>
                <Link href="/cookie-policy" className={linkClass}>
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/data-protection" className={linkClass}>
                  Data Protection
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className={linkClass}>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/reviewer-guidelines" className={linkClass}>
                  Reviewer Guidelines
                </Link>
              </li>
              <li>
                <Link href="/safety-trust" className={linkClass}>
                  Safety &amp; Trust
                </Link>
              </li>
              <li>
                <Link href="/help-center" className={linkClass}>
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/faq" className={linkClass}>
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/how-tellacity-works" className={linkClass}>
                  How Tellacity Works
                </Link>
              </li>
              <li>
                <Link href="/contact" className={linkClass}>
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
