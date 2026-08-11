"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Count-up number transition (§27). Fast and understated — eases to the value
 * once on mount, then snaps on subsequent value changes.
 */
export function AnimatedNumber({
  value,
  format,
  durationMs = 650,
  className,
}: {
  value: number;
  format: (n: number) => string;
  durationMs?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const raf = useRef<number | null>(null);
  const from = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const startVal = from.current;
    const delta = value - startVal;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // easeOutExpo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setDisplay(startVal + delta * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      from.current = value;
    };
  }, [value, durationMs]);

  return <span className={className}>{format(display)}</span>;
}
