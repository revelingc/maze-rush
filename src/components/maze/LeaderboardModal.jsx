import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, X, Crown, Flame } from "lucide-react";
import { loadHighScores } from "@/lib/gameStorage";

export default function LeaderboardModal({ onClose }) {
  const [board, setBoard] = useState(null);

  useEffect(() => {
    setBoard(loadHighScores());
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl bg-slate-950/80 px-4 safe-modal-4 backdrop-blur-md"
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
            <h2 className="text-base font-semibold text-white">Local Leaderboard</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-2 py-2">
          {board === null && (
            <div className="flex items-center justify-center py-12 text-sm text-white/40">
              Loading ranks…
            </div>
          )}
          {board && board.length === 0 && (
            <div className="py-12 text-center text-sm text-white/40">
              No scores yet. Be the first!
            </div>
          )}
          {board && board.length > 0 && (
            <ul className="space-y-1">
              {board.map((row, i) => (
                <li
                  key={`${row.player_name}-${i}`}
                  className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5"
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
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}