import { useEffect, useRef } from "react";

/**
 * Lightweight scroll-reveal hook using the native Intersection Observer.
 * Adds the `is-visible` class to the element once it enters the viewport.
 * Pair with the `.reveal` utility in `index.css`.
 *
 * Usage:
 *   const ref = useScrollReveal<HTMLDivElement>();
 *   return <div ref={ref} className="reveal">...</div>;
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced-motion preference — reveal immediately
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, options);

    observer.observe(el);

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}
