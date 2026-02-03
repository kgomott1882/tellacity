export default function CookiePolicyPage() {
  return (
    <main className="bg-white">
      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
              Cookie Preferences
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              Last Updated: September 6, 2025
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 pb-16 space-y-10 text-sm text-gray-700">
          <p>
            Manage your cookie settings and learn more about how we use cookies
            to enhance your experience on Tellacity.
          </p>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              1. How Cookie Preferences Work
            </h2>
            <p className="mt-3">
              At Tellacity, we believe in giving you control over your data.
              Cookies are small text files stored on your device that help us
              improve your experience, analyze our traffic, and personalize
              content. While some cookies are essential for our website to
              function, others are optional and you can choose whether to accept
              them.
            </p>
            <p className="mt-3">
              Your preferences are saved for one year. You can update them at
              any time by revisiting this page or clicking the "Cookie
              Preferences" link in our footer.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              2. Cookie Categories
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <p className="font-semibold text-[#0E0E0E]">
                  Strictly Necessary Cookies
                </p>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Always Active
                </p>
                <p className="mt-2">
                  These cookies are essential for the website to function
                  properly. They enable basic features like page navigation,
                  secure login areas, and shopping cart functionality. The
                  website cannot function correctly without these cookies.
                </p>
              </div>

              <div>
                <p className="font-semibold text-[#0E0E0E]">Functional Cookies</p>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Toggle Functional Cookies
                </p>
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  (Coming Soon)
                </p>
                <p className="mt-2">
                  These cookies allow the website to remember choices you make
                  (such as your username, language, or the region you are in) and
                  provide enhanced, more personal features.
                </p>
              </div>

              <div>
                <p className="font-semibold text-[#0E0E0E]">
                  Analytics & Performance Cookies
                </p>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Toggle Analytics Cookies
                </p>
                <p className="mt-2">
                  These cookies help us understand how visitors interact with our
                  website by collecting and reporting information anonymously.
                  This helps us improve our website's performance and user
                  experience.
                </p>
              </div>

              <div>
                <p className="font-semibold text-[#0E0E0E]">
                  Marketing & Advertising Cookies
                </p>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Toggle Marketing Cookies
                </p>
                <p className="mt-2">
                  These cookies are used to track visitors across websites. The
                  intention is to display ads that are relevant and engaging for
                  the individual user and thereby more valuable for publishers
                  and third party advertisers.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              3. Your Choices and Controls
            </h2>
            <p className="mt-3">
              You have the right to decide whether to accept or reject cookies.
              You can exercise your cookie rights by setting your preferences in
              the Cookie Consent Manager via the buttons above. You can also
              modify your web browser controls to accept or refuse cookies.
            </p>
            <p className="mt-3">
              If you choose to reject cookies, you may still use our website
              though your access to some functionality and areas of our website
              may be restricted.
            </p>
            <button
              type="button"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-black px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white"
            >
              Open Cookie Consent Manager
            </button>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              4. Browser-Level Controls
            </h2>
            <p className="mt-3">
              Most web browsers allow you to control cookies through their
              settings preferences. However, if you limit the ability of
              websites to set cookies, you may worsen your overall user
              experience, since it will no longer be personalized to you. It may
              also stop you from saving customized settings like login
              information.
            </p>
            <p className="mt-3">
              Browser manufacturers provide help pages relating to cookie
              management in their products. Please see below for more
              information:
            </p>
            <ul className="mt-4 space-y-2">
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
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              5. Data Protection and Privacy
            </h2>
            <p className="mt-3">
              For more information about how we protect your data, your privacy
              rights, and how to contact our Data Protection Officer, please
              read our Privacy Policy.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              6. Updates to This Policy
            </h2>
            <p className="mt-3">
              We may update this Cookie Policy from time to time in order to
              reflect, for example, changes to the cookies we use or for other
              operational, legal or regulatory reasons. Please therefore
              re-visit this Cookie Policy regularly to stay informed about our
              use of cookies and related technologies.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">7. Contact Us</h2>
            <p className="mt-3">
              If you have any questions about our use of cookies or other
              technologies, please email us at privacy@tellacity.com or by post
              to:
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
