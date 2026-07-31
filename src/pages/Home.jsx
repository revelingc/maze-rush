import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Zap, Gauge, Flame, Trophy, BarChart3, Home as HomeIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MazeCanvas from "@/components/maze/MazeCanvas";
import AdOverlay from "@/components/maze/AdOverlay";
import GameOverModal from "@/components/maze/GameOverModal";
import LevelCompleteModal from "@/components/maze/LevelCompleteModal";
import LeaderboardModal from "@/components/maze/LeaderboardModal";
import NamePromptModal from "@/components/maze/NamePromptModal";
import ControlPad from "@/components/maze/ControlPad";
import MainMenu from "@/components/maze/MainMenu";
import CosmeticsScreen from "@/components/maze/CosmeticsScreen";
import { loadState, saveState } from "@/lib/gameStorage";
import { getLevelConfig } from "@/lib/mazeGenerator";
import { generateGoofyName } from "@/lib/nameUtils";
import { getSkin } from "@/lib/skins";

export default function Home() {
  const initial = loadState();
  const [screen, setScreen] = useState("menu"); // 'menu' | 'play' | 'cosmetics'
  const [level, setLevel] = useState(initial.level);
  const [lives, setLives] = useState(initial.lives);
  const [streak, setStreak] = useState(initial.streak);
  const [bestStreak, setBestStreak] = useState(initial.bestStreak);
  const [bestLevel, setBestLevel] = useState(initial.bestLevel);
  const [skin, setSkin] = useState(initial.skin || "default");
  const [wallColor, setWallColor] = useState(initial.wallColor || "#39496B");
  const [bgColor, setBgColor] = useState(initial.bgColor || "#0B0F1A");
  const [running, setRunning] = useState(true);
  const [resetToken, setResetToken] = useState(0);
  const [modal, setModal] = useState(null);
  const [ad, setAd] = useState(null);
  const [showBoard, setShowBoard] = useState(false);
  const [myId, setMyId] = useState(null);
  const [myName, setMyName] = useState("");
  const [displayName, setDisplayName] = useState(null);
  const [pendingScore, setPendingScore] = useState(null);

  const livesRef = useRef(lives);
  livesRef.current = lives;
  const pointer = useRef({ active: false, ax: 0, ay: 0, x: 0, y: 0, maxR: 70 });

  useEffect(() => {
    base44.auth.me().then((me) => {
      setMyId(me.id);
      const name = me.full_name || (me.email || "").split("@")[0] || "";
      setMyName(name);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    saveState({ level, lives, streak, bestStreak, bestLevel, skin, wallColor, bgColor });
  }, [level, lives, streak, bestStreak, bestLevel, skin, wallColor, bgColor]);

  useEffect(() => {
    if (level > bestLevel) setBestLevel(level);
  }, [level, bestLevel]);

  const checkQualifies = useCallback(async (reachedLevel, streakVal) => {
    try {
      const existing = await base44.entities.Score.filter({ created_by_id: myId }, "-level", 1);
      if (!existing.length) return true;
      const s = existing[0];
      return reachedLevel > s.level || (reachedLevel === s.level && streakVal > s.streak);
    } catch (e) {
      return true;
    }
  }, [myId]);

  const submitScore = useCallback(async (reachedLevel, streakVal, name) => {
    try {
      const existing = await base44.entities.Score.filter({ created_by_id: myId }, "-level", 1);
      if (existing.length) {
        const s = existing[0];
        if (reachedLevel > s.level || (reachedLevel === s.level && streakVal > s.streak)) {
          await base44.entities.Score.update(s.id, {
            level: reachedLevel,
            streak: streakVal,
            player_name: name,
          });
        }
      } else {
        await base44.entities.Score.create({
          player_name: name,
          level: reachedLevel,
          streak: streakVal,
        });
      }
    } catch (e) {
      /* ignore */
    }
  }, [myId]);

  const handleGameOver = useCallback(async () => {
    const reachedLevel = level;
    const streakVal = streak;
    if (await checkQualifies(reachedLevel, streakVal)) {
      if (displayName) {
        await submitScore(reachedLevel, streakVal, displayName);
        setModal("gameover");
      } else {
        setPendingScore({ level: reachedLevel, streak: streakVal });
        setModal("nameprompt");
      }
    } else {
      setModal("gameover");
    }
  }, [level, streak, displayName, checkQualifies, submitScore]);

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
      handleGameOver();
    } else {
      setLives(nl);
      setResetToken((t) => t + 1);
    }
  }, [handleGameOver]);

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

  const onNameSubmit = async (name) => {
    setDisplayName(name);
    if (pendingScore) await submitScore(pendingScore.level, pendingScore.streak, name);
    setPendingScore(null);
    setModal("gameover");
  };

  const onNameSkip = async () => {
    const name = generateGoofyName();
    setDisplayName(name);
    if (pendingScore) await submitScore(pendingScore.level, pendingScore.streak, name);
    setPendingScore(null);
    setModal("gameover");
  };

  const startPlay = () => {
    if (lives <= 0) {
      setLevel(1);
      setLives(3);
      setStreak(0);
    }
    setModal(null);
    setAd(null);
    setScreen("play");
    setRunning(true);
    setResetToken((t) => t + 1);
  };

  const goHome = () => {
    setRunning(false);
    setScreen("menu");
    setModal(null);
    setAd(null);
  };

  const skinObj = getSkin(skin);
  const cfg = getLevelConfig(level);

  if (screen === "menu") {
    return (
      <div className="relative">
        <MainMenu
          bestLevel={bestLevel}
          bestStreak={bestStreak}
          skinObj={skinObj}
          onPlay={startPlay}
          onCosmetics={() => setScreen("cosmetics")}
          onBoard={() => setShowBoard(true)}
        />
        <AnimatePresence>
          {showBoard && (
            <LeaderboardModal myId={myId} onClose={() => setShowBoard(false)} />
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (screen === "cosmetics") {
    return (
      <CosmeticsScreen
        bestLevel={bestLevel}
        skin={skin}
        setSkin={setSkin}
        wallColor={wallColor}
        setWallColor={setWallColor}
        bgColor={bgColor}
        setBgColor={setBgColor}
        onBack={() => setScreen("menu")}
      />
    );
  }

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-slate-950 text-white">
      <Header
        level={level}
        lives={lives}
        streak={streak}
        bestStreak={bestStreak}
        difficultyPct={cfg.difficultyPct}
        onOpenBoard={() => setShowBoard(true)}
      />

      <main className="flex flex-1 flex-col px-4 pb-4 pt-2">
        <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col gap-2">
          <p className="text-center text-xs text-white/40">
            Drag the pad below to steer — reach the glowing exit before time runs out.
          </p>
          <div className="relative min-h-0 flex-1">
            <MazeCanvas
              pointer={pointer}
              level={level}
              running={running}
              resetToken={resetToken}
              onLevelComplete={handleLevelComplete}
              onLifeLost={handleLifeLost}
              skinColor={skinObj.color}
              skinStar={!!skinObj.star}
              wallColor={wallColor}
              bgColor={bgColor}
            />
            <AnimatePresence>
              {modal === "levelcomplete" && (
                <LevelCompleteModal level={level} onNext={nextLevel} />
              )}
              {modal === "nameprompt" && (
                <NamePromptModal
                  defaultValue={myName}
                  score={pendingScore}
                  onSubmit={onNameSubmit}
                  onSkip={onNameSkip}
                />
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
          <div className="relative h-32 shrink-0">
            <ControlPad pointer={pointer} disabled={!running} />
            <button
              onClick={goHome}
              className="absolute bottom-2 left-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/80 text-white/80 ring-1 ring-white/10 backdrop-blur transition hover:bg-slate-700 hover:text-white"
              title="Main Menu"
            >
              <HomeIcon className="h-4 w-4" />
            </button>
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