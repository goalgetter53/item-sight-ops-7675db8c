import type { InvNode } from "@/lib/inventoryNodes";

export type HardwareLeaf = { path: InvNode[]; fullName: string };

// ─── Hindi number words ───────────────────────────────────────────────────────
// Comprehensive Indian pronunciation variants (Hindi, Punjabi, Hinglish)
const HINDI_NUMS: Record<string, string> = {
  // 1
  ek: "1", ik: "1", ikk: "1", one: "1",
  // 2
  do: "2", doh: "2", two: "2",
  // 3
  teen: "3", tin: "3", tiin: "3", three: "3",
  // 4
  char: "4", chaar: "4", chhar: "4", four: "4",
  // 5
  paanch: "5", panch: "5", pach: "5", paach: "5", five: "5",
  // 6
  chhe: "6", chhah: "6", chheh: "6", cheh: "6", six: "6",
  // 7
  saat: "7", saath: "7", sat: "7", satt: "7", seven: "7",
  // 8
  aath: "8", aat: "8", ath: "8", att: "8", eight: "8",
  // 9
  nau: "9", noh: "9", nav: "9", nava: "9", nine: "9",
  // 10
  das: "10", duss: "10", ten: "10",
  // 11
  gyara: "11", gyarah: "11", egara: "11", agara: "11", eleven: "11",
  // 12
  bara: "12", baara: "12", barah: "12", baarah: "12", twelve: "12",
  // 13
  tera: "13", terah: "13", thirteen: "13",
  // 14
  choda: "14", chaudah: "14", chowdah: "14", fourteen: "14",
  // 15
  pandra: "15", pandrah: "15", pandara: "15", fifteen: "15",
  // 16
  sola: "16", solah: "16", sixteen: "16",
  // 17
  satra: "17", satrah: "17", satraah: "17", seventeen: "17",
  // 18
  atharah: "18", athaarah: "18", athra: "18", aathra: "18", atra: "18", attra: "18", aatra: "18", aathara: "18", athara: "18", atharaha: "18", aatharaha: "18", eighteen: "18",
  // 19
  unees: "19", unnees: "19", unnis: "19", nineteen: "19",
  // 20
  bees: "20", biss: "20", twenty: "20",
  // 24
  chaubees: "24", chauvis: "24",
  // 25
  pachees: "25", pachis: "25",
  // 30
  tees: "30", tiis: "30", thirty: "30",
  // 32
  battees: "32", batees: "32",
  // 36
  chattees: "36", chatees: "36",
  // 40
  chalis: "40", chaalis: "40", forty: "40",
  // 48
  attaalis: "48",
  // 50
  pachas: "50", pachass: "50", fifty: "50",
  // 60
  saath60: "60", satth: "60", sath: "60", sixty: "60",
  // 70
  sattar: "70", seventy: "70",
  // 72
  bahattar: "72", bahatar: "72",
  // 75
  pachhattar: "75", pachattar: "75",
  // 80
  assi: "80", asee: "80", eighty: "80",
  // 90
  nabbe: "90", nabee: "90", nabe: "90", ninety: "90",
  // 100
  sau: "100", so: "100",
};

