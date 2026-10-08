// Renders `model.json` into every region of this site derived from the model — `npm run pages`
// and `npm run pages:check`.
//
// No network, and no parser: everything here is a pure function of one committed file. The
// Principles, Processes and Surfaces renderers come from @robertblust/design, which the other sites
// that draw a model share, so this runs after `npm ci` has put the package on disk.
//
// The pin guard is what used to be a sentence in AGENTS.md saying which command to run first.
// An artifact that declares its own commit cannot be rendered stale, so the order of `npm run
// model` and `npm run pages` is now enforced by the data rather than remembered by a person.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writePrinciples } from "@robertblust/design/render/principles";
import { writeProcesses } from "@robertblust/design/render/processes";
import { processDiagram } from "companygraph-mcp-server/diagram";
import { writeSurfaces } from "@robertblust/design/render/surfaces";
import { writePrivacy } from "@robertblust/design/render/privacy";
import { writeHome } from "@robertblust/design/render/home";
import { writeIdPages } from "@robertblust/design/render/ids";
import { writeJsonLd } from "./jsonld.mjs";
import { loadGerman } from "@robertblust/design/render/german";
import { writeQuestionsDe } from "@robertblust/design/render/questions";
import { writeLatest } from "./latest.mjs";

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
const german = loadGerman(path.join(ROOT, "build", "principles.de.json"));
// The model's question titles in German, which the chat offers on a German page: made by the
// German pipeline in build/questions.de.json, held to the exact English as the principles are,
// and written to the questions.de.json the chat's tag names.
const questionsGerman = loadGerman(path.join(ROOT, "build", "questions.de.json"));
// The German of the privacy page's lineage, held to the model's exact English: the stored items'
// taglines, the activities' names and what each processor receives. Made by the roles from
// `npx design german privacy model.json`.
const privacyGerman = loadGerman(path.join(ROOT, "build", "privacy.de.json"));
// The order the boards argue in: the work first, then how a stranger is answered. Core gives a
// process no rank, so the site names the order, and the renderer refuses the build if a name
// leaves the model.
const RENDERERS = [
  (d, o) => writePrinciples(d, { ...o, de: german.de }),
  // Each board shows its process as the chat draws it, from the same drawer, over the
  // artifact at the commit source.json pins, so the picture moves only when the pin does.
  (d, o) => writeProcesses(d, { ...o, order: ["Deciding", "Delivery", "Answering", "Narrating"], diagram: (data, p) => processDiagram(data, p.id) }),
  writeSurfaces,
  (d, o) => writePrivacy(d, { ...o, site: "blust.ch", de: privacyGerman.de }),
  (d, o) => writeHome(d, { ...o, de: german.de, heading: { en: "{n} values, each with the thing <em>I never do</em>.", de: "{n} Werte – und zu jedem, <em>was ich nie tue</em>." } }),
  writeLatest,
  (d, o) => writeQuestionsDe(d, { ...o, de: questionsGerman.de }),
  writeJsonLd,
  // One redirect page per entity with a stable id, at the address build/jsonld.mjs gives the
  // person as its @id, sending the reader on to the entity's place on /model/'s stage.
  (d, o) => writeIdPages(d, { ...o, origin: "https://blust.ch", stage: "/model/" }),
];

const stale = RENDERERS.flatMap((write) => write(data, { check, root: ROOT }));

const unused = german.unused();
if (unused.length) {
  console.error(`  ✗ build/principles.de.json holds German for English the model no longer says:\n${unused.map((en) => `    "${en}"`).join("\n")}`);
  process.exit(1);
}
const unusedPrivacy = privacyGerman.unused();
if (unusedPrivacy.length) {
  console.error(`  ✗ build/privacy.de.json holds German for English the model no longer says:\n${unusedPrivacy.map((en) => `    "${en}"`).join("\n")}`);
  process.exit(1);
}
const unusedQuestions = questionsGerman.unused();
if (unusedQuestions.length) {
  console.error(`  ✗ build/questions.de.json holds German for a question the model no longer asks:\n${unusedQuestions.map((en) => `    "${en}"`).join("\n")}`);
  process.exit(1);
}

if (check) {
  if (stale.length) {
    console.error(`  ✗ ${stale.join(", ")} no longer match model.json — run: npm run pages`);
    process.exit(1);
  }
  console.log(`  ✓ every derived region matches model.json at ${repo}@${commit.slice(0, 7)}`);
} else {
  console.log(`  wrote every derived region from model.json at ${repo}@${commit.slice(0, 7)}`);
}
