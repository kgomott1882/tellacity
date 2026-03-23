"use client";

import { useEffect, type ReactNode } from "react";

type Props = {
  businessId: string;
  planCode: string;
  amount: number;
  email: string;
  className?: string;
  children: ReactNode;
};

/**
 * Same Paystack inline flow as UpgradeButton, with custom label/styling (e.g. "Choose This Plan").
 */
export default function PaystackPlanButton({
  businessId,
  planCode,
  amount,
  email,
  className,
  children,
}: Props) {
  useEffect(() => {
    const scriptId = "paystack-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://js.paystack.co/v1/inline.js";
      document.body.appendChild(script);
    }
  }, []);

  const handlePayment = () => {
    const PaystackPop = (window as any).PaystackPop;

    if (!PaystackPop) {
      alert("Payment system not ready. Try again.");
      return;
    }

    const handler = PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email,
      amount,
      currency: "ZAR",
      metadata: {
        business_id: businessId,
        plan_code: planCode,
      },
      callback: function () {
        alert("Payment successful");
      },
      onClose: function () {
        console.log("Payment closed");
      },
    });

    handler.openIframe();
  };

  return (
    <button type="button" onClick={handlePayment} className={className}>
      {children}
    </button>
  );
}
