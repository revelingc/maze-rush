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
      };
    }
  } catch (e) {
    /* ignore */
  }
  return {
    level: 1, lives: 3, streak: 0, bestStreak: 0, bestLevel: 1,
    skin: "default", wallColor: "#39496B", bgColor: "#0B0F1A",
    hazardColor: "#FB7185", laserColor: "#22D3EE", hunterColor: "#A855F7",
    starOwned: false, seenIntros: [],
    displayName: null,
    adFree: false,
  };
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    /* ignore */
  }
}