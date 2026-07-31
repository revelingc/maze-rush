import React, { useEffect, useRef } from "react";
import {
  generateMaze,
  getLevelConfig,
  resolveCollisions,
  updateHazard,
  updateLaser,
  updateHunter,
  laserSegment,
  pointSegDist,
} from "@/lib/mazeGenerator";
import { renderGame } from "@/lib/mazeRenderer";

const VISIBLE_CELLS = 7; // cells shown across the viewport width

/**
 * Scrolling maze runner. The world scrolls beneath the runner; steering comes
 * from a separate ControlPad below the maze (shared `pointer` ref).
 *
 * Props:
 *  - pointer: shared ref { active, ax, ay, x, y, maxR }
 *  - level, running, resetToken, onLevelComplete, onLifeLost
 */
export default function MazeCanvas({ level, running, resetToken, onLevelComplete, onLifeLost, pointer, skinColor, skinStar, wallColor, bgColor, hazardColor, laserColor, hunterColor, reducedMotion }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const stateRef = useRef(null);
  const rafRef = useRef(null);
  const lastRef = useRef(0);
  const deadRef = useRef(false);

  const cbRef = useRef({ onLevelComplete, onLifeLost });
  cbRef.current = { onLevelComplete, onLifeLost };
  const runningRef = useRef(running);
  runningRef.current = running;

  const fitCanvas = () => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return null;
    const rect = container.getBoundingClientRect();
    const w = Math.max(220, rect.width);
    const h = Math.max(220, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w, h, ctx };
  };

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const cfg = getLevelConfig(level);
    const loops = cfg.cols + cfg.hazards * 3;
    const maze = generateMaze(cfg.cols, cfg.rows, loops);
    const dims = fitCanvas();
    if (!dims) return;
    const { w, h, ctx } = dims;
    const cs = w / VISIBLE_CELLS;
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
      const valid = [0, 1, 2, 3].filter(
        (dd) => !cell.walls[dd] && !((cx + [0, 1, 0, -1][dd]) === 0 && (cy + [-1, 0, 1, 0][dd]) === 0)
      );
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

    // lasers (capped at 2 per map, levels 12+)
    const lasers = [];
    for (let i = 0; i < cfg.lasers; i++) {
      let cx, cy, key, tries = 0;
      do {
        cx = Math.floor(Math.random() * cfg.cols);
        cy = Math.floor(Math.random() * cfg.rows);
        key = cy * cfg.cols + cx;
        tries++;
      } while ((used.has(key) || (cx <= 2 && cy <= 2)) && tries < 80);
      used.add(key);
      lasers.push({
        cx,
        cy,
        orient: Math.random() < 0.5 ? "h" : "v",
        phase: "idle",
        t: 0.5 + Math.random() * 2.5,
        warnTime: 0.9,
        fireTime: 0.5,
        idleTime: 2.2,
      });
    }

    // hunters (surprise obstacle, levels 24+)
    const hunters = [];
    for (let i = 0; i < cfg.hunters; i++) {
      const halfX = Math.floor(cfg.cols * 0.5);
      const halfY = Math.floor(cfg.rows * 0.5);
      let cx, cy, key, tries = 0;
      do {
        cx = halfX + Math.floor(Math.random() * Math.max(1, cfg.cols - halfX));
        cy = halfY + Math.floor(Math.random() * Math.max(1, cfg.rows - halfY));
        key = cy * cfg.cols + cx;
        tries++;
      } while (used.has(key) && tries < 40);
      used.add(key);
      hunters.push({
        x: cx * cs + cs / 2,
        y: cy * cs + cs / 2,
        r: cs * 0.28,
        vx: 0,
        vy: 0,
        speed: cfg.hunterSpeed,
      });
    }

    stateRef.current = {
      maze, cs, ball, hazards, lasers, hunters,
      exitX: (cfg.cols - 1) * cs + cs / 2,
      exitY: (cfg.rows - 1) * cs + cs / 2,
      timer: cfg.timer, timerMax: cfg.timer, invuln: 1.0, moved: false,
      cfg, w, h, ctx, worldW, worldH, camX: 0, camY: 0,
      skinColor: skinColor || "#5EEAD4",
      skinStar: !!skinStar,
      wallColor: wallColor || "#39496B",
      bgColor: bgColor || "#0B0F1A",
      hazardColor: hazardColor || "#FB7185",
      laserColor: laserColor || "#22D3EE",
      hunterColor: hunterColor || "#A855F7",
      reducedMotion: !!reducedMotion,
    };

    deadRef.current = false;
    if (pointer) pointer.current.active = false;
    lastRef.current = performance.now();
  }, [level, resetToken]);

  useEffect(() => {
    const onResize = () => {
      const st = stateRef.current;
      if (!st) return;
      const dims = fitCanvas();
      if (!dims) return;
      const { w, h, ctx } = dims;
      const newCs = w / VISIBLE_CELLS;
      const ratio = newCs / st.cs;
      st.w = w; st.h = h; st.cs = newCs;
      st.worldW = st.cfg.cols * newCs;
      st.worldH = st.cfg.rows * newCs;
      st.ball.x *= ratio; st.ball.y *= ratio; st.ball.r = newCs * 0.3;
      st.exitX *= ratio; st.exitY *= ratio;
      for (const hz of st.hazards) { hz.x *= ratio; hz.y *= ratio; hz.r = newCs * 0.27; }
      for (const hu of st.hunters) { hu.x *= ratio; hu.y *= ratio; hu.r = newCs * 0.28; }
      st.ctx = ctx;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const st = stateRef.current;
    if (st) st.reducedMotion = !!reducedMotion;
  }, [reducedMotion]);

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

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <canvas ref={canvasRef} className="rounded-2xl" />
    </div>
  );
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function updateCamera(st) {
  const { ball, w, h, worldW, worldH } = st;
  const loX = worldW <= w ? (worldW - w) / 2 : 0;
  const hiX = worldW <= w ? (worldW - w) / 2 : worldW - w;
  const loY = worldH <= h ? (worldH - h) / 2 : 0;
  const hiY = worldH <= h ? (worldH - h) / 2 : worldH - h;
  st.camX = clamp(ball.x - w / 2, loX, hiX);
  st.camY = clamp(ball.y - h / 2, loY, hiY);
}