// ─── Hinglish synonym/alias map ───────────────────────────────────────────────
// Maps how the word sounds in speech → canonical inventory term.
// Covers common Hinglish hardware words, misspellings, and regional pronunciations.
const SYNONYMS: Array<[RegExp, string]> = [
  // Nails / Keel
  [/\bkeel\b/g, "nail"],
  [/\bkil\b/g, "nail"],
  [/\bkiil\b/g, "nail"],
  [/\bneel\b/g, "nail"],

  // Screw / Pech
  [/\bpech\b/g, "screw"],
  [/\bpetch\b/g, "screw"],
  [/\bpetch\b/g, "screw"],
  [/\biscrew\b/g, "screw"],
  [/\bskru\b/g, "screw"],

  // Hinge
  [/\bhinj\b/g, "hinge"],
  [/\bhinja\b/g, "hinge"],
  [/\bhinge\b/g, "hinge"],
  [/\bkabja\b/g, "hinge"],
  [/\bkabza\b/g, "hinge"],

  // Handle
  [/\bhendal\b/g, "handle"],
  [/\bhandal\b/g, "handle"],
  [/\bhandel\b/g, "handle"],
  [/\bhandil\b/g, "handle"],

  // Latch / Kundi / Khunda
  [/\bkundi\b/g, "latch"],
  [/\bkhunda\b/g, "latch"],
  [/\bkunda\b/g, "latch"],
  [/\blech\b/g, "latch"],

  // Bolt
  [/\bbolta\b/g, "bolt"],
  [/\bbolat\b/g, "bolt"],

  // Drawer slide / channel
  [/\bdravar\b/g, "drawer"],
  [/\bdraver\b/g, "drawer"],
  [/\bslaid\b/g, "slide"],
  [/\bchainal\b/g, "channel"],
  [/\bchenal\b/g, "channel"],
  [/\bchanel\b/g, "channel"],

  // Trolley — normalize all variants to "trolly" (inventory spelling)
  [/\btrolley\b/g, "trolly"],
  [/\btroley\b/g, "trolly"],
  [/\btroli\b/g, "trolly"],
  [/\btrole\b/g, "trolly"],
  [/\bwheel\b/g, "wheel"],
  [/\bvheel\b/g, "wheel"],

  // Lock / Tala
  [/\btala\b/g, "lock"],
  [/\btalaa\b/g, "lock"],
  [/\blok\b/g, "lock"],

  // Hook / Ghundi
  [/\bghundi\b/g, "hook"],
  [/\bghunti\b/g, "hook"],
  [/\bhuk\b/g, "hook"],

  // Magnet / catch
  [/\bmagnit\b/g, "magnet"],
  [/\bmeganet\b/g, "magnet"],
  [/\bkap\b/g, "cap"],         // cup/cap catch

  // Sandpaper
  [/\bsandpepar\b/g, "sandpaper"],
  [/\bsand paper\b/g, "sandpaper"],
  [/\breti\b/g, "sandpaper"],

  // Fevicol / adhesive
  [/\bfewikol\b/g, "fevicol"],
  [/\bfevikol\b/g, "fevicol"],
  [/\bfabikol\b/g, "fevicol"],

  // Washer
  [/\bvosar\b/g, "washer"],
  [/\bwashar\b/g, "washer"],
  [/\bvasha\b/g, "washer"],

  // Nut / Nat
  [/\bnat\b/g, "nut"],
  [/\bnaath\b/g, "nut"],

  // Plastic / rubber
  [/\bplastic\b/g, "plastic"],
  [/\bplastik\b/g, "plastic"],
  [/\brubbar\b/g, "rubber"],

  // Corby (a popular brand/type of screw in India)
  [/\bcorbi\b/g, "corby"],
  [/\bcorbe\b/g, "corby"],
  [/\bkorbi\b/g, "corby"],

  // Hammer / Hathoda
  [/\bhathoda\b/g, "hammer"],
  [/\bhatoda\b/g, "hammer"],
  [/\bhathaura\b/g, "hammer"],

  // Chisel / Chori
  [/\bchoree\b/g, "chisel"],
  [/\bchori\b/g, "chisel"],
  [/\bchori\b/g, "chisel"],

  // Wire
  [/\bvire\b/g, "wire"],
  [/\bvayar\b/g, "wire"],

  // Chain / Zanjeer
  [/\bzanjeer\b/g, "chain"],
  [/\bzanjeear\b/g, "chain"],

  // Tape
  [/\btep\b/g, "tape"],

  // Spring
  [/\bsparing\b/g, "spring"],
  [/\bspring\b/g, "spring"],

  // Inch variants — "inchi" / "inchee" = inch (Indian vernacular)
  [/\binchi\b/g, "inch"],
  [/\binchee\b/g, "inch"],
  [/\binci\b/g, "inch"],

  // Birangee (type of nail/fastener) — STT often drops the ending vowel
  [/\bbirangi\b/g, "birangee"],
  [/\bbirangy\b/g, "birangee"],
  [/\bbirangie\b/g, "birangee"],
  [/\bverangi\b/g, "birangee"],
  [/\bvirangi\b/g, "birangee"],

  // Jali (mesh/grill) — workers say "jaali" with long vowel
  [/\bjaali\b/g, "jali"],
  [/\bjhaali\b/g, "jali"],
  [/\bjhali\b/g, "jali"],

  // Corby — additional STT variants
  [/\bkorby\b/g, "corby"],
  [/\bcorbi\b/g, "corby"],

  // Perporated — inventory misspelling; normalize both sides so "perforated" matches
  [/\bperporated\b/g, "perforated"],
  [/\bparphorated\b/g, "perforated"],
  [/\bperforated\b/g, "perforated"],

  // Fevicol — extra STT variants
  [/\bfewicol\b/g, "fevicol"],
  [/\bfevicoal\b/g, "fevicol"],

  // BWP / MDF — spoken as letters, STT sometimes adds spaces
  [/\bb\s*w\s*p\b/g, "bwp"],
  [/\bm\s*d\s*f\b/g, "mdf"],

  // Auto close / auto hings variants
  [/\bauto\s*hing\b/g, "auto hings"],
  [/\bauto\s*hinges\b/g, "auto hings"],
];

