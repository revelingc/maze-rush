// Move-trail cosmetics for Maze Rush. Each colored dot has a matching trail
// style purchasable for $0.99. The "Stardust" trail is $1.99 on its own and
// is also unlocked by the Shooting Star skin (starOwned).

export const TRAILS = [
  { id: "bubbles",  name: "Bubbles",  skinId: "default", color: "#5EEAD4", price: 0, unlockLevel: 15, style: "bubble",   desc: "Translucent bubbles rise and pop behind your dot. Free at level 15." },
  { id: "mist",     name: "Mist",     skinId: "sky",     color: "#38BDF8", price: 0.99, style: "puff",     desc: "A soft, drifting cloud of misty puffs." },
  { id: "sparkle",  name: "Sparkle",  skinId: "violet",  color: "#A78BFA", price: 0.99, style: "sparkle",  desc: "Shimmering glitter that twinkles and fades." },
  { id: "petals",   name: "Petals",   skinId: "rose",    color: "#FB7185", price: 0.99, style: "petal",    desc: "Delicate flower petals drift down in your wake." },
  { id: "embers",   name: "Embers",   skinId: "amber",   color: "#FBBF24", price: 0.99, style: "ember",    desc: "Glowing embers float upward like a dying fire." },
  { id: "leaves",   name: "Leaves",   skinId: "emerald", color: "#34D399", price: 0.99, style: "leaf",     desc: "Autumn leaves flutter and spin behind you." },
  { id: "hearts",   name: "Hearts",   skinId: "pink",    color: "#F472B6", style: "heart",    desc: "Tiny floating hearts trail your every move. Unlock with 10 confirmed shares.", shareUnlock: true, unlockShares: 10 },
  { id: "pixels",   name: "Pixels",   skinId: "lime",    color: "#A3E635", price: 0.99, style: "pixel",    desc: "Blocky 8-bit pixels stack up behind your dot." },
  { id: "flames",   name: "Flames",   skinId: "orange",  color: "#FB923C", price: 0.99, style: "flame",    desc: "Flickering flame tongues lick up from your path." },
  { id: "galaxy",   name: "Galaxy",   skinId: "indigo",  color: "#818CF8", price: 0.99, style: "galaxy",   desc: "Swirling star fragments from a distant galaxy." },
  { id: "stardust", name: "Stardust", skinId: "star",    color: "#FDE68A", price: 1.99, style: "stardust", desc: "A golden shower of stardust trailing your dot.", star: true },
];

export const getTrail = (id) => TRAILS.find((t) => t.id === id) || null;

export function isTrailUnlocked(trail, starOwned = false, trailsOwned = [], bestLevel = 0, confirmedShares = 0) {
  if (!trail) return false;
  if (trail.shareUnlock) return confirmedShares >= (trail.unlockShares || 0);
  if (trail.star) return !!starOwned || trailsOwned.includes(trail.id);
  if (trail.unlockLevel) return bestLevel >= trail.unlockLevel;
  return trailsOwned.includes(trail.id);
}

const R = () => (Math.random() - 0.5);

