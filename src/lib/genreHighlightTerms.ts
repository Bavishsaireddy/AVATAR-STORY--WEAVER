import type { Genre } from "@/types/story";

/** Evocative vocabulary per genre; longer phrases first in array (regex alternation order). */
const GENRE_HIGHLIGHT_TERMS: Record<Genre, string[]> = {
  Fantasy: [
    "throne room",
    "dark forest",
    "ancient prophecy",
    "prophecy",
    "kingdom",
    "enchant",
    "enchanted",
    "grimoire",
    "dragon",
    "wizard",
    "sorcerer",
    "spell",
    "arcane",
    "ritual",
    "quest",
    "realm",
    "portal",
    "curse",
    "cursed",
    "castle",
    "crown",
    "throne",
    "knight",
    "elven",
    "dwarf",
    "fairy",
    "fae",
    "mage",
    "magic",
    "magical",
    "sword",
    "oath",
    "ancient",
    "sacred",
    "rune",
    "temple",
    "beast",
    "wyrm",
  ],
  "Sci-Fi": [
    "light speed",
    "warp drive",
    "black hole",
    "zero-g",
    "zero g",
    "colony ship",
    "starship",
    "hyperspace",
    "hologram",
    "android",
    "cyborg",
    "xenomorph",
    "quantum",
    "reactor",
    "plasma",
    "nebula",
    "galaxy",
    "cosmos",
    "orbit",
    "asteroid",
    "terraform",
    "biome",
    "colony",
    "alien",
    "species",
    "clone",
    "matrix",
    "cyber",
    "laser",
    "probe",
    "drone",
    "robot",
    "pilot",
    "launch",
    "beacon",
    "signal",
    "void",
    "station",
  ],
  Mystery: [
    "red herring",
    "crime scene",
    "murder weapon",
    "witness",
    "testimony",
    "alibi",
    "detective",
    "sleuth",
    "forensics",
    "evidence",
    "clue",
    "cipher",
    "motive",
    "suspect",
    "culprit",
    "homicide",
    "homicidal",
    "vanish",
    "vanished",
    "blackmail",
    "conspiracy",
    "informant",
    "interrogation",
    "noir",
    "ledger",
    "enigma",
    "secret",
    "shadow",
    "trace",
  ],
  Romance: [
    "soulmate",
    "confession",
    "proposal",
    "rendezvous",
    "wedding",
    "betrothal",
    "passion",
    "longing",
    "yearning",
    "devotion",
    "tender",
    "embrace",
    "reunion",
    "heartbreak",
    "heart",
    "kiss",
    "love",
    "lover",
    "beloved",
    "desire",
    "vow",
    "sweetheart",
    "affection",
    "intimate",
    "chemistry",
    "spark",
  ],
  Horror: [
    "blood moon",
    "full moon",
    "undead",
    "phantasm",
    "blood",
    "crypt",
    "tomb",
    "grave",
    "corpse",
    "ghost",
    "haunt",
    "haunted",
    "dread",
    "madness",
    "infernal",
    "abyss",
    "lurking",
    "lurk",
    "shriek",
    "scream",
    "howl",
    "groan",
    "shadow",
    "moonless",
    "ethereal",
    "wraith",
    "curse",
    "cursed",
    "darkness",
    "dark",
    "fever",
    "delirium",
    "paranoia",
    "decay",
    "rot",
    "chill",
  ],
  Comedy: [
    "punchline",
    "slapstick",
    "hijinks",
    "shenanigans",
    "misunderstanding",
    "ridiculous",
    "absurd",
    "farce",
    "banter",
    "witty",
    "irony",
    "ironic",
    "blunder",
    "mishap",
    "disaster",
    "chaos",
    "mayhem",
    "prank",
    "gaffe",
    "snafu",
    "escapade",
    "roast",
    "cringe",
    "fiasco",
    "debacle",
    "antics",
    "capers",
  ],
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

let cachedPattern: { genre: Genre; re: RegExp } | null = null;

function patternForGenre(genre: Genre): RegExp | null {
  const raw = GENRE_HIGHLIGHT_TERMS[genre];
  if (!raw?.length) return null;

  if (cachedPattern?.genre === genre) return cachedPattern.re;

  const unique = [...new Set(raw.map((t) => t.trim()).filter(Boolean))];
  unique.sort((a, b) => b.length - a.length);
  const body = unique.map(escapeRegExp).join("|");
  const re = new RegExp(`(${body})`, "gi");
  cachedPattern = { genre, re };
  return re;
}

export type GenreTextPart = { hit: boolean; text: string };

/**
 * Split plain text into alternating segments; `hit` marks genre-flavored tokens (whole words / phrases).
 */
export function splitByGenreHighlights(text: string, genre: Genre): GenreTextPart[] {
  const re = patternForGenre(genre);
  if (!re) return [{ hit: false, text }];

  const parts: GenreTextPart[] = [];
  let last = 0;
  const globalRe = new RegExp(re.source, "gi");
  let m: RegExpExecArray | null;

  while ((m = globalRe.exec(text)) !== null) {
    if (m.index > last) {
      parts.push({ hit: false, text: text.slice(last, m.index) });
    }
    parts.push({ hit: true, text: m[0] });
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    parts.push({ hit: false, text: text.slice(last) });
  }

  return parts.length ? parts : [{ hit: false, text }];
}
