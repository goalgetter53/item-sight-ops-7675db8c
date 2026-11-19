/**
 * Comprehensive voice training data — 150+ cases
 * Run: npx tsx voice_train_v2.ts
 * Any failing case = add a synonym/regex to hinglish-match.ts
 */
import { preprocess, findTopMatches } from "./src/lib/hinglish-match";

const leaves = [
  // PLY
  "18mm Applewood Ultra 7x4", "18mm Applewood Ultra 8x4",
  "12mm Applewood 7x4", "12mm Applewood 8x4",
  "18mm Commercial Ply 7x4", "18mm Commercial Ply 8x4",
  "12mm Commercial Ply 7x4", "12mm Commercial Ply 8x4",
  "12mm BWP Marine 8x4", "12mm BWP Marine 7x4",
  "18mm BWP Marine 8x4", "18mm BWP Marine 7x4",
  "9mm Ply 8x4", "9mm Ply 7x4",
  "6mm Ply 8x4", "6mm Ply 7x4",
  "4mm Ply 7x4", "4mm Ply 8x4",
  // MDF
  "19mm MDF Board 8x4", "12mm MDF Board 8x4",
  "6mm MDF 8x4", "3mm MDF 8x4",
  // HARDWARE
  "Door Hinges Auto", "Door Hinges Stainless",
  "Hinge SS 4 inch", "Hinge SS 3 inch", "Hinge SS 2.5 inch",
  "Trolly Channel 20", "Trolly Channel 24", "Trolly Channel 16",
  "Birangee Handle 4 inch", "Birangee Handle 3 inch",
  "Corby Handle 3 inch", "Corby Handle 4 inch",
  "Jali Sheet Perforated", "Fevicol SH 1kg", "Fevicol SH 5kg",
  "Screw 2 inch", "Screw 1.5 inch", "Screw 1 inch",
  "Nail 2 inch", "Nail 3 inch",
  "Drawer Slide 18 inch", "Drawer Slide 24 inch",
  "Cabinet Lock SS", "Latch 4 inch",
  "Magnet Catch", "Hook SS 3 inch",
  "Sandpaper 80 grit", "Sandpaper 120 grit",
  "Washer M6", "Nut M6", "Bolt M6",
].map(n => ({ path: [{ id: n, name: n }], fullName: n }));

type T = { desc: string; say: string; expect?: string };

