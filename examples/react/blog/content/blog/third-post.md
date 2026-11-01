---
title: 'Midnight Compass Build'
description: 'Where to customize theme and typography.'
pubDate: 'Jul 22 2024'
heroImage: '/images/lagoon-2.svg'
---

Update CSS variables in `src/styles.css` to fit your brand.

Then adjust header and footer links to match your product.

## Theme alignment checklist

Before adding one-off colors, audit these variables:

- `--sea-ink` and `--sea-ink-soft` for readable body copy
- `--surface` and `--surface-strong` for cards and shells
- `--lagoon` / `--lagoon-deep` for links and active UI affordances

If those are correct, most components will look coherent with zero extra work.

### Accessibility reminder

Check contrast on at least three surfaces:

1. page background
2. primary card
3. muted card

You can be highly branded and still hit comfortable readability.

## Typography defaults that travel well

Use a high-contrast display face for headlines and a workhorse sans for body
copy. Then lock in a spacing scale that keeps article rhythm consistent:

- headings: `mt-10 mb-3`
- paragraphs: `mb-5`
- lists: `mb-6`

With those defaults set, long-form pages stay readable across both themes.

### Practical review loop

When you tweak tokens, review these pages in order:

1. Blog detail page (most typography states)
2. Blog index page (cards + metadata)
3. Home page (hero and CTA emphasis)
