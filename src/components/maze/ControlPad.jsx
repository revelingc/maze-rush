import React, { useEffect, useRef, useState } from "react";
import { Move, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Dedicated thumb-steering pad. Sits below the maze so the thumb never
 * obstructs the map. Writes into the shared `pointer` ref that the game loop
 * reads.
 *
 * Props:
 *  - pointer: shared ref { active, ax, ay, x, y, maxR }
 *  - disabled: ignore input when true (modals / not running)
 */
export default function ControlPad({ pointer, disabled }) {
  const padRef = useRef(null);
  const [maxR, setMaxR] = useState(70);
  const [knob, setKnob] = useState(null); // { ax, ay, kx, ky } when active

  useEffect(() => {
    const measure = () => {
      const r = padRef.current?.getBoundingClientRect();
      if (!r) return;
      const m = Math.min(r.width, r.height) * 0.4;
      setMaxR(m);
      if (pointer) pointer.current.maxR = m;
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [pointer]);

  const localPos = (e) => {
    const r = padRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const down = (e) => {
    if (disabled) return;
    const { x, y } = localPos(e);
    if (pointer) pointer.current = { active: true, ax: x, ay: y, x, y, maxR };
    padRef.current.setPointerCapture?.(e.pointerId);
    setKnob({ ax: x, ay: y, kx: 0, ky: 0 });
  };

  const move = (e) => {
    if (!pointer || !pointer.current.active) return;
    const { x, y } = localPos(e);
    pointer.current.x = x;
    pointer.current.y = y;
    let kx = x - pointer.current.ax;
    let ky = y - pointer.current.ay;
    const m = Math.hypot(kx, ky);
    if (m > maxR) { kx = (kx / m) * maxR; ky = (ky / m) * maxR; }
    setKnob({ ax: pointer.current.ax, ay: pointer.current.ay, kx, ky });
  };

  const up = () => {
    if (pointer) pointer.current.active = false;
    setKnob(null);
  };

  const guide = maxR * 2;

  return (
    <div
      ref={padRef}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      style={{ touchAction: "none" }}
      className="relative h-full w-full select-none overflow-hidden rounded-2xl bg-slate-800/60 ring-1 ring-teal-400/25"
    >
      {/* label */}
      <div className="pointer-events-none absolute left-3 top-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-300/90">
        <Move className="h-3.5 w-3.5" />
        Steer here
      </div>

      {/* centered dashed guide with directional chevrons */}
      {!knob && (
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: guide, height: guide }}
        >
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-teal-300/40" />
          <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-300/50" />
          <ChevronUp className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-teal-300/50" />
          <ChevronDown className="absolute left-1/2 bottom-0 h-4 w-4 -translate-x-1/2 translate-y-1/2 text-teal-300/50" />
          <ChevronLeft className="absolute left-0 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-teal-300/50" />
          <ChevronRight className="absolute right-0 top-1/2 h-4 w-4 translate-x-1/2 -translate-y-1/2 text-teal-300/50" />
        </div>
      )}

      {/* active joystick */}
      {knob && (
        <>
          <div
            className="pointer-events-none absolute rounded-full border-2 border-teal-300/50"
            style={{ width: guide, height: guide, left: knob.ax - maxR, top: knob.ay - maxR }}
          />
          <div
            className="pointer-events-none absolute rounded-full bg-teal-300 shadow-[0_0_14px_rgba(94,234,212,0.7)]"
            style={{ width: 32, height: 32, left: knob.ax + knob.kx - 16, top: knob.ay + knob.ky - 16 }}
          />
        </>
      )}

      {/* disabled veil */}
      {disabled && <div className="pointer-events-none absolute inset-0 bg-slate-950/50" />}
    </div>
  );
}