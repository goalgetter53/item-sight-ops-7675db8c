import type { InvNode } from "@/lib/inventoryNodes";

export type HardwareLeaf = { path: InvNode[]; fullName: string };

// ─── Hindi number words ───────────────────────────────────────────────────────
const HINDI_NUMS: Record<string, string> = {
  ek: "1", do: "2", teen: "3", char: "4", paanch: "5", panch: "5",
  chhe: "6", chhah: "6", saath: "7", sat: "7", aath: "8", ath: "8",
  nau: "9", nav: "9", das: "10",
  gyara: "11", bara: "12", tera: "13", choda: "14", chaudah: "14",
  pandra: "15", sola: "16", satra: "17", athra: "18", unees: "19",
  bees: "20", tees: "30", chalis: "40", pachas: "50",
  saath_number: "70", assi: "80", nabbe: "90",
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

  // Trolley wheel
  [/\btroley\b/g, "trolley"],
  [/\btroli\b/g, "trolley"],
  [/\btrole\b/g, "trolley"],
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

function preprocess(raw: string): string {
  let s = raw.toLowerCase().trim();
  s = replaceHindiNums(s);
  s = applySynonyms(s);
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
  // Try both raw and phonetically normalized versions; take the best
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
    const score = allClose ? 0.85 + jaroWinkler(q, c) * 0.1 : jaroWinkler(q, c);
    if (score > best) best = score;
  }
  return best;
}

export function findTopMatches(
  query: string,
  leaves: HardwareLeaf[],
  n = 5
): Array<HardwareLeaf & { score: number }> {
  return leaves
    .map((leaf) => ({ ...leaf, score: scoreOne(query, leaf.fullName) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .filter((r) => r.score > 0.25);
}
