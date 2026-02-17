"use client";

export default function CategoryError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  console.error(error);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center bg-white px-6 text-center">
      <h1 className="text-2xl font-semibold text-[#0E0E0E]">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        We couldn't load this category right now.
      </p>
      <button
        onClick={() => reset()}
        className="mt-6 rounded-full bg-[#1FAF9E] px-6 py-2 text-sm font-semibold text-white"
      >
        Try again
      </button>
    </main>
  );
}
