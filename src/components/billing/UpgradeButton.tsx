"use client";

import { useEffect } from "react";

type Props = {
  businessId: string;
  planCode: string;
  amount: number;
  email: string;
};

export default function UpgradeButton({
  businessId,
  planCode,
  amount,
  email,
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
    <button
      onClick={handlePayment}
      className="bg-black text-white px-4 py-2 rounded-xl shadow hover:opacity-90"
    >
      Upgrade to {planCode}
    </button>
  );
}
