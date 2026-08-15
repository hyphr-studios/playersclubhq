# PLAYER'S CLUB™ — playersclubhq.com

An editorial publication presented by **VMG**. Static site — no build step, no dependencies.

## Structure

| Page | Path |
|---|---|
| Home (the cover) | `index.html` |
| Issues (the editions) | `issues/` |
| SWIM 001 — Poolside Luxe | `issues/swim-001/` |
| Archive (the record) | `archive/` |
| Stanley Fontaine — SF-83 | `archive/stanley-fontaine/` |
| Inez Valentine — IV-77 | `archive/inez-valentine/` |
| The Vault (members) | `vault/` |
| Studio (creative dept.) | `studio/` |

## Dropping in real photography

Every visual plate on the site has a photo slot. Drop a real image at the matching
path under `assets/photos/` and it automatically replaces the designed art plate —
no code changes. Missing photos fall back to the plate design, so the site always
looks finished.

Examples:
- `assets/photos/swim-001/cover.jpg` — SWIM 001 cover (home + issue page)
- `assets/photos/swim-001/water-signs.jpg`, `bodies-in-motion.jpg`, `motion-02..04.jpg`, `drip.jpg`, `wet-mafia.jpg`, `dusk.jpg`, `siren.jpg`
- `assets/photos/archive/swim-cs-01..04.jpg` — contact sheets · `sf-01..04.jpg` — Stanley effects · `iv-01..03.jpg` — Inez fragments
- `assets/photos/studio/ref-01..08.jpg`, `l1-a..c.jpg`, `l2-a..c.jpg`, `l3-a..c.jpg`

Use JPGs around 1600–2400px on the long edge.

## The Vault key

The gate password is set in `vault/index.html` on the `#gate` element:
`data-key="FONTAINE"`. Change it there. (Client-side only — it sets a mood,
it is not security. Anything truly private should not be committed to this repo.)

## Contact email

All contact links point to `club@playersclubhq.com`. Search-and-replace when the
real inbox exists.

## Deploy (GitHub Pages)

1. Create an empty repo on GitHub (e.g. `playersclubhq`).
2. `git remote add origin <repo-url> && git push -u origin main`
3. Repo → Settings → Pages → Source: `main` branch, `/ (root)`.
4. `CNAME` is already in the repo (`playersclubhq.com`). At your domain registrar,
   point the domain at GitHub Pages:
   - `A` records for `playersclubhq.com` → `185.199.108.153`, `185.199.109.153`,
     `185.199.110.153`, `185.199.111.153`
   - `CNAME` record for `www` → `<your-github-username>.github.io`
5. Back in Settings → Pages, enter the custom domain and enable **Enforce HTTPS**.

© VMG · PLAYER'S CLUB™ · All rights reserved.
