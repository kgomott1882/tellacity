import Link from "next/link";
import {
  PLAN_ARTICLE_LIMITS,
  formatPlanArticleLimitTableCell,
  type PlanKey,
} from "@/lib/plans";
import { MAX_SAME_EXTERNAL_URL_OCCURRENCES } from "@/lib/articles/linkValidation/types";
import { PLAN_EXTERNAL_LINK_LIMITS } from "@/lib/plans";

const linkClass =
  "font-medium text-[#124541] underline underline-offset-2 hover:text-[#1FAF9E]";

const PLAN_ORDER: PlanKey[] = ["free", "grow", "premium", "elite"];

const PLAN_LABELS: Record<PlanKey, string> = {
  free: "Free",
  grow: "Grow",
  premium: "Premium",
  elite: "Elite",
};

export default function BusinessGuidelinesArticlesSection() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-[#0E0E0E]">
        Blogs &amp; Case Studies (Articles)
      </h2>
      <p className="mt-3">
        Verified businesses on Tellacity can publish <strong>blogs</strong> and{" "}
        <strong>case studies</strong> through the dashboard under{" "}
        <strong>Blogs &amp; Case Studies</strong>. This content is written by your business,
        reviewed by Tellacity before it goes live, and displayed on the public{" "}
        <Link href="/articles" className={linkClass}>
          Articles
        </Link>{" "}
        section and your business profile, alongside Tellacity&apos;s own editorial
        articles on the same hub.
      </p>
      <p className="mt-3">
        The goal is to help customers learn from your expertise, discover your business, and
        trust the brand behind the reviews, without turning articles into spam, affiliate
        funnels, or misleading marketing.
      </p>

      <div className="mt-6 space-y-5">
        <div>
          <h3 className="font-semibold text-[#0E0E0E]">Content types</h3>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              <strong>Business article:</strong> guides, updates, tips, and thought leadership about your
              industry or services.
            </li>
            <li>
              <strong>Case study:</strong> a structured story with client industry, challenge,
              solution, and results fields, plus the main article body.
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-[#0E0E0E]">Plan limits (submissions per month)</h3>
          <p className="mt-2">
            A submission credit is used when you <strong>submit for review</strong>, not when you
            save a draft. If Tellacity rejects a submission, the credit is returned for that
            billing month. Editing an already-published article and submitting an update does{" "}
            <strong>not</strong> use an additional monthly credit.
          </p>
          <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Blogs &amp; case studies</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {PLAN_ORDER.map((plan) => (
                  <tr key={plan}>
                    <td className="px-4 py-3 font-medium capitalize text-[#0E0E0E]">
                      {PLAN_LABELS[plan]}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatPlanArticleLimitTableCell(plan)}
                      {plan === "free" ? (
                        <span className="block text-xs text-gray-500">
                          You may save drafts; publishing requires Grow or higher.
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Current limits: Free {PLAN_ARTICLE_LIMITS.free}/mo · Grow{" "}
            {PLAN_ARTICLE_LIMITS.grow}/mo · Premium {PLAN_ARTICLE_LIMITS.premium}/mo · Elite{" "}
            {PLAN_ARTICLE_LIMITS.elite}/mo. See{" "}
            <Link href="/pricing" className={linkClass}>
              Plans &amp; Pricing
            </Link>{" "}
            for full plan details.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-[#0E0E0E]">Editor workflow</h3>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              <strong>Setup:</strong> choose blog or case study; optionally add a writer name
              and occupation for the public byline.
            </li>
            <li>
              <strong>Title &amp; featured image:</strong> clear headline and a representative
              hero image.
            </li>
            <li>
              <strong>Content:</strong> write in the visual editor; use{" "}
              <strong>Preview</strong> to check layout, images, and links before submitting.
            </li>
            <li>
              <strong>Submit:</strong> sends the piece to Tellacity for human review. Until
              approved, it stays off the public site.
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-[#0E0E0E]">Review, rejection &amp; updates</h3>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              Every submission is moderated. Statuses in your dashboard include draft, pending
              review, published, and rejected.
            </li>
            <li>
              If content is rejected, the reason is emailed to the business owner and shown in
              the dashboard when you click the rejected status.
            </li>
            <li>
              Fix the issues, edit your draft, and submit again. Rejected first-time submissions
              return your monthly credit.
            </li>
            <li>
              When you edit a <strong>published</strong> article, your live version stays public
              while the update is reviewed. Only the approved revision replaces what readers see.
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-[#0E0E0E]">Attribution &amp; public display</h3>
          <p className="mt-2">
            Tellacity is a business-focused platform. The <strong>business</strong> is the
            primary entity on every article, not a standalone author profile system.
          </p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              Published pages show business attribution (logo, name, category, publish date) and
              an optional &quot;Written by&quot; line when you provide writer name and
              occupation.
            </li>
            <li>
              An <strong>About this business</strong> section links to your profile, website, and
              reviews.
            </li>
            <li>
              Readers can share articles on Facebook, LinkedIn, and X. Related articles from
              Tellacity may appear at the bottom to improve discovery.
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-[#0E0E0E]">Content standards</h3>
          <p className="mt-2">Articles must be:</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              <strong>Original and accurate:</strong> written by or for your business; no
              plagiarised or AI-spun filler without real value.
            </li>
            <li>
              <strong>Honest:</strong> no false claims, fake statistics, or impersonation of
              customers or competitors.
            </li>
            <li>
              <strong>Relevant:</strong> related to your industry, services, or genuine client
              outcomes (for case studies).
            </li>
            <li>
              <strong>Professional:</strong> no hate speech, harassment, illegal content, or
              adult material.
            </li>
            <li>
              <strong>Non-spammy:</strong> not keyword-stuffed advertorials, link schemes, or
              duplicate posts submitted repeatedly to manipulate search.
            </li>
          </ul>
          <p className="mt-2">
            Images (featured and inline) must be owned or licensed, appropriate, and must not
            misrepresent your products or premises, the same standards as profile photos above
            apply.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-[#0E0E0E]">Link rules (enforced in the editor)</h3>
          <p className="mt-2">
            To protect readers and keep articles trustworthy, Tellacity enforces link limits in
            the editor and again at review:
          </p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              Maximum external links per article depend on your plan:{" "}
              <strong>Grow {PLAN_EXTERNAL_LINK_LIMITS.grow}</strong>,{" "}
              <strong>Premium {PLAN_EXTERNAL_LINK_LIMITS.premium}</strong>,{" "}
              <strong>Elite {PLAN_EXTERNAL_LINK_LIMITS.elite}</strong> (links outside Tellacity
              and outside your own business website).
            </li>
            <li>
              Links to your <strong>registered business website</strong> do not count toward that
              external limit.
            </li>
            <li>
              Links to other Tellacity pages (your profile, categories, etc.) are unlimited.
            </li>
            <li>
              The same external URL may appear at most{" "}
              <strong>{MAX_SAME_EXTERNAL_URL_OCCURRENCES} times</strong> in one article.
            </li>
            <li>
              <strong>Not allowed:</strong> affiliate or referral links, URL shorteners,
              gambling, adult-content, and unsafe download links.
            </li>
            <li>
              Use normal anchor text (readable link labels). Do not paste raw URLs repeatedly to
              game search engines.
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-[#0E0E0E]">Enforcement</h3>
          <p className="mt-2">
            Articles that break these rules may be rejected during review or removed after
            publication. Repeated abuse, spam links, misleading content, or attempts to bypass
            link limits, may lead to restrictions on submissions or broader account enforcement
            under the suspension reasons above.
          </p>
          <p className="mt-2">
            Manage articles in the{" "}
            <Link href="/business/dashboard/articles" className={linkClass}>
              Blogs &amp; Case Studies dashboard
            </Link>
            . Questions? Contact{" "}
            <Link href="/contact/support" className={linkClass}>
              Tellacity Support
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
