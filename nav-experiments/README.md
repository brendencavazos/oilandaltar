# Navigation experiments

Four ways the navigation could work, built against the real images while the
top bar was being chosen. **None of this runs on the site** — it is kept so the
options that were weighed are still visible.

```bash
cd ..            # serve the project root
python3 -m http.server 8600
# then http://127.0.0.1:8600/nav-experiments/index.html
```

| Page | Approach |
| ---- | -------- |
| `a-topbar` | bar always present |
| `b-dropdown` | bar with a projects panel |
| `c-overlay` | wordmark and a Menu button only |
| `d-autohide` | bar that retires on scroll |

**What shipped is B and D combined**: the projects panel, on a bar that retires
as you scroll down and returns as you scroll up. On phones the links move into a
full-screen sheet behind a three-line button.

`site/` is a complete working copy of the site used to try that combination
across every page before it was ported. It is a snapshot, not the live code —
read `frontend/` for what actually runs. It also carried a menu-icon picker
(`?icon=lines|three|word|both|dots|grid`) used to choose between six symbols;
three lines won.
