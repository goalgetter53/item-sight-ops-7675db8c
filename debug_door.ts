import { preprocess } from "./src/lib/hinglish-match";
const items = ["Door Hinges Auto","Claw Hammer","Ball Peen Hammer","Mallet","Rubber Mallet"];
for (const item of items) {
  console.log(`pp("${item}") = "${preprocess(item)}"`);
}
// Also check the actual jaro
console.log("---");
console.log(`pp("hathodaa") = "${preprocess("hathodaa")}"`);
