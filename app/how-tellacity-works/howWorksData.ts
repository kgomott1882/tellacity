function brandImage(filename: string): string {
  return `/brand/${encodeURIComponent(filename)}`;
}

export const HOW_WORKS_IMAGES = {
  verificationSecondary: brandImage("Team Reads the Same Data.png"),
} as const;

export const verificationItems = [
  {
    title: "Proof of Purchase",
    description:
      "Reviewers can upload receipts, invoices, or order numbers to verify real experiences.",
    icon: "receipt" as const,
  },
  {
    title: "Identity Verification",
    description:
      "Accounts are tied to real people to reduce abuse and improve accountability.",
    icon: "userCheck" as const,
  },
  {
    title: "Suspicious Activity Checks",
    description:
      "Automated checks flag unusual patterns, duplicate behavior, and spam.",
    icon: "alertTriangle" as const,
  },
  {
    title: "Photo & Video Evidence",
    description:
      "Optional uploads add context and strengthen the credibility of reviews.",
    icon: "camera" as const,
  },
  {
    title: "Manual Moderation",
    description:
      "Our team reviews disputed content under clear and fair guidelines.",
    icon: "users" as const,
  },
  {
    title: "AI Fraud Detection",
    description:
      "Advanced systems identify manipulation attempts and protect integrity.",
    icon: "shield" as const,
  },
];

export const trustScoreItems = [
  {
    title: "Review Volume",
    pct: 72,
    description:
      "A healthy number of reviews provides a balanced view of experiences.",
    measures:
      "How many verified reviews a business has accumulated over time.",
    whyItMatters:
      "More reviews mean fewer outliers and a more reliable picture of what customers actually experience.",
  },
  {
    title: "Review Velocity",
    pct: 85,
    description:
      "Recent, consistent activity signals an active and trusted business.",
    measures:
      "How frequently new verified reviews are added relative to the business's size.",
    whyItMatters:
      "Recent activity shows the reputation is current, not coasting on old wins or hiding new problems.",
  },
  {
    title: "Review Quality",
    pct: 78,
    description:
      "Detailed feedback improves usefulness and raises confidence.",
    measures:
      "The depth, specificity, and length of the average verified review.",
    whyItMatters:
      "Detailed feedback gives consumers context and gives businesses something concrete to act on.",
  },
  {
    title: "Verification Rate",
    pct: 90,
    description:
      "Verified reviews carry more weight and improve overall trust.",
    measures:
      "The share of reviews that include proof of purchase or other verification signals.",
    whyItMatters:
      "Higher verification rates indicate that the reputation is built on real transactions, not anonymous claims.",
  },
  {
    title: "Response Rate",
    pct: 88,
    description:
      "Public replies show accountability and a commitment to customers.",
    measures:
      "How often the business publicly responds to reviews, both positive and negative.",
    whyItMatters:
      "Engaged businesses signal that they take customer feedback seriously, which builds long-term trust.",
  },
  {
    title: "Verified Mix",
    pct: 82,
    fullTitle: "Verified vs Unverified Mix",
    description:
      "A strong verified share indicates real customer activity.",
    measures:
      "The ratio of verified reviews to unverified ones across the full review history.",
    whyItMatters:
      "A healthy verified share shows the reputation comes from real customers, not bots or anonymous campaigns.",
  },
];

export const consumerStepDetails = [
  {
    title: "Write a review",
    description:
      "Use Tellacity's simple, guided form to share a verified review. Clear prompts for rating, title, and details reduce friction so honest feedback only takes a minute.",
  },
  {
    title: "Submit proof",
    description:
      "Add a receipt, invoice, or order ID to show this was a real experience. Verified reviews carry more weight and help future customers trust what they read.",
  },
  {
    title: "Read trusted feedback",
    description:
      "Filter and sort reviews by recency, rating, and verification. Trust signals like the verified badge and Trust Score help you focus on the feedback that matters.",
  },
  {
    title: "Explore transparent ratings",
    description:
      "Use the Trust Score and category comparisons to weigh businesses side by side. Transparent factors mean you can see why a score is high or low, not just the number.",
  },
  {
    title: "Contribute to trust",
    description:
      "Every honest review you write improves the platform for other customers. Your verified feedback also nudges businesses to keep improving.",
  },
];

