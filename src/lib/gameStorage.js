const KEY = "mazerush_state_v1";

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      const num = (v, d) => (Number.isFinite(v) && v >= 0 ? v : d);
      return {
        level: num(p.level, 1),
        lives: num(p.lives, 3),
        streak: num(p.streak, 0),
        bestStreak: num(p.bestStreak, 0),
      };
    }
  } catch (e) {
    /* ignore */
  }
  return { level: 1, lives: 3, streak: 0, bestStreak: 0 };
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    /* ignore */
  }
}