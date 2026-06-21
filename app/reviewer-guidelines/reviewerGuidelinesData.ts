function brandImage(filename: string): string {
  return `/brand/${encodeURIComponent(filename)}`;
}

export const RG_IMAGES = {
  rulesCommunity: brandImage("Honest man.jpeg"),
  rulesReview: brandImage("Honest Lady.jpeg"),
  consumerBanner: brandImage("gogo reviewer.jpeg"),
  appeals: brandImage("Apeal Process.png"),
  why: brandImage("Trust Beach.png"),
  dispute: brandImage("Cartoon girl shopping 2.jpeg"),
} as const;

export const corePrinciples = [
  {
    title: "Trust",
    image: brandImage("Build to scale.jpeg"),
    imageAlt: "Team building trust at scale",
    icon: "shield" as const,
    accent: "teal" as const,
    body:
      "We prioritize verified experiences over anonymous noise. Reviews backed by proof carry more weight in rankings, dispute handling, and how readers evaluate a business.",
    extra:
      "Trust is the reason people come to Tellacity instead of relying on unverified claims.",
  },
  {
    title: "Transparency",
    image: brandImage("Asian Apple.png"),
    imageAlt: "Open and clear communication",
    icon: "eye" as const,
    accent: "forest" as const,
    body:
      "Consumers deserve the truth, and businesses deserve to know who is reviewing them. We do not hide negative feedback or sell removed reviews.",
    extra:
      "Moderation decisions are based on visible evidence and documented process, not hidden deals.",
  },
  {
    title: "Fairness",
    image: brandImage("Build Growth.jpeg"),
    imageAlt: "Building fair growth for everyone",
    icon: "scale" as const,
    accent: "teal" as const,
    body:
      "Both sides have a voice. Consumers can share their experiences, and businesses can respond publicly.",
    extra:
      "Moderation is neutral and evidence-based, with the same standards applied whether feedback is positive or negative.",
  },
];

export const generalRules = [
  {
    num: "01",
    title: "Be Honest",
    body:
      "Content must be factually accurate and reflect a genuine first-hand experience. Misleading claims or fabricated events undermine the platform for everyone.",
  },
  {
    num: "02",
    title: "Be Respectful",
    body:
      "We have zero tolerance for hate speech, harassment, discrimination, threats, or obscenity. Strong criticism of a service is allowed; personal attacks are not.",
  },
  {
    num: "03",
    title: "Stay Relevant",
    body:
      "Keep content focused on the consumer experience. Do not use reviews for political rants or personal vendettas unrelated to the business transaction.",
  },
  {
    num: "04",
    title: "Protect Privacy",
    body:
      "Do not post sensitive personal data of others. Reviews should describe your experience without exposing people who did not choose to be public.",
  },
  {
    num: "05",
    title: "No Spam",
    body:
      "Promotional content, repetitive posts, and malicious links are strictly prohibited. Spam dilutes genuine feedback and may result in account action.",
  },
];

export const consumerGuidelines = [
  {
    title: "Provide Proof",
    icon: "receipt" as const,
    accent: "teal" as const,
    tag: "Recommended",
    tagStyle: "teal" as const,
    body:
      "Upload receipts, invoices, or booking confirmations. Verified reviews are trusted more and are harder to dispute.",
  },
  {
    title: "Write Detailed Reviews",
    icon: "fileText" as const,
    accent: "forest" as const,
    tag: "Best Practice",
    tagStyle: "forest" as const,
    body:
      "Explain why you liked or disliked the service. Specific details about what happened help others compare options with context.",
  },
  {
    title: "One Experience, One Review",
    icon: "checkCircle" as const,
    accent: "teal" as const,
    body:
      "Do not post multiple reviews for a single transaction to manipulate a score. Update your existing review if the situation changes.",
  },
  {
    title: "Conflict of Interest",
    icon: "alertCircle" as const,
    accent: "forest" as const,
    tag: "Important",
    tagStyle: "amber" as const,
    body:
      "You cannot review a business you own, work for, or is a direct competitor. Family members of owners are also restricted.",
  },
];

