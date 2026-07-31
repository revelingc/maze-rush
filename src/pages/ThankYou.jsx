import React from "react";
import { Link } from "react-router-dom";
import { Check, Zap } from "lucide-react";

export default function ThankYou() {
  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center bg-slate-950 px-6 text-center text-white">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-400/15 ring-1 ring-teal-300/30">
        <Check className="h-8 w-8 text-teal-300" />
      </div>
      <h1 className="mt-5 text-2xl font-bold">Purchase complete!</h1>
      <p className="mt-2 max-w-xs text-sm text-white/50">
        Your Shooting Star ball skin is unlocked. Head back to the menu to equip it.
      </p>
      <Link
        to="/"
        className="mt-6 flex items-center gap-2 rounded-full bg-teal-400 px-6 py-3 font-semibold text-slate-950 hover:bg-teal-300"
      >
        <Zap className="h-4 w-4" /> Back to Maze Rush
      </Link>
    </div>
  );
}