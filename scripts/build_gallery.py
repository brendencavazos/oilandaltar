#!/usr/bin/env python3
"""Build web-optimized media + the frontend gallery data from photosandvideos/.

Reads Brenden's raw drop in ``photosandvideos/`` (untracked, full-res), writes
web-sized assets into ``frontend/media/<slug>/`` and emits
``frontend/gallery-data.js`` (a ``window.GALLERY`` global the frontend reads).

Incremental: already-built outputs are skipped, so re-runs only process new or
removed source files. Delete a file under ``frontend/media/`` to force a
rebuild of it.

Each image is exported twice:
  media/<slug>/NN.jpg    full  (<= 2000px long edge)  — scroll pages, carousel
  media/<slug>/t/NN.jpg  thumb (<=  900px long edge)  — grids via srcset

    python3 scripts/build_gallery.py

Needs macOS ``sips`` (images) and ``ffmpeg`` (video). If ffmpeg is missing the
image build still completes and the video section is left empty with a warning.
"""

from __future__ import annotations

import json
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "photosandvideos"
MEDIA = ROOT / "frontend" / "media"
DATA_FILE = ROOT / "frontend" / "gallery-data.js"

MAX_DIM = 2000  # longest edge for full-size stills, px
JPEG_Q = 72  # sips JPEG quality (full)
THUMB_DIM = 900  # longest edge for grid thumbnails, px
THUMB_Q = 70  # sips JPEG quality (thumb)
VIDEO_MAX = 1280  # longest edge for video, px

HAS_FFMPEG = shutil.which("ffmpeg") is not None

# ---- project copy (verbatim from Brenden's notes) --------------------------

EXCERPTS = {
    "abandoned-america": [
        "Abandoned America documents what's left after the people have gone: "
        "farmhouses, water towers, and small-town landmarks weathering and falling in "
        "on themselves across the high plains of Texas, Oklahoma, and Kansas, and the "
        "forested hills of the Ozarks in Arkansas and Missouri. These were homes. These "
        "were the places everyone in town used to pass through. The project sits with one "
        "unanswerable question: how does a place get like this, and what does it mean "
        "that the people who left assumed, wrongly, it would stay the same without them.",
    ],
    "portraits": [
        "Each session is a collaboration with a specific person, named and dated, rather "
        "than a moment caught in passing.",
    ],
    "wanderings": [
        "Wanderings holds the ordinary, unplanned frames from daily life noticed in "
        "passing, not staged, not repeated.",
    ],
    "bible-belt": [
        "The Bible Belt gets its name for a reason: a church on nearly every corner, in a "
        "region where the culture built around them is visibly aging out. This project sits "
        "in the gap between traditionalism and modernism: the way a generation raised inside "
        "a specific era of Southern Baptist or Catholic practice finds comfort and identity "
        "in these buildings, and the way a Millennial or Gen Z viewer, raised in the same "
        "towns, often doesn't.",
        "That gap shows up in strange, specific ways. Small prairie towns with more than "
        "forty churches and barely twenty people aren't, as you'd assume, evidence of a "
        "community united by shared faith. They're the opposite. Even within the same race, "
        "ethnicity, and religious background, people have splintered into smaller factions, "
        "unable to agree closely enough on theology to worship under one roof.",
        "Bible Belt holds that tension without resolving it: sincere belief alongside the "
        "decline of the institutions that housed it, and the uncomfortable overlap between "
        "religion, politics, and money that runs through both. Religion makes some people "
        "feel comforted, some at peace, and others completely alienated from the idea of "
        "faith itself. Everyone brings their own interpretation, and the work is meant to "
        "let the viewer arrive at their own read on both the signs and the religion behind "
        "them. This is an ongoing project, built in part through interviews with pastors, "
        "church members, and non-religious individuals to understand their perspective "
        "firsthand.",
    ],
}

IN_PASSING_EXCERPT = [
    "In passing collects short, atmospheric videos and each clip is observed, not staged: "
    "a few seconds of someone else's ordinary life, held long enough to feel like it "
    "belonged to you too.",
]

EPHEMERA_HEADLINE = (
    "Signage, artifacts, and printed matter collected alongside the main body of work: "
    "the smaller, stranger evidence of how faith shows up in daily life here."
)

# ---- helpers ----------------------------------------------------------------

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".JPG", ".JPEG", ".PNG"}


def natural_key(path: Path):
    """Sort 'Untitled 2' before 'Untitled 10'."""
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", path.name)]


