import React, { useEffect, useRef, useState } from "react";

/**
 * Dedicated thumb-steering pad. Sits below the maze so the thumb never
 * obstructs the map. Writes into the shared `pointer` ref that the game loop
 * reads.
 *
 * Props:
 *  - pointer: shared ref { active, ax, ay, x, y, maxR }
 *  - disabled: ignore input when true (modals / not running)
 */
export default function ControlPad({ pointer, disabled, deadZone = 8 }) {
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

  return (
    <div
      ref={padRef}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      style={{ touchAction: "none" }}
      className="relative h-full w-full select-none overflow-hidden rounded-2xl bg-slate-900/50 ring-1 ring-white/10"
    >
      {/* centered guide ring */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10"
        style={{ width: maxR * 2, height: maxR * 2 }}
      />

      {/* idle hint */}
      {!knob && !disabled && (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-white/30">
          Tap &amp; drag to steer
        </p>
      )}

      {/* active joystick */}
      {knob && (
        <>
          <div
            className="pointer-events-none absolute rounded-full border border-teal-300/30"
            style={{ width: maxR * 2, height: maxR * 2, left: knob.ax - maxR, top: knob.ay - maxR }}
          />
          {deadZone > 0 && (
            <div
              className="pointer-events-none absolute rounded-full border border-white/15"
              style={{ width: deadZone * 2, height: deadZone * 2, left: knob.ax - deadZone, top: knob.ay - deadZone }}
            />
          )}
          <div
            className="pointer-events-none absolute rounded-full bg-teal-300/85 shadow-[0_0_12px_rgba(94,234,212,0.6)]"
            style={{ width: 30, height: 30, left: knob.ax + knob.kx - 15, top: knob.ay + knob.ky - 15 }}
          />
        </>
      )}

      {/* disabled veil */}
      {disabled && <div className="pointer-events-none absolute inset-0 bg-slate-950/40" />}
    </div>
  );
}