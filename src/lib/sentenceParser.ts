/**
 * Sentence parser for Approach A (full-sentence multi-item voice input).
 * Handles Hinglish input like:
 *   "teen BWR ply, do mica SS-01, char keel chaar inch"
 *   "teen BWR ply aur do mica aur char keel"
 */

// ── Filler removal ────────────────────────────────────────────────────────────
// Order matters: longer phrases before single words
const FILLERS = [
  /\btheek hai\b/gi,
  /\bek second\b/gi,
  /\bek dum\b/gi,
  /\bmatlab hai\b/gi,
  /\bum+h?\b/gi,
  /\buh+\b/gi,
  /\bhmm+\b/gi,
  /\bah+\b/gi,
  /\ber+\b/gi,
  /\bmatlab\b/gi,
  /\byani\b/gi,
  /\btheek\b/gi,
  /\bsuno\b/gi,
  /\bdekho\b/gi,
  /\bbolo\b/gi,
  /\bhaan\b/gi,
  /\bokay\b/gi,
  /\bok\b/gi,
  /\bruko\b/gi,
  /\bwait\b/gi,
  /\bhello\b/gi,
  /\bhelo\b/gi,
  /\byeh\b/gi,
  /\bwoh\b/gi,
  /\btoh\b/gi,
  /\bna\b/gi,
  /\bbas\b/gi,
];

export function stripFillers(text: string): string {
  let s = text;
  for (const re of FILLERS) s = s.replace(re, " ");
  return s.replace(/\s{2,}/g, " ").trim();
}

// ── Hindi/English number words ────────────────────────────────────────────────
const HINDI_NUM: Record<string, number> = {
  // 1
  ek: 1, ik: 1, ikk: 1, one: 1,
  // 2
  do: 2, doh: 2, two: 2,
  // 3
  teen: 3, tin: 3, tiin: 3, three: 3,
  // 4
  char: 4, chaar: 4, chhar: 4, four: 4,
  // 5
  paanch: 5, panch: 5, pach: 5, paach: 5, five: 5,
  // 6
  chhe: 6, chhah: 6, chheh: 6, cheh: 6, six: 6,
  // 7
  saat: 7, saath: 7, sat: 7, satt: 7, seven: 7,
  // 8
  aath: 8, aat: 8, ath: 8, att: 8, eight: 8,
  // 9
  nau: 9, noh: 9, nav: 9, nava: 9, nine: 9,
  // 10
  das: 10, duss: 10, ten: 10,
  // 11
  gyara: 11, gyarah: 11, egara: 11, agara: 11, eleven: 11,
  // 12
  bara: 12, baara: 12, barah: 12, baarah: 12, twelve: 12,
  // 13
  tera: 13, terah: 13, thirteen: 13,
  // 14
  choda: 14, chaudah: 14, chowdah: 14, fourteen: 14,
  // 15
  pandra: 15, pandrah: 15, pandara: 15, fifteen: 15,
  // 16
  sola: 16, solah: 16, sixteen: 16,
  // 17
  satra: 17, satrah: 17, satraah: 17, seventeen: 17,
  // 18
  atharah: 18, athaarah: 18, athra: 18, aathara: 18, eighteen: 18,
  // 19
  unees: 19, unnees: 19, unnis: 19, nineteen: 19,
  // 20
  bees: 20, biss: 20, twenty: 20,
  // 25
  pachees: 25, pachis: 25,
  // 30
  tees: 30, tiis: 30, thirty: 30,
  // 40
  chalis: 40, chaalis: 40, forty: 40,
  // 50
  pachas: 50, pachass: 50, fifty: 50,
  // 60
  satth: 60, sath: 60, sixty: 60,
  // 70
  sattar: 70, seventy: 70,
  // 80
  assi: 80, asee: 80, eighty: 80,
  // 90
  nabbe: 90, nabee: 90, nabe: 90, ninety: 90,
  // 100
  sau: 100, so: 100,
};

function extractQty(tokens: string[]): { qty: number; rest: string[] } {
  if (tokens.length === 0) return { qty: 1, rest: [] };
  const first = tokens[0].toLowerCase();
  // Plain digit
  if (/^\d+$/.test(first)) return { qty: parseInt(first, 10), rest: tokens.slice(1) };
  // Hindi/English number word
  if (HINDI_NUM[first] !== undefined) return { qty: HINDI_NUM[first], rest: tokens.slice(1) };
  return { qty: 1, rest: tokens };
}

