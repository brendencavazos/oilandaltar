# Transition experiments

Nine standalone pages testing how the Bible Belt photographs could arrive on
screen. **None of this runs on the site** — these are comparison pages, kept so
the options can be revisited without rebuilding them.

Open `index.html` and click through. A toggle there previews every variant as it
behaves for a visitor with reduced motion enabled.

```bash
cd ..            # serve the project root, not frontend/
python3 -m http.server 8100
# then http://127.0.0.1:8100/transition-experiments/index.html
```

The root is served because each page reads the real gallery data from
`../frontend/gallery-data.js` and points at the real image files. Nothing here
copies or re-exports a photograph.

| Page | Effect | Notes |
| ---- | ------ | ----- |
| `01-fade-in` | fade and rise on scroll | universal; the safe default |
| `02-stagger` | the same, cascaded | delay capped so fast scrolling never waits |
| `03-scroll-driven` | CSS-only reveal + hover + lightbox | **shipped** — this is what the site now does |
| `04-crossfade` | six tiles trade photographs on a timer | doubles requests on those tiles |
| `05-ken-burns` | slow pan and zoom | heaviest; continuous GPU work |
| `06-hover` | hover zoom and brightness | touch gets a press state |
| `07-lightbox` | click expands to an overlay | close to what shipped |
| `08-shared-element` | View Transitions morph | Chrome 111+/Safari 18+, falls back to 07 |
| `09-blur-up` | blurred thumbnail sharpens to full | heavier than the site: fetches 2000px per tile |

`_base.css` and `_base.js` are shared scaffolding — the grid and the data
loading — so the nine differ only in the effect under test. Every selector is
prefixed `.bb-` and nothing here is linked from the site.

Variant 3 is the one that shipped. Its notes explain the fallback the live site
also carries: a multi-column container fragments every tile, and fragmented
boxes break view-based animation, so the CSS reveal is watched at runtime and
swapped for an observer if whole columns fail to appear.
