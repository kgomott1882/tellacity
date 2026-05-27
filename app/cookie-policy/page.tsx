import type { Metadata } from "next";
import Link from "next/link";
import OpenCookieConsentButton from "@/components/cookie/OpenCookieConsentButton";

const PAGE_URL = "https://tellacity.com/cookie-policy";

export const metadata: Metadata = {
  title: "Cookie Preferences | Tellacity",
  description:
    "Manage your cookie preferences and learn how Tellacity uses cookies for login, settings, analytics, and personalization.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Cookie Preferences | Tellacity",
    description:
      "Manage your cookie preferences and learn how Tellacity uses cookies for login, settings, analytics, and personalization.",
    url: PAGE_URL,
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cookie Preferences | Tellacity",
    description:
      "Manage your cookie preferences and learn how Tellacity uses cookies for login, settings, analytics, and personalization.",
  },
  robots: { index: true, follow: true },
};

const cookiePolicyJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Cookie Preferences | Tellacity",
  description:
    "Manage your cookie preferences and learn how Tellacity uses cookies for login, settings, analytics, and personalization.",
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
        name: "Cookie Preferences",
        item: PAGE_URL,
      },
    ],
  },
};

const linkClass =
  "font-medium text-[#124541] underline underline-offset-2 hover:text-[#1FAF9E]";

