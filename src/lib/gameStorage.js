import { TRAILS } from "@/lib/trails";

const ALL_TRAIL_IDS = TRAILS.map((t) => t.id);

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
        lives: 6,
        streak: num(p.streak, 0),
        bestStreak: num(p.bestStreak, 0),
        bestLevel: num(p.bestLevel, 1),
        skin: str(p.skin, "default"),
        wallColor: str(p.wallColor, "#39496B"),
        bgColor: str(p.bgColor, "#0B0F1A"),
        hazardColor: str(p.hazardColor, "#FB7185"),
        laserColor: str(p.laserColor, "#22D3EE"),
        hunterColor: str(p.hunterColor, "#A855F7"),
        seenIntros: Array.isArray(p.seenIntros) ? p.seenIntros : [],
        displayName: str(p.displayName, null),
        // All purchasable items are assumed purchased.
        starOwned: true,
        adFree: true,
        trail: str(p.trail, null),
        trailsOwned: ALL_TRAIL_IDS,
      };
    }
  } catch (e) {
    /* ignore */
  }
  return {
    level: 1, lives: 6, streak: 0, bestStreak: 0, bestLevel: 1,
    skin: "default", wallColor: "#39496B", bgColor: "#0B0F1A",
    hazardColor: "#FB7185", laserColor: "#22D3EE", hunterColor: "#A855F7",
    seenIntros: [],
    displayName: null,
    starOwned: true,
    adFree: true,
    trail: null,
    trailsOwned: ALL_TRAIL_IDS,
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
      return {
        hapticsEnabled: p.hapticsEnabled !== false,
        vibrationAmount: num(p.vibrationAmount, 30),
        colorblind: !!p.colorblind,
        reducedMotion: !!p.reducedMotion,
        account: p.account || null,
      };
    }
  } catch (e) {
    /* ignore */
  }
  return { hapticsEnabled: true, vibrationAmount: 30, colorblind: false, reducedMotion: false, account: null };
}

export function saveSettings(s) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch (e) {
    /* ignore */
  }
}