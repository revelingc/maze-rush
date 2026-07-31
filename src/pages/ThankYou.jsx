import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * Public post-purchase confirmation page (the buyer is redirected here by Wix
 * after a successful checkout). The actual fulfillment happens in the
 * payments-webhook, which sets `star_skin_owned` on the user; this page just
 * confirms to the buyer and polls for that flag before declaring success.
 */
export default function ThankYou() {
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let tries = 0;
    let timer;
    const check = async () => {
      try {
        const me = await base44.auth.me();
        if (me?.star_skin_owned) {
          setUnlocked(true);
          setChecking(false);
          return;
        }
      } catch (_) {
        /* not signed in yet — keep waiting */
      }
      tries += 1;
      if (tries >= 6) setChecking(false);
      else timer = setTimeout(check, 1500);
    };
    check();
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-950 px-6 text-center text-white">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/15 ring-1 ring-emerald-300/30">
        <Check className="h-8 w-8 text-emerald-300" />
      </div>
      <h1 className="mt-5 text-2xl font-bold">Thanks for your purchase!</h1>
      <p className="mt-2 max-w-xs text-sm text-white/50">
        {checking
          ? "Confirming your payment… your Shooting Star will unlock shortly."
          : unlocked
          ? "Your Shooting Star ball skin is unlocked. Equip it from the Cosmetics screen."
          : "Your payment is being processed — your Shooting Star will unlock once confirmed."}
      </p>
      <Link
        to="/"
        className="mt-6 rounded-full bg-teal-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-300"
      >
        Back to Maze Rush
      </Link>
    </div>
  );
}