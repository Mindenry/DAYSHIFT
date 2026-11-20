"use client";

import { useEffect } from "react";

/**
 * Remounts on every navigation, so each page fades in and reveal targets are
 * recalculated. A scroll-position check (rather than IntersectionObserver)
 * also reveals sections that a fast scroll or anchor jump skipped over.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const pending = new Set(
      Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-revealed)")),
    );
    if (!pending.size) return;

    let frame = 0;
    const check = () => {
      frame = 0;
      const limit = window.innerHeight * 0.92;
      for (const node of pending) {
        const rect = node.getBoundingClientRect();
        if (rect.top < limit) {
          node.classList.add("is-revealed");
          pending.delete(node);
        }
      }
      if (!pending.size) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(check);
    };

    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return <div className="animate-page">{children}</div>;
}
