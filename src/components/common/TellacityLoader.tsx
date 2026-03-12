"use client";

import Image from "next/image";

export default function TellacityLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/brand/TELLACITY -Line Icon.png"
          alt="Tellacity loading"
          width={100}
          height={100}
          priority
          className="animate-[spin_3s_linear_infinite]"
        />
        <p className="text-sm text-gray-600 font-medium tracking-wide">
          Loading...
        </p>
      </div>
    </div>
  );
}

