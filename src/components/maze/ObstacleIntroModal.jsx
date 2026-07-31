import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONTENT = {
  hazards: {
    title: "Red Dots",
    color: "#FB7185",
    body: "Patrolling hazards roam the corridors. Brush against one and you lose a life. Pick your moment and slip past.",
  },
  lasers: {
    title: "Wall Lasers",
    color: "#22D3EE",
    body: "Beams fire from the walls on a timer. A dashed warning shows the path before it fires — dash through while it's off.",
  },
  hunters: {
    title: "Hunters",
    color: "#A855F7",
    body: "These orbs track you through the maze. Keep moving and use the loops to break their line on you.",
  },
};

function Preview({ kind, color }) {
  if (kind === "lasers") {
    return (
      <div className="flex h-16 items-center justify-center gap-3">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        <div className="h-1.5 w-24 rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      </div>
    );
  }
  return (
    <div className="flex h-16 items-center justify-center">
      <span
        className="rounded-full"
        style={{ width: 34, height: 34, background: color, boxShadow: `0 0 14px ${color}` }}
      />
    </div>
  );
}

export default function ObstacleIntroModal({ obstacleKey, onContinue }) {
  const c = CONTENT[obstacleKey] || CONTENT.hazards;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl bg-slate-950/85 px-5 safe-modal-5 backdrop-blur-md"
    >
      <motion.div
        initial={{ y: 14, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 8, scale: 0.98 }}
        className="w-full max-w-xs rounded-2xl bg-slate-900 p-5 ring-1 ring-white/10"
      >
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">New Obstacle</p>
        <h2 className="mt-0.5 text-lg font-semibold" style={{ color: c.color }}>
          {c.title}
        </h2>
        <div className="my-3 rounded-xl bg-white/5 ring-1 ring-white/10">
          <Preview kind={obstacleKey} color={c.color} />
        </div>
        <p className="text-sm text-white/60">{c.body}</p>
        <Button
          onClick={onContinue}
          className="mt-4 w-full rounded-full bg-teal-400 text-slate-950 hover:bg-teal-300"
        >
          Got it <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}