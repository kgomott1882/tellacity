 "use client";

 import { useState } from "react";

 type Plan = {
   name: string;
   price: string;
   priceSub?: string;
   description: string;
   features: string[];
   connectors?: string[];
   highlight?: boolean;
 };

 const plans: Plan[] = [
   {
     name: "Free",
     price: "$0",
     description: "Basic tools for getting started with reputation management.",
     features: [
       "Claim your business profile",
       "Verified Business Dashboard access",
       "Receive unlimited consumer reviews",
       "25 review invites per month",
       "Basic Email review invitations",
     ],
   },
   {
     name: "Grow",
     price: "$59",
     priceSub: "/ month",
     description: "Essential tools to actively build trust and collect reviews.",
     features: [
       "100 review invites per month",
       "Email & SMS review invitations",
       "Customisable email invite templates",
       "QR code reviews",
       "Photo reviews (with proof upload)",
       "Standard on-site widget library",
       "Review & invite performance analytics",
     ],
     connectors: ["Shopify", "WooCommerce", "WordPress"],
   },
   {
     name: "Premium",
     price: "$179",
     priceSub: "/ month",
     description: "Advanced features to scale visibility and automate growth.",
     features: [
       "Everything in Grow",
       "500 review invites per month",
       "Automated review invitation flows",
       "Expanded widget library (customisable)",
       "Advanced analytics & sentiment analysis",
       "Multi-location review management",
       "Team alerts & notifications",
       "Premium Credibility Badge",
       "Multi-user logins (10 users)",
       "API access (read-only)",
     ],
     connectors: ["Twilio", "Klaviyo", "Magento", "HubSpot", "Slack", "Zendesk"],
     highlight: true,
   },
   {
     name: "Elite",
     price: "From $399",
     priceSub: "/ month",
     description: "Enterprise-grade brand management & strategic insights.",
     features: [
       "Everything in Premium",
       "2,500+ review invites per month",
       "Bulk upload & automation rules",
       "White-label solution options",
       "Full API access (read/write)",
       "Strategic insights & benchmarking",
       'Priority placement ("Featured")',
       "Role-based team access (Unlimited)",
       "Custom enterprise integrations",
       "Scheduled auto-exports",
       "Dedicated account manager",
     ],
     connectors: [
       "Twilio",
       "Klaviyo",
       "Magento",
       "HubSpot",
       "Slack",
       "Zendesk",
       "Zapier",
       "Generic API",
     ],
   },
 ];

 const addOns = ["SAP", "Salesforce", "NetSuite", "Marketo", "Custom API"];

 const comparisonRows = [
   ["Review invites/month", "25", "100", "500", "2,500+"],
   ["Email invites", "✓", "✓", "✓", "✓"],
   ["Customisable email templates", "–", "✓", "✓", "✓"],
   ["QR code reviews", "–", "✓", "✓", "✓"],
   ["Photo reviews with proof", "–", "✓", "✓", "✓"],
   ["On-site widget library", "Basic", "Standard", "Expanded", "Full + Custom CSS"],
   ["Review & invite analytics", "Basic", "Standard", "Advanced", "Advanced + exports"],
   ["Multi-location management", "–", "–", "✓", "✓"],
   ["Notifications & alerts", "Basic", "Standard", "Team alerts", "Custom enterprise"],
   ["Credibility & visibility", "Profile", "Verified Badge", "Premium Badge", "Featured placement"],
   ["Team access", "1 User", "3 Users", "10 Users", "Unlimited (SSO)"],
   ["API access", "–", "–", "Read-only", "Full Read/Write"],
   ["Data exports", "–", "CSV", "CSV + JSON", "Scheduled auto-exports"],
   ["White-label solution", "–", "–", "–", "✓"],
   ["Strategic insights", "–", "–", "Sentiment", "Sentiment + Benchmarks"],
   ["Integration connectors", "–", "3", "Unlimited", "Unlimited"],
   ["Custom enterprise integrations", "–", "–", "–", "✓"],
 ];

 const trustedLogos = [
   "Shopify",
   "Twilio",
   "PayFast",
   "BigCommerce",
   "Google",
   "Magento",
   "HubSpot",
   "Slack",
   "WooCommerce",
   "Klaviyo",
   "Zapier",
   "Zendesk",
 ];

 export default function PricingPage() {
   const [billing, setBilling] = useState<"monthly" | "annually">("monthly");

   return (
     <main className="bg-[#F7F8FA]">
       <section className="mx-auto w-full max-w-6xl px-6 py-16 text-center">
         <h1 className="text-3xl font-semibold text-[#0E0E0E]">
           <span className="relative inline-block">
             <span className="relative z-10">Simple, transparent pricing</span>
             <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
           </span>
         </h1>
         <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">
           Start for free, or unlock powerful features to build trust, scale
           visibility, and manage your brand&apos;s reputation with confidence.
         </p>

         <div className="mt-6 inline-flex rounded-full bg-white p-1 shadow-sm">
           <button
             type="button"
             onClick={() => setBilling("monthly")}
             className={`rounded-full px-4 py-2 text-xs font-semibold ${
               billing === "monthly"
                 ? "bg-[#0E0E0E] text-white"
                 : "text-gray-600"
             }`}
           >
             Monthly
           </button>
           <button
             type="button"
             onClick={() => setBilling("annually")}
             className={`rounded-full px-4 py-2 text-xs font-semibold ${
               billing === "annually"
                 ? "bg-[#0E0E0E] text-white"
                 : "text-gray-600"
             }`}
           >
             Annually
           </button>
           <span className="ml-2 inline-flex items-center rounded-full bg-[#FCD34D]/30 px-2 text-[10px] font-semibold text-[#B45309]">
             SAVE 20%
           </span>
         </div>
       </section>

       <section className="mx-auto w-full max-w-6xl px-6 pb-8">
         <div className="grid gap-6 lg:grid-cols-4">
           {plans.map((plan) => (
             <div
               key={plan.name}
               className={`relative flex h-full flex-col rounded-2xl border ${
                 plan.highlight
                   ? "border-[#1FAF9E] bg-white shadow-lg"
                   : "border-gray-200 bg-white shadow-sm"
               } p-6`}
             >
               {plan.highlight && (
                 <span className="absolute left-1/2 top-0 -translate-y-1/2 -translate-x-1/2 rounded-full bg-[#FCD34D]/40 px-3 py-1 text-[10px] font-semibold text-[#0E0E0E]">
                   Most Popular
                 </span>
               )}
               <h3 className="text-sm font-semibold text-[#0E0E0E]">
                 {plan.name}
               </h3>
               <p className="mt-2 text-xs text-gray-600">{plan.description}</p>
               <div className="mt-5 flex items-end gap-1">
                 <span className="text-3xl font-semibold text-[#0E0E0E]">
                   {plan.price}
                 </span>
                 {plan.priceSub && (
                   <span className="pb-1 text-xs text-gray-500">
                     {plan.priceSub}
                   </span>
                 )}
               </div>
               <ul className="mt-5 space-y-3 text-xs text-gray-600">
                 {plan.features.map((feature) => (
                   <li key={feature} className="flex items-start gap-2">
                     <span className="mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#1FAF9E] text-[10px] font-semibold text-[#1FAF9E]">
                       ✓
                     </span>
                     <span>{feature}</span>
                   </li>
                 ))}
               </ul>
               {plan.connectors && (
                 <div className="mt-4">
                   <p className="text-[10px] font-semibold text-gray-500">
                     Connectors included:
                   </p>
                   <div className="mt-2 flex flex-wrap gap-2">
                     {plan.connectors.map((connector) => (
                       <span
                         key={connector}
                         className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-semibold text-gray-500"
                       >
                         {connector}
                       </span>
                     ))}
                   </div>
                 </div>
               )}
               <button
                 type="button"
                 className={`mt-6 inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-xs font-semibold ${
                   plan.highlight
                     ? "bg-[#0E0E0E] text-white"
                     : "border border-[#0E0E0E] text-[#0E0E0E]"
                 }`}
               >
                 {plan.name === "Free" ? "Get Started" : "Choose Plan"}
               </button>
             </div>
           ))}
         </div>

         <div className="mt-6 rounded-xl border border-gray-200 bg-white px-6 py-4 text-xs text-gray-600 shadow-sm">
           <p className="font-semibold text-[#0E0E0E]">Add-Ons Available:</p>
           <div className="mt-2 flex flex-wrap gap-2">
             {addOns.map((addon) => (
               <span
                 key={addon}
                 className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-semibold text-gray-500"
               >
                 {addon}
               </span>
             ))}
           </div>
         </div>

         <div className="mt-6 rounded-xl border border-gray-200 bg-white px-6 py-4 text-xs text-gray-600 shadow-sm">
           <p className="font-semibold text-[#0E0E0E]">Integration Information</p>
           <p className="mt-2">
             Integration connectors require an active account with the provider.
             Third-party subscription fees (e.g., Shopify, Twilio, Salesforce) are
             billed separately by their providers. Tellacity only enables the
             connectors and provides setup/maintenance for enterprise
             integrations where applicable.
           </p>
         </div>
       </section>

       <section className="mx-auto w-full max-w-6xl px-6 py-12">
         <div className="text-center">
           <h2 className="text-2xl font-semibold text-[#0E0E0E]">
             Detailed Feature Comparison
           </h2>
           <p className="mt-2 text-xs text-gray-600">
             Compare all features and limits across plans
           </p>
         </div>
         <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
           <div className="overflow-x-auto">
             <table className="min-w-full text-left text-xs text-gray-600">
               <thead className="bg-gray-50 text-[11px] font-semibold text-[#0E0E0E]">
                 <tr>
                   <th className="px-4 py-3">Feature</th>
                   <th className="px-4 py-3">Free</th>
                   <th className="px-4 py-3">Grow</th>
                   <th className="px-4 py-3">Premium</th>
                   <th className="px-4 py-3">Elite</th>
                 </tr>
               </thead>
               <tbody>
                 {comparisonRows.map((row) => (
                   <tr key={row[0]} className="border-t border-gray-100">
                     <td className="px-4 py-3 font-medium text-[#0E0E0E]">
                       {row[0]}
                     </td>
                     <td className="px-4 py-3">{row[1]}</td>
                     <td className="px-4 py-3">{row[2]}</td>
                     <td className="px-4 py-3">{row[3]}</td>
                     <td className="px-4 py-3">{row[4]}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>
       </section>

       <section className="mx-auto w-full max-w-6xl px-6 py-10">
         <div className="text-center">
           <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
             Trusted By Industry Leaders
           </p>
           <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
             {trustedLogos.map((logo) => (
               <span
                 key={logo}
                 className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-400"
               >
                 {logo}
               </span>
             ))}
           </div>
         </div>
       </section>

       <section className="bg-white py-14">
         <div className="mx-auto w-full max-w-6xl px-6">
           <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-[#F7F8FA] p-6 text-center shadow-sm">
             <h3 className="text-base font-semibold text-[#0E0E0E]">
               Still have questions?
             </h3>
             <p className="mt-2 text-xs text-gray-600">
               Our team is here to help you choose the right plan for your
               business needs. Reach out to us directly.
             </p>

             <form className="mt-6 space-y-3 text-left text-xs text-gray-600">
               <label className="block">
                 <span className="text-[11px] font-semibold text-gray-600">
                   Your Name
                 </span>
                 <input
                   type="text"
                   placeholder="e.g. Jane Doe"
                   className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-[#0E0E0E] outline-none focus:border-[#1FAF9E]"
                 />
               </label>
               <label className="block">
                 <span className="text-[11px] font-semibold text-gray-600">
                   Your Email
                 </span>
                 <input
                   type="email"
                   placeholder="e.g. jane.doe@company.com"
                   className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-[#0E0E0E] outline-none focus:border-[#1FAF9E]"
                 />
               </label>
               <label className="block">
                 <span className="text-[11px] font-semibold text-gray-600">
                   Subject
                 </span>
                 <input
                   type="text"
                   value="Pricing Inquiry"
                   readOnly
                   className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-[#0E0E0E]"
                 />
               </label>
               <label className="block">
                 <span className="text-[11px] font-semibold text-gray-600">
                   Message
                 </span>
                 <textarea
                   rows={4}
                   placeholder="Tell us what you need..."
                   className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-[#0E0E0E] outline-none focus:border-[#1FAF9E]"
                 />
               </label>
               <button
                 type="button"
                 className="inline-flex w-full items-center justify-center rounded-full bg-[#1FAF9E] px-4 py-2 text-xs font-semibold text-white"
               >
                 Send
               </button>
             </form>
           </div>
         </div>
       </section>
     </main>
   );
 }
