"use client";

import { Info } from "lucide-react";

function StepRow({ step, text }: { step: number; text: string }) {
  return (
    <div className="flex items-center gap-3 border border-black/10 rounded-xl p-4">
      <div className="h-7 w-7 rounded-full bg-[#124541] text-white flex items-center justify-center text-sm font-semibold">
        {step}
      </div>
      <div className="text-sm font-medium text-black/80">{text}</div>
    </div>
  );
}

export default function BusinessDashboardHome() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Welcome to Tellacity</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-10 max-w-5xl">
        <h2 className="text-2xl font-semibold mb-4">Hi there! Let's get you more reviews</h2>

        <div className="bg-[#F8F4F0] border border-black/10 rounded-xl p-5 text-sm text-black/70 max-w-3xl">
          <div className="flex gap-3">
            <div className="mt-0.5">
              <Info size={18} className="text-black/60" />
            </div>
            <div>
              <div className="font-medium text-black/80">
                Why? Because reviews build trust with potential customers and give you valuable insights.
              </div>
              <div className="mt-2">The hard work is done for you — you stay in complete control.</div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <StepRow step={1} text="Choose an email template" />
            <StepRow step={2} text="Decide how and when they're sent" />
            <StepRow step={3} text="Connect to your email system" />
          </div>

          <div className="bg-[#F8F4F0] rounded-xl border border-black/10 flex items-center justify-center min-h-[180px]">
            <div className="w-80 max-w-full px-6">
              <div className="h-3 w-40 bg-black/10 rounded-full" />
              <div className="mt-4 space-y-3">
                <div className="h-12 bg-[#124541]/10 rounded-lg border border-black/10" />
                <div className="h-12 bg-[#124541]/10 rounded-lg border border-black/10" />
              </div>
            </div>
          </div>
        </div>

        <button className="mt-10 bg-[#124541] hover:bg-[#0f3a35] transition text-white px-8 py-3 rounded-lg font-medium">
          Set up email invites
        </button>

        <div className="mt-10 text-center">
          <button className="text-sm text-[#124541] hover:underline">Go to my dashboard</button>
        </div>
      </div>
    </div>
  );
}
