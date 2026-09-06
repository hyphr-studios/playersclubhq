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
| The Vault (members) | `vault/` |

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
Editorial pages (the SWIM 001 issue, Stanley) are crafted pages and stay HTML.

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

**Vault set galleries** — `assets/photos/swim-001/sets/<model>/<model>-NN.jpg`
(karma 8 · cherri 4 · kaykay 2 · naiomi 3 · ivorie 4 · afterhours duo ·
afterdark ad-01/02). Cards + the fullscreen viewer read these; add a frame by
dropping the next number and listing it in `content/vault.json` (`photos`).

**Archive** — `assets/photos/archive/`: `project-000/` (the PROJECT 000 invite + call sheet),
`outtakes/out-01..04.jpg` (SWIM outtakes drawer).

**Future issues**: copy the swim-001 pattern — `assets/photos/<issue-slug>/`
with `cover.jpg`, `issue-cover.jpg`, then model-name files.

The full-issue reader on the SWIM page is an Issuu embed:
`https://issuu.com/playersclub/docs/swim_001`.

## Video — the naming map

Films live in `assets/video/swim-001/`, silent, stored vertical (720×1280).
Replacing a file by name upgrades it in place. Each film has a matching
`-poster.jpg` shown before it plays.

| File | Where it shows |
|---|---|
| `the-cut.mp4` | Vault Screening Room — the feature |
| `reel-01..03.mp4` | Vault Deck Tapes — tap to play |
| `karma-reel-01..02.mp4` | Vault — Karma Motion I & II |
| `loop-c.mp4`, `loop-d.mp4` | SWIM 001 page — Motion band |

Settings and pitfalls are below under **Encoding a new film**.

## The Vault login

Free house account while the Vault is open: user `STANLEY`, password `FONTAINE`
(shown on the gate). Credentials live in `data-user` / `data-key` on the gate in
`vault/index.html`. Session-based; After Dark behind it still asks 21+.

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


## Encoding a new film (the settings that matter)

Phone footage is shot vertical. Store it **vertical** — the blurred surround
you see on the site is drawn by the page, not baked into the file. Baking it
in wastes about half the file on blur.

```bash
ffmpeg -i INPUT.MOV \
  -an -vf scale=720:1280 \
  -c:v libx264 -preset fast -crf 26 -maxrate 1700k -bufsize 3400k \
  -pix_fmt yuv420p -movflags +faststart \
  assets/video/swim-001/OUT.mp4
```

Two things bite here, both silent:
- **The output path must come last.** ffmpeg applies options to the file that
  *follows* them; put the output earlier and it is written with default
  settings — full resolution, enormous, no warning.
- **Keep `-maxrate`.** Plain `-crf` on grainy 60fps handheld will happily
  produce a file three times larger than the source needed.

Then a poster frame:
```bash
ffmpeg -i assets/video/swim-001/OUT.mp4 -ss 4 -frames:v 1 -q:v 5 assets/video/swim-001/OUT-poster.jpg
```

## Moving films to a CDN later

`assets/js/club.js` opens with:

```js
var VIDEO_BASE = "";
```

Empty means films are served from this repo. Point it at a CDN and every film
on the site follows, by filename — no other edit.

Worth doing when the repo approaches ~1GB or traffic grows. **Cloudflare R2** is
the natural fit: the domain is already on Cloudflare, and R2 charges nothing for
bandwidth. It needs a payment method on the account even for the free tier, so
it is a five-minute job only you can start.

Not GitHub Releases: those assets are served as `application/octet-stream`,
which Safari can refuse to play. Pages serves proper `video/mp4`.


## Performance rules (so it stays fast)

Every photo has three files, generated once and referenced by `srcset`:

| File | Width | Used for |
|---|---|---|
| `name-sm.jpg` | 800px | card thumbnails |
| `name-md.jpg` | 1200px | full-bleed frames on phones |
| `name.jpg` | 1600px | full-bleed on desktop, and the fullscreen viewer |
| `name-blur.jpg` | 320px | the blurred layer behind vertical video |

After dropping in a new full-size photo, regenerate the companions:

```bash
python3 - <<'EOF'
from PIL import Image, ImageFilter
import glob, os
for f in glob.glob('assets/photos/**/*.jpg', recursive=True):
    if any(f.endswith(x) for x in ('-sm.jpg','-md.jpg','-blur.jpg')): continue
    im = Image.open(f).convert('RGB')
    for w, suf, q in ((800,'-sm',79), (1200,'-md',80)):
        if im.width > w + 50:
            out = f[:-4] + suf + '.jpg'
            if not os.path.exists(out):
                im.resize((w, int(im.height*w/im.width)), Image.LANCZOS).save(out,'JPEG',quality=q,optimize=True,progressive=True)
EOF
```

Rules that keep the pages light:
- **Only the hero of each page loads eagerly.** Everything else carries
  `loading="lazy"`. A collapsed Archive gallery loads no images at all.
- **Full-size frames are for the viewer**, never for a card.
- **Save photos around 1600px and quality 80.** Anything larger is wasted.

## What the site survives

Checked, not assumed:
- **No JavaScript at all** — every page still reads. Content is visible by
  default; the reveal animation only turns on once JS confirms it is running.
- **Storage blocked** (Instagram / TikTok in-app browsers, Private Browsing) —
  the Vault still opens and After Dark still remembers membership, via a
  cookie fallback. An unguarded `sessionStorage` call here would take down
  the whole script.
- **Slow phone on 3G** — largest paint is under 1.2s on every page and layout
  shift is effectively zero.


## Model Portal

Three pages behind `/portal/`, plus a public `/casting/` board.

**How access works.** Each model has an access key (e.g. `PC-KARMA-8241`).
The key is hashed in her browser with SHA-256 and the first 16 hex characters
name her ledger file — `portal/ledger/<hash>.json`. Nothing on the site lists
the models, there is no index to enumerate, and she only ever loads her own
file.

**Be clear-eyed about what that is.** It is a lock on a door, not a bank vault.
Anyone holding a key can read that model's ledger, and a key shared in a group
chat is a key that works for everyone in it. Content-unit counts and balances
are fine there. **Bank details, addresses, ID documents and tax forms must
never go in these files** — those belong in the studio's own records.

**Adding a model**

```bash
python3 - <<'EOF'
import json, hashlib
KEY  = "PC-NEWNAME-1234"          # give her this
NAME = "New Name"
doc = {
  "name": NAME, "handle": "@handle", "since": "Sep 2026", "status": "Cast — 002",
  "units": 0, "poolShare": 0.0, "balance": 0.00, "threshold": 100,
  "quarter": "Q4 2026", "payoutDate": "January 2027",
  "note": "", "lines": [], "statements": []
}
h = hashlib.sha256(KEY.strip().upper().encode()).hexdigest()[:16]
json.dump(doc, open(f"portal/ledger/{h}.json","w"), indent=2, ensure_ascii=False)
print("ledger:", h)
EOF
```

To revoke a key, delete the file. To change a key, rename the file to the new
hash.

**Updating everyone after a quarter closes:** edit each ledger's `units`,
`poolShare` and `balance`. The maths that produces those numbers is on
`/portal/royalties/`, and the calculator there does it for you.

**The casting board and updates** are `content/castings.json` and
`content/updates.json` — both plain JSON, both feed the public casting page
and the portal at once.

### When to replace this with real accounts

When money actually moves, or when models need to log in with an email and
password rather than a key. That needs a backend: **Supabase** is the natural
fit — real auth, a row per model, and rules so a model can read only her own
row. The portal's front end is already shaped for it; what changes is where
`tryKey()` looks. Until then, keys are the honest version of this.
