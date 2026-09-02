// What the share-card staleness check has to get right.
//
// Run: npm run test:og   (node --test, no dependencies beyond the package)
//
// The check's whole value is that it over-reports and never under-reports: a card whose page
// has moved must come out stale, and the failure it exists to catch — a card reported current
// after the page changed — must be impossible. The suite is `@robertblust/design/cards/
// recipe-tests`, shared with the two sibling sites: it drives both directions against real
// files in a temporary tree, and then checks this repository's own cards against this
// repository's own og.png files.
import { checkRecipe } from "@robertblust/design/cards/recipe-tests";
import * as recipe from "../og-recipe.mjs";

checkRecipe(recipe);
