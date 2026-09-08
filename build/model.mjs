// Writes the pinned model into `model.json`, or checks that the file there is still what that
// commit parses to — `npm run model` and `npm run model:check`.
//
// This is the only part of the build that needs both GitHub and the parser, and that pairing is
// what fixes its place in CI below `npm ci`: the parser is a dependency and is not on disk until
// then. Reaching the network is not the rare half — `pin-check.mjs` reaches GitHub too.
// Everything else on this site is rendered from the file this writes, which is why the pages can
// be checked before `npm ci` has run and without GitHub being reachable.
//
// Pretty-printed because the file is committed and the point of committing it is review: a
// re-pin then shows which experience gained a field and which tagline was reworded, rather than
// one changed line of 300KB. The pages inline it minified, so their bytes do not move.
//
// The parser comes from `companygraph-meta-model`, pinned by tag. It implements the
// CompanyGraph conventions and lives in the repository that defines them, so a rule and its
// implementation cannot drift apart unseen. If the model gains a type or a section shape, the
// fix belongs there and arrives here as a version bump.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseInstance } from "companygraph-meta-model/instance";
import { readInstance } from "./read.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const { repo, commit } = JSON.parse(fs.readFileSync(path.join(ROOT, "source.json"), "utf8"));
const OUT = path.join(ROOT, "model.json");

// R13: an instance's content lives in one container, and `model/` is it. Everything outside —
// `meta/`, `.companygraph/`, the READMEs at the root — is machinery, not the company.
const SUB = "model/";

const files = await readInstance({ repo, commit, sub: SUB });
// `repo` travels with the data because the stage draws more than one repository's model and the
// file link has to point at the right one. `sub` is where these files sit in the model's own
// repository, and the parser needs it: an entity's `path` is what a page turns into a link to
// the file on GitHub.
const data = { ...parseInstance(files, { sub: SUB }), commit, repo };
const text = JSON.stringify(data, null, 2) + "\n";

if (process.argv.includes("--check")) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  if (current !== text) {
    console.log(`  ✗ model.json is not what ${repo}@${commit.slice(0, 7)} parses to — run: npm run model`);
    process.exit(1);
  }
  console.log(`  ✓ model.json is ${repo}@${commit.slice(0, 7)}: ${data.entities.length} entities, ${data.edges.length} edges`);
} else {
  fs.writeFileSync(OUT, text);
  console.log(`  wrote model.json: ${data.entities.length} entities, ${data.edges.length} edges from ${repo}@${commit.slice(0, 7)}`);
}