function killPlayer(st, pointer, deadRef, cbRef) {
  const { cs, ball } = st;
  st.invuln = 1.5;
  ball.x = cs / 2;
  ball.y = cs / 2;
  ball.vx = 0;
  ball.vy = 0;
  pointer.current.active = false;
  deadRef.current = true;
  cbRef.current.onLifeLost();
}

function updateGame(st, dt, pointer, deadRef, cbRef) {
  const { ball, cs, maze, hazards, lasers, hunters, cfg } = st;
  const maxSpeed = cs * 11;
  const maxR = (pointer && pointer.current.maxR) || 70;

  // joystick -> velocity
  if (pointer && pointer.current.active) {
    const dx = pointer.current.x - pointer.current.ax;
    const dy = pointer.current.y - pointer.current.ay;
    const mag = Math.hypot(dx, dy);
    if (mag > 8) {
      st.moved = true;
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
    killPlayer(st, pointer, deadRef, cbRef);
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

  const odt = st.reducedMotion ? dt * 0.5 : dt;
  for (const h of hazards) updateHazard(h, odt, maze, cs);
  for (const l of lasers) updateLaser(l, odt);
  for (const hu of hunters) updateHunter(hu, odt, ball, maze, cs);

  if (st.invuln > 0) st.invuln -= dt;

  if (st.invuln <= 0 && st.moved) {
    // hazards
    for (const h of hazards) {
      if (Math.hypot(h.x - ball.x, h.y - ball.y) < h.r + ball.r) {
        killPlayer(st, pointer, deadRef, cbRef);
        return;
      }
    }
    // lasers (only while firing)
    const beamHalf = cs * 0.06;
    for (const l of lasers) {
      if (l.phase !== "fire") continue;
      const seg = laserSegment(l, cs);
      if (pointSegDist(ball.x, ball.y, seg.ax, seg.ay, seg.bx, seg.by) < ball.r + beamHalf) {
        killPlayer(st, pointer, deadRef, cbRef);
        return;
      }
    }
    // hunters
    for (const hu of hunters) {
      if (Math.hypot(hu.x - ball.x, hu.y - ball.y) < hu.r + ball.r) {
        killPlayer(st, pointer, deadRef, cbRef);
        return;
      }
    }
  }

  if (Math.hypot(ball.x - st.exitX, ball.y - st.exitY) < cs * 0.4) {
    deadRef.current = true;
    cbRef.current.onLevelComplete(st.timerMax - st.timer);
  }
}