def source_images(folder: str) -> list[Path]:
    d = SRC / folder
    files = [
        p for p in d.iterdir() if p.suffix in IMAGE_EXTS and not p.name.startswith(".")
    ]
    return sorted(files, key=natural_key)


def ensure_index_sync(
    slug: str, srcs: list[Path], keys: list[str] | None = None
) -> None:
    """Exports are named by list position (NN.jpg), so an insert/rename that
    shifts the order would silently pair old exports with new titles. Keep a
    manifest of the ordered source names; when it changes, wipe the series
    folder so every index is re-exported from the right source."""
    manifest = MEDIA / slug / ".sources"
    current = "\n".join(keys or [p.name for p in srcs])
    if manifest.exists() and manifest.read_text(encoding="utf-8") == current:
        return

    # An empty source folder next to a folder full of exports means the raw
    # files are missing, not that the series was emptied on purpose. Wiping
    # here would throw away the only copy of the published photographs, so the
    # build stops and says so instead.
    if not srcs and (MEDIA / slug).exists() and any((MEDIA / slug).glob("*.jpg")):
        raise SystemExit(
            f"\n!! {slug}: no source photographs found in photosandvideos/, but\n"
            f"   frontend/media/{slug}/ already holds exports.\n\n"
            f"   Refusing to delete them. This almost always means the raw files\n"
            f"   are not on this computer. Put them back, or delete\n"
            f"   frontend/media/{slug}/ by hand if you really mean to start over."
        )
    if (MEDIA / slug).exists():
        if manifest.exists():
            print(f"    · source list changed — rebuilding {slug} exports")
        shutil.rmtree(MEDIA / slug)
    (MEDIA / slug).mkdir(parents=True, exist_ok=True)
    manifest.write_text(current, encoding="utf-8")


def dedup(paths: list[Path]) -> list[Path]:
    """Drop byte-identical duplicates (e.g. trailing-space filename twins), keep order."""
    seen: set[int] = set()
    out: list[Path] = []
    for p in paths:
        h = hash(p.read_bytes())
        if h in seen:
            print(f"    · skip duplicate: {p.name}")
            continue
        seen.add(h)
        out.append(p)
    return out


def dims(path: Path) -> tuple[int, int]:
    out = subprocess.run(
        ["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(path)],
        capture_output=True,
        text=True,
    ).stdout
    w = int(re.search(r"pixelWidth: (\d+)", out).group(1))
    h = int(re.search(r"pixelHeight: (\d+)", out).group(1))
    return w, h


def shape_of(w: int, h: int) -> str:
    if w >= h * 1.15:
        return "wide"
    if h >= w * 1.15:
        return "tall"
    return ""


def resize_jpeg(src: Path, dst: Path, max_dim: int, quality: int) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "sips",
            "-s",
            "format",
            "jpeg",
            "-s",
            "formatOptions",
            str(quality),
            "-Z",
            str(max_dim),
            str(src),
            "--out",
            str(dst),
        ],
        check=True,
        capture_output=True,
    )


def within_limits(src: Path) -> bool:
    """A JPEG already no larger than the export size. Re-encoding one of these
    would throw quality away for nothing: it is already the size the site
    serves, and every pass through the encoder softens it a little more."""
    if src.suffix.lower() not in {".jpg", ".jpeg"}:
        return False
    try:
        w, h = dims(src)
    except Exception:
        return False
    return 0 < max(w, h) <= MAX_DIM


def process_image(src: Path, slug: str, i: int) -> dict:
    """Export full + thumb (skipping already-built files) and return media facts."""
    full = MEDIA / slug / f"{i:02d}.jpg"
    thumb = MEDIA / slug / "t" / f"{i:02d}.jpg"
    if not full.exists():
        # Copied rather than re-encoded when it is already within size, so a
        # rebuild costs nothing in quality. A real master is larger than this
        # and gets resized once, as it always has.
        if within_limits(src):
            full.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, full)
        else:
            resize_jpeg(src, full, MAX_DIM, JPEG_Q)
    if not thumb.exists():
        resize_jpeg(src, thumb, THUMB_DIM, THUMB_Q)
    w, h = dims(full)
    return {
        "image_url": f"media/{slug}/{i:02d}.jpg",
        "thumb_url": f"media/{slug}/t/{i:02d}.jpg",
        "w": w,
        "h": h,
        "shape": shape_of(w, h),
    }


