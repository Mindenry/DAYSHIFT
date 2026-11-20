"use client";

import { useEffect, useRef } from "react";

/**
 * Small scroll parallax for large editorial images. The extra 1.06 scale keeps
 * the frame covered while the layer moves. Disabled for reduced motion.
 */
export function ParallaxLayer({
  children,
  className = "",
  strength = 18,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const node = ref.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      if (rect.bottom < -100 || rect.top > window.innerHeight + 100) return;
      const progress = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
      const offset = Math.max(-1, Math.min(1, progress)) * -strength;
      node.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0) scale(1.06)`;
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [strength]);

  return (
    <div ref={ref} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}
