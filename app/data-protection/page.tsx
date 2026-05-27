import type { Metadata } from "next";
import Link from "next/link";

const PAGE_URL = "https://tellacity.com/data-protection";

export const metadata: Metadata = {
  title: "Data Protection Policy | Tellacity",
  description:
    "Read Tellacity's Data Protection Policy to understand how we protect personal data, handle security, support rights, and manage trusted processing.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Data Protection Policy | Tellacity",
    description:
      "Read Tellacity's Data Protection Policy to understand how we protect personal data, handle security, support rights, and manage trusted processing.",
    url: PAGE_URL,
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Data Protection Policy | Tellacity",
    description:
      "Read Tellacity's Data Protection Policy to understand how we protect personal data, handle security, support rights, and manage trusted processing.",
  },
  robots: { index: true, follow: true },
};

const dataProtectionJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Data Protection Policy | Tellacity",
  description:
    "Read Tellacity's Data Protection Policy to understand how we protect personal data, handle security, support rights, and manage trusted processing.",
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
        name: "Data Protection Policy",
        item: PAGE_URL,
      },
    ],
  },
};

const linkClass =
  "font-medium text-[#124541] underline underline-offset-2 hover:text-[#1FAF9E]";

const RELATED_POLICIES = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-of-service", label: "Terms of Service" },
  { href: "/cookie-policy", label: "Cookie Policy" },
  { href: "/reviewer-guidelines", label: "Reviewer Guidelines" },
  { href: "/safety-trust", label: "Safety & Trust" },
  { href: "/help-center", label: "Help Center" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export default function DataProtectionPage() {
  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(dataProtectionJsonLd),
        }}
      />

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
              Data Protection Policy
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              Last Updated: September 6, 2025
            </p>
            <p className="mx-auto mt-4 max-w-3xl text-sm text-gray-600">
              Tellacity takes data privacy and security seriously. This policy
              explains the technical and organizational measures we use to protect
              personal data for consumers and businesses.
            </p>
            <p className="mx-auto mt-3 max-w-3xl text-sm text-gray-600">
              Read this policy alongside our{" "}
              <Link href="/privacy-policy" className={linkClass}>
                Privacy Policy
              </Link>{" "}
              for how we collect and use information, and our{" "}
              <Link href="/safety-trust" className={linkClass}>
                Safety &amp; Trust
              </Link>{" "}
              framework for platform integrity.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl space-y-12 px-6 pb-16 text-sm text-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              Our Commitment to Data Protection
            </h2>
            <p className="mt-3">
              Tellacity protects the confidentiality, integrity, and availability
              of personal data for both consumers and businesses. This section
              sets out our overall commitment before the specific controls
              described below.
            </p>
            <p className="mt-3">
              Tellacity takes data privacy and security seriously. We are
              committed to protecting the personal data of our users-both
              consumers and businesses-in accordance with applicable data
              protection laws and best practices. This Data Protection Policy
              outlines the technical and organizational measures we have
              implemented to ensure the confidentiality, integrity, and
              availability of your data.
            </p>
            <p className="mt-3">
              Those measures include access controls, encryption, processor
              agreements, and incident response—each described in the sections
              that follow.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              Applicable Laws
            </h2>
            <p className="mt-3">
              Tellacity aims to comply with major data protection frameworks
              depending on where users are located. Local laws may also apply in
              addition to those listed below.
            </p>
            <p className="mt-3">
              We strive to comply with key data protection regulations, including
              but not limited to:
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">GDPR</h3>
                <p className="mt-1">
                  General Data Protection Regulation (GDPR): For users within the
                  European Economic Area (EEA).
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">POPIA</h3>
                <p className="mt-1">
                  Protection of Personal Information Act (POPIA): For users within
                  South Africa.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">CCPA</h3>
                <p className="mt-1">
                  California Consumer Privacy Act (CCPA): For users within
                  California, USA.
                </p>
              </div>
            </div>
            <p className="mt-4">
              If you are unsure which framework applies to you, contact our Data
              Protection Officer using the details in Contact Us below.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              Data Protection by Design and Default
            </h2>
            <p className="mt-3">
              Privacy is considered early in product and business processes—not
              added as an afterthought. That means we think about data collection,
              retention, and transparency when we design features and workflows.
            </p>
            <p className="mt-3">
              We integrate data protection principles into our development and
              business processes from the outset. This includes minimizing data
              collection, pseudonymizing personal data where possible, and
              ensuring transparency about data processing activities.
            </p>
            <p className="mt-3">
              Data minimisation, pseudonymization where feasible, and clear
              communication about processing are core parts of this approach.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              Data Minimisation
            </h2>
            <p className="mt-3">
              Tellacity only collects personal data that is needed to operate the
              service, verify reviews where required, and support users—not
              excessive or unrelated information.
            </p>
            <p className="mt-3">
              We only collect and process personal data that is strictly
              necessary for the purposes for which it is processed. We do not
              collect excessive or irrelevant data.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              Access Control
            </h2>
            <p className="mt-3">
              Only authorized personnel may access personal data, and access is
              limited by role and legitimate business need—not open to all staff
              by default.
            </p>
            <p className="mt-3">
              Access to personal data is restricted to authorized personnel who
              have a legitimate need to access such data for their job
              responsibilities.
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">Authentication</h3>
                <p className="mt-1">
                  Authentication: We use strong authentication mechanisms (e.g.,
                  multi-factor authentication) for administrative access.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">Authorization</h3>
                <p className="mt-1">
                  Authorization: Access rights are granted based on the principle
                  of least privilege.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">Logging</h3>
                <p className="mt-1">
                  Logging: Access to sensitive data is logged and audited.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              Security Measures
            </h2>
            <p className="mt-3">
              Security is layered: no single control is relied on alone. Together,
              encryption, network protection, and vulnerability management reduce
              the risk of unauthorized access, alteration, disclosure, or
              destruction.
            </p>
            <p className="mt-3">
              We implement robust technical security measures to protect data
              against unauthorized access, alteration, disclosure, or
              destruction:
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">Encryption</h3>
                <p className="mt-1">
                  Encryption: Data is encrypted in transit (using TLS/SSL) and at
                  rest (using industry-standard encryption algorithms).
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">Firewalls</h3>
                <p className="mt-1">
                  Firewalls: We use firewalls to protect our network
                  infrastructure.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">
                  Vulnerability Management
                </h3>
                <p className="mt-1">
                  Vulnerability Management: We regularly scan our systems for
                  vulnerabilities and apply security patches promptly.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              Review Proof Protection
            </h2>
            <p className="mt-3">
              Receipts, invoices, and similar proof documents are handled with
              extra care. They are stored privately and are never shown on public
              profiles or review pages.
            </p>
            <p className="mt-3">
              Documents uploaded as proof of experience (e.g., receipts, invoices)
              are treated with high sensitivity. These documents are stored in a
              secure, private storage bucket with strict access controls. They
              are never displayed publicly and are only accessible by authorized
              Tellacity moderation staff for the sole purpose of verifying
              reviews.
            </p>
            <p className="mt-3">
              Only authorized moderation staff may access proof documents for
              verification purposes. See our{" "}
              <Link href="/reviewer-guidelines" className={linkClass}>
                Reviewer Guidelines
              </Link>{" "}
              for how verification works on the platform.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              Third-Party Processors
            </h2>
            <p className="mt-3">
              Service providers such as hosting, analytics, email, or payment
              processors may handle personal data on our behalf. They do so only
              under strict contractual terms.
            </p>
            <p className="mt-3">
              We engage third-party service providers (data processors) to assist
              us in delivering our Services (e.g., hosting, payment processing).
              We enter into data processing agreements with these providers to
              ensure they process personal data only in accordance with our
              instructions and maintain appropriate security measures.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              International Transfers
            </h2>
            <p className="mt-3">
              Personal data may be processed or stored in countries outside your
              own jurisdiction. When that happens, we use appropriate safeguards
              rather than transferring data without protection.
            </p>
            <p className="mt-3">
              If we transfer personal data to countries outside the user&apos;s
              jurisdiction, we ensure that appropriate safeguards are in place to
              protect the data, such as standard contractual clauses or adequacy
              decisions.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              Data Subject Rights
            </h2>
            <p className="mt-3">
              Depending on your jurisdiction, you may have rights over your
              personal data. The rights below are described in plain language;
              availability and process may vary by location.
            </p>
            <p className="mt-3">
              We respect the rights of data subjects regarding their personal
              data, including:
            </p>
            <p className="mt-3">
              To exercise a right, contact our Data Protection Officer at
              privacy@tellacity.com or use the channels described in Contact Us
              and our{" "}
              <Link href="/help-center" className={linkClass}>
                Help Center
              </Link>
              .
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">Right to Access</h3>
                <p className="mt-1">
                  Right to Access: You can request a copy of your personal data.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">
                  Right to Rectification
                </h3>
                <p className="mt-1">
                  Right to Rectification: You can request correction of inaccurate
                  data.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">Right to Erasure</h3>
                <p className="mt-1">
                  Right to Erasure: You can request deletion of your data (&quot;right
                  to be forgotten&quot;).
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">
                  Right to Restriction
                </h3>
                <p className="mt-1">
                  Right to Restriction: You can request restriction of processing.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">
                  Right to Data Portability
                </h3>
                <p className="mt-1">
                  Right to Data Portability: You can request your data in a
                  structured, commonly used format.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">Right to Object</h3>
                <p className="mt-1">
                  Right to Object: You can object to processing based on legitimate
                  interests or direct marketing.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              Incident Response
            </h2>
            <p className="mt-3">
              Tellacity maintains a breach response process so security incidents
              are handled promptly and consistently.
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">Breach handling</h3>
                <p className="mt-1">
                  We have an incident response plan in place to handle data breaches
                  or security incidents effectively.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">Notifications</h3>
                <p className="mt-1">
                  In the event of a personal data breach likely to result in a high
                  risk to rights and freedoms, we will notify the competent
                  supervisory authority and affected data subjects without undue
                  delay.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              Retention and Disposal
            </h2>
            <p className="mt-3">
              Data is kept only for as long as needed for the purpose it was
              collected, or as required by law—then deleted or anonymized securely.
            </p>
            <p className="mt-3">
              We retain personal data only for as long as necessary to fulfill
              the purposes for which it was collected or as required by law. When
              data is no longer needed, it is securely deleted or anonymized.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              Continuous Improvement
            </h2>
            <p className="mt-3">
              Security and compliance practices are reviewed regularly so we can
              respond to new threats, technologies, and regulatory requirements.
            </p>
            <p className="mt-3">
              We regularly review and update our data protection practices to
              adapt to changing threats, technologies, and regulations.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              Relationship to Other Policies
            </h2>
            <p className="mt-3">
              This Data Protection Policy adds technical and operational detail
              to the general principles in our other legal documents. It works
              alongside—not instead of—those policies.
            </p>
            <p className="mt-3">
              This Data Protection Policy complements our Privacy Policy and
              Terms of Service. In the event of any conflict, the specific terms
              regarding data handling in this policy shall provide additional
              context to the general principles in the Privacy Policy.
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">Privacy Policy</h3>
                <p className="mt-1">
                  Our{" "}
                  <Link href="/privacy-policy" className={linkClass}>
                    Privacy Policy
                  </Link>{" "}
                  explains what we collect, how we use it, and your privacy rights
                  in broader terms.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">Terms of Service</h3>
                <p className="mt-1">
                  Our{" "}
                  <Link href="/terms-of-service" className={linkClass}>
                    Terms of Service
                  </Link>{" "}
                  govern use of the platform and sit alongside this policy for
                  contractual context.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">Contact Us</h2>
            <p className="mt-3">
              For questions about this policy, data protection practices, or to
              exercise your rights, contact our Data Protection Officer.
            </p>
            <p className="mt-3">
              For any inquiries regarding data protection or to exercise your
              rights, please contact our Data Protection Officer at
              privacy@tellacity.com.
            </p>
            <p className="mt-3">
              You may also reach us through{" "}
              <Link href="/contact" className={linkClass}>
                Contact
              </Link>{" "}
              or the{" "}
              <Link href="/faq" className={linkClass}>
                FAQ
              </Link>{" "}
              for general support routing.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-[#F7F8FA] p-8">
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              Related policies
            </h2>
            <p className="mt-3 text-sm text-gray-600">
              Learn more about how Tellacity handles privacy, cookies, trust,
              moderation, and support.
            </p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {RELATED_POLICIES.map((page) => (
                <li key={page.href}>
                  <Link href={page.href} className={linkClass}>
                    {page.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-gray-600">
              Tellacity&apos;s data protection practices work together with our{" "}
              <Link href="/privacy-policy" className={linkClass}>
                privacy
              </Link>{" "}
              and{" "}
              <Link href="/safety-trust" className={linkClass}>
                trust
              </Link>{" "}
              policies.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
