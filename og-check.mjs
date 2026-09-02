// Does each share card still show the page it was rendered from?
//
// Usage: npm run og:check
//
// It renders nothing and imports nothing outside node's standard library and the package, so
// CI can run it before `npx playwright install` — a stale card is then caught by one of the
// cheapest steps in the job rather than by whoever notices the preview. It does have to run
// after `npm ci` now: the check itself lives in `@robertblust/design/cards/check`, which is
// not on disk until then.
//
// It over-reports and never under-reports, deliberately. Editing a comment in a page marks its
// card stale even though the render would be identical. Clearing that is `npm run og` and a
// commit — cheap, and the opposite error is a card nobody notices for days.
import { checkCards } from "@robertblust/design/cards/check";
import * as recipe from "./og-recipe.mjs";

if (checkCards(recipe)) process.exit(1);
