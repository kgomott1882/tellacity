export type FeatureIconType =
  | "send"
  | "badgeCheck"
  | "shield"
  | "globe"
  | "barChart2"
  | "building2"
  | "fileText";

export type FeatureAccent = "teal" | "forest";

export type FeatureMetric = {
  value: string;
  label: string;
};

export type ForBusinessFeature = {
  slug: string;
  title: string;
  copy: string;
  detail: string;
  image: string;
  icon: FeatureIconType;
  accent: FeatureAccent;
  eyebrow: string;
  metrics: FeatureMetric[];
  outcome: string;
  metaDescription: string;
  lead: string;
  sections: {
    title: string;
    body: string;
    bullets?: string[];
  }[];
  highlights: string[];
  relatedLinks: { href: string; label: string }[];
};
