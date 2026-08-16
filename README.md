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

## Editing content — no HTML required

The surfaces that change over time are powered by JSON files in `content/`:

- `content/issues.json` — the Issues shelf. Add an edition object and it appears;
  flip `"open": true` and give it an `href` when it publishes.
- `content/vault.json` — the entire Vault floor: billboard + every shelf and card.
  Reorder shelves, add cards, change locks/labels by editing JSON only.
- `content/afterdark.json` — After Dark, the Vault's 21+ back room
  (`vault/after-dark/`). One membership: the Vault key opens the floor, a 21+
  confirm opens the back room. Same JSON format as the Vault.

The static HTML in those pages is just a fallback for the rare case the JSON
fails to load — keep it roughly in sync when convenient, or ignore it.
Editorial pages (the SWIM 001 issue, Stanley, Inez) are crafted pages and stay HTML.

## Photography — the naming map

Photos live in `assets/photos/`. A file with the right name in the right folder
appears on the site automatically; replacing a file (same name) upgrades it in
place. Current SWIM 001 images were extracted from the issue PDF at 1080px —
drop full-res originals (1600–2400px long edge, JPG) over them any time.

**SWIM 001** — `assets/photos/swim-001/`
| File | Where it shows |
|---|---|
| `cover.jpg` | Home cover + issue page hero (clean shot, no text — Karma full-bleed) |
| `issue-cover.jpg` | The designed magazine front cover — Issues shelf + social preview |
| `karma-02.jpg` | Cover Girl section + Vault featured billboard |
| `cherri-01.jpg` | Cherri feature + Vault Set 02 |
| `kaykay-01.jpg` / `kaykay-02.jpg` | Kay Kay feature + Vault Set 03 |
| `naiomi-01.jpg` | The Cast strip + Vault Set 04 |
| `ivorie-01.jpg` | The Cast strip |
| `cast-01.jpg` | The Cast strip + Vault After Hours |
| `resort.jpg` | Resort teaser plate |

**Archive** — `assets/photos/archive/`: `swim-cs-01..04.jpg` (production record),
`sf-01..04.jpg` (Stanley effects), `iv-01..03.jpg` (Inez fragments).

**Studio** — `assets/photos/studio/`: `ref-01..08.jpg` (the wall),
`l1-a..c.jpg`, `l2-a..c.jpg`, `l3-a..c.jpg` (light library).

**Future issues**: copy the swim-001 pattern — `assets/photos/<issue-slug>/`
with `cover.jpg`, `issue-cover.jpg`, then model-name files.

The full-issue reader on the SWIM page is an Issuu embed:
`https://issuu.com/playersclub/docs/swim_001`.

## Video — the naming map

Muted, compressed MP4s live in `assets/video/swim-001/` (same replace-by-name
rule as photos; keep files under ~90MB for GitHub):

| File | Where it shows |
|---|---|
| `the-cut.mp4` + `the-cut-poster.jpg` | Vault Screening Room feature (the deep tape) |
| `reel-01..03.mp4` + `-poster.jpg` | Vault Deck Tapes (click to play) |
| `loop-a.mp4`, `loop-b.mp4` | Studio — Motion (silent autoplay loops) |
| `loop-c.mp4`, `loop-d.mp4` | SWIM 001 page — Motion band |

Compress a new video: `ffmpeg -i IN.MOV -an -vf "scale=1280:-2,fps=24" -c:v libx264 -crf 28 -movflags +faststart OUT.mp4` (`-an` strips audio; use `scale=1920:-2 -crf 27` for a feature).

## The Vault login

Free house account while the Vault is open: user `STANLEY`, password `FONTAINE`
(shown on the gate). Credentials live in `data-user` / `data-key` on the gate in
`vault/index.html`. Session-based; After Dark behind it still asks 21+.

## The Vault key

The gate password is set in `vault/index.html` on the `#gate` element:
`data-key="FONTAINE"`. Change it there. (Client-side only — it sets a mood,
it is not security. Anything truly private should not be committed to this repo.)

## Contact email

All contact links point to `info@playersclubhq.com`. Search-and-replace when the
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
