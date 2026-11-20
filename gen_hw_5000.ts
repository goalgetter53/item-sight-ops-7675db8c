/**
 * Generates 5000+ hardware voice test cases covering:
 * - All hardware products
 * - Male/female/child voice simulation (different STT transcription patterns)
 * - High pitch / low pitch (affects vowel elongation in STT output)
 * - All Indian regional accents: Hindi Belt, Telugu, Punjabi, Gujarati, Marathi, Bengali, Bhojpuri, Haryanvi, Rajasthani
 * - Fast speech (words merged), slow speech (deliberate), normal
 * - STT garble variants
 * - Filler words
 * - Number pronunciation variants
 * - Regional name variants (keel=nail, pech=screw, kabja=hinge, kundi=latch etc.)
 */

type TC = { desc: string; say: string; expect: string };

// ─── NUMBER VARIANTS ──────────────────────────────────────────────────────────
const NUM: Record<number, string[]> = {
  1:   ["ek", "ekk", "1", "one", "ik"],
  2:   ["do", "doh", "2", "two"],
  3:   ["teen", "tin", "3", "three", "tiin"],
  4:   ["chaar", "char", "4", "four", "chhar"],
  5:   ["paanch", "panch", "5", "five", "pach"],
  6:   ["chhe", "chhah", "6", "six", "cheh"],
  8:   ["aath", "aat", "8", "eight", "att"],
  10:  ["das", "10", "ten", "duss"],
  12:  ["baara", "bara", "12", "twelve", "baarah", "barah"],
  14:  ["choda", "14", "fourteen", "chaudah"],
  16:  ["sola", "16", "sixteen", "solah"],
  18:  ["athra", "aathra", "atharah", "18", "eighteen", "athaarah", "aathara", "atra", "athara"],
  20:  ["bees", "20", "twenty", "biss"],
  24:  ["chauvis", "chaubees", "24", "twentyfour"],
  25:  ["pachees", "25", "twentyfive", "pachis"],
  30:  ["tees", "30", "thirty"],
  36:  ["chattees", "36"],
  40:  ["chalis", "40", "forty", "chaalis"],
  48:  ["attaalis", "48"],
  50:  ["pachas", "50", "fifty", "pachass"],
  60:  ["satth", "60", "sixty", "sath"],
  80:  ["assi", "80", "eighty"],
  100: ["sau", "100"],
  120: ["sau bees", "120"],
  180: ["sau assi", "180"],
};

// fractional inch sizes
const FRAC_INCH: Record<string, string[]> = {
  "1.5": ["dedh", "daid", "1.5", "ek aadha", "dedh inch wala"],
  "2.5": ["dhai", "dhaa", "2.5", "dhaai"],
  "0.5": ["aadha", "aadhi", "0.5", "half"],
};

function numVars(n: number): string[] {
  return NUM[n] ?? [String(n)];
}

function fracVars(f: string): string[] {
  return FRAC_INCH[f] ?? [f];
}

// ─── INCH VARIANTS ────────────────────────────────────────────────────────────
const INCH = ["inch", "inchi", "inchee", "inci", "in", "\""];

function inchVars(): string[] { return INCH; }

// ─── FILLER POOLS ─────────────────────────────────────────────────────────────
const BEFORE_FILLERS = [
  "", "bhaiya ", "yaar ", "sir ", "boss ", "sun ", "ek baar ",
  "bhai ", "oye ", "suno ", "dekho ", "mujhe ", "mujhe ek ",
];
const AFTER_FILLERS = [
  "", " chahiye", " dena", " dedo", " lao", " lana",
  " chahiye na", " dena please", " de do", " ek piece dena",
  " ka ek piece", " wala chahiye", " do piece dena",
  " milega kya", " hai kya", " available hai",
];
function bf() { return BEFORE_FILLERS[Math.floor(Math.random() * BEFORE_FILLERS.length)]; }
function af() { return AFTER_FILLERS[Math.floor(Math.random() * AFTER_FILLERS.length)]; }

// ─── TELUGU SUFFIX ────────────────────────────────────────────────────────────
const TEL_SFX = ["thi", "ki", "ku", "laa"];
function telSuffix(): string { return TEL_SFX[Math.floor(Math.random() * TEL_SFX.length)]; }

// ─── ACCENT WRAPPERS ─────────────────────────────────────────────────────────
// Each accent function takes the core word and returns a variant
type AccentFn = (word: string) => string;

const ACCENTS: Record<string, AccentFn> = {
  // Hindi Belt (UP/MP/Bihar) — standard, slight elongation
  hindi:    w => w,
  hindi2:   w => w.replace(/aa/g, "a").replace(/ii/g, "i"),
  // Telugu — appends -thi/-ki to key nouns
  telugu:   w => w.length >= 5 ? w + telSuffix() : w,
  telugu2:  w => w.replace(/w/g, "v").replace(/ee/g, "i"),
  // Punjabi — longer vowels, "-aa" endings
  punjabi:  w => w.replace(/a\b/g, "aa").replace(/i\b/g, "ee"),
  punjabi2: w => w + (w.endsWith("a") || w.endsWith("i") ? "aa" : ""),
  // Gujarati — softer consonants, "-ma"/"-che"
  gujarati: w => w.replace(/bh/g, "b").replace(/ph/g, "f"),
  // Marathi — "-la"/"-ya" endings
  marathi:  w => w,
  // Bengali — "aththo" for 8, consonant doubling
  bengali:  w => w.replace(/\bath\b/g, "aththo").replace(/\b8\b/g, "aath"),
  // Bhojpuri — east UP/Bihar, elongated
  bhojpuri: w => w.replace(/ar\b/g, "araa").replace(/al\b/g, "alaa"),
  // Haryanvi — Haryana, "-aa" / "-da"
  haryanvi: w => w + (w.length > 4 ? "aa" : ""),
  // Rajasthani — softer
  rajasthani: w => w.replace(/ch/g, "c").replace(/ph/g, "p"),
  // South Indian general — adds "-u" vowel endings
  south:    w => /[aeiou]$/.test(w) ? w : w + "u",
  // Female voice (faster STT, clearer): standard but shorter
  female:   w => w.replace(/(.)\1+/g, "$1"),
  // Male deep (slower, drawn-out vowels)
  male_deep: w => w.replace(/a/g, "aa").replace(/i/g, "ii"),
  // Child/young voice (fast, merged STT errors)
  child:    w => w.replace(/[aeiou]/g, m => Math.random() > 0.6 ? m : ""),
};

