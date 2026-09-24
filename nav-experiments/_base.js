/* Builds the shared content for every navigation experiment: a full-bleed
 * opening frame and a mosaic wall beneath it, from the real image files. */
function plates(slug) {
  var s = ((window.GALLERY || {}).series || []);
  for (var i = 0; i < s.length; i++) if (s[i].slug === slug) return s[i].plates || [];
  return [];
}
function buildContent(heroIndex) {
  var carousel = (window.GALLERY || {}).carousel || [];
  var hero = document.querySelector(".hero img");
  if (hero && carousel.length) {
    var h = carousel[heroIndex || 0];
    hero.src = "../frontend/" + (h.image_url || h.src || h);
  }
  var wall = document.querySelector(".wall");
  if (!wall) return;
  plates("bible-belt").forEach(function (p, i) {
    var fig = document.createElement("figure");
    var img = document.createElement("img");
    if (p.w && p.h) { img.width = p.w; img.height = p.h; }
    img.alt = p.title || "";
    img.loading = i < 8 ? "eager" : "lazy";
    img.decoding = "async";
    img.src = "../frontend/" + (p.thumb_url || p.image_url);
    fig.appendChild(img);
    wall.appendChild(fig);
  });
}
