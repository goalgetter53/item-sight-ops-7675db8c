import { preprocess, findTopMatches } from "./src/lib/hinglish-match";

const leaves = [
  "18mm Applewood Ultra 7x4","18mm Applewood Ultra 8x4",
  "12mm BWP Marine 8x4","12mm BWP Marine 7x4",
  "19mm MDF Board 8x4","6mm MDF 8x4",
  "Door Hinges Auto","Door Hinges Stainless",
  "Trolly Channel 20","Trolly Channel 24",
  "Birangee Handle 4 inch","Birangee Handle 3 inch",
  "Corby Handle 3 inch","Corby Handle 4 inch",
  "Jali Sheet Perforated","Fevicol SH 1kg","Fevicol SH 5kg",
  "18mm Commercial Ply 7x4","18mm Commercial Ply 8x4",
  "12mm Commercial Ply 7x4","4mm Ply 7x4",
  "Hinge SS 4 inch","Hinge SS 3 inch",
  "Screw 2 inch","Screw 1.5 inch",
].map(n => ({ path: [{ id: n, name: n }], fullName: n }));

type T = { desc: string; say: string; expect?: string };

const tests: T[] = [
  // FAST SPEECH / JOINED WORDS
  { desc:"fast: athrammapplewood",    say:"athrammapplewood ultrasaccha",   expect:"18mm Applewood Ultra 7x4" },
  { desc:"fast: 18mmapplewood",       say:"18mmapplewood ultra saccha",     expect:"18mm Applewood Ultra 7x4" },
  { desc:"fast: athra-mm",            say:"athra-mm applewood ultra 7x4",  expect:"18mm Applewood Ultra 7x4" },
  { desc:"fast: barahmmbwp84",        say:"barahmm bwp 84",                expect:"12mm BWP Marine 8x4" },
  { desc:"fast: trollychannel20",     say:"trollychannel bees",            expect:"Trolly Channel 20" },
  { desc:"fast: autohings",           say:"autohings door",                expect:"Door Hinges Auto" },
  { desc:"fast: fevicolSH1kg",        say:"fevicolSH ekkg",                expect:"Fevicol SH 1kg" },

  // MIXED NUMERALS + HINDI WORDS
  { desc:"mix: 18 mm applewood saccha",    say:"18 mm applewood saccha",     expect:"18mm Applewood Ultra 7x4" },
  { desc:"mix: athra mm applewood 7x4",    say:"athra mm applewood 7x4",     expect:"18mm Applewood Ultra 7x4" },
  { desc:"mix: 18 applewood saatchar",     say:"18 applewood saatchar",      expect:"18mm Applewood Ultra 7x4" },
  { desc:"mix: athra applewood 8*4",       say:"athra applewood 8*4",        expect:"18mm Applewood Ultra 8x4" },
  { desc:"mix: baara mm bwp aath-4",       say:"baara mm bwp aath 4",        expect:"12mm BWP Marine 8x4" },
  { desc:"mix: 12 bwp marine aatchaar",    say:"12 bwp marine aatchaar",     expect:"12mm BWP Marine 8x4" },
  { desc:"mix: bara bwp 8x4",              say:"bara bwp 8x4",               expect:"12mm BWP Marine 8x4" },
  { desc:"mix: mdf unees mm 84",           say:"mdf unees mm 84",            expect:"19mm MDF Board 8x4" },
  { desc:"mix: 19 mdf board 8 4",          say:"19 mdf board 8 4",           expect:"19mm MDF Board 8x4" },
  { desc:"mix: trolly chanel bees",        say:"trolly chanel bees",         expect:"Trolly Channel 20" },
  { desc:"mix: trolley channel chauvis",   say:"trolley channel chauvis",    expect:"Trolly Channel 24" },
  { desc:"mix: birangi handle chaar inch", say:"birangi handle chaar inch",  expect:"Birangee Handle 4 inch" },
  { desc:"mix: corby teen inch",           say:"corby teen inch",            expect:"Corby Handle 3 inch" },
  { desc:"mix: korby handle 3",            say:"korby handle 3",             expect:"Corby Handle 3 inch" },
  { desc:"mix: hinge ss chaar inch",       say:"hinge ss chaar inch",        expect:"Hinge SS 4 inch" },
  { desc:"mix: hinge ss teen inch",        say:"hinge ss teen inch",         expect:"Hinge SS 3 inch" },
  { desc:"mix: screw do inch",             say:"screw do inch",              expect:"Screw 2 inch" },
  { desc:"mix: screw dedh inch",           say:"screw dedh inch",            expect:"Screw 1.5 inch" },
  { desc:"mix: fevicol paanch kg",         say:"fevicol paanch kg",          expect:"Fevicol SH 5kg" },
  { desc:"mix: fewicol ek kg",             say:"fewicol ek kg",              expect:"Fevicol SH 1kg" },

  // DIGIT-ONLY FAST
  { desc:"digits: 18 applewood 74",        say:"18 applewood 74",            expect:"18mm Applewood Ultra 7x4" },
  { desc:"digits: 18 applewood 84",        say:"18 applewood 84",            expect:"18mm Applewood Ultra 8x4" },
  { desc:"digits: 12 bwp 84",              say:"12 bwp 84",                  expect:"12mm BWP Marine 8x4" },
  { desc:"digits: 12 bwp 74",              say:"12 bwp 74",                  expect:"12mm BWP Marine 7x4" },
  { desc:"digits: mdf 19 84",              say:"mdf 19 84",                  expect:"19mm MDF Board 8x4" },

  // ALL-HINDI FULL SENTENCES
  { desc:"hindi: athra mm applewood lao saccha",   say:"athra mm applewood lao saccha",   expect:"18mm Applewood Ultra 7x4" },
  { desc:"hindi: baarah mm bwp aathchar",          say:"baarah mm bwp aathchar",          expect:"12mm BWP Marine 8x4" },
  { desc:"hindi: birangi handle chaar inch",       say:"birangi handle chaar inch",       expect:"Birangee Handle 4 inch" },
  { desc:"hindi: trolly chenal lana bees",         say:"trolly chenal lana bees",         expect:"Trolly Channel 20" },
  { desc:"hindi: fewicol ek kilo",                 say:"fewicol ek kilo",                 expect:"Fevicol SH 1kg" },
  { desc:"hindi: auto hings chahiye",              say:"auto hings chahiye",              expect:"Door Hinges Auto" },
  { desc:"hindi: jaali sheet lao perporated",      say:"jaali sheet lao perporated",      expect:"Jali Sheet Perforated" },
  { desc:"hindi: korbi teen inch wala",            say:"korbi teen inch wala",            expect:"Corby Handle 3 inch" },
  { desc:"hindi: verangi handle chaar inch",       say:"verangi handle dena chaar inch",  expect:"Birangee Handle 4 inch" },

  // TELUGU ACCENT (-thi/-ki/-ku postpositions)
  { desc:"telugu: athrathi mm applewood saccha",   say:"athrathi mm applewood saccha",   expect:"18mm Applewood Ultra 7x4" },
  { desc:"telugu: bwpthi marine aathchar",         say:"baarahmm bwpthi marine aathchar",expect:"12mm BWP Marine 8x4" },
  { desc:"telugu: trollythi channel 20",           say:"trollythi channel 20",           expect:"Trolly Channel 20" },
  { desc:"telugu: birangeethi handle chaar",       say:"birangeethi handle chaar",       expect:"Birangee Handle 4 inch" },
  { desc:"telugu: fevicolki 1 kg",                 say:"fevicolki 1 kg",                 expect:"Fevicol SH 1kg" },
  { desc:"telugu: autohingesku door",              say:"autohingesku door",              expect:"Door Hinges Auto" },

  // STT GARBLES
  { desc:"garble: appullwood",           say:"athra mm appullwood saccha",    expect:"18mm Applewood Ultra 7x4" },
  { desc:"garble: bwpp mareen",          say:"12 bwpp mareen 84",             expect:"12mm BWP Marine 8x4" },
  { desc:"garble: troly channel 24",     say:"troly channel 24",              expect:"Trolly Channel 24" },
  { desc:"garble: biranje handle",       say:"biranje handle 4 inch",         expect:"Birangee Handle 4 inch" },
  { desc:"garble: perporated jaali",     say:"perporated jaali sheet",        expect:"Jali Sheet Perforated" },
  { desc:"garble: m d f 19mm 84",        say:"m d f 19mm 84",                 expect:"19mm MDF Board 8x4" },
  { desc:"garble: b w p baarah mm 84",   say:"b w p baarah mm 84",            expect:"12mm BWP Marine 8x4" },
  { desc:"garble: attra mm",             say:"attra mm applewood saccha",     expect:"18mm Applewood Ultra 7x4" },

  // PARTIAL / BRAND ONLY
  { desc:"partial: applewood",   say:"applewood" },
  { desc:"partial: bwp marine",  say:"bwp marine" },
  { desc:"partial: birangee",    say:"birangee" },
  { desc:"partial: trolly",      say:"trolly" },
  { desc:"partial: fevicoal",    say:"fevicoal" },
];

console.log("=== STRESS TEST ===\n");
let pass=0, weak=0, fail=0;
const failures: string[] = [];
for (const t of tests) {
  const pre = preprocess(t.say);
  const top = findTopMatches(t.say, leaves, 1);
  const match = top[0];
  const score = match ? Math.round(match.score * 100) : 0;
  const correctItem = !t.expect || match?.fullName === t.expect;
  const strong = score >= 70 && correctItem;
  const ok = score >= 50;
  if (strong) pass++;
  else if (ok) weak++;
  else fail++;

  if (!strong) {
    const icon = ok ? "~" : "✗";
    failures.push(`${icon} [${t.desc}]\n   said:   "${t.say}"\n   parsed: "${pre}"\n   got:    "${match?.fullName ?? "NO MATCH"}" ${score}%${t.expect ? `\n   expect: "${t.expect}"` : ""}`);
  }
}
if (failures.length) {
  console.log("ISSUES:\n");
  failures.forEach(f => console.log(f + "\n"));
}
console.log(`\n✓ ${pass} pass  ~ ${weak} weak  ✗ ${fail} fail  (${tests.length} total)`);
