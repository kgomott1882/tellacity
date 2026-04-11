import { redirect } from "next/navigation";
import type { PaidPlanKey } from "@/lib/billingPlanConfirm";
import {
  getPlanConfirmPresentation,
  isPaidPlanForConfirm,
  parseBillingCycleQuery,
  parseBillingPlanQuery,
} from "@/lib/billingPlanConfirm";
import { resolvePaystackChargeDetails } from "@/lib/billingPaystack";
import BillingCheckoutClient from "./BillingCheckoutClient";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BillingCheckoutPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const plan = parseBillingPlanQuery(sp.plan);
  const cycle = parseBillingCycleQuery(sp.cycle);

  if (!plan || !isPaidPlanForConfirm(plan)) {
    redirect("/business/dashboard/billing");
  }

  const presentation = getPlanConfirmPresentation(plan, cycle);
  if (!presentation) {
    redirect("/business/dashboard/billing");
  }

  const chargePreview = await resolvePaystackChargeDetails(plan as PaidPlanKey, cycle);

  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-lg flex-col justify-center px-4 py-10">
      <BillingCheckoutClient
        plan={plan}
        cycle={cycle}
        presentation={presentation}
        chargePreview={chargePreview}
      />
    </div>
  );
}