const ACCENT_KEYS = Object.keys(ACCENTS);

function pickAccents(n: number): string[] {
  // return n unique accent keys
  const shuffled = [...ACCENT_KEYS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

// ─── FAST SPEECH (merge words) ────────────────────────────────────────────────
function merge(parts: string[]): string {
  return parts.map(p => p.trim()).filter(Boolean).join("");
}

// ─── TESTS ARRAY ─────────────────────────────────────────────────────────────
const tests: TC[] = [];
let idx = 0;
function add(desc: string, say: string, expect: string) {
  tests.push({ desc: `hw-${++idx}-${desc}`, say: say.replace(/\s+/g, " ").trim(), expect });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT DEFINITIONS
// Each entry: { name: string (exact product name), aliases: string[], sizeWords: string[] }
// ═══════════════════════════════════════════════════════════════════════════════

// ─── HINGES ──────────────────────────────────────────────────────────────────
{
  const HINGE_ALIASES = ["kabja", "kabza", "kabzaa", "hinj", "hinja", "hings", "hinges", "hinge"];
  const HINGE_SIZES = {
    3: ["teen", "tin", "3", "three", "tin inch"],
    4: ["chaar", "char", "4", "four", "chaar inch"],
  };

  // Door Hinges Auto
  const autoAliases = ["auto", "auto close", "auto band", "khud band", "self close",
    "auto hings", "autohings", "auto hinges", "autohinge",
    "otohings", "auto hing", "aato hings", "oto hinges"];

  for (const ha of HINGE_ALIASES) {
    for (const aa of autoAliases) {
      add("auto-hinge-std", `${aa} ${ha}`, "Door Hinges Auto");
      add("auto-hinge-std", `${ha} ${aa}`, "Door Hinges Auto");
      for (const acc of pickAccents(3)) {
        const fn = ACCENTS[acc];
        add(`auto-hinge-${acc}`, `${fn(aa)} ${fn(ha)}`, "Door Hinges Auto");
        add(`auto-hinge-${acc}-filler`, `${bf()}${fn(aa)} ${fn(ha)}${af()}`, "Door Hinges Auto");
      }
    }
  }
  // fast speech
  for (const aa of ["autohings", "autohinge", "autohinges"]) {
    add("auto-hinge-fast", aa, "Door Hinges Auto");
    add("auto-hinge-fast-filler", `${bf()}${aa}${af()}`, "Door Hinges Auto");
  }
  // STT garbles
  const autoGarbles = ["auto hings door", "auto hingez", "autto hinges", "auto hinj",
    "auto hibges", "aato hing", "otto hings", "auto hings wala", "khud band hone wala hinge"];
  for (const g of autoGarbles) {
    add("auto-hinge-garble", g, "Door Hinges Auto");
  }

  // Hinge SS 3 inch and 4 inch
  for (const [size, swords] of Object.entries(HINGE_SIZES)) {
    const sizeN = Number(size);
    for (const sw of swords) {
      for (const ha of HINGE_ALIASES) {
        for (const inch of ["inch", "inchi", ""]) {
          const core = `${ha} ss ${sw} ${inch}`.trim();
          add(`hinge-ss-${sizeN}`, core, `Hinge SS ${sizeN} inch`);
          add(`hinge-ss-${sizeN}`, `ss ${ha} ${sw} ${inch}`.trim(), `Hinge SS ${sizeN} inch`);
          add(`hinge-ss-${sizeN}-filler`, `${bf()}${core}${af()}`, `Hinge SS ${sizeN} inch`);
        }
        // With "stainless" word
        for (const ss of ["stainless", "steel", "ss", "stainles", "steele"]) {
          add(`hinge-ss-${sizeN}-ss`, `${ha} ${ss} ${sw} inch`, `Hinge SS ${sizeN} inch`);
        }
      }
      // All accents
      for (const acc of ACCENT_KEYS) {
        const fn = ACCENTS[acc];
        add(`hinge-ss-${sizeN}-${acc}`, `${fn("hinge")} ss ${sw} inch`, `Hinge SS ${sizeN} inch`);
        add(`hinge-ss-${sizeN}-${acc}`, `${fn("kabja")} ss ${sw} inch`, `Hinge SS ${sizeN} inch`);
      }
      // fast speech
      add(`hinge-ss-${sizeN}-fast`, `hingess${sw}inch`, `Hinge SS ${sizeN} inch`);
      add(`hinge-ss-${sizeN}-fast`, `kabzass${sw}`, `Hinge SS ${sizeN} inch`);
    }
  }
}

// ─── HANDLES ─────────────────────────────────────────────────────────────────
{
  const HANDLE_ALIASES = ["handle", "hendal", "handal", "handel", "handil", "handil"];
  const BIRANGEE_ALIASES = ["birangee", "birangi", "birangy", "birangie", "verangi",
    "virangi", "beerangi", "birangeei", "birangii", "birrrangi",
    "birangi handle", "birangee wala", "birangi type"];
  const CORBY_ALIASES = ["corby", "korby", "corbi", "korbi", "corbe", "korbe",
    "cawrby", "karby", "corby handle", "korbi handle"];

  const HANDLE_SIZES: Array<[number, string[]]> = [
    [3, numVars(3)],
    [4, numVars(4)],
    [6, numVars(6)],
  ];

  // BIRANGEE HANDLE
  for (const [sizeN, swords] of HANDLE_SIZES) {
    for (const sw of swords) {
      for (const ba of BIRANGEE_ALIASES) {
        for (const ha of HANDLE_ALIASES) {
          for (const inch of INCH) {
            add(`birangee-${sizeN}`, `${ba} ${ha} ${sw} ${inch}`, `Birangee Handle ${sizeN} inch`);
            add(`birangee-${sizeN}`, `${ha} ${ba} ${sw} ${inch}`, `Birangee Handle ${sizeN} inch`);
            add(`birangee-${sizeN}`, `${sw} ${inch} ${ba} ${ha}`, `Birangee Handle ${sizeN} inch`);
          }
          // no inch word
          add(`birangee-${sizeN}-noinch`, `${ba} ${ha} ${sw}`, `Birangee Handle ${sizeN} inch`);
          // fillers
          add(`birangee-${sizeN}-filler`, `${bf()}${ba} ${ha} ${sw} inch${af()}`, `Birangee Handle ${sizeN} inch`);
        }
        // No "handle" word
        for (const inch of ["inch", "inchi", ""]) {
          add(`birangee-${sizeN}-nohandle`, `${ba} ${sw} ${inch}`.trim(), `Birangee Handle ${sizeN} inch`);
        }
      }
      // All accents
      for (const acc of ACCENT_KEYS) {
        const fn = ACCENTS[acc];
        add(`birangee-${sizeN}-${acc}`, `${fn("birangi")} ${fn("handle")} ${sw} inch`, `Birangee Handle ${sizeN} inch`);
        add(`birangee-${sizeN}-${acc}`, `${fn("birangee")} ${sw} inch`, `Birangee Handle ${sizeN} inch`);
      }
      // Fast speech
      for (const ba of ["birangi", "birangee", "birangy"]) {
        add(`birangee-${sizeN}-fast`, `${ba}handle${sw}`, `Birangee Handle ${sizeN} inch`);
        add(`birangee-${sizeN}-fast`, `${ba}${sw}inch`, `Birangee Handle ${sizeN} inch`);
        add(`birangee-${sizeN}-fast`, merge([ba, "handle", sw, "inch"]), `Birangee Handle ${sizeN} inch`);
      }
      // Quantity first
      for (const q of ["do", "teen", "char", "paanch", "2", "3", "4"]) {
        add(`birangee-${sizeN}-qty`, `${q} birangi handle ${sw} inch`, `Birangee Handle ${sizeN} inch`);
      }
    }
  }

  // CORBY HANDLE
  for (const [sizeN, swords] of HANDLE_SIZES.filter(([n]) => n <= 4)) {
    for (const sw of swords) {
      for (const ca of CORBY_ALIASES) {
        for (const ha of HANDLE_ALIASES) {
          for (const inch of INCH) {
            add(`corby-${sizeN}`, `${ca} ${ha} ${sw} ${inch}`, `Corby Handle ${sizeN} inch`);
            add(`corby-${sizeN}`, `${ha} ${ca} ${sw} ${inch}`, `Corby Handle ${sizeN} inch`);
          }
          add(`corby-${sizeN}-noinch`, `${ca} ${ha} ${sw}`, `Corby Handle ${sizeN} inch`);
          add(`corby-${sizeN}-filler`, `${bf()}${ca} ${ha} ${sw} inch${af()}`, `Corby Handle ${sizeN} inch`);
        }
        // No handle word
        add(`corby-${sizeN}-nohandle`, `${ca} ${sw} inch`, `Corby Handle ${sizeN} inch`);
      }
      // All accents
      for (const acc of ACCENT_KEYS) {
        const fn = ACCENTS[acc];
        add(`corby-${sizeN}-${acc}`, `${fn("corby")} handle ${sw} inch`, `Corby Handle ${sizeN} inch`);
        add(`corby-${sizeN}-${acc}`, `${fn("korby")} ${sw} inch`, `Corby Handle ${sizeN} inch`);
      }
      // Fast speech
      for (const ca of ["corby", "korby", "corbi"]) {
        add(`corby-${sizeN}-fast`, `${ca}handle${sw}inch`, `Corby Handle ${sizeN} inch`);
        add(`corby-${sizeN}-fast`, merge([ca, sw, "inch"]), `Corby Handle ${sizeN} inch`);
      }
    }
  }
}

// ─── TROLLY CHANNEL ───────────────────────────────────────────────────────────
{
  const TROLLY_ALIASES = ["trolly", "trolley", "troley", "troli", "trole", "trulee",
    "trolli", "trawli", "throli", "trolly channel", "trolley channel"];
  const CHANNEL_ALIASES = ["channel", "chenal", "chanel", "chainal", "chainall", "chenell"];

  for (const [sizeN, swords] of [[20, numVars(20)] as [number, string[]], [24, numVars(24)] as [number, string[]]]) {
    for (const sw of swords) {
      for (const ta of TROLLY_ALIASES) {
        for (const cha of CHANNEL_ALIASES) {
          add(`trolly-${sizeN}`, `${ta} ${cha} ${sw}`, `Trolly Channel ${sizeN}`);
          add(`trolly-${sizeN}`, `${cha} ${ta} ${sw}`, `Trolly Channel ${sizeN}`);
          add(`trolly-${sizeN}`, `${sw} ${ta} ${cha}`, `Trolly Channel ${sizeN}`);
          add(`trolly-${sizeN}-filler`, `${bf()}${ta} ${cha} ${sw}${af()}`, `Trolly Channel ${sizeN}`);
        }
        // no "channel" word
        add(`trolly-${sizeN}-nocha`, `${ta} ${sw}`, `Trolly Channel ${sizeN}`);
      }
      // All accents
      for (const acc of ACCENT_KEYS) {
        const fn = ACCENTS[acc];
        add(`trolly-${sizeN}-${acc}`, `${fn("trolly")} channel ${sw}`, `Trolly Channel ${sizeN}`);
        add(`trolly-${sizeN}-${acc}`, `${fn("troley")} chenal ${sw}`, `Trolly Channel ${sizeN}`);
        add(`trolly-${sizeN}-${acc}-filler`, `${bf()}${fn("trolley")} channel ${sw}${af()}`, `Trolly Channel ${sizeN}`);
      }
      // Fast speech
      for (const ta of ["trolly", "trolley", "troli"]) {
        add(`trolly-${sizeN}-fast`, `${ta}channel${sw}`, `Trolly Channel ${sizeN}`);
        add(`trolly-${sizeN}-fast`, merge([ta, "chenal", String(sizeN)]), `Trolly Channel ${sizeN}`);
        add(`trolly-${sizeN}-fast`, `${ta}${sw}`, `Trolly Channel ${sizeN}`);
      }
      // Quantity
      for (const q of ["do", "teen", "char", "ek", "2", "3"]) {
        add(`trolly-${sizeN}-qty`, `${q} trolly channel ${sw}`, `Trolly Channel ${sizeN}`);
      }
      // STT garbles
      const garbles = [`trolee channel ${sw}`, `trolli chanel ${sw}`, `trawly channel ${sw}`,
        `troly chenel ${sw}`, `trolychannel${sw}`, `trolley shannel ${sw}`];
      for (const g of garbles) add(`trolly-${sizeN}-garble`, g, `Trolly Channel ${sizeN}`);
    }
  }
}

// ─── SCREWS ───────────────────────────────────────────────────────────────────
{
  const SCREW_ALIASES = ["screw", "pech", "petch", "skru", "iscrew", "pec", "scroo", "skrew"];

  const SCREW_SIZES: Array<[string, string[]]> = [
    ["1",   numVars(1)],
    ["1.5", fracVars("1.5")],
    ["2",   numVars(2)],
    ["2.5", fracVars("2.5")],
    ["3",   numVars(3)],
    ["4",   numVars(4)],
  ];

  for (const [sizeS, swords] of SCREW_SIZES) {
    for (const sw of swords) {
      for (const sa of SCREW_ALIASES) {
        for (const inch of INCH) {
          add(`screw-${sizeS}`, `${sa} ${sw} ${inch}`, `Screw ${sizeS} inch`);
          add(`screw-${sizeS}`, `${sw} ${inch} ${sa}`, `Screw ${sizeS} inch`);
          add(`screw-${sizeS}-filler`, `${bf()}${sa} ${sw} ${inch}${af()}`, `Screw ${sizeS} inch`);
        }
        add(`screw-${sizeS}-noinch`, `${sa} ${sw}`, `Screw ${sizeS} inch`);
      }
      // All accents
      for (const acc of ACCENT_KEYS) {
        const fn = ACCENTS[acc];
        add(`screw-${sizeS}-${acc}`, `${fn("pech")} ${sw} inch`, `Screw ${sizeS} inch`);
        add(`screw-${sizeS}-${acc}`, `${fn("screw")} ${sw} inch`, `Screw ${sizeS} inch`);
      }
      // fast speech
      for (const sa of ["screw", "pech", "petch"]) {
        add(`screw-${sizeS}-fast`, `${sa}${sw}inch`, `Screw ${sizeS} inch`);
        add(`screw-${sizeS}-fast`, merge([sa, sw, "inch"]), `Screw ${sizeS} inch`);
      }
      // Quantity
      for (const q of ["do", "char", "das", "2", "5", "10"]) {
        add(`screw-${sizeS}-qty`, `${q} screw ${sw} inch`, `Screw ${sizeS} inch`);
        add(`screw-${sizeS}-qty`, `${q} pech ${sw} inch`, `Screw ${sizeS} inch`);
      }
    }
  }
}

// ─── NAILS ────────────────────────────────────────────────────────────────────
{
  const NAIL_ALIASES = ["nail", "keel", "kil", "kiil", "neel", "neeel", "keel wala", "nale"];

  const NAIL_SIZES: Array<[number, string[]]> = [
    [1, numVars(1)],
    [2, numVars(2)],
    [3, numVars(3)],
    [4, numVars(4)],
  ];

  for (const [sizeN, swords] of NAIL_SIZES) {
    for (const sw of swords) {
      for (const na of NAIL_ALIASES) {
        for (const inch of INCH) {
          add(`nail-${sizeN}`, `${na} ${sw} ${inch}`, `Nail ${sizeN} inch`);
          add(`nail-${sizeN}`, `${sw} ${inch} ${na}`, `Nail ${sizeN} inch`);
          add(`nail-${sizeN}-filler`, `${bf()}${na} ${sw} ${inch}${af()}`, `Nail ${sizeN} inch`);
        }
        add(`nail-${sizeN}-noinch`, `${na} ${sw}`, `Nail ${sizeN} inch`);
      }
      // All accents
      for (const acc of ACCENT_KEYS) {
        const fn = ACCENTS[acc];
        add(`nail-${sizeN}-${acc}`, `${fn("keel")} ${sw} inch`, `Nail ${sizeN} inch`);
        add(`nail-${sizeN}-${acc}`, `${fn("nail")} ${sw} inch`, `Nail ${sizeN} inch`);
      }
      // fast speech
      for (const na of ["nail", "keel", "kil"]) {
        add(`nail-${sizeN}-fast`, `${na}${sw}inch`, `Nail ${sizeN} inch`);
      }
      // Quantity
      for (const q of ["do", "char", "das", "2", "10", "50"]) {
        add(`nail-${sizeN}-qty`, `${q} keel ${sw} inch`, `Nail ${sizeN} inch`);
        add(`nail-${sizeN}-qty`, `${q} nail ${sw} inch`, `Nail ${sizeN} inch`);
      }
    }
  }
}

// ─── FEVICOL ──────────────────────────────────────────────────────────────────
{
  const FEV_ALIASES = ["fevicol", "fewicol", "fevicoal", "fewikol", "fevikol",
    "phevicol", "fabikol", "feevicol", "fevicall", "feevikol",
    "fevicoll", "febicoal", "phibicol", "fewicall"];
  const SH_VARIANTS = ["sh", "s h", "esh", "es", ""];
  const FEV_SIZES: Array<[string, string[]]> = [
    ["1kg",  ["ek kg", "1 kg", "ek kilo", "1 kilo", "ek kilogram", "ekkg", "1kg"]],
    ["5kg",  ["paanch kg", "5 kg", "panch kilo", "5 kilo", "paanch kilogram", "5kg"]],
    ["20kg", ["bees kg", "20 kg", "bees kilo", "20 kilo", "20kg"]],
  ];

  for (const [sizeS, swords] of FEV_SIZES) {
    for (const sw of swords) {
      for (const fa of FEV_ALIASES) {
        for (const sh of SH_VARIANTS) {
          const core = sh ? `${fa} ${sh} ${sw}` : `${fa} ${sw}`;
          add(`fevicol-${sizeS}`, core, `Fevicol SH ${sizeS}`);
          add(`fevicol-${sizeS}-filler`, `${bf()}${core}${af()}`, `Fevicol SH ${sizeS}`);
          // size first
          add(`fevicol-${sizeS}-sizefirst`, `${sw} ${fa}`, `Fevicol SH ${sizeS}`);
        }
      }
      // All accents
      for (const acc of ACCENT_KEYS) {
        const fn = ACCENTS[acc];
        add(`fevicol-${sizeS}-${acc}`, `${fn("fevicol")} sh ${sw}`, `Fevicol SH ${sizeS}`);
        add(`fevicol-${sizeS}-${acc}`, `${fn("fewicol")} ${sw}`, `Fevicol SH ${sizeS}`);
      }
      // Fast speech
      for (const fa of ["fevicol", "fewicol", "fevicoal"]) {
        add(`fevicol-${sizeS}-fast`, merge([fa, "sh", sw.replace(/\s/g, "")]), `Fevicol SH ${sizeS}`);
        add(`fevicol-${sizeS}-fast`, merge([fa, sw.replace(/\s/g, "")]), `Fevicol SH ${sizeS}`);
      }
      // Quantity + item
      add(`fevicol-${sizeS}-qty-word`, `${sw} wala fevicol`, `Fevicol SH ${sizeS}`);
    }
  }
}

// ─── JALI SHEET PERFORATED ───────────────────────────────────────────────────
{
  const JALI_ALIASES = ["jali", "jaali", "jhaali", "jhali", "jali sheet", "mesh",
    "wire mesh", "perforated sheet", "jhaali sheet"];
  const PERF_ALIASES = ["perforated", "perporated", "parphorated", "perpherated",
    "perforaated", "perforetd", "perforatd", "porphorated",
    "perphured", "perforatedd"];

  for (const ja of JALI_ALIASES) {
    for (const pa of PERF_ALIASES) {
      add("jali", `${ja} ${pa}`, "Jali Sheet Perforated");
      add("jali", `${pa} ${ja}`, "Jali Sheet Perforated");
      add("jali-filler", `${bf()}${ja} ${pa}${af()}`, "Jali Sheet Perforated");
    }
    // Just "jali" with sheet
    add("jali-noperf", `${ja} sheet`, "Jali Sheet Perforated");
    add("jali-noperf", ja, "Jali Sheet Perforated");
  }
  // All accents
  for (const acc of ACCENT_KEYS) {
    const fn = ACCENTS[acc];
    add(`jali-${acc}`, `${fn("jaali")} sheet perforated`, "Jali Sheet Perforated");
    add(`jali-${acc}`, `${fn("jali")} perporated`, "Jali Sheet Perforated");
  }
  // Fast speech
  const jaliMerged = ["jalisheetperforated", "jaalisheetperporated", "jaliperforated",
    "jaaliperporated", "jhaaliperphorated"];
  for (const j of jaliMerged) add("jali-fast", j, "Jali Sheet Perforated");
  // STT garbles
  const jaliGarbles = ["jhally sheet", "jaley perforated", "charli sheet", "jali perforatid",
    "jaali sheet perporated", "jhali perpherated sheet"];
  for (const g of jaliGarbles) add("jali-garble", g, "Jali Sheet Perforated");
}

// ─── LATCH ────────────────────────────────────────────────────────────────────
{
  const LATCH_ALIASES = ["latch", "kundi", "khunda", "kunda", "lech", "laatch", "lach"];

  for (const [sizeN, swords] of [[3, numVars(3)] as [number, string[]], [4, numVars(4)] as [number, string[]]]) {
    for (const sw of swords) {
      for (const la of LATCH_ALIASES) {
        for (const inch of ["inch", "inchi", ""]) {
          add(`latch-${sizeN}`, `${la} ${sw} ${inch}`.trim(), `Latch ${sizeN} inch`);
          add(`latch-${sizeN}`, `${sw} ${inch} ${la}`.trim(), `Latch ${sizeN} inch`);
          add(`latch-${sizeN}-filler`, `${bf()}${la} ${sw} ${inch}${af()}`, `Latch ${sizeN} inch`);
        }
        add(`latch-${sizeN}-noinch`, `${la} ${sw}`, `Latch ${sizeN} inch`);
      }
      // All accents
      for (const acc of ACCENT_KEYS) {
        const fn = ACCENTS[acc];
        add(`latch-${sizeN}-${acc}`, `${fn("kundi")} ${sw} inch`, `Latch ${sizeN} inch`);
        add(`latch-${sizeN}-${acc}`, `${fn("latch")} ${sw} inch`, `Latch ${sizeN} inch`);
      }
    }
  }
}

// ─── CABINET LOCK SS ─────────────────────────────────────────────────────────
{
  const LOCK_ALIASES = ["lock", "tala", "talaa", "lok", "cabinet lock", "cabinet tala"];
  const SS_ALIASES = ["ss", "stainless", "steel", "stainles", "s s", "inox"];

  for (const la of LOCK_ALIASES) {
    for (const ss of SS_ALIASES) {
      add("cabinet-lock", `cabinet ${la} ${ss}`, "Cabinet Lock SS");
      add("cabinet-lock", `${la} ${ss} cabinet`, "Cabinet Lock SS");
      add("cabinet-lock", `${la} cabinet ${ss}`, "Cabinet Lock SS");
      add("cabinet-lock-filler", `${bf()}cabinet ${la} ${ss}${af()}`, "Cabinet Lock SS");
    }
    add("cabinet-lock-noss", `cabinet ${la}`, "Cabinet Lock SS");
  }
  // Accents
  for (const acc of ACCENT_KEYS) {
    const fn = ACCENTS[acc];
    add(`cabinet-lock-${acc}`, `${fn("cabinet")} ${fn("tala")} ss`, "Cabinet Lock SS");
    add(`cabinet-lock-${acc}`, `${fn("lock")} ss ${fn("cabinet")}`, "Cabinet Lock SS");
  }
}

// ─── SANDPAPER ────────────────────────────────────────────────────────────────
{
  const SAND_ALIASES = ["sandpaper", "sand paper", "sandpepar", "reti", "sand", "reeti",
    "retee", "sandpapper", "sand paper sheet", "abrasive paper"];
  const GRIT_SIZES: Array<[number, string[]]> = [
    [80,  ["80", "assi", "eighty"]],
    [120, ["120", "ek sau bees", "120 grit"]],
    [180, ["180", "ek sau assi", "180 grit"]],
    [240, ["240", "do sau chalis", "240 grit"]],
  ];

  for (const [grit, gwords] of GRIT_SIZES) {
    for (const gw of gwords) {
      for (const sa of SAND_ALIASES) {
        add(`sand-${grit}`, `${sa} ${gw}`, `Sandpaper ${grit} grit`);
        add(`sand-${grit}`, `${sa} ${gw} grit`, `Sandpaper ${grit} grit`);
        add(`sand-${grit}`, `${gw} ${sa}`, `Sandpaper ${grit} grit`);
        add(`sand-${grit}-filler`, `${bf()}${sa} ${gw}${af()}`, `Sandpaper ${grit} grit`);
      }
      // Accents
      for (const acc of ACCENT_KEYS) {
        const fn = ACCENTS[acc];
        add(`sand-${grit}-${acc}`, `${fn("reti")} ${gw}`, `Sandpaper ${grit} grit`);
        add(`sand-${grit}-${acc}`, `${fn("sandpaper")} ${gw}`, `Sandpaper ${grit} grit`);
      }
      // fast
      add(`sand-${grit}-fast`, `sandpaper${gw}`, `Sandpaper ${grit} grit`);
      add(`sand-${grit}-fast`, `reti${gw}`, `Sandpaper ${grit} grit`);
    }
  }
}

// ─── WASHER / NUT / BOLT ──────────────────────────────────────────────────────
{
  const PARTS: Array<[string, string[], string[]]> = [
    ["Washer", ["washer", "vosar", "washar", "vasha", "vasar"], ["M4", "M6", "M8", "M10"]],
    ["Nut",    ["nut", "nat", "naath", "natt"],                 ["M4", "M6", "M8", "M10"]],
    ["Bolt",   ["bolt", "bolta", "bolat", "bultt"],             ["M4", "M6", "M8", "M10"]],
  ];

  for (const [pname, paliases, sizes] of PARTS) {
    for (const size of sizes) {
      for (const pa of paliases) {
        add(`${pname.toLowerCase()}-${size}`, `${pa} ${size}`, `${pname} ${size}`);
        add(`${pname.toLowerCase()}-${size}`, `${pa} ${size.toLowerCase()}`, `${pname} ${size}`);
        add(`${pname.toLowerCase()}-${size}`, `${size} ${pa}`, `${pname} ${size}`);
        add(`${pname.toLowerCase()}-${size}-filler`, `${bf()}${pa} ${size}${af()}`, `${pname} ${size}`);
        // spoken as separate letters: M6 → "em six" / "em chhe"
        const numPart = size.replace("M", "");
        add(`${pname.toLowerCase()}-${size}-spelled`, `${pa} em ${numPart}`, `${pname} ${size}`);
        add(`${pname.toLowerCase()}-${size}-spelled`, `${pa} em ${numVars(Number(numPart))[0]}`, `${pname} ${size}`);
      }
      // Accents
      for (const acc of ACCENT_KEYS) {
        const fn = ACCENTS[acc];
        add(`${pname.toLowerCase()}-${size}-${acc}`, `${fn(paliases[0])} ${size}`, `${pname} ${size}`);
      }
    }
  }
}

// ─── DRAWER SLIDE ─────────────────────────────────────────────────────────────
{
  const SLIDE_ALIASES = ["drawer slide", "drawer slider", "dravar slide", "draver slaid",
    "drawer channel", "drawer rail", "drevar slide", "dravaar slaid"];

  const SLIDE_SIZES: Array<[number, string[]]> = [
    [18, numVars(18)],
    [24, numVars(24)],
  ];

  for (const [sizeN, swords] of SLIDE_SIZES) {
    for (const sw of swords) {
      for (const sa of SLIDE_ALIASES) {
        for (const inch of ["inch", "inchi", ""]) {
          add(`drawer-${sizeN}`, `${sa} ${sw} ${inch}`.trim(), `Drawer Slide ${sizeN} inch`);
          add(`drawer-${sizeN}-filler`, `${bf()}${sa} ${sw} ${inch}${af()}`, `Drawer Slide ${sizeN} inch`);
        }
      }
      // "dravar" abbreviation
      for (const da of ["dravar", "draver", "drawer"]) {
        for (const sl of ["slide", "slaid", "channel"]) {
          add(`drawer-${sizeN}-short`, `${da} ${sl} ${sw} inch`, `Drawer Slide ${sizeN} inch`);
        }
      }
      // All accents
      for (const acc of ACCENT_KEYS) {
        const fn = ACCENTS[acc];
        add(`drawer-${sizeN}-${acc}`, `${fn("drawer")} slide ${sw} inch`, `Drawer Slide ${sizeN} inch`);
      }
      // fast
      add(`drawer-${sizeN}-fast`, `drawerslide${sw}inch`, `Drawer Slide ${sizeN} inch`);
      add(`drawer-${sizeN}-fast`, `dravarslaad${sw}`, `Drawer Slide ${sizeN} inch`);
    }
  }
}

// ─── HAMMER / HAMMER TYPES ───────────────────────────────────────────────────
{
  const HAMMER_ALIASES = ["hammer", "hathoda", "hatoda", "hathaura", "hammar", "hamar",
    "hatodaa", "hathauri", "hathori"];
  const TYPES = ["Claw Hammer", "Mallet", "Rubber Mallet", "Ball Peen Hammer"];

  for (const ha of HAMMER_ALIASES) {
    for (const t of TYPES) {
      add(`hammer-${t.replace(/\s/g, "-").toLowerCase()}`, `${ha} ${t.toLowerCase()}`, t);
      add(`hammer-filler`, `${bf()}${ha}${af()}`, "Claw Hammer");
    }
    // Generic hammer
    add("hammer-generic", ha, "Claw Hammer");
    add("hammer-generic-filler", `${bf()}${ha}${af()}`, "Claw Hammer");
    // Accents
    for (const acc of ACCENT_KEYS) {
      const fn = ACCENTS[acc];
      add(`hammer-${acc}`, `${fn("hathoda")}`, "Claw Hammer");
    }
  }
}

// ─── MAGNETIC CATCH ───────────────────────────────────────────────────────────
{
  const MAG_ALIASES = ["magnet catch", "magnetic catch", "magnit kap", "magnit cap",
    "meganet catch", "magnet kap", "magnetic kap", "magnetic cup",
    "mag catch", "mag cap"];

  for (const ma of MAG_ALIASES) {
    add("magnet-catch", ma, "Magnet Catch");
    add("magnet-catch-filler", `${bf()}${ma}${af()}`, "Magnet Catch");
  }
  // Accents
  for (const acc of ACCENT_KEYS) {
    const fn = ACCENTS[acc];
    add(`magnet-catch-${acc}`, `${fn("magnet")} catch`, "Magnet Catch");
    add(`magnet-catch-${acc}`, `${fn("magnit")} kap`, "Magnet Catch");
  }
}

// ─── EXTREMELY FAST / MERGED SPEECH (all products) ───────────────────────────
const ALL_FAST = [
  ["autohings", "Door Hinges Auto"],
  ["autohinge", "Door Hinges Auto"],
  ["autohinges", "Door Hinges Auto"],
  ["autohingesdoor", "Door Hinges Auto"],
  ["kabzaauto", "Door Hinges Auto"],
  ["hingssauto", "Door Hinges Auto"],
  ["birangihandlechaar", "Birangee Handle 4 inch"],
  ["birangihandle4inch", "Birangee Handle 4 inch"],
  ["birangee4inch", "Birangee Handle 4 inch"],
  ["birangihandleteen", "Birangee Handle 3 inch"],
  ["birangihandle3", "Birangee Handle 3 inch"],
  ["birangee3inch", "Birangee Handle 3 inch"],
  ["korbyhandleteen", "Corby Handle 3 inch"],
  ["korbyhandleteeniinch", "Corby Handle 3 inch"],
  ["corbyhandlechaar", "Corby Handle 4 inch"],
  ["trollychannel20", "Trolly Channel 20"],
  ["trollychannel24", "Trolly Channel 24"],
  ["trolleychannelbees", "Trolly Channel 20"],
  ["trolleychannelchauvis", "Trolly Channel 24"],
  ["fevicolekkg", "Fevicol SH 1kg"],
  ["fevicolsh1kg", "Fevicol SH 1kg"],
  ["fevicolpaanchkg", "Fevicol SH 5kg"],
  ["fevicolsh5kg", "Fevicol SH 5kg"],
  ["pekhdo", "Screw 2 inch"],
  ["pechdoinch", "Screw 2 inch"],
  ["screw2inch", "Screw 2 inch"],
  ["pechdedhinch", "Screw 1.5 inch"],
  ["screwdedhinch", "Screw 1.5 inch"],
  ["keeldoinch", "Nail 2 inch"],
  ["nail2inch", "Nail 2 inch"],
  ["jalisheetperforated", "Jali Sheet Perforated"],
  ["jaaliperforted", "Jali Sheet Perforated"],
  ["sandpaper80", "Sandpaper 80 grit"],
  ["retiaassi", "Sandpaper 80 grit"],
  ["hingssateen", "Hinge SS 3 inch"],
  ["hingssachaar", "Hinge SS 4 inch"],
  ["kabzaateen", "Hinge SS 3 inch"],
  ["kabzaachaar", "Hinge SS 4 inch"],
];
for (const [say, exp] of ALL_FAST) add("all-fast", say as string, exp as string);

// ─── MIXED QUANTITY + PRODUCT ─────────────────────────────────────────────────
const QTY_MIX = [
  ["do birangi handle chaar inch", "Birangee Handle 4 inch"],
  ["teen corby handle teen inch", "Corby Handle 3 inch"],
  ["char pech do inch", "Screw 2 inch"],
  ["das keel do inch", "Nail 2 inch"],
  ["ek auto hings", "Door Hinges Auto"],
  ["do trolly channel bees", "Trolly Channel 20"],
  ["paanch kilo fevicol sh", "Fevicol SH 5kg"],
  ["ek kilo fevicol", "Fevicol SH 1kg"],
  ["char sandpaper 80 grit", "Sandpaper 80 grit"],
  ["ek jali sheet perforated", "Jali Sheet Perforated"],
  ["do washer m6", "Washer M6"],
  ["char nut m6", "Nut M6"],
  ["teen bolt m6", "Bolt M6"],
  ["do drawer slide 18 inch", "Drawer Slide 18 inch"],
  ["ek hinge ss chaar inch", "Hinge SS 4 inch"],
  ["do kabja ss teen inch", "Hinge SS 3 inch"],
  ["paanch birangi 4 inch handle", "Birangee Handle 4 inch"],
  ["das pech dedh inch", "Screw 1.5 inch"],
  ["bees keel 2 inch", "Nail 2 inch"],
  ["teen trolly channel 24", "Trolly Channel 24"],
];
for (const [say, exp] of QTY_MIX) add("qty-mix", say as string, exp as string);

// ─── VERY LONG FILLER SENTENCES ───────────────────────────────────────────────
const LONG_FILLERS = [
  ["bhaiya theek hai ab sun mujhe ek auto hings chahiye door ke liye", "Door Hinges Auto"],
  ["yeh wala jo h n birangi handle chaar inch wala hai kya", "Birangee Handle 4 inch"],
  ["sun yaar trolly channel bees number ka ek packet chahiye", "Trolly Channel 20"],
  ["mujhe fevicol sh ek kilo chahiye abhi jaldi dena", "Fevicol SH 1kg"],
  ["okay toh mujhe jali sheet perforated chahiye ek piece", "Jali Sheet Perforated"],
  ["bhaiya yeh jo screw do inch wala hai woh teen piece dena", "Screw 2 inch"],
  ["ek do teen corby handle teen inch chahiye bhai", "Corby Handle 3 inch"],
  ["haan theek hai ab birangi handle teen inch ke do piece chahiye", "Birangee Handle 3 inch"],
  ["sandpaper 80 grit ka ek packet chahiye na", "Sandpaper 80 grit"],
  ["kabza ss chaar inch wala ek piece chahiye", "Hinge SS 4 inch"],
  ["toh mujhe kundi 4 inch wali chahiye na", "Latch 4 inch"],
  ["sun na washer m 6 ka ek packet chahiye", "Washer M6"],
];
for (const [say, exp] of LONG_FILLERS) add("long-filler", say as string, exp as string);

// ─── REGIONAL EXTREME ACCENTS ────────────────────────────────────────────────
const REGIONAL = [
  // Bhojpuri
  ["auto hings door ke liye chahida ba", "Door Hinges Auto"],
  ["birangi handle chaar inch ke rakhaa", "Birangee Handle 4 inch"],
  ["trolly channel bees ke deb", "Trolly Channel 20"],
  // Haryanvi
  ["auto hings chahidaa yaar", "Door Hinges Auto"],
  ["birangi handle chaar inch chahidaa", "Birangee Handle 4 inch"],
  ["fevicol ek kilo chahidaa", "Fevicol SH 1kg"],
  // South Indian strong accent
  ["auto hingsu dooru", "Door Hinges Auto"],
  ["birangeeu handleu fourinchu", "Birangee Handle 4 inch"],
  ["trolly channelu twentyu", "Trolly Channel 20"],
  ["fevicollu onekilou", "Fevicol SH 1kg"],
  // Bengali
  ["auto hings dorrer jonno", "Door Hinges Auto"],
  ["birangi handle char inch", "Birangee Handle 4 inch"],
  ["feebicol ek kilo", "Fevicol SH 1kg"],
  // Rajasthani
  ["auto hings kai dede", "Door Hinges Auto"],
  ["birangi handle chaar inch dede", "Birangee Handle 4 inch"],
  // Gujarati
  ["auto hings joiye che", "Door Hinges Auto"],
  ["birangi handle chaar inch joiye", "Birangee Handle 4 inch"],
  ["fevicol sh ek kilo joiye", "Fevicol SH 1kg"],
  // Marathi
  ["auto hings pahije", "Door Hinges Auto"],
  ["birangi handle chaar inch pahije", "Birangee Handle 4 inch"],
  ["trolly channel bees pahije", "Trolly Channel 20"],
];
for (const [say, exp] of REGIONAL) add("regional", say as string, exp as string);

// ─── NUMBER DISAMBIGUATION STRESS TESTS ──────────────────────────────────────
// Make sure numbers don't get confused
const NUM_DISAMBIG = [
  // "aath chaar" in handle context = size 4, NOT 8×4 ply
  ["birangi handle aath chaar inch", "Birangee Handle 4 inch"],  // aath chaar could be 8+4 but handle context → 4 inch
  ["corby handle teen inch", "Corby Handle 3 inch"],
  ["hinge ss chaar inch", "Hinge SS 4 inch"],
  ["hinge ss teen inch", "Hinge SS 3 inch"],
  ["screw dedh inch", "Screw 1.5 inch"],
  ["screw dhai inch", "Screw 2.5 inch"],
  ["latch chaar inch", "Latch 4 inch"],
  ["kundi teen inch", "Latch 3 inch"],
  ["drawer slide atharah inch", "Drawer Slide 18 inch"],
  ["drawer slide chauvis inch", "Drawer Slide 24 inch"],
  ["trolly channel bees", "Trolly Channel 20"],
  ["trolly channel chauvis", "Trolly Channel 24"],
  ["fevicol ek kilo", "Fevicol SH 1kg"],
  ["fevicol paanch kilo", "Fevicol SH 5kg"],
  ["fevicol bees kilo", "Fevicol SH 20kg"],
  ["sandpaper assi", "Sandpaper 80 grit"],
  ["reti 120", "Sandpaper 120 grit"],
  ["nail ek inch", "Nail 1 inch"],
  ["screw ek inch", "Screw 1 inch"],
];
for (const [say, exp] of NUM_DISAMBIG) add("num-disambig", say as string, exp as string);

// ─── PRINT SUMMARY ────────────────────────────────────────────────────────────
console.log(`Generated ${tests.length} test cases`);

// Output as JSON for the runner
import { writeFileSync } from "fs";
writeFileSync("/tmp/hw_tests.json", JSON.stringify(tests, null, 2));
console.log("Written to /tmp/hw_tests.json");
