import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Zap, Gauge, Flame, Trophy, Home as HomeIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import MazeCanvas from "@/components/maze/MazeCanvas";
import AdOverlay from "@/components/maze/AdOverlay";
import GameOverModal from "@/components/maze/GameOverModal";
import LevelCompleteModal from "@/components/maze/LevelCompleteModal";
import LevelSelectModal from "@/components/maze/LevelSelectModal";
import ControlPad from "@/components/maze/ControlPad";
import MainMenu from "@/components/maze/MainMenu";
import CosmeticsScreen from "@/components/maze/CosmeticsScreen";
import ObstacleIntroModal from "@/components/maze/ObstacleIntroModal";
import { loadState, saveState, loadBestTimes, setBestTime, loadSettings, saveSettings, loadGhosts, setGhost, getConfirmedShares } from "@/lib/gameStorage";
import { purchaseProduct } from "@/lib/nativePurchase";
import { getTrail, TRAILS } from "@/lib/trails";
import { shareResult } from "@/lib/shareUtils";
import { getLevelConfig } from "@/lib/mazeGenerator";
import { getBiome } from "@/lib/biomes";
import { getSkin } from "@/lib/skins";
import StatsScreen from "@/components/maze/StatsScreen";
import ShareScreen from "@/components/maze/ShareScreen";
import SettingsScreen from "@/components/maze/SettingsScreen";
import { useGameMusic } from "@/hooks/useGameMusic";
import { getMusicEngine } from "@/lib/musicEngine";

