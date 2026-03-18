"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("Global error:", error);

  return (
    <div style={{ padding: 40 }}>
      <h1>Something went wrong</h1>
      <p>Please try again later.</p>
      <button
        type="button"
        onClick={() => reset()}
        style={{ marginTop: 16, padding: "8px 16px", cursor: "pointer" }}
      >
        Try again
      </button>
    </div>
  );
}
