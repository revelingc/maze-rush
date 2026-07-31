import React from "react";
import { ChevronLeft, Lock, Check } from "lucide-react";
import { DOT_SKINS, isSkinUnlocked } from "@/lib/skins";
import DotPreview from "@/components/maze/DotPreview";

const WALL_PRESETS = ["#39496B", "#475569", "#7C3AED", "#DB2777", "#0EA5E9", "#F59E0B", "#10B981", "#F8FAFC"];
const BG_PRESETS = ["#0B0F1A", "#000000", "#0F172A", "#1E1B4B", "#3B0764", "#7F1D1D", "#082F49", "#1F2937"];

export default function CosmeticsScreen({
  bestLevel,
  skin,
  setSkin,
  wallColor,
  setWallColor,
  bgColor,
  setBgColor,
  starOwned,
  onBuyStar,
  onBack,
}) {
  return (
    <div className="flex h-[100dvh] flex-col bg-slate-950 text-white">
      <header className="flex items-center gap-3 px-5 pt-5">
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 hover:bg-white/10"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">Main Menu</p>
          <h1 className="text-lg font-semibold">Cosmetics</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <Section title="Ball Skin" subtitle="Unlock a new look every 10 levels.">
          <div className="grid grid-cols-3 gap-3">
            {DOT_SKINS.map((s) => {
              const isStar = s.id === "star";
              const owned = isStar ? !!starOwned : isSkinUnlocked(s, bestLevel);
              const selected = s.id === skin;
              const label = isStar
                ? starOwned
                  ? "Owned"
                  : `$${s.price.toFixed(2)}`
                : s.unlockLevel === 0
                ? "Free"
                : owned
                ? "Unlocked"
                : `Lv ${s.unlockLevel}`;
              return (
                <div
                  key={s.id}
                  className={
                    "relative flex flex-col items-center gap-2 rounded-2xl p-3 ring-1 transition " +
                    (selected
                      ? "bg-teal-400/15 ring-teal-300/50"
                      : "bg-white/5 ring-white/10")
                  }
                >
                  <DotPreview skin={s} size={30} />
                  <span className="text-xs font-medium">{s.name}</span>
                  {isStar && !starOwned ? (
                    <button
                      onClick={onBuyStar}
                      className="rounded-full bg-amber-400 px-3 py-1 text-[11px] font-semibold text-amber-950 hover:bg-amber-300"
                    >
                      Buy {label}
                    </button>
                  ) : (
                    <button
                      disabled={!owned}
                      onClick={() => setSkin(s.id)}
                      className="text-[10px] text-white/50 hover:text-white disabled:cursor-not-allowed disabled:text-white/30"
                    >
                      {selected ? "Selected" : label}
                    </button>
                  )}
                  {selected && (
                    <span className="absolute right-2 top-2 text-teal-300">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                  {!owned && !isStar && (
                    <span className="absolute right-2 top-2 text-white/40">
                      <Lock className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="Wall Color" subtitle="Free — pick any color.">
          <ColorRow value={wallColor} onChange={setWallColor} presets={WALL_PRESETS} />
        </Section>

        <Section title="Background" subtitle="Free — pick any color.">
          <ColorRow value={bgColor} onChange={setBgColor} presets={BG_PRESETS} />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <section className="mt-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mb-3 text-xs text-white/40">{subtitle}</p>
      {children}
    </section>
  );
}

function ColorRow({ value, onChange, presets }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {presets.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={
            "h-9 w-9 rounded-full ring-2 transition " +
            (value.toLowerCase() === c.toLowerCase() ? "ring-teal-300" : "ring-white/10")
          }
          style={{ background: c }}
        />
      ))}
      <label
        className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full ring-2 ring-white/10"
        style={{ background: "conic-gradient(from 0deg,#f43f5e,#f59e0b,#10b981,#0ea5e9,#8b5cf6,#f43f5e)" }}
        title="Custom color"
      >
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}