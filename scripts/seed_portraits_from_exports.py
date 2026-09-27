#!/usr/bin/env python3
"""Fill photosandvideos/Portraits/ from the exports already in the repo.

The raw photographs are not in this repository, but the published web-sized
copies are, and ``frontend/gallery-data.js`` records exactly which one belongs
to which session and which one the index uses as the hero. That is enough to
rebuild the folder tree:

    photosandvideos/Portraits/
      Sessions/
        Pranav N. - April 2026 - World Cup/
          cover.jpg      <- the hero the site shows today
          01.jpg …       <- the rest of that session, in order
      Places and Faces/
        Diego and Isaac - May 2026.jpg

**These are web-sized copies, not masters** — 2000px on the long edge, already
JPEG-compressed once. They are here so the filing can be seen and rearranged
now. Rebuilding the site from them would compress them a second time, so when
the real files turn up, drop them into these same folders, replacing what is
here, and keep the folder names.

    python3 scripts/seed_portraits_from_exports.py            # show the plan
    python3 scripts/seed_portraits_from_exports.py --apply    # write the files

Copies, never moves: frontend/media/ is left untouched.
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "frontend" / "gallery-data.js"
FRONTEND = ROOT / "frontend"
DEST = ROOT / "photosandvideos" / "Portraits"

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_gallery import MONTHS, SESSION_PLACES, SESSIONS_DIR, SINGLES_DIR  # noqa: E402


def portraits() -> list[dict]:
    body = DATA.read_text(encoding="utf-8").split("window.GALLERY =", 1)[1]
    data = json.loads(body.strip().rstrip(";"))
    series = [s for s in data["series"] if s["slug"] == "portraits"]
    if not series:
        sys.exit("no portraits series in gallery-data.js")
    return series[0]["plates"]


def folder_name(header: str) -> str:
    """'Paul S. · February 2025' -> 'Paul S. - February 2025', plus any place
    on record. The place tables are keyed 'Name - Month', without the year."""
    name, _, date = header.partition("·")
    name, date = name.strip(), date.strip()
    month = date.split()[0] if date else ""
    folder = f"{name} - {date}" if date else name
    place = SESSION_PLACES.get(f"{name} - {month}")
    return f"{folder} - {place}" if place else folder


def plan() -> tuple[list[tuple[Path, Path]], list[str]]:
    groups: dict[str, list[dict]] = {}
    order: list[str] = []
    for p in portraits():
        k = p.get("session") or p.get("title") or "—"
        if k not in groups:
            groups[k] = []
            order.append(k)
        groups[k].append(p)

    copies: list[tuple[Path, Path]] = []
    notes: list[str] = []

    for header in order:
        plates = groups[header]
        # A lone frame is where the old rule put it. Move it afterwards if that
        # is not where it belongs — that judgment is the point of the folders.
        if len(plates) == 1:
            src = FRONTEND / plates[0]["image_url"]
            name = folder_name(header).replace(" - ", " - ", 1)
            copies.append((src, DEST / SINGLES_DIR / f"{name}.jpg"))
            continue

        d = DEST / SESSIONS_DIR / folder_name(header)
        for n, p in enumerate(plates):
            # plates[0] is the hero the index shows today, so it becomes cover.
            stem = "cover" if n == 0 else f"{n:02d}"
            copies.append((FRONTEND / p["image_url"], d / f"{stem}.jpg"))

        notes.append(
            f"{folder_name(header)}: {len(plates)} photographs, "
            f"hero = {plates[0]['image_url'].split('/')[-1]}"
        )

    return copies, notes


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--apply", action="store_true", help="actually write the files")
    args = ap.parse_args()

    copies, notes = plan()
    missing = [s for s, _ in copies if not s.exists()]
    if missing:
        sys.exit(f"missing export: {missing[0]}")

    current = None
    for src, dest in copies:
        folder = dest.parent.relative_to(DEST)
        if folder != current:
            print(f"\n{folder}/")
            current = folder
        print(f"    {src.name}  ->  {dest.name}")

    print(f"\n{len(copies)} photographs into {len(set(d.parent for _, d in copies))} folders")
    for n in notes:
        print(f"  · {n}")

    if not args.apply:
        print("\nDry run. Nothing written. Run again with --apply.")
        return

    clashes = [d for _, d in copies if d.exists()]
    if clashes:
        sys.exit(f"STOPPING — already exists: {clashes[0]}")

    for src, dest in copies:
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)
    print(f"\nWrote {len(copies)} photographs into {DEST}")
    print("These are web-sized copies, not masters — see the note at the top.")


if __name__ == "__main__":
    main()
