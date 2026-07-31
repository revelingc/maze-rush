// Dot skins for Maze Rush. Default is free; the rest unlock every 10 levels,
// with the Shooting Star unlocking at level 100.
export const DOT_SKINS = [
  { id: "default", name: "Teal", unlockLevel: 0, color: "#5EEAD4" },
  { id: "sky", name: "Sky", unlockLevel: 10, color: "#38BDF8" },
  { id: "violet", name: "Violet", unlockLevel: 20, color: "#A78BFA" },
  { id: "rose", name: "Rose", unlockLevel: 30, color: "#FB7185" },
  { id: "amber", name: "Amber", unlockLevel: 40, color: "#FBBF24" },
  { id: "emerald", name: "Emerald", unlockLevel: 50, color: "#34D399" },
  { id: "pink", name: "Pink", unlockLevel: 60, color: "#F472B6" },
  { id: "lime", name: "Lime", unlockLevel: 70, color: "#A3E635" },
  { id: "orange", name: "Orange", unlockLevel: 80, color: "#FB923C" },
  { id: "indigo", name: "Indigo", unlockLevel: 90, color: "#818CF8" },
  { id: "star", name: "Shooting Star", unlockLevel: Infinity, color: "#FDE68A", star: true, price: 1.99 },
];

export const getSkin = (id) => DOT_SKINS.find((s) => s.id === id) || DOT_SKINS[0];
export const isSkinUnlocked = (skin, bestLevel) => bestLevel >= skin.unlockLevel;