def clean_title(name: str) -> str:
    """Filename -> display title. '_' stands in for an apostrophe/quote in the drop."""
    t = Path(name).stem.strip()
    t = re.sub(r"_([^_]+)_", r"\1", t)  # _Alice_ -> Alice (titles carry no quotes)
    t = t.rstrip("_")  # 'Used and Abused_' -> 'Used and Abused'
    t = t.replace("_", "’")  # Don_t -> Don’t
    return re.sub(r"\s+", " ", t).strip()


def untitled(n: int) -> str:
    return f"Untitled {n:02d}"


# ---- per-series builders ----------------------------------------------------


def build_untitled(slug: str, folder: str) -> list[dict]:
    """Sequential 'Untitled 0X' captions in natural filename order."""
    print(f"[{slug}] {folder}")
    imgs = dedup(source_images(folder))
    ensure_index_sync(slug, imgs)
    plates = []
    for i, src in enumerate(imgs, start=1):
        plates.append(
            {"title": untitled(i), "session": None, **process_image(src, slug, i)}
        )
        print(f"    {i:02d}/{len(imgs)}  {src.name}")
    return plates


def build_titled(slug: str, folder: str) -> list[dict]:
    """Caption = cleaned filename (Wanderings)."""
    print(f"[{slug}] {folder}")
    imgs = dedup(source_images(folder))
    ensure_index_sync(slug, imgs)
    plates = []
    for i, src in enumerate(imgs, start=1):
        plates.append(
            {
                "title": clean_title(src.name),
                "session": None,
                **process_image(src, slug, i),
            }
        )
        print(f"    {i:02d}/{len(imgs)}  {src.name} -> {plates[-1]['title']}")
    return plates


MONTHS = {
    "january": 1,
    "february": 2,
    "march": 3,
    "april": 4,
    "may": 5,
    "june": 6,
    "july": 7,
    "august": 8,
    "september": 9,
    "october": 10,
    "november": 11,
    "december": 12,
}


# Shoot year per session. Filenames only carry the month, so years come from
# file metadata (kMDItemContentCreationDate on the drops) — NOT guessed from
# today's date. Sessions missing here render without a year and print a
# warning so they get confirmed with Brenden before publishing.
SESSION_YEARS = {
    "Paul S. - February": 2025,  # edits dated Mar 2025 — the one pre-2026 shoot
    "Brooke N. - March": 2026,
    "Hannah L. - March": 2026,
    "Pranav N. - April": 2026,  # PNG exports carry no EXIF; year per Brenden's drop
    "Hannah L. - April": 2026,
    "Manny U. - May": 2026,
    "Diego and Isaac - May": 2026,
    "Hannah L. - June": 2026,
    "Elena R. - June": 2026,
    "Dani And Flavie - June": 2026,
    "Hannah L. - July": 2026,  # EXIF: shot 2026-07-23
}


# Where a session was shot, for folders still on the flat layout. The foldered
# layout carries the place in the folder name instead, so this table only
# covers what has not been moved across yet.
SESSION_PLACES = {
    "Pranav N. - April": "World Cup",
}

# ---- the foldered layout ---------------------------------------------------
#
#   photosandvideos/Portraits/
#     Sessions/
#       Pranav N. - April 2026 - World Cup/     <- name, month+year, place
#         cover.jpg                             <- the hero on the index
#         01.jpg  02.jpg  ...                   <- the rest of the wall
#     Places and Faces/
#       any-name.jpg                            <- one frame, stands alone
#
# A folder is a session. Its name carries everything the site shows, so nothing
# has to be edited in here to add one. Moving a file between Sessions/ and
# Places and Faces/ is how the two rooms are decided — that judgment belongs to
# Brenden, not to a rule about how many frames a folder happens to hold.
SESSIONS_DIR = "Sessions"
SINGLES_DIR = "Places and Faces"

# "Pranav N. - April 2026 - World Cup"  ->  name / month / year / place
FOLDER_RE = re.compile(
    r"^(?P<name>.+?)\s+-\s+(?P<month>[A-Za-z]+)\s+(?P<year>\d{4})"
    r"(?:\s+-\s+(?P<place>.+))?$"
)


def is_foldered(folder: str) -> bool:
    """True once the series has been moved to the folder-per-session layout."""
    return (SRC / folder / SESSIONS_DIR).is_dir()


def images_in(d: Path) -> list[Path]:
    files = [
        p for p in d.iterdir() if p.suffix in IMAGE_EXTS and not p.name.startswith(".")
    ]
    return sorted(files, key=natural_key)