export default function Home() {
  const initial = loadState();
  const location = useLocation();
  const navigate = useNavigate();
  const screen = location.pathname;
  const [level, setLevel] = useState(initial.level);
  const [lives, setLives] = useState(initial.lives);
  const [streak, setStreak] = useState(initial.streak);
  const [bestStreak, setBestStreak] = useState(initial.bestStreak);
  const [bestLevel, setBestLevel] = useState(initial.bestLevel);
  const [cycle, setCycle] = useState(initial.cycle || 1);
  const [skin, setSkin] = useState(initial.skin || "default");
  const [wallColor, setWallColor] = useState(initial.wallColor || "#39496B");
  const [bgColor, setBgColor] = useState(initial.bgColor || "#0B0F1A");
  const [hazardColor, setHazardColor] = useState(initial.hazardColor || "#FB7185");
  const [laserColor, setLaserColor] = useState(initial.laserColor || "#22D3EE");
  const [hunterColor, setHunterColor] = useState(initial.hunterColor || "#A855F7");
  const [starOwned, setStarOwned] = useState(!!initial.starOwned);
  const [adFree, setAdFree] = useState(!!initial.adFree);
  const [trail, setTrail] = useState(initial.trail || null);
  const [trailsOwned, setTrailsOwned] = useState(initial.trailsOwned || []);
  const [seenIntros, setSeenIntros] = useState(initial.seenIntros || []);
  const [intro, setIntro] = useState(null);
  const [running, setRunning] = useState(true);
  const [resetToken, setResetToken] = useState(0);
  const [modal, setModal] = useState(null);
  const [ad, setAd] = useState(null);
  const [adUsed, setAdUsed] = useState(false);
  const [buying, setBuying] = useState(false);
  const [bestTimes, setBestTimes] = useState(() => loadBestTimes());
  const [ghosts, setGhosts] = useState(() => loadGhosts());
  const [showLevels, setShowLevels] = useState(false);
  const [pendingJump, setPendingJump] = useState(null);
  const [lastTime, setLastTime] = useState(null);
  const [settings, setSettings] = useState(() => loadSettings());
  const [confirmedShares, setConfirmedShares] = useState(() => getConfirmedShares());

  const livesRef = useRef(lives);
  livesRef.current = lives;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useGameMusic({
    screen,
    enabled: settings.musicEnabled,
    volume: settings.musicVolume,
  });
  const pointer = useRef({ active: false, ax: 0, ay: 0, x: 0, y: 0, maxR: 70 });

  useEffect(() => {
    saveState({ level, lives, streak, bestStreak, bestLevel, cycle, skin, wallColor, bgColor, hazardColor, laserColor, hunterColor, starOwned, seenIntros, adFree, trail, trailsOwned });
  }, [level, lives, streak, bestStreak, bestLevel, cycle, skin, wallColor, bgColor, starOwned, seenIntros, adFree, trail, trailsOwned]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (level > bestLevel) setBestLevel(level);
  }, [level, bestLevel]);

  // Show a one-time intro overlay the first time an obstacle type appears in
  // the current level (covers players who start a run past the debut level).
  useEffect(() => {
    if (screen !== "/play") return;
    const cfg = getLevelConfig(level, cycle);
    const present = [];
    if (cfg.hazards > 0) present.push("hazards");
    if (cfg.lasers > 0) present.push("lasers");
    if (cfg.hunters > 0) present.push("hunters");
    const ghostKey = ghosts[level]?.path && !seenIntros.includes("ghost") ? "ghost" : null;
    const key = present.find((k) => !seenIntros.includes(k)) || ghostKey;
    if (key) {
      setIntro(key);
      setRunning(false);
    }
  }, [screen, level, cycle, seenIntros, ghosts]);

  const handleGameOver = useCallback(() => {
    setRunning(false);
    setModal("gameover");
  }, []);

  const handleLevelComplete = useCallback((elapsed, path) => {
    setRunning(false);
    setStreak((s) => s + 1);
    setBestStreak((b) => Math.max(b, streak + 1));
    const secs = Math.max(0, elapsed || 0);
    const isRecord = setBestTime(level, secs);
    if (isRecord && path && path.length) {
      setGhost(level, secs, path);
      setGhosts(loadGhosts());
    }
    setLastTime({ secs, isRecord });
    setBestTimes(loadBestTimes());
    setModal("levelcomplete");
  }, [streak, level]);

  const handleLifeLost = useCallback(() => {
    const s = settingsRef.current;
    if (s.hapticsEnabled && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(Math.max(10, Math.round(s.vibrationAmount)));
    }
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
    if (level >= 100) {
      // Completing level 100 resets the run and bumps the base difficulty +50%.
      setLevel(1);
      setCycle((c) => c + 1);
      setModal(null);
      setRunning(true);
      setResetToken((t) => t + 1);
      return;
    }
    setLevel((l) => l + 1);
    setModal(null);
    setRunning(true);
  };

  const restart = () => {
    setLevel(1);
    setLives(adFree ? 10 : 5);
    setStreak(0);
    setAdUsed(false);
    setModal(null);
    setRunning(true);
    setResetToken((t) => t + 1);
  };

  const watchAd = (type) => {
    setModal(null);
    setAd(type);
  };

  const onAdComplete = () => {
    setAd(null);
    if (pendingJump != null) {
      const n = pendingJump;
      setPendingJump(null);
      beginPlayAt(n);
      return;
    }
    const gain = ad === "premium" ? 10 : 5;
    setAdUsed(true);
    setLives((l) => l + gain);
    setRunning(true);
    setResetToken((t) => t + 1);
  };

  const startPlay = () => {
    // Unlock the AudioContext inside the user gesture so background music
    // can actually play (browsers block audio started outside a gesture).
    if (settings.musicEnabled) {
      const eng = getMusicEngine();
      eng.setVolume(settings.musicVolume);
      eng.setEnabled(true);
      eng.start();
    }
    if (lives <= 0) {
      setLevel(1);
      setLives(adFree ? 10 : 5);
      setStreak(0);
      setAdUsed(false);
    }
    setModal(null);
    setAd(null);
    navigate("/play");
    setRunning(true);
    setResetToken((t) => t + 1);
  };

  const beginPlayAt = (n) => {
    if (settings.musicEnabled) {
      const eng = getMusicEngine();
      eng.setVolume(settings.musicVolume);
      eng.setEnabled(true);
      eng.start();
    }
    setLevel(n);
    if (lives <= 0) {
      setLives(adFree ? 10 : 5);
      setStreak(0);
      setAdUsed(false);
    } else if (adFree) {
      setLives(10);
    }
    setShowLevels(false);
    setModal(null);
    setAd(null);
    navigate("/play");
    setRunning(true);
    setResetToken((t) => t + 1);
  };

  // Free-to-play players must watch an ad to jump forward in the level list
  // (starting at a level past their current run position). Ad-free is exempt.
  const startPlayAt = (n) => {
    if (!adFree) {
      setPendingJump(n);
      setAd("leveljump");
      setShowLevels(false);
      return;
    }
    beginPlayAt(n);
  };

  const goHome = () => {
    setRunning(false);
    navigate("/");
    setModal(null);
    setAd(null);
  };

  const dismissIntro = () => {
    setSeenIntros((s) => (s.includes(intro) ? s : [...s, intro]));
    setIntro(null);
    setRunning(true);
  };

  const handleBuyStar = async () => {
    setBuying(true);
    try {
      const res = await purchaseProduct("star");
      if (res?.ok) setStarOwned(true);
      else if (res?.reason === "unavailable")
        alert("In-app purchases are available in the installed app.");
    } finally {
      setBuying(false);
    }
  };

  const handleBuyAdFree = async () => {
    setBuying(true);
    try {
      const res = await purchaseProduct("adfree");
      if (res?.ok) {
        setAdFree(true);
        setLives(10);
        setLevel(1);
        setStreak(0);
        setAdUsed(false);
        setResetToken((t) => t + 1);
      } else if (res?.reason === "unavailable") {
        alert("In-app purchases are available in the installed app.");
      }
    } finally {
      setBuying(false);
    }
  };

  const handleBuyTrail = async (t) => {
    setBuying(true);
    try {
      const res = await purchaseProduct(`trail_${t.id}`);
      if (res?.ok) {
        setTrailsOwned((o) => (o.includes(t.id) ? o : [...o, t.id]));
      } else if (res?.reason === "unavailable") {
        alert("In-app purchases are available in the installed app.");
      }
    } finally {
      setBuying(false);
    }
  };

  const handleBuyBundle = async (bundleId) => {
    setBuying(true);
    try {
      const res = await purchaseProduct(bundleId);
      if (!res?.ok) {
        if (res?.reason === "unavailable") alert("In-app purchases are available in the installed app.");
        return;
      }
      const allTrailIds = TRAILS.map((t) => t.id);
      if (bundleId === "bundle_star_stardust") {
        setStarOwned(true);
        setTrailsOwned((o) => (o.includes("stardust") ? o : [...o, "stardust"]));
      } else if (bundleId === "bundle_consumables") {
        setAdFree(true);
        setTrailsOwned(allTrailIds);
        setLives(10);
        setLevel(1);
        setStreak(0);
        setAdUsed(false);
        setResetToken((t) => t + 1);
      } else if (bundleId === "bundle_everything") {
        setStarOwned(true);
        setAdFree(true);
        setTrailsOwned(allTrailIds);
        setLives(10);
        setLevel(1);
        setStreak(0);
        setAdUsed(false);
        setResetToken((t) => t + 1);
      }
    } finally {
      setBuying(false);
    }
  };

  const handleShare = useCallback(async () => {
    await shareResult({ level, streak, bestStreak });
  }, [level, streak, bestStreak]);

  const handleShareConfirmed = useCallback((n) => setConfirmedShares(n), []);

  // Pull-to-refresh: re-read locally-stored progress and unlocks.
  const refreshStats = useCallback(async () => {
    const s = loadState();
    setBestLevel(s.bestLevel);
    setBestStreak(s.bestStreak);
    setBestTimes(loadBestTimes());
  }, []);

  const refreshCosmetics = useCallback(async () => {
    const s = loadState();
    setStarOwned(!!s.starOwned);
    setTrailsOwned(s.trailsOwned || []);
    setAdFree(!!s.adFree);
    setBestLevel(s.bestLevel);
    setSkin(s.skin);
    setWallColor(s.wallColor);
    setBgColor(s.bgColor);
    setHazardColor(s.hazardColor);
    setLaserColor(s.laserColor);
    setHunterColor(s.hunterColor);
    setConfirmedShares(getConfirmedShares());
  }, []);

  const handleAccount = useCallback((account) => {
    setSettings((s) => ({ ...s, account }));
  }, []);

  const skinObj = getSkin(skin);
  const cfg = getLevelConfig(level, cycle);
  const biome = getBiome(cycle);
  const cb = settings.colorblind;
  const effHazard = cb ? "#F0E442" : hazardColor;
  const effLaser = cb ? "#0072B2" : laserColor;
  const effHunter = cb ? "#D55E00" : hunterColor;
  const trailCfg = trail ? getTrail(trail) : null;

  if (screen === "/") {
    return (
      <div className="relative">
        <MainMenu
          bestLevel={bestLevel}
          bestStreak={bestStreak}
          skinObj={skinObj}
          onPlay={startPlay}
          onLevels={() => setShowLevels(true)}
          onCosmetics={() => navigate("/cosmetics")}
          onShare={() => navigate("/share")}
          onStats={() => navigate("/stats")}
          onSettings={() => navigate("/settings")}
          adFree={adFree}
          onBuyAdFree={handleBuyAdFree}
        />
        <AnimatePresence>
          {showLevels && (
            <LevelSelectModal bestLevel={bestLevel} onSelect={startPlayAt} onClose={() => setShowLevels(false)} />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {ad && <AdOverlay type={ad} onComplete={onAdComplete} />}
        </AnimatePresence>
      </div>
    );
  }

  if (screen === "/cosmetics") {
    return (
      <CosmeticsScreen
        bestLevel={bestLevel}
        confirmedShares={confirmedShares}
        onGoShare={() => navigate("/share")}
        skin={skin}
        setSkin={setSkin}
        wallColor={wallColor}
        setWallColor={setWallColor}
        bgColor={bgColor}
        setBgColor={setBgColor}
        hazardColor={hazardColor}
        setHazardColor={setHazardColor}
        laserColor={laserColor}
        setLaserColor={setLaserColor}
        hunterColor={hunterColor}
        setHunterColor={setHunterColor}
        starOwned={starOwned}
        onBuyStar={handleBuyStar}
        trail={trail}
        setTrail={setTrail}
        trailsOwned={trailsOwned}
        onBuyTrail={handleBuyTrail}
        buying={buying}
        adFree={adFree}
        onBuyBundle={handleBuyBundle}
        onBack={() => navigate(-1)}
        onRefresh={refreshCosmetics}
      />
    );
  }

  if (screen === "/settings") {
    return (
      <SettingsScreen
        settings={settings}
        setSettings={setSettings}
        onAccount={handleAccount}
        onBack={() => navigate(-1)}
      />
    );
  }

  if (screen === "/stats") {
    return (
      <StatsScreen
        bestLevel={bestLevel}
        bestStreak={bestStreak}
        bestTimes={bestTimes}
        onShare={handleShare}
        onBack={() => navigate(-1)}
        onRefresh={refreshStats}
      />
    );
  }

  if (screen === "/share") {
    return (
      <ShareScreen
        confirmedShares={confirmedShares}
        onConfirmed={handleShareConfirmed}
        onBack={() => navigate("/")}
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
        biomeName={biome.name}
      />

      <main className="flex flex-1 flex-col px-4 pt-2 safe-pb-4">
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
              skinBlackhole={!!skinObj.blackhole}
              wallColor={wallColor}
              bgColor={bgColor}
              hazardColor={effHazard}
              laserColor={effLaser}
              hunterColor={effHunter}
              reducedMotion={settings.reducedMotion}
              trailStyle={trailCfg?.style || null}
              trailColor={trailCfg?.color || null}
              cycle={cycle}
              ghostPath={ghosts[level]?.path || null}
              deadZone={settings.steerDeadZone}
              sensitivity={settings.steerSensitivity}
              curve={settings.steerCurve}
            />
            <AnimatePresence>
              {modal === "levelcomplete" && (
                <LevelCompleteModal
                  level={level}
                  time={lastTime?.secs}
                  isRecord={!!lastTime?.isRecord}
                  cycleComplete={level >= 100}
                  nextCycle={cycle + 1}
                  onNext={nextLevel}
                />
              )}
              {modal === "gameover" && (
                <GameOverModal
                  level={level}
                  streak={streak}
                  canWatchAd={!adUsed && !adFree}
                  onWatchAd={watchAd}
                  onRestart={restart}
                  onShare={handleShare}
                />
              )}
              {ad && <AdOverlay type={ad} onComplete={onAdComplete} />}
              {intro && (
                <ObstacleIntroModal obstacleKey={intro} onContinue={dismissIntro} />
              )}
            </AnimatePresence>
          </div>
          <div className="relative h-32 shrink-0">
            <ControlPad pointer={pointer} disabled={!running} deadZone={settings.steerDeadZone} />
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

function Header({ level, lives, streak, bestStreak, difficultyPct, biomeName }) {
  return (
    <header className="px-5 safe-pt-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400/20 to-indigo-500/20 ring-1 ring-white/10">
            <Zap className="h-4 w-4 text-teal-300" />
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">
              Maze Rush
            </p>
            <p className="text-sm font-semibold">
              Lv {level}
              {biomeName ? <span className="ml-1 text-[11px] font-normal text-white/40">· {biomeName}</span> : null}
            </p>
          </div>
        </div>
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