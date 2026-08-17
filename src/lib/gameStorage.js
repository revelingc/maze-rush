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
        lives: num(p.lives, 5),
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
    level: 1, lives: 5, streak: 0, bestStreak: 0, bestLevel: 1, cycle: 1,
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

const GHOSTS_KEY = "mazerush_ghosts_v1";

export function loadGhosts() {
  try {
    const raw = localStorage.getItem(GHOSTS_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return obj && typeof obj === "object" ? obj : {};
  } catch (e) {
    return {};
  }
}

// Stores the fastest-run path for a level (cell-space coords, resolution-independent).
// Only overwrites when the new time beats the stored one.
export function setGhost(level, time, path) {
  try {
    const obj = loadGhosts();
    const prev = obj[level];
    if (!prev || time < prev.time) {
      obj[level] = { time, path };
      localStorage.setItem(GHOSTS_KEY, JSON.stringify(obj));
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
        musicEnabled: p.musicEnabled !== false,
        musicVolume: num(p.musicVolume, 0.6),
      };
    }
  } catch (e) {
    /* ignore */
  }
  return { hapticsEnabled: true, vibrationAmount: 30, colorblind: false, reducedMotion: false, account: null, steerDeadZone: 8, steerSensitivity: 1, steerCurve: "linear", musicEnabled: true, musicVolume: 0.6 };
}

export function saveSettings(s) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch (e) {
    /* ignore */
  }
}

const SHARES_KEY = "mazerush_shares_v1";

export const SHARES_TO_UNLOCK_HEARTS = 10;

// Ambiguous chars (0/O, 1/I) removed so codes read cleanly when shared aloud.
const SHARE_ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function genShareCode() {
  let s = "";
  for (let i = 0; i < 6; i++) s += SHARE_ALPHA[Math.floor(Math.random() * SHARE_ALPHA.length)];
  return s;
}

export function loadShares() {
  try {
    const raw = localStorage.getItem(SHARES_KEY);
    const p = raw ? JSON.parse(raw) : {};
    if (typeof p !== "object" || !p) return { code: genShareCode(), confirmed: 0 };
    if (!p.code || typeof p.code !== "string") p.code = genShareCode();
    const c = Number(p.confirmed);
    p.confirmed = Number.isFinite(c) && c >= 0 ? Math.floor(c) : 0;
    return p;
  } catch (e) {
    return { code: genShareCode(), confirmed: 0 };
  }
}

export function saveShares(s) {
  try { localStorage.setItem(SHARES_KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
}

// Lazily generates + persists a stable share code for this device.
export function getShareCode() {
  const s = loadShares();
  saveShares(s);
  return s.code;
}

export function getConfirmedShares() {
  return loadShares().confirmed || 0;
}

// Increments the confirmed-share count and returns the new total.
export function addConfirmedShare() {
  const s = loadShares();
  s.confirmed = (s.confirmed || 0) + 1;
  saveShares(s);
  return s.confirmed;
}

// Clears all locally-stored game data (used by account deletion).
export function clearAllData() {
  [KEY, SCORES_KEY, TIMES_KEY, GHOSTS_KEY, SETTINGS_KEY, SHARES_KEY].forEach((k) => {
    try { localStorage.removeItem(k); } catch (e) { /* ignore */ }
  });
}

// Clears purchase-related unlocks (ad-free, Shooting Star skin, trails) while
// keeping level progress, streaks, scores, and settings intact.
export function resetPurchases() {
  try {
    const s = loadState();
    s.starOwned = false;
    s.adFree = false;
    s.trailsOwned = [];
    s.trail = null;
    if (s.skin === "star") s.skin = "default";
    saveState(s);
    return true;
  } catch (e) {
    return false;
  }
}