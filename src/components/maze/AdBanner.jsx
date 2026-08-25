import React, { useEffect, useState } from "react";
import { ADMOB_APP_ID, ADMOB_BANNER_AD_UNIT_ID } from "@/lib/adConfig";

// Bottom banner ad. When Maze Rush runs as an installed app, the native shell
// initializes the Google Mobile Ads SDK with ADMOB_APP_ID and renders a real
// banner (using ADMOB_BANNER_AD_UNIT_ID) in the reserved area below. In the
// web builder preview there is no native ad layer, so a placeholder is shown.
// Ad-free users never see the banner.
export default function AdBanner({ adFree }) {
  const [native, setNative] = useState(false);

  useEffect(() => {
    if (adFree) return;
    const bridge = window.NativeAdMob;
    if (bridge && typeof bridge.showBanner === "function") {
      setNative(true);
      bridge.showBanner({ appId: ADMOB_APP_ID, adUnitId: ADMOB_BANNER_AD_UNIT_ID, position: "bottom" });
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