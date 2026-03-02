export default function DashboardMock() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)] transition-all duration-300 hover:scale-[1.01]">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="h-4 w-32 rounded bg-gray-200" />
        <div className="flex gap-2">
          <div className="h-3 w-3 rounded-full bg-gray-200" />
          <div className="h-3 w-3 rounded-full bg-gray-200" />
          <div className="h-3 w-3 rounded-full bg-gray-200" />
        </div>
      </div>

      {/* Rating */}
      <div className="mt-6">
        <p className="text-2xl font-semibold text-[#0E0E0E]">
          4.8 <span className="text-yellow-500">★★★★★</span>
        </p>
        <p className="text-sm text-gray-500">217 Reviews</p>
      </div>

      {/* Reviews */}
      <div className="mt-6 space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className="h-10 w-10 rounded-full bg-gray-200" />
            <div className="flex-1">
              <div className="h-3 w-24 rounded bg-gray-200" />
              <div className="mt-2 h-3 w-full rounded bg-gray-100" />
              <div className="mt-1 h-3 w-3/4 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
