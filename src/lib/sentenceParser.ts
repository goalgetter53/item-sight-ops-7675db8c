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
  ek: 1, do: 2, teen: 3, tin: 3,
  char: 4, chaar: 4,
  paanch: 5, panch: 5, pach: 5,
  chhe: 6, chhah: 6, chhe: 6,
  saath: 7, sat: 7,
  aath: 8, ath: 8,
  nau: 9, nav: 9,
  das: 10,
  gyara: 11, gyarah: 11,
  bara: 12, barah: 12,
  tera: 13, terah: 13,
  choda: 14, chaudah: 14,
  pandra: 15, pandrah: 15,
  sola: 16, solah: 16,
  satra: 17, satrah: 17,
  athra: 18, athara: 18,
  unees: 19, unnees: 19,
  bees: 20,
  tees: 30,
  chalis: 40,
  pachas: 50,
  saathi: 60, satth: 60,
  sattar: 70,
  assi: 80,
  nabbe: 90,
  sau: 100,
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
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
export function replaceHindiNums(text: string): string {
  return text
    .split(/\s+/)
    .map((w) => {
      const n = HINDI_NUM[w.toLowerCase()];
      return n !== undefined ? String(n) : w;
    })
    .join(" ")
    .trim();
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
