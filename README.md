# Oil & Altar

Portfolio site for photographer **Brenden Cavazos** — live at
[oilandaltar.com](https://oilandaltar.com).

Swiss/editorial design: white page, bold black Helvetica, amber active nav, fixed
corner identity block. Hash-routed pages — a crossfading landing carousel,
Bible Belt (flagship project, with an Ephemera sub-page), Abandoned America,
Portraits, Wanderings, In Passing (stills paired with mp4 bays), and About with
an inquiry form.

## Portraits

The section is people, not photographs. A **session** gets a cover and opens as
its own wall at `#/portraits/s/<n>`. Ten covers fit on a screen where
fifty-nine photographs never could, and nobody scrolls past someone they were
not looking for.

**Places and Faces** (`#/portraits/places-and-faces`) holds portraits made at
events and in daily life — caught rather than arranged, and kept apart from the
sessions for that reason. They enlarge but do not drill in.

Which room a photograph belongs to is Brenden's call, made by which folder it
sits in — not a rule about how many frames a shoot kept. A session of one
photograph is a session. See *Portraits: a folder per session*.

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
another by the same person — which matters for Brooke N. and Hannah L., who
have three sessions each — and reads as an occasion rather than an invented
name. Sessions with no place on record show the name alone and look no less
finished for it. A place is written into the session's folder name, so it is
lost the moment the folder is renamed without it; no session carries one at
present. See *Portraits: a folder per session* below.

The two rooms are reached by **tabs on the page**, not by an entry in the top
bar. Navigation depth should track importance rather than structure: a room
holding a fraction of the work should not hold a slot in a navigation a visitor scans before they
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

Clips are sized `object-fit: contain`, never `cover`: one of the ten is shot
vertically and cropping it to a landscape box would be a lie about the work.

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

Portrait plates carry two extra fields the build writes from the folder tree:
`room` (`"session"` or `"places"` — which of the two rooms the photograph is
filed under) and `place` (the occasion in the folder name, if any). Plates
without a `room` fall back to the old rule, which is what keeps data built
before the folders working.

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
photosandvideos/       The raw drop. Gitignored — see "Adding or changing photos".
scripts/
  build_gallery.py               turns the raw drop into web assets + gallery data
  seed_from_exports.py           fills every series folder from built exports
  seed_portraits_from_exports.py fills the portrait folders from built exports
  reorganize_portraits.py        converts an old flat portrait drop into folders
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

Two shapes, depending on the series:

- **Portraits** is filed as folders — a folder per session. The folders are the
  instructions; see below.
- **Everything else** is a flat folder per series under `photosandvideos/`.
  Drop files in, remove files, and the site follows. The folder names are not
  the section names — they are what was on the drive when the site was first
  built, so they are listed below rather than guessed at.

Either way, one command turns the raw drop into the website:

```bash
cd ~/oil-and-altar
python3 scripts/build_gallery.py
```

That writes web-sized assets into `frontend/media/<slug>/` and regenerates
`frontend/gallery-data.js` (the `window.GALLERY` global the site reads). It is
incremental — re-runs only process new or removed files. To force a rebuild of
one image, delete it from `frontend/media/` and run again.

| Section on the site | Folder to put photographs in | Filenames |
| ------------------- | ---------------------------- | --------- |
| Bible Belt | `Bible Belt Photo/` | order only; captions are `Untitled NN` |
| Abandoned America | `Abandoned America/` | order only; captions are `Untitled NN` |
| Wanderings | `Wanderings/` | **the filename becomes the caption** |
| Ephemera | `Ephemera/` | **the filename becomes the caption** |
| Portraits | `Portraits/` | foldered — see below |
| In Passing | `Vids/` | the filename becomes the title; `.mp4` only |
| Landing carousel | `main coursel /` | order only (note the trailing space) |
| About portrait | `About/portrait.jpg` | that exact name |

For the two that caption from filenames, an apostrophe is written as an
underscore: `Don_t Look Back.jpg` becomes *Don't Look Back*.

**Filename order is wall order.** Every flat series renders in the natural sort
of its filenames, so the way to arrange a section is to number the files
`01.jpg`, `02.jpg`, … in the order you want them seen. For Bible Belt and
Abandoned America the caption follows that position — the fifth file is
*Untitled 05* — which means the numbers are not stable names: remove one
photograph and everything after it renumbers. Never refer to a frame by its
number outside the context of a particular build.

Two practical consequences:

- **Close the gaps after removing files.** Deleting `07.jpg` leaves the folder
  starting to drift from the captions. Renumbering `01..NN` with no gaps keeps
  the file number and the caption number identical, which is the only way to
  discuss a section without confusion.
- **Renumber in two passes.** Renaming `13.jpg` to `09.jpg` while `09.jpg`
  still exists destroys a photograph. Move everything to a temporary name
  first, then into place.

Each still is exported twice:

| Path                     | Size              | Used for              |
| ------------------------ | ----------------- | --------------------- |
| `media/<slug>/NN.jpg`    | ≤ 2000px long edge | scroll pages, carousel |
| `media/<slug>/t/NN.jpg`  | ≤ 900px long edge  | grids, via `srcset`    |

### Portraits: a folder per session

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

Everything the site shows comes from that tree, so adding a shoot, renaming
one, moving a photograph between the two rooms or changing a cover is done by
dragging and renaming in Finder. Nothing in the code has to change.

| To do this | Do this |
| ---------- | ------- |
| Add a session | make a folder `Name - Month Year`, drop the photographs in, name one `cover.jpg` |
| Name the shoot | rename the folder `Name - Month Year - Place` |
| Move a photograph into Places and Faces | drag the file there, give it a name |
| Move one back into a session | drag it into that session's folder |
| Promote a lone frame to its own session | make it a folder under `Sessions/`, rename the file `cover.jpg` |
| Change a cover | rename the current `cover.jpg` to a number, rename the one you want to `cover.jpg` |
| Reorder a wall | renumber the files; `cover.jpg` always leads |
| Remove a photograph | delete it from the folder |

A folder name is read as **`Name - Month Year`**, with an optional
**`- Place`** after it. Anything that does not parse is used verbatim and a
warning is printed. Without a `cover.jpg` the first file does both jobs, and
`Cover.jpg` works as well as `cover.jpg`.

**A misspelled month is the one failure that stays quiet.** `Feburary` still
matches the shape of a folder name, so no warning is printed — but the month is
not recognised, so the session sorts to the *end* of its year instead of into
place, and the misspelling appears on the page as the caption. This has already
happened once and reached production. If a session lands somewhere unexpected
on the index, check the spelling of the month first.

**Which room a photograph sits in is a decision, not a count.** A session folder
holding one photograph is a session, and a frame under Places and Faces stays
there however many others share its name. The build records the room on each
plate and the site reads it; nothing infers it from how many frames a shoot
happened to keep.

`photosandvideos/Portraits/HOW TO FILE PHOTOS.txt` says the same thing in plain
language, next to the folders, for reading in Finder.

### After you rearrange the folders

Say what changed and what you want done with it. The useful shapes are:

| Say | What happens |
| --- | ------------ |
| "I've rearranged the portrait folders, rebuild it" | build runs, site updated locally, you review it |
| "…and push it live" | the same, then committed and deployed |
| "show me what the portraits look like now" | the folder map — every session with its cover |
| "what would change if I rebuilt?" | the differences, before anything is written |

Publishing still needs saying out loud, every time. A rebuild on its own only
changes files on this computer.

### The photographs in these folders are web copies, not masters

Every file under `photosandvideos/` is 2000px on the long edge — the size the
site serves. The originals are not on this machine, so the folders were filled
from what is published, which are the best copies here.

**Rebuilding from them costs nothing.** `build_gallery.py` copies a JPEG that is
already within the export size instead of re-encoding it, so a rebuild returns
the same bytes rather than a slightly softer generation. Verified by rebuilding
one photograph from each series into a scratch folder and comparing checksums:
identical every time.

What is lost is headroom, not quality. Nothing here can be re-exported larger
than 2000px, cropped and re-exported at full size, or printed from. When the
originals turn up, drop them into these same folders replacing what is there —
they are larger, so they get resized once, exactly as they always were, and the
folder names and structure carry on unchanged.

**The thumbnails are the exception, and they are worth protecting.** Grid
thumbnails are 900px and always *generated*, never copied — there is no
passthrough for them, because nothing in the folders is already that size. The
ones committed under `frontend/media/<slug>/t/` outside Portraits were made
from the real masters, so they are better than anything that can be derived
from a 2000px copy, and they cannot be recreated at that quality on this
machine.

They are deleted and regenerated whenever a series' source list changes — which
means adding, removing or renaming a single file in a series rebuilds all of
that series' thumbnails one generation down. This already happened once, during
the move to the folders, and they were restored from git. If a build reports a
series rebuilding and you did not expect it, check
`git status frontend/media/<slug>/t/` before committing, and
`git checkout -- frontend/media/<slug>/t` puts them back.

### If the folders are missing or empty

**The raw photographs are not in this repository and never were.** They are
several hundred megabytes of full-resolution files, so `photosandvideos/` is
gitignored — cloning gets you the built website, not the masters. If
`photosandvideos/` is missing or empty on a machine, that machine does not have
them, and `build_gallery.py` stops rather than deleting the exports under
`frontend/media/`.

Two scripts refill the tree from what is published. Both are dry-run by default
and print every file they would touch:

```bash
python3 scripts/seed_from_exports.py --apply            # every series
python3 scripts/seed_portraits_from_exports.py --apply  # Portraits, foldered
```

A third converts an old flat portrait drop (`Name - Month.jpg` files) into the
folder layout:

```bash
python3 scripts/reorganize_portraits.py --apply
```

It moves rather than copies, refuses to overwrite, and reads the year and place
tables the flat layout depended on (`SESSION_YEARS`, `SESSION_PLACES` in
`scripts/build_gallery.py`) — both now matter only for anything still flat,
since a folder name carries its own year and place.

### Two things the build refuses to do

Both exist because each would quietly destroy published work:

- **Wipe a series whose source folder is empty.** Exports are numbered by
  position, so a changed source list rebuilds the whole series. An empty folder
  is not an instruction to delete the section — it means the photographs are not
  on this computer.
- **Publish an empty video section.** Video needs `ffmpeg`. Without it the
  build keeps the clips already published rather than taking In Passing off the
  site, so photographs can be rebuilt on a machine that has no ffmpeg.
  *Removing* a clip still works without it — deleting the source file drops the
  clip and the build says which one it dropped — because taking a video down
  needs no transcoding. Only adding or changing one does. To install it you
  need Homebrew first (<https://brew.sh>), then `brew install ffmpeg`.
  Delete the orphaned `media/in-passing/NN.mp4` and `NN.jpg` by hand after a
  removal, or the repo keeps carrying a file nothing points at.

`media/<slug>/.sources` is the manifest the rebuild decision is made from. It
records each source file **and a digest of its contents**, one per line:

```
01.jpg  ead27f451d24581e
02.jpg  28841b1371083ffc
```

The digest is not decoration. Exports are numbered by position, so reordering a
folder means renaming `01..NN` into a different arrangement of *the same names* —
and a manifest that recorded names alone saw no change at all, skipped the
re-export, and left the site serving the old pictures in the new order with
nothing visibly broken. That happened once and was only caught by comparing
checksums.

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
