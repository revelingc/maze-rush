import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, X, Crown, Flame } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function LeaderboardModal({ myId, onClose }) {
  const [board, setBoard] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await base44.entities.Score.list("-level", 100);
        rows.sort((a, b) => b.level - a.level || b.streak - a.streak);
        if (alive) setBoard(rows.slice(0, 50));
      } catch (e) {
        if (alive) setError(true);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl bg-slate-950/80 p-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ y: 14, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 8, scale: 0.98 }}
        className="flex w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-white/10"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-300" />
            <h2 className="text-base font-semibold text-white">Global Leaderboard</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-2 py-2">
          {board === null && !error && (
            <div className="flex items-center justify-center py-12 text-sm text-white/40">
              Loading ranks…
            </div>
          )}
          {error && (
            <div className="py-12 text-center text-sm text-white/40">
              Couldn’t load the leaderboard. Try again later.
            </div>
          )}
          {board && board.length === 0 && (
            <div className="py-12 text-center text-sm text-white/40">
              No scores yet. Be the first!
            </div>
          )}
          {board && board.length > 0 && (
            <ul className="space-y-1">
              {board.map((row, i) => {
                const mine = row.created_by_id === myId;
                return (
                  <li
                    key={row.id}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                      mine ? "bg-teal-400/10 ring-1 ring-teal-300/30" : "bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex w-7 shrink-0 items-center justify-center">
                      {i === 0 ? (
                        <Crown className="h-4 w-4 text-amber-300" />
                      ) : (
                        <span className="text-sm font-semibold tabular-nums text-white/50">
                          {i + 1}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {row.player_name || "Runner"}
                        {mine && (
                          <span className="ml-1.5 text-[10px] uppercase tracking-wide text-teal-300/80">
                            you
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-white/40">
                        Streak {row.streak ?? 0}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1">
                      <Flame className="h-3.5 w-3.5 text-amber-300" />
                      <span className="text-sm font-semibold tabular-nums text-white">
                        L{row.level ?? 0}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}