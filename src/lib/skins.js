// Dot skins for Maze Rush. Default is free; colored dots unlock every 5 levels.
// The Shooting Star is a purchasable cosmetic.
export const DOT_SKINS = [
  { id: "default", name: "Teal", unlockLevel: 0, color: "#5EEAD4" },
  { id: "sky", name: "Sky", unlockLevel: 5, color: "#38BDF8" },
  { id: "violet", name: "Violet", unlockLevel: 10, color: "#A78BFA" },
  { id: "rose", name: "Rose", unlockLevel: 15, color: "#FB7185" },
  { id: "amber", name: "Amber", unlockLevel: 20, color: "#FBBF24" },
  { id: "emerald", name: "Emerald", unlockLevel: 25, color: "#34D399" },
  { id: "pink", name: "Pink", unlockLevel: 30, color: "#F472B6" },
  { id: "lime", name: "Lime", unlockLevel: 35, color: "#A3E635" },
  { id: "orange", name: "Orange", unlockLevel: 40, color: "#FB923C" },
  { id: "indigo", name: "Indigo", unlockLevel: 45, color: "#818CF8" },
  { id: "star", name: "Shooting Star", unlockLevel: Infinity, color: "#FDE68A", star: true, price: 1.99 },
];

export const getSkin = (id) => DOT_SKINS.find((s) => s.id === id) || DOT_SKINS[0];
export const isSkinUnlocked = (skin, bestLevel) => bestLevel >= skin.unlockLevel;