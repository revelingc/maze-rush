import React, { useEffect, useState } from "react";

// Google Mobile Ads (AdMob) app id. When Maze Rush runs as an installed app
// the native shell initializes the Google SDK with this id and renders a real
// banner ad in the reserved area below. In the web builder preview there is no
// native ad layer, so a styled placeholder is shown instead.
const ADMOB_APP_ID = "ca-app-pub-3520421213819679~1862476035";

export default function AdBanner({ adFree }) {
  const [native, setNative] = useState(false);

  useEffect(() => {
    if (adFree) return;
    const bridge = window.NativeAdMob;
    if (bridge && typeof bridge.showBanner === "function") {
      setNative(true);
      bridge.showBanner({ appId: ADMOB_APP_ID, position: "bottom" });
      return () => {
        if (typeof bridge.hideBanner === "function") bridge.hideBanner();
      };
    }
  }, [adFree]);

  if (adFree) return null;

  // Standard banner height (~50px) + a little breathing room.
  return (
    <div className="mx-auto h-[56px] w-full max-w-md shrink-0" aria-label="Advertisement">
      {native ? (
        // The native layer paints the real Google ad banner in this reserved space.
        <div className="h-full w-full" />
      ) : (
        <div className="flex h-full items-center justify-center rounded-xl bg-white/5 text-[11px] uppercase tracking-[0.2em] text-white/30 ring-1 ring-white/10">
          Ad
        </div>
      )}
    </div>
  );
}