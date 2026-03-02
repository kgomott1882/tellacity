"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Hide navbar in business dashboard, widget embeds, and public invite page
  if (
    pathname?.startsWith("/business/dashboard") ||
    pathname?.startsWith("/widgets") ||
    pathname === "/review/invite"
  ) {
    return null;
  }

  return <Navbar />;
}
