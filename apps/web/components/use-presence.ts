"use client";

import { useEffect, useState } from "react";

/**
 * Keeps an overlay mounted long enough to play its exit transition.
 * `state` flips one frame after open so CSS transitions run from the closed state.
 */
export function usePresence(open: boolean, exitMs = 240) {
  const [mounted, setMounted] = useState(open);
  const [state, setState] = useState<"open" | "closed">(open ? "open" : "closed");

  useEffect(() => {
    if (open) {
      setMounted(true);
      // Two frames: the first paints the closed state, the second starts the
      // transition. A single rAF is flushed before paint, which skipped the
      // drawer animation entirely.
      let second = 0;
      const first = requestAnimationFrame(() => {
        second = requestAnimationFrame(() => setState("open"));
      });
      return () => {
        cancelAnimationFrame(first);
        if (second) cancelAnimationFrame(second);
      };
    }

    setState("closed");
    const timer = setTimeout(() => setMounted(false), exitMs);
    return () => clearTimeout(timer);
  }, [open, exitMs]);

  return { mounted, state };
}
