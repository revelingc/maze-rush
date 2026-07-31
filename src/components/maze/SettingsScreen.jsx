import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Vibrate, Eye, Cloud, Check, Smartphone, LogOut, Trash2, Joystick, RefreshCw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { signIn as nativeSignIn, signOut as nativeSignOut, detectPlatform } from "@/lib/nativeAccount";
import { clearAllData } from "@/lib/gameStorage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SettingsScreen({ settings, setSettings, onAccount, onResetPurchases, onBack }) {
  const [connecting, setConnecting] = useState(false);
  const [msg, setMsg] = useState(null);
  const platform = detectPlatform();
  const providerLabel = platform === "ios" ? "Apple / iCloud" : "Google / Android";
  const account = settings.account;
  const showDelete = !!account;
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      clearAllData();
      await nativeSignOut();
      onAccount(null);
    } finally {
      window.location.href = "/";
    }
  };

  return (
    <div className="relative flex h-[100dvh] flex-col bg-neutral-100 px-6 text-slate-900">
      <header className="flex items-center gap-3 safe-pt-6 pb-4">
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-semibold">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto safe-pb-8">
        {/* Haptics */}
        <Section icon={<Vibrate className="h-4 w-4 text-rose-500" />} title="Haptics" subtitle="Vibration on death">
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
        <Section icon={<Eye className="h-4 w-4 text-sky-500" />} title="Accessibility" subtitle="Visual clarity">
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

        {/* Steering controls */}
        <Section
          icon={<Joystick className="h-4 w-4 text-emerald-500" />}
          title="Steering controls"
          subtitle="Tune the drag-to-steer feel"
        >
          <Row label={`Dead zone · ${settings.steerDeadZone}px`} hint="Drag distance before the orb responds">
            <div className="w-40">
              <Slider
                value={[settings.steerDeadZone]}
                min={0}
                max={25}
                step={1}
                onValueChange={(v) => update({ steerDeadZone: v[0] })}
              />
            </div>
          </Row>
          <Row label={`Sensitivity · ×${Number(settings.steerSensitivity).toFixed(1)}`} hint="Top steering speed">
            <div className="w-40">
              <Slider
                value={[settings.steerSensitivity]}
                min={0.5}
                max={2}
                step={0.1}
                onValueChange={(v) => update({ steerSensitivity: v[0] })}
              />
            </div>
          </Row>
          <Row label="Response curve" hint="How steering ramps with drag">
            <div className="w-56">
              <Segmented
                value={settings.steerCurve}
                onChange={(v) => update({ steerCurve: v })}
                options={[
                  { value: "linear", label: "Linear" },
                  { value: "smooth", label: "Smooth" },
                  { value: "precise", label: "Precise" },
                ]}
              />
            </div>
          </Row>
          <p className="text-[11px] leading-relaxed text-slate-500">
            <span className="font-medium text-slate-600">Smooth</span> eases in for fine control at small drags;{" "}
            <span className="font-medium text-slate-600">Precise</span> reacts quicker near the center. Tune these
            if the orb feels sluggish or twitchy.
          </p>
        </Section>

        {/* Account */}
        <Section
          icon={<Cloud className="h-4 w-4 text-indigo-500" />}
          title="Account sync"
          subtitle="Leaderboard & purchases"
        >
          {account ? (
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 ring-1 ring-emerald-200">
                  <Check className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{account.name}</p>
                  <p className="text-xs text-slate-500">Connected · {account.provider}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Your display name and purchases are linked to this account across the installed app.
              </p>
              <button
                onClick={handleSignOut}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Smartphone className="h-4 w-4 text-slate-400" />
                Detected platform: <span className="font-semibold text-slate-900">{providerLabel}</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Sign in to sync your leaderboard name and keep purchases tied to your account.
              </p>
              <button
                onClick={handleSignIn}
                disabled={connecting}
                className="mt-4 w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-50"
              >
                {connecting ? "Connecting…" : `Sign in with ${providerLabel.split(" / ")[0]}`}
              </button>
              {msg && <p className="mt-3 text-xs text-amber-600">{msg}</p>}
            </div>
          )}
        </Section>

        {/* Reset purchases — always available */}
        <Section
          icon={<RefreshCw className="h-4 w-4 text-slate-500" />}
          title="Reset purchases"
          subtitle="Clear cosmetic & ad-free unlocks"
        >
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-xs text-slate-500">
              Removes ad-free status, unlocked trails, and the Shooting Star skin. Your level progress, streaks, and scores stay intact.
            </p>
            <button
              onClick={onResetPurchases}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-300"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Reset purchases
            </button>
          </div>
        </Section>

        {/* Danger zone — account deletion (authenticated users only) */}
        {showDelete && (
          <Section
            icon={<Trash2 className="h-4 w-4 text-rose-500" />}
            title="Danger zone"
            subtitle="Permanently remove your account"
          >
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <p className="text-xs text-slate-500">
                Clears your local progress, scores, and settings, and signs you out. This can't be undone.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete account
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently clears your local progress, scores, and settings and signs you out. This action can't be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      className="bg-rose-500 text-white hover:bg-rose-400"
                    >
                      {deleting ? "Deleting…" : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ icon, title, subtitle, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200"
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">{icon}</div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-[11px] text-slate-500">{subtitle}</p>
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
        <p className="text-sm font-medium text-slate-900">{label}</p>
        {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Segmented({ value, options, onChange }) {
  return (
    <div className="flex rounded-lg bg-slate-100 p-0.5 ring-1 ring-slate-200">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
            value === o.value
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function TestButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="mt-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200"
    >
      Test vibration
    </button>
  );
}