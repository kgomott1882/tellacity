import SolutionPageLayout, {
  type SolutionPageContent,
} from "@/components/solutions/SolutionPageLayout";

export const metadata = {
  title: "Photo Uploads for Verified Visual Feedback | Tellacity",
  description:
    "Turn customer photos into verified visual proof with structured feedback, product attribution, and automated moderation. Show real customer experiences to build trust and improve SEO. Start free.",
  alternates: {
    canonical: "https://tellacity.com/solutions/photo-uploads",
  },
  openGraph: {
    title: "Photo Uploads for Verified Visual Feedback | Tellacity",
    description:
      "Turn customer photos into verified visual proof with structured feedback, product attribution, and automated moderation. Show real customer experiences to build trust and improve SEO.",
    url: "https://tellacity.com/solutions/photo-uploads",
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Photo Uploads for Verified Visual Feedback | Tellacity",
    description:
      "Verified, moderated photo uploads with product attribution and ImageObject schema for SEO-ready visual proof.",
  },
};

const content: SolutionPageContent = {
  kicker: "Photo Uploads",
  headline: {
    lead: "Photo Uploads for",
    accent: "Verified Visual Feedback",
  },
  valueProp:
    "Tellacity combines verified customer photos, structured review content, product attribution, threaded follow-ups, and moderation systems into one unified visual feedback workflow. Capture authentic customer experiences at the moment they happen, then transform them into trusted public proof, actionable operational insights, and richer reputation signals across your business profile.",
  primaryCta: { label: "Start free", href: "/business/signup" },
  secondaryCta: { label: "Open dashboard", href: "/business/dashboard" },
  heroImage: {
    src: "/brand/Gallery%20Photos.png",
    alt: "Tellacity verified review photo gallery on a business profile",
  },

  heroTrustStrip: [
    "Verified customer uploads",
    "Automatic moderation workflows",
    "Structured feedback capture",
    "Product-level attribution",
    "SEO-ready visual proof",
  ],

  problemSectionKicker: "The challenge",
  problemSectionTitle: "Why most teams struggle with visual feedback",
  problemSectionDescription:
    "Verified visual feedback only builds trust when uploads, structured reviews, product attribution, and moderation all live in one centralised system. Without that, the same operational blind spots keep showing up where buyer confidence is decided.",

  problems: [
    {
      icon: "📝",
      title: "Text-only reviews leave doubt",
      description:
        "Without visual proof, prospective customers wonder whether a review reflects reality. Photos turn a paragraph of text into something a buyer can verify with their own eyes.",
    },
    {
      icon: "⭐",
      title: "Star ratings hide what's actually going on",
      description:
        "A 4.2 average can mean almost everyone is happy, or that you have very polarised customers. Without structured content behind the score, you can't tell the difference.",
    },
    {
      icon: "📭",
      title: "Great photos and product-level signal get lost",
      description:
        "Customers send brilliant photos by email, WhatsApp, and DM, and product-specific feedback gets buried under business-level scores. Almost none of it ever reaches your public profile.",
    },
    {
      icon: "📷",
      title: "Customers trust visuals more than text alone",
      description:
        "Modern buyers increasingly rely on visual proof before making decisions. Text-only reviews often lack the credibility customers need to feel confident.",
    },
    {
      icon: "🧷",
      title: "Valuable customer content stays fragmented",
      description:
        "Photos, screenshots, videos, and customer feedback are often scattered across emails, social media, messaging apps, and support tickets instead of centralised in one review system.",
    },
    {
      icon: "🗃️",
      title: "Businesses struggle to organise visual feedback",
      description:
        "Without structured attribution and moderation workflows, businesses cannot reliably connect customer photos to products, services, locations, or operational issues.",
    },
    {
      icon: "🚫",
      title: "Unmoderated uploads create trust risks",
      description:
        "Without moderation systems, visual uploads can introduce spam, abuse, privacy issues, and off-policy content into public business profiles.",
    },
  ],

  solution: {
    title: "How Tellacity turns photos into structured visual proof",
    description:
      "Every Tellacity review is a structured record with a title, body, rating, optional product attribution, and EXIF-stripped customer photos that pass automated moderation. Customers prove what happened, your team gets ready-to-act feedback, and everything publishes straight to your verified business profile.",
    bullets: [
      "Multiple photos per review with drag-and-drop on web and mobile.",
      "Title, full body, rating, and optional product or service attribution.",
      "Automatic compression, EXIF stripping, NSFW and policy moderation.",
      "Approved photos surface in a clean gallery on your verified profile.",
      "Owner replies and threaded follow-ups, with a full audit log.",
      "Photos count toward your trust score and feed image SEO for richer Google snippets.",
    ],
    screenshot: {
      src: "/brand/Products%20Photos.png",
      alt: "Verified customer photos attached to Tellacity product reviews",
    },
  },

  workflow: {
    kicker: "How the visual review system works",
    title: "How the visual review system works",
    description:
      "Visual reviews on Tellacity are not loose attachments. They move through a documented operational pipeline from submission to publication, with verification, moderation, product attribution, and reputation reporting at every stage.",
    steps: [
      {
        icon: "📝",
        title: "Customer submits review",
        description:
          "Verified customers complete a structured review form (title, body, rating, optional product, and photos) from web or mobile. A structured form is what makes the feedback easy to search, slice, and report on later.",
      },
      {
        icon: "📷",
        title: "Photos uploaded & verified",
        description:
          "Uploads are tied to the customer account, with EXIF and GPS metadata stripped and originating device fingerprints checked. Verified uploads tied to real accounts are what make visual proof defensible against fraud.",
      },
      {
        icon: "🛡",
        title: "Automated moderation runs",
        description:
          "Every photo passes through NSFW, malware, size, format, duplicate, and policy checks before it can be published. EXIF-stripped, moderated uploads help Google and LLMs see your images as safe, trustworthy, and product-relevant.",
      },
      {
        icon: "🛒",
        title: "Review linked to product/service",
        description:
          "Reviews are attributed to the right product, service, location, or branch so visual proof is searchable and actionable. Product attribution is what turns a generic photo into a buying-decision asset for the right SKU.",
      },
      {
        icon: "✅",
        title: "Approved content published",
        description:
          "Cleared photos publish to your verified business profile gallery and into widgets, with the review thread fully intact. Published, threaded visual reviews are what build cumulative social proof across every touchpoint.",
      },
      {
        icon: "📊",
        title: "Analytics & reputation signals updated",
        description:
          "Every approved upload flows into reputation analytics and SEO-ready ImageObject schema for richer search snippets. Structured image schema is what makes your visual reputation citable for both search engines and AI systems.",
      },
    ],
  },

  featuresSectionKicker: "Built into the dashboard",
  featuresSectionTitle: "Key visual feedback features at a glance",
  featuresSectionDescription:
    "Every capability below is part of the live Tellacity business dashboard and is available the moment you claim your profile. Built for centralised visual reputation across verified uploads, product attribution, moderated images, and SEO-friendly ImageObject schema.",

  featuresImage: {
    src: "/brand/Multimedia%20Hub.jpeg",
    alt: "Tellacity photo uploads workspace with multi-photo review submissions, moderation, and product attribution",
  },

  features: [
    {
      badge: "📷",
      title: "Multi-photo uploads",
      description:
        "Customers can attach several photos per review from any device, with drag-and-drop on web and a native picker on mobile.",
    },
    {
      badge: "📝",
      title: "Structured feedback",
      description:
        "Title, body, rating, and metadata captured in a consistent shape across every channel, so reviews are easy to search and slice.",
    },
    {
      badge: "🛒",
      title: "Product attribution",
      description:
        "Link reviews to specific products, services, or locations so you can analyse performance per SKU or branch.",
    },
    {
      badge: "🛡",
      title: "Automated moderation",
      description:
        "Every upload runs through NSFW, size, format, and policy checks before it goes live. Flagged photos land in your queue, not on your profile.",
    },
    {
      badge: "🔒",
      title: "Privacy-safe by default",
      description:
        "EXIF metadata is stripped on upload. We never expose customer device details, GPS coordinates, or hidden camera information.",
    },
    {
      badge: "🔁",
      title: "Threaded follow-ups",
      description:
        "Owner replies and customer responses live in the same thread with a timestamped audit log, so context is never lost.",
    },
    {
      badge: "🖼",
      title: "Product & service galleries",
      description:
        "Display customer photos by product, service, category, or location across your business profile.",
    },
    {
      badge: "🔗",
      title: "Review-linked media",
      description:
        "Every uploaded photo remains attached to the originating review for transparency and auditability.",
    },
    {
      badge: "📥",
      title: "Moderation queues",
      description:
        "Flagged uploads automatically enter moderation workflows before appearing publicly.",
    },
    {
      badge: "📈",
      title: "Media analytics",
      description:
        "Track which products, services, and experiences generate the most visual engagement.",
    },
    {
      badge: "📱",
      title: "Multi-device uploads",
      description:
        "Support drag-and-drop uploads on desktop and native media selection on mobile.",
    },
    {
      badge: "🔍",
      title: "Visual reputation insights",
      description:
        "Identify recurring customer issues, product defects, or standout experiences through visual review patterns.",
    },
    {
      badge: "🏗",
      title: "Centralised media management",
      description:
        "Manage uploads, visibility, moderation, and attribution from one operational dashboard.",
    },
    {
      badge: "🚨",
      title: "Review integrity protections",
      description:
        "Detect suspicious uploads, duplicate media, policy violations, and abuse signals before publication.",
    },
  ],

  verifiedTrust: {
    kicker: "Why verified visual feedback matters",
    title: "Why verified visual feedback matters",
    description:
      "Verified uploads are what turn customer photos into authentic, search-friendly proof rather than anonymous attachments. Moderated images are what make those photos trustworthy and policy-compliant before they ever reach a public profile. And ImageObject schema with descriptive alt text is what turns visual feedback into richer image snippets and AI-citable content.",
    bullets: [
      "Verified customer uploads tied to authenticated accounts.",
      "Moderated visual content cleared before it appears publicly.",
      "Product-level proof anchored to the right SKU or service.",
      "Structured review records with consistent metadata across channels.",
      "Customer authenticity signals from device, account, and behaviour.",
      "SEO-friendly image content with ImageObject schema and alt text.",
    ],
    surface: "media",
  },

  trust: {
    title: "Built for scale: Visual review infrastructure at scale",
    description:
      "From single storefronts to multi-location brands, Tellacity Photo Uploads support high-volume verified visual review collection without sacrificing moderation quality, customer privacy, or operational visibility. Every EXIF-stripped, product-attributed upload feeds the same centralised visual reputation pipeline.",
    stats: [
      { value: "Verified", label: "Reviewer & photo origin" },
      { value: "Auto-moderated", label: "Before publish" },
      { value: "Structured", label: "Per-product feedback" },
      { value: "600K+", label: "Active business profiles" },
      { value: "EXIF-stripped", label: "On every upload" },
    ],
  },

  controlPlane: {
    kicker: "One structured feedback system",
    title: "One structured feedback system: Every photo, every review",
    description:
      "Every Tellacity photo upload becomes part of a structured review system designed for moderation, transparency, analytics, and long-term customer trust, not a stand-alone attachment. One centralised system means every photo carries the same schema, attribution, and policy controls.",
    tagline: "One system. Every visual review.",
    capabilities: [
      {
        icon: "🧾",
        title: "Unified visual feedback",
        description:
          "All customer media flows into one operational system with consistent schema, attribution, and moderation.",
      },
      {
        icon: "🛒",
        title: "Product attribution",
        description:
          "Every photo is tied to a product, service, location, or branch so visual proof stays searchable and actionable.",
      },
      {
        icon: "🛡",
        title: "Moderation consistency",
        description:
          "The same policies, signals, and review workflows apply to every upload across every team and surface.",
      },
      {
        icon: "🏗",
        title: "Centralised uploads",
        description:
          "One dashboard handles uploads, visibility, moderation, and attribution across the entire business.",
      },
      {
        icon: "📐",
        title: "Structured review schema",
        description:
          "Title, body, rating, attribution, and media live in one consistent record that is easy to search, slice, and report.",
      },
      {
        icon: "💬",
        title: "Threaded conversations",
        description:
          "Owner replies and customer follow-ups stay attached to the originating review with a full audit log.",
      },
      {
        icon: "🔄",
        title: "Synchronised reputation workflows",
        description:
          "Visual reviews feed analytics, widgets, and reputation dashboards from the same dataset, one source of truth.",
      },
    ],
  },

  decisions: {
    kicker: "Designed for customer trust",
    title: "Designed for customer trust",
    description:
      "Customers trust experiences they can actually see. Tellacity visual reviews replace generic testimonials with verified, moderated, product-attributed customer proof, the kind of evidence buyers actually act on.",
    items: [
      {
        icon: "🖼",
        title: "Build visual trust",
        description:
          "Verified customer photos give buyers something they can recognise, compare, and act on with confidence.",
      },
      {
        icon: "🪟",
        title: "Reduce buyer uncertainty",
        description:
          "Real photos answer the questions a paragraph of text can't, helping customers commit faster.",
      },
      {
        icon: "👁",
        title: "Surface authentic experiences",
        description:
          "Structured uploads keep great customer experiences visible to future buyers, not buried in inboxes.",
      },
      {
        icon: "📐",
        title: "Improve transparency",
        description:
          "Moderation records, verified accounts, and audit trails make trust legible to customers and teams.",
      },
      {
        icon: "📣",
        title: "Strengthen social proof",
        description:
          "Visual reviews carry more weight in widgets, social sharing, and search snippets than star ratings alone.",
      },
      {
        icon: "🧾",
        title: "Capture richer customer feedback",
        description:
          "Photos, structured fields, and threaded replies turn each review into a source of operational insight.",
      },
      {
        icon: "✅",
        title: "Increase review credibility",
        description:
          "Verified uploads, EXIF stripping, and moderation signals make every review more believable by default.",
      },
    ],
  },

  teams: {
    kicker: "Designed for modern teams",
    title: "Designed for modern teams",
    description:
      "Tellacity Photo Uploads isn't just a feature for marketing. Support, operations, marketing, leadership, moderation, and product teams all work from the same centralised, structured visual feedback dataset.",
    audiences: [
      {
        icon: "🛠",
        audience: "Support teams",
        value:
          "Identify customer issues through visual evidence instead of long back-and-forth descriptions.",
      },
      {
        icon: "🏢",
        audience: "Operations teams",
        value:
          "Monitor recurring product or service problems surfaced by repeated customer photos.",
      },
      {
        icon: "📣",
        audience: "Marketing teams",
        value:
          "Surface authentic customer proof across campaigns, widgets, and social touchpoints.",
      },
      {
        icon: "🎯",
        audience: "Leadership teams",
        value:
          "Understand customer satisfaction beyond star ratings with real visual context.",
      },
      {
        icon: "🚓",
        audience: "Moderation teams",
        value:
          "Review flagged uploads, policy violations, and abuse signals in one operational queue.",
      },
      {
        icon: "🧪",
        audience: "Product teams",
        value:
          "Analyse customer-uploaded product experiences across SKUs, releases, and customer cohorts.",
      },
    ],
  },

  outcomes: {
    kicker: "More than photo uploads",
    title: "More than photo uploads: Structured visual reputation",
    description:
      "Tellacity Photo Uploads transforms customer media from scattered attachments into structured visual reputation infrastructure that is measurable, defensible, and aligned across the business. Verified, moderated, product-attributed photos compound into long-term, SEO-friendly trust signals.",
    items: [
      {
        icon: "🛡",
        title: "Strengthen customer trust",
        description:
          "Verified, moderated, product-attributed photos compound into a stronger and more credible public reputation.",
      },
      {
        icon: "🔍",
        title: "Improve product transparency",
        description:
          "Customers see real experiences for the real product, not stock imagery or generic testimonials.",
      },
      {
        icon: "🧾",
        title: "Capture richer customer feedback",
        description:
          "Structured fields, threaded replies, and visual proof turn every review into operational insight.",
      },
      {
        icon: "🏗",
        title: "Centralise visual reputation signals",
        description:
          "All customer media flows into one dashboard with consistent attribution and audit trails.",
      },
      {
        icon: "🪪",
        title: "Reduce fake review concerns",
        description:
          "Verified uploads, EXIF stripping, duplicate detection, and account checks raise the bar for trust.",
      },
      {
        icon: "🔎",
        title: "Improve SEO visibility",
        description:
          "ImageObject schema and structured review records help Google show richer image snippets for your business.",
      },
      {
        icon: "⚠️",
        title: "Identify operational problems faster",
        description:
          "Visual patterns surface product defects, service inconsistencies, and customer experience gaps.",
      },
      {
        icon: "🌟",
        title: "Surface authentic customer experiences",
        description:
          "Real moments stay visible to future buyers, turning customer satisfaction into long-term proof.",
      },
    ],
  },

  related: [
    {
      title: "Review Invitations",
      href: "/solutions/review-invitations",
      description:
        "Prompt customers to attach photos and structured feedback at the moment they review.",
    },
    {
      title: "Review Widgets",
      href: "/solutions/review-widgets",
      description:
        "Show photo-rich, structured reviews on your website, not just star ratings.",
    },
    {
      title: "Business Analytics",
      href: "/solutions/business-analytics",
      description:
        "Slice feedback by product, channel, country, and rating to find what to fix next.",
    },
    {
      title: "Reputation Management",
      href: "/solutions/reputation-management",
      description:
        "Reply, hide, or escalate any flagged photo or review from one queue.",
    },
  ],

  faqSectionTitle: "Common questions about photo uploads",
  faqSectionDescription:
    "Short answers to the most common questions about Tellacity's verified, moderated photo uploads and how they turn customer images into structured visual reputation.",

  faqs: [
    {
      question: "What types of photos can customers upload?",
      answer:
        "JPEG, PNG, and WEBP up to a configurable size limit. HEIC photos from iOS are auto-converted on upload, so customers don't have to think about formats.",
    },
    {
      question: "How are uploaded photos moderated?",
      answer:
        "Every photo runs through automated NSFW, malware, size, format, and policy checks before publishing. Anything flagged is held in your moderation queue, not on your profile.",
    },
    {
      question: "Is customer EXIF and GPS data stripped from photos?",
      answer:
        "Yes. EXIF and GPS metadata are removed during upload, so customer device details, camera information, and location data are never exposed on your profile or in widgets.",
    },
    {
      question: "Where do approved photos appear?",
      answer:
        "Photos appear on the customer's review, in the gallery on your verified business profile, and inside any Tellacity widget embedded on your own website.",
    },
    {
      question: "Can I hide or remove a photo as the business owner?",
      answer:
        "Yes. From your dashboard you can hide, delete, or report any photo. Every action is timestamped and attributable in the moderation audit log.",
    },
    {
      question: "Do photos affect SEO?",
      answer:
        "Yes. Approved photos populate ImageObject schema on review and profile pages, which helps Google show richer image snippets and image search results for your business.",
    },
    {
      question: "Can customers upload multiple photos per review?",
      answer:
        "Yes. Each review supports multiple photo attachments, with drag-and-drop on the web and a native picker on mobile. All uploads are tied to the originating review.",
    },
    {
      question: "Are uploaded photos linked to specific products or services?",
      answer:
        "Yes. When a review is attributed to a product, service, location, or branch, every photo attached to that review carries the same attribution and shows up in the right gallery.",
    },
    {
      question: "How does Tellacity moderate visual uploads?",
      answer:
        "Automated NSFW, malware, size, format, duplicate, and policy checks run on every upload. Flagged photos enter a moderation queue, where teams can approve, hide, or remove them.",
    },
    {
      question: "Can businesses manage photo visibility?",
      answer:
        "Yes. Business owners can hide, delete, or report any photo from the dashboard. Every visibility change is logged with a timestamp and the user who applied it.",
    },
    {
      question: "Are customer uploads verified?",
      answer:
        "Yes. Uploads are tied to verified customer accounts and authenticated review submissions, with device and behavioural signals used to detect suspicious activity.",
    },
    {
      question: "Does Tellacity remove EXIF and GPS metadata?",
      answer:
        "Yes. EXIF, GPS, and other embedded metadata are stripped during upload so customer device details and location data are never exposed publicly.",
    },
    {
      question: "Can photos improve SEO visibility?",
      answer:
        "Yes. Approved photos generate ImageObject structured data attached to review and profile pages, helping search engines surface richer image snippets and image search results.",
    },
    {
      question: "Can teams moderate uploads collaboratively?",
      answer:
        "Yes. Invite Admins, Managers, and Viewers with role-based permissions. Every approval, hide, removal, and policy decision is attributable in the audit log.",
    },
    {
      question: "Are uploads mobile-friendly?",
      answer:
        "Yes. Customers can attach photos directly from a phone's camera or photo library through the native picker, with automatic compression and format conversion.",
    },
    {
      question: "Can businesses analyse visual feedback trends?",
      answer:
        "Yes. Media analytics surface which products, services, locations, and experiences generate the most visual engagement and where recurring issues appear in customer photos.",
    },
  ],
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Tellacity Photo Uploads",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Capture verified customer photos, product-attributed reviews, and moderated visual feedback that feed into Google image snippets, widgets, and analytics.",
  brand: { "@type": "Organization", name: "Tellacity" },
  url: "https://tellacity.com/solutions/photo-uploads",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    url: "https://tellacity.com/business/signup",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
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
      name: "Solutions",
      item: "https://tellacity.com/solutions",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Photo Uploads",
      item: "https://tellacity.com/solutions/photo-uploads",
    },
  ],
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How Tellacity turns customer photos into structured visual feedback",
  description:
    "Tellacity Photo Uploads processes every customer photo through a six-stage operational lifecycle: submission, verification, moderation, attribution, publication, and reputation reporting.",
  totalTime: "PT5M",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Customer submits review",
      text: "Verified customers complete a structured review form with title, body, rating, optional product attribution, and photos from web or mobile.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Photos uploaded and verified",
      text: "Uploads are tied to the customer account. EXIF and GPS metadata are stripped and device fingerprints are checked.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Automated moderation runs",
      text: "Every photo passes through NSFW, malware, size, format, duplicate, and policy checks before publication.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Review linked to product or service",
      text: "Reviews and photos are attributed to the right product, service, location, or branch for analytics and search.",
    },
    {
      "@type": "HowToStep",
      position: 5,
      name: "Approved content published",
      text: "Cleared photos publish to the verified business profile gallery and into website widgets with the review thread intact.",
    },
    {
      "@type": "HowToStep",
      position: 6,
      name: "Analytics and reputation signals updated",
      text: "Every approved upload flows into reputation analytics and SEO-ready ImageObject schema for richer search snippets.",
    },
  ],
};

export default function PhotoUploadsSolutionPage() {
  return (
    <SolutionPageLayout
      content={content}
      jsonLd={
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(softwareJsonLd),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(breadcrumbJsonLd),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
          />
        </>
      }
    />
  );
}
