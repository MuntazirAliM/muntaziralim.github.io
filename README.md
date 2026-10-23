# Muntazir Ali Mughal | Portfolio

Personal portfolio for freelance data engineering and AI automation work.

Live site: https://muntaziralim.github.io

## What it is

A single static page (`index.html`) with no build step and no dependencies. HTML, CSS and JavaScript are inline, and fonts load from Google Fonts.

Scroll-driven sections:

- **Hero:** word-by-word headline, a terminal trace of a data pipeline, and a network background that reacts to the cursor.
- **How I work:** a pinned story where scrolling turns a messy export into a clean table, a chart and a chatbot answer.
- **Selected work:** a horizontal strip of projects (stacked vertically on phones).
- **Skills:** pick a tool to see which projects used it.
- **Services:** expandable rows showing what a client sends and receives.
- **Background and contact.**

It respects `prefers-reduced-motion` and works down to phone widths.

## Run locally

Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

## Deploy

GitHub Pages serves `main` from the repository root. Push to `main` and the site updates within a couple of minutes.
