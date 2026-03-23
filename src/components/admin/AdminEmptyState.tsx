type AdminEmptyStateProps = {
  message: string;
};

export default function AdminEmptyState({ message }: AdminEmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-6 py-10 text-center">
      <p className="text-sm text-neutral-600">{message}</p>
    </div>
  );
}
