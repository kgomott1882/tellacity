import Link from "next/link";
import { redirect } from "next/navigation";
import type { PaidPlanKey } from "@/lib/billingPlanConfirm";
import {
  getPlanConfirmPresentation,
  isPaidPlanForConfirm,
  parseBillingCycleQuery,
  parseBillingPlanQuery,
} from "@/lib/billingPlanConfirm";
import ContinueToPaymentButton from "./ContinueToPaymentButton";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ConfirmPlanPage({ searchParams }: PageProps) {
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

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-emerald-100/80 bg-white p-8 shadow-[0_8px_30px_-12px_rgba(18,69,65,0.12)]">
        <p className="text-center text-xs font-medium uppercase tracking-wide text-emerald-800/80">
          Confirm your plan
        </p>
        <h1 className="mt-2 text-center text-2xl font-semibold capitalize tracking-tight text-[#0E0E0E]">
          {presentation.title}
        </h1>
        <p className="mt-4 text-center text-3xl font-semibold text-[#124541]">
          {presentation.priceLine}
        </p>
        {presentation.priceSubLine ? (
          <p className="mt-2 text-center text-sm leading-snug text-gray-600">
            {presentation.priceSubLine}
          </p>
        ) : null}
        <div className="mt-8 border-t border-gray-100 pt-6">
          <p className="text-sm font-medium text-gray-700">Includes</p>
          <ul className="mt-3 space-y-2.5 text-sm text-gray-600">
            {presentation.bullets.map((line) => (
              <li key={line} className="flex gap-2">
                <span
                  className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700"
                  aria-hidden
                >
                  ✓
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <ContinueToPaymentButton plan={plan} cycle={cycle} />
        <Link
          href="/business/dashboard/billing"
          className="mt-4 block text-center text-sm text-gray-500 underline-offset-2 hover:text-gray-800 hover:underline"
        >
          Back to plans
        </Link>
      </div>
    </div>
  );
}
