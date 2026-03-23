type AdminActionMessageProps = {
  type: "success" | "error";
  text: string;
};

export default function AdminActionMessage({ type, text }: AdminActionMessageProps) {
  const styles =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-red-200 bg-red-50 text-red-900";

  return (
    <div
      role="status"
      className={`rounded-lg border px-3 py-2 text-sm ${styles}`}
    >
      {text}
    </div>
  );
}
