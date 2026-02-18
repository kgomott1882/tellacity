import { Suspense } from "react";
import HelpCenterContent from "./HelpCenterContent";

export const dynamic = "force-dynamic";

export default function HelpCenterPage() {
  return (
    <Suspense fallback={null}>
      <HelpCenterContent />
    </Suspense>
  );
}
