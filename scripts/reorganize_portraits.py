#!/usr/bin/env python3
"""Rearrange photosandvideos/Portraits/ into the folder-per-session layout.

From a flat folder of files named "Name - Month.jpg" it builds:

    photosandvideos/Portraits/
      Sessions/
        Pranav N. - April 2026 - World Cup/
          cover.jpg          <- the hero shown on the Portraits index
          01.jpg  02.jpg …   <- the rest of the wall, in order
      Places and Faces/
        Dani And Flavie - June 2026.jpg

The grouping, the years and the places are read from the same tables the site
is built from, so the result reproduces exactly what is on the site today. From
then on the folders are the source of truth: move a photograph between
Sessions/ and Places and Faces/ to move it between the two rooms, and rename a
session folder to rename the session.

    python3 scripts/reorganize_portraits.py            # show what would move
    python3 scripts/reorganize_portraits.py --apply    # move it

Nothing is deleted and nothing is overwritten: files are moved, and the run
stops before touching anything if a destination already exists.
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from build_gallery import (  # noqa: E402
    MONTHS,
    SESSION_PLACES,
    SESSION_YEARS,
    SESSIONS_DIR,
    SINGLES_DIR,
    SRC,
    dedup,
    natural_key,
    session_of,
)

PORTRAITS = SRC / "Portraits"


def plan() -> tuple[list[tuple[Path, Path]], list[str]]:
    """Work out every move. Returns (moves, warnings) and touches nothing."""
    moves: list[tuple[Path, Path]] = []
    warnings: list[str] = []

    files = sorted(
        [
            p
            for p in PORTRAITS.iterdir()
            if p.is_file()
            and p.suffix.lower() in {".jpg", ".jpeg", ".png"}
            and not p.name.startswith(".")
        ],
        key=natural_key,
    )
    if not files:
        warnings.append("no photographs directly inside Portraits/ — already moved?")
        return moves, warnings

    groups: dict[str, list[Path]] = {}
    for p in dedup(files):
        groups.setdefault(session_of(p), []).append(p)

    def rank(key: str) -> tuple[int, int, str]:
        month = key.rsplit(" - ", 1)[-1].strip().lower()
        return (SESSION_YEARS.get(key, 9999), MONTHS.get(month, 99), key.lower())

    for key in sorted(groups, key=rank):
        members = groups[key]
        year = SESSION_YEARS.get(key)
        if year is None:
            warnings.append(f"no shoot year on record for '{key}' — confirm it by hand")

        # A lone frame was caught rather than arranged, so that is where it
        # starts. Brenden moves it afterwards if he disagrees — which is the
        # whole point of the rearrangement.
        if len(members) == 1:
            src = members[0]
            name = key if year is None else f"{key} {year}"
            moves.append((src, PORTRAITS / SINGLES_DIR / f"{name}{src.suffix.lower()}"))
            continue

        folder = key if year is None else f"{key} {year}"
        place = SESSION_PLACES.get(key)
        if place:
            folder = f"{folder} - {place}"
        dest_dir = PORTRAITS / SESSIONS_DIR / folder

        # The site's cover today is the first photograph of the session, so it
        # becomes cover.jpg and the wall looks unchanged after the move.
        for n, src in enumerate(members):
            stem = "cover" if n == 0 else f"{n:02d}"
            moves.append((src, dest_dir / f"{stem}{src.suffix.lower()}"))

    return moves, warnings


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--apply", action="store_true", help="actually move the files")
    args = ap.parse_args()

    if not PORTRAITS.is_dir():
        sys.exit(f"not found: {PORTRAITS}")
    if (PORTRAITS / SESSIONS_DIR).exists() and not args.apply:
        print(f"note: {SESSIONS_DIR}/ already exists\n")

    moves, warnings = plan()
    if not moves:
        for w in warnings:
            print(f"!! {w}")
        return

    clashes = [d for _, d in moves if d.exists()]
    if clashes:
        print("STOPPING — these destinations already exist:")
        for c in clashes[:10]:
            print(f"  {c.relative_to(SRC)}")
        sys.exit(1)

    current = None
    for src, dest in moves:
        folder = dest.parent.relative_to(PORTRAITS)
        if folder != current:
            print(f"\n{folder}/")
            current = folder
        print(f"    {src.name}  ->  {dest.name}")

    print(f"\n{len(moves)} photographs")
    for w in warnings:
        print(f"!! {w}")

    if not args.apply:
        print("\nThis was a dry run. Nothing moved.")
        print("Run again with --apply to do it.")
        return

    for src, dest in moves:
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(src), str(dest))
    print(f"\nMoved {len(moves)} photographs.")
    print("Now run:  python3 scripts/build_gallery.py")


if __name__ == "__main__":
    main()