// ─── Phonetic normalization ───────────────────────────────────────────────────
function applyPhonetics(s: string): string {
  return s
    .replace(/ph/g, "f")          // phool → fol
    .replace(/kh/g, "k")          // khand → kand
    .replace(/gh/g, "g")          // ghundi → gundi
    .replace(/dh/g, "d")          // dhar → dar
    .replace(/th/g, "t")          // thali → tali
    .replace(/sh/g, "s")          // shutter → sutter (but preserves "s" sound)
    .replace(/ch/g, "c")          // channel → canel
    .replace(/wh/g, "v")          // wheel → veel
    .replace(/w/g, "v")           // wire → vire
    .replace(/z/g, "j")           // zanjeer → janjeer
    .replace(/q/g, "k")           // qubool → kubul
    .replace(/x/g, "ks")          // box → boks
    .replace(/ee|ii/g, "i")       // keel → kil
    .replace(/oo|uu/g, "u")       // screw → skru
    .replace(/ae|ai/g, "e")       // main → men
    .replace(/au|aw|aa/g, "a")    // paanch → panc
    .replace(/ck/g, "k")          // lock → lok
    .replace(/[aeiou]+/g, (m) => m[0]) // collapse vowel runs
    .replace(/(.)\1+/g, "$1")     // deduplicate: trolley → trole
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function replaceHindiNums(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => HINDI_NUMS[w.toLowerCase()] ?? w)
    .join(" ");
}

function applySynonyms(s: string): string {
  let r = s.toLowerCase();
  for (const [pat, rep] of SYNONYMS) r = r.replace(pat, rep);
  return r;
}

// ─── Fraction / decimal vocabulary ───────────────────────────────────────────
// Step 1: replace single-word fraction terms before number-word substitution
function expandFractionSingles(s: string): string {
  return s
    // Standalone special fractions
    .replace(/\bdedh\b/g, "1.5")
    .replace(/\bdaid\b/g, "1.5")
    .replace(/\bdaad\b/g, "1.5")
    .replace(/\bdhai\b/g, "2.5")
    .replace(/\bdhaai\b/g, "2.5")
    .replace(/\bdhaa\b/g, "2.5")
    // half
    .replace(/\baadha\b/g, "0.5")
    .replace(/\baadhi\b/g, "0.5")
    .replace(/\baadh\b/g, "0.5")
    .replace(/\bhalf\b/g, "0.5")
    // quarter
    .replace(/\bpaav\b/g, "0.25")
    .replace(/\bpaava\b/g, "0.25")
    .replace(/\bpaao\b/g, "0.25")
    .replace(/\bquarter\b/g, "0.25")
    // three-quarter (teen paav before number replacement)
    .replace(/\bteen\s+paav\b/g, "0.75")
    .replace(/\bteen\s+paava\b/g, "0.75");
}

// Step 2: multi-word fraction combos — run AFTER replaceHindiNums so numbers are digits
// sawa N  = N + 0.25  (sawa do = 2.25)
// saadhe N = N + 0.5  (saadhe teen = 3.5)
// paune/pauney N = N − 0.25  (paune do = 1.75)
function expandFractionCombos(s: string): string {
  // sawa / savaa
  s = s.replace(/\b(?:sawa|savaa)\s+(\d+(?:\.\d+)?)/g,
    (_, n) => String(Math.round((parseFloat(n) + 0.25) * 100) / 100));
  // saadhe / saadha
  s = s.replace(/\b(?:saadhe|saadha|sadhe)\s+(\d+(?:\.\d+)?)/g,
    (_, n) => String(Math.round((parseFloat(n) + 0.5) * 100) / 100));
  // paune / pauney before a digit
  s = s.replace(/\b(?:paune|pauney)\s+(\d+(?:\.\d+)?)/g,
    (_, n) => String(Math.round((parseFloat(n) - 0.25) * 100) / 100));
  // standalone paune/pauney = 0.75
  s = s.replace(/\b(?:paune|pauney)\b/g, "0.75");
  return s;
}