def cover_first(files: list[Path]) -> list[Path]:
    """The frame named cover.* leads the wall and is the hero on the index.
    Without one the first frame does both jobs, exactly as it always has."""
    cover = [p for p in files if p.stem.lower() == "cover"]
    if not cover:
        return files
    return cover[:1] + [p for p in files if p not in cover]


def read_foldered(folder: str) -> tuple[list[dict], list[Path]]:
    """Read the folder tree. Returns (sessions, singles) where each session is
    {header, place, files} in shoot order and singles are lone frames."""
    root = SRC / folder
    sessions: list[dict] = []

    for d in sorted((root / SESSIONS_DIR).iterdir(), key=lambda p: p.name.lower()):
        if not d.is_dir() or d.name.startswith("."):
            continue
        files = cover_first(images_in(d))
        if not files:
            print(f"    !! {d.name}: no photographs in the folder — skipped")
            continue
        m = FOLDER_RE.match(d.name.strip())
        if not m:
            print(
                f"    !! {d.name}: expected 'Name - Month Year' "
                f"(optionally '- Place') — using the folder name as-is"
            )
            sessions.append(
                {"header": d.name.strip(), "place": "", "files": files, "rank": (9999, 99)}
            )
            continue
        g = m.groupdict()
        header = f"{g['name'].strip()} \u00b7 {g['month'].strip()} {g['year']}"
        sessions.append(
            {
                "header": header,
                "place": (g["place"] or "").strip(),
                "files": files,
                "rank": (int(g["year"]), MONTHS.get(g["month"].strip().lower(), 99)),
            }
        )

    sessions.sort(key=lambda s: (s["rank"], s["header"].lower()))

    # Lone frames read in shoot order too, where the filename says when. A name
    # that does not carry a date falls to the end, in natural order.
    singles_dir = root / SINGLES_DIR
    singles = images_in(singles_dir) if singles_dir.is_dir() else []

    def single_rank(path: Path):
        m = FOLDER_RE.match(re.sub(r"\s+", " ", path.stem).strip())
        if not m:
            return (9999, 99, natural_key(path))
        g = m.groupdict()
        return (
            int(g["year"]),
            MONTHS.get(g["month"].strip().lower(), 99),
            natural_key(path),
        )

    singles.sort(key=single_rank)
    return sessions, singles


def single_header(path: Path) -> str:
    """A lone frame keeps whatever its filename says. If that reads as
    'Name - Month Year' it is formatted like a session for consistency;
    otherwise the filename stands on its own."""
    stem = re.sub(r"\s+", " ", path.stem).strip()
    m = FOLDER_RE.match(stem)
    if not m:
        return stem
    g = m.groupdict()
    return f"{g['name'].strip()} \u00b7 {g['month'].strip()} {g['year']}"


def session_of(path: Path) -> str:
    """Derive 'Name - Month' session key from a portrait filename."""
    stem = path.stem
    stem = re.sub(r"\s*\(\d+\)\s*$", "", stem)  # drop trailing '(2)'
    stem = re.sub(r"\s+", " ", stem).strip()
    if " - " not in stem:  # loose 'Brookie*' edits -> Brooke's shoot
        return "Brooke N. - March"
    return stem


def build_portraits(slug: str, folder: str) -> list[dict]:
    """Group by session; each plate carries its session header, sessions in shoot order."""
    print(f"[{slug}] {folder}")
    if is_foldered(folder):
        return build_portraits_foldered(slug, folder)
    return build_portraits_flat(slug, folder)


def build_portraits_foldered(slug: str, folder: str) -> list[dict]:
    """A folder per session under Sessions/, lone frames under Places and Faces/.
    Which room a photograph belongs in is decided by which folder it sits in."""
    sessions, singles = read_foldered(folder)

    ordered: list[tuple[str, str, str, Path]] = []  # (room, header, place, file)
    for ses in sessions:
        for f in dedup(ses["files"]):
            ordered.append(("session", ses["header"], ses["place"], f))

    seen: dict[str, int] = {}
    for f in dedup(singles):
        header = single_header(f)
        # Two lone frames sharing a header would merge into a session on the
        # site, so a repeat is made distinct rather than silently joined.
        if header in seen:
            seen[header] += 1
            header = f"{header} ({seen[header]})"
        else:
            seen[header] = 1
        ordered.append(("places", header, "", f))

    ensure_index_sync(
        slug,
        [f for _, _, _, f in ordered],
        [str(f.relative_to(SRC)) for _, _, _, f in ordered],
    )

    plates: list[dict] = []
    for i, (room, header, place, src) in enumerate(ordered, start=1):
        # The room is recorded per plate so the folder decides it, not a rule
        # about how many frames a session happens to hold. A session of one is
        # a session; a frame under Places and Faces stays there however many
        # others share its name.
        plate = {
            "title": header,
            "session": header,
            "room": room,
            **process_image(src, slug, i),
        }
        if place:
            plate["place"] = place
        plates.append(plate)

    for ses in sessions:
        tail = f" \u2014 {ses['place']}" if ses["place"] else ""
        print(f"    {ses['header']}{tail}: {len(ses['files'])} photo(s)")
    if singles:
        print(f"    Places and Faces: {len(singles)} photo(s)")
    return plates


