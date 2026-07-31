import React from "react";
import { motion } from "framer-motion";
import { Play, Palette, BarChart3, Zap, Trophy, Flame } from "lucide-react";
import DotPreview from "@/components/maze/DotPreview";

export default function MainMenu({ bestLevel, bestStreak, skinObj, onPlay, onCosmetics, onBoard }) {
  return (
    <div className="flex h-[100dvh] flex-col bg-slate-950 px-6 text-white">
      <div className="flex flex-1 flex-col items-center justify-center gap-7">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400/20 to-indigo-500/20 ring-1 ring-white/10">
            <Zap className="h-7 w-7 text-teal-300" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Maze Rush</h1>
          <p className="mt-1 text-sm text-white/40">Outrun the clock. Chase the streak.</p>
        </motion.div>

        <div className="flex items-center gap-3">
          <Stat icon={<Trophy className="h-4 w-4 text-yellow-300" />} label="Best Lv" value={bestLevel} />
          <Stat icon={<Flame className="h-4 w-4 text-amber-300" />} label="Best Streak" value={bestStreak} />
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">Current Ball</p>
          <DotPreview skin={skinObj} size={36} />
        </div>

        <div className="flex w-full max-w-xs flex-col gap-3">
          <MenuButton onClick={onPlay} primary>
            <Play className="h-5 w-5" /> Play
          </MenuButton>
          <MenuButton onClick={onCosmetics}>
            <Palette className="h-5 w-5" /> Cosmetics
          </MenuButton>
          <MenuButton onClick={onBoard}>
            <BarChart3 className="h-5 w-5" /> Leaderboard
          </MenuButton>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 ring-1 ring-white/10">
      {icon}
      <span className="text-sm font-semibold tabular-nums">{value}</span>
      <span className="text-[10px] uppercase tracking-wider text-white/40">{label}</span>
    </div>
  );
}

function MenuButton({ children, onClick, primary }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={
        "flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-base font-semibold transition " +
        (primary
          ? "bg-teal-400 text-slate-950 hover:bg-teal-300"
          : "bg-white/5 text-white ring-1 ring-white/10 hover:bg-white/10")
      }
    >
      {children}
    </motion.button>
  );
}