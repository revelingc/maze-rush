import React, { useEffect, useRef } from "react";
import {
  generateMaze,
  getLevelConfig,
  resolveCollisions,
  updateHazard,
} from "@/lib/mazeGenerator";
import { renderGame } from "@/lib/mazeRenderer";

const VISIBLE_CELLS = 7; // cells shown across the viewport

/**
 * Scrolling maze runner. The world scrolls beneath the runner; the thumb
 * acts as a relative joystick to steer at speed (2D Maze Runner feel).
 *
 * Props:
 *  - level, running, resetToken, onLevelComplete, onLifeLost
 */
export default function MazeCanvas({ level, running, resetToken, onLevelComplete, onLifeLost }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const stateRef = useRef(null);
  const rafRef = useRef(null);
  const lastRef = useRef(0);
  const deadRef = useRef(false);
  const pointer = useRef({ active: false, ax: 0, ay: 0, x: 0, y: 0 });

  const cbRef = useRef({ onLevelComplete, onLifeLost });
  cbRef.current = { onLevelComplete, onLifeLost };
  const runningRef = useRef(running);
  runningRef.current = running;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const cfg = getLevelConfig(level);
    const loops = cfg.cols + cfg.hazards * 3;
    const maze = generateMaze(cfg.cols, cfg.rows, loops);
    const rect = container.getBoundingClientRect();
    const size = Math.max(220, Math.min(rect.width, rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cs = size / VISIBLE_CELLS;
    const worldW = cfg.cols * cs;
    const worldH = cfg.rows * cs;
    const ball = { x: cs / 2, y: cs / 2, r: cs * 0.3, vx: 0, vy: 0 };

    const hazards = [];
    const used = new Set([0]);
    for (let i = 0; i < cfg.hazards; i++) {
      let cx, cy, key, tries = 0;
      do {
        cx = Math.floor(Math.random() * cfg.cols);
        cy = Math.floor(Math.random() * cfg.rows);
        key = cy * cfg.cols + cx;
        tries++;
      } while ((used.has(key) || (cx <= 2 && cy <= 2)) && tries < 80);
      used.add(key);
      const cell = maze.grid[key];
      const valid = [0, 1, 2, 3].filter((dd) => !cell.walls[dd]);
      const dir = valid.length ? valid[Math.floor(Math.random() * valid.length)] : -1;
      hazards.push({
        cellX: cx,
        cellY: cy,
        targetX: cx + (dir >= 0 ? [0, 1, 0, -1][dir] : 0),
        targetY: cy + (dir >= 0 ? [-1, 0, 1, 0][dir] : 0),
        x: cx * cs + cs / 2,
        y: cy * cs + cs / 2,
        dir,
        speed: cfg.hazardSpeed,
        r: cs * 0.27,
      });
    }

    stateRef.current = {
      maze, cs, ball, hazards,
      exitX: (cfg.cols - 1) * cs + cs / 2,
      exitY: (cfg.rows - 1) * cs + cs / 2,
      timer: cfg.timer, timerMax: cfg.timer, invuln: 1.0,
      cfg, size, ctx, worldW, worldH, camX: 0, camY: 0,
    };

    deadRef.current = false;
    pointer.current.active = false;
    lastRef.current = performance.now();
  }, [level, resetToken]);

  useEffect(() => {
    const onResize = () => {
      const st = stateRef.current;
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!st || !container || !canvas) return;
      const rect = container.getBoundingClientRect();
      const size = Math.max(220, Math.min(rect.width, rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = size + "px";
      canvas.style.height = size + "px";
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const newCs = size / VISIBLE_CELLS;
      const ratio = newCs / st.cs;
      st.size = size;
      st.cs = newCs;
      st.worldW = st.cfg.cols * newCs;
      st.worldH = st.cfg.rows * newCs;
      st.ball.x *= ratio; st.ball.y *= ratio; st.ball.r = newCs * 0.3;
      st.exitX *= ratio; st.exitY *= ratio;
      for (const h of st.hazards) { h.x *= ratio; h.y *= ratio; h.r = newCs * 0.27; }
      st.ctx = ctx;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const loop = (now) => {
      rafRef.current = requestAnimationFrame(loop);
      const st = stateRef.current;
      if (!st) return;
      let dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      if (dt > 0.033) dt = 0.033;
      if (runningRef.current && !deadRef.current) {
        updateGame(st, dt, pointer, deadRef, cbRef);
      }
      st.pointer = pointer.current;
      renderGame(st.ctx, st);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handlePointer = (e, type) => {
    const st = stateRef.current;
    if (!st) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (type === "down") {
      pointer.current = { active: true, ax: x, ay: y, x, y };
      canvasRef.current.setPointerCapture?.(e.pointerId);
    } else if (type === "move") {
      if (pointer.current.active) { pointer.current.x = x; pointer.current.y = y; }
    } else {
      pointer.current.active = false;
    }
  };

  return (
    <div ref={containerRef} className="relative flex h-full w-full items-center justify-center">
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => handlePointer(e, "down")}
        onPointerMove={(e) => handlePointer(e, "move")}
        onPointerUp={(e) => handlePointer(e, "up")}
        onPointerCancel={(e) => handlePointer(e, "up")}
        onPointerLeave={(e) => handlePointer(e, "up")}
        style={{ touchAction: "none" }}
        className="rounded-2xl"
      />
    </div>
  );
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function updateCamera(st) {
  const { ball, size, worldW, worldH } = st;
  const loX = worldW <= size ? (worldW - size) / 2 : 0;
  const hiX = worldW <= size ? (worldW - size) / 2 : worldW - size;
  const loY = worldH <= size ? (worldH - size) / 2 : 0;
  const hiY = worldH <= size ? (worldH - size) / 2 : worldH - size;
  st.camX = clamp(ball.x - size / 2, loX, hiX);
  st.camY = clamp(ball.y - size / 2, loY, hiY);
}

function updateGame(st, dt, pointer, deadRef, cbRef) {
  const { ball, cs, maze, hazards, cfg } = st;
  const maxSpeed = cs * 16;
  const maxR = st.size * 0.22;

  // joystick -> velocity
  if (pointer.current.active) {
    const dx = pointer.current.x - pointer.current.ax;
    const dy = pointer.current.y - pointer.current.ay;
    const mag = Math.hypot(dx, dy);
    if (mag > 6) {
      const clamped = Math.min(mag, maxR);
      const speed = (clamped / maxR) * maxSpeed;
      ball.vx = (dx / mag) * speed;
      ball.vy = (dy / mag) * speed;
    } else {
      ball.vx *= 0.7;
      ball.vy *= 0.7;
    }
  } else {
    ball.vx *= 0.8;
    ball.vy *= 0.8;
  }

  // timer
  st.timer -= dt;
  if (st.timer <= 0) {
    st.timer = cfg.timer;
    st.invuln = 1.2;
    ball.x = cs / 2;
    ball.y = cs / 2;
    ball.vx = 0;
    ball.vy = 0;
    pointer.current.active = false;
    deadRef.current = true;
    cbRef.current.onLifeLost();
    return;
  }

  // substepped movement + collision (prevents tunneling at high speed)
  const moveLen = Math.hypot(ball.vx, ball.vy) * dt;
  const steps = Math.max(1, Math.ceil(moveLen / (cs * 0.25)));
  for (let i = 0; i < steps; i++) {
    ball.x += (ball.vx * dt) / steps;
    ball.y += (ball.vy * dt) / steps;
    for (let r = 0; r < 3; r++) resolveCollisions(ball, maze, cs);
  }
  ball.x = clamp(ball.x, ball.r, st.worldW - ball.r);
  ball.y = clamp(ball.y, ball.r, st.worldH - ball.r);

  updateCamera(st);

  for (const h of hazards) updateHazard(h, dt, maze, cs);

  if (st.invuln > 0) st.invuln -= dt;

  if (st.invuln <= 0) {
    for (const h of hazards) {
      if (Math.hypot(h.x - ball.x, h.y - ball.y) < h.r + ball.r) {
        st.invuln = 1.5;
        ball.x = cs / 2;
        ball.y = cs / 2;
        ball.vx = 0;
        ball.vy = 0;
        pointer.current.active = false;
        deadRef.current = true;
        cbRef.current.onLifeLost();
        return;
      }
    }
  }

  if (Math.hypot(ball.x - st.exitX, ball.y - st.exitY) < cs * 0.4) {
    deadRef.current = true;
    cbRef.current.onLevelComplete();
  }
}