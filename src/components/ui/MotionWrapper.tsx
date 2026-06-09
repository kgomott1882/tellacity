"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const DEFAULT_IO_THRESHOLD = 0.15;

export function FadeUp({
  children,
  delay = 0,
  className = "",
  threshold = DEFAULT_IO_THRESHOLD,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  threshold?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold });

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={`home-io-fade-up ${visible ? "is-visible" : ""} ${className}`.trim()}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

export function StaggerFadeUp({
  children,
  index = 0,
  staggerMs = 80,
  className = "",
  threshold = DEFAULT_IO_THRESHOLD,
}: {
  children: ReactNode;
  index?: number;
  staggerMs?: number;
  className?: string;
  threshold?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold });

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={`home-stagger-fade ${visible ? "is-visible" : ""} ${className}`.trim()}
      style={{
        transitionDelay: visible ? `${index * staggerMs}ms` : undefined,
      }}
    >
      {children}
    </div>
  );
}
