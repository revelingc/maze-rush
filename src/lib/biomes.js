// Biome theming for Maze Rush. Each completed 100-level run advances the cycle,
// rotating the world through a distinct atmospheric palette (Crossy-Road style).
// Biomes drive ambient background particles + a mood tint + the accent used for
// celebration bursts. They do NOT override the player's custom color picks.

export const BIOMES = [
  {
    id: "neon", name: "Neon", accent: "#5EEAD4", tint: "#0B0F1A",
    ambient: { type: "drift", color: "#5EEAD4", density: 0.4, size: 0.012 },
  },
  {
    id: "ember", name: "Ember", accent: "#FB923C", tint: "#3B1206",
    ambient: { type: "rise", color: "#FBBF24", density: 0.9, size: 0.014 },
  },
  {
    id: "frost", name: "Frost", accent: "#7DD3FC", tint: "#062038",
    ambient: { type: "fall", color: "#E0F2FE", density: 1.0, size: 0.016 },
  },
  {
    id: "toxic", name: "Toxic", accent: "#A3E635", tint: "#06140A",
    ambient: { type: "drift", color: "#34D399", density: 0.7, size: 0.013 },
  },
  {
    id: "cosmos", name: "Cosmos", accent: "#A78BFA", tint: "#1A0B3A",
    ambient: { type: "twinkle", color: "#C4B5FD", density: 1.0, size: 0.012 },
  },
  {
    id: "dune", name: "Dune", accent: "#F59E0B", tint: "#2A1A05",
    ambient: { type: "drift", color: "#FCD34D", density: 0.5, size: 0.014 },
  },
];

export function getBiome(cycle = 1) {
  return BIOMES[(cycle - 1) % BIOMES.length];
}