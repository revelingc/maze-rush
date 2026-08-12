import React from "react";
import { motion } from "framer-motion";
import { X, Clock } from "lucide-react";
import { loadBestTimes } from "@/lib/gameStorage";

function fmt(s) {
  if (s == null || !Number.isFinite(s)) return null;
  return `${s.toFixed(1)}s`;
}

export default function LevelSelectModal({ bestLevel, onSelect, onClose }) {
  const times = loadBestTimes();
  const total = Math.max(bestLevel, 1);
  const levels = [];
  for (let i = 1; i <= total; i++) levels.push(i);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-6 safe-modal-6 backdrop-blur-md"
    >
      <motion.div
        initial={{ y: 12, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 8, scale: 0.98 }}
        className="relative w-full max-w-md rounded-2xl bg-slate-900 p-6 ring-1 ring-white/10"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-white/40 transition hover:text-white/80"
        >
          <X className="h-4 w-4" />
        </button>
        <h3 className="text-lg font-semibold text-white">Levels</h3>
        <p className="mt-1 text-sm text-white/50">Jump back into any level you've reached.</p>
        <div className="mt-4 grid max-h-[60vh] grid-cols-5 gap-2 overflow-y-auto pr-1">
          {levels.map((n) => {
            const t = fmt(times[n]);
            return (
              <button
                key={n}
                onClick={() => onSelect(n)}
                className="flex flex-col items-center justify-center rounded-xl bg-white/5 px-2 py-3 ring-1 ring-white/10 transition hover:bg-teal-400/15 hover:ring-teal-300/40"
              >
                <span className="text-sm font-semibold text-white tabular-nums">{n}</span>
                {t ? (
                  <span className="mt-0.5 flex items-center gap-0.5 text-[10px] text-teal-300/80 tabular-nums">
                    <Clock className="h-2.5 w-2.5" /> {t}
                  </span>
                ) : (
                  <span className="mt-0.5 text-[10px] text-white/30">—</span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}