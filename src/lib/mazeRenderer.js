// Canvas renderer for Maze Rush (scrolling world). The joystick lives in a
// separate DOM control pad below the maze, so nothing is drawn over the map.

function drawStar(ctx, cx, cy, r, now) {
  const rot = now / 600;
  const spikes = 5;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const ang = rot + (Math.PI / spikes) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r * 1.15 : r * 0.5;
    const px = cx + Math.cos(ang) * rad;
    const py = cy + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function drawBall(ctx, st, now) {
  const { ball } = st;
  const color = st.skinColor || "#5EEAD4";
  ctx.save();
  ctx.shadowBlur = 22;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  if (st.skinStar) {
    const sp = Math.hypot(ball.vx, ball.vy);
    if (sp > 10) {
      const tx = -ball.vx / sp;
      const ty = -ball.vy / sp;
      const len = Math.min(ball.r * 2.4, sp * 0.1);
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.moveTo(ball.x + tx * len, ball.y + ty * len);
      ctx.lineTo(ball.x + ty * ball.r * 0.6, ball.y - tx * ball.r * 0.6);
      ctx.lineTo(ball.x - ty * ball.r * 0.6, ball.y + tx * ball.r * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    drawStar(ctx, ball.x, ball.y, ball.r, now);
  } else {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function edgePoint(ang, w, h, margin) {
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  const hx = w / 2 - margin;
  const hy = h / 2 - margin;
  const tx = Math.abs(dx) < 1e-6 ? Infinity : hx / Math.abs(dx);
  const ty = Math.abs(dy) < 1e-6 ? Infinity : hy / Math.abs(dy);
  const t = Math.min(tx, ty);
  return { x: w / 2 + dx * t, y: h / 2 + dy * t };
}

export function renderGame(ctx, st) {
  const {
    maze, cs, ball, hazards, exitX, exitY,
    timer, timerMax, invuln, w, h, camX, camY, worldW, worldH,
  } = st;
  const now = performance.now();
  const u = Math.min(w, h);

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = st.bgColor || "#0B0F1A";
  ctx.fillRect(0, 0, w, h);

  // ---- world layer (scrolled) ----
  ctx.save();
  ctx.translate(-camX, -camY);

  // start cell glow
  ctx.fillStyle = "rgba(94,234,212,0.07)";
  ctx.fillRect(0, 0, cs, cs);

  // exit beacon
  const pulse = 0.5 + 0.5 * Math.sin(now / 300);
  ctx.save();
  ctx.shadowBlur = 24;
  ctx.shadowColor = "#34D399";
  ctx.fillStyle = `rgba(52,211,153,${0.6 + 0.35 * pulse})`;
  ctx.beginPath();
  ctx.arc(exitX, exitY, cs * 0.33, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // walls
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(2, cs * 0.11);
  ctx.strokeStyle = st.wallColor || "#39496B";
  ctx.shadowBlur = 5;
  ctx.shadowColor = "rgba(91,160,255,0.22)";
  ctx.beginPath();
  for (const cell of maze.grid) {
    const x = cell.x * cs;
    const y = cell.y * cs;
    if (cell.walls[0]) { ctx.moveTo(x, y); ctx.lineTo(x + cs, y); }
    if (cell.walls[1]) { ctx.moveTo(x + cs, y); ctx.lineTo(x + cs, y + cs); }
    if (cell.walls[2]) { ctx.moveTo(x, y + cs); ctx.lineTo(x + cs, y + cs); }
    if (cell.walls[3]) { ctx.moveTo(x, y); ctx.lineTo(x, y + cs); }
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // hazards
  for (const hz of hazards) {
    ctx.save();
    ctx.shadowBlur = 16;
    ctx.shadowColor = "#FB7185";
    ctx.fillStyle = "#FB7185";
    ctx.beginPath();
    ctx.arc(hz.x, hz.y, hz.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ball (blink while invulnerable)
  const blink = invuln > 0 && Math.floor(now / 90) % 2 === 0;
  if (!blink) drawBall(ctx, st, now);

  ctx.restore(); // back to screen space

  // ---- screen-space UI ----

  // exit direction arrow (when exit is off-screen)
  const exScreen = exitX - camX;
  const eyScreen = exitY - camY;
  if (exScreen < 0 || exScreen > w || eyScreen < 0 || eyScreen > h) {
    const ang = Math.atan2(eyScreen - h / 2, exScreen - w / 2);
    const p = edgePoint(ang, w, h, u * 0.09);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(ang);
    ctx.fillStyle = "rgba(52,211,153,0.9)";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#34D399";
    ctx.beginPath();
    ctx.moveTo(u * 0.04, 0);
    ctx.lineTo(-u * 0.025, -u * 0.03);
    ctx.lineTo(-u * 0.025, u * 0.03);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // timer bar (top edge)
  const pct = Math.max(0, Math.min(1, timer / timerMax));
  const barH = Math.max(3, u * 0.012);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(0, 0, w, barH);
  ctx.fillStyle = pct > 0.3 ? "#5EEAD4" : "#FB7185";
  ctx.fillRect(0, 0, w * pct, barH);

  // silence unused
  void worldW; void worldH;
}