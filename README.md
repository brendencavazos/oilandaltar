# Oil & Altar

Portfolio site for photographer **Brenden Cavazos** — live at
[oilandaltar.com](https://oilandaltar.com).

Swiss/editorial design: white page, bold black Helvetica, amber active nav, fixed
corner identity block. Hash-routed pages — a crossfading landing carousel,
Bible Belt (flagship project, with an Ephemera sub-page), Abandoned America,
Portraits, Wanderings, In Passing (stills paired with mp4 bays), and About with
an inquiry form.

## How the galleries behave

Four sections — Bible Belt, Ephemera, Abandoned America and Wanderings — render
as a **mosaic**: a three-column wall that breaks out of the text column to both
edges of the window, 4px gutters, no captions on the tiles.

| | |
| ------------------ | --------------------------------------------------------- |
| Reveal             | frames rise into place as they scroll in |
| Hover              | a slight push-in; a press state on touch |
| Click / Enter      | opens full-size with the title and a position counter |
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
