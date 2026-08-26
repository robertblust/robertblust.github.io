# SEO — the head contract

*2026-08-25. Applies to `blust.ch`; written to be copied to `guestgraph.io` and
`companygraph.io`, which have the same problem for the same reason.*

## The problem, measured

Not "we should do SEO". Four specific things are wrong, and each was found by fetching
the live site, not by reading the markup:

1. **`https://blust.ch/logo.svg` is a 404**, and `privacy/`'s structured data names it as
   the publisher's logo. The two sibling sites have that file; this one never did.
2. **The same block references `https://blust.ch/#website`, a node that exists nowhere.**
   `isPartOf` points at nothing, so the page declares a parent it cannot produce.
3. **`/ideas/` advertises the landing page's share card.** There is no `ideas/og.png`; the
   tag points at `https://blust.ch/og.png`. A shared link to the ideas page previews a
   different page — the exact failure `og-recipe.mjs` exists to prevent, on the one page
   the recipe forgot.
4. **`/ideas/` is missing `og:site_name`, `og:image:alt` and `og:locale`**, which the other
   five pages all carry. Nothing said so.

And the structural finding behind all four: **there is no check.** `card` asserts that
`og:image` resolves and that its declared dimensions match the PNG. Nothing asserts a
canonical exists, that it agrees with `og:url`, that a description is present, or that
structured data parses and resolves. So the head drifts page by page and the suite stays
green. On `companygraph.io` this already cost the landing page its entire head during an
unrelated rework — canonical, description, `og:site_name`, everything — and no check
noticed.

## What "good Google support" means here

Google reads four things off these pages. The contract is that every page carries all
four, and that a check fails when one goes missing.

**1. A canonical URL.** Absolute, and byte-identical to `og:url`. These sites are reachable
as `blust.ch/talks` and `blust.ch/talks/`; the canonical is what collapses the variants
onto one. A *relative* canonical is legal and resolves correctly, but it cannot be compared
against `og:url` by a check, and `guestgraph.io/talks/` currently ships `href="./"`.

**2. A title and a description.** Present, and inside the lengths Google will render — 65
and 200 characters. `title` is already asserted for length; `description` was not asserted
at all.

**3. Structured data that resolves.** Every `@id` a page references must be a node that
page also carries — Google resolves `@graph` within a document, so a cross-page reference
is a dangling pointer. Every URL inside it must be fetchable. The types, chosen for what
they actually earn:

- `Person` for `blust.ch` — this is a person's site, and `Organization` with a logo was
  both wrong and the reason for the 404. A person has no logo to fail to serve.
- `WebSite` on the root, so `isPartOf` has a target.
- `WebPage` per page.
- `BreadcrumbList` on every nested page. This is the one type here that earns a visible
  Google result — the path shown above a search hit instead of a bare URL.

**4. A share card that shows the page being shared.** Every page in `og-recipe.mjs`, no
page borrowing another's card.

Open Graph is the second audience and needs no argument: `og:site_name`, `og:locale`,
`og:image:alt`, `twitter:card`. The rule is uniformity — six pages, one shape.

## Non-goals, and why

**`hreflang` is not applicable, and adding it would be wrong.** These pages are bilingual
through `data-de` attributes swapped in by `applyLang()` at runtime. There is exactly one
URL per page. `rel="alternate" hreflang="de"` tells Google *"the German version is at this
other address"* — and there is no other address. Pointing it at the same URL is at best
inert and at worst an invitation to treat one page as two. What is correct for this
architecture is `og:locale` plus `og:locale:alternate`, which describe one document that
carries two languages. That is what this spec adds.

This becomes a real gap the day the sites serve `/de/` URLs. Not before.

**No `VideoObject` on the talk pages.** There is no video. The decks are HTML with
synthesized narration clips. Marking them up as video would be structured data that
contradicts the page, which is what Google issues manual actions for. The talks get
`WebPage` and a breadcrumb, like everything else.

**Multiple `<h1>` in the decks stays.** `mental-model` has ten, one per slide; that is what
a slide is. Google has not treated multiple `h1` as a fault for years, and collapsing them
would break the decks to satisfy a rule that no longer exists.

**No keyword pages.** "Five strangers. One guest." is not a query anyone types, and that is
a content decision, not a metadata one. Meta tags cannot fix a page's thinness and this
spec does not pretend to.

## The check is the deliverable

`verify/check.mjs` gains a `seo` check, run on every page:

- canonical present, absolute, equal to `og:url`
- `description` present and ≤ 200 characters
- `og:site_name`, `og:locale`, `og:image:alt`, `twitter:card` present
- every `application/ld+json` block parses
- every `@id` referenced by the graph is defined within the same graph
- every absolute URL inside the graph resolves (fetched, not assumed)

Written the way the rest of the suite is: it inspects the rendered DOM, and it fetches
what the markup claims. Both live 404s above would have failed it on the day they landed.
