import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Zap, Gauge } from "lucide-react";
import MazeCanvas from "@/components/maze/MazeCanvas";
import AdOverlay from "@/components/maze/AdOverlay";
import GameOverModal from "@/components/maze/GameOverModal";
import LevelCompleteModal from "@/components/maze/LevelCompleteModal";
import { loadState, saveState } from "@/lib/gameStorage";
import { getLevelConfig } from "@/lib/mazeGenerator";

export default function Home() {
  const initial = loadState();
  const [level, setLevel] = useState(initial.level);
  const [lives, setLives] = useState(initial.lives);
  const [running, setRunning] = useState(true);
  const [resetToken, setResetToken] = useState(0);
  const [modal, setModal] = useState(null); // 'levelcomplete' | 'gameover' | null
  const [ad, setAd] = useState(null); // 'standard' | 'premium' | null

  const livesRef = useRef(lives);
  livesRef.current = lives;

  useEffect(() => {
    saveState({ level, lives });
  }, [level, lives]);

  const handleLevelComplete = useCallback(() => {
    setRunning(false);
    setModal("levelcomplete");
  }, []);

  const handleLifeLost = useCallback(() => {
    const nl = livesRef.current - 1;
    if (nl <= 0) {
      setLives(0);
      setRunning(false);
      setModal("gameover");
    } else {
      setLives(nl);
      setResetToken((t) => t + 1);
    }
  }, []);

  const nextLevel = () => {
    setLevel((l) => l + 1);
    setModal(null);
    setRunning(true);
  };

  const restart = () => {
    setLevel(1);
    setLives(3);
    setModal(null);
    setRunning(true);
    setResetToken((t) => t + 1);
  };

  const watchAd = (type) => {
    setModal(null);
    setAd(type);
  };

  const onAdComplete = () => {
    const gain = ad === "premium" ? 6 : 3;
    setLives(gain);
    setAd(null);
    setRunning(true);
    setResetToken((t) => t + 1);
  };

  const cfg = getLevelConfig(level);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <Header level={level} lives={lives} difficultyPct={cfg.difficultyPct} />

      <main className="flex flex-1 items-center justify-center px-4 pb-6">
        <div className="flex w-full max-w-[560px] flex-col items-center">
          <p className="mb-3 text-center text-xs text-white/40">
            Drag your finger or stylus to guide the orb to the glowing exit.
          </p>
          <div className="relative aspect-square w-full">
            <MazeCanvas
              level={level}
              running={running}
              resetToken={resetToken}
              onLevelComplete={handleLevelComplete}
              onLifeLost={handleLifeLost}
            />
            <AnimatePresence>
              {modal === "levelcomplete" && (
                <LevelCompleteModal level={level} onNext={nextLevel} />
              )}
              {modal === "gameover" && (
                <GameOverModal level={level} onWatchAd={watchAd} onRestart={restart} />
              )}
              {ad && <AdOverlay type={ad} onComplete={onAdComplete} />}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

function Header({ level, lives, difficultyPct }) {
  return (
    <header className="flex items-center justify-between px-5 py-5">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400/20 to-indigo-500/20 ring-1 ring-white/10">
          <Zap className="h-4 w-4 text-teal-300" />
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">
            Maze Rush
          </p>
          <p className="text-sm font-semibold">Level {level}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10">
          <Heart className="h-4 w-4 text-rose-400" fill="currentColor" />
          <span className="text-sm font-semibold tabular-nums">{lives}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10">
          <Gauge className="h-4 w-4 text-amber-300" />
          <span className="text-sm font-semibold tabular-nums">+{difficultyPct}%</span>
        </div>
      </div>
    </header>
  );
}