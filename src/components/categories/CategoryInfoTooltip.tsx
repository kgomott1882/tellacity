'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function CategoryInfoTooltip({ categorySlug }: { categorySlug: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm text-gray-600 underline hover:text-black"
      >
        How categories work
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-80 rounded-xl border bg-white p-4 text-sm shadow-lg">
          <p className="mb-2 text-gray-700">
            Businesses on Tellacity are grouped into categories based on their
            services, products, and customer feedback.
          </p>

          <p className="mb-3 text-gray-700">
            Rankings are based on reviews, ratings, and recent activity to help
            users discover the most trusted businesses.
          </p>

          <Link
            href={`/categories/${categorySlug}/about`}
            className="font-medium text-blue-600 hover:underline"
          >
            Read more
          </Link>
        </div>
      )}
    </div>
  )
}
