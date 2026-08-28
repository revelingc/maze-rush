import { useEffect, useRef, useState } from "react";

// Attaches a pull-to-refresh gesture to a scroll container. Fires onRefresh
// when the user drags down from the top past `threshold`. Returns the current
// pull distance and a refreshing flag so the caller can render an indicator.
export function usePullToRefresh(scrollRef, onRefresh, { threshold = 70, maxPull = 100 } = {}) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const startYRef = useRef(null);
  const activeRef = useRef(false);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  pullRef.current = pull;
  refreshingRef.current = refreshing;
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      if (refreshingRef.current) return;
      if (el.scrollTop <= 0) {
        startYRef.current = e.touches[0].clientY;
        activeRef.current = true;
      } else {
        startYRef.current = null;
        activeRef.current = false;
      }
    };

    const onTouchMove = (e) => {
      if (!activeRef.current || startYRef.current == null) return;
      const dy = e.touches[0].clientY - startYRef.current;
      if (dy <= 0) {
        if (pullRef.current !== 0) setPull(0);
        return;
      }
      const d = Math.min(maxPull, dy * 0.5);
      setPull(d);
    };

    const onTouchEnd = async () => {
      if (!activeRef.current) return;
      activeRef.current = false;
      const reached = pullRef.current >= threshold;
      startYRef.current = null;
      if (reached && !refreshingRef.current) {
        setRefreshing(true);
        setPull(threshold);
        try {
          await onRefreshRef.current?.();
        } finally {
          setRefreshing(false);
          setPull(0);
        }
      } else {
        setPull(0);
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [scrollRef, threshold, maxPull]);

  return { pull, refreshing };
}