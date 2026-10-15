# The Supply Chain Chronicles

Personal portfolio of **Mirko Zlatunic**, styled as an MMORPG website (inspired by the FFXIV site look):
character profile, job levels, quest log, achievements, linguist and party finder.

Built with **Astro + TypeScript + Tailwind CSS v4**. Static output, ~no client JS (mobile menu + scroll reveal only).

## Develop

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # type-check + build to dist/
npm run preview   # serve dist/
```

## Edit content

All content lives in [`src/data/profile.ts`](src/data/profile.ts) — bio, jobs, expansions (career eras) with
quests (roles), achievements and languages. Components only render that data.

- **Job levels** are computed from the date ranges in each job: `level = 100 × (1 − e^(−years / 5))`
  (see `src/lib/time.ts`). "present" always means the build date, so levels grow on each rebuild.
- **Expansion colours** are set per expansion via `hue`.

## Deploy (GitHub Pages)

1. Create a GitHub repo (e.g. `mirkozlatunic.github.io` for a root URL, or any name for `/<name>/`).
2. Push this project to `main`.
3. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

`.github/workflows/deploy.yml` builds and deploys on every push; it sets the correct base path automatically.

## Project layout

```
src/
  data/profile.ts      content (single source of truth)
  lib/time.ts          durations, levels, date formatting
  components/          Nav, Hero, Topics, Character, Jobs, QuestLog, Achievements, Linguist, Party, Footer
  layouts/Base.astro   <head>, fonts, scroll-reveal script
  styles/global.css    theme tokens, gold frames, buttons, animations
```

Fan-made styling; not affiliated with Square Enix. All artwork is original CSS/SVG.
