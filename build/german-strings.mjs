// Prints `strings(model.json)` as a JSON array to stdout — the translator's input for
// `build/principles.de.json` — `npm run german:strings`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { strings } from "./german.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "model.json"), "utf8"));
console.log(JSON.stringify(strings(data), null, 2));
