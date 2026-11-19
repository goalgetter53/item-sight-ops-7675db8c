import { findTopMatches, preprocess } from "./src/lib/hinglish-match";
const leaves = ["18mm Applewood Ultra 7x4","18mm Applewood Ultra 8x4"].map(n=>({path:[{id:n,name:n}],fullName:n}));
const queries = ["18 applewood ultra 7 4","18 applewood ultra 8 4","aatchaar applewood ultra 18","18mm applewood ultra 7 4"];
for (const q of queries) {
  const r = findTopMatches(q, leaves, 2);
  console.log(`Query: "${q}" (preprocessed: "${preprocess(q)}")`);
  r.forEach(x => console.log(`  ${x.fullName} → ${(x.score*100).toFixed(2)}%`));
}
