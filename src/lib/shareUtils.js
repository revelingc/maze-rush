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

// Share a referral invite (with the user's code) via the native sheet on
// iOS/Android. Resolves true only when the user actually completes the share
// (navigator.share rejects if the sheet is cancelled) — that completed action
// counts as one confirmed share toward the Hearts trail.
export async function shareInvite({ code }) {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${base}/?ref=${code}`;
  const text = `Join me in Maze Rush! Use my code ${code} and race the clock. 🏃‍♂️💨`;
  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title: "Maze Rush", text, url });
      return true;
    }
  } catch (e) {
    return false; // user dismissed the sheet — not a confirmed share
  }
  // Desktop fallback: copy the invite to the clipboard (a completed action).
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    return true;
  } catch (e) {
    return false;
  }
}