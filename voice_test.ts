import { preprocess, findTopMatches } from "./src/lib/hinglish-match";

const leaves = [
  "18mm Applewood Ultra 7x4",
  "18mm Applewood Ultra 8x4",
  "12mm BWP Marine 8x4",
  "12mm BWP Marine 7x4",
  "19mm MDF Board 8x4",
  "Door Hinges Auto",
  "Door Hinges Stainless",
  "Trolly Channel 20",
  "Trolly Channel 24",
  "Birangee Handle 4 inch",
  "Corby Handle 3 inch",
  "Jali Sheet Perforated",
  "Fevicol SH 1kg",
  "MDF 6mm 8x4",
  "Ply 4mm 7x4",
  "18mm Commercial Ply 7x4",
].map(n => ({ path: [{ id: n, name: n }], fullName: n }));

const tests = [
  { desc: "athra", say: "athra mm applewood ultra saccha" },
  { desc: "aathra", say: "aathra mm applewood ultra saccha" },
  { desc: "atra", say: "atra mm applewood ultra saat char" },
  { desc: "athara", say: "athara mm applewood" },
  { desc: "18 direct", say: "18 mm applewood ultra 7 4" },
  { desc: "saccha", say: "18 mm applewood saccha" },
  { desc: "saatchar", say: "18 mm applewood saatchar" },
  { desc: "aatchaar", say: "aatchaar applewood 18mm" },
  { desc: "saatteen", say: "18mm applewood saatteen" },
  { desc: "aatteen", say: "18mm applewood aatteen" },
  { desc: "birangi", say: "birangi handle 4 inch" },
  { desc: "birangy", say: "birangy handle 4 inch" },
  { desc: "verangi", say: "verangi handle 4 inch" },
  { desc: "virangi", say: "virangi handle" },
  { desc: "korby", say: "korby handle 3 inch" },
  { desc: "trolley", say: "trolley channel 20" },
  { desc: "troli", say: "troli channel 24" },
  { desc: "jaali", say: "jaali sheet perforated" },
  { desc: "jhaali", say: "jhaali sheet perporated" },
  { desc: "chenal", say: "trolly chenal 20" },
  { desc: "perporated", say: "perporated jali sheet" },
  { desc: "parphorated", say: "parphorated jali" },
  { desc: "fewicol", say: "fewicol 1 kg" },
  { desc: "fevicoal", say: "fevicoal 1 kilo" },
  { desc: "bwp", say: "b w p marine 12mm 8 4" },
  { desc: "mdf", say: "m d f 19mm 8 4" },
  { desc: "auto hings", say: "auto hings door" },
  { desc: "auto hinges", say: "auto hinges door" },
];

let pass = 0, fail = 0;
console.log("=== VOICE PARSER TEST ===\n");
for (const t of tests) {
  const pre = preprocess(t.say);
  const top = findTopMatches(t.say, leaves, 1);
  const match = top[0];
  const score = match ? Math.round(match.score * 100) : 0;
  const ok = score >= 60;
  if (ok) pass++; else fail++;
  const icon = score >= 70 ? "✓" : score >= 50 ? "~" : "✗";
  console.log(`${icon} [${t.desc}] "${t.say}"`);
  console.log(`    parsed:  "${pre}"`);
  console.log(`    matched: "${match?.fullName ?? 'NO MATCH'}" ${score}%`);
}
console.log(`\n${pass} pass / ${fail} fail`);