export const businessStepDetails = [
  {
    title: "Claim your business",
    description:
      "Find your business on Tellacity and claim it with secure verification. Once claimed, you control how your profile presents your reputation to new customers.",
  },
  {
    title: "Set up your profile",
    description:
      "Add a clear description, accurate categories, contact details, photos, and links. Complete profiles convert better and rank more confidently in search.",
  },
  {
    title: "Request reviews",
    description:
      "Invite customers right after a purchase, booking, or service. Well-timed, verified invitations are the single biggest lever for collecting trustworthy reviews.",
  },
  {
    title: "Respond to feedback",
    description:
      "Use threaded replies to thank promoters and resolve issues in public. Open responses show prospects how you handle praise and complaints alike.",
  },
  {
    title: "Improve engagement",
    description:
      "Turn recurring feedback themes into product, service, and operational changes. Closing the loop publicly turns one customer's complaint into the next customer's confidence.",
  },
  {
    title: "Build and showcase trust",
    description:
      "Display your Trust Score and verified reviews via dashboards, widgets, and SEO-ready content through the Tellacity Reputation Management Platform.",
  },
];

export const consumerSteps = [
  "Write a review",
  "Submit proof",
  "Read feedback",
  "Explore ratings",
  "Contribute to trust",
];

export const businessSteps = [
  "Claim profile",
  "Set up",
  "Request reviews",
  "Respond",
  "Improve",
  "Showcase trust",
];

export const platformIncludes = [
  {
    title: "Public Business Profile",
    detail:
      "Verified reviews, Trust Score, photos, and business details in one place customers and search systems can cite.",
    image: "/brand/Reputation%20Management.png",
    icon: "building" as const,
    href: "/for-business",
  },
  {
    title: "Review Submission Form",
    detail:
      "A guided path for ratings, narrative feedback, and optional proof of purchase.",
    image: "/brand/Review%20Form.png",
    icon: "fileText" as const,
    href: "/write-review",
  },
  {
    title: "Business Dashboard",
    detail:
      "Review inbox, replies, sentiment, and trust performance in one workspace.",
    image: "/brand/Dashboard.png",
    icon: "layoutDashboard" as const,
    href: "/for-business",
  },
  {
    title: "Trust Score",
    detail:
      "A transparent summary of reputation based on six explicit factors, not a hidden black box.",
    image: "/brand/analysis%20trust.jpg",
    icon: "award" as const,
    href: "/for-business",
  },
  {
    title: "Verification System",
    detail:
      "Overlapping checks for identity, proof, fraud, moderation, and policy compliance.",
    image: "/brand/Proof%20of%20Purchase.png",
    icon: "shieldCheck" as const,
    href: "/safety-trust",
  },
  {
    title: "Widgets & Analytics",
    detail:
      "Embed verified proof on your site and measure trends from the same verified pipeline.",
    image: "/brand/Widgets.png",
    icon: "barChart2" as const,
    href: "/for-business",
  },
];

export const feedbackLoopStages = [
  {
    title: "Customers",
    detail:
      "People share real experiences through Tellacity's customer reviews and feedback platform.",
    icon: "user" as const,
  },
  {
    title: "Reviews",
    detail:
      "Feedback enters verification and moderation so only authentic reviews shape public reputation.",
    icon: "star" as const,
  },
  {
    title: "Business Response",
    detail:
      "Teams reply publicly, resolve issues, and show accountability.",
    icon: "messageSquare" as const,
  },
  {
    title: "Trust Score",
    detail:
      "Verified signals update the Trust Score so discovery reflects current reputation.",
    icon: "trendingUp" as const,
  },
  {
    title: "Community",
    detail:
      "The next customer searches with better context; the marketplace becomes more transparent.",
    icon: "globe" as const,
  },
];

