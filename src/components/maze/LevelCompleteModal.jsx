import React from "react";
import { motion } from "framer-motion";
import { Trophy, ChevronRight, Clock, Sparkles } from "lucide-react";

export default function LevelCompleteModal({ level, time, isRecord, cycleComplete, nextCycle, onNext }) {
  return (
    <Backdrop>
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-400/15 ring-1 ring-emerald-300/30">
          <Trophy className="h-8 w-8 text-emerald-300" />
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-emerald-300/80">
          {cycleComplete ? "Cycle Complete" : "Level Cleared"}
        </p>
        <h2 className="mt-2 text-4xl font-semibold text-white">Level {level}</h2>
        {cycleComplete ? (
          <>
            <p className="mt-3 text-sm text-white/60">
              You cleared all 100 levels. The maze resets and is now{" "}
              <span className="text-white/90">50% harder</span> as a base.
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-violet-400/15 px-3 py-1.5 text-xs font-semibold text-violet-200 ring-1 ring-violet-300/30">
              <Sparkles className="h-3.5 w-3.5" />
              Black Hole dot unlocked
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-white/50">
            The maze grows 5% harder. Keep your streak alive.
          </p>
        )}

        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10">
            <Clock className="h-3.5 w-3.5 text-sky-300" />
            <span className="text-sm font-semibold tabular-nums text-white">
              {time != null && Number.isFinite(time) ? `${time.toFixed(1)}s` : "—"}
            </span>
          </div>
          {isRecord && (
            <span className="rounded-full bg-amber-400/20 px-3 py-1.5 text-xs font-semibold text-amber-300 ring-1 ring-amber-300/30">
              New best!
            </span>
          )}
        </div>

        <button
          onClick={onNext}
          className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-400 px-6 py-3.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300 active:scale-[0.98]"
        >
          {cycleComplete ? `Begin Cycle ${nextCycle}` : "Next Level"}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </Backdrop>
  );
}

function Backdrop({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex items-center justify-center rounded-2xl bg-slate-950/70 p-6 backdrop-blur-md"
    >
      <motion.div
        initial={{ y: 12, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 8, scale: 0.98 }}
        className="w-full max-w-xs"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}