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

// Blocklist of common profanity / slurs / hate terms. Matched as substrings
// against a leetspeak-normalized (and character-collapsed) form of the input,
// so common bypasses like "sh1t", "f@ck", "fuuuuck" are caught too.
const BAD_WORDS = [
  "fuck", "shit", "bitch", "asshole", "bastard", "dick", "pussy",
  "cunt", "whore", "slut", "nigger", "nigga", "faggot", "retard",
  "cock", "douche", "wank", "twat", "prick", "bollock", "jackass",
  "motherfucker", "jizz", "spic", "chink", "gook", "dyke", "tranny",
  "pedo", "pedophile", "molest", "incest", "coomer", "thot", "skank",
];

function normalize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/@/g, "a")
    .replace(/\$/g, "s")
    .replace(/\+/g, "t")
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/8/g, "b")
    .replace(/[^a-z0-9]/g, "");
}

export function containsProfanity(text) {
  const t = normalize(text);
  if (!t) return false;
  const collapsed = t.replace(/(.)\1+/g, "$1");
  return BAD_WORDS.some((w) => t.includes(w) || collapsed.includes(w));
}