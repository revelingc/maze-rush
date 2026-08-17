import { base44 } from "@/api/base44Client";
import { loadHighScores, addHighScore } from "@/lib/gameStorage";

const GLOBAL_FETCH = 200;
const BOARD_SIZE = 50;

// Collapse to one entry per player (their best run), sorted level-then-streak.
function dedupeAndSort(rows) {
  const best = new Map();
  for (const r of rows || []) {
    const name = ((r && r.player_name) || "Runner").trim() || "Runner";
    const cur = best.get(name);
    const better =
      !cur ||
      (r.level || 0) > (cur.level || 0) ||
      ((r.level || 0) === (cur.level || 0) && (r.streak || 0) > (cur.streak || 0));
    if (better) best.set(name, { player_name: name, level: r.level || 0, streak: r.streak || 0 });
  }
  return [...best.values()]
    .sort((a, b) => (b.level || 0) - (a.level || 0) || (b.streak || 0) - (a.streak || 0))
    .slice(0, BOARD_SIZE);
}

// Loads the global board; falls back to the locally-cached board when offline
// or the user isn't authenticated so the feature never breaks.
export async function fetchLeaderboard() {
  try {
    const rows = await base44.entities.Score.list("-level", GLOBAL_FETCH);
    return dedupeAndSort(rows);
  } catch (e) {
    return loadHighScores();
  }
}

// Posts a score to the global board and caches it locally (for offline display).
// Only call on a new personal best — see checkQualifies in Home.
export async function submitScoreGlobal({ player_name, level, streak }) {
  addHighScore({ player_name, level, streak });
  try {
    await base44.entities.Score.create({ player_name, level, streak: streak || 0 });
    return true;
  } catch (e) {
    return false;
  }
}

// Re-tags all of this user's global entries with a new name. RLS scopes the
// update to records they own, so an empty filter only touches their own scores.
export async function renamePlayerGlobal(newName) {
  try {
    await base44.entities.Score.updateMany({}, { $set: { player_name: newName } });
  } catch (e) {
    /* offline — the local rename applied by the caller is enough */
  }
}