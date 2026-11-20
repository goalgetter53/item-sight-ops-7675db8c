/**
 * Runner for 5000+ hardware voice test cases.
 * Loads /tmp/hw_tests.json and runs each through findTopMatches.
 */
import { readFileSync } from "fs";
import { findTopMatches } from "./src/lib/hinglish-match";

type TC = { desc: string; say: string; expect: string };

const tests: TC[] = JSON.parse(readFileSync("/tmp/hw_tests.json", "utf8"));

// ─── COMPREHENSIVE HARDWARE PRODUCT LEAVES ───────────────────────────────────
// Mock of what Supabase would return — all hardware products
const rawNames = [
  // Hinges
  "Door Hinges Auto",
  "Door Hinges Stainless",
  "Hinge SS 3 inch",
  "Hinge SS 4 inch",
  "Hinge 3 inch",
  "Hinge 4 inch",
  "Cabinet Hinge",
  "Flush Hinge",
  "Piano Hinge",
  // Handles
  "Birangee Handle 3 inch",
  "Birangee Handle 4 inch",
  "Birangee Handle 6 inch",
  "Corby Handle 3 inch",
  "Corby Handle 4 inch",
  "Drawer Handle 3 inch",
  "Drawer Handle 4 inch",
  "Cabinet Handle",
  "Pull Handle",
  // Channels / Slides
  "Trolly Channel 20",
  "Trolly Channel 24",
  "Drawer Slide 18 inch",
  "Drawer Slide 24 inch",
  "Soft Close Channel",
  // Screws
  "Screw 1 inch",
  "Screw 1.5 inch",
  "Screw 2 inch",
  "Screw 2.5 inch",
  "Screw 3 inch",
  "Screw 4 inch",
  // Nails
  "Nail 1 inch",
  "Nail 2 inch",
  "Nail 3 inch",
  "Nail 4 inch",
  // Adhesives
  "Fevicol SH 1kg",
  "Fevicol SH 5kg",
  "Fevicol SH 20kg",
  "Fevicol MR 1kg",
  // Jali
  "Jali Sheet Perforated",
  "Wire Mesh",
  // Locks / Latches
  "Latch 3 inch",
  "Latch 4 inch",
  "Cabinet Lock SS",
  "Aldropi Lock",
  "Magnetic Catch",
  "Magnet Catch",
  // Sandpaper
  "Sandpaper 80 grit",
  "Sandpaper 120 grit",
  "Sandpaper 180 grit",
  "Sandpaper 240 grit",
  // Fasteners
  "Washer M4",
  "Washer M6",
  "Washer M8",
  "Washer M10",
  "Nut M4",
  "Nut M6",
  "Nut M8",
  "Nut M10",
  "Bolt M4",
  "Bolt M6",
  "Bolt M8",
  "Bolt M10",
  // Tools
  "Claw Hammer",
  "Mallet",
  "Rubber Mallet",
  "Ball Peen Hammer",
];

const leaves = rawNames.map(n => ({
  path: [{ id: n, name: n }],
  fullName: n,
  category: "HARDWARE" as const,
}));

// ─── RUN ─────────────────────────────────────────────────────────────────────
let pass = 0, weak = 0, fail = 0, noMatch = 0;
const failures: string[] = [];
const weakCases: string[] = [];

// Group failures by category for analysis
const failByCategory: Record<string, number> = {};
const weakByCategory: Record<string, number> = {};

for (const t of tests) {
  const top = findTopMatches(t.say, leaves, 3);
  const best = top[0];
  const score = best ? Math.round(best.score * 100) : 0;

  // Check if expected product even exists in our leaves
  const expectExists = leaves.some(l => l.fullName === t.expect);
  if (!expectExists) {
    // Skip tests for products not in our mock list
    noMatch++;
    continue;
  }

  const correctItem = best?.fullName === t.expect;
  const strong = score >= 65 && correctItem;
  const ok = score >= 50 && correctItem;

  const category = t.desc.replace(/^hw-\d+-/, "").split("-")[0];

  if (strong) {
    pass++;
  } else if (ok) {
    weak++;
    weakByCategory[category] = (weakByCategory[category] ?? 0) + 1;
    if (weakCases.length < 100) {
      weakCases.push(`~ [${t.desc}] "${t.say}" → got:"${best?.fullName}" ${score}% (want:"${t.expect}")`);
    }
  } else {
    fail++;
    failByCategory[category] = (failByCategory[category] ?? 0) + 1;
    if (failures.length < 200) {
      failures.push(`✗ [${t.desc}] "${t.say}" → got:"${best?.fullName ?? "NONE"}" ${score}% (want:"${t.expect}")`);
    }
  }
}

const total = pass + weak + fail;
const pct = (n: number) => ((n / total) * 100).toFixed(1);

console.log(`\n${"═".repeat(70)}`);
console.log(`HARDWARE VOICE MATCHER — ${total.toLocaleString()} TESTS (${noMatch} skipped/not-in-mock)`);
console.log(`${"═".repeat(70)}`);
console.log(`✓ PASS  ${pass.toLocaleString().padStart(7)} (${pct(pass)}%)`);
console.log(`~ WEAK  ${weak.toLocaleString().padStart(7)} (${pct(weak)}%)  — correct item but score 50–64%`);
console.log(`✗ FAIL  ${fail.toLocaleString().padStart(7)} (${pct(fail)}%)  — wrong item or score <50%`);
console.log(`${"─".repeat(70)}`);

// Top failure categories
if (Object.keys(failByCategory).length > 0) {
  console.log("\nTOP FAILURE CATEGORIES:");
  Object.entries(failByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([cat, n]) => console.log(`  ${cat.padEnd(25)} ${n} failures`));
}

if (Object.keys(weakByCategory).length > 0) {
  console.log("\nTOP WEAK CATEGORIES:");
  Object.entries(weakByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([cat, n]) => console.log(`  ${cat.padEnd(25)} ${n} weak`));
}

if (failures.length > 0) {
  console.log(`\nFIRST ${Math.min(failures.length, 50)} FAILURES:`);
  failures.slice(0, 50).forEach(f => console.log(f));
  if (failures.length > 50) console.log(`  ... and ${failures.length - 50} more`);
}

if (weakCases.length > 0) {
  console.log(`\nFIRST ${Math.min(weakCases.length, 30)} WEAK CASES:`);
  weakCases.slice(0, 30).forEach(f => console.log(f));
}

console.log(`\n${"═".repeat(70)}`);
console.log(`OVERALL SCORE: ${((pass + weak * 0.5) / total * 100).toFixed(1)}%  (pass + half-credit for weak)`);
console.log(`${"═".repeat(70)}\n`);
