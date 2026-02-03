"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Hide navbar when in business dashboard
  if (pathname?.startsWith("/business/dashboard")) {
    return null;
  }

  return <Navbar />;
}
