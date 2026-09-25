/* Shared scaffolding — reads the real Portraits data, opens the real files. */
function portraits() {
  var s = (window.GALLERY.series || []).filter(function (x) { return x.slug === "portraits"; })[0] || {};
  return { excerpt: s.excerpt || [], plates: (s.plates || []).map(function (p) {
    return { session: p.session, thumb: "../frontend/" + p.thumb_url,
             full: "../frontend/" + p.image_url, w: p.w, h: p.h };
  }) };
}
function sessions(plates) {
  var order = [], by = {};
  plates.forEach(function (p) {
    var k = p.session || "—";
    if (!by[k]) { by[k] = []; order.push(k); }
    by[k].push(p);
  });
  return order.map(function (k) { return { name: k, plates: by[k] }; });
}
/* one enlarged view for every variant */
function lightbox(all) {
  var lb = document.createElement("div");
  lb.className = "lb"; lb.hidden = true;
  lb.innerHTML = '<button class="x" aria-label="Close">&times;</button>' +
    '<button class="p" aria-label="Previous">&#8249;</button>' +
    '<button class="n2" aria-label="Next">&#8250;</button>' +
    '<div class="lb-stage"><img alt=""></div>' +
    '<div><p class="who"></p><p class="num"></p></div>';
  document.body.appendChild(lb);
  var i = 0;
  function paint() {
    lb.querySelector("img").src = all[i].full;
    lb.querySelector(".who").textContent = all[i].session || "";
    lb.querySelector(".num").textContent = (i + 1) + " / " + all.length;
  }
  function open(n) { i = n; paint(); lb.hidden = false; document.body.style.overflow = "hidden"; }
  function close() { lb.hidden = true; lb.querySelector("img").removeAttribute("src"); document.body.style.overflow = ""; }
  function step(d) { i = (i + d + all.length) % all.length; paint(); }
  lb.querySelector(".x").onclick = close;
  lb.querySelector(".p").onclick = function (e) { e.stopPropagation(); step(-1); };
  lb.querySelector(".n2").onclick = function (e) { e.stopPropagation(); step(1); };
  lb.onclick = function (e) { if (e.target === lb) close(); };
  addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
  return open;
}
