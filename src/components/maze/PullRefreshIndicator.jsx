import React from "react";

// Small spinner shown above a scroll list while the user pulls to refresh.
export default function PullRefreshIndicator({ pull, refreshing, threshold = 70 }) {
  if (pull <= 0 && !refreshing) return null;
  const height = refreshing ? 32 : Math.min(pull, 60);
  const opacity = refreshing ? 1 : Math.min(1, pull / threshold);
  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-[height] duration-150"
      style={{ height, opacity }}
    >
      <div
        className={
          "h-5 w-5 rounded-full border-2 border-white/20 border-t-white/80 " +
          (refreshing ? "animate-spin" : "")
        }
        style={
          !refreshing
            ? { transform: `rotate(${Math.min(180, (pull / threshold) * 180)}deg)` }
            : undefined
        }
      />
    </div>
  );
}