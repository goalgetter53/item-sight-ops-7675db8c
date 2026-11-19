import type { InvNode } from "@/lib/inventoryNodes";

export type HardwareLeaf = { path: InvNode[]; fullName: string };

const HINDI_NUMS: Record<string, string> = {
  ek: "1", do: "2", teen: "3", char: "4", paanch: "5",
  chhe: "6", saath: "7", aath: "8", nau: "9", das: "10",
};

function replaceHindiNums(s: string): string {
  return s.split(/\s+/).map((w) => HINDI_NUMS[w.toLowerCase()] ?? w).join(" ");
}

// Phonetic normalization for Hinglish speech-to-text output
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ph/g, "f")       // phal -> fal
    .replace(/w/g, "v")        // wire -> vire (w/v swap in Hindi accents)
    .replace(/ee|ii/g, "i")    // keel -> kil
    .replace(/oo|uu/g, "u")    // screw -> skru
    .replace(/ck/g, "k")       // lock -> lok
    .replace(/[aeiou]+/g, (m) => m[0]) // collapse vowel runs: angle -> angl
    .replace(/(.)\1+/g, "$1")  // deduplicate: trolley -> troley -> troley
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Jaro-Winkler similarity (0–1)
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

function scoreOne(query: string, candidate: string): number {
  const q = normalize(replaceHindiNums(query));
  const c = normalize(candidate);
  if (q === c) return 1.0;

  const qW = q.split(" ").filter(Boolean);
  const cW = c.split(" ").filter(Boolean);

  // Check if all query words have a close match in candidate
  const allClose = qW.every((w) =>
    cW.some((cw) => cw === w || jaroWinkler(w, cw) > 0.82)
  );
  if (allClose && qW.length > 0) return 0.85 + jaroWinkler(q, c) * 0.1;

  // JW on the full normalized strings
  return jaroWinkler(q, c);
}

export function findTopMatches(
  query: string,
  leaves: HardwareLeaf[],
  n = 5
): Array<HardwareLeaf & { score: number }> {
  const q = replaceHindiNums(query.trim());
  return leaves
    .map((leaf) => ({ ...leaf, score: scoreOne(q, leaf.fullName) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .filter((r) => r.score > 0.25);
}