export default function CookiePolicyPage() {
  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(cookiePolicyJsonLd),
        }}
      />

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
              Cookie Preferences
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              Last Updated: September 6, 2025
            </p>
            <p className="mx-auto mt-4 max-w-3xl text-sm text-gray-600 sm:text-base">
              Manage your cookie settings and learn more about how we use cookies
              to enhance your experience on Tellacity. Cookies help with login,
              preferences, analytics, and personalization, and you can change
              your preferences at any time.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl space-y-12 px-6 pb-16 text-sm text-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              How Cookie Preferences Work
            </h2>
            <p className="mt-3 leading-relaxed">
              Cookies are small text files stored on your device. They help the
              site function, remember your choices, and improve performance.
              Some cookies are required; others are optional and can be toggled
              off.
            </p>
            <p className="mt-3 leading-relaxed">
              At Tellacity, we believe in giving you control over your data.
              Cookies are small text files stored on your device that help us
              improve your experience, analyze our traffic, and personalize
              content. While some cookies are essential for our website to
              function, others are optional and you can choose whether to accept
              them.
            </p>
            <p className="mt-3 leading-relaxed">
              Your preferences are saved for one year. You can update them at
              any time by revisiting this page or clicking the &quot;Cookie
              Preferences&quot; link in our footer.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Cookie Categories
            </h2>
            <p className="mt-3 leading-relaxed">
              Tellacity groups cookies into four categories. Strictly necessary
              cookies are always active because the site cannot work without
              them. Functional, analytics, and marketing cookies can be
              accepted or rejected through your preferences.
            </p>
            <div className="mt-6 space-y-8">
              <div>
                <h3 className="text-base font-semibold text-[#0E0E0E]">
                  Strictly Necessary Cookies
                </h3>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Always Active
                </p>
                <p className="mt-2 leading-relaxed">
                  These cookies are required for login, navigation, and core
                  site functions. They enable basic features like page
                  navigation, secure login areas, and shopping cart functionality.
                  The website cannot function correctly without these cookies.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-[#0E0E0E]">
                  Functional Cookies
                </h3>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Toggle Functional Cookies
                </p>
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  (Coming Soon)
                </p>
                <p className="mt-2 leading-relaxed">
                  These cookies remember settings such as your username,
                  language, or region and provide enhanced, more personal
                  features. They are optional and can be toggled when available.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-[#0E0E0E]">
                  Analytics &amp; Performance Cookies
                </h3>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Toggle Analytics Cookies
                </p>
                <p className="mt-2 leading-relaxed">
                  These cookies help Tellacity measure traffic and improve the
                  site by collecting and reporting information, often in
                  aggregated or anonymized form. They help us understand how
                  visitors interact with our website and improve performance and
                  user experience.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-[#0E0E0E]">
                  Marketing &amp; Advertising Cookies
                </h3>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Toggle Marketing Cookies
                </p>
                <p className="mt-2 leading-relaxed">
                  These cookies support relevant advertising and may track
                  visitors across websites. The intention is to display ads that
                  are relevant and engaging for the individual user and thereby
                  more valuable for publishers and third party advertisers.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Your Choices and Controls
            </h2>
            <p className="mt-3 leading-relaxed">
              You can accept or reject optional cookies through Tellacity&apos;s
              consent tools or through your browser. Rejecting some cookies may
              limit certain features but will not usually block access to the
              whole site.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Cookie Consent Manager
            </h3>
            <p className="mt-2 leading-relaxed">
              You have the right to decide whether to accept or reject cookies.
              You can exercise your cookie rights by setting your preferences in
              the Cookie Consent Manager via the buttons above. You can also
              modify your web browser controls to accept or refuse cookies.
            </p>
            <OpenCookieConsentButton className="mt-4 inline-flex items-center justify-center rounded-full bg-black px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white">
              Open Cookie Consent Manager
            </OpenCookieConsentButton>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Rejecting cookies and what that means
            </h3>
            <p className="mt-2 leading-relaxed">
              If you choose to reject cookies, you may still use our website
              though your access to some functionality and areas of our website
              may be restricted. Essential cookies remain active so core
              features such as secure login can continue to work.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Saving preferences for one year
            </h3>
            <p className="mt-2 leading-relaxed">
              When you save your choices, Tellacity stores your cookie
              preferences for one year. You can return to this page or use the
              footer link at any time to update them.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Browser-Level Controls
            </h2>
            <p className="mt-3 leading-relaxed">
              Most browsers let you block, delete, or limit cookies through
              settings. Browser controls apply across all sites you visit, not
              just Tellacity.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Browser settings
            </h3>
            <p className="mt-2 leading-relaxed">
              Most web browsers allow you to control cookies through their
              settings preferences. However, if you limit the ability of
              websites to set cookies, you may worsen your overall user
              experience, since it will no longer be personalized to you. It may
              also stop you from saving customized settings like login
              information.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Browser help pages
            </h3>
            <p className="mt-2 leading-relaxed">
              Browser manufacturers provide help pages relating to cookie
              management in their products. Please see below for more
              information:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed">
              <li>Google Chrome</li>
              <li>Internet Explorer</li>
              <li>Mozilla Firefox</li>
              <li>Safari (Desktop)</li>
              <li>Safari (Mobile)</li>
              <li>Android Browser</li>
              <li>Opera</li>
              <li>Opera Mobile</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Data Protection and Privacy
            </h2>
            <p className="mt-3 leading-relaxed">
              This cookie policy works alongside Tellacity&apos;s broader
              privacy and data protection materials. Cookies may involve
              personal data; how we handle that data is explained in our privacy
              documents.
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Privacy Policy
            </h3>
            <p className="mt-2 leading-relaxed">
              For more information about how we protect your data, your privacy
              rights, and how to contact our Data Protection Officer, please
              read our{" "}
              <Link href="/privacy-policy" className={linkClass}>
                Privacy Policy
              </Link>
              .
            </p>

            <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Data protection rights
            </h3>
            <p className="mt-2 leading-relaxed">
              Depending on your location, you may have rights to access, correct,
              or delete personal data related to cookies and tracking. See our{" "}
              <Link href="/data-protection" className={linkClass}>
                Data Protection
              </Link>{" "}
              page for more detail.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Updates to This Policy
            </h2>
            <p className="mt-3 leading-relaxed">
              Tellacity may update this cookie policy when our cookie use,
              vendors, or legal requirements change. The &quot;Last Updated&quot;
              date at the top of this page will change when revisions are posted.
            </p>
            <p className="mt-3 leading-relaxed">
              We may update this Cookie Policy from time to time in order to
              reflect, for example, changes to the cookies we use or for other
              operational, legal or regulatory reasons. Please therefore
              re-visit this Cookie Policy regularly to stay informed about our
              use of cookies and related technologies.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Contact Us
            </h2>
            <p className="mt-3 leading-relaxed">
              If you have questions about cookies or want to exercise privacy
              rights related to tracking, contact Tellacity using the channels
              below.
            </p>
            <p className="mt-3 leading-relaxed">
              If you have any questions about our use of cookies or other
              technologies, please email us at privacy@tellacity.com or by post
              to:
            </p>
            <p className="mt-3 leading-relaxed">
              You can also use our{" "}
              <Link href="/contact" className={linkClass}>
                contact form
              </Link>{" "}
              or visit the{" "}
              <Link href="/help-center" className={linkClass}>
                Help Center
              </Link>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Related policies
            </h2>
            <p className="mt-3 leading-relaxed">
              Learn more about privacy, data protection, and the trust policies
              that support Tellacity&apos;s platform.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed">
              <li>
                <Link href="/privacy-policy" className={linkClass}>
                  Privacy Policy
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
                <Link href="/contact" className={linkClass}>
                  Contact
                </Link>
              </li>
            </ul>
            <p className="mt-6 leading-relaxed">
              Tellacity&apos;s cookie controls work alongside our{" "}
              <Link href="/privacy-policy" className={linkClass}>
                privacy
              </Link>{" "}
              and{" "}
              <Link href="/data-protection" className={linkClass}>
                data protection
              </Link>{" "}
              policies.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
