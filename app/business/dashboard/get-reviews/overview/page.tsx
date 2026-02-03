"use client";

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="space-y-2 text-center">
      <div className="text-lg font-semibold">{title}</div>
      <p className="text-black/60 text-sm leading-relaxed">{text}</p>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
      <div className="text-sm text-black/60">{title}</div>
      <div className="text-3xl font-semibold mt-2">{value}</div>
    </div>
  );
}

export default function GetReviewsOverviewPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Get reviews – Overview</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-10 max-w-5xl">
        <h2 className="text-2xl font-semibold text-center mb-10">Save time, switch to autopilot</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <Feature
            title="Build trust"
            text="Show potential customers they can trust your business with verified reviews."
          />
          <Feature
            title="Grow"
            text="Increase performance across your buyer journey with reviews proven to convert."
          />
          <Feature
            title="Improve"
            text="Verified reviews can be linked with your customer data to make decisions."
          />
        </div>

        <div className="flex justify-center mt-10">
          <button className="bg-[#124541] hover:bg-[#0f3a35] transition text-white px-8 py-3 rounded-lg font-medium">
            Set up automated invitations
          </button>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard title="Invitations delivered" value="0" />
          <MetricCard title="Verified reviews" value="0" />
          <MetricCard title="TellaScore" value="0" />
        </div>
      </div>
    </div>
  );
}
