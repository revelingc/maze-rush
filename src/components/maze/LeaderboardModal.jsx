import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, X, Crown, Flame, Pencil } from "lucide-react";
import { loadHighScores } from "@/lib/gameStorage";
import { generateGoofyName } from "@/lib/nameUtils";
import NamePromptModal from "@/components/maze/NamePromptModal";

export default function LeaderboardModal({ onClose, displayName, onRename }) {
  const [board, setBoard] = useState(null);
  const [editing, setEditing] = useState(false);

  const load = useCallback(() => {
    setBoard(loadHighScores());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
            <h2 className="text-base font-semibold text-white">Leaderboard</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-5 py-3">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">Your name</p>
            <p className="truncate text-sm font-semibold text-white">{displayName || "Anonymous runner"}</p>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
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

        <AnimatePresence>
          {editing && (
            <NamePromptModal
              editMode
              defaultValue={displayName || ""}
              onSubmit={(name) => { onRename?.(name); setEditing(false); load(); }}
              onSkip={() => { const g = generateGoofyName(); onRename?.(g); setEditing(false); load(); }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}