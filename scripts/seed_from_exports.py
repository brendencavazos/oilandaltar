#!/usr/bin/env python3
"""Fill photosandvideos/ from what is already published under frontend/media/.

The raw photographs are not in this repository. The published copies are, and
they are the best copies on this machine, so they can stand in as the source
until the originals turn up. Once the folders are filled, adding or removing a
photograph is what it should be: drag a file in or out of the series folder and
rebuild.

    python3 scripts/seed_from_exports.py            # show the plan
    python3 scripts/seed_from_exports.py --apply    # write the files

Rebuilding from these costs nothing in quality: build_gallery.py copies a JPEG
that is already within the export size instead of re-encoding it. A real master
is larger and gets resized once, exactly as before.

Portraits is not handled here — it has its own foldered layout and its own
script, seed_portraits_from_exports.py.
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / "frontend"
SRC = ROOT / "photosandvideos"

# slug -> the folder build_gallery.py reads it from, and how filenames are read.
#   "position" — order is all that matters, the title is generated
#   "title"    — the filename becomes the caption, so it has to round-trip
SERIES = {
    "bible-belt": ("Bible Belt Photo", "position"),
    "abandoned-america": ("Abandoned America", "position"),
    "wanderings": ("Wanderings", "title"),
    "ephemera": ("Ephemera", "title"),
}
CAROUSEL_DIR = "main coursel "
VIDEO_DIR = "Vids"
ABOUT = ("About", "portrait.jpg")


def gallery() -> dict:
    raw = (FRONTEND / "gallery-data.js").read_text(encoding="utf-8")
    return json.loads(raw.split("window.GALLERY =", 1)[1].strip().rstrip(";"))


def as_filename(title: str) -> str:
    """Reverse of clean_title(): the caption is read back off the filename, so
    a title has to survive the round trip. Only the apostrophe is rewritten."""
    return title.replace("’", "_").replace("'", "_")


def plan() -> list[tuple[Path, Path]]:
    g = gallery()
    out: list[tuple[Path, Path]] = []

    by_slug = {s["slug"]: s for s in g["series"]}
    # Ephemera is a sub-page of Bible Belt, so it sits at the top level of the
    # data rather than among the series.
    if isinstance(g.get("ephemera"), dict):
        by_slug["ephemera"] = g["ephemera"]

    for slug, (folder, naming) in SERIES.items():
        series = by_slug.get(slug)
        if not series:
            continue
        for i, plate in enumerate(series.get("plates", []), start=1):
            src = FRONTEND / plate["image_url"]
            if naming == "title":
                name = f"{as_filename(plate['title'])}.jpg"
            else:
                name = f"{i:02d}.jpg"
            out.append((src, SRC / folder / name))

    for i, frame in enumerate(g.get("carousel", []), start=1):
        url = frame if isinstance(frame, str) else frame.get("url", "")
        if url:
            out.append((FRONTEND / url, SRC / CAROUSEL_DIR / f"{i:02d}.jpg"))

    # The poster frames are generated from the clip, so only the mp4 is source.
    clips = (g.get("inPassing") or {}).get("clips", [])
    for clip in clips:
        url = clip.get("src", "")
        if url.lower().endswith(".mp4"):
            out.append(
                (FRONTEND / url, SRC / VIDEO_DIR / f"{as_filename(clip['title'])}.mp4")
            )

    about = FRONTEND / "media" / "about" / ABOUT[1]
    if about.exists():
        out.append((about, SRC / ABOUT[0] / ABOUT[1]))

    return [(s, d) for s, d in out if s.exists()]


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--apply", action="store_true", help="actually write the files")
    args = ap.parse_args()

    copies = plan()
    if not copies:
        sys.exit("nothing to copy — is frontend/media/ populated?")

    current = None
    for src, dest in copies:
        folder = dest.parent.name
        if folder != current:
            print(f"\n{folder}/")
            current = folder
        print(f"    {src.name}  ->  {dest.name}")

    folders = sorted({d.parent.name for _, d in copies})
    print(f"\n{len(copies)} files into {len(folders)} folders: {', '.join(folders)}")

    if not args.apply:
        print("\nDry run. Nothing written. Run again with --apply.")
        return

    clashes = [d for _, d in copies if d.exists()]
    if clashes:
        sys.exit(f"STOPPING — already exists: {clashes[0]}")

    for src, dest in copies:
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)
    print(f"\nWrote {len(copies)} files into {SRC}")


if __name__ == "__main__":
    main()
