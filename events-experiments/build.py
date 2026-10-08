#!/usr/bin/env python3
"""Generate the six event-presentation mockups.

They borrow real photographs from frontend/media via the gitignored `media`
symlink, and the site's own tokens via _base.css, so what you are judging is
the layout rather than a wireframe. The event copy is placeholder.

    python3 events-experiments/build.py
"""

from pathlib import Path

HERE = Path(__file__).resolve().parent

# Stand-ins for the twenty-frame club take, which is not in the repo yet.
IMGS = list(range(47, 65)) + [42, 43]
EVENT, VENUE, DATE = "Last Call", "The Hall, Oklahoma City", "Saturday 27 September 2026"
SHORT_DATE = "27 Sep 2026"

NAV = ["Projects", "Portraits", "Wanderings", "In Passing", "About"]


def page(title, body, note_label, note_text, active="Portraits", extra_css=""):
    nav = "".join(
        f'<span class="{"on" if i == active else ""}">{i}</span>' for i in NAV
    )
    css = f"<style>{extra_css}</style>" if extra_css else ""
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,600;1,6..96,600&display=swap">
<link rel="stylesheet" href="_base.css">{css}</head><body>
<header class="bar"><a class="brand" href="index.html">oilandaltar</a>
<nav class="nav">{nav}</nav></header>
{body}
<div class="note"><b>{note_label}</b>{note_text}</div>
</body></html>"""


def im(n, cls="", attrs=""):
    return f'<img class="{cls}" src="media/portraits/{n}.jpg" alt="" loading="lazy" {attrs}>'


# ---------------------------------------------------------------- A
def variant_a():
    covers = [
        ("Last Call", "The Hall", "20 photographs", 47),
        ("Afters", "Bar None", "14 photographs", 59),
        ("Opening Night", "Paramount", "31 photographs", 62),
    ]
    cards = "".join(
        f'<figure class="card">{im(n, "cover")}'
        f'<figcaption><p class="serif who">{t}</p>'
        f'<p class="eyebrow where">{v}</p>'
        f'<p class="eyebrow count">{c}</p></figcaption></figure>'
        for t, v, c, n in covers
    )
    css = """
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:26px 20px}
.card{margin:0}
.cover{width:100%;aspect-ratio:4/5;object-fit:cover}
.who{font-size:17px;margin:11px 0 0}
.where{margin:5px 0 0;color:var(--eyebrow-ink);letter-spacing:.12em}
.count{margin:3px 0 0;font-size:11px}
@media(max-width:800px){.grid{grid-template-columns:repeat(2,1fr)}}
"""
    body = f"""<main>
<p class="kicker"><span class="num">III</span>Portraits</p>
<p class="intro">Each session is a collaboration with a specific person, named and dated, rather than a moment caught in passing.</p>
<div class="tabs"><span>Sessions</span><span>Places and Faces</span><span class="on">Events</span></div>
<div class="grid">{cards}</div>
</main>"""
    return page(
        "A — Events as a third tab", body,
        "A · Third tab inside Portraits",
        "Sessions | Places and Faces | Events. Reuses the cover grid you already "
        "have — the only new thing is a venue line under the name. Cheapest to "
        "build, and events inherit every behaviour Portraits already has.",
        extra_css=css,
    )


# ---------------------------------------------------------------- B
def variant_b():
    rows = [
        ("Last Call", "The Hall, Oklahoma City", "27 Sep 2026", "20", 47, 48, 49),
        ("Afters", "Bar None, Tulsa", "13 Sep 2026", "14", 59, 60, 61),
        ("Opening Night", "Paramount, Austin", "30 Aug 2026", "31", 62, 63, 64),
    ]
    items = ""
    for name, venue, date, count, a, b, c in rows:
        items += f"""<article class="ev">
<div class="meta"><p class="eyebrow date">{date}</p>
<h2 class="serif name">{name}</h2>
<p class="eyebrow venue">{venue}</p>
<p class="eyebrow n">{count} photographs</p></div>
<div class="strip">{im(a)}{im(b)}{im(c)}</div></article>"""
    css = """
.ev{display:grid;grid-template-columns:260px 1fr;gap:28px;align-items:start;
  padding:26px 0;border-top:1px solid var(--hairline)}
