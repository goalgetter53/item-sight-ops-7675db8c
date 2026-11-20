import { findTopMatches, preprocess } from "./src/lib/hinglish-match";
const rawNames = [
  "Door Hinges Auto","Claw Hammer","Ball Peen Hammer","Mallet","Rubber Mallet"
];
const leaves = rawNames.map(n => ({path:[{id:n,name:n}],fullName:n,category:"HARDWARE" as const}));
const qs = ["hathodaa","haathodaa","hathori","hatodaa"];
for (const q of qs) {
  console.log(`pp("${q}") = "${preprocess(q)}"`);
  const r = findTopMatches(q, leaves, 3);
  r.forEach(x => console.log(`  ${x.fullName} → ${(x.score*100).toFixed(2)}%`));
}
