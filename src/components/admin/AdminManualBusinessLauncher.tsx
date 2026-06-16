"use client";

import { useState } from "react";
import AdminManualBusinessModal from "@/components/admin/AdminManualBusinessModal";

export default function AdminManualBusinessLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-[#124541] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0f3834]"
      >
        Add business
      </button>
      <AdminManualBusinessModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
