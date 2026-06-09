"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
} from "lucide-react";
import {
  PAID_PLAN_USD,
  getAnnualTotalDueUsd,
  isPaidPlanForConfirm,
} from "@/lib/billingPlanConfirm";
import { cn } from "@/lib/utils";
import type { PlanKey } from "@/lib/plans";

type Plan = {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlight?: boolean;
};

const CUSTOM_PLAN_GUIDANCE =
  "For organisations with unique volume, integration, or compliance needs beyond standard plan limits.";

function CardsBillingToggle({
  billing,
  onChange,
}: {
  billing: "monthly" | "annual";
  onChange: (mode: "monthly" | "annual") => void;
}) {
  return (
    <div className="pc-toggle-wrap">
      <div className="pc-toggle" role="group" aria-label="Billing period">
        <span
          className={cn("pc-toggle-pill", billing === "annual" && "is-annual")}
          aria-hidden
        />
        <button
          type="button"
          onClick={() => onChange("monthly")}
          className={cn("pc-toggle-btn", billing === "monthly" && "is-active")}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => onChange("annual")}
          className={cn("pc-toggle-btn", billing === "annual" && "is-active")}
        >
          Annually
          <span className="pc-toggle-save">Save 20%</span>
        </button>
      </div>
    </div>
  );
}

function planNameToKey(name: string): PlanKey | null {
  const k = name.toLowerCase();
  if (k === "free" || k === "grow" || k === "premium" || k === "elite") {
    return k as PlanKey;
  }
  return null;
}

function IncludesLabel({ planName, isDark }: { planName: string; isDark?: boolean }) {
  const base = cn("pc-includes-label", isDark && "pc-includes-label--dark");

  if (planName === "Free") {
    return <p className={base}>Includes:</p>;
  }
  if (planName === "Grow") {
    return (
      <p className={base}>
        Everything in <span className="pc-includes-accent">Free</span> plus:
      </p>
    );
  }
  if (planName === "Premium") {
    return (
      <p className={base}>
        Everything in <span className="pc-includes-accent">Grow</span> plus:
      </p>
    );
  }
  return (
    <p className={base}>
      Everything in <span className="pc-includes-accent pc-includes-accent--forest">Premium</span>{" "}
      plus:
    </p>
  );
}

function PlanPriceBlock({
  plan,
  billing,
}: {
  plan: Plan;
  billing: "monthly" | "annual";
}) {
  const cardPlanKey = planNameToKey(plan.name);
  const isDark = plan.name === "Premium";

  if (plan.name === "Free") {
    return (
      <motion.div
        key="free-price"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="pc-price-block"
      >
        <div className="pc-price-main">
          <span className={cn("pc-price-value", isDark && "pc-price-value--light")}>
            {plan.price}
          </span>
        </div>
        <span className={cn("pc-price-sub", isDark && "pc-price-sub--light")}>forever</span>
      </motion.div>
    );
  }

  const monthlyUsd =
    plan.name === "Grow"
      ? PAID_PLAN_USD.grow.monthly
      : plan.name === "Premium"
        ? PAID_PLAN_USD.premium.monthly
        : PAID_PLAN_USD.elite.monthly;

  const displayUsd =
    plan.name === "Grow"
      ? billing === "monthly"
        ? PAID_PLAN_USD.grow.monthly
        : PAID_PLAN_USD.grow.annualPerMonth
      : plan.name === "Premium"
        ? billing === "monthly"
          ? PAID_PLAN_USD.premium.monthly
          : PAID_PLAN_USD.premium.annualPerMonth
        : billing === "monthly"
          ? PAID_PLAN_USD.elite.monthly
          : PAID_PLAN_USD.elite.annualPerMonth;

  return (
    <motion.div
      key={`${plan.name}-${billing}`}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="pc-price-block"
    >
      {billing === "annual" ? (
        <div className="pc-price-save-row">
          <span className="pc-price-save-badge">Save 20%</span>
        </div>
      ) : null}
      <div className="pc-price-main">
        {billing === "annual" ? (
          <span className={cn("pc-price-strike", isDark && "pc-price-strike--light")}>
            ${monthlyUsd}
          </span>
        ) : null}
        <span
          className={cn(
            "pc-price-value",
            isDark && "pc-price-value--light",
            plan.name === "Elite" && "pc-price-value--forest"
          )}
        >
          ${displayUsd}
        </span>
        <span className={cn("pc-price-period", isDark && "pc-price-period--light")}>
          /month
        </span>
      </div>
      {billing === "annual" && cardPlanKey && isPaidPlanForConfirm(cardPlanKey) ? (
        <p className={cn("pc-price-annual", isDark && "pc-price-annual--light")}>
          (billed ${getAnnualTotalDueUsd(cardPlanKey).toLocaleString("en-US")}/yr)
        </p>
      ) : null}
      {billing === "annual" && cardPlanKey && isPaidPlanForConfirm(cardPlanKey) ? (
        <p className="pricing-sr-detail">
          Pay ${getAnnualTotalDueUsd(cardPlanKey).toLocaleString("en-US")} today (12 months at $
          {PAID_PLAN_USD[cardPlanKey].annualPerMonth}/mo)
        </p>
      ) : null}
    </motion.div>
  );
}

