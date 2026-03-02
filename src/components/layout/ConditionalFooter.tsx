"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // Hide footer in business dashboard and widget embeds
  if (pathname?.startsWith("/business/dashboard") || pathname?.startsWith("/widgets")) {
    return null;
  }

  return <Footer />;
}
