import { redirect } from "next/navigation";
import {
  getPlanConfirmPresentation,
  isPaidPlanForConfirm,
  parseBillingCycleQuery,
  parseBillingPlanQuery,
} from "@/lib/billingPlanConfirm";
import UpgradeCheckoutCard from "./UpgradeCheckoutCard";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Only allow returnTo values that stay inside the dashboard. Anything else is
 * ignored so we never bounce the user to an off-site URL after cancelling
 * checkout.
 */
function sanitizeReturnTo(raw: unknown): string | null {
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (typeof s !== "string") return null;
  const trimmed = s.trim();
  if (!trimmed.startsWith("/business/dashboard/")) return null;
  if (trimmed.includes("..") || trimmed.includes("//")) return null;
  return trimmed;
}

export default async function BillingCheckoutPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const plan = parseBillingPlanQuery(sp.plan);
  const cycle = parseBillingCycleQuery(sp.cycle);
  const returnTo = sanitizeReturnTo(sp.returnTo);

  if (!plan || !isPaidPlanForConfirm(plan)) {
    redirect("/business/dashboard/billing");
  }

  const presentation = getPlanConfirmPresentation(plan, cycle);
  if (!presentation) {
    redirect("/business/dashboard/billing");
  }

  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-lg flex-col justify-center px-4 py-10">
      <UpgradeCheckoutCard
        plan={plan}
        cycle={cycle}
        presentation={presentation}
        returnTo={returnTo}
      />
    </div>
  );
}
