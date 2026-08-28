// Native account sync bridge.
//
// When Maze Rush is published as an installed app, the host OS shell exposes
// an account bridge on window so the player can sign in with their platform
// account (Apple/iCloud on iOS, Google on Android). The signed-in identity is
// used as the player's display name for the local leaderboard and pairs with
// the native store for purchase continuity. In the web builder preview no
// store account is available, so we resolve with an "unavailable" status the
// UI can surface gracefully.
//
// Expected native contract (injected by the published shell):
//   window.NativeAccountSync.signIn()  -> Promise<{ ok, provider, account: { id, name?, email? } }>
//   window.NativeAccountSync.signOut() -> Promise<{ ok }>

export async function signIn() {
  try {
    const bridge = window.NativeAccountSync;
    if (bridge && typeof bridge.signIn === "function") {
      return await bridge.signIn();
    }
    return { ok: false, reason: "unavailable" };
  } catch (e) {
    return { ok: false, reason: "error" };
  }
}

export async function signOut() {
  try {
    const bridge = window.NativeAccountSync;
    if (bridge && typeof bridge.signOut === "function") {
      await bridge.signOut();
    }
    return { ok: true };
  } catch (e) {
    return { ok: false };
  }
}

export function detectPlatform() {
  if (typeof navigator === "undefined") return "android";
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const isAppleMobile = /iphone|ipad|ipod|ios/i.test(ua);
  const isIPadOS = platform === "MacIntel" && navigator.maxTouchPoints > 1;
  const isMac = /macintosh|mac os x/i.test(ua) || platform === "MacIntel";
  // Any Apple device (iPhone, iPad, iPadOS, macOS) resolves to the Apple family.
  return isAppleMobile || isIPadOS || isMac ? "ios" : "android";
}