def build_portraits_flat(slug: str, folder: str) -> list[dict]:
    """The original layout: one folder of files named 'Name - Month'. Kept so a
    build still works before the folders are rearranged."""
    imgs = dedup(source_images(folder))

    groups: dict[str, list[Path]] = {}
    for p in imgs:
        groups.setdefault(session_of(p), []).append(p)

    def month_rank(key: str) -> int:
        m = re.search(r"-\s*([A-Za-z]+)", key)
        return MONTHS.get(m.group(1).lower(), 99) if m else 99

    ordered = sorted(
        groups, key=lambda k: (SESSION_YEARS.get(k, 9999), month_rank(k), k.lower())
    )
    ensure_index_sync(slug, [p for key in ordered for p in groups[key]])

    plates: list[dict] = []
    i = 0
    for key in ordered:
        # "Brooke N. - March" -> "Brooke N. · March 2026"
        header = key.replace(" - ", " · ")
        year = SESSION_YEARS.get(key)
        if year is None:
            print(
                f"    !! no shoot year on record for '{key}' — confirm before publishing"
            )
        else:
            header = f"{header} {year}"
        place = SESSION_PLACES.get(key)
        for src in groups[key]:
            i += 1
            plate = {"title": header, "session": header, **process_image(src, slug, i)}
            if place:
                plate["place"] = place
            plates.append(plate)
        print(f"    {header}{f' — {place}' if place else ''}: {len(groups[key])} photo(s)")
    return plates


def build_carousel(folder: str) -> list[dict]:
    print(f"[carousel] {folder}")
    imgs = dedup(source_images(folder))
    ensure_index_sync("carousel", imgs)
    slides = []
    for i, src in enumerate(imgs, start=1):
        info = process_image(src, "carousel", i)
        slides.append({"url": info["image_url"], "w": info["w"], "h": info["h"]})
        print(f"    {i:02d}/{len(imgs)}  {src.name}")
    return slides


def video_dims(path: Path) -> tuple[int, int]:
    out = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=width,height",
            "-of",
            "csv=p=0",
            str(path),
        ],
        capture_output=True,
        text=True,
    ).stdout.strip()
    w, h = out.split(",")[:2]
    return int(w), int(h)


VIDEO_EXTS = {".mov", ".mp4", ".m4v"}


def guard_videos(folders: list[str]) -> None:
    """ffmpeg missing used to mean the video section was quietly published
    empty. If there are clips to process and clips already published, that
    would take In Passing off the site, so the build stops and says how to fix
    it instead."""
    if HAS_FFMPEG:
        return
    have_sources = any(
        (SRC / f).is_dir() and any((SRC / f).glob("*.mp4")) for f in folders
    )
    have_published = (MEDIA / "in-passing").exists() and any(
        (MEDIA / "in-passing").glob("*.mp4")
    )
    if have_sources and have_published:
        raise SystemExit(
            "\n!! ffmpeg is not installed, but there are clips to process and\n"
            "   In Passing is already published.\n\n"
            "   Building now would publish an empty video section. Install it\n"
            "   first:  brew install ffmpeg"
        )


