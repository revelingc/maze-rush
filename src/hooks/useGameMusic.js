import { useEffect } from "react";
import { getMusicEngine } from "@/lib/musicEngine";

// Drives the background music engine: starts on the play screen, stops elsewhere,
// and keeps volume/enabled state synced with settings.
export function useGameMusic({ screen, enabled, volume }) {
  const engine = getMusicEngine();

  useEffect(() => {
    if (screen === "/play" && enabled) {
      engine.setVolume(volume);
      engine.setEnabled(true);
      engine.start();
    } else {
      engine.stop();
    }
    return () => {
      if (screen !== "/play") engine.stop();
    };
  }, [screen, enabled, engine]);

  useEffect(() => {
    engine.setVolume(volume);
  }, [volume, engine]);

  useEffect(() => {
    engine.setEnabled(enabled);
  }, [enabled, engine]);
}