"use client";

import {
  useMemo,
  useRef,
  useEffect,
  useState,
  useCallback,
  type CSSProperties,
} from "react";

/** Deterministic pseudo-random in [0, 1) — stable across SSR + browser. */
function seeded(n: number) {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453123;
  return x - Math.floor(x);
}

/** Round so SSR and client serialize identical style strings (fixes hydration). */
function r(n: number, dp: number): number {
  const p = 10 ** dp;
  return Math.round(n * p) / p;
}

/** Total stars (md+). Mobile shows only the first `MOBILE_STAR_COUNT` — same DOM, no hydration issues. */
const STAR_COUNT = 72;
const MOBILE_STAR_COUNT = 34;

const COOLDOWN_MS = 60_000;
const LOAD_DELAY_MS = 2000;
/** Cursor must be within this distance (px) of the hero bounds to count as “close”. */
const PROXIMITY_PX = 110;
/** One-shot shooting star animation length (ms) — must match CSS feel. */
const SHOT_DURATION_MS = 1500;

type Star = {
  id: number;
  leftPct: number;
  topPct: number;
  sizePx: number;
  durationS: number;
  delayS: number;
  baseOpacity: number;
};

type ActiveShot = {
  id: number;
  angleDeg: number;
  travelPx: number;
  startXPx: number;
  startYPx: number;
  trailW: number;
};

function distancePointToRect(px: number, py: number, rect: DOMRect): number {
  const cx = Math.min(Math.max(px, rect.left), rect.right);
  const cy = Math.min(Math.max(py, rect.top), rect.bottom);
  const dx = px - cx;
  const dy = py - cy;
  return Math.sqrt(dx * dx + dy * dy);
}

function pickShotLayout(rect: DOMRect): Omit<ActiveShot, "id"> {
  const w = rect.width;
  const h = rect.height;
  // Diagonal “night sky” streak: mostly top-left → bottom-right feel
  const angleDeg = r(-34 - Math.random() * 28, 2);
  const travelPx = r(Math.min(480, w * 0.72 + h * 0.15), 0);
  const trailW = r(140 + Math.random() * 100, 0);
  // Start in upper band so the streak crosses the hero (reference image)
  const startXPx = r(w * (0.02 + Math.random() * 0.42), 1);
  const startYPx = r(h * (0.04 + Math.random() * 0.28), 1);
  return { angleDeg, travelPx, startXPx, startYPx, trailW };
}

