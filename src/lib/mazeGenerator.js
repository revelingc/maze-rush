// Maze generation + collision/movement engine for Maze Rush.

export const DX = [0, 1, 0, -1]; // top, right, bottom, left
export const DY = [-1, 0, 1, 0];

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
export function generateMaze(cols, rows, loops = 0) {
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
        neighbors[Math.floor(Math.random() * neighbors.length)];
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
      const cx = Math.floor(Math.random() * cols);
      const cy = Math.floor(Math.random() * rows);
      const dir = Math.floor(Math.random() * 4);
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

  return { grid, cols, rows };
}

/**
 * Returns the difficulty configuration for a given level.
 * Difficulty grows ~5% per level (compound). Mazes are larger now and
 * scroll beneath the runner, so timers are a bit more generous.
 */
export function getLevelConfig(level) {
  const d = Math.pow(1.05, level - 1); // 5% harder each level
  const size = Math.min(40, 10 + Math.round((level - 1) * 1.1));
  const hazards = level >= 3 ? Math.min(12, Math.floor((level - 1) / 1.3)) : 0;
  const hazardSpeed = Math.min(240, 80 * d);
  const timer = Math.max(20, Math.round(58 / d));
  return {
    level,
    cols: size,
    rows: size,
    hazards,
    hazardSpeed,
    timer,
    difficulty: d,
    difficultyPct: Math.round((d - 1) * 100),
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
    const valid = [0, 1, 2, 3].filter((dd) => !cell.walls[dd]);
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