// Expand 2-digit dimension codes that STT produces when Hindi numbers are merged:
// "84" → "8 4" (aath chaar = 8×4 feet ply sheet)
// Covers common ply sheet sizes: 6×3, 6×4, 7×3, 7×4, 8×3, 8×4
function expandDimCodes(s: string): string {
  return s.replace(/\b([6-9])([3-4])\b/g, "$1 $2");
}

// Hindi number words used as prefixes (for splitting merged tokens)
const HINDI_NUM_PREFIXES = "atharah|athaarah|athra|aathra|atra|attra|aatra|athara|aathara|bara[h]?|baara[h]?|tera[h]?|choda|pandrah?|pandra|sola[h]?|satra[h]?|unees|unnees|bees|gyara[h]?|das|nau|aath?|aat|saat?h?|chhe|paanch?|panch|chhar|chaar|char|teen|tin|doh?|ek|ikk?";
const HINDI_NUM_PREFIX_RE = new RegExp(`\\b(${HINDI_NUM_PREFIXES})(mm|cm|kg|inch|inchi|inchee)`, "g");

// Telugu/Indian-language postpositions that STT appends to item words
// Only strip when the base word is long enough (5+ chars) to avoid eating real words
// e.g. "kundi" must NOT lose "di" — "kundi" is itself the word
// Safe pattern: strip suffix only when base ≥ 5 chars
const TELUGU_SUFFIX_RE = /\b(\w{5,})(thi|ki|ku|laa|lee)\b/g;

export function preprocess(raw: string): string {
  let s = raw.toLowerCase().trim();
  // 0pre. Split digit+unit: "18mm" → "18 mm", "12kg" → "12 kg"
  s = s.replace(/(\d+)(mm|cm|kg|inch|inchi|inchee)/g, "$1 $2");
  // 0. Strip Telugu/Kannada postposition suffixes: "trollythi" → "trolly", "fevicolki" → "fevicol"
  s = s.replace(TELUGU_SUFFIX_RE, "$1");
  // 0b. Split Hindi-num merged with unit: "barahmm" → "bara mm", "athrainch" → "athra inch"
  s = s.replace(HINDI_NUM_PREFIX_RE, "$1 $2");
  // 0c. Strip common filler words
  s = s.replace(/\b(chahiye|lao|lana|dena|wala|wali|ka|ki|ke|hai|tha|mujhe|please|aur|bhaiya|bhai|yaar|boss|sir)\b/g, "");
  // 1. Normalize dimension separators: "8*4" → "8 4", "8×4" → "8 4", digit-x-digit
  s = s.replace(/(\d+)\s*[*×]\s*(\d+)/g, "$1 $2");
  s = s.replace(/\b(\d+)\s*x\s*(\d+)\b/g, "$1 $2");
  // 2a. Split merged Hindi-num+inch compounds: "doinchi"→"do inch", "teeninchi"→"teen inch"
  //     Workers say "do inchi" but STT sometimes merges the words.
  s = s.replace(
    /\b(ek|ikk?|do|doh|teen|tin|char|chaar|chhar|paanch?|panch|chhe|saat?h?|aath?|aat|nau|das|gyara[h]?|bara[h]?|tera[h]?|choda|pandra[h]?|dedh|dhai|aadha?|sawa|saadhe?|paune?)inch[ie]*/g,
    "$1 inch"
  );
  // 2aa. Split merged ply-dimension compounds (workers say sheet size as one word)
  //   "saccha"/"sacha"/"satcha" = saat+char = 7 4
  //   "aathcha"/"atcha" = aath+char = 8 4
  //   "saatteen"/"satteen" = saat+teen = 7 3
  //   "aathteen"/"atteen" = aath+teen = 8 3
  //   "chechar"/"chechar" = chhe+char = 6 4
  //   "cheteen" = chhe+teen = 6 3
  s = s.replace(/\bsaatch[ao]a?r?\b/g, "7 4");
  s = s.replace(/\bsatch[ao]a?r?\b/g, "7 4");
  s = s.replace(/\bsacch[ao]\b/g, "7 4");
  s = s.replace(/\bsacha\b/g, "7 4");
  s = s.replace(/\baathch[ao]a?r?\b/g, "8 4");
  s = s.replace(/\baatch[ao]a?r?\b/g, "8 4");
  s = s.replace(/\baat\s*c[ao]a?r?\b/g, "8 4");   // aatcaar / aatcor
  s = s.replace(/\bsaat\s*c[ao]a?r?\b/g, "7 4");  // saatcaar / saatcor
  s = s.replace(/\bsaat\s*te+n\b/g, "7 3");
  s = s.replace(/\bsat\s*te+n\b/g, "7 3");
  s = s.replace(/\baath\s*te+n\b/g, "8 3");
  s = s.replace(/\baat\s*te+n\b/g, "8 3");
  // 2b. Single-word fractions (dedh, dhai, aadha, paav…) before number-word map
  s = expandFractionSingles(s);
  // 3. Hindi number words → digits
  s = replaceHindiNums(s);
  // 4. Multi-word fraction combos (sawa 2 → 2.25, saadhe 3 → 3.5, paune 4 → 3.75)
  s = expandFractionCombos(s);
  // 5. Synonyms + dimension code splits
  s = applySynonyms(s);
  s = expandDimCodes(s);
  return s;
}

