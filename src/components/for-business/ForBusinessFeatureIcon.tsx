import {
  BadgeCheck,
  BarChart2,
  Building2,
  FileText,
  Globe,
  Send,
  Shield,
} from "lucide-react";
import type {
  FeatureAccent,
  FeatureIconType,
} from "@/lib/forBusinessFeatureTypes";

type Props = {
  type: FeatureIconType;
  accent: FeatureAccent;
  className?: string;
};

export default function ForBusinessFeatureIcon({
  type,
  accent,
  className = "",
}: Props) {
  const cls = "h-4 w-4";
  const icon =
    type === "send" ? (
      <Send className={cls} aria-hidden />
    ) : type === "badgeCheck" ? (
      <BadgeCheck className={cls} aria-hidden />
    ) : type === "shield" ? (
      <Shield className={cls} aria-hidden />
    ) : type === "globe" ? (
      <Globe className={cls} aria-hidden />
    ) : type === "barChart2" ? (
      <BarChart2 className={cls} aria-hidden />
    ) : type === "fileText" ? (
      <FileText className={cls} aria-hidden />
    ) : (
      <Building2 className={cls} aria-hidden />
    );

  return (
    <span
      className={`fb-feature-icon ${accent === "teal" ? "fb-feature-icon--teal" : "fb-feature-icon--forest"} ${className}`.trim()}
    >
      {icon}
    </span>
  );
}
