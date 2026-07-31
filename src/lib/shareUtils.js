// Share a Maze Rush result via the Web Share API, falling back to a Twitter/X
// intent when the native share sheet isn't available (desktop browsers).
export async function shareResult({ level, streak, bestStreak }) {
  const streakPart = streak ? ` on a ${streak}-streak` : "";
  const text = `I reached Level ${level}${streakPart} in Maze Rush! 🏃‍♂️💨 Can you beat me?`;
  const url = typeof window !== "undefined" ? window.location.href : "";

  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title: "Maze Rush", text, url });
      return true;
    }
  } catch (e) {
    return false; // user dismissed the sheet — don't fall through to popup
  }

  try {
    const t = encodeURIComponent(text);
    const u = encodeURIComponent(url);
    window.open(`https://twitter.com/intent/tweet?text=${t}&url=${u}`, "_blank", "noopener,noreferrer");
    return true;
  } catch (e) {
    return false;
  }
}