export const stepFlowItems = [
  {
    num: "01",
    title: "Search",
    detail:
      "Search Tellacity for a business by name, category, or country to land on a profile with verified reviews, Trust Score, and details.",
    whyItMatters:
      "Discovery built on verified reviews means buying decisions start from real customer experience, not paid placement.",
    image: "/brand/BCO.bfa6e599-775f-41ca-bfa0-b6ad65cc2238.png",
    imageAlt: "Person searching for businesses on a laptop",
    local: true,
    bg: "beige" as const,
    imageLeft: true,
  },
  {
    num: "02",
    title: "Read Reviews",
    detail:
      "Browse moderated, verified reviews to see what customers actually experienced, with filters for rating, recency, and verification.",
    whyItMatters:
      "Reading honest reviews before you buy turns guesswork into informed choice and pushes businesses to keep performing.",
    image: "/brand/Review%20Feedback.jpeg",
    imageAlt: "Customer reading review feedback",
    local: true,
    imagePlain: true,
    bg: "white" as const,
    imageLeft: false,
  },
  {
    num: "03",
    title: "Write a Review",
    detail:
      "Submit a review with a rating, title, body, and optional proof of purchase, all from a single guided form.",
    whyItMatters:
      "Every verified review shapes the next customer's decision and gives the business signal it can actually act on.",
    image: brandImage("Woman_in_front_of_laptop.jpeg"),
    imageAlt: "Woman writing a review in front of a laptop",
    local: true,
    bg: "beige" as const,
    imageLeft: true,
    cta: { href: "/write-review", label: "Write a Review →" },
  },
  {
    num: "04",
    title: "Review Verification",
    detail:
      "Tellacity checks each review against identity signals, proof of purchase, fraud detection, and manual moderation when needed.",
    whyItMatters:
      "Verification is what makes the reputation worth trusting and what stops fake reviews from misleading consumers.",
    image: "/brand/Proof%20of%20Purchase.png",
    imageAlt: "Proof of purchase verification",
    local: true,
    bg: "white" as const,
    imageLeft: false,
  },
  {
    num: "05",
    title: "Business Collaboration",
    detail:
      "Businesses claim their profile, respond publicly to reviews, and resolve issues directly with customers in threaded replies.",
    whyItMatters:
      "Open responses turn complaints into proof of accountability, which raises trust even when individual reviews are critical.",
    image: "/brand/Business_collaboration_photo_202606031843.jpeg",
    imageAlt: "Business collaboration in an office",
    local: true,
    bg: "beige" as const,
    imageLeft: true,
  },
  {
    num: "06",
    title: "Community Impact",
    detail:
      "Verified reviews update the Trust Score and category rankings, then feed back into search and discovery for the next customer.",
    whyItMatters:
      "When every review changes how businesses are discovered, the whole market becomes more transparent over time.",
    image: "/brand/Green%20world.png",
    imageAlt: "Community impact and global trust",
    local: true,
    bg: "white" as const,
    imageLeft: false,
  },
];

export const insideCards = [
  {
    title: "Business Profile Page",
    body:
      "A public profile shows verified reviews, Trust Score, ratings, photos, and business details in one place.",
    image: "/brand/Reputation%20Management.png",
    href: "/for-business",
    linkLabel: "View example →",
  },
  {
    title: "Review Submission",
    body:
      "A guided form captures rating, body, and optional proof of purchase. Every submission flows into verification.",
    image: "/brand/Review%20Form.png",
    href: "/write-review",
    linkLabel: "Write a Review →",
  },
  {
    title: "Business Dashboard",
    body:
      "Owners get a review inbox, response tools, sentiment trends, and the live Trust Score in one workspace.",
    image: "/brand/Dashboard.png",
    href: "/for-business",
    linkLabel: "Tellacity for Business →",
  },
];
