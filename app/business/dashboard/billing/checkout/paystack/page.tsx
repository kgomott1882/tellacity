import { redirect } from "next/navigation";
import {
  getPlanConfirmPresentation,
  isPaidPlanForConfirm,
  parseBillingCycleQuery,
  parseBillingPlanQuery,
  type PaidPlanKey,
} from "@/lib/billingPlanConfirm";
import {
  billingCheckoutPickerPath,
  sanitizeBillingReturnTo,
} from "@/lib/billingCheckoutPaths";
import UpgradeCheckoutCard from "../UpgradeCheckoutCard";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BillingCheckoutPaystackPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const plan = parseBillingPlanQuery(sp.plan);
  const cycle = parseBillingCycleQuery(sp.cycle);
  const returnTo = sanitizeBillingReturnTo(sp.returnTo);

  if (!plan || !isPaidPlanForConfirm(plan)) {
    redirect("/business/dashboard/billing");
  }

  const presentation = getPlanConfirmPresentation(plan, cycle);
  if (!presentation) {
    redirect("/business/dashboard/billing");
  }

  const backHref = billingCheckoutPickerPath(plan as PaidPlanKey, cycle, returnTo);

  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-lg flex-col justify-center px-4 py-10">
      <UpgradeCheckoutCard
        plan={plan}
        cycle={cycle}
        presentation={presentation}
        returnTo={returnTo}
        backHref={backHref}
      />
    </div>
  );
}
