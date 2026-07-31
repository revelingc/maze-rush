import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Zap, Gauge, Flame, Trophy, BarChart3 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MazeCanvas from "@/components/maze/MazeCanvas";
import AdOverlay from "@/components/maze/AdOverlay";
import GameOverModal from "@/components/maze/GameOverModal";
import LevelCompleteModal from "@/components/maze/LevelCompleteModal";
import LeaderboardModal from "@/components/maze/LeaderboardModal";
import { loadState, saveState } from "@/lib/gameStorage";
import { getLevelConfig } from "@/lib/mazeGenerator";

export default function Home() {
  const initial = loadState();
  const [level, setLevel] = useState(initial.level);
  const [lives, setLives] = useState(initial.lives);
  const [streak, setStreak] = useState(initial.streak);
  const [bestStreak, setBestStreak] = useState(initial.bestStreak);
  const [running, setRunning] = useState(true);
  const [resetToken, setResetToken] = useState(0);
  const [modal, setModal] = useState(null); // 'levelcomplete' | 'gameover'
  const [ad, setAd] = useState(null); // 'standard' | 'premium'
  const [showBoard, setShowBoard] = useState(false);
  const [myId, setMyId] = useState(null);
  const [myName, setMyName] = useState("Runner");

  const livesRef = useRef(lives);
  livesRef.current = lives;

  // load the current user once
  useEffect(() => {
    base44.auth.me().then((me) => {
      setMyId(me.id);
      const name = me.full_name || (me.email || "").split("@")[0] || "Runner";
      setMyName(name);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    saveState({ level, lives, streak, bestStreak });
  }, [level, lives, streak, bestStreak]);

  const submitScore = useCallback(
    async (reachedLevel, streakVal) => {
      try {
        const existing = await base44.entities.Score.filter(
          { created_by_id: myId },
          "-level",
          1
        );
        if (existing.length) {
          const s = existing[0];
          if (reachedLevel > s.level || (reachedLevel === s.level && streakVal > s.streak)) {
            await base44.entities.Score.update(s.id, {
              level: reachedLevel,
              streak: streakVal,
            });
          }
        } else {
          await base44.entities.Score.create({
            player_name: myName,
            level: reachedLevel,
            streak: streakVal,
          });
        }
      } catch (e) {
        /* ignore */
      }
    },
    [myId, myName]
  );

  const handleLevelComplete = useCallback(() => {
    setRunning(false);
    setStreak((s) => s + 1);
    setBestStreak((b) => Math.max(b, streak + 1));
    setModal("levelcomplete");
  }, [streak]);

  const handleLifeLost = useCallback(() => {
    const nl = livesRef.current - 1;
    if (nl <= 0) {
      setLives(0);
      setRunning(false);
      setModal("gameover");
      submitScore(level, livesRef.current >= 0 ? streak : 0);
    } else {
      setLives(nl);
      setResetToken((t) => t + 1);
    }
  }, [level, streak, submitScore]);

  const nextLevel = () => {
    setLevel((l) => l + 1);
    setModal(null);
    setRunning(true);
  };

  const restart = () => {
    setLevel(1);
    setLives(3);
    setStreak(0);
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
      <Header
        level={level}
        lives={lives}
        streak={streak}
        bestStreak={bestStreak}
        difficultyPct={cfg.difficultyPct}
        onOpenBoard={() => setShowBoard(true)}
      />

      <main className="flex flex-1 items-center justify-center px-4 pb-6">
        <div className="flex w-full max-w-[560px] flex-col items-center">
          <p className="mb-3 text-center text-xs text-white/40">
            Hold and drag anywhere to steer — the maze scrolls beneath you. Reach the glowing exit.
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
              {showBoard && (
                <LeaderboardModal myId={myId} onClose={() => setShowBoard(false)} />
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

function Header({ level, lives, streak, bestStreak, difficultyPct, onOpenBoard }) {
  return (
    <header className="px-5 pt-5">
      <div className="flex items-center justify-between">
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
        <button
          onClick={onOpenBoard}
          className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 ring-1 ring-white/10 transition hover:bg-white/10"
        >
          <BarChart3 className="h-4 w-4 text-amber-300" />
          Ranks
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Chip icon={<Heart className="h-3.5 w-3.5 text-rose-400" fill="currentColor" />}>
          {lives}
        </Chip>
        <Chip icon={<Flame className="h-3.5 w-3.5 text-amber-300" />}>
          {streak}
          <span className="ml-1 text-[10px] text-white/30">streak</span>
        </Chip>
        <Chip icon={<Trophy className="h-3.5 w-3.5 text-yellow-300" />}>
          {bestStreak}
          <span className="ml-1 text-[10px] text-white/30">best</span>
        </Chip>
        <div className="ml-auto">
          <Chip icon={<Gauge className="h-3.5 w-3.5 text-sky-300" />}>+{difficultyPct}%</Chip>
        </div>
      </div>
    </header>
  );
}

function Chip({ icon, children }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10">
      {icon}
      <span className="text-sm font-semibold tabular-nums">{children}</span>
    </div>
  );
}