function emitParticle(st, x, y, sFac = 0) {
  const style = st.trailStyle;
  const color = st.trailColor || "#5EEAD4";
  const cs = st.cs;
  const base = {
    x: x + R() * cs * 0.18,
    y: y + R() * cs * 0.18,
    rot: Math.random() * Math.PI * 2,
    vr: R() * 5,
    tw: Math.random() * Math.PI * 2,
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
      p = { ...base, vx: R() * 9, vy: R() * 9, life: 0.5, maxLife: 0.5, size: cs * 0.08, shape: "glitter" };
      break;
    case "petal":
      p = { ...base, vx: R() * 6, vy: 9 + R() * 5, life: 0.9, maxLife: 0.9, size: cs * 0.14, shape: "petal", vr: R() * 8 };
      break;
    case "ember":
      p = { ...base, vx: R() * 6, vy: -12 - Math.random() * 8, life: 0.7, maxLife: 0.7, size: cs * 0.09, shape: "circle" };
      break;
    case "leaf":
      p = { ...base, vx: R() * 12, vy: 7 + R() * 5, life: 0.9, maxLife: 0.9, size: cs * 0.15, shape: "leaf", vr: R() * 9 };
      break;
    case "heart":
      p = { ...base, vx: R() * 5, vy: 5 + R() * 4, life: 0.8, maxLife: 0.8, size: cs * 0.13, shape: "heart", vr: R() * 3 };
      break;
    case "pixel":
      p = { ...base, vx: R() * 3, vy: R() * 3, life: 0.5, maxLife: 0.5, size: cs * 0.11, shape: "square", rot: 0, vr: 0 };
      break;
    case "flame":
      p = { ...base, vx: R() * 7, vy: -14 - Math.random() * 6, life: 0.5, maxLife: 0.5, size: cs * 0.11, shape: "flame", vr: R() * 3 };
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
  // Speed-reactive: faster movement grows the particles for a richer wake.
  if (sFac) p.size *= 1 + sFac * 0.45;
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
  // Speed-reactive: faster movement spawns more (and larger) trail particles,
  // so fast runs leave a richer, brighter wake.
  const spMax = (st.cs || 1) * 11;
  const sFac = Math.min(1, sp / spMax);
  const base =
    st.trailStyle === "stardust" || st.trailStyle === "sparkle" ? 3
    : st.trailStyle === "galaxy" ? 2
    : 1;
  const n = Math.max(1, Math.round(base * (1 + sFac * 2)));
  for (let i = 0; i < n; i++) emitParticle(st, ball.x, ball.y, sFac);
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

// Glitter: a sharp 4-point sparkle with a bright white, twinkling core.
function drawGlitter(ctx, p) {
  const lr = 1 - p.life / p.maxLife;
  const tw = 1 + 0.4 * Math.sin(p.tw + lr * 12);
  const r = p.size * (1 - lr * 0.3) * tw;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.7);
  ctx.lineTo(r * 0.22, -r * 0.22);
  ctx.lineTo(r * 1.7, 0);
  ctx.lineTo(r * 0.22, r * 0.22);
  ctx.lineTo(0, r * 1.7);
  ctx.lineTo(-r * 0.22, r * 0.22);
  ctx.lineTo(-r * 1.7, 0);
  ctx.lineTo(-r * 0.22, -r * 0.22);
  ctx.closePath();
  ctx.fill();
  // bright white core
  const prev = ctx.globalAlpha;
  ctx.globalAlpha = Math.min(1, prev * 0.95);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = prev;
  ctx.restore();
}

// A classic heart, point down.
function drawHeart(ctx, p) {
  const lr = 1 - p.life / p.maxLife;
  const s = p.size * (1 - lr * 0.2);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.beginPath();
  ctx.moveTo(0, s * 0.3);
  ctx.bezierCurveTo(0, -s * 0.1, -s, -s * 0.1, -s, s * 0.25);
  ctx.bezierCurveTo(-s, s * 0.55, 0, s * 0.75, 0, s);
  ctx.bezierCurveTo(0, s * 0.75, s, s * 0.55, s, s * 0.25);
  ctx.bezierCurveTo(s, -s * 0.1, 0, -s * 0.1, 0, s * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// A teardrop flower petal.
function drawPetal(ctx, p) {
  const lr = 1 - p.life / p.maxLife;
  const s = p.size * (1 - lr * 0.2);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.bezierCurveTo(s * 0.7, -s * 0.5, s * 0.7, s * 0.6, 0, s);
  ctx.bezierCurveTo(-s * 0.7, s * 0.6, -s * 0.7, -s * 0.5, 0, -s);
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
      // crisp, un-rotated pixel block (no glow — handled by drawTrail)
      const sz = p.size * (1 - lr * 0.3);
      ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
      break;
    }
    case "star4":
      drawSpark(ctx, p.x, p.y, p.size, p.rot);
      break;
    case "glitter":
      drawGlitter(ctx, p);
      break;
    case "petal":
      drawPetal(ctx, p);
      break;
    case "heart":
      drawHeart(ctx, p);
      break;
    case "leaf": {
      const s = p.size * (1 - lr * 0.2);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      // almond leaf body
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.8, -s * 0.4, s * 0.8, s * 0.4, 0, s);
      ctx.bezierCurveTo(-s * 0.8, s * 0.4, -s * 0.8, -s * 0.4, 0, -s);
      ctx.closePath();
      ctx.fill();
      // central vein
      ctx.save();
      ctx.globalAlpha *= 0.5;
      ctx.lineWidth = Math.max(0.6, s * 0.08);
      ctx.strokeStyle = ctx.fillStyle;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.85);
      ctx.lineTo(0, s * 0.85);
      ctx.stroke();
      ctx.restore();
      ctx.restore();
      break;
    }
    case "flame": {
      const s = p.size * (1 - lr * 0.2);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      // flame teardrop, tip up
      ctx.beginPath();
      ctx.moveTo(0, -s * 1.4);
      ctx.bezierCurveTo(s * 0.8, -s * 0.4, s * 0.6, s * 0.6, 0, s * 0.7);
      ctx.bezierCurveTo(-s * 0.6, s * 0.6, -s * 0.8, -s * 0.4, 0, -s * 1.4);
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
    // pixels stay crisp and blocky; everything else glows softly
    ctx.shadowBlur = p.shape === "square" ? 0 : 8;
    ctx.shadowColor = p.color;
    drawShape(ctx, p);
    ctx.restore();
  }
}