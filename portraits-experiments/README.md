# Portraits experiments

Six layouts and three navigation models, built against the real photographs
while the section was being worked out. **None of this runs on the site.**

```bash
cd ..            # serve the project root
python3 -m http.server 9500
# then http://127.0.0.1:9500/portraits-experiments/index.html
```

| Page | Layout |
| ---- | ------ |
| `a-flat` | flat three-column wall, no session headings |
| `b-sessions` | headings kept, each shoot a three-column group |
| `c-uniform` | equal 2:3 cells, name beneath each |
| `d-column` | single centred column, one photograph per row |
| `e-sessions-grid` | **session index in three columns — this is what shipped** |
| `f-sessions-column` | session index as one wide cover per row |

E won because the section is people, not photographs. Eleven covers fit on a
screen where forty-three frames never could, and nobody scrolls past someone
they were not looking for.

`site/` is a working copy of the whole site used to try E in context. It also
carried three navigation models (`?nav=panel|tabs|unified`) for deciding how a
visitor reaches Places and Faces:

- **panel** — Portraits gets a dropdown like Projects
- **tabs** — *shipped* — the bar stays flat, the split lives on the page
- **unified** — one "Work" panel holding every section

Tabs won on the principle that navigation depth should track importance rather
than structure. Places and Faces is three photographs; it should not hold a slot
in a navigation a visitor scans before they know anything about the work. Tabs
also show both rooms at once, so neither can be mistaken for the whole section.

Only the authored files are tracked; link the rest from `frontend/` before
serving:

```bash
cd site
for f in media gallery-data.js favicon.svg favicon-16x16.png favicon-32x32.png apple-touch-icon.png; do
  ln -sf ../../frontend/$f $f
done
```
