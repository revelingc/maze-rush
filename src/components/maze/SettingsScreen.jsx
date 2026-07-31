import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Vibrate, Eye, Cloud, Check, Smartphone, LogOut } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { signIn as nativeSignIn, signOut as nativeSignOut, detectPlatform } from "@/lib/nativeAccount";

export default function SettingsScreen({ settings, setSettings, onAccount, onBack }) {
  const [connecting, setConnecting] = useState(false);
  const [msg, setMsg] = useState(null);
  const platform = detectPlatform();
  const providerLabel = platform === "ios" ? "Apple / iCloud" : "Google / Android";
  const account = settings.account;

  const update = (patch) => setSettings((s) => ({ ...s, ...patch }));

  const handleSignIn = async () => {
    setMsg(null);
    setConnecting(true);
    try {
      const res = await nativeSignIn();
      if (res?.ok && res.account) {
        onAccount({
          provider: res.provider || platform,
          name: res.account.name || res.account.email || "Player",
          id: res.account.id,
        });
      } else if (res?.reason === "unavailable") {
        setMsg("Account sync is available in the installed app.");
      } else {
        setMsg("Sign-in didn't complete. Try again.");
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleSignOut = async () => {
    await nativeSignOut();
    onAccount(null);
    setMsg(null);
  };

  return (
    <div className="relative flex h-[100dvh] flex-col bg-slate-950 px-6 text-white">
      <header className="flex items-center gap-3 pt-6 pb-4">
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/80 ring-1 ring-white/10 transition hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-semibold">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto pb-8">
        {/* Haptics */}
        <Section icon={<Vibrate className="h-4 w-4 text-rose-300" />} title="Haptics" subtitle="Vibration on death">
          <Row label="Haptic feedback">
            <Checkbox
              checked={settings.hapticsEnabled}
              onCheckedChange={(v) => update({ hapticsEnabled: !!v })}
              className="h-5 w-5"
            />
          </Row>
          <div className={settings.hapticsEnabled ? "" : "opacity-40 pointer-events-none"}>
            <Row label={`Vibration strength · ${settings.vibrationAmount}ms`}>
              <div className="w-40">
                <Slider
                  value={[settings.vibrationAmount]}
                  min={10}
                  max={100}
                  step={5}
                  onValueChange={(v) => update({ vibrationAmount: v[0] })}
                />
              </div>
            </Row>
            <TestButton
              onClick={() =>
                settings.hapticsEnabled &&
                typeof navigator !== "undefined" &&
                navigator.vibrate &&
                navigator.vibrate(settings.vibrationAmount)
              }
            />
          </div>
        </Section>

        {/* Accessibility */}
        <Section icon={<Eye className="h-4 w-4 text-sky-300" />} title="Accessibility" subtitle="Visual clarity">
          <Row label="Colorblind / high contrast" hint="Uses colorblind-safe hazard colors">
            <Checkbox
              checked={settings.colorblind}
              onCheckedChange={(v) => update({ colorblind: !!v })}
              className="h-5 w-5"
            />
          </Row>
          <Row label="Reduced motion" hint="Slows obstacles for a calmer run">
            <Checkbox
              checked={settings.reducedMotion}
              onCheckedChange={(v) => update({ reducedMotion: !!v })}
              className="h-5 w-5"
            />
          </Row>
        </Section>

        {/* Account */}
        <Section
          icon={<Cloud className="h-4 w-4 text-indigo-300" />}
          title="Account sync"
          subtitle="Leaderboard & purchases"
        >
          {account ? (
            <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/15 ring-1 ring-emerald-300/30">
                  <Check className="h-5 w-5 text-emerald-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{account.name}</p>
                  <p className="text-xs text-white/40">Connected · {account.provider}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-white/40">
                Your display name and purchases are linked to this account across the installed app.
              </p>
              <button
                onClick={handleSignOut}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-medium text-white/70 ring-1 ring-white/10 transition hover:bg-white/10"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Smartphone className="h-4 w-4 text-white/40" />
                Detected platform: <span className="font-semibold text-white">{providerLabel}</span>
              </div>
              <p className="mt-2 text-xs text-white/40">
                Sign in to sync your leaderboard name and keep purchases tied to your account.
              </p>
              <button
                onClick={handleSignIn}
                disabled={connecting}
                className="mt-4 w-full rounded-xl bg-indigo-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-indigo-300 disabled:opacity-50"
              >
                {connecting ? "Connecting…" : `Sign in with ${providerLabel.split(" / ")[0]}`}
              </button>
              {msg && <p className="mt-3 text-xs text-amber-300/80">{msg}</p>}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ icon, title, subtitle, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10"
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5">{icon}</div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-[11px] text-white/40">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </motion.section>
  );
}

function Row({ label, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-[11px] text-white/40">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function TestButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="mt-1 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 ring-1 ring-white/10 transition hover:bg-white/10"
    >
      Test vibration
    </button>
  );
}