export const businessGuidelines = [
  {
    title: "Engage Professionally",
    icon: "messageCircle" as const,
    accent: "teal" as const,
    body:
      "Responses should be polite and solution-oriented. Avoid arguments or insulting customers, show you take feedback seriously.",
  },
  {
    title: "No Fake Reviews",
    icon: "xCircle" as const,
    accent: "red" as const,
    tag: "Banning Offense",
    body:
      "Soliciting fake positive reviews or paying for reviews is a banning offense. Asking real customers for honest feedback is encouraged.",
  },
  {
    title: "No Retaliation",
    icon: "shieldOff" as const,
    accent: "red" as const,
    tag: "Zero Tolerance",
    body:
      "You may not threaten, harass, or penalize a customer for leaving a negative review. Retaliation may trigger enforcement beyond the dispute.",
  },
  {
    title: "Employee Reviews",
    icon: "users" as const,
    accent: "forest" as const,
    body:
      "Do not ask employees to write reviews about your business or competitors. Employee reviews are treated as manipulation, not genuine feedback.",
  },
];

export const enforcementActions = [
  {
    title: "Content Removal",
    icon: "trash2" as const,
    color: "#f59e0b",
    body:
      "Reviews or replies breaking rules will be deleted, including spam, threats, fabricated experiences, or privacy violations.",
  },
  {
    title: "Warnings",
    icon: "alertTriangle" as const,
    color: "#f97316",
    body:
      "Users or businesses may receive formal warnings when conduct approaches a policy line or repeats after a minor issue.",
  },
  {
    title: "Consumer Ban",
    icon: "userX" as const,
    color: "#ef4444",
    body:
      "Repeat offenders may be banned from posting reviews, patterns of fake reviews, harassment, or score manipulation.",
  },
  {
    title: "Business Penalties",
    icon: "building2" as const,
    color: "#dc2626",
    body:
      "Businesses caught manipulating reviews may receive a Consumer Alert badge on their profile or be removed from the platform entirely.",
  },
];

export const appealRules = [
  {
    title: "One appeal only",
    icon: "one" as const,
    body:
      "If your content was removed, or a flag was rejected, you may appeal the decision once. This limit keeps the process fair.",
  },
  {
    title: "New evidence required",
    icon: "fileSearch" as const,
    body:
      "Appeals must include new information or evidence not previously considered. Repeating the same claim without proof will not change the outcome.",
  },
  {
    title: "Final decisions",
    icon: "lock" as const,
    body:
      "Decisions made after an appeal review are final. See the FAQ for common questions about disputes and moderation.",
  },
];

export const relatedPages = [
  {
    title: "How Tellacity Works",
    description: "Verification, moderation, and the six-step trust flow.",
    href: "/how-tellacity-works",
    icon: "settings" as const,
  },
  {
    title: "Safety & Trust",
    description: "Policies that keep reviews fair and defensible.",
    href: "/safety-trust",
    icon: "shield" as const,
  },
  {
    title: "FAQ",
    description: "Common questions about disputes and moderation.",
    href: "/faq",
    icon: "helpCircle" as const,
  },
  {
    title: "Reputation Platform",
    description: "Tools businesses use to act on verified feedback.",
    href: "/for-business",
    icon: "barChart2" as const,
  },
  {
    title: "About Tellacity",
    description: "Mission, values, and why independence matters.",
    href: "/about",
    icon: "info" as const,
  },
];

export const disputeSteps = [
  {
    title: "Flagging",
    icon: "flag" as const,
    body:
      "Community members or businesses can flag content that violates these guidelines. Flags start a review; they do not automatically remove content.",
  },
  {
    title: "Investigation",
    icon: "search" as const,
    body:
      "Our team reviews the flag. For factual disputes we may ask the reviewer for proof. Opinion disputes are not treated the same as claims the reviewer never transacted.",
  },
  {
    title: "Decision",
    icon: "checkSquare" as const,
    outcomes: [
      { text: "Proof provided → review stays", tone: "teal" as const },
      { text: "No proof → may be removed", tone: "amber" as const },
      { text: "Hate speech → removed immediately", tone: "red" as const },
    ],
  },
];
