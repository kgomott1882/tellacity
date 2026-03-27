"use client";

import { useState } from "react";

type Props = {
  userId: string;
};

export default function AdminDeleteUserButton({ userId }: Props) {
  const [pending, setPending] = useState(false);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    setPending(true);
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string; success?: boolean };
      if (!res.ok || !payload.success) {
        alert(payload.error ?? "Failed to delete user.");
        return;
      }
      window.location.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete user.";
      alert(message);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void handleDelete(userId)}
      className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
    >
      {pending ? "…" : "Delete"}
    </button>
  );
}
