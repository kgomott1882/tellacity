export type ResourceCard = {
  title: string;
  copy: string;
  href: string;
  image: string;
  imageAlt: string;
};

export const RESOURCE_START_PATH = [
  {
    step: "01",
    title: "Understand the platform",
    copy: "See how review invitations, widgets, analytics, and articles connect on Tellacity for Business.",
    href: "/for-business",
    cta: "Tellacity for Business →",
  },
  {
    step: "02",
    title: "Set up your business",
    copy: "Use the Help Center for step-by-step setup, policies, and day-to-day dashboard guidance.",
    href: "/help-center",
    cta: "Open Help Center →",
  },
  {
    step: "03",
    title: "Choose your plan",
    copy: "Compare Free, Grow, Premium, and Elite limits for invites, blogs or case studies, photos, and widgets.",
    href: "/pricing",
    cta: "View pricing →",
  },
] as const;

export const LEARN_RESOURCES: ResourceCard[] = [
  {
    title: "Articles",
    copy: "Tellacity guides, business articles, and case studies on reviews, trust, and reputation.",
    href: "/articles",
    image: "/Resources/Blog.jpg",
    imageAlt: "Tellacity articles",
  },
  {
    title: "Guides & Reports",
    copy: "In-depth guides and industry reports on reputation and customer feedback.",
    href: "/guides",
    image: "/Resources/Guides.jpg",
    imageAlt: "Tellacity guides and reports",
  },
  {
    title: "Badges Guide",
    copy: "What Tellacity badges mean and how they signal verified trust on profiles.",
    href: "/badges-guide",
    image: "/Resources/Badges.jpg",
    imageAlt: "Tellacity trust badges",
  },
];

export const APPLY_RESOURCES: ResourceCard[] = [
  {
    title: "Help Center",
    copy: "Searchable documentation, setup guides, and answers for businesses and reviewers.",
    href: "/help-center",
    image: "/Resources/Help.png",
    imageAlt: "Tellacity Help Center",
  },
  {
    title: "Integrations",
    copy: "Connect review requests, customer data, and social proof to tools you already use.",
    href: "/integrations",
    image: "/Resources/Intergrations.png",
    imageAlt: "Tellacity integrations",
  },
  {
    title: "Business Guidelines",
    copy: "Listing, review, photo, and blogs & case study standards for verified businesses.",
    href: "/business-guidelines",
    image: "/brand/Real%20capabilities.jpeg",
    imageAlt: "Tellacity business guidelines",
  },
  {
    title: "FAQ",
    copy: "Quick answers on plans, moderation, verification, and publishing content.",
    href: "/faq",
    image: "/Resources/customer-analytics.jpg.png",
    imageAlt: "Tellacity FAQ",
  },
];

export const GROW_RESOURCES: ResourceCard[] = [
  {
    title: "Customer Stories",
    copy: "How real businesses collect reviews, respond publicly, and grow with trust.",
    href: "/customer-stories",
    image: "/Resources/Customer%20Stories.jpg",
    imageAlt: "Tellacity customer stories",
  },
  {
    title: "Partner Program",
    copy: "For agencies and platforms extending Tellacity reputation tools to clients.",
    href: "/partner-program",
    image: "/Resources/Partner%20Program.jpg",
    imageAlt: "Tellacity partner program",
  },
  {
    title: "Solutions",
    copy: "Deep dives on invitations, widgets, analytics, reputation management, and photo uploads.",
    href: "/solutions",
    image: "/brand/Platforms.png",
    imageAlt: "Tellacity business solutions",
  },
  {
    title: "Safety & Trust",
    copy: "How verification, moderation, and transparency policies protect everyone on Tellacity.",
    href: "/safety-trust",
    image: "/brand/Trust%20signals.png",
    imageAlt: "Tellacity safety and trust",
  },
];
