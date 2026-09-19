# Oil & Altar

Portfolio site for photographer **Brenden Cavazos** — live at
[oilandaltar.com](https://oilandaltar.com).

Swiss/editorial design: white page, bold black Helvetica, red active nav, fixed
corner identity block. Hash-routed pages — a crossfading landing carousel,
Bible Belt (flagship project, with an Ephemera sub-page), Abandoned America,
Portraits, Wanderings, In Passing (stills paired with mp4 bays), and About with
an inquiry form.

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
