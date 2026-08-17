import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Share2, Heart, Copy, Check } from "lucide-react";
import { shareInvite } from "@/lib/shareUtils";
import { getShareCode, addConfirmedShare, SHARES_TO_UNLOCK_HEARTS, getReferredBy, setReferredBy } from "@/lib/gameStorage";
import { getTrail } from "@/lib/trails";

export default function ShareScreen({ confirmedShares, onConfirmed, onBack }) {
  const [code] = useState(() => getShareCode());
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [justShared, setJustShared] = useState(false);
  const [referredBy, setReferredByState] = useState(() => getReferredBy());
  const [refInput, setRefInput] = useState("");
  const [refMsg, setRefMsg] = useState(null);

  const submitRef = () => {
    const v = refInput.trim().toUpperCase();
    if (!/^[A-Z2-9]{6}$/.test(v)) {
      setRefMsg({ ok: false, text: "Codes are 6 letters/numbers." });
      return;
    }
    if (v === code) {
      setRefMsg({ ok: false, text: "That's your own code!" });
      return;
    }
    setReferredBy(v);
    setReferredByState(v);
    setRefInput("");
    setRefMsg({ ok: true, text: `Thanks! You were referred by ${v}.` });
  };
  const hearts = getTrail("hearts");
  const unlocked = confirmedShares >= SHARES_TO_UNLOCK_HEARTS;
  const pct = Math.min(100, (confirmedShares / SHARES_TO_UNLOCK_HEARTS) * 100);

  const handleShare = async () => {
    setSharing(true);
    const ok = await shareInvite({ code });
    setSharing(false);
    if (ok) {
      const n = addConfirmedShare();
      onConfirmed(n);
      setJustShared(true);
      setTimeout(() => setJustShared(false), 1800);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      /* ignore */
    }
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-slate-950 text-white">
      <header className="flex items-center gap-3 px-5 safe-pt-5">
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 hover:bg-white/10"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">Main Menu</p>
          <h1 className="text-lg font-semibold">Share & Earn</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 safe-pb-6">
        <section className="mt-5 overflow-hidden rounded-2xl bg-gradient-to-br from-pink-400/15 to-rose-500/5 p-5 ring-1 ring-pink-300/30">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-400/20 ring-1 ring-pink-300/30">
              <Heart className="h-6 w-6 text-pink-300" fill="currentColor" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Hearts Trail</h2>
              <p className="text-xs text-white/50">Unlock with {SHARES_TO_UNLOCK_HEARTS} confirmed shares.</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium text-white/70">
                {Math.min(confirmedShares, SHARES_TO_UNLOCK_HEARTS)} / {SHARES_TO_UNLOCK_HEARTS}
              </span>
              <span className="text-white/40">{unlocked ? "Unlocked!" : "shares confirmed"}</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-pink-400"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
          {unlocked && (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-pink-400/20 px-3 py-1.5 text-xs font-semibold text-pink-200 ring-1 ring-pink-300/30">
              <Check className="h-3.5 w-3.5" /> Hearts trail unlocked — equip it in Cosmetics
            </div>
          )}
        </section>

        <section className="mt-5">
          <h2 className="text-sm font-semibold">Your share code</h2>
          <p className="mb-3 text-xs text-white/40">
            Send this to a friend. When they open Maze Rush, it counts as a confirmed share.
          </p>
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-wider text-white/40">Code</p>
              <p className="font-mono text-2xl font-bold tracking-[0.3em] text-teal-300">{code}</p>
            </div>
            <button
              onClick={copyCode}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10 transition hover:bg-white/20"
              title="Copy code"
            >
              {copied ? <Check className="h-5 w-5 text-teal-300" /> : <Copy className="h-5 w-5 text-white/70" />}
            </button>
          </div>
        </section>

        <section className="mt-5">
          <h2 className="text-sm font-semibold">Got a code from a friend?</h2>
          <p className="mb-3 text-xs text-white/40">Enter the share code of who introduced you to Maze Rush.</p>
          {referredBy ? (
            <div className="flex items-center gap-2 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <Heart className="h-4 w-4 text-pink-300" fill="currentColor" />
              <span className="text-sm text-white/70">Referred by</span>
              <span className="font-mono font-bold tracking-[0.2em] text-teal-300">{referredBy}</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <input
                value={refInput}
                onChange={(e) => setRefInput(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="ENTER CODE"
                maxLength={6}
                className="w-full rounded-2xl bg-white/5 px-4 py-3 font-mono text-lg tracking-[0.3em] text-white placeholder-white/30 ring-1 ring-white/10 outline-none focus:ring-teal-300/40"
              />
              <button
                onClick={submitRef}
                disabled={refInput.length < 6}
                className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/20 disabled:opacity-40"
              >
                Submit code
              </button>
              {refMsg && (
                <p className={"text-xs " + (refMsg.ok ? "text-teal-300" : "text-rose-300")}>{refMsg.text}</p>
              )}
            </div>
          )}
        </section>

        <button
          onClick={handleShare}
          disabled={sharing}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-pink-400 px-5 py-4 text-base font-semibold text-slate-950 transition hover:bg-pink-300 disabled:opacity-60"
        >
          {sharing ? (
            <>Sharing…</>
          ) : justShared ? (
            <>
              <Check className="h-5 w-5" /> Share confirmed!
            </>
          ) : (
            <>
              <Share2 className="h-5 w-5" /> Share Maze Rush
            </>
          )}
        </button>
        <p className="mt-3 text-center text-[11px] text-white/30">
          Each completed share adds one to your count. Reach {SHARES_TO_UNLOCK_HEARTS} to unlock the Hearts trail.
        </p>
      </div>
    </div>
  );
}