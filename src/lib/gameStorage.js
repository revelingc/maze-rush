const KEY = "mazerush_state_v1";

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      const num = (v, d) => (Number.isFinite(v) && v >= 0 ? v : d);
      const str = (v, d) => (typeof v === "string" && v.length ? v : d);
      return {
        level: num(p.level, 1),
        lives: num(p.lives, 3),
        streak: num(p.streak, 0),
        bestStreak: num(p.bestStreak, 0),
        bestLevel: num(p.bestLevel, 1),
        cycle: num(p.cycle, 1),
        skin: str(p.skin, "default"),
        wallColor: str(p.wallColor, "#39496B"),
        bgColor: str(p.bgColor, "#0B0F1A"),
        hazardColor: str(p.hazardColor, "#FB7185"),
        laserColor: str(p.laserColor, "#22D3EE"),
        hunterColor: str(p.hunterColor, "#A855F7"),
        starOwned: !!p.starOwned,
        seenIntros: Array.isArray(p.seenIntros) ? p.seenIntros : [],
        displayName: str(p.displayName, null),
        adFree: !!p.adFree,
        trail: str(p.trail, null),
        trailsOwned: Array.isArray(p.trailsOwned) ? p.trailsOwned : [],
      };
    }
  } catch (e) {
    /* ignore */
  }
  return {
    level: 1, lives: 3, streak: 0, bestStreak: 0, bestLevel: 1, cycle: 1,
    skin: "default", wallColor: "#39496B", bgColor: "#0B0F1A",
    hazardColor: "#FB7185", laserColor: "#22D3EE", hunterColor: "#A855F7",
    starOwned: false, seenIntros: [],
    displayName: null,
    adFree: false,
    trail: null,
    trailsOwned: [],
  };
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    /* ignore */
  }
}

const SCORES_KEY = "mazerush_highscores_v1";

export function loadHighScores() {
  try {
    const raw = localStorage.getItem(SCORES_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((s) => s && typeof s.player_name === "string" && Number.isFinite(s.level))
      .sort((a, b) => b.level - a.level || (b.streak || 0) - (a.streak || 0))
      .slice(0, 50);
  } catch (e) {
    return [];
  }
}

export function addHighScore(entry) {
  try {
    const arr = loadHighScores();
    arr.push({ player_name: entry.player_name, level: entry.level, streak: entry.streak || 0 });
    arr.sort((a, b) => b.level - a.level || (b.streak || 0) - (a.streak || 0));
    localStorage.setItem(SCORES_KEY, JSON.stringify(arr.slice(0, 50)));
  } catch (e) {
    /* ignore */
  }
}

// Re-tags all of a player's existing leaderboard entries with a new name.
export function renamePlayer(oldName, newName) {
  if (!oldName || !newName || oldName === newName) return;
  try {
    const arr = loadHighScores();
    let changed = false;
    for (const s of arr) {
      if (s.player_name === oldName) { s.player_name = newName; changed = true; }
    }
    if (changed) localStorage.setItem(SCORES_KEY, JSON.stringify(arr.slice(0, 50)));
  } catch (e) {
    /* ignore */
  }
}

const TIMES_KEY = "mazerush_besttimes_v1";

export function loadBestTimes() {
  try {
    const raw = localStorage.getItem(TIMES_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return obj && typeof obj === "object" ? obj : {};
  } catch (e) {
    return {};
  }
}

// Records the fastest clear time for a level. Returns true when it's a new best.
export function setBestTime(level, seconds) {
  try {
    const obj = loadBestTimes();
    const prev = obj[level];
    if (prev == null || seconds < prev) {
      obj[level] = seconds;
      localStorage.setItem(TIMES_KEY, JSON.stringify(obj));
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

const SETTINGS_KEY = "mazerush_settings_v1";

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      const num = (v, d) => (Number.isFinite(v) ? v : d);
      const curve = typeof p.steerCurve === "string" && ["linear", "smooth", "precise"].includes(p.steerCurve) ? p.steerCurve : "linear";
      return {
        hapticsEnabled: p.hapticsEnabled !== false,
        vibrationAmount: num(p.vibrationAmount, 30),
        colorblind: !!p.colorblind,
        reducedMotion: !!p.reducedMotion,
        account: p.account || null,
        steerDeadZone: num(p.steerDeadZone, 8),
        steerSensitivity: num(p.steerSensitivity, 1),
        steerCurve: curve,
      };
    }
  } catch (e) {
    /* ignore */
  }
  return { hapticsEnabled: true, vibrationAmount: 30, colorblind: false, reducedMotion: false, account: null, steerDeadZone: 8, steerSensitivity: 1, steerCurve: "linear" };
}

export function saveSettings(s) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch (e) {
    /* ignore */
  }
}

// Clears all locally-stored game data (used by account deletion).
export function clearAllData() {
  [KEY, SCORES_KEY, TIMES_KEY, SETTINGS_KEY].forEach((k) => {
    try { localStorage.removeItem(k); } catch (e) { /* ignore */ }
  });
}