import ContactPageForm from "./ContactPageForm";

export default function InvestorRelationsContactPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto w-full max-w-3xl px-6 py-16 text-center">
        <h1 className="text-4xl font-semibold text-[#0E3B36] sm:text-5xl">
          Get in Touch
        </h1>
        <p className="mt-4 text-base text-gray-600">
          We&apos;d love to hear from you! Whether you have a question, feedback,
          or just want to say hello, drop us a line.
        </p>
        <div className="mt-10">
          <ContactPageForm />
        </div>
      </section>
    </main>
  );
}