// ── Hindi number normalisation ────────────────────────────────────────────────
// Replace Hindi/English number words in a string with their digit equivalents.
// "aath chaar" → "8 4", "velocity 18mm aath chaar" → "velocity 18mm 8 4"
// ── Fraction / decimal vocabulary ────────────────────────────────────────────
// single-word Hindi fraction terms → decimal string
function expandFractionSingles(s: string): string {
  return s
    .replace(/\bdedh\b/gi, "1.5")
    .replace(/\bdaid\b/gi, "1.5")
    .replace(/\bdaad\b/gi, "1.5")
    .replace(/\bdhai\b/gi, "2.5")
    .replace(/\bdhaai\b/gi, "2.5")
    .replace(/\bdhaa\b/gi, "2.5")
    .replace(/\baadha\b/gi, "0.5")
    .replace(/\baadhi\b/gi, "0.5")
    .replace(/\baadh\b/gi, "0.5")
    .replace(/\bhalf\b/gi, "0.5")
    .replace(/\bpaav\b/gi, "0.25")
    .replace(/\bpaava\b/gi, "0.25")
    .replace(/\bquarter\b/gi, "0.25")
    .replace(/\bteen\s+paav\b/gi, "0.75");
}

// multi-word combos — run after number-word substitution
function expandFractionCombos(s: string): string {
  s = s.replace(/\b(?:sawa|savaa)\s+(\d+(?:\.\d+)?)/g,
    (_, n) => String(Math.round((parseFloat(n) + 0.25) * 100) / 100));
  s = s.replace(/\b(?:saadhe|saadha|sadhe)\s+(\d+(?:\.\d+)?)/g,
    (_, n) => String(Math.round((parseFloat(n) + 0.5) * 100) / 100));
  s = s.replace(/\b(?:paune|pauney)\s+(\d+(?:\.\d+)?)/g,
    (_, n) => String(Math.round((parseFloat(n) - 0.25) * 100) / 100));
  s = s.replace(/\b(?:paune|pauney)\b/g, "0.75");
  return s;
}

export function replaceHindiNums(text: string): string {
  let s = expandFractionSingles(text);
  s = s
    .split(/\s+/)
    .map((w) => {
      const n = HINDI_NUM[w.toLowerCase()];
      return n !== undefined ? String(n) : w;
    })
    .join(" ")
    .trim();
  return expandFractionCombos(s);
}

// ── Segment splitting ─────────────────────────────────────────────────────────
// Split by: comma | " aur " | " or " | " and "
// Then within each segment, further split when a number word starts a NEW item
// (i.e. number appears mid-segment AND the previous token was NOT also a number —
//  consecutive numbers like "aath chaar" are dimensions, not a new item boundary).
function isNumToken(w: string): boolean {
  return HINDI_NUM[w.toLowerCase()] !== undefined || /^\d+(\.\d+)?$/.test(w);
}

function splitSegments(text: string): string[] {
  const primary = text.split(/,|(?:\s+aur\s+)|(?:\s+or\s+)|(?:\s+and\s+)/i);

  const result: string[] = [];
  for (const seg of primary) {
    const tokens = seg.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;
    let start = 0;
    for (let i = 1; i < tokens.length; i++) {
      // Only split if this token is a number AND the previous token was NOT a number
      // (prevents splitting dimension pairs like "aath chaar" = 8×4)
      if (isNumToken(tokens[i]) && !isNumToken(tokens[i - 1])) {
        result.push(tokens.slice(start, i).join(" "));
        start = i;
      }
    }
    result.push(tokens.slice(start).join(" "));
  }
  return result.filter((s) => s.trim().length > 0);
}

export type ParsedItem = {
  raw: string;       // original segment text
  qty: number;
  itemText: string;  // text to match against inventory
};

export function parseSentence(raw: string): ParsedItem[] {
  const cleaned = stripFillers(raw);
  const segments = splitSegments(cleaned);
  return segments.map((seg) => {
    const tokens = seg.trim().split(/\s+/).filter(Boolean);
    const { qty, rest } = extractQty(tokens);
    return { raw: seg, qty, itemText: replaceHindiNums(rest.join(" ")) };
  });
}
