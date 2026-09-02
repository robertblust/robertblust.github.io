// Render the 1200×630 share cards that link previews use (og:image).
//
// A deck's card is its own title slide and an index card is the page itself, so a preview
// shows what the visitor is about to land on rather than a banner kept in step by hand.
//
// Usage: npm run og
//
// What each card is made of — which pages, which frame, which hide rules — lives in
// `og-recipe.mjs`, because `npm run og:check` has to agree with this file about it exactly.
// A knob kept here as well would be a knob that can be edited without the check noticing.
// The rendering itself is `@robertblust/design/cards/export`, shared with the two sibling
// sites; the package never imports Playwright, so the browser is handed in from here.
import { chromium } from "playwright";
import { exportCards } from "@robertblust/design/cards/export";
import * as recipe from "./og-recipe.mjs";

await exportCards({ chromium, recipe });
