import React, { useEffect, useRef } from "react";
import { generateMaze, getLevelConfig, resolveCollisions, updateHazard } from "@/lib/mazeGenerator";
import { renderGame } from "@/lib/mazeRenderer";

/**
 * Core maze game canvas.
 * Props:
 *  - level: current level number
 *  - running: whether the simulation should advance
 *  - resetToken: bump to regenerate the current level (e.g. after a life lost)
 *  - onLevelComplete(): called when the orb reaches the exit
 *  - onLifeLost(): called when the timer runs out or a hazard hits the orb
 */
export default function MazeCanvas({ level, running, resetToken, onLevelComplete, onLifeLost }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const stateRef = useRef(null);
  const rafRef = useRef(null);
  const lastRef = useRef(0);
  const deadRef = useRef(false);
  const pointer = useRef({ active: false, x: 0, y: 0 });

  const cbRef = useRef({ onLevelComplete, onLifeLost });
  cbRef.current = { onLevelComplete, onLifeLost };
  const runningRef = useRef(running);
  runningRef.current = running;

  // (Re)build the level whenever the level or resetToken changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const cfg = getLevelConfig(level);
    const maze = generateMaze(cfg.cols, cfg.rows);
    const rect = container.getBoundingClientRect();
    const size = Math.max(200, Math.min(rect.width, rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cs = size / cfg.cols;
    const ball = { x: cs / 2, y: cs / 2, r: cs * 0.3 };

    const hazards = [];
    const used = new Set([0]);
    for (let i = 0; i < cfg.hazards; i++) {
      let cx, cy, key, tries = 0;
      do {
        cx = Math.floor(Math.random() * cfg.cols);
        cy = Math.floor(Math.random() * cfg.rows);
        key = cy * cfg.cols + cx;
        tries++;
      } while ((used.has(key) || (cx <= 1 && cy <= 1)) && tries < 60);
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
      maze,
      cs,
      ball,
      hazards,
      exitX: (cfg.cols - 1) * cs + cs / 2,
      exitY: (cfg.rows - 1) * cs + cs / 2,
      timer: cfg.timer,
      timerMax: cfg.timer,
      invuln: 1.0,
      cfg,
      size,
      ctx,
    };

    deadRef.current = false;
    pointer.current.active = false;
    lastRef.current = performance.now();
  }, [level, resetToken]);

  // Handle container resize by rescaling positions.
  useEffect(() => {
    const onResize = () => {
      const st = stateRef.current;
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!st || !container || !canvas) return;
      const rect = container.getBoundingClientRect();
      const size = Math.max(200, Math.min(rect.width, rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = size + "px";
      canvas.style.height = size + "px";
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const scale = size / st.size;
      st.size = size;
      st.cs = size / st.cfg.cols;
      st.ball.x *= scale;
      st.ball.y *= scale;
      st.ball.r = st.cs * 0.3;
      st.exitX *= scale;
      st.exitY *= scale;
      for (const h of st.hazards) {
        h.x *= scale;
        h.y *= scale;
        h.r = st.cs * 0.27;
      }
      st.ctx = ctx;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Render + simulation loop.
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
      pointer.current = { active: true, x, y };
      canvasRef.current.setPointerCapture?.(e.pointerId);
    } else if (type === "move") {
      if (pointer.current.active) {
        pointer.current.x = x;
        pointer.current.y = y;
      }
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

function updateGame(st, dt, pointer, deadRef, cbRef) {
  const { ball, cs, maze, hazards, cfg, size } = st;

  // timer
  st.timer -= dt;
  if (st.timer <= 0) {
    st.timer = cfg.timer;
    st.invuln = 1.2;
    ball.x = cs / 2;
    ball.y = cs / 2;
    pointer.current.active = false;
    deadRef.current = true;
    cbRef.current.onLifeLost();
    return;
  }

  // move ball toward pointer
  if (pointer.current.active) {
    const tx = pointer.current.x;
    const ty = pointer.current.y;
    const dx = tx - ball.x;
    const dy = ty - ball.y;
    const dist = Math.hypot(dx, dy);
    const maxSpeed = cs * 14;
    const step = Math.min(dist, maxSpeed * dt);
    if (dist > 0.001) {
      ball.x += (dx / dist) * step;
      ball.y += (dy / dist) * step;
    }
  }

  // resolve wall collisions (a few iterations for stability)
  for (let i = 0; i < 3; i++) resolveCollisions(ball, maze, cs);
  ball.x = Math.max(ball.r, Math.min(size - ball.r, ball.x));
  ball.y = Math.max(ball.r, Math.min(size - ball.r, ball.y));

  // hazards
  for (const h of hazards) updateHazard(h, dt, maze, cs);

  // invulnerability countdown
  if (st.invuln > 0) st.invuln -= dt;

  // hazard collision
  if (st.invuln <= 0) {
    for (const h of hazards) {
      if (Math.hypot(h.x - ball.x, h.y - ball.y) < h.r + ball.r) {
        st.invuln = 1.5;
        ball.x = cs / 2;
        ball.y = cs / 2;
        pointer.current.active = false;
        deadRef.current = true;
        cbRef.current.onLifeLost();
        return;
      }
    }
  }

  // exit reached
  if (Math.hypot(ball.x - st.exitX, ball.y - st.exitY) < cs * 0.4) {
    deadRef.current = true;
    cbRef.current.onLevelComplete();
  }
}