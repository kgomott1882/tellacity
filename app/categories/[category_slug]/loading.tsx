export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#1FAF9E]" />
        <p className="text-sm font-medium text-gray-500">
          Loading businesses...
        </p>
      </div>
    </div>
  );
}
