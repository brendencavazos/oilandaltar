# Oil & Altar

Portfolio site for photographer **Brenden Cavazos** — live at
[oilandaltar.com](https://oilandaltar.com).

Swiss/editorial design: white page, bold black Helvetica, amber active nav, fixed
corner identity block. Hash-routed pages — a crossfading landing carousel,
Bible Belt (flagship project, with an Ephemera sub-page), Abandoned America,
Portraits, Wanderings, In Passing (stills paired with mp4 bays), and About with
an inquiry form.

## Portraits

The section is people, not photographs. A **session** — a shoot of more than one
frame — gets a cover and opens as its own wall at `#/portraits/s/<n>`. Eleven
covers fit on a screen where forty-three photographs never could, and nobody
scrolls past someone they were not looking for.

A **lone frame** was caught rather than arranged, so those gather under
**Places and Faces** (`#/portraits/places-and-faces`) — portraits made at events
and in daily life, kept apart from the sessions for that reason. They enlarge but
do not drill in.

**The sitter's name is said once in each place it means something different**,
which is what stops three screens in a row from repeating it:

| Where | What it says |
| ----- | ------------ |
| Cover on the index | the name, plus the place if one is on record, and the frame count — this is the invitation |
| Head of the session | a rule ruled across with the frame count on its end, then the name, then the month — this confirms you landed where you meant to, and is the only place the date appears |
| Enlarged photograph | the position (`2 / 5`), right-aligned to the edge of the photograph, and nothing else |

The enlarged view carries no name because nothing about the sitter changes from
frame to frame — you arrived from a page that named them, and every frame in the
set is the same person on the same day. The position is the only thing that
actually changes as you step through, so it is the only thing shown. This holds
for Places and Faces too. Every other series keeps its title and counter.

A **place** is not a title. `Pranav N. — World Cup` tells one shoot apart from
another by the same person — which matters for Hannah L., who has four — and
reads as an occasion rather than an invented name. Sessions with no place on
record show the name alone and look no less finished for it. A place is written
into the session's folder name — see *Portraits: a folder per session* below.

The two rooms are reached by **tabs on the page**, not by an entry in the top
bar. Navigation depth should track importance rather than structure: three
photographs should not hold a slot in a navigation a visitor scans before they
know anything about the work, and tabs show both rooms at once so neither can be
mistaken for the whole section.

Portraits is routed by name in `renderRoute()`, so its `layout: "sessions"` flag
in `gallery-data.js` no longer decides anything — the flag table below applies to
the other series.

## In Passing

The video section is a **contact sheet**: poster frames in the same mosaic as the
photographs, so nothing moves until asked and a visitor downloads the one clip
they choose rather than the 31 MB the set weighs. A small triangle in the corner
of a frame is the only thing saying it moves.

Clicking hands that clip the whole screen on black — the one place the site goes
dark — with the arrows, swipe, keyboard and counter the photographs already use.
Sound plays from the first tap where the browser allows it, falling back to muted
where autoplay rules forbid it, with a button to turn it on. Closing stops the
download rather than leaving a clip streaming.

Clips are sized `object-fit: contain`, never `cover`: two of the eleven are shot
vertically and cropping them to a landscape box would be a lie about the work.

## How the galleries behave

Four sections — Bible Belt, Ephemera, Abandoned America and Wanderings — render
as a **mosaic**: a three-column wall that breaks out of the text column to both
edges of the window, 4px gutters, no captions on the tiles.

| | |
| ------------------ | --------------------------------------------------------- |
| Reveal             | frames rise into place as they scroll in |
| Hover              | a slight push-in; a press state on touch |
| Click / Enter      | opens full-size with the title and a position counter (Portraits shows the counter alone — see above) |
| In the enlarged view | arrow keys, on-screen arrows, swipe on touch, Esc to close |
| First visit        | a one-time hint explains the swipe, then never again |

A series joins that group purely by its `layout` flag in `gallery-data.js`
(set in `scripts/build_gallery.py`, so it survives a rebuild):

| `layout`   | Rendering |
| ---------- | ------------------------------------------------ |
| `mosaic`   | the three-column wall described above |
| `sessions` | grouped under session headers, 2-col, captioned (Portraits) |
| `scroll`   | one full-width frame per row, captioned |

**The reveal has a fallback worth knowing about.** It is driven by CSS
(`animation-timeline: view()`) where the browser supports it, which costs no
JavaScript. But a multi-column container fragments every tile, and fragmented
boxes are handled poorly by view-based features — whole columns stayed invisible
in testing. So `armReveal()` in `app.js` watches at runtime: a tile sitting
inside the viewport that is still transparent after 500ms switches the page to
an IntersectionObserver instead, and a final sweep forces anything still hidden.
A blank grid is never acceptable, so it cannot happen.

## Navigation

Navigation runs **across the top**, not down the side. That is what keeps it off
the work: nothing sits beside a photograph where it can be covered, and nothing
reappears over one as you scroll.

| | |
| ------------- | ------------------------------------------------------------ |
| Desktop       | wordmark left; **Projects** opens a panel holding Bible Belt, Ephemera and Abandoned America; Portraits, Wanderings, In Passing, About and the contact icons follow |
| Phone         | wordmark and a three-line button; the button opens a full-screen sheet with the same structure, Curated Projects opening to reveal the documentary work |
| Both          | the bar retires as you scroll down and returns the moment you scroll up — leaving a page and scrolling back are the same impulse |
| Landing page  | the frame runs edge to edge beneath the bar, which turns to glass: white type over a gradient, so the photograph reaches the top of the screen |

Three lines rather than two on the phone button: two reads as an equals sign, and
a page with this little chrome offers no other cue.

Two things in here are easy to break by tidying, so they are worth naming:

- **`.lightbox` must keep `flex-direction: column`.** It holds two children —
  the photo stage and the caption row. In the default row direction they compete
  for width, the photograph collapses, and you get a caption between two arrows
  on an empty field.
- **The enlarged photo is sized against the viewport, not its parent.**
  `max-height: 100%` inside a flex item whose own height is `auto` resolves to
  nothing on mobile Safari and collapses the image to zero height.
- **`.corner` resets `top` and `left` on mobile.** It is `fixed` on desktop and
  `relative` on phones, and the base rule's offsets belong to the fixed
  position. A relative offset moves an element visually without moving its
  layout box, so leaving them in painted the nav block 20px down and right of
  where the page believed it was — and the icons landed on the photograph.
- **The enlarged caption is measured against the photograph, not its text.**
  `fitCaption()` in `app.js` sets the caption block's width from the rendered
  image on every load and resize, above 900px only. Without it the block shrinks
  to fit its own words and the counter drifts inward instead of sitting at the
  edge of the frame. Below 900px the arrows move onto the caption line and it
  already stretches between them, so the measurement steps aside.
- **`.lb-break` and `.lb-date` are switched off and nothing shows them.** They
  are left from a draft that ruled the caption off and dated it. Deleting them
  is safe; styling them is not, because no page expects them to appear.
- **Lengths that must fit a phone screen are in `dvh`, not `vh`.** On a phone
  `100vh` is the viewport at its tallest, with the address bar hidden, so a
  `vh`-sized element overflows behind the browser chrome even when a simulator
  shows it fitting.
- **`jsReveal()` waits two animation frames before revealing anything.** An
  IntersectionObserver reports tiles that are already on screen almost at once,
  so without the wait the class lands in the same frame the tiles were created
  in — there is no previous state to transition from and the frames simply
  appear. This looked like "the animation only works on Bible Belt", because the
  watchdog's half-second delay on the first page happened to let the hidden
  state paint.

## Structure

```
frontend/              The site. This folder is what gets published.
scripts/               build_gallery.py — turns raw photos into web assets
backend/               FastAPI app. NOT deployed; see "The backend" below.
wrangler.jsonc         Cloudflare config: serve frontend/ as static files
```

## Run it locally

No build step, no dependencies — just serve the folder:

```bash
cd frontend
python3 -m http.server 8000
```

Open <http://127.0.0.1:8000>. That is the whole site, exactly as published.

## Adding or changing photos

Raw files go in `photosandvideos/` at the repo root (untracked, full-res), in a
subfolder named for the series. Then:

```bash
python3 scripts/build_gallery.py
```

That writes web-sized assets into `frontend/media/<slug>/` and regenerates
`frontend/gallery-data.js` (the `window.GALLERY` global the site reads). It is
incremental — re-runs only process new or removed files. To force a rebuild of
one image, delete it from `frontend/media/` and run again.

Each still is exported twice:

| Path                     | Size              | Used for              |
| ------------------------ | ----------------- | --------------------- |
| `media/<slug>/NN.jpg`    | ≤ 2000px long edge | scroll pages, carousel |
| `media/<slug>/t/NN.jpg`  | ≤ 900px long edge  | grids, via `srcset`    |

### Portraits: a folder per session

Portraits are filed as folders, and the folders are the instructions — there is
nothing to edit in the build script to add a session, move a photograph between
rooms, or change what a cover says.

```
photosandvideos/Portraits/
├── Sessions/
│   ├── Pranav N. - April 2026 - World Cup/
│   │   ├── cover.jpg        the hero on the Portraits index
│   │   ├── 01.jpg           the wall, in this order
│   │   └── 02.jpg
│   └── Paul S. - February 2025/
│       ├── cover.jpg
│       └── 01.jpg
└── Places and Faces/
    ├── Diego and Isaac - May 2026.jpg
    └── Dani And Flavie - June 2026.jpg
```

| To do this | Do this |
| ---------- | ------- |
| Add a session | make a folder `Name - Month Year`, drop the photographs in, name one `cover.jpg` |
| Add a place to a session | rename the folder `Name - Month Year - Place` |
| Move a photograph into Places and Faces | drag the file there and give it a name |
| Move one back into a session | drag it into that session's folder |
| Change a cover | rename the current `cover.jpg` to a number, rename the one you want to `cover.jpg` |
| Reorder a wall | renumber the files; `cover.jpg` always leads |

A folder name is read as **`Name - Month Year`**, with an optional **`- Place`**
after it. Anything that does not parse is used verbatim and a warning is
printed, so a typo is loud rather than silent. Without a `cover.jpg` the first
file does both jobs.

**Which room a photograph sits in is a decision, not a count.** A session folder
holding one photograph is a session, and a frame under Places and Faces stays
there however many others share its name. The build records the room on each
plate and the site reads it; nothing infers it from how many frames a shoot
happened to keep.

**The raw photographs are not in this repository and never were.** They are
several hundred megabytes of full-resolution files, so `photosandvideos/` is
gitignored — cloning gets you the built website, not the masters. They live
wherever the last build was run. If `photosandvideos/` is missing or empty on a
machine, that machine simply does not have them, and `build_gallery.py` will
stop rather than delete the exports it finds under `frontend/media/`.

### Moving to the folders

`scripts/reorganize_portraits.py` converts the old flat folder — files named
`Name - Month.jpg` — into the layout above, reading the grouping, the years and
the places from the tables the site is already built from, so the result
reproduces what is on the site today. Lone frames start under Places and Faces,
which is where the old rule put them; move any of them afterwards.

```bash
python3 scripts/reorganize_portraits.py            # show every move, change nothing
python3 scripts/reorganize_portraits.py --apply    # do it
python3 scripts/build_gallery.py                   # rebuild from the folders
```

It moves rather than copies, refuses to overwrite, and stops before touching
anything if a destination already exists. The first build afterwards re-exports
every portrait, because the source list it keys exports against has changed —
expect it to take a few minutes.

Until that conversion is run the flat layout still builds exactly as before, so
nothing breaks by waiting. The old layout reads two lookup tables that the
folders make unnecessary: `SESSION_YEARS` (filenames carried only the month) and
`SESSION_PLACES`. Both stay for whatever has not been moved across.

`media/<slug>/.sources` records the original camera filenames. Requires macOS
`sips` for images and `ffmpeg` for video; without ffmpeg the image build still
completes and the video section is skipped with a warning.

## Publishing

```bash
git push
```

That is the entire deploy. Cloudflare watches the `main` branch of
[brendencavazos/oilandaltar](https://github.com/brendencavazos/oilandaltar),
rebuilds, and publishes — usually live within a couple of minutes. There is no
deploy command to run and no server to restart.

Nothing reaches the public until that push, so local edits and commits are safe
to make freely.

## Hosting

| | |
| ----------------- | ----------------------------------------------------- |
| Repo              | `github.com/brendencavazos/oilandaltar`               |
| Host              | Cloudflare Workers (static assets), project `oilandaltar` |
| Preview URL       | `oilandaltar.brenden-cavazos.workers.dev`             |
| Domain            | `oilandaltar.com` + `www`, Cloudflare Registrar       |
| Renews            | 29 July 2027                                          |
| Contact form      | Formspree (`formspree.io/f/xkodydzp`) — no backend involved |

`wrangler.jsonc` points the deploy at `frontend/`. It declares no `main` entry
because there is no Worker script — the site is plain files, and Cloudflare
serves them directly. Static asset requests are free and unmetered, which is why
a 200MB photo site costs nothing to host.

Migrated here in September 2026 from GitHub Pages, where the site was published
out of a different account. TLS is issued and renewed by Cloudflare.

## The backend

`backend/` holds a FastAPI app — gallery API, inquiry inbox, photo uploads,
SQLite storage. **It is not deployed and not used.** The published site is
static: the frontend makes no API calls, and the contact form posts straight to
Formspree. The `Dockerfile` exists to containerize this app and is likewise
unused by the live site.

It is kept because it still runs locally and may be useful if the site ever
needs a server side. To work on it:

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload    # serves frontend/ + the API on :8000
uv run ruff check . && uv run ruff format --check .
uv run pytest                            # coverage gate: 80%
```

Config (env vars): `OILANDALTAR_ADMIN_TOKEN`, `OILANDALTAR_DB`,
`OILANDALTAR_MEDIA_DIR`, `OILANDALTAR_CANONICAL_HOST`. See `.env.example`;
never commit real values. Its SQLite database and uploads are gitignored.
