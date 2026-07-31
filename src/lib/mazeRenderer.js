// Canvas renderer for Maze Rush.

export function renderGame(ctx, st) {
  const { maze, cs, ball, hazards, exitX, exitY, timer, timerMax, invuln, size } = st;
  const now = performance.now();

  // background
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#0B0F1A";
  ctx.fillRect(0, 0, size, size);

  // start cell glow
  ctx.fillStyle = "rgba(94,234,212,0.07)";
  ctx.fillRect(0, 0, cs, cs);

  // exit (pulsing emerald)
  const pulse = 0.5 + 0.5 * Math.sin(now / 300);
  ctx.save();
  ctx.shadowBlur = 22;
  ctx.shadowColor = "#34D399";
  ctx.fillStyle = `rgba(52,211,153,${0.65 + 0.3 * pulse})`;
  ctx.beginPath();
  ctx.arc(exitX, exitY, cs * 0.33, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // walls
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(2, cs * 0.11);
  ctx.strokeStyle = "#39496B";
  ctx.shadowBlur = 5;
  ctx.shadowColor = "rgba(91,160,255,0.22)";
  ctx.beginPath();
  for (const cell of maze.grid) {
    const x = cell.x * cs;
    const y = cell.y * cs;
    if (cell.walls[0]) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + cs, y);
    }
    if (cell.walls[1]) {
      ctx.moveTo(x + cs, y);
      ctx.lineTo(x + cs, y + cs);
    }
    if (cell.walls[2]) {
      ctx.moveTo(x, y + cs);
      ctx.lineTo(x + cs, y + cs);
    }
    if (cell.walls[3]) {
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + cs);
    }
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // hazards
  for (const h of hazards) {
    ctx.save();
    ctx.shadowBlur = 16;
    ctx.shadowColor = "#FB7185";
    ctx.fillStyle = "#FB7185";
    ctx.beginPath();
    ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ball (blink while invulnerable)
  const blink = invuln > 0 && Math.floor(now / 90) % 2 === 0;
  if (!blink) {
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#5EEAD4";
    ctx.fillStyle = "#5EEAD4";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // timer bar (top edge)
  const pct = Math.max(0, Math.min(1, timer / timerMax));
  const barH = Math.max(3, size * 0.012);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(0, 0, size, barH);
  ctx.fillStyle = pct > 0.3 ? "#5EEAD4" : "#FB7185";
  ctx.fillRect(0, 0, size * pct, barH);
}