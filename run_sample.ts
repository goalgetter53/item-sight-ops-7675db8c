import { readFileSync } from "fs";
import { findTopMatches } from "./src/lib/hinglish-match";
type TC = { desc: string; say: string; expect: string };
const all: TC[] = JSON.parse(readFileSync("/tmp/hw_tests.json", "utf8"));
const tests = all.filter((_, i) => i % 11 === 0);
const rawNames = [
  "Door Hinges Auto","Door Hinges Stainless","Hinge SS 3 inch","Hinge SS 4 inch",
  "Hinge 3 inch","Hinge 4 inch","Cabinet Hinge","Flush Hinge","Piano Hinge",
  "Birangee Handle 3 inch","Birangee Handle 4 inch","Birangee Handle 6 inch",
  "Corby Handle 3 inch","Corby Handle 4 inch","Drawer Handle 3 inch","Drawer Handle 4 inch",
  "Cabinet Handle","Pull Handle",
  "Trolly Channel 20","Trolly Channel 24","Drawer Slide 18 inch","Drawer Slide 24 inch","Soft Close Channel",
  "Screw 1 inch","Screw 1.5 inch","Screw 2 inch","Screw 2.5 inch","Screw 3 inch","Screw 4 inch",
  "Nail 1 inch","Nail 2 inch","Nail 3 inch","Nail 4 inch",
  "Fevicol SH 1kg","Fevicol SH 5kg","Fevicol SH 20kg","Fevicol MR 1kg",
  "Jali Sheet Perforated","Wire Mesh",
  "Latch 3 inch","Latch 4 inch","Cabinet Lock SS","Aldropi Lock","Magnetic Catch","Magnet Catch",
  "Sandpaper 80 grit","Sandpaper 120 grit","Sandpaper 180 grit","Sandpaper 240 grit",
  "Washer M4","Washer M6","Washer M8","Washer M10",
  "Nut M4","Nut M6","Nut M8","Nut M10",
  "Bolt M4","Bolt M6","Bolt M8","Bolt M10",
  "Claw Hammer","Mallet","Rubber Mallet","Ball Peen Hammer",
];
const leaves = rawNames.map(n => ({ path:[{id:n,name:n}], fullName:n, category:"HARDWARE" as const }));
let pass=0, weak=0, fail=0, skip=0;
const failures: string[] = [];
const failCats: Record<string,number> = {};
for (const t of tests) {
  if (!leaves.some(l => l.fullName === t.expect)) { skip++; continue; }
  const top = findTopMatches(t.say, leaves, 1);
  const best = top[0];
  const score = best ? Math.round(best.score * 100) : 0;
  const correct = best?.fullName === t.expect;
  if (score >= 65 && correct) pass++;
  else if (score >= 50 && correct) { weak++; }
  else {
    fail++;
    const cat = t.desc.replace(/^hw-\d+-/, "").split("-")[0];
    failCats[cat] = (failCats[cat]??0)+1;
    if (failures.length < 80) failures.push(`✗ [${t.desc}] "${t.say}" → got:"${best?.fullName??"NONE"}" ${score}% (want:"${t.expect}")`);
  }
}
const total = pass+weak+fail;
console.log(`\n${"═".repeat(68)}`);
console.log(`SAMPLE RUN: ${total.toLocaleString()} tests (${skip} skipped)`);
console.log(`✓ PASS  ${pass.toLocaleString().padStart(6)} (${((pass/total)*100).toFixed(1)}%)`);
console.log(`~ WEAK  ${weak.toLocaleString().padStart(6)} (${((weak/total)*100).toFixed(1)}%)`);
console.log(`✗ FAIL  ${fail.toLocaleString().padStart(6)} (${((fail/total)*100).toFixed(1)}%)`);
if (Object.keys(failCats).length) {
  console.log("\nFAIL CATEGORIES:");
  Object.entries(failCats).sort((a,b)=>b[1]-a[1]).slice(0,25).forEach(([c,n])=>console.log(`  ${c.padEnd(28)} ${n}`));
}
if (failures.length) { console.log("\nSAMPLE FAILURES:"); failures.forEach(f=>console.log(f)); }
console.log(`${"═".repeat(68)}\n`);
