import React from "react";
import { Star, ShieldCheck, Crown, Check, Sparkles } from "lucide-react";
import { TRAILS } from "@/lib/trails";

// Paid, non-star trails (Stardust is unlocked via the Shooting Star bundle).
const PAID_TRAILS = TRAILS.filter((t) => !t.star && t.price > 0);

const BUNDLES = [
  {
    id: "bundle_star_stardust",
    name: "Shooting Star + Stardust",
    price: 4.49,
    desc: "The Shooting Star dot skin and its golden Stardust trail, bundled together.",
    icon: "star",
    accent: "amber",
  },
  {
    id: "bundle_consumables",
    name: "All Consumables",
    price: 8.99,
    desc: "Go ad-free — six lives, no ads — and unlock every move trail.",
    icon: "shield",
    accent: "emerald",
  },
  {
    id: "bundle_everything",
    name: "Everything Pack",
    price: 11.99,
    desc: "The whole game: ad-free, every move trail, and the Shooting Star skin.",
    icon: "crown",
    accent: "violet",
  },
];

const ACCENT = {
  amber: { ring: "ring-amber-300/40", glow: "from-amber-400/20 to-orange-500/10", icon: "text-amber-300", btn: "bg-amber-400 text-amber-950 hover:bg-amber-300" },
  emerald: { ring: "ring-emerald-300/40", glow: "from-emerald-400/20 to-teal-500/10", icon: "text-emerald-300", btn: "bg-emerald-400 text-emerald-950 hover:bg-emerald-300" },
  violet: { ring: "ring-violet-300/40", glow: "from-violet-400/20 to-indigo-500/10", icon: "text-violet-300", btn: "bg-violet-400 text-violet-950 hover:bg-violet-300" },
};

const ICONS = { star: Star, shield: ShieldCheck, crown: Crown };

export default function StoreBundles({ starOwned, adFree, trailsOwned, buying, onBuyBundle }) {
  const allTrailsOwned = PAID_TRAILS.every((t) => trailsOwned.includes(t.id));
  const isOwned = {
    bundle_star_stardust: !!starOwned,
    bundle_consumables: !!adFree && allTrailsOwned,
    bundle_everything: !!starOwned && !!adFree && allTrailsOwned,
  };

  return (
    <section className="mt-5">
      <div className="mb-1 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-teal-300" />
        <h2 className="text-sm font-semibold">Bundles</h2>
      </div>
      <p className="mb-3 text-xs text-white/40">Save by unlocking more at once.</p>
      <div className="flex flex-col gap-3">
        {BUNDLES.map((b) => {
          const owned = !!isOwned[b.id];
          const a = ACCENT[b.accent];
          const Icon = ICONS[b.icon];
          return (
            <div
              key={b.id}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${a.glow} p-4 ring-1 ${a.ring}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
                  <Icon className={`h-5 w-5 ${a.icon}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white">{b.name}</h3>
                    <span className="text-sm font-bold text-white">${b.price.toFixed(2)}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-white/50">{b.desc}</p>
                  {owned ? (
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 ring-1 ring-white/10">
                      <Check className="h-3.5 w-3.5 text-teal-300" /> Owned
                    </div>
                  ) : (
                    <button
                      onClick={() => onBuyBundle(b.id)}
                      disabled={buying}
                      className={`mt-3 rounded-full px-4 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${a.btn}`}
                    >
                      {buying ? "…" : "Buy"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}