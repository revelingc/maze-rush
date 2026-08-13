// Maze generation + collision/movement engine for Maze Rush.

export const DX = [0, 1, 0, -1]; // top, right, bottom, left
export const DY = [-1, 0, 1, 0];

// Deterministic PRNG so a given level always generates the same maze — this
// makes best times and replay ghosts meaningful (same course every attempt).
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Levels that introduce a new obstacle (used for the intro overlay).
export const INTRO_LEVELS = { 3: "hazards", 12: "lasers", 24: "hunters" };

const DIRS = [
  { dx: 0, dy: -1, wall: 0, opp: 2 }, // top
  { dx: 1, dy: 0, wall: 1, opp: 3 }, // right
  { dx: 0, dy: 1, wall: 2, opp: 0 }, // bottom
  { dx: -1, dy: 0, wall: 3, opp: 1 }, // left
];

/**
 * Generates a perfect maze using recursive backtracking.
 * Each cell has walls: [top, right, bottom, left] (booleans).
 */
export function generateMaze(cols, rows, loops = 0, rng = Math.random) {
  const grid = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      grid.push({ x, y, walls: [true, true, true, true], visited: false });
    }
  }
  const idx = (x, y) =>
    x < 0 || y < 0 || x >= cols || y >= rows ? -1 : y * cols + x;

  const stack = [];
  let current = grid[0];
  current.visited = true;

  while (true) {
    const { x, y } = current;
    const neighbors = [];
    for (const d of DIRS) {
      const ni = idx(x + d.dx, y + d.dy);
      if (ni >= 0 && !grid[ni].visited) neighbors.push({ cell: grid[ni], dir: d });
    }
    if (neighbors.length > 0) {
      const { cell: next, dir } =
        neighbors[Math.floor(rng() * neighbors.length)];
      current.walls[dir.wall] = false;
      next.walls[dir.opp] = false;
      stack.push(current);
      next.visited = true;
      current = next;
    } else if (stack.length > 0) {
      current = stack.pop();
    } else {
      break;
    }
  }

  // Add extra cutouts (loops) so there are alternate routes around hazards.
  if (loops > 0) {
    let added = 0;
    let guard = 0;
    while (added < loops && guard < loops * 12) {
      guard++;
      const cx = Math.floor(rng() * cols);
      const cy = Math.floor(rng() * rows);
      const dir = Math.floor(rng() * 4);
      if (dir === 0 && cy === 0) continue;
      if (dir === 1 && cx === cols - 1) continue;
      if (dir === 2 && cy === rows - 1) continue;
      if (dir === 3 && cx === 0) continue;
      const cell = grid[cy * cols + cx];
      if (!cell.walls[dir]) continue; // already open
      const nx = cx + DX[dir];
      const ny = cy + DY[dir];
      cell.walls[dir] = false;
      grid[ny * cols + nx].walls[(dir + 2) % 4] = false;
      added++;
    }
  }

  // Guarantee two exits from the start cell (top-left) and two entrances into
  // the exit cell (bottom-right). Both corners only have two in-bounds neighbors,
  // so we open both of their interior walls, creating alternate routes in/out.
  ensureEndpointsOpen(grid, cols, rows, idx);

  return { grid, cols, rows };
}

