import { preprocess } from "./src/lib/hinglish-match";
function applyPhonetics(s: string): string {
  return s
    .replace(/ph/g, "f").replace(/kh/g, "k").replace(/gh/g, "g")
    .replace(/dh/g, "d").replace(/th/g, "t").replace(/sh/g, "s")
    .replace(/ch/g, "c").replace(/wh/g, "v").replace(/w/g, "v")
    .replace(/z/g, "j").replace(/q/g, "k").replace(/x/g, "ks")
    .replace(/ee|ii/g, "i").replace(/oo|uu/g, "u").replace(/ae|ai/g, "e")
    .replace(/au|aw|aa/g, "a").replace(/ck/g, "k")
    .replace(/[aeiou]+/g, (m: string) => m[0])
    .replace(/(.)\1+/g, "$1")
    .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}
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

const q = "hathodaa";
const c = "Door Hinges Auto";
const qpp = preprocess(q);
const cpp = preprocess(c);
const qph = applyPhonetics(qpp);
const cph = applyPhonetics(cpp);
console.log(`q  pp: "${qpp}"`);
console.log(`c  pp: "${cpp}"`);
console.log(`q  ph: "${qph}"`);
console.log(`c  ph: "${cph}"`);
console.log(`JW(pp,pp): ${jaroWinkler(qpp,cpp).toFixed(4)}`);
console.log(`JW(ph,ph): ${jaroWinkler(qph,cph).toFixed(4)}`);

const c2 = "Claw Hammer";
const cpp2 = preprocess(c2);
const cph2 = applyPhonetics(cpp2);
console.log(`\nc2 pp: "${cpp2}", ph: "${cph2}"`);
console.log(`JW(pp,pp): ${jaroWinkler(qpp,cpp2).toFixed(4)}`);
console.log(`JW(ph,ph): ${jaroWinkler(qph,cph2).toFixed(4)}`);
