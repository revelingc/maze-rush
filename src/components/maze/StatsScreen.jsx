import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Share2, Trophy, Flame, Clock, Timer } from "lucide-react";

function fmt(secs) {
  if (secs == null || !Number.isFinite(secs)) return "—";
  return `${secs.toFixed(1)}s`;
}

export default function StatsScreen({ bestLevel, bestStreak, bestTimes, onShare, onBack }) {
  const levels = Object.keys(bestTimes)
    .map(Number)
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);

  return (
    <div className="flex h-[100dvh] flex-col bg-slate-950 text-white">
      <header className="flex items-center gap-3 px-5 safe-pt-5">
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 hover:bg-white/10"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">Main Menu</p>
          <h1 className="text-lg font-semibold">Stats</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 safe-pb-6">
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Card icon={<Trophy className="h-4 w-4 text-yellow-300" />} label="Best Level" value={bestLevel} />
          <Card icon={<Flame className="h-4 w-4 text-amber-300" />} label="Best Streak" value={bestStreak} />
        </div>

        <button
          onClick={onShare}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-400/15 px-4 py-3.5 text-sm font-semibold text-teal-200 ring-1 ring-teal-300/30 transition hover:bg-teal-400/25 active:scale-[0.98]"
        >
          <Share2 className="h-4 w-4" />
          Share my run
        </button>

        <section className="mt-6">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-sky-300" />
            <h2 className="text-sm font-semibold">Fastest Time per Level</h2>
          </div>
          <p className="mb-3 text-xs text-white/40">Your quickest clear for each level you've finished.</p>
          {levels.length === 0 ? (
            <div className="rounded-2xl bg-white/[0.03] px-4 py-8 text-center text-sm text-white/40 ring-1 ring-white/10">
              No times yet — clear a level to start tracking.
            </div>
          ) : (
            <ul className="space-y-1.5">
              {levels.map((lv) => (
                <li
                  key={lv}
                  className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3 ring-1 ring-white/10"
                >
                  <span className="flex items-center gap-2.5 text-sm font-medium text-white/80">
                    <Clock className="h-3.5 w-3.5 text-white/30" />
                    Level {lv}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-sky-300">
                    {fmt(bestTimes[lv])}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Card({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] px-4 py-3.5 ring-1 ring-white/10">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-white/40">{label}</p>
        <p className="text-lg font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}