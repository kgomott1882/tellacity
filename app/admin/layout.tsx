import type { ReactNode } from "react";
import { requireAdminSession } from "@/components/admin/RequireAdmin";
import AdminShell from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { email } = await requireAdminSession();

  return <AdminShell userEmail={email}>{children}</AdminShell>;
}
