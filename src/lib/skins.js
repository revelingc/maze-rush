// Dot skins for Maze Rush. The default is free; a new color unlocks every 5
// levels up to level 95 (20 colors total). The Shooting Star is a purchasable
// cosmetic. The Black Hole is the reward for clearing level 100.
export const DOT_SKINS = [
  { id: "default",  name: "Teal",     unlockLevel: 0,   color: "#5EEAD4" },
  { id: "sky",      name: "Sky",      unlockLevel: 5,   color: "#38BDF8" },
  { id: "violet",   name: "Violet",   unlockLevel: 10,  color: "#A78BFA" },
  { id: "rose",     name: "Rose",     unlockLevel: 15,  color: "#FB7185" },
  { id: "amber",    name: "Amber",    unlockLevel: 20,  color: "#FBBF24" },
  { id: "emerald",  name: "Emerald",  unlockLevel: 25,  color: "#34D399" },
  { id: "pink",     name: "Pink",     unlockLevel: 30,  color: "#F472B6" },
  { id: "lime",     name: "Lime",     unlockLevel: 35,  color: "#A3E635" },
  { id: "orange",   name: "Orange",   unlockLevel: 40,  color: "#FB923C" },
  { id: "indigo",   name: "Indigo",   unlockLevel: 45,  color: "#818CF8" },
  { id: "cyan",     name: "Cyan",     unlockLevel: 50,  color: "#22D3EE" },
  { id: "magenta",  name: "Magenta",  unlockLevel: 55,  color: "#E879F9" },
  { id: "gold",     name: "Gold",     unlockLevel: 60,  color: "#FACC15" },
  { id: "mint",     name: "Mint",     unlockLevel: 65,  color: "#6EE7B7" },
  { id: "coral",    name: "Coral",    unlockLevel: 70,  color: "#F87171" },
  { id: "azure",    name: "Azure",    unlockLevel: 75,  color: "#60A5FA" },
  { id: "jade",     name: "Jade",     unlockLevel: 80,  color: "#2DD4BF" },
  { id: "crimson",  name: "Crimson",  unlockLevel: 85,  color: "#DC2626" },
  { id: "lavender", name: "Lavender", unlockLevel: 90,  color: "#C4B5FD" },
  { id: "slate",    name: "Slate",    unlockLevel: 95,  color: "#94A3B8" },
  { id: "star",     name: "Shooting Star", unlockLevel: Infinity, color: "#FDE68A", star: true, price: 3.99 },
  { id: "blackhole", name: "Black Hole", unlockLevel: 100, color: "#0B0F1A", blackhole: true },
];

export const getSkin = (id) => DOT_SKINS.find((s) => s.id === id) || DOT_SKINS[0];
export const isSkinUnlocked = (skin, bestLevel) => bestLevel >= skin.unlockLevel;