.ev:first-of-type{border-top:0;padding-top:4px}
.date{margin:0;letter-spacing:.18em}
.name{font-size:30px;line-height:1.05;margin:8px 0 0}
.venue{margin:9px 0 0;color:var(--eyebrow-ink)}
.n{margin:4px 0 0}
.strip{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.strip img{width:100%;aspect-ratio:3/4;object-fit:cover}
@media(max-width:820px){.ev{grid-template-columns:1fr;gap:14px}}
"""
    body = f"""<main>
<p class="kicker"><span class="num">V</span>Events</p>
<p class="intro">Nights photographed as they happened — clubs, shows, rooms full of people. Each event opens as its own set.</p>
{items}
</main>"""
    return page(
        "B — Events as its own section", body,
        "B · Its own top-level section",
        "Events leaves Portraits and gets a nav entry of its own. Each event is a "
        "row: date, name, venue, count, and three frames as a taste. Says event "
        "work is a distinct practice, not a kind of portrait.",
        active="Events", extra_css=css,
    )


# ---------------------------------------------------------------- C
def variant_c():
    tiles = "".join(f'<figure class="t">{im(n)}<figcaption>{i:02d}</figcaption></figure>'
                    for i, n in enumerate(IMGS, 1))
    css = """
main{padding-top:calc(var(--bar-h) + 0px)}
.sheet-head{position:sticky;top:var(--bar-h);z-index:20;background:var(--paper);
  padding:20px 0 14px;border-bottom:1px solid var(--ink);margin-bottom:14px}
.sheet-head h1{font-size:28px;margin:0;line-height:1}
.sheet-head .line{display:flex;justify-content:space-between;align-items:baseline;
  margin-top:8px}
.proof{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
.t{margin:0}
.t img{width:100%;aspect-ratio:1/1;object-fit:cover;background:#f2f2f2}
.t figcaption{font-size:9px;font-weight:400;letter-spacing:.14em;color:var(--mute);
  padding-top:3px;text-align:center}
@media(max-width:900px){.proof{grid-template-columns:repeat(3,1fr)}}
"""
    body = f"""<main>
<div class="sheet-head">
  <p class="eyebrow" style="margin:0 0 6px;letter-spacing:.18em">Events / {SHORT_DATE}</p>
  <h1 class="serif">{EVENT}</h1>
  <div class="line"><p class="eyebrow" style="margin:0">{VENUE}</p>
  <p class="eyebrow" style="margin:0">{len(IMGS)} photographs</p></div>
</div>
<div class="proof">{tiles}</div>
</main>"""
    return page(
        "C — Contact sheet", body,
        "C · Contact sheet",
        "The whole night on one sheet, square crops, numbered, with the event "
        "identity pinned at the top as you scroll. Reads as a photographer's "
        "proof sheet — volume is the point, and nothing is buried.",
        extra_css=css,
    )


# ---------------------------------------------------------------- D
def variant_d():
    frames = "".join(
        f'<section class="fr">{im(n, "big")}<p class="idx">{i:02d} / {len(IMGS)}</p></section>'
        for i, n in enumerate(IMGS[:8], 1)
    )
    css = """
body{background:#0d0d0d;color:#eee}
.bar{background:rgba(13,13,13,.86);border-bottom:1px solid #222}
.brand,.nav{color:#eee}
main{padding:0}
.hero{height:62vh;display:flex;flex-direction:column;justify-content:flex-end;
  padding:0 var(--edge) 34px;border-bottom:1px solid #222}
.hero h1{font-size:clamp(40px,8vw,90px);margin:0;line-height:.95;color:#fff}
.hero p{margin:12px 0 0;color:#9a9a9a}
.pin{position:fixed;top:calc(var(--bar-h) + 16px);left:var(--edge);z-index:30;
  font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;
  color:#7d7d7d}
.fr{height:100vh;display:flex;align-items:center;justify-content:center;
  position:relative}
.big{max-height:84vh;max-width:92vw;object-fit:contain}
.idx{position:absolute;bottom:26px;right:var(--edge);margin:0;font-size:11px;
  font-weight:400;letter-spacing:.16em;color:#6f6f6f}
"""
    body = f"""<p class="pin">{EVENT} — {VENUE}</p>
<main>
<div class="hero"><h1 class="serif">{EVENT}</h1>
<p class="eyebrow" style="letter-spacing:.18em">{VENUE} · {DATE} · {len(IMGS)} photographs</p></div>
{frames}
</main>"""
    return page(
        "D — Cinematic scroller", body,
        "D · Cinematic, one frame at a time",
        "Goes dark and gives each photograph the whole screen. The event name "
        "stays pinned, a counter tracks where you are. Slow and immersive — "
        "closest to how In Passing already behaves.",
        extra_css=css,
    )


# ---------------------------------------------------------------- E
def variant_e():
    cells = "".join(f'<figure class="c">{im(n)}<figcaption>{i:02d}</figcaption></figure>'
                    for i, n in enumerate(IMGS, 1))
    css = """
.ev-head{display:flex;justify-content:space-between;align-items:flex-end;
  border-bottom:1px solid var(--ink);padding-bottom:12px;margin-bottom:22px}
.ev-head h1{font-size:34px;margin:0;line-height:1}
.reel{display:flex;gap:10px;overflow-x:auto;padding-bottom:18px;
  scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch}
.c{margin:0;flex:0 0 auto;scroll-snap-align:center}
.c img{height:62vh;width:auto;object-fit:cover}
.c figcaption{font-size:10px;font-weight:400;letter-spacing:.14em;
  color:var(--mute);padding-top:6px}
.hint{display:flex;align-items:center;gap:10px;margin-top:4px}
.hint .track{flex:1;height:1px;background:var(--hairline);position:relative}
.hint .track i{position:absolute;left:0;top:-1px;height:3px;width:22%;
  background:var(--accent)}
"""
    body = f"""<main>
<p class="kicker"><span class="num">V</span>Events / {EVENT}</p>
<div class="ev-head"><div><h1 class="serif">{EVENT}</h1>
<p class="eyebrow" style="margin:8px 0 0">{VENUE}</p></div>
<p class="eyebrow" style="margin:0">{DATE} · {len(IMGS)} photographs</p></div>
<div class="reel">{cells}</div>
<div class="hint"><span class="eyebrow">Scroll</span><span class="track"><i></i></span><span class="eyebrow">{len(IMGS)}</span></div>
</main>"""
    return page(
        "E — Horizontal reel", body,
        "E · Horizontal reel",
        "One row, scrolled sideways, snapping frame to frame with a progress "
        "bar underneath. The night reads as a sequence in time rather than a "
        "wall — and on a phone it becomes a swipe, which is the native gesture.",
        extra_css=css,
    )


# ---------------------------------------------------------------- F
def variant_f():
    tiles = "".join(f'<figure class="m">{im(n)}</figure>' for n in IMGS)
    css = """
.wrap{display:grid;grid-template-columns:300px 1fr;gap:34px;align-items:start}
.panel{position:sticky;top:calc(var(--bar-h) + 26px)}
.panel h1{font-size:36px;line-height:1;margin:10px 0 0}
.panel .rule{height:1px;background:var(--ink);margin:16px 0}
.panel dl{margin:0;font-size:11px;font-weight:400;letter-spacing:.14em;
  text-transform:uppercase;color:var(--mute);line-height:2}
.panel dt{color:var(--eyebrow-ink);font-weight:700}
.panel dd{margin:0 0 10px}
.panel .blurb{font-size:13px;font-weight:400;line-height:1.75;
  color:var(--ink-soft);text-transform:none;letter-spacing:0;margin-top:16px}
.mos{columns:3;column-gap:6px}
.m{margin:0 0 6px;break-inside:avoid}
.m img{width:100%}
@media(max-width:900px){.wrap{grid-template-columns:1fr}.panel{position:static}
.mos{columns:2}}
"""
    body = f"""<main>
<p class="kicker"><span class="num">V</span>Events</p>
<div class="wrap">
  <aside class="panel">
    <p class="eyebrow" style="margin:0;letter-spacing:.18em">{SHORT_DATE}</p>
    <h1 class="serif">{EVENT}</h1>
    <div class="rule"></div>
    <dl><dt>Venue</dt><dd>{VENUE}</dd>
        <dt>Frames</dt><dd>{len(IMGS)} photographs</dd>
        <dt>Shot on</dt><dd>35mm, flash</dd></dl>
    <p class="blurb">A room at the end of the night. Photographed as it happened,
    without arrangement — which is the whole point of covering an event rather
    than staging one.</p>
  </aside>
  <div class="mos">{tiles}</div>
</div>
</main>"""
    return page(
        "F — Pinned event card", body,
        "F · Pinned card + mosaic",
        "The event's identity sits in a panel that stays put while the "
        "photographs scroll past it. Room for a venue, a camera note, a line of "
        "writing — the most brandable of the six, and the best fit if events "
        "become a regular part of the work.",
        extra_css=css,
    )


VARIANTS = [
    ("a-tab.html", variant_a, "A", "Third tab inside Portraits"),
    ("b-section.html", variant_b, "B", "Its own top-level section"),
    ("c-contact-sheet.html", variant_c, "C", "Contact sheet"),
    ("d-cinematic.html", variant_d, "D", "Cinematic scroller"),
    ("e-reel.html", variant_e, "E", "Horizontal reel"),
    ("f-pinned.html", variant_f, "F", "Pinned event card"),
]


def main() -> None:
    links = "".join(
        f'<li><a href="{f}"><b>{k}</b><span>{label}</span></a></li>'
        for f, _, k, label in VARIANTS
    )
    index = f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Event layouts</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@1,6..96,600&display=swap">
<link rel="stylesheet" href="_base.css">
<style>
main{{max-width:620px}}
h1{{font-family:var(--serif);font-style:italic;font-size:32px;margin:0 0 6px}}
ul{{list-style:none;padding:0;margin:26px 0 0}}
li{{border-top:1px solid var(--hairline)}}
li a{{display:flex;gap:18px;align-items:baseline;padding:16px 2px}}
li b{{color:var(--accent);font-size:13px;letter-spacing:.14em;min-width:22px}}
li span{{font-size:15px;font-weight:400;color:var(--ink-soft)}}
li a:hover span{{color:var(--ink)}}
</style></head><body>
<header class="bar"><span class="brand">oilandaltar</span>
<nav class="nav"><span class="on">Event layouts</span></nav></header>
<main><h1>Six ways to show an event</h1>
<p class="intro">Each uses twenty real photographs and the site's own type and
colour, so what you are judging is the layout. The event name, venue and date
are placeholder copy.</p>
<ul>{links}</ul></main></body></html>"""
    (HERE / "index.html").write_text(index, encoding="utf-8")
    for fname, fn, _, _ in VARIANTS:
        (HERE / fname).write_text(fn(), encoding="utf-8")
    print(f"wrote index.html and {len(VARIANTS)} variants")


if __name__ == "__main__":
    main()
