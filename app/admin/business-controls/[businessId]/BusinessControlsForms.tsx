"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import AdminTableShell from "@/components/admin/AdminTableShell";
import type { PlanKey } from "@/lib/plans";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

function SubmitButton({
  label,
  pendingLabel,
  className,
}: {
  label: string;
  pendingLabel: string;
  className: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : label}
    </button>
  );
}

type Props = {
  businessId: string;
  currentPlan: PlanKey;
  updatePlanAction: (formData: FormData) => Promise<void>;
  addBonusInvitesAction: (formData: FormData) => Promise<void>;
  addBonusArticlesAction: (formData: FormData) => Promise<void>;
};

export default function BusinessControlsForms({
  businessId,
  currentPlan,
  updatePlanAction,
  addBonusInvitesAction,
  addBonusArticlesAction,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lastRefreshedSuccess = useRef<string | null>(null);
  const success = searchParams.get("s");

  useEffect(() => {
    if (!success) return;
    if (lastRefreshedSuccess.current === success) return;
    lastRefreshedSuccess.current = success;
    router.refresh();
  }, [success, router]);

  const handleResetBonus = async () => {
    const supabase = supabaseBrowser();
    const { error } = await supabase.rpc("admin_reset_bonus_invites", {
      p_business_id: businessId,
    });

    if (error) {
      console.error(error);
      alert("Failed to reset bonus invites");
      return;
    }

    window.location.reload();
  };

  return (
    <>
      <AdminTableShell title="Plan Control">
        <form
          action={updatePlanAction}
          onSubmit={(event) => {
            if (!window.confirm("Update this business plan?")) {
              event.preventDefault();
            }
          }}
          className="space-y-3 p-4"
        >
          <input type="hidden" name="business_id" value={businessId} />
          <label className="block text-xs font-medium uppercase text-neutral-500" htmlFor="plan_code">
            Plan
          </label>
          <select name="plan_code" required defaultValue={currentPlan}>
            <option value="free">Free</option>
            <option value="grow">Grow</option>
            <option value="premium">Premium</option>
            <option value="elite">Elite</option>
          </select>
          <div>
            <SubmitButton
              label="Update Plan"
              pendingLabel="Updating..."
              className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </form>
      </AdminTableShell>

      <AdminTableShell title="Bonus Invites">
        <form
          action={addBonusInvitesAction}
          onSubmit={(event) => {
            if (!window.confirm("Add bonus invites for this business?")) {
              event.preventDefault();
            }
          }}
          className="space-y-3 p-4"
        >
          <input type="hidden" name="business_id" value={businessId} />
          <div>
            <label className="block text-xs font-medium uppercase text-neutral-500" htmlFor="amount">
              Number of invites
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              min={1}
              step={1}
              required
              className="mt-1 w-full max-w-xs rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase text-neutral-500" htmlFor="reason">
              Reason
            </label>
            <input
              id="reason"
              name="reason"
              type="text"
              required
              placeholder="e.g. goodwill adjustment"
              className="mt-1 w-full max-w-xl rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
            />
          </div>
          <div>
            <SubmitButton
              label="Add Bonus Invites"
              pendingLabel="Adding..."
              className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
          <div>
            <button
              type="button"
              onClick={() => {
                if (!window.confirm("Reset all bonus invites for this business?")) return;
                void handleResetBonus();
              }}
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              Reset Bonus Invites
            </button>
          </div>
        </form>
      </AdminTableShell>

      <AdminTableShell title="Bonus Articles">
        <form
          action={addBonusArticlesAction}
          onSubmit={(event) => {
            if (!window.confirm("Add bonus articles for this business?")) {
              event.preventDefault();
            }
          }}
          className="space-y-3 p-4"
        >
          <input type="hidden" name="business_id" value={businessId} />
          <div>
            <label className="block text-xs font-medium uppercase text-neutral-500" htmlFor="article_amount">
              Number of articles
            </label>
            <input
              id="article_amount"
              name="amount"
              type="number"
              min={1}
              step={1}
              required
              className="mt-1 w-full max-w-xs rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase text-neutral-500" htmlFor="article_reason">
              Reason
            </label>
            <input
              id="article_reason"
              name="reason"
              type="text"
              placeholder="e.g. goodwill adjustment"
              className="mt-1 w-full max-w-xl rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
            />
          </div>
          <div>
            <SubmitButton
              label="Add Bonus Articles"
              pendingLabel="Adding..."
              className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
          <div>
            <button
              type="button"
              onClick={async () => {
                if (!window.confirm("Reset all bonus articles for this business?")) return;
                const supabase = supabaseBrowser();
                const { error } = await supabase.rpc("admin_reset_bonus_articles", {
                  p_business_id: businessId,
                });
                if (error) {
                  alert("Failed to reset bonus articles");
                  return;
                }
                window.location.reload();
              }}
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              Reset Bonus Articles
            </button>
          </div>
        </form>
      </AdminTableShell>
    </>
  );
}
