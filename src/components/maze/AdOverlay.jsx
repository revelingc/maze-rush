import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Film, Sparkles } from "lucide-react";

/**
 * Simulated ad overlay. A real ad network (e.g. AdMob) requires a native SDK
 * and cannot run inside the web build — this stands in for that flow.
 * type: "standard" (+5 lives) | "premium" (+10 lives)
 */
export default function AdOverlay({ type, onComplete }) {
  const [count, setCount] = useState(5);

  useEffect(() => {
    const t = setInterval(() => setCount((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (count === 0) {
      const t = setTimeout(onComplete, 250);
      return () => clearTimeout(t);
    }
  }, [count, onComplete]);

  const lives = type === "premium" ? 10 : 5;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl bg-black/90 px-6 safe-modal-6 backdrop-blur-sm"
    >
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-white/40">
          <Film className="h-3.5 w-3.5" />
          Advertisement
        </div>
        <div className="relative mb-6 flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 ring-1 ring-white/10">
          {count > 0 ? (
            <span className="text-5xl font-light text-white">{count}</span>
          ) : (
            <Sparkles className="h-10 w-10 text-emerald-300" />
          )}
        </div>
        <p className="text-sm text-white/60">
          {count > 0
            ? `Your ${lives} lives are being prepared…`
            : "Reward unlocked!"}
        </p>
      </div>
    </motion.div>
  );
}