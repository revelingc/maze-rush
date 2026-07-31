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

// Comprehensive blocklist of profanity, slurs, hate terms, sexual / violent
// content and drug references. Matched as substrings against a
// leetspeak-normalized (and character-collapsed) form of the input, so common
// bypasses like "sh1t", "f@ck", "f.u.c.k", "fuuuuck", "a$$hole" are caught too.
const BAD_WORDS = [
  // core profanity (compounds containing "fuck"/"shit" are caught by the root)
  "fuck", "shit", "bitch", "asshole", "arsehole", "bastard", "dick", "pussy",
  "cunt", "whore", "slut", "cock", "douche", "wank", "wanker", "twat",
  "prick", "bollock", "jackass", "jizz", "damn", "goddamn", "feck", "shag",
  "slag", "bint", "tosser", "perv", "dipshit", "shithead", "shithole",
  // sexual / explicit
  "cumshot", "cumming", "gangbang", "handjob", "blowjob", "dildo", "boner",
  "milf", "dilf", "horny", "poon", "penis", "vagina", "anus", "ballsack",
  "nutshot", "rimjob", "circlejerk",
  // slurs / hate
  "nigger", "nigga", "faggot", "fag", "retard", "retarded", "spic", "spick",
  "chink", "gook", "dyke", "kike", "wetback", "towelhead", "raghead",
  "kraut", "wop", "honky", "cracker", "coon", "gypsy", "tranny", "shemale",
  "ladyboy", "mong", "paki", "redskin", "halfcaste",
  // harm / violence / self-harm
  "rape", "rapist", "raping", "molest", "molester", "pedophile", "pedo",
  "paedophile", "incest", "bestiality", "beastiality", "necrophilia",
  "suicide", "selfharm", "terrorist", "taliban", "nazi", "nazism", "hitler",
  "kkk", "genocide", "lynch",
  // drugs
  "cocaine", "heroin", "methamphetamine", "methhead", "crackhead", "junkie",
  "ecstasy", "lsd", "pcp", "crackpipe", "drugdealer",
];

function normalize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/\(\)/g, "o")
    .replace(/@/g, "a")
    .replace(/\$/g, "s")
    .replace(/\+/g, "t")
    .replace(/!/g, "i")
    .replace(/\|/g, "i")
    .replace(/€/g, "e")
    .replace(/£/g, "l")
    .replace(/§/g, "s")
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/8/g, "b")
    .replace(/9/g, "g")
    .replace(/6/g, "g")
    .replace(/[^a-z0-9]/g, "");
}

export function containsProfanity(text) {
  const t = normalize(text);
  if (!t) return false;
  // Collapse repeated characters to catch "fuuuuck", "shiiit", "biitch".
  const collapsed = t.replace(/(.)\1+/g, "$1");
  return BAD_WORDS.some((w) => t.includes(w) || collapsed.includes(w));
}