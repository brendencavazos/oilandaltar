# In Passing experiments

Five ways to present the eleven video clips, built against the real files while
the treatment was being chosen. **None of this runs on the site.**

```bash
cd ..            # serve the project root
python3 -m http.server 8900
# then http://127.0.0.1:8900/video-experiments/index.html
```

| Page | Approach | Why not |
| ---- | -------- | ------- |
| `1-contact-sheet` | stills, click to play | kept, as half of what shipped |
| `2-living-wall` | every clip playing silently | arresting, but loads the whole 31 MB set |
| `3-cinema` | one clip per screen, snapping | kept, as the other half |
| `4-viewing-room` | one large clip, others as a strip | the strip has nowhere good to live on a phone |
| `5-blend` | **contact sheet → cinema — this is what shipped** | |

The blend won because it takes the cheap half of one and the immersive half of
the other: the section is still frames, so a visitor downloads the one clip they
choose rather than all of them, and that clip then gets the whole screen. It also
solves the awkward case — two of the eleven are shot vertically, and in any grid
cell they letterbox; given a full screen they are simply vertical.

`site/` is a complete working copy used to try the blend against every other
section before porting. Only its authored files are tracked; link the rest from
`frontend/` before serving it:

```bash
cd site
for f in media gallery-data.js favicon.svg favicon-16x16.png favicon-32x32.png apple-touch-icon.png; do
  ln -sf ../../frontend/$f $f
done
```