function ensureEndpointsOpen(grid, cols, rows, idx) {
  const set = (i, wall) => { if (i >= 0) grid[i].walls[wall] = false; };
  // Start cell (0,0): open right + bottom (two ways out).
  if (cols > 1) { set(0, 1); set(idx(1, 0), 3); }
  if (rows > 1) { set(0, 2); set(idx(0, 1), 0); }
  // Exit cell (cols-1, rows-1): open left + top (two ways in).
  const ex = cols - 1, ey = rows - 1;
  if (cols > 1) { set(idx(ex, ey), 3); set(idx(ex - 1, ey), 1); }
  if (rows > 1) { set(idx(ex, ey), 0); set(idx(ex, ey - 1), 2); }

  // If one of an endpoint's two neighbors is a 1-cell dead-end (only connects
  // back to the endpoint), open one more wall on it so the route continues —
  // otherwise that "second way" runs straight into a wall and feels like the
  // start/exit has only one real exit.
  const through = (cellI, backWall) => {
    const cell = grid[cellI];
    if (!cell) return;
    const openCount = cell.walls.filter((w) => !w).length;
    if (openCount >= 2) return; // already leads onward
    for (const d of DIRS) {
      if (d.wall === backWall) continue;
      const ni = idx(cell.x + d.dx, cell.y + d.dy);
      if (ni < 0) continue;            // boundary
      if (!cell.walls[d.wall]) continue; // already open
      cell.walls[d.wall] = false;
      grid[ni].walls[d.opp] = false;
      return;
    }
  };
  if (cols > 1) through(idx(1, 0), 3);        // start's right neighbor
  if (rows > 1) through(idx(0, 1), 0);        // start's bottom neighbor
  if (cols > 1) through(idx(ex - 1, ey), 1);  // exit's left neighbor
  if (rows > 1) through(idx(ex, ey - 1), 2); // exit's top neighbor
}

/**
 * Returns the difficulty configuration for a given level.
 * Difficulty grows ~2% per level (compound). Mazes are larger now and
 * scroll beneath the runner, so timers are a bit more generous.
 */
export function getLevelConfig(level, cycle = 1) {
  const cycleMult = Math.pow(1.5, cycle - 1); // +50% base per completed 100-level run
  const d = Math.pow(1.02, level - 1) * cycleMult; // 2% harder each level, cycle-scaled
  const size = Math.min(40, Math.round(10 * Math.pow(1.03, level - 1))); // map grows 3% per level
  const hazards = level >= 3 ? Math.min(12, Math.floor((level - 1) / 1.3)) : 0;
  const hazardSpeed = Math.min(288, 96 * d);
  // Timer caps at 75s and floors at 50s so every level is completable but
  // stays challenging as the maze and obstacles scale up.
  const timer = Math.max(50, Math.min(75, Math.round(75 / Math.sqrt(d))));
  const lasers = level >= 12 ? Math.min(5, Math.floor((level - 12) / 5) + 1) : 0;
  const hunters = level >= 24 ? 1 : 0;
  const hunterSpeed = Math.min(60, 24 * d);
  return {
    level,
    cols: size,
    rows: size,
    hazards,
    hazardSpeed,
    lasers,
    hunters,
    hunterSpeed,
    timer,
    difficulty: d,
    difficultyPct: Math.round((d - 1) * 100),
    cycle,
  };
}

