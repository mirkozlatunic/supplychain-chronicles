# Design spec — The Supply Chain Chronicles (2026-10-15)

## Intent
Fun personal showcase of Mirko Zlatunic's career (source: LinkedIn PDF export), styled very close to the
FFXIV website: dark navy/black, gold ornate frames, Cinzel serif headings, aether-crystal glow, cinematic hero.
Full RPG metaphor; every real title, company and date is preserved. No Square Enix logos, art or trademarks.

## Constraints
- Very responsive (mobile-first; verified at 375 / 768 / 1440 px, no horizontal scroll).
- Static, fast, hosted on GitHub Pages via GitHub Actions.
- `prefers-reduced-motion` disables animations; content visible without JS.
- Email shown publicly.

## Stack
Astro + TypeScript + Tailwind v4; content in one typed data file (`src/data/profile.ts`).

## Sections
| Section | Content |
|---|---|
| Nav | Character · Jobs · Quest Log · Achievements · Linguist · Join the Party; hamburger < 1024px |
| Hero | "The Supply Chain Chronicles", name wordmark, headline, current expansion, CTAs |
| Topics | News-style cards: current role, party finder (seeking), patch notes (TripleTen) |
| Character Profile | Initials crest, stats (title, job, home world, Grand Company Bachem, GitHub), biography, attributes |
| Job Levels | 8 skills as jobs with role colours; level from years: 100·(1−e^(−y/5)) |
| Quest Log | 5 expansions (newest first), each role/education a collapsible quest with objectives |
| Achievements | 11 accolades with points |
| Linguist | German, Croatian (5★), English (4★), French (2★) |
| Join the Party | Seeking statement; email, LinkedIn, GitHub |
| Footer | Copyright + fan-made disclaimer |