export default function HeroStarField() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [client, setClient] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [activeShot, setActiveShot] = useState<ActiveShot | null>(null);

  /** Load timer ran (only once). */
  const loadScheduledRef = useRef(false);
  /** Load streak actually rendered. */
  const loadSpawnedRef = useRef(false);
  /** Cursor “first gift” streak rendered. */
  const cursorInitialFiredRef = useRef(false);
  const cooldownUntilRef = useRef(0);
  const busyRef = useRef(false);
  const wasNearRef = useRef(false);
  const shotSeq = useRef(0);

  const stars = useMemo(() => {
    const out: Star[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      out.push({
        id: i,
        leftPct: r(seeded(i * 3 + 1) * 100, 4),
        topPct: r(seeded(i * 5 + 7) * 100, 4),
        sizePx: r(1 + seeded(i * 11 + 2) * 2.5, 3),
        durationS: r(2 + seeded(i * 13 + 3) * 4.5, 3),
        delayS: r(seeded(i * 17 + 5) * 10, 3),
        /** Lower base luminance (desktop + mobile). */
        baseOpacity: r(0.18 + seeded(i * 19 + 9) * 0.32, 3),
      });
    }
    return out;
  }, []);

  useEffect(() => {
    setClient(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const tryStartCooldownIfBothInitialDone = useCallback(() => {
    if (loadSpawnedRef.current && cursorInitialFiredRef.current) {
      cooldownUntilRef.current = Date.now() + COOLDOWN_MS;
    }
  }, []);

  const spawnShot = useCallback((): boolean => {
    if (reduceMotion) return false;
    const el = rootRef.current;
    if (!el || busyRef.current) return false;

    busyRef.current = true;
    const rect = el.getBoundingClientRect();
    const layout = pickShotLayout(rect);
    const id = ++shotSeq.current;

    setActiveShot({
      id,
      ...layout,
    });

    window.setTimeout(() => {
      setActiveShot((cur) => (cur?.id === id ? null : cur));
      busyRef.current = false;
    }, SHOT_DURATION_MS);
    return true;
  }, [reduceMotion]);

  const scheduleLoadShot = useCallback(() => {
    if (reduceMotion || loadScheduledRef.current) return;
    loadScheduledRef.current = true;

    const attempt = () => {
      if (!rootRef.current) {
        window.setTimeout(attempt, 60);
        return;
      }
      if (busyRef.current) {
        window.setTimeout(attempt, 60);
        return;
      }
      if (spawnShot()) {
        loadSpawnedRef.current = true;
        tryStartCooldownIfBothInitialDone();
      }
    };
    attempt();
  }, [reduceMotion, spawnShot, tryStartCooldownIfBothInitialDone]);

  const tryProximityShot = useCallback(() => {
    if (reduceMotion) return;
    if (Date.now() < cooldownUntilRef.current) return;

    const run = () => {
      if (busyRef.current) {
        window.setTimeout(run, 60);
        return;
      }

      if (!cursorInitialFiredRef.current) {
        if (spawnShot()) {
          cursorInitialFiredRef.current = true;
          tryStartCooldownIfBothInitialDone();
        }
        return;
      }

      // After initial pair + cooldown, each proximity streak starts a new 60s cooldown
      if (spawnShot()) {
        cooldownUntilRef.current = Date.now() + COOLDOWN_MS;
      }
    };
    run();
  }, [reduceMotion, spawnShot, tryStartCooldownIfBothInitialDone]);

  // 2s after mount: first shooting star
  useEffect(() => {
    if (!client || reduceMotion) return;
    const t = window.setTimeout(scheduleLoadShot, LOAD_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [client, reduceMotion, scheduleLoadShot]);

  // Cursor near hero → second star (edge-triggered), then repeats after cooldown
  useEffect(() => {
    if (!client || reduceMotion) return;

    const onMove = (e: PointerEvent) => {
      const el = rootRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const d = distancePointToRect(e.clientX, e.clientY, rect);
      const near = d <= PROXIMITY_PX;

      if (near && !wasNearRef.current) {
        wasNearRef.current = true;
        tryProximityShot();
      } else if (!near) {
        wasNearRef.current = false;
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [client, reduceMotion, tryProximityShot]);

  return (
    <div
      ref={rootRef}
      className="hero-star-field pointer-events-none absolute inset-0 z-[1] overflow-hidden"
      aria-hidden
    >
      {stars.map((s) => {
        const glow = r(Math.max(2, s.sizePx * 2.2), 2);
        const halo = r(s.sizePx * 3.6, 2);
        const glowSpread = r(s.sizePx * 0.55, 2);
        const haloSpread = r(s.sizePx * 0.85, 2);
        const haloOuter = r(halo * 1.1, 2);
        const mobileOnlyHidden = s.id >= MOBILE_STAR_COUNT ? "max-md:hidden" : "";

        return (
          <span
            key={s.id}
            className={`hero-star absolute rounded-full bg-white/90 ${mobileOnlyHidden}`}
            style={{
              left: `${s.leftPct}%`,
              top: `${s.topPct}%`,
              width: `${s.sizePx}px`,
              height: `${s.sizePx}px`,
              opacity: s.baseOpacity,
              transform: "translate(-50%, -50%)",
              boxShadow: `0 0 ${glow}px ${glowSpread}px rgba(255, 255, 255, 0.38), 0 0 ${halo}px ${haloSpread}px rgba(186, 230, 253, 0.28), 0 0 ${haloOuter}px rgba(255, 255, 255, 0.12)`,
              animation: `heroStarTwinkle ${s.durationS}s ease-in-out ${s.delayS}s infinite alternate`,
              willChange: "opacity, transform, filter",
            }}
          />
        );
      })}

      {client && activeShot && !reduceMotion && (
        <div
          key={activeShot.id}
          className="hero-shooting-star-instance pointer-events-none absolute z-[2]"
          style={
            {
              left: `${activeShot.startXPx}px`,
              top: `${activeShot.startYPx}px`,
              ["--angle"]: `${activeShot.angleDeg}deg`,
              ["--travel"]: `${activeShot.travelPx}px`,
              transformOrigin: "left center",
              animation: `heroShootingStarFly ${SHOT_DURATION_MS}ms cubic-bezier(0.22, 0.82, 0.28, 1) forwards`,
            } as CSSProperties
          }
        >
          {/* Tail + luminous head (reference: bright leading point, long taper) */}
          <div className="relative" style={{ width: activeShot.trailW, height: 4 }}>
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: activeShot.trailW,
                height: 3,
                top: 0.5,
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 18%, rgba(255,255,255,0.75) 55%, #ffffff 88%, #ffffff 100%)",
                boxShadow:
                  "0 0 14px 5px rgba(255,255,255,0.65), 0 0 28px 12px rgba(186, 230, 253, 0.35), 0 0 48px 20px rgba(255,255,255,0.12)",
                filter: "blur(0.35px)",
              }}
            />
            <div
              className="absolute rounded-full bg-white"
              style={{
                width: 6,
                height: 6,
                right: -1,
                top: "50%",
                transform: "translateY(-50%)",
                boxShadow:
                  "0 0 10px 4px rgba(255,255,255,0.95), 0 0 22px 10px rgba(200,230,255,0.55)",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