function resolveCircleSegment(ball, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((ball.x - x1) * dx + (ball.y - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  let ndx = ball.x - cx;
  let ndy = ball.y - cy;
  let dist = Math.hypot(ndx, ndy);
  if (dist >= ball.r) return;
  if (dist < 0.0001) {
    ndx = -dy;
    ndy = dx;
    dist = Math.hypot(ndx, ndy) || 1;
  }
  const overlap = ball.r - dist;
  ball.x += (ndx / dist) * overlap;
  ball.y += (ndy / dist) * overlap;
}

/**
 * Resolves the ball against the walls of its current and neighboring cells.
 */
export function resolveCollisions(ball, maze, cs) {
  const cx = Math.floor(ball.x / cs);
  const cy = Math.floor(ball.y / cs);
  for (let oy = -1; oy <= 1; oy++) {
    for (let ox = -1; ox <= 1; ox++) {
      const gx = cx + ox;
      const gy = cy + oy;
      if (gx < 0 || gy < 0 || gx >= maze.cols || gy >= maze.rows) continue;
      const cell = maze.grid[gy * maze.cols + gx];
      const x0 = gx * cs;
      const y0 = gy * cs;
      const x1 = x0 + cs;
      const y1 = y0 + cs;
      if (cell.walls[0]) resolveCircleSegment(ball, x0, y0, x1, y0);
      if (cell.walls[1]) resolveCircleSegment(ball, x1, y0, x1, y1);
      if (cell.walls[2]) resolveCircleSegment(ball, x0, y1, x1, y1);
      if (cell.walls[3]) resolveCircleSegment(ball, x0, y0, x0, y1);
    }
  }
}

/**
 * Advances a hazard along the maze corridors.
 */
export function updateHazard(h, dt, maze, cs) {
  const tcx = h.targetX * cs + cs / 2;
  const tcy = h.targetY * cs + cs / 2;
  const dx = tcx - h.x;
  const dy = tcy - h.y;
  const dist = Math.hypot(dx, dy);
  const step = h.speed * dt;

  if (dist <= step || dist < 0.5) {
    h.x = tcx;
    h.y = tcy;
    h.cellX = h.targetX;
    h.cellY = h.targetY;
    const cell = maze.grid[h.cellY * maze.cols + h.cellX];
    const valid = [0, 1, 2, 3].filter(
      (dd) => !cell.walls[dd] && !(cell.x + DX[dd] === 0 && cell.y + DY[dd] === 0)
    );
    if (valid.length === 0) {
      h.dir = -1;
      return;
    }
    const reverse = h.dir === -1 ? -1 : (h.dir + 2) % 4;
    let choices = valid.filter((dd) => dd !== reverse);
    if (choices.length === 0) choices = valid;
    const nd = choices[Math.floor(Math.random() * choices.length)];
    h.dir = nd;
    h.targetX = h.cellX + DX[nd];
    h.targetY = h.cellY + DY[nd];
  } else {
    h.x += (dx / dist) * step;
    h.y += (dy / dist) * step;
  }
}

/**
 * Returns the world-space segment a laser beam occupies.
 * The emitter is mounted on the midpoint of a real wall (`laser.wall`:
 * 0=top,1=right,2=bottom,3=left) of cell (cx,cy) and fires one cell deep
 * into that cell's open space — wall to blank space, never floating.
 */
export function laserSegment(laser, cs) {
  const x0 = laser.cx * cs;
  const y0 = laser.cy * cs;
  switch (laser.wall) {
    case 0: return { ax: x0 + cs / 2, ay: y0, bx: x0 + cs / 2, by: y0 + cs };      // top wall -> fires down
    case 1: return { ax: x0 + cs, ay: y0 + cs / 2, bx: x0, by: y0 + cs / 2 };      // right wall -> fires left
    case 2: return { ax: x0 + cs / 2, ay: y0 + cs, bx: x0 + cs / 2, by: y0 };      // bottom wall -> fires up
    default: return { ax: x0, ay: y0 + cs / 2, bx: x0 + cs, by: y0 + cs / 2 };    // left wall -> fires right
  }
}

/**
 * Advances a laser through its warn -> fire -> idle cycle.
 */
export function updateLaser(laser, dt) {
  laser.t -= dt;
  if (laser.t > 0) return;
  if (laser.phase === "warn") { laser.phase = "fire"; laser.t = laser.fireTime; }
  else if (laser.phase === "fire") { laser.phase = "idle"; laser.t = laser.idleTime; }
  else { laser.phase = "warn"; laser.t = laser.warnTime; }
}

/**
 * Distance from a point to a segment.
 */
export function pointSegDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

/**
 * A hunter homes toward the ball, flying straight through walls.
 */
export function updateHunter(hunter, dt, ball, maze, cs) {
  const dx = ball.x - hunter.x;
  const dy = ball.y - hunter.y;
  const dist = Math.hypot(dx, dy) || 1;
  const tx = (dx / dist) * hunter.speed;
  const ty = (dy / dist) * hunter.speed;
  const k = Math.min(1, dt * 2.5);
  hunter.vx += (tx - hunter.vx) * k;
  hunter.vy += (ty - hunter.vy) * k;
  hunter.x += hunter.vx * dt;
  hunter.y += hunter.vy * dt;
  const W = maze.cols * cs;
  const H = maze.rows * cs;
  hunter.x = Math.max(hunter.r, Math.min(W - hunter.r, hunter.x));
  hunter.y = Math.max(hunter.r, Math.min(H - hunter.r, hunter.y));
}