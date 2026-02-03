"use client";

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="space-y-2 text-center">
      <div className="text-lg font-semibold">{title}</div>
      <p className="text-black/60 text-sm leading-relaxed">{text}</p>
    </div>
  );
}

export default function InvitationStatusPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Invitation status</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-10 max-w-5xl">
        <div className="bg-[#F8F4F0] border border-black/10 rounded-xl p-5 w-72 mb-10">
          <div className="text-sm text-black/60">Invitations sent this month</div>
          <div className="text-3xl font-bold mt-2">0 / 50</div>
        </div>

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
            text="Link verified reviews to customer data to unlock insights."
          />
        </div>

        <div className="flex justify-center mt-10">
          <button className="bg-[#124541] hover:bg-[#0f3a35] transition text-white px-8 py-3 rounded-lg font-medium">
            Set up automated invitations
          </button>
        </div>
      </div>
    </div>
  );
}
