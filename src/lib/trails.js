// Move-trail cosmetics for Maze Rush. Each colored dot has a matching trail
// style purchasable for $0.99. The "Stardust" trail is bundled with the
// Shooting Star purchase (price 0, unlocked via starOwned).

export const TRAILS = [
  { id: "bubbles",  name: "Bubbles",  skinId: "default", color: "#5EEAD4", price: 0.99, style: "bubble" },
  { id: "mist",     name: "Mist",     skinId: "sky",     color: "#38BDF8", price: 0.99, style: "puff" },
  { id: "sparkle",  name: "Sparkle",  skinId: "violet",  color: "#A78BFA", price: 0.99, style: "sparkle" },
  { id: "petals",   name: "Petals",   skinId: "rose",    color: "#FB7185", price: 0.99, style: "petal" },
  { id: "embers",  name: "Embers",   skinId: "amber",   color: "#FBBF24", price: 0.99, style: "ember" },
  { id: "leaves",  name: "Leaves",   skinId: "emerald", color: "#34D399", price: 0.99, style: "leaf" },
  { id: "hearts",  name: "Hearts",   skinId: "pink",    color: "#F472B6", price: 0.99, style: "heart" },
  { id: "pixels",  name: "Pixels",   skinId: "lime",   color: "#A3E635", price: 0.99, style: "pixel" },
  { id: "flames",  name: "Flames",   skinId: "orange",  color: "#FB923C", price: 0.99, style: "flame" },
  { id: "galaxy",  name: "Galaxy",   skinId: "indigo", color: "#818CF8", price: 0.99, style: "galaxy" },
  { id: "stardust", name: "Stardust", skinId: "star",  color: "#FDE68A", price: 0,    style: "stardust", star: true },
];

export const getTrail = (id) => TRAILS.find((t) => t.id === id) || null;

export function isTrailUnlocked(trail, starOwned, trailsOwned = []) {
  if (!trail) return false;
  if (trail.star) return !!starOwned;
  return trailsOwned.includes(trail.id);
}

const R = () => (Math.random() - 0.5);

function emitParticle(st, x, y) {
  const style = st.trailStyle;
  const color = st.trailColor || "#5EEAD4";
  const cs = st.cs;
  const base = {
    x: x + R() * cs * 0.18,
    y: y + R() * cs * 0.18,
    rot: Math.random() * Math.PI * 2,
    vr: R() * 5,
    color,
  };
  let p;
  switch (style) {
    case "bubble":
      p = { ...base, vx: R() * 5, vy: R() * 5 - 6, life: 0.6, maxLife: 0.6, size: cs * 0.12, shape: "circle", grow: true };
      break;
    case "puff":
      p = { ...base, vx: R() * 3, vy: R() * 3, life: 0.8, maxLife: 0.8, size: cs * 0.16, shape: "circle", grow: true };
      break;
    case "sparkle":
      p = { ...base, vx: R() * 9, vy: R() * 9, life: 0.5, maxLife: 0.5, size: cs * 0.1, shape: "star4" };
      break;
    case "petal":
      p = { ...base, vx: R() * 5, vy: 9 + R() * 4, life: 0.9, maxLife: 0.9, size: cs * 0.12, shape: "diamond" };
      break;
    case "ember":
      p = { ...base, vx: R() * 6, vy: -12 - Math.random() * 8, life: 0.7, maxLife: 0.7, size: cs * 0.09, shape: "circle" };
      break;
    case "leaf":
      p = { ...base, vx: R() * 12, vy: 7 + R() * 5, life: 0.9, maxLife: 0.9, size: cs * 0.14, shape: "leaf" };
      break;
    case "heart":
      p = { ...base, vx: R() * 5, vy: 5 + R() * 4, life: 0.8, maxLife: 0.8, size: cs * 0.1, shape: "heart" };
      break;
    case "pixel":
      p = { ...base, vx: R() * 3, vy: R() * 3, life: 0.5, maxLife: 0.5, size: cs * 0.1, shape: "square" };
      break;
    case "flame":
      p = { ...base, vx: R() * 7, vy: -14 - Math.random() * 6, life: 0.5, maxLife: 0.5, size: cs * 0.11, shape: "flame" };
      break;
    case "galaxy":
      p = { ...base, vx: R() * 14, vy: R() * 14, life: 0.6, maxLife: 0.6, size: cs * 0.07, shape: "star4" };
      break;
    case "stardust":
      p = { ...base, vx: R() * 12, vy: R() * 12, life: 0.7, maxLife: 0.7, size: cs * 0.05 + Math.random() * cs * 0.05, shape: Math.random() < 0.5 ? "star4" : "dot" };
      break;
    default:
      return;
  }
  st.trailParticles.push(p);
  if (st.trailParticles.length > 150) st.trailParticles.shift();
}

export function updateTrail(st, dt) {
  if (!st.trailStyle) return;
  const tp = st.trailParticles;
  for (let i = tp.length - 1; i >= 0; i--) {
    const p = tp[i];
    p.life -= dt;
    if (p.life <= 0) { tp.splice(i, 1); continue; }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= (1 - 1.6 * dt);
    p.vy *= (1 - 1.6 * dt);
    p.rot += p.vr * dt;
  }
  const ball = st.ball;
  const sp = Math.hypot(ball.vx, ball.vy);
  if (sp < 8 || !st.moved) return;
  const n = st.trailStyle === "stardust" ? 3 : (st.trailStyle === "sparkle" || st.trailStyle === "galaxy" ? 2 : 1);
  for (let i = 0; i < n; i++) emitParticle(st, ball.x, ball.y);
}

function drawSpark(ctx, cx, cy, r, rot) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const ang = (Math.PI / 4) * i;
    const rad = i % 2 === 0 ? r : r * 0.32;
    const x = Math.cos(ang) * rad;
    const y = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHeart(ctx, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  ctx.moveTo(0, s * 0.3);
  ctx.bezierCurveTo(s * 0.6, -s * 0.5, s * 1.0, s * 0.2, 0, s * 0.85);
  ctx.bezierCurveTo(-s * 1.0, s * 0.2, -s * 0.6, -s * 0.5, 0, s * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawShape(ctx, p) {
  const lr = 1 - p.life / p.maxLife;
  switch (p.shape) {
    case "circle": {
      const grow = p.grow ? 1 + lr * 0.8 : 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * grow, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "square": {
      const sz = p.size * (1 - lr * 0.3);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillRect(-sz / 2, -sz / 2, sz, sz);
      ctx.restore();
      break;
    }
    case "star4":
      drawSpark(ctx, p.x, p.y, p.size, p.rot);
      break;
    case "diamond": {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.lineTo(p.size * 0.6, 0);
      ctx.lineTo(0, p.size);
      ctx.lineTo(-p.size * 0.6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      break;
    }
    case "heart":
      drawHeart(ctx, p.x, p.y, p.size);
      break;
    case "leaf": {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case "flame": {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.beginPath();
      ctx.moveTo(0, -p.size * 1.3);
      ctx.lineTo(p.size * 0.7, p.size * 0.6);
      ctx.lineTo(-p.size * 0.7, p.size * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      break;
    }
    case "dot":
    default: {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }
}

export function drawTrail(ctx, st) {
  if (!st.trailStyle || !st.trailParticles) return;
  for (const p of st.trailParticles) {
    const a = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = a * 0.9;
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = p.color;
    drawShape(ctx, p);
    ctx.restore();
  }
}