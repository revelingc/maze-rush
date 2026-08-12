// Screen- and world-space particle systems for Maze Rush: ambient biome
// atmosphere (drifting embers, falling snow, twinkling stars…) plus one-shot
// bursts for death and level-clear celebrations. All drawn on the game canvas.

function drawSpark(ctx, x, y, r, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const ang = (Math.PI / 4) * i;
    const rad = i % 2 === 0 ? r : r * 0.4;
    const px = Math.cos(ang) * rad;
    const py = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ---- ambient biome particles (screen space, behind the world) ----

function makeAmbient(a, w, h, u) {
  const type = a.type;
  const size = u * (a.size || 0.013) * (0.6 + Math.random() * 0.8);
  let vx = 0;
  let vy = 0;
  if (type === "rise") vy = -(8 + Math.random() * 14);
  else if (type === "fall") vy = 8 + Math.random() * 14;
  else if (type === "drift") {
    vx = (Math.random() - 0.5) * 10;
    vy = (Math.random() - 0.5) * 6;
  }
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx,
    vy,
    size,
    color: a.color,
    type,
    phase: Math.random() * Math.PI * 2,
    twSpeed: 1 + Math.random() * 2,
  };
}

export function initAmbient(st, biome) {
  st.ambientParticles = [];
  if (!biome || !biome.ambient) return;
  const a = biome.ambient;
  const w = st.w || 320;
  const h = st.h || 320;
  const u = Math.min(w, h);
  const count = Math.max(10, Math.min(80, Math.round(((w * h) / 16000) * a.density)));
  for (let i = 0; i < count; i++) {
    st.ambientParticles.push(makeAmbient(a, w, h, u));
  }
}

export function updateAmbient(st, dt) {
  const ap = st.ambientParticles;
  if (!ap || !ap.length) return;
  const w = st.w || 320;
  const h = st.h || 320;
  for (const p of ap) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.phase += p.twSpeed * dt;
    if (p.x < -20) p.x = w + 20;
    else if (p.x > w + 20) p.x = -20;
    if (p.y < -20) p.y = h + 20;
    else if (p.y > h + 20) p.y = -20;
  }
}

export function drawAmbient(ctx, st) {
  const ap = st.ambientParticles;
  if (!ap || !ap.length) return;
  for (const p of ap) {
    const alpha = p.type === "twinkle" ? 0.2 + 0.45 * (0.5 + 0.5 * Math.sin(p.phase)) : 0.32;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ---- one-shot bursts (death / level clear) ----

export function spawnBurst(st, x, y, opts = {}) {
  if (!st.burstParticles) st.burstParticles = [];
  const {
    count = 24, color = "#5EEAD4", speed = 240, life = 0.7,
    world = false, shapes = ["circle"],
  } = opts;
  const cs = st.cs || 24;
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = speed * (0.4 + Math.random() * 0.9);
    st.burstParticles.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: life * (0.7 + Math.random() * 0.6),
      maxLife: life,
      size: cs * (0.05 + Math.random() * 0.07),
      color,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      world: !!world,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 12,
    });
  }
}

export function updateBurst(st, dt) {
  const bp = st.burstParticles;
  if (!bp || !bp.length) return;
  for (let i = bp.length - 1; i >= 0; i--) {
    const p = bp[i];
    p.life -= dt;
    if (p.life <= 0) {
      bp.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 1 - 1.6 * dt;
    p.vy *= 1 - 1.6 * dt;
    p.rot += p.vr * dt;
  }
}

export function drawBurst(ctx, st, layer) {
  const bp = st.burstParticles;
  if (!bp || !bp.length) return;
  for (const p of bp) {
    if ((layer === "world") !== !!p.world) continue;
    const a = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 12;
    ctx.shadowColor = p.color;
    if (p.shape === "spark") {
      drawSpark(ctx, p.x, p.y, p.size * (0.6 + a * 0.6), p.rot);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.5 + a * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}