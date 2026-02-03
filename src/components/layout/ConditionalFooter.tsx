"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // Hide footer when in business dashboard
  if (pathname?.startsWith("/business/dashboard")) {
    return null;
  }

  return <Footer />;
}
