/* Shared scaffolding for the transition experiments — NOT part of the site.
 *
 * Reads the real gallery data (window.GALLERY, loaded from the live
 * gallery-data.js) and builds the Bible Belt grid from the actual image files.
 * Nothing here is copied or re-exported: the <img> paths point straight at
 * frontend/media/bible-belt/.
 *
 * Each experiment page calls buildGrid() with a per-tile hook so it can attach
 * whatever the variant under test needs. */

/* Reduced motion: honoured from the OS, and forceable from the index page's
 * toggle (?rm=1) so effects can be previewed both ways without changing a
 * system setting. Every variant checks this one function. */
function reducedMotion() {
  if (new URLSearchParams(location.search).get("rm") === "1") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

if (reducedMotion()) document.documentElement.classList.add("rm");

/* The 45 Bible Belt plates, in the order the site renders them. */
function biblePlates() {
  var series = ((window.GALLERY || {}).series || []);
  for (var i = 0; i < series.length; i++) {
    if (series[i].slug === "bible-belt") return series[i].plates || [];
  }
  return [];
}

/* Builds the grid. `onTile(figure, img, index)` runs for each tile so a variant
 * can add classes, observers or listeners without rewriting this. */
function buildGrid(onTile, opts) {
  opts = opts || {};
  var host = document.getElementById("bb-grid");
  var plates = biblePlates();
  if (!plates.length) {
    host.innerHTML = '<p style="font-weight:400">Could not read gallery-data.js — ' +
      'serve this from the project root so ../frontend/ resolves.</p>';
    return [];
  }
  var tiles = [];
  plates.forEach(function (p, i) {
    var fig = document.createElement("figure");
    var img = document.createElement("img");
    // width/height reserve the right box before the file lands: no layout shift
    if (p.w && p.h) { img.width = p.w; img.height = p.h; }
    img.alt = p.title || "";
    img.decoding = "async";
    if (!opts.noLazy) img.loading = "lazy";
    var thumb = "../frontend/" + (p.thumb_url || p.image_url);
    var full = "../frontend/" + p.image_url;
    img.dataset.full = full;
    img.dataset.title = p.title || "";
    if (!opts.deferSrc) img.src = thumb;
    else img.dataset.src = thumb;
    fig.appendChild(img);
    host.appendChild(fig);
    tiles.push(fig);
    if (onTile) onTile(fig, img, i);
  });
  return tiles;
}