def build_videos(folders: list[str]) -> list[dict]:
    print(f"[in-passing] {', '.join(folders)}")
    if not HAS_FFMPEG:
        print(
            "    !! ffmpeg not found, skipping video transcode (re-run when installed)"
        )
        return []
    # Concatenate clips across folders, natural order within each.
    vids: list[Path] = []
    for folder in folders:
        d = SRC / folder
        if not d.is_dir():
            continue
        vids += sorted(
            (
                p
                for p in d.iterdir()
                if p.suffix.lower() in VIDEO_EXTS and not p.name.startswith(".")
            ),
            key=natural_key,
        )
    clips = []
    # Cap the LONG edge at VIDEO_MAX regardless of orientation (vertical phone
    # clips would otherwise keep their full height).
    scale = (
        f"scale={VIDEO_MAX}:{VIDEO_MAX}:force_original_aspect_ratio=decrease:"
        "force_divisible_by=2"
    )
    (MEDIA / "in-passing").mkdir(parents=True, exist_ok=True)
    for i, src in enumerate(vids, start=1):
        mp4 = MEDIA / "in-passing" / f"{i:02d}.mp4"
        poster = MEDIA / "in-passing" / f"{i:02d}.jpg"
        if not mp4.exists():
            subprocess.run(
                [
                    "ffmpeg",
                    "-y",
                    "-i",
                    str(src),
                    "-vf",
                    scale,
                    "-c:v",
                    "libx264",
                    "-pix_fmt",
                    "yuv420p",
                    "-crf",
                    "24",
                    "-preset",
                    "medium",
                    "-c:a",
                    "aac",
                    "-b:a",
                    "128k",
                    "-movflags",
                    "+faststart",
                    str(mp4),
                ],
                check=True,
                capture_output=True,
            )
        if not poster.exists():
            subprocess.run(
                [
                    "ffmpeg",
                    "-y",
                    "-i",
                    str(src),
                    "-vframes",
                    "1",
                    "-vf",
                    scale,
                    str(poster),
                ],
                check=True,
                capture_output=True,
            )
        w, h = video_dims(mp4)
        clips.append(
            {
                "title": clean_title(src.name),
                "src": f"media/in-passing/{i:02d}.mp4",
                "poster": f"media/in-passing/{i:02d}.jpg",
                "w": w,
                "h": h,
            }
        )
        print(f"    {i:02d}/{len(vids)}  {src.name} -> {clips[-1]['title']} ({w}x{h})")
    return clips


# ---- assemble ---------------------------------------------------------------


VIDEO_FOLDERS = ["Vids", "In Passing, PT"]


def main() -> None:
    guard_videos(VIDEO_FOLDERS)
    MEDIA.mkdir(parents=True, exist_ok=True)

    series = [
        {
            "slug": "bible-belt",
            "numeral": "I",
            "title": "Bible Belt",
            "kind": "nocturne",
            "layout": "mosaic",
            "excerpt": EXCERPTS["bible-belt"],
            "plates": build_untitled("bible-belt", "Bible Belt Photo"),
        },
        {
            "slug": "abandoned-america",
            "numeral": "II",
            "title": "Abandoned America",
            "kind": "votive",
            "layout": "mosaic",
            "excerpt": EXCERPTS["abandoned-america"],
            "plates": build_untitled("abandoned-america", "Abandoned America"),
        },
        {
            "slug": "portraits",
            "numeral": "III",
            "title": "Portraits",
            "kind": "still",
            "layout": "sessions",
            "excerpt": EXCERPTS["portraits"],
            "plates": build_portraits("portraits", "Portraits"),
        },
        {
            "slug": "wanderings",
            "numeral": "IV",
            "title": "Wanderings",
            "kind": "mixed",
            "layout": "mosaic",
            "excerpt": EXCERPTS["wanderings"],
            "plates": build_titled("wanderings", "Wanderings"),
        },
    ]

    gallery = {
        "series": series,
        "carousel": build_carousel("main coursel "),
        "inPassing": {
            "excerpt": IN_PASSING_EXCERPT,
            # Base video set plus any later drops appended in order.
            "clips": build_videos(VIDEO_FOLDERS),
        },
        # Ephemera images carry descriptive filenames, captioned like Wanderings.
        "ephemera": {
            "headline": EPHEMERA_HEADLINE,
            "plates": build_titled("ephemera", "Ephemera"),
        },
    }

    payload = json.dumps(gallery, ensure_ascii=False, indent=2)
    DATA_FILE.write_text(
        "/* Generated by scripts/build_gallery.py — do not edit by hand. */\n"
        f"window.GALLERY = {payload};\n",
        encoding="utf-8",
    )

    counts = " · ".join(f"{s['slug']}:{len(s['plates'])}" for s in series)
    print("\n✓ wrote", DATA_FILE.relative_to(ROOT))
    print(
        f"  {counts} · carousel:{len(gallery['carousel'])} "
        f"· ephemera:{len(gallery['ephemera']['plates'])} "
        f"· videos:{len(gallery['inPassing']['clips'])}"
    )


if __name__ == "__main__":
    main()
