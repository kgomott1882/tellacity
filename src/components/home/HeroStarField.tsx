"use client";

import {
  useMemo,
  useRef,
  useEffect,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
  type CSSProperties,
} from "react";

/** Deterministic pseudo-random in [0, 1) , stable across SSR + browser. */
function seeded(n: number) {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453123;
  return x - Math.floor(x);
}

/** Round so SSR and client serialize identical style strings (fixes hydration). */
function r(n: number, dp: number): number {
  const p = 10 ** dp;
  return Math.round(n * p) / p;
}

const STAR_COUNT = 72;
/** Below `md`, only the first N stars render (less clutter + calmer on phones). */
const MOBILE_STAR_VISIBLE = 26;
/** Sparse yellow accents: 5–7 stars (~7–10% of field, under 1 in 10). */
const ORANGE_STAR_COUNT = 5 + Math.floor(seeded(777) * 3);

const LOAD_DELAY_MS = 2000;
/** Shooting star animation length (ms) , slower so the streak reads clearly; matches inline CSS animation. */
const SHOT_DURATION_MS = 4200;

export type HeroStarFieldHandle = {
  triggerShot: () => void;
};

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

function pickShotLayout(rect: DOMRect): Omit<ActiveShot, "id"> {
  const w = rect.width;
  const h = rect.height;
  const diagonal = Math.sqrt(w * w + h * h);
  const angleDeg = r(Math.random() * 360, 2);
  const travelPx = r(diagonal * (0.95 + Math.random() * 0.75), 0);
  const trailW = r(130 + Math.random() * 170, 0);
  const startXPx = r(Math.random() * Math.max(1, w), 1);
  const startYPx = r(Math.random() * Math.max(1, h), 1);
  return { angleDeg, travelPx, startXPx, startYPx, trailW };
}

const HeroStarField = forwardRef<HeroStarFieldHandle>(function HeroStarField(
  _props,
  ref
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [client, setClient] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [activeShots, setActiveShots] = useState<ActiveShot[]>([]);

  const loadScheduledRef = useRef(false);
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
        baseOpacity: r(0.32 + seeded(i * 19 + 9) * 0.45, 3),
      });
    }
    return out;
  }, []);

  const orangeStarIds = useMemo(() => {
    const scored = Array.from({ length: STAR_COUNT }, (_, id) => ({
      id,
      key: seeded(id * 4241 + 13),
    }));
    scored.sort((a, b) => a.key - b.key);
    return new Set(
      scored.slice(0, ORANGE_STAR_COUNT).map((row) => row.id)
    );
  }, []);

  useEffect(() => {
    setClient(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const spawnShot = useCallback((): boolean => {
    if (reduceMotion) return false;
    const el = rootRef.current;
    if (!el) return false;

    const rect = el.getBoundingClientRect();
    const layout = pickShotLayout(rect);
    const id = ++shotSeq.current;

    setActiveShots((prev) => [...prev, { id, ...layout }]);

    window.setTimeout(() => {
      setActiveShots((prev) => prev.filter((s) => s.id !== id));
    }, SHOT_DURATION_MS);
    return true;
  }, [reduceMotion]);

  useImperativeHandle(
    ref,
    () => ({
      triggerShot: () => {
        spawnShot();
      },
    }),
    [spawnShot]
  );

  const scheduleLoadShot = useCallback(() => {
    if (reduceMotion || loadScheduledRef.current) return;
    loadScheduledRef.current = true;

    const attempt = () => {
      if (!rootRef.current) {
        window.setTimeout(attempt, 60);
        return;
      }
      spawnShot();
    };
    attempt();
  }, [reduceMotion, spawnShot]);

  useEffect(() => {
    if (!client || reduceMotion) return;
    const t = window.setTimeout(scheduleLoadShot, LOAD_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [client, reduceMotion, scheduleLoadShot]);

  return (
    <div
      ref={rootRef}
      className="hero-star-field pointer-events-none absolute inset-0 z-[1] overflow-hidden"
      aria-hidden
    >
      {stars.map((s) => {
        const glow = r(Math.max(2, s.sizePx * 2.4), 2);
        const halo = r(s.sizePx * 4.2, 2);
        const glowSpread = r(s.sizePx * 0.65, 2);
        const haloSpread = r(s.sizePx * 1.05, 2);
        const haloOuter = r(halo * 1.25, 2);
        const isOrange = orangeStarIds.has(s.id);
        const boxShadow = isOrange
          ? `0 0 ${glow}px ${glowSpread}px rgba(253, 224, 71, 0.92), 0 0 ${halo}px ${haloSpread}px rgba(250, 204, 21, 0.58), 0 0 ${haloOuter}px rgba(245, 158, 11, 0.38)`
          : `0 0 ${glow}px ${glowSpread}px rgba(255, 255, 255, 0.62), 0 0 ${halo}px ${haloSpread}px rgba(186, 230, 253, 0.42), 0 0 ${haloOuter}px rgba(255, 255, 255, 0.22)`;
        const boxShadowMobile = isOrange
          ? `0 0 ${glow}px ${glowSpread}px rgba(253, 224, 71, 0.48), 0 0 ${halo}px ${haloSpread}px rgba(250, 204, 21, 0.3), 0 0 ${haloOuter}px rgba(245, 158, 11, 0.18)`
          : `0 0 ${glow}px ${glowSpread}px rgba(255, 255, 255, 0.32), 0 0 ${halo}px ${haloSpread}px rgba(186, 230, 253, 0.22), 0 0 ${haloOuter}px rgba(255, 255, 255, 0.1)`;

        return (
          <span
            key={s.id}
            className={`hero-star-anchor absolute ${
              s.id >= MOBILE_STAR_VISIBLE ? "max-md:hidden" : ""
            }`}
            style={{
              left: `${s.leftPct}%`,
              top: `${s.topPct}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <span
              className={`hero-star hero-star-glow block rounded-full ${
                isOrange ? "bg-[#FDE047]/98" : "bg-white/90"
              }`}
              style={
                {
                  width: `${s.sizePx}px`,
                  height: `${s.sizePx}px`,
                  opacity: s.baseOpacity,
                  transformOrigin: "center center",
                  ["--hero-star-glow-mobile" as string]: boxShadowMobile,
                  boxShadow,
                  animation: `heroStarTwinkle ${s.durationS}s ease-in-out ${s.delayS}s infinite alternate both`,
                  willChange: "opacity, transform, filter",
                } as CSSProperties
              }
            />
          </span>
        );
      })}

      {client &&
        !reduceMotion &&
        activeShots.map((activeShot) => (
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
                animation: `heroShootingStarFly ${SHOT_DURATION_MS}ms cubic-bezier(0.2, 0.75, 0.25, 1) forwards`,
              } as CSSProperties
            }
          >
            <div
              className="relative"
              style={{ width: activeShot.trailW, height: 4 }}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: activeShot.trailW,
                  height: 3,
                  top: 0.5,
                  background:
                    "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.22) 18%, rgba(255,255,255,0.88) 55%, #ffffff 88%, #ffffff 100%)",
                  boxShadow:
                    "0 0 16px 6px rgba(255,255,255,0.78), 0 0 32px 14px rgba(186, 230, 253, 0.45), 0 0 52px 22px rgba(255,255,255,0.18)",
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
                    "0 0 12px 5px rgba(255,255,255,1), 0 0 26px 12px rgba(200,230,255,0.65)",
                }}
              />
            </div>
          </div>
        ))}
    </div>
  );
});

export default HeroStarField;