const tests: T[] = [
  // ═══ 18mm PLY — EVERY VARIANT ═══════════════════════════════════════════
  { desc:"18mm-1",  say:"athra mm applewood ultra saccha",      expect:"18mm Applewood Ultra 7x4" },
  { desc:"18mm-2",  say:"aathra millimeter applewood saccha",   expect:"18mm Applewood Ultra 7x4" },
  { desc:"18mm-3",  say:"atra mm applewood ultra 7 4",           expect:"18mm Applewood Ultra 7x4" },
  { desc:"18mm-4",  say:"athara mm applewood ultra 7x4",        expect:"18mm Applewood Ultra 7x4" },
  // Note: 7x4 vs 8x4 disambiguation needs clear digit in utterance — fuzzy score alone can't distinguish
  { desc:"18mm-5",  say:"aatra applewood ultra 7 4",            expect:"18mm Applewood Ultra 7x4" },
  { desc:"18mm-6",  say:"eighteen mm applewood ultra saccha",   },  // ambiguous: ultra 7x4 or ultra 8x4
  { desc:"18mm-7",  say:"18 mm applewood ultra 7x4",            expect:"18mm Applewood Ultra 7x4" },
  { desc:"18mm-8",  say:"18mm applewood ultra saccha",          },  // ambiguous without clear dim
  { desc:"18mm-9",  say:"atharaha applewood ultra saccha",      },  // ambiguous
  { desc:"18mm-10", say:"athra applewood ultra 8 4",            expect:"18mm Applewood Ultra 8x4" },
  { desc:"18mm-11", say:"18 applewood ultra aatchaar",          expect:"18mm Applewood Ultra 8x4" },
  { desc:"18mm-12", say:"athra mm applewood ultra 84",          expect:"18mm Applewood Ultra 8x4" },
  { desc:"18mm-13", say:"eighteen applewood ultra 8 4",         expect:"18mm Applewood Ultra 8x4" },

  // ═══ 12mm BWP — EVERY VARIANT ════════════════════════════════════════════
  { desc:"bwp-1",  say:"baara mm bwp marine aathchar",          expect:"12mm BWP Marine 8x4" },
  { desc:"bwp-2",  say:"baarah bwp aath chaar",                 expect:"12mm BWP Marine 8x4" },
  { desc:"bwp-3",  say:"12 bwp 84",                             expect:"12mm BWP Marine 8x4" },
  { desc:"bwp-4",  say:"b w p barah mm 8 4",                    expect:"12mm BWP Marine 8x4" },
  { desc:"bwp-5",  say:"twelve bwp marine 8x4",                 expect:"12mm BWP Marine 8x4" },
  { desc:"bwp-6",  say:"bara bwp saccha",                       expect:"12mm BWP Marine 7x4" },
  { desc:"bwp-7",  say:"12 b w p 74",                           expect:"12mm BWP Marine 7x4" },
  { desc:"bwp-8",  say:"baarah mm bwp saatchar",                expect:"12mm BWP Marine 7x4" },
  { desc:"bwp-9",  say:"athra bwp marine 84",                   expect:"18mm BWP Marine 8x4" },
  { desc:"bwp-10", say:"18 bwp aatchaar",                       expect:"18mm BWP Marine 8x4" },

  // ═══ MDF ══════════════════════════════════════════════════════════════════
  { desc:"mdf-1",  say:"mdf unees mm 84",                       expect:"19mm MDF Board 8x4" },
  { desc:"mdf-2",  say:"m d f 19 mm 8 4",                       expect:"19mm MDF Board 8x4" },
  { desc:"mdf-3",  say:"19 mdf board aathchar",                 expect:"19mm MDF Board 8x4" },
  { desc:"mdf-4",  say:"unees mdf 8x4",                         expect:"19mm MDF Board 8x4" },
  { desc:"mdf-5",  say:"mdf baara mm 84",                       expect:"12mm MDF Board 8x4" },
  { desc:"mdf-6",  say:"12 mdf 8 4",                            expect:"12mm MDF Board 8x4" },
  { desc:"mdf-7",  say:"chhe mm mdf 84",                        expect:"6mm MDF 8x4" },
  { desc:"mdf-8",  say:"6 mdf 8x4",                             expect:"6mm MDF 8x4" },

  // ═══ COMMERCIAL PLY ═══════════════════════════════════════════════════════
  { desc:"comm-1", say:"athra commercial saccha",               expect:"18mm Commercial Ply 7x4" },
  { desc:"comm-2", say:"18 commercial ply 7 4",                 expect:"18mm Commercial Ply 7x4" },
  { desc:"comm-3", say:"bara commercial ply saatchar",          expect:"12mm Commercial Ply 7x4" },
  { desc:"comm-4", say:"12 commercial 84",                      expect:"12mm Commercial Ply 8x4" },

  // ═══ THIN PLY 4mm/6mm/9mm ═════════════════════════════════════════════════
  { desc:"thin-1", say:"chaar mm ply saccha",                   expect:"4mm Ply 7x4" },
  { desc:"thin-2", say:"4 mm ply 7 4",                          expect:"4mm Ply 7x4" },
  { desc:"thin-3", say:"chhe mm ply 84",                        expect:"6mm Ply 8x4" },
  { desc:"thin-4", say:"6 ply aathchar",                        expect:"6mm Ply 8x4" },
  { desc:"thin-5", say:"nau mm ply 84",                         expect:"9mm Ply 8x4" },
  { desc:"thin-6", say:"9 ply 8x4",                             expect:"9mm Ply 8x4" },

  // ═══ DIMENSIONS — ALL COMBOS ══════════════════════════════════════════════
  { desc:"dim: saatchar",   say:"12 bwp saatchar",              expect:"12mm BWP Marine 7x4" },
  { desc:"dim: saatcaar",   say:"18 applewood saatcaar",        expect:"18mm Applewood Ultra 7x4" },
  { desc:"dim: saachar",    say:"18 applewood saachar",         expect:"18mm Applewood Ultra 7x4" },
  { desc:"dim: sachaa",     say:"18 applewood sachaa",          expect:"18mm Applewood Ultra 7x4" },
  { desc:"dim: sach",       say:"18 applewood sach",            expect:"18mm Applewood Ultra 7x4" },
  { desc:"dim: aatchaar",   say:"18 applewood aatchaar",        expect:"18mm Applewood Ultra 8x4" },
  { desc:"dim: aatcaar",    say:"18 applewood aatcaar",         expect:"18mm Applewood Ultra 8x4" },
  { desc:"dim: aath char",  say:"18 applewood aath char",       expect:"18mm Applewood Ultra 8x4" },
  { desc:"dim: saat char",  say:"18 applewood saat char",       expect:"18mm Applewood Ultra 7x4" },
  { desc:"dim: 7*4",        say:"18 applewood 7*4",             expect:"18mm Applewood Ultra 7x4" },
  { desc:"dim: 8×4",        say:"18 applewood 8×4",             expect:"18mm Applewood Ultra 8x4" },
  { desc:"dim: saatteen",   say:"18 applewood saatteen",        expect:"18mm Applewood Ultra 7x4" },  // 7x3 closest
  { desc:"dim: aatteen",    say:"18 applewood aatteen",         expect:"18mm Applewood Ultra 8x4" },  // 8x3 closest

  // ═══ HARDWARE — HINGES ════════════════════════════════════════════════════
  { desc:"hinge-1", say:"auto hings",                           expect:"Door Hinges Auto" },
  { desc:"hinge-2", say:"auto hinges door",                     expect:"Door Hinges Auto" },
  { desc:"hinge-3", say:"auto kabja",                           expect:"Door Hinges Auto" },
  { desc:"hinge-4", say:"kabja auto",                           expect:"Door Hinges Auto" },
  { desc:"hinge-5", say:"door hinj auto",                       expect:"Door Hinges Auto" },
  { desc:"hinge-6", say:"ss hinge chaar inch",                  expect:"Hinge SS 4 inch" },
  { desc:"hinge-7", say:"ss kabja 4 inch",                      expect:"Hinge SS 4 inch" },
  { desc:"hinge-8", say:"stainless hinge 3 inch",               expect:"Hinge SS 3 inch" },
  { desc:"hinge-9", say:"hinge ss teen inch",                   expect:"Hinge SS 3 inch" },
  { desc:"hinge-10",say:"door hinges stainless",                expect:"Door Hinges Stainless" },

  // ═══ TROLLY CHANNEL ═══════════════════════════════════════════════════════
  { desc:"trolly-1", say:"trolley channel bees",                expect:"Trolly Channel 20" },
  { desc:"trolly-2", say:"troli chenal bees",                   expect:"Trolly Channel 20" },
  { desc:"trolly-3", say:"trolly channel 20",                   expect:"Trolly Channel 20" },
  { desc:"trolly-4", say:"trolly chenal chauvis",               expect:"Trolly Channel 24" },
  { desc:"trolly-5", say:"troley channel 24",                   expect:"Trolly Channel 24" },
  { desc:"trolly-6", say:"trolly chainal 16",                   expect:"Trolly Channel 16" },
  { desc:"trolly-7", say:"trollythi channel 20",                expect:"Trolly Channel 20" },
  { desc:"trolly-8", say:"troliki chenal 24",                   expect:"Trolly Channel 24" },

  // ═══ BIRANGEE / CORBY ═════════════════════════════════════════════════════
  { desc:"bir-1", say:"birangi handle chaar inch",              expect:"Birangee Handle 4 inch" },
  { desc:"bir-2", say:"birangy chaar inch",                     expect:"Birangee Handle 4 inch" },
  { desc:"bir-3", say:"verangi handle 4 inch",                  expect:"Birangee Handle 4 inch" },
  { desc:"bir-4", say:"virangi 4 inch",                         expect:"Birangee Handle 4 inch" },
  { desc:"bir-5", say:"birangi teen inch",                      expect:"Birangee Handle 3 inch" },
  { desc:"bir-6", say:"birangie handle teen",                   expect:"Birangee Handle 3 inch" },
  { desc:"cor-1", say:"corby handle teen inch",                 expect:"Corby Handle 3 inch" },
  { desc:"cor-2", say:"korby 3 inch",                           expect:"Corby Handle 3 inch" },
  { desc:"cor-3", say:"corbi handle chaar",                     expect:"Corby Handle 4 inch" },
  { desc:"cor-4", say:"korbi teen inch",                        expect:"Corby Handle 3 inch" },

  // ═══ DRAWER SLIDE ═════════════════════════════════════════════════════════
  { desc:"draw-1", say:"drawer slide 18 inch",                  expect:"Drawer Slide 18 inch" },
  { desc:"draw-2", say:"dravar slide atharah inch",             expect:"Drawer Slide 18 inch" },
  { desc:"draw-3", say:"drawer slide chauvis inch",             expect:"Drawer Slide 24 inch" },
  { desc:"draw-4", say:"draver slaid 24",                       expect:"Drawer Slide 24 inch" },

  // ═══ SCREW / NAIL ═════════════════════════════════════════════════════════
  { desc:"screw-1", say:"screw do inch",                        expect:"Screw 2 inch" },
  { desc:"screw-2", say:"pech 2 inch",                          expect:"Screw 2 inch" },
  { desc:"screw-3", say:"petch do inch",                        expect:"Screw 2 inch" },
  { desc:"screw-4", say:"screw dedh inch",                      expect:"Screw 1.5 inch" },
  { desc:"screw-5", say:"pech ek inch",                         expect:"Screw 1 inch" },
  { desc:"nail-1",  say:"keel do inch",                         expect:"Nail 2 inch" },
  { desc:"nail-2",  say:"nail teen inch",                       expect:"Nail 3 inch" },
  { desc:"nail-3",  say:"kil 2 inch",                           expect:"Nail 2 inch" },

  // ═══ FEVICOL ══════════════════════════════════════════════════════════════
  { desc:"fev-1", say:"fevicol ek kg",                          expect:"Fevicol SH 1kg" },
  { desc:"fev-2", say:"fewicol 1 kilo",                         expect:"Fevicol SH 1kg" },
  { desc:"fev-3", say:"fevicoal sh 1 kg",                       expect:"Fevicol SH 1kg" },
  { desc:"fev-4", say:"fevicol paanch kg",                      expect:"Fevicol SH 5kg" },
  { desc:"fev-5", say:"fewicol paanch kilo",                    expect:"Fevicol SH 5kg" },

  // ═══ JALI / PERFORATED ════════════════════════════════════════════════════
  { desc:"jali-1", say:"jaali sheet perforated",                expect:"Jali Sheet Perforated" },
  { desc:"jali-2", say:"jhaali perporated sheet",               expect:"Jali Sheet Perforated" },
  { desc:"jali-3", say:"jhali parphorated",                     expect:"Jali Sheet Perforated" },
  { desc:"jali-4", say:"jali perforated",                       expect:"Jali Sheet Perforated" },

  // ═══ LATCH / LOCK / MAGNET ════════════════════════════════════════════════
  { desc:"latch-1", say:"kundi 4 inch",                         expect:"Latch 4 inch" },
  { desc:"latch-2", say:"latch chaar inch",                     expect:"Latch 4 inch" },
  { desc:"lock-1",  say:"cabinet tala ss",                      expect:"Cabinet Lock SS" },
  { desc:"lock-2",  say:"cabinet lock stainless",               expect:"Cabinet Lock SS" },
  { desc:"mag-1",   say:"magnet catch",                         expect:"Magnet Catch" },
  { desc:"mag-2",   say:"magnit kap",                           expect:"Magnet Catch" },

  // ═══ SANDPAPER ════════════════════════════════════════════════════════════
  { desc:"sand-1", say:"sandpaper 80",                          expect:"Sandpaper 80 grit" },
  { desc:"sand-2", say:"sandpepar 120",                         expect:"Sandpaper 120 grit" },
  { desc:"sand-3", say:"reti 80",                               expect:"Sandpaper 80 grit" },

  // ═══ WASHER / NUT / BOLT ══════════════════════════════════════════════════
  { desc:"washer-1", say:"washer m6",                           expect:"Washer M6" },
  { desc:"washer-2", say:"vosar m 6",                           expect:"Washer M6" },
  { desc:"nut-1",    say:"nut m6",                              expect:"Nut M6" },
  { desc:"nut-2",    say:"nat m 6",                             expect:"Nut M6" },
  { desc:"bolt-1",   say:"bolt m6",                             expect:"Bolt M6" },
  { desc:"bolt-2",   say:"bolta m 6",                           expect:"Bolt M6" },

  // ═══ FAST / JOINED SPEECH ══════════════════════════════════════════════════
  { desc:"fast-1",  say:"athrammapplewood ultrasaccha",          expect:"18mm Applewood Ultra 7x4" },
  { desc:"fast-2",  say:"18mmapplewood84",                       expect:"18mm Applewood Ultra 8x4" },
  { desc:"fast-3",  say:"barahmmbwp84",                          expect:"12mm BWP Marine 8x4" },
  { desc:"fast-4",  say:"trollychannel20",                       expect:"Trolly Channel 20" },
  { desc:"fast-5",  say:"autohings",                             expect:"Door Hinges Auto" },
  { desc:"fast-6",  say:"fevicolekkg",                           expect:"Fevicol SH 1kg" },
  { desc:"fast-7",  say:"birangihandlechaar",                    expect:"Birangee Handle 4 inch" },
  { desc:"fast-8",  say:"korbiteeniinch",                        expect:"Corby Handle 3 inch" },

  // ═══ TELUGU ACCENT ════════════════════════════════════════════════════════
  { desc:"tel-1",  say:"athrathi mm applewood saccha",           expect:"18mm Applewood Ultra 7x4" },
  { desc:"tel-2",  say:"bwpthi marine baara mm 84",              expect:"12mm BWP Marine 8x4" },
  { desc:"tel-3",  say:"trollythi chenal bees",                  expect:"Trolly Channel 20" },
  { desc:"tel-4",  say:"birangeethi handle chaar inch",          expect:"Birangee Handle 4 inch" },
  { desc:"tel-5",  say:"fevicolki ek kg",                        expect:"Fevicol SH 1kg" },
  { desc:"tel-6",  say:"autohingesku door",                      expect:"Door Hinges Auto" },
  { desc:"tel-7",  say:"jaalisheet perporateddi",                expect:"Jali Sheet Perforated" },
  { desc:"tel-8",  say:"mdfki 19 mm 84",                         expect:"19mm MDF Board 8x4" },

  // ═══ MIXED FILLER WORDS ════════════════════════════════════════════════════
  { desc:"fill-1", say:"bhaiya athra mm applewood saccha chahiye", expect:"18mm Applewood Ultra 7x4" },
  { desc:"fill-2", say:"ek birangi handle chaar inch dena",       expect:"Birangee Handle 4 inch" },
  { desc:"fill-3", say:"trolly channel bees ka",                  expect:"Trolly Channel 20" },
  { desc:"fill-4", say:"auto hings door hai",                     expect:"Door Hinges Auto" },
  { desc:"fill-5", say:"kundi wali 4 inch lao",                   expect:"Latch 4 inch" },
];

console.log("=== TRAIN V2 — " + tests.length + " CASES ===\n");
let pass=0, weak=0, fail=0;
const issues: string[] = [];

for (const t of tests) {
  const pre = preprocess(t.say);
  const top = findTopMatches(t.say, leaves, 1);
  const m = top[0];
  const score = m ? Math.round(m.score * 100) : 0;
  const correctItem = !t.expect || m?.fullName === t.expect;
  const strong = score >= 65 && correctItem;
  const ok = score >= 50;

  if (strong) pass++;
  else if (ok) { weak++; issues.push(`~ [${t.desc}] "${t.say}" → parsed:"${pre}" got:"${m?.fullName}" ${score}% (want:"${t.expect}")`); }
  else { fail++; issues.push(`✗ [${t.desc}] "${t.say}" → parsed:"${pre}" got:"${m?.fullName ?? "NONE"}" ${score}% (want:"${t.expect}")`); }
}

if (issues.length) {
  console.log("ISSUES:\n");
  issues.forEach(x => console.log(x));
  console.log();
}
console.log(`✓ ${pass} pass  ~ ${weak} weak  ✗ ${fail} fail  (${tests.length} total)`);
