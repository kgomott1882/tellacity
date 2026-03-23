"use client";

import { useTransition } from "react";

type AdminDangerButtonProps = {
  label: string;
  confirmMessage: string;
  disabled?: boolean;
  action: () => Promise<void>;
};

/**
 * Client-only control: confirms then runs an async action (typically a server action).
 */
export default function AdminDangerButton({
  label,
  confirmMessage,
  disabled,
  action,
}: AdminDangerButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={() => {
        if (!confirm(confirmMessage)) return;
        startTransition(() => {
          void action();
        });
      }}
      className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
    >
      {pending ? "…" : label}
    </button>
  );
}
