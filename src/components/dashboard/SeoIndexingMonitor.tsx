"use client";

import { useEffect, useState } from "react";

export default function SeoIndexingMonitor() {
  const [stats, setStats] = useState({
    indexed: 0,
    total: 150000,
    impressions: 0,
    clicks: 0,
  });

  useEffect(() => {
    // Placeholder until Search Console API integration
    setStats({
      indexed: 8000,
      total: 150000,
      impressions: 0,
      clicks: 0,
    });
  }, []);

  const progress = Math.round((stats.indexed / stats.total) * 100);

  return (
    <div className="rounded-xl border border-gray-200 p-5 bg-white">
      <h3 className="text-lg font-semibold text-[#0E0E0E] mb-3">
        SEO Indexing Monitor
      </h3>

      <div className="space-y-2 text-sm text-gray-600">
        <p>
          Indexed business pages: <strong>{stats.indexed.toLocaleString()}</strong> / {stats.total.toLocaleString()}
        </p>

        <p>
          Crawl progress: <strong>{progress}%</strong>
        </p>

        <p>
          Search impressions: <strong>{stats.impressions}</strong>
        </p>

        <p>
          Organic clicks: <strong>{stats.clicks}</strong>
        </p>
      </div>

      <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#1FAF9E]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
