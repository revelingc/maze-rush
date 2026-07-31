// Goofy name generator + lightweight profanity filter for the leaderboard name prompt.

const ADJ = [
  "Sneaky", "Brave", "Zesty", "Wobbly", "Cosmic", "Dizzy", "Fuzzy",
  "Mighty", "Quirky", "Silly", "Turbo", "Snazzy", "Jolly", "Peachy",
  "Rapid", "Breezy", "Salty", "Sparkly",
];

const NOUN = [
  "Penguin", "Waffle", "Narwhal", "Potato", "Llama", "Dumpling",
  "Cactus", "Noodle", "Yeti", "Badger", "Pickle", "Panda", "Goblin",
  "Toaster", "Banana", "Otter", "Mango", "Quokka",
];

export function generateGoofyName() {
  const a = ADJ[Math.floor(Math.random() * ADJ.length)];
  const n = NOUN[Math.floor(Math.random() * NOUN.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  return `${a}${n}${num}`;
}

// A modest blocklist of common profanity / slurs. Matched as substrings
// against the alphanumeric-normalized input.
const BAD_WORDS = [
  "fuck", "shit", "bitch", "asshole", "bastard", "dick", "pussy",
  "cunt", "whore", "slut", "nigger", "nigga", "faggot", "retard",
  "cock", "douche", "wank", "twat", "prick", "bollock", "jackass",
];

export function containsProfanity(text) {
  const t = (text || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return BAD_WORDS.some((w) => t.includes(w));
}