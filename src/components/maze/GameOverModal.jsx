import React from "react";
import { motion } from "framer-motion";
import { Skull, Film, RotateCcw, Share2 } from "lucide-react";

export default function GameOverModal({ level, streak, canWatchAd, onWatchAd, onRestart, onShare }) {
  return (
    <Backdrop>
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-400/15 ring-1 ring-rose-300/30">
          <Skull className="h-8 w-8 text-rose-300" />
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-rose-300/80">
          Out of Lives
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Game Over</h2>
        <p className="mt-3 text-sm text-white/50">
          You reached <span className="text-white/80">Level {level}</span>
          {streak ? <> with a <span className="text-white/80">{streak}-streak</span></> : null}.
          {canWatchAd ? " Continue right where you are." : " Your run is over — restart to play again."}
        </p>

        <div className="mt-6 space-y-2.5">
          {canWatchAd && (
            <button
              onClick={() => onWatchAd("standard")}
              className="flex w-full items-center justify-between rounded-xl bg-white/5 px-4 py-3.5 text-left ring-1 ring-white/10 transition hover:bg-white/10 active:scale-[0.98]"
            >
              <span className="flex items-center gap-3">
                <Film className="h-4 w-4 text-sky-300" />
                <span className="text-sm font-medium text-white">Watch ad</span>
              </span>
              <span className="text-sm font-semibold text-sky-300">+5 lives</span>
            </button>
          )}
          <button
            onClick={onShare}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-400/15 px-4 py-3.5 text-sm font-semibold text-teal-200 ring-1 ring-teal-300/30 transition hover:bg-teal-400/25 active:scale-[0.98]"
          >
            <Share2 className="h-4 w-4" />
            Share my score
          </button>
          <button
            onClick={onRestart}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm text-white/50 transition hover:text-white/80"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restart from Level 1
          </button>
        </div>
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
      className="absolute inset-0 z-40 flex items-center justify-center rounded-2xl bg-slate-950/75 px-6 safe-modal-6 backdrop-blur-md"
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