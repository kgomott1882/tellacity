"use client";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ContactSuccessModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div
        className="relative mx-4 w-full max-w-md rounded-xl bg-white p-6 text-center shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-success-title"
      >
        <div className="mb-3 text-3xl text-[#1FAF9E]" aria-hidden>
          ✓
        </div>

        <h2
          id="contact-success-title"
          className="text-lg font-semibold text-black"
        >
          Message sent
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          Your message has been sent successfully. Our team will get back to
          you shortly.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-md bg-black py-2 text-white transition hover:bg-[#1FAF9E]"
        >
          Close
        </button>
      </div>
    </div>
  );
}
