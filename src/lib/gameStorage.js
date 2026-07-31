const KEY = "mazerush_state_v1";

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        level: Number.isFinite(parsed.level) && parsed.level >= 1 ? parsed.level : 1,
        lives: Number.isFinite(parsed.lives) && parsed.lives >= 0 ? parsed.lives : 3,
      };
    }
  } catch (e) {
    /* ignore */
  }
  return { level: 1, lives: 3 };
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    /* ignore */
  }
}

export function clearState() {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    /* ignore */
  }
}