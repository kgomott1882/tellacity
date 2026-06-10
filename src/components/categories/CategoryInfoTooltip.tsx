'use client'

import { useState } from 'react'

export default function CategoryInfoTooltip() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm text-gray-600 underline hover:text-black"
      >
        How rankings work
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-80 rounded-xl border bg-white p-4 text-sm shadow-lg">
          <p className="text-gray-700">
            Rankings are based on TrustScore, review volume, and recent customer
            feedback. Browse profiles to read reviews, view photos, and compare
            services.
          </p>

          <a
            href="#how-rankings-work"
            className="mt-3 inline-block font-medium text-[#00B4A6] hover:underline"
            onClick={() => setOpen(false)}
          >
            Learn more
          </a>
        </div>
      )}
    </div>
  )
}