export type CinematicPricingCardsProps = {
  billing: "monthly" | "annual";
  onBillingChange: (mode: "monthly" | "annual") => void;
  plans: Plan[];
  onChoosePlan: (key: "free" | "grow" | "premium" | "elite") => void;
  onCustomPlan: () => void;
};

export default function CinematicPricingCards({
  billing,
  onBillingChange,
  plans,
  onChoosePlan,
  onCustomPlan,
}: CinematicPricingCardsProps) {
  return (
    <div className="pc-wrap">
      <CardsBillingToggle billing={billing} onChange={onBillingChange} />

      <div className="pc-grid">
        {plans.map((plan, index) => {
          const isPremiumFeatured = plan.name === "Premium" && Boolean(plan.highlight);
          const isDark = plan.name === "Premium";
          const checkClass =
            plan.name === "Elite"
              ? "pc-check pc-check--forest"
              : "pc-check pc-check--teal";

          return (
            <motion.div
              key={plan.name}
              id={`plan-card-${plan.name.toLowerCase()}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className={cn(
                "pc-card",
                plan.name === "Free" && "pc-card--free",
                plan.name === "Grow" && "pc-card--grow",
                isPremiumFeatured && "pc-card--premium",
                plan.name === "Elite" && "pc-card--elite"
              )}
            >
              {isPremiumFeatured ? (
                <span className="pc-popular-badge">Most Popular</span>
              ) : null}

              <div className="pc-card-inner">
                {isPremiumFeatured ? (
                  <span className="pc-recommended-pill">Recommended</span>
                ) : null}

                <h3
                  className={cn(
                    "pc-plan-name",
                    plan.name === "Grow" && "pc-plan-name--teal",
                    isDark && "pc-plan-name--light pc-plan-name--premium",
                    plan.name === "Elite" && "pc-plan-name--forest"
                  )}
                >
                  {plan.name}
                </h3>
                <p className={cn("pc-tagline", isDark && "pc-tagline--light")}>{plan.description}</p>

                <PlanPriceBlock plan={plan} billing={billing} />

                <button
                  type="button"
                  onClick={() =>
                    onChoosePlan(plan.name.toLowerCase() as "free" | "grow" | "premium" | "elite")
                  }
                  className={cn(
                    "pc-cta",
                    plan.name === "Free" && "pc-cta--dark",
                    plan.name === "Grow" && "pc-cta--dark",
                    isPremiumFeatured && "pc-cta--premium",
                    plan.name === "Elite" && "pc-cta--elite"
                  )}
                >
                  Choose This Plan
                </button>

                <hr className={cn("pc-divider", isDark && "pc-divider--dark")} />

                <IncludesLabel planName={plan.name} isDark={isDark} />

                <ul className="pc-features">
                  {plan.features.map((feature) => (
                    <li key={feature} className={cn("pc-feature", isDark && "pc-feature--light")}>
                      <CheckCircle2 className={checkClass} aria-hidden />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {isPremiumFeatured ? (
                  <p className="pc-footnote">Most businesses choose this plan.</p>
                ) : null}

                <hr className={cn("pc-divider", isDark && "pc-divider--dark")} />

                <button type="button" className={cn("pc-explore", isDark && "pc-explore--light")}>
                  Explore features +
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="pc-custom-row">
        <div>
          <h3 className="pc-custom-title">Custom Plan</h3>
          <p className="pc-custom-copy">{CUSTOM_PLAN_GUIDANCE}</p>
        </div>
        <button type="button" onClick={onCustomPlan} className="pc-custom-btn">
          Request a Custom Plan →
        </button>
      </div>
    </div>
  );
}
