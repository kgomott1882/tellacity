"use client";

import { useEffect, useState } from "react";

export default function HomeScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const next = docHeight > 0 ? Math.min(1, scrollTop / docHeight) : 0;
      setProgress(next);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      className="home-scroll-progress"
      role="presentation"
      aria-hidden
      style={{ transform: `scaleX(${progress})` }}
    />
  );
}