// ─── Jaro-Winkler ────────────────────────────────────────────────────────────
function jaro(a: string, b: string): number {
  if (a === b) return 1;
  const dist = Math.floor(Math.max(a.length, b.length) / 2) - 1;
  if (dist < 0) return 0;
  const aM = new Uint8Array(a.length);
  const bM = new Uint8Array(b.length);
  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    const lo = Math.max(0, i - dist), hi = Math.min(i + dist + 1, b.length);
    for (let j = lo; j < hi; j++) {
      if (!bM[j] && a[i] === b[j]) { aM[i] = bM[j] = 1; matches++; break; }
    }
  }
  if (!matches) return 0;
  let t = 0, k = 0;
  for (let i = 0; i < a.length; i++) {
    if (aM[i]) { while (!bM[k]) k++; if (a[i] !== b[k]) t++; k++; }
  }
  return (matches / a.length + matches / b.length + (matches - t / 2) / matches) / 3;
}

function jaroWinkler(a: string, b: string): number {
  const j = jaro(a, b);
  let p = 0;
  for (let i = 0; i < Math.min(4, a.length, b.length); i++) {
    if (a[i] === b[i]) p++; else break;
  }
  return j + p * 0.1 * (1 - j);
}

// ─── Main scoring ─────────────────────────────────────────────────────────────
function scoreOne(queryRaw: string, candidateRaw: string): number {
  const variants = [
    [preprocess(queryRaw), preprocess(candidateRaw)],
    [applyPhonetics(preprocess(queryRaw)), applyPhonetics(preprocess(candidateRaw))],
  ] as const;

  let best = 0;
  for (const [q, c] of variants) {
    if (q === c) return 1.0;
    const qW = q.split(" ").filter(Boolean);
    const cW = c.split(" ").filter(Boolean);
    const allClose = qW.length > 0 && qW.every((w) =>
      cW.some((cw) => cw === w || jaroWinkler(w, cw) > 0.80)
    );
    let score = allClose ? 0.85 + jaroWinkler(q, c) * 0.1 : jaroWinkler(q, c);
    // Digit-token tiebreak: single-digit tokens (dimensions like "7","8","3","4")
    // must match exactly. Mismatch penalty > boost so wrong digit loses.
    const qDigits = qW.filter(w => /^\d{1,2}$/.test(w));
    for (const d of qDigits) {
      const cHasExact = cW.includes(d);
      const cHasDiff  = cW.some(cw => /^\d{1,2}$/.test(cw) && cw !== d);
      if (cHasExact) score += 0.01;
      if (cHasDiff)  score -= 0.02;  // stronger penalty than boost
    }
    if (score > best) best = score;
  }
  return Math.min(1, best);
}

export type VoiceMapEntry = { item_name: string; category: string; heard_text: string };

export function findTopMatches(
  query: string,
  leaves: HardwareLeaf[],
  n = 5,
  voiceMap?: VoiceMapEntry[]
): Array<HardwareLeaf & { score: number }> {
  // 1. Check learned voice map first (compare preprocessed forms)
  if (voiceMap?.length) {
    const q = preprocess(query);
    const hit = voiceMap.find((e) => e.heard_text === q || q.includes(e.heard_text) || e.heard_text.includes(q));
    if (hit) {
      const leaf = leaves.find((l) => l.fullName === hit.item_name);
      if (leaf) return [{ ...leaf, score: 1.0 }];
    }
  }

  // 2. Fuzzy match (scoreOne preprocesses internally)
  return leaves
    .map((leaf) => ({ ...leaf, score: scoreOne(query, leaf.fullName) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .filter((r) => r.score > 0.25);
}
