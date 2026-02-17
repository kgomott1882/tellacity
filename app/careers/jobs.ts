export type JobSpec = {
  slug: string;
  title: string;
  location: string;
  department?: string;
  whatYouDo: string[];
  whatYouBring: string[];
  whoWeAre: string;
  whatWeOffer: string[];
  aboutUs: string;
  stillUnsure?: string;
};

export const JOBS: JobSpec[] = [
  {
    slug: "senior-software-engineer-fullstack",
    title: "Senior Software Engineer (Fullstack)",
    location: "Remote",
    department: "Engineering",
    whatYouDo: [
      "Design and build scalable, secure APIs and services",
      "Own features end-to-end from spec to production",
      "Collaborate with product and design on new capabilities",
      "Mentor engineers and improve our codebase and practices",
    ],
    whatYouBring: [
      "Strong experience with TypeScript/JavaScript and React",
      "Backend experience (Node.js, Postgres, or similar)",
      "Comfort with ambiguity and fast-paced iteration",
      "Focus on quality, testing, and maintainability",
    ],
    whoWeAre:
      "We're a small, product-minded engineering team building the trust layer for the internet. We value clarity, ownership, and shipping.",
    whatWeOffer: [
      "Remote-first with flexible hours",
      "Competitive salary and equity",
      "Health and wellbeing allowance",
      "Learning budget and conference support",
      "28 days annual leave",
    ],
    aboutUs:
      "Tellacity is a global trust and reputation platform where consumers share genuine experiences and businesses build credibility. We use verification and transparency to make every decision more confident.",
    stillUnsure:
      "Don't meet every requirement? We still want to hear from you. We care more about curiosity, integrity, and drive than a perfect checklist.",
  },
  {
    slug: "product-designer",
    title: "Product Designer",
    location: "Remote",
    department: "Product",
    whatYouDo: [
      "Lead design for core product areas (reviews, business profiles, trust signals)",
      "Partner with engineering and product from discovery to launch",
      "Create prototypes, flows, and high-fidelity UI",
      "Help define and evolve our design system",
    ],
    whatYouBring: [
      "Portfolio showing end-to-end product design work",
      "Experience with Figma or similar",
      "Strong UX reasoning and user empathy",
      "Ability to communicate design decisions clearly",
    ],
    whoWeAre:
      "We're building products that make trust transparent. Design is central to how we help consumers and businesses connect.",
    whatWeOffer: [
      "Remote-first with flexible hours",
      "Competitive salary and equity",
      "Health and wellbeing allowance",
      "Learning budget",
      "28 days annual leave",
    ],
    aboutUs:
      "Tellacity is a global trust and reputation platform. We help people share verified experiences and businesses build credibility through transparency.",
    stillUnsure:
      "If you're passionate about trust and clarity in product design, we'd love to see your work.",
  },
  {
    slug: "brand-trust-analyst",
    title: "Brand & Trust Analyst",
    location: "Remote",
    department: "Trust & Safety",
    whatYouDo: [
      "Analyze review and business data to spot fraud and abuse patterns",
      "Support policy and product decisions with data and reporting",
      "Work with moderation and engineering on detection improvements",
      "Help communicate trust metrics to internal and external stakeholders",
    ],
    whatYouBring: [
      "Experience with data analysis (SQL, spreadsheets, or BI tools)",
      "Strong attention to detail and logical reasoning",
      "Interest in trust, reputation, and consumer protection",
      "Clear written and verbal communication",
    ],
    whoWeAre:
      "Our Trust & Safety team ensures Tellacity stays a reliable place for genuine feedback. We combine data, policy, and product.",
    whatWeOffer: [
      "Remote-first with flexible hours",
      "Competitive salary and equity",
      "Health and wellbeing allowance",
      "28 days annual leave",
    ],
    aboutUs:
      "Tellacity is a global trust and reputation platform. We use verification and transparency so consumers and businesses can make better decisions.",
    stillUnsure:
      "If you care about trust and like turning data into insight, we want to hear from you.",
  },
  {
    slug: "community-moderation-specialist",
    title: "Community & Moderation Specialist",
    location: "Remote",
    department: "Trust & Safety",
    whatYouDo: [
      "Review and triage reported content and disputes",
      "Apply and improve moderation guidelines with consistency",
      "Support users and businesses with fairness and empathy",
      "Surface trends and edge cases to improve policies and tools",
    ],
    whatYouBring: [
      "Experience in moderation, support, or community management",
      "Calm under pressure and able to make consistent decisions",
      "Strong written communication",
      "Interest in trust, fairness, and online safety",
    ],
    whoWeAre:
      "We keep Tellacity a safe, fair place for real feedback. We work closely with product and policy to protect both consumers and businesses.",
    whatWeOffer: [
      "Remote-first with flexible hours",
      "Competitive salary and equity",
      "Health and wellbeing allowance",
      "28 days annual leave",
    ],
    aboutUs:
      "Tellacity is a global trust and reputation platform. Our moderation team is essential to maintaining integrity and user trust.",
    stillUnsure:
      "If you're detail-oriented and care about fair outcomes, we'd like to meet you.",
  },
  {
    slug: "business-development-manager",
    title: "Business Development Manager",
    location: "Remote",
    department: "Growth",
    whatYouDo: [
      "Build and grow relationships with businesses and partners",
      "Identify and pursue new market and channel opportunities",
      "Represent Tellacity at events and in sales conversations",
      "Work with product and marketing on positioning and feedback",
    ],
    whatYouBring: [
      "Experience in B2B sales, partnerships, or business development",
      "Strong communication and negotiation skills",
      "Self-driven and comfortable with targets",
      "Interest in trust, reviews, and SaaS",
    ],
    whoWeAre:
      "We're scaling how businesses join and succeed on Tellacity. We care about long-term relationships and real value for our customers.",
    whatWeOffer: [
      "Remote-first with flexible hours",
      "Competitive salary, equity, and commission",
      "Health and wellbeing allowance",
      "28 days annual leave",
    ],
    aboutUs:
      "Tellacity is a global trust and reputation platform. We help businesses build credibility and consumers make confident decisions.",
    stillUnsure:
      "If you're motivated by impact and building something meaningful, we want to talk.",
  },
];

export function getJobBySlug(slug: string): JobSpec | undefined {
  return JOBS.find((j) => j.slug === slug);
}
