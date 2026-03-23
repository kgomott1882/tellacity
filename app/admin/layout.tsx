import type { ReactNode } from "react";
import { requireAdminSession } from "@/components/admin/RequireAdmin";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { email } = await requireAdminSession();

  return (
    <div className="flex min-h-screen bg-neutral-100 text-neutral-900">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader userEmail={email} />
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </div>
    </div>
  );
}
