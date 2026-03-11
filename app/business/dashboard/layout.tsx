"use client";

import DashboardShell from "./_components/DashboardShell";

export default function BusinessDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
