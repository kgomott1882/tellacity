export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  /** HTML string rendered in the main content area */
  content: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "turn-reviews-into-growth-2026",
    title: "How to Turn Customer Reviews into Growth Signals in 2026",
    description:
      "A practical framework for turning raw customer feedback into product, CX, and revenue insights.",
    date: "2026-03-01",
    content: `
      <p class="text-gray-700">
        Customer reviews are no longer just social proof. In 2026, they are one of the cleanest,
        fastest feedback signals you can use to make decisions about product, operations, and support.
      </p>

      <h2 id="why-reviews-matter" class="mt-10 scroll-m-20 text-2xl font-semibold text-gray-900">
        Why reviews matter more than ever
      </h2>
      <p class="mt-4 text-gray-700">
        Every public review is a small research interview you did not have to schedule.
        When analyzed correctly, reviews reveal patterns about expectations, friction points,
        and moments of delight across the entire customer journey.
      </p>

      <h2 id="signal-vs-noise" class="mt-10 scroll-m-20 text-2xl font-semibold text-gray-900">
        Separating signal from noise
      </h2>
      <p class="mt-4 text-gray-700">
        Not every review should drive a roadmap change. Instead of reacting to one-off comments,
        focus on repeatable patterns.
      </p>

      <h3 id="compare-manual-vs-platform" class="mt-8 scroll-m-20 text-xl font-semibold text-gray-900">
        Manual monitoring vs. a reviews platform
      </h3>
      <div class="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table class="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 font-semibold text-gray-700">Approach</th>
              <th class="px-4 py-3 font-semibold text-gray-700">Pros</th>
              <th class="px-4 py-3 font-semibold text-gray-700">Limitations</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 bg-white">
            <tr>
              <td class="px-4 py-3 text-gray-900">Manual monitoring</td>
              <td class="px-4 py-3 text-gray-700">
                Simple to start; no extra tools required; useful for very small volumes.
              </td>
              <td class="px-4 py-3 text-gray-700">
                Hard to track patterns; easy to miss trends; difficult to share context across teams.
              </td>
            </tr>
            <tr>
              <td class="px-4 py-3 text-gray-900">Dedicated reviews platform (like Tellacity)</td>
              <td class="px-4 py-3 text-gray-700">
                Central source of truth; verified reviews; analytics around trends, sentiment, and response time.
              </td>
              <td class="px-4 py-3 text-gray-700">
                Requires a bit of setup and process, but unlocks far more leverage over time.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="operational-playbook" class="mt-10 scroll-m-20 text-2xl font-semibold text-gray-900">
        A simple operational playbook
      </h2>
      <p class="mt-4 text-gray-700">
        Start with a weekly 30-minute review ritual: group new reviews, tag them by theme,
        and assign owners. Over time you will see which issues disappear, which areas improve,
        and which experiences consistently create promoters.
      </p>
    `,
  },
  {
    slug: "review-response-playbook-2026",
    title: "The 2026 Review Response Playbook for Growing Brands",
    description:
      "A practical template for responding to 1-star, 3-star, and 5-star reviews in a way that builds trust.",
    date: "2026-02-10",
    content: `
      <p class="text-gray-700">
        Smart businesses treat every review as the beginning of a conversation, not the end of one.
        The way you respond signals how seriously you take customers, even when things go wrong.
      </p>

      <h2 id="principles" class="mt-10 scroll-m-20 text-2xl font-semibold text-gray-900">
        Core principles for modern review responses
      </h2>
      <p class="mt-4 text-gray-700">
        Great responses are specific, calm, and written for future readers—not just the original reviewer.
      </p>

      <h2 id="templates" class="mt-10 scroll-m-20 text-2xl font-semibold text-gray-900">
        Templates by review type
      </h2>
      <h3 id="one-star" class="mt-6 scroll-m-20 text-xl font-semibold text-gray-900">
        1-star reviews: acknowledge, clarify, and offer a path forward
      </h3>
      <p class="mt-4 text-gray-700">
        Avoid canned apologies. Show that you have read the details and explain what will change.
      </p>

      <h3 id="three-star" class="mt-6 scroll-m-20 text-xl font-semibold text-gray-900">
        3-star reviews: turn “fine” into “great”
      </h3>
      <p class="mt-4 text-gray-700">
        These reviews often highlight small gaps in communication, onboarding, or expectations.
        Treat them as low-effort opportunities to create delighted customers.
      </p>

      <h3 id="five-star" class="mt-6 scroll-m-20 text-xl font-semibold text-gray-900">
        5-star reviews: amplify what already works
      </h3>
      <p class="mt-4 text-gray-700">
        A quick, specific thank-you reinforces the behaviour you want to see more of—from both customers and teams.
      </p>
    `,
  },
];

export function getAllBlogPosts(): BlogPost[] {
  return [...blogPosts].sort((a, b) => b.date.localeCompare(a.date));
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

