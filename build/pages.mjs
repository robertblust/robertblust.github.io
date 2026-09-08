// Renders `model.json` into every region of this site derived from the model — `npm run pages`
// and `npm run pages:check`.
//
// Node built-ins only, and no network. That is the property worth keeping: the parser is a
// dependency and is not on disk until `npm ci` has run, so a check that needed it could not run
// in the cheap half of CI. Everything here is a pure function of one committed file.
//
// The pin guard is what used to be a sentence in AGENTS.md saying which command to run first.
// An artifact that declares its own commit cannot be rendered stale, so the order of `npm run
// model` and `npm run pages` is now enforced by the data rather than remembered by a person.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeBlock } from "./block.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const { repo, commit } = JSON.parse(fs.readFileSync(path.join(ROOT, "source.json"), "utf8"));
const ARTIFACT = path.join(ROOT, "model.json");

if (!fs.existsSync(ARTIFACT)) {
  console.error("  ✗ model.json is missing — run: npm run model");
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(ARTIFACT, "utf8"));
if (data.commit !== commit) {
  console.error(`  ✗ model.json is at ${data.commit.slice(0, 7)}, source.json pins ${commit.slice(0, 7)} — run: npm run model`);
  process.exit(1);
}

const check = process.argv.includes("--check");
const RENDERERS = [writeBlock];

const stale = RENDERERS.flatMap((write) => write(data, { check }));

if (check) {
  if (stale.length) {
    console.error(`  ✗ ${stale.join(", ")} no longer match model.json — run: npm run pages`);
    process.exit(1);
  }
  console.log(`  ✓ every derived region matches model.json at ${repo}@${commit.slice(0, 7)}`);
} else {
  console.log(`  wrote every derived region from model.json at ${repo}@${commit.slice(0, 7)}`);
}
