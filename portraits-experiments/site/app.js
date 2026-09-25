/* Oil & Altar — Swiss-minimal portfolio (after brandnewalias.com).
 *
 * Hash-routed single page:
 *   #/                      landing — crossfade carousel (real photos, 1.5s)
 *   #/bible-belt            flagship project, full-bleed 3-column mosaic
 *   #/bible-belt/ephemera   View Ephemera — sub-section of Bible Belt, mosaic
 *   #/abandoned-america     full-bleed 3-column mosaic
 *   #/portraits             grouped by session, 2-col grids with captions
 *   #/wanderings            full-bleed 3-column mosaic
 *   #/in-passing            stacked 16:9 video bays (atmospheric clips)
 *   #/about                 bio, statement, contact + inquiry form
 *
 * The mosaic pages share one behaviour: frames carry no caption, rise into
 * place as they scroll in, and open full-size on click with the title, a
 * position counter, arrow-key and on-screen navigation, and swipe on touch.
 * A series is switched into that mode purely by its `layout: "mosaic"` flag
 * in gallery-data.js — see renderProject().
 *
 * Gallery content is injected at load by gallery-data.js (window.GALLERY),
 * generated from photosandvideos/ by scripts/build_gallery.py. The embedded
 * fallback below only renders if that file failed to load; any plate without a
 * photo gets a generative placeholder painted in the language of the work. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Set when the corner email icon is clicked, so About lands on the contact
   * form; the About nav link leaves it false and opens at the top. */
  var scrollToForm = false;

  /* Carousel timing — per Bren's spec: 1.5s per slide */
  var DWELL = 1500;

  /* Contact form posts to Formspree (static-friendly, no backend). This form
   * ID is public and safe to commit — it is NOT a password. To change forms,
   * swap the ID from the Formspree dashboard (Forms → your form → its URL). */
  var FORMSPREE_ENDPOINT = "https://formspree.io/f/xkodydzp";

  /* ---------- seeded PRNG so placeholders render identically every load ---------- */
  function prng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  /* ================================================================
   * generative placeholder painters (kept from the previous design):
   *   nocturne — dusk sky, church silhouettes, streetlight, cross
   *   votive   — near-black interior, one hot amber source, god-rays
   *   still    — hard flash split-lit red/teal, dark subject mass
   *   mixed    — one of the above, chosen by seed
   * ================================================================ */

  function grainPass(ctx, w, h, rnd, amt) {
    var img = ctx.getImageData(0, 0, w, h), d = img.data;
    for (var p = 0; p < d.length; p += 4) {
      var n = (rnd() - 0.5) * amt;
      d[p] += n; d[p + 1] += n; d[p + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
  }

  function vignette(ctx, w, h, strength) {
    var v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.max(w, h) * 0.72);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(3,2,2," + strength + ")");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  }

  function lightLeak(ctx, w, h, rnd) {
    if (rnd() > 0.35) return;
    var fromLeft = rnd() < 0.5;
    var g = ctx.createLinearGradient(fromLeft ? 0 : w, 0, fromLeft ? w * 0.4 : w * 0.6, 0);
    var hue = rnd() < 0.5 ? "240,120,40" : "200,50,40";
    g.addColorStop(0, "rgba(" + hue + ",0.5)");
    g.addColorStop(1, "rgba(" + hue + ",0)");
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";
  }

  function paintNocturne(ctx, w, h, rnd) {
    var sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#04050a");
    sky.addColorStop(0.45, "#101a2e");
    sky.addColorStop(0.72, "#1c2c50");
    sky.addColorStop(0.95, "#3a2a14");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    var horizon = h * (0.62 + rnd() * 0.18);

    var lx = w * (0.15 + rnd() * 0.7), ly = horizon - h * (0.12 + rnd() * 0.3);
    var halo = ctx.createRadialGradient(lx, ly, 0, lx, ly, Math.min(w, h) * (0.3 + rnd() * 0.25));
    halo.addColorStop(0, "rgba(255,220,150,0.95)");
    halo.addColorStop(0.08, "rgba(240,166,60,0.7)");
    halo.addColorStop(0.4, "rgba(240,166,60,0.16)");
    halo.addColorStop(1, "rgba(240,166,60,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(4,3,2,0.9)";
    ctx.fillRect(lx - w * 0.004, ly, w * 0.008, horizon - ly + h * 0.1);

    var wires = Math.floor(rnd() * 3);
    ctx.strokeStyle = "rgba(2,2,2,0.85)";
    ctx.lineWidth = Math.max(1, w * 0.002);
    for (var wI = 0; wI < wires; wI++) {
      var wy = h * (0.08 + rnd() * 0.3);
      ctx.beginPath();
      ctx.moveTo(0, wy);
      ctx.quadraticCurveTo(w / 2, wy + h * (0.03 + rnd() * 0.06), w, wy - h * rnd() * 0.05);
      ctx.stroke();
    }

    ctx.fillStyle = "#040302";
    var x = 0;
    while (x < w) {
      var bw = w * (0.14 + rnd() * 0.3);
      var bh = h * (0.06 + rnd() * 0.22);
      ctx.fillRect(x, horizon - bh, bw + 1, bh);
      if (rnd() < 0.4) {
        ctx.beginPath();
        ctx.moveTo(x, horizon - bh);
        ctx.lineTo(x + bw * 0.5, horizon - bh - h * (0.05 + rnd() * 0.08));
        ctx.lineTo(x + bw, horizon - bh);
        ctx.fill();
      }
      var wins = Math.floor(rnd() * 3);
      for (var i = 0; i < wins; i++) {
        ctx.fillStyle = rnd() < 0.3 ? "rgba(160,220,240,0.85)" : "rgba(240,180,90,0.9)";
        ctx.fillRect(x + bw * (0.15 + rnd() * 0.6), horizon - bh * (0.3 + rnd() * 0.5), w * 0.014, w * 0.02);
        ctx.fillStyle = "#040302";
      }
      x += bw + w * rnd() * 0.08;
    }

    ctx.fillStyle = "#050403";
    ctx.fillRect(0, horizon, w, h - horizon);

    if (rnd() < 0.5) {
      var cx = w * (0.2 + rnd() * 0.6), cy = horizon - h * (0.16 + rnd() * 0.2);
      var ch = h * (0.1 + rnd() * 0.12), cw = ch * 0.09;
      ctx.fillStyle = "rgba(3,2,2,0.95)";
      ctx.fillRect(cx - cw / 2, cy - ch, cw, ch + h * 0.02);
      ctx.fillRect(cx - ch * 0.3, cy - ch * 0.72, ch * 0.6, cw);
    }
  }

  function paintVotive(ctx, w, h, rnd) {
    ctx.fillStyle = "#070503";
    ctx.fillRect(0, 0, w, h);

    var lx = w * (0.2 + rnd() * 0.6), ly = h * (0.18 + rnd() * 0.4);
    var r = Math.min(w, h) * (0.5 + rnd() * 0.3);
    var light = ctx.createRadialGradient(lx, ly, 0, lx, ly, r);
    light.addColorStop(0, "rgba(255,214,140,0.95)");
    light.addColorStop(0.12, "rgba(232,160,70,0.6)");
    light.addColorStop(0.5, "rgba(150,90,30,0.22)");
    light.addColorStop(1, "rgba(60,30,10,0)");
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = "lighter";
    var rays = 3 + Math.floor(rnd() * 4);
    for (var i = 0; i < rays; i++) {
      var a = rnd() * Math.PI * 2;
      var len = r * (0.8 + rnd() * 0.8);
      var spread = 0.04 + rnd() * 0.1;
      ctx.fillStyle = "rgba(240,190,110," + (0.04 + rnd() * 0.08) + ")";
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx + Math.cos(a - spread) * len, ly + Math.sin(a - spread) * len);
      ctx.lineTo(lx + Math.cos(a + spread) * len, ly + Math.sin(a + spread) * len);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";

    var forms = 3 + Math.floor(rnd() * 4);
    for (var f = 0; f < forms; f++) {
      var fx = w * (0.1 + rnd() * 0.8), fy = h * (0.45 + rnd() * 0.5);
      var fr = Math.min(w, h) * (0.14 + rnd() * 0.26);
      var g = ctx.createRadialGradient(fx - fr * 0.3, fy - fr * 0.3, fr * 0.1, fx, fy, fr);
      g.addColorStop(0, "rgba(120,80,44,0.5)");
      g.addColorStop(0.6, "rgba(20,12,7,0.8)");
      g.addColorStop(1, "rgba(7,5,3,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(fx, fy, fr * (0.7 + rnd() * 0.6), fr, rnd() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function paintStill(ctx, w, h, rnd) {
    ctx.fillStyle = "#050304";
    ctx.fillRect(0, 0, w, h);

    var flip = rnd() < 0.5;
    var red = ctx.createRadialGradient(flip ? 0 : w, h * 0.2, 0, flip ? 0 : w, h * 0.2, w * (0.8 + rnd() * 0.4));
    red.addColorStop(0, "rgba(168,35,43,0.85)");
    red.addColorStop(0.5, "rgba(110,20,30,0.35)");
    red.addColorStop(1, "rgba(60,10,18,0)");
    ctx.fillStyle = red;
    ctx.fillRect(0, 0, w, h);

    var teal = ctx.createRadialGradient(flip ? w : 0, h * 0.85, 0, flip ? w : 0, h * 0.85, w * (0.7 + rnd() * 0.4));
    teal.addColorStop(0, "rgba(130,200,225,0.6)");
    teal.addColorStop(0.5, "rgba(50,110,140,0.22)");
    teal.addColorStop(1, "rgba(20,50,70,0)");
    ctx.fillStyle = teal;
    ctx.fillRect(0, 0, w, h);

    var sx = w * (0.35 + rnd() * 0.3), sy = h * (0.4 + rnd() * 0.3);
    var sr = Math.min(w, h) * (0.22 + rnd() * 0.18);
    var subj = ctx.createRadialGradient(sx - sr * 0.35, sy - sr * 0.35, sr * 0.1, sx, sy, sr);
    subj.addColorStop(0, "rgba(40,18,16,0.9)");
    subj.addColorStop(0.75, "rgba(10,5,6,0.95)");
    subj.addColorStop(1, "rgba(5,3,4,0)");
    ctx.fillStyle = subj;
    ctx.beginPath();
    ctx.ellipse(sx, sy, sr * (0.75 + rnd() * 0.5), sr, rnd() * 0.6 - 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "rgba(255,230,210,0.35)";
    ctx.lineWidth = 2 + rnd() * 3;
    ctx.beginPath();
    ctx.ellipse(sx, sy, sr * 0.8, sr * 0.95, rnd() * 0.4, -2.4, -0.9);
    ctx.stroke();

    var hx = w * (0.15 + rnd() * 0.7), hy = h * (0.1 + rnd() * 0.35);
    var hot = ctx.createRadialGradient(hx, hy, 0, hx, hy, Math.min(w, h) * 0.16);
    hot.addColorStop(0, "rgba(255,250,240,0.55)");
    hot.addColorStop(1, "rgba(255,250,240,0)");
    ctx.fillStyle = hot;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";
  }

  function paintPlate(canvas, seed, kind) {
    var w = canvas.width, h = canvas.height;
    var ctx = canvas.getContext("2d");
    var rnd = prng(seed);
    if (kind === "mixed") {
      var r = rnd();
      kind = r < 0.34 ? "votive" : r < 0.67 ? "still" : "nocturne";
    }
    if (kind === "votive") paintVotive(ctx, w, h, rnd);
    else if (kind === "still") paintStill(ctx, w, h, rnd);
    else paintNocturne(ctx, w, h, rnd);
    lightLeak(ctx, w, h, rnd);
    vignette(ctx, w, h, kind === "votive" ? 0.9 : 0.75);
    grainPass(ctx, w, h, rnd, 22);
  }

  function plateSize(shape) {
    if (shape === "wide") return { w: 1400, h: 850 };
    if (shape === "tall") return { w: 800, h: 1150 };
    return { w: 900, h: 1000 };
  }

  /* ---------- fallback data (mirrors the backend seed) ---------- */
  function plates(startId, defs) {
    return defs.map(function (shape, i) {
      var n = startId + i;
      return {
        id: n,
        title: "Untitled " + (n < 10 ? "0" : "") + n,
        shape: shape,
        position: i + 1,
        image_url: null
      };
    });
  }

  var FALLBACK_SERIES = [
    { slug: "bible-belt", numeral: "I", title: "Bible Belt", kind: "nocturne",
      plates: plates(1, ["tall", "", "wide", "", "tall", "", "wide", ""]) },
    { slug: "abandoned-america", numeral: "II", title: "Abandoned America", kind: "votive",
      plates: plates(9, ["wide", "", "tall", "", "wide", ""]) },
    { slug: "portraits", numeral: "III", title: "Portraits", kind: "still", layout: "grid",
      plates: plates(15, ["tall", "", "", "tall", "", ""]) },
    { slug: "wanderings", numeral: "IV", title: "Wanderings", kind: "mixed", layout: "grid",
      plates: plates(21, ["", "wide", "", "tall", "", "wide"]) }
  ];

  /* Real content is injected via gallery-data.js (window.GALLERY); the embedded
   * fallback above only renders if that file failed to load. */
  var GALLERY = window.GALLERY || {};
  var SERIES = (GALLERY.series && GALLERY.series.length) ? GALLERY.series : FALLBACK_SERIES;

  /* ================================================================
   * views
   * ================================================================ */

  var view = document.getElementById("view");
  var carouselAlive = false;
  var carouselTimer = null;

  /* How wide each layout renders, so the browser can pick thumb vs full. */
  var SIZES = {
    scroll: "(max-width: 900px) calc(100vw - 40px), 53vw",
    grid: "(max-width: 900px) calc(100vw - 40px), 26vw"
  };

  function mediaFor(p, kind, layout) {
    if (p.image_url) {
      var img = document.createElement("img");
      img.className = "shot";
      img.alt = p.title;
      img.loading = "lazy";
      img.decoding = "async";
      // Intrinsic dimensions reserve the right space before the file arrives —
      // no layout shift while a page streams in.
      if (p.w && p.h) { img.width = p.w; img.height = p.h; }
      // Fade in when the bitmap is ready instead of popping from blank.
      img.onload = img.onerror = function () { img.classList.add("loaded"); };
      if (p.thumb_url) {
        img.srcset = p.thumb_url + " 900w, " + p.image_url + " 2000w";
        img.sizes = layout === "scroll" ? SIZES.scroll : SIZES.grid;
      }
      img.src = p.image_url;
      if (img.complete) img.classList.add("loaded");
      return img;
    }
    var canvas = document.createElement("canvas");
    var size = plateSize(p.shape);
    canvas.width = size.w;
    canvas.height = size.h;
    paintPlate(canvas, p.id * 7919, kind);
    return canvas;
  }

  /* ---------- landing: crossfade carousel ---------- */

  var CAROUSEL_SIZES = [[900, 1125], [1280, 850], [820, 1100], [1000, 1000], [1300, 730]];
  var KINDS = ["nocturne", "votive", "still"];

  function carouselPool() {
    var slides = GALLERY.carousel || [];
    if (slides.length) return slides;
    // fallback: generative slides if the real carousel didn't load
    var pool = [];
    for (var i = 0; i < 24; i++) {
      pool.push({ url: null, seed: 50021 + i * 977, kind: KINDS[i % 3] });
    }
    return pool;
  }

  function renderLanding() {
    view.innerHTML = "";
    var wrap = document.createElement("div");
    wrap.className = "carousel";
    view.appendChild(wrap);

    var pool = carouselPool();
    var idx = 0;
    var current = null;
    carouselAlive = true;

    // Warm the browser cache for every real slide up front so crossfades never
    // fade in to a blank element while the photo is still downloading.
    pool.forEach(function (item) {
      if (item.url) { var pre = new Image(); pre.src = item.url; }
    });

    function makeSlide(item) {
      var el;
      if (item.url) {
        el = document.createElement("img");
        el.src = item.url;
        el.alt = "";
        if (item.w && item.h) { el.width = item.w; el.height = item.h; }
      } else {
        el = document.createElement("canvas");
        var size = CAROUSEL_SIZES[item.seed % CAROUSEL_SIZES.length];
        el.width = size[0];
        el.height = size[1];
        paintPlate(el, item.seed, item.kind);
      }
      el.className = "slide";
      return el;
    }

    function reveal(next) {
      if (!carouselAlive) return;
      wrap.appendChild(next);
      void next.offsetWidth; // commit initial opacity before transitioning
      next.classList.add("show");
      if (current) {
        var old = current;
        old.classList.remove("show");
        setTimeout(function () { old.remove(); }, 380);
      }
      current = next;
      carouselTimer = setTimeout(step, reduceMotion ? 4000 : DWELL);
    }

    function step() {
      if (!carouselAlive) return;
      var next = makeSlide(pool[idx]);
      idx = (idx + 1) % pool.length;
      // For photos, wait until the bitmap is decoded before crossfading in;
      // canvases (and browsers without decode()) reveal immediately.
      if (next.tagName === "IMG" && next.decode) {
        next.decode().then(function () { reveal(next); }, function () { reveal(next); });
      } else {
        reveal(next);
      }
    }
    step();
  }

  function stopCarousel() {
    carouselAlive = false;
    clearTimeout(carouselTimer);
  }

  /* ---------- project pages ---------- */

  function renderKicker(numeral, title) {
    var k = document.createElement("p");
    k.className = "kicker";
    if (numeral) {
      var n = document.createElement("span");
      n.className = "kicker-numeral";
      n.textContent = numeral;
      k.appendChild(n);
    }
    k.appendChild(document.createTextNode(title));
    view.appendChild(k);
  }

  function renderIntro(paragraphs) {
    if (!paragraphs || !paragraphs.length) return;
    var intro = document.createElement("div");
    intro.className = "project-intro";
    paragraphs.forEach(function (text) {
      var p = document.createElement("p");
      p.textContent = text;
      intro.appendChild(p);
    });
    view.appendChild(intro);
  }

  function addPiece(host, plate, kind, caption, layout, zoom) {
    var fig = document.createElement("figure");
    fig.className = "piece";
    fig.appendChild(mediaFor(plate, kind, layout));
    if (caption) {
      var cap = document.createElement("figcaption");
      cap.textContent = plate.title;
      fig.appendChild(cap);
    }
    // Mosaic frames open full-size on click; the title rides with the enlarged
    // image rather than under every tile, which is what keeps the grid dense.
    if (zoom) {
      fig.classList.add("zoomable");
      fig.tabIndex = 0;
      fig.setAttribute("role", "button");
      fig.setAttribute("aria-label", "Enlarge " + plate.title);
      fig.addEventListener("click", function () { openLightbox(zoom.plates, zoom.index); });
      fig.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openLightbox(zoom.plates, zoom.index);
        }
      });
    }
    host.appendChild(fig);
  }

  function seriesFor(slug) {
    for (var i = 0; i < SERIES.length; i++) if (SERIES[i].slug === slug) return SERIES[i];
    return null;
  }

  /* Grid pages: the work runs edge to edge and the nav retires on scroll.
   * Ephemera isn't a series, so it's named directly. */
  function isMosaicRoute(route) {
    if (route === "bible-belt/ephemera") return true;
    var s = seriesFor(route);
    return !!s && s.layout === "mosaic";
  }

  function renderProject(slug) {
    var s = seriesFor(slug);
    if (!s) return renderLanding();

    view.innerHTML = "";
    renderKicker(s.numeral, s.title);
    renderIntro(s.excerpt);

    var host = view;

    if (s.layout === "mosaic") {
      // Three tight columns of mixed frames — far less scrolling than the
      // two-column masonry, and titles move to the enlarged view on click.
      host = document.createElement("div");
      host.className = "mosaic";
      view.appendChild(host);
      s.plates.forEach(function (p, i) {
        addPiece(host, p, s.kind, false, "grid", { plates: s.plates, index: i });
      });
      armReveal(host);
      return;
    }

    if (s.layout === "grid") {
      // Masonry columns pack mixed portrait/landscape frames without gaps.
      host = document.createElement("div");
      host.className = "masonry";
      view.appendChild(host);
    }
    s.plates.forEach(function (p) { addPiece(host, p, s.kind, true, s.layout); });
  }

  /* ---------- portraits ----------------------------------------------
   * The section is people, not photographs. A session of more than one frame
   * is a collaboration and gets its own page; a lone frame was caught rather
   * than arranged, and those gather under Places and Faces.
   * ------------------------------------------------------------------- */

  function portraitGroups() {
    var s = seriesFor("portraits");
    if (!s) return { sessions: [], singles: [] };
    var order = [], by = {};
    (s.plates || []).forEach(function (p) {
      var k = p.session || "—";
      if (!by[k]) { by[k] = []; order.push(k); }
      by[k].push(p);
    });
    var sessions = [], singles = [];
    order.forEach(function (k) {
      var g = { name: k, plates: by[k] };
      (by[k].length > 1 ? sessions : singles).push(g);
    });
    return { sessions: sessions, singles: singles };
  }

  /* A frame whose box is the right shape BEFORE the file arrives, so the page
   * never shifts as photographs load. */
  function shapedFrame(plate, cover, onClick) {
    var box = document.createElement("div");
    box.className = "shaped loading";
    box.style.aspectRatio = cover ? "4 / 5" : (plate.w + " / " + plate.h);
    var img = document.createElement("img");
    img.src = plate.thumb_url || plate.image_url;
    img.alt = plate.session || plate.title || "";
    img.loading = "lazy";
    img.decoding = "async";
    img.style.objectFit = cover ? "cover" : "contain";
    img.addEventListener("load", done);
    img.addEventListener("error", done);
    function done() { img.classList.add("ready"); box.classList.remove("loading"); }
    if (img.complete) done();
    box.appendChild(img);
    if (onClick) {
      box.tabIndex = 0;
      box.setAttribute("role", "button");
      box.addEventListener("click", onClick);
      box.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); }
      });
    }
    return box;
  }

  /* index: one cover per person */
  function renderPortraits() {
    var s = seriesFor("portraits");
    view.innerHTML = "";
    renderKicker(s.numeral, s.title);
    renderIntro(s.excerpt);

    var tabs = portraitTabs("sessions");
    if (tabs) view.appendChild(tabs);

    var groups = portraitGroups().sessions;
    var host = document.createElement("div");
    host.className = "sess-index";
    view.appendChild(host);

    groups.forEach(function (g, i) {
      var card = document.createElement("div");
      card.className = "sess-card";
      card.appendChild(shapedFrame(g.plates[0], true, function () {
        location.hash = "#/portraits/s/" + i;
      }));
      var who = document.createElement("p");
      who.className = "sess-who";
      who.textContent = g.name;
      var n = document.createElement("p");
      n.className = "sess-count";
      n.textContent = g.plates.length + (g.plates.length === 1 ? " photograph" : " photographs");
      card.appendChild(who);
      card.appendChild(n);
      host.appendChild(card);
    });

    armReveal(host);          // same rise as every other section
  }

  /* one person's shoot */
  function renderSession(i) {
    var groups = portraitGroups().sessions;
    var g = groups[i];
    if (!g) return renderPortraits();

    view.innerHTML = "";
    var crumb = document.createElement("p");
    crumb.className = "crumb";
    var back = document.createElement("a");
    back.href = "#/portraits";
    back.textContent = "\u2190 All sessions";
    crumb.appendChild(back);
    view.appendChild(crumb);

    var h = document.createElement("h1");
    h.className = "sess-head";
    h.textContent = g.name;
    view.appendChild(h);

    var host = document.createElement("div");
    host.className = "mosaic";
    view.appendChild(host);
    g.plates.forEach(function (p, n) {
      addPiece(host, p, "still", false, "grid", { plates: g.plates, index: n });
    });
    armReveal(host);
  }

  /* the frames that were caught rather than arranged */
  function renderPlacesAndFaces() {
    view.innerHTML = "";
    renderKicker("III", "Portraits / Places and Faces");
    renderIntro(["Portraits caught in events and in daily life rather than arranged — " +
      "people met once, photographed where they stood. Less intimate than a session, " +
      "and kept apart from them for that reason."]);

    var tabs2 = portraitTabs("places");
    if (tabs2) view.appendChild(tabs2);

    var singles = portraitGroups().singles;
    var host = document.createElement("div");
    host.className = "mosaic";
    view.appendChild(host);

    var plates = singles.map(function (g) { return g.plates[0]; });
    plates.forEach(function (p, i) {
      addPiece(host, p, "still", false, "grid", { plates: plates, index: i });
    });
    armReveal(host);
  }

  /* ---------- in passing (video) ---------- */

  function renderInPassing() {
    view.innerHTML = "";
    var data = GALLERY.inPassing || {};
    renderKicker("V", "In Passing");
    renderIntro(data.excerpt);

    var clips = data.clips || [];
    if (!clips.length) {
      var note = document.createElement("p");
      note.className = "empty-note";
      note.textContent = "Films coming soon.";
      view.appendChild(note);
      return;
    }

    /* A contact sheet, not a wall of playing video: still frames in the same
     * mosaic as the photographs, so the section reads as part of the site and
     * a visitor downloads only the clip they choose — one file instead of the
     * 31MB the whole set weighs. Clicking hands that clip the whole screen. */
    var host = document.createElement("div");
    host.className = "mosaic";
    view.appendChild(host);

    clips.forEach(function (clip, i) {
      var fig = document.createElement("figure");
      fig.className = "piece zoomable clip";
      fig.tabIndex = 0;
      fig.setAttribute("role", "button");
      fig.setAttribute("aria-label", "Play " + clip.title);

      var img = document.createElement("img");
      img.className = "shot";
      img.src = clip.poster;
      img.alt = clip.title;
      if (clip.w && clip.h) { img.width = clip.w; img.height = clip.h; }
      img.loading = i < 6 ? "eager" : "lazy";
      img.decoding = "async";
      img.onload = img.onerror = function () { img.classList.add("loaded"); };
      if (img.complete) img.classList.add("loaded");

      var cue = document.createElement("span");
      cue.className = "clip-cue";
      var cap = document.createElement("figcaption");
      cap.className = "clip-title";
      cap.textContent = clip.title;

      fig.appendChild(img);
      fig.appendChild(cue);
      fig.appendChild(cap);
      fig.addEventListener("click", function () { openCine(clips, i, fig); });
      fig.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openCine(clips, i, fig); }
      });
      host.appendChild(fig);
    });

    armReveal(host);
  }

  function renderEphemera() {
    view.innerHTML = "";
    var data = GALLERY.ephemera || {};
    renderKicker("", "Bible Belt / View Ephemera");
    renderIntro(data.headline ? [data.headline] : []);

    var plates = data.plates || [];
    if (!plates.length) {
      var note = document.createElement("p");
      note.className = "empty-note";
      note.textContent = "Ephemera coming soon.";
      view.appendChild(note);
      return;
    }
    // Same mosaic as Bible Belt itself — Ephemera is part of that project, so
    // it reads the same way: a dense wall, titles in the enlarged view.
    var host = document.createElement("div");
    host.className = "mosaic";
    view.appendChild(host);
    plates.forEach(function (p, i) {
      addPiece(host, p, "nocturne", false, "grid", { plates: plates, index: i });
    });
    armReveal(host);
  }

  /* ---------- about ---------- */

  function focusContactForm() {
    var f = document.getElementById("inquiry-form");
    if (f) f.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  function renderAbout() {
    view.innerHTML =
      '<div class="about">' +
      '  <div class="about-head">' +
      '    <figure class="about-portrait">' +
      '      <img src="media/about/portrait.jpg" alt="Brenden Cavazos" width="606" height="900" />' +
      '    </figure>' +
      '    <div class="about-lede">' +
      '      <h1 class="about-name">Brenden Cavazos <span>| oilandaltar</span></h1>' +
      '      <p>Texas Panhandle native and traveling documentary photographer working in night photography, portraiture, and urban exploration, centered on gothic architecture and the American Bible Belt.</p>' +
      '      <p>Background in content strategy, analytics, supply chain and merchandising at Fortune 1 scale. Fluent in both the creative and operational sides of building a body of work and getting it seen.</p>' +
      '    </div>' +
      '  </div>' +
      '  <h2 class="about-sub"><span class="kicker-numeral">01</span>What Oil and Altar is</h2>' +
      '  <p class="about-statement">Oil and Altar takes its name from the two things sitting at the center of the work: oil, the grit, grain, and rust of a place left to weather on its own while altar, is the sacred spaces built to hold belief in a region defined by it. The project moves between the two without resolving the tension: churches lit against the dark, roadside signage preaching salvation next to buildings falling into ruin, portraits held in the same exposure stillness as an abandoned house. It’s an ongoing documentary practice, not a single series, a way of looking at the American South that treats decay and devotion as part of the same picture, and leaves the interpretation to whoever’s looking.</p>' +
      '  <h2 class="about-sub"><span class="kicker-numeral">02</span>Education</h2>' +
      '  <p class="about-edu">Bachelor of Science in Digital Marketing, Purdue University, 2023</p>' +
      '  <h2 class="about-sub"><span class="kicker-numeral">03</span>Contact</h2>' +
      '  <ul class="about-contact">' +
      '    <li><a href="mailto:Brenden.cavazos@gmail.com">Brenden.cavazos@gmail.com</a></li>' +
      '    <li><a href="https://www.instagram.com/oilandaltar/" rel="noopener" target="_blank">instagram.com/oilandaltar</a></li>' +
      '  </ul>' +
      '  <form id="inquiry-form" novalidate>' +
      "    <label><span>NAME</span><input name=\"name\" type=\"text\" required maxlength=\"200\" autocomplete=\"name\" /></label>" +
      "    <label><span>EMAIL</span><input name=\"email\" type=\"email\" required autocomplete=\"email\" /></label>" +
      "    <label><span>MESSAGE</span><textarea name=\"message\" rows=\"5\" required maxlength=\"5000\"></textarea></label>" +
      // Subject line for Formspree's notification email. (No _gotcha honeypot —
      // browser autofill fills hidden fields and gets real messages flagged spam;
      // Formspree does its own spam filtering server-side.)
      '    <input type="hidden" name="_subject" value="New inquiry from oilandaltar.com" />' +
      "    <button type=\"submit\">Send</button>" +
      '    <p id="form-status" role="status"></p>' +
      "  </form>" +
      "</div>";

    var form = document.getElementById("inquiry-form");
    var status = document.getElementById("form-status");

    function fail(res) {
      status.classList.add("error");
      // Surface a Formspree validation message when there is one; else point to email.
      var generic = "Couldn’t send — email Brenden.cavazos@gmail.com instead.";
      if (!res || !res.json) { status.textContent = generic; return; }
      res.json().then(function (data) {
        var errs = data && data.errors;
        status.textContent = errs && errs.length
          ? errs.map(function (x) { return x.message; }).join(" ")
          : generic;
      }).catch(function () { status.textContent = generic; });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      status.classList.remove("error");
      status.textContent = "Sending…";
      fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form)
      })
        .then(function (res) {
          if (res.ok) {
            form.reset();
            status.textContent = "Thank you — your message is on its way.";
          } else {
            fail(res);
          }
        })
        .catch(function () { fail(null); });
    });

    // Arrived here via the corner email icon → drop the reader at the form.
    if (scrollToForm) { scrollToForm = false; focusContactForm(); }
  }

  /* ================================================================
   * router + nav state
   * ================================================================ */

  var pjPanel = document.getElementById("pj-panel");
  var pjToggle = document.getElementById("pj-toggle");

  function setPanel(open) {
    pjPanel.classList.toggle("open", open);
    pjToggle.classList.toggle("open", open);
    pjToggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  /* Phones: six sections plus two icons cannot sit across a 390px bar, so the
   * links move into a sheet behind a Menu button. Desktop keeps the bar. */
  var menuBtn = document.getElementById("menu-btn");
  var sheet = document.getElementById("sheet");

  function setSheet(open) {
    sheet.classList.toggle("open", open);
    menuBtn.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
  }
  menuBtn.addEventListener("click", function (e) { e.stopPropagation(); setSheet(!sheet.classList.contains("open")); });

  /* Curated Projects inside the sheet, same disclosure as the desktop panel. */
  var sheetCp = document.getElementById("sheet-cp");
  var sheetCpMenu = document.getElementById("sheet-cp-menu");
  function setSheetGroup(open) {
    sheetCpMenu.classList.toggle("open", open);
    sheetCp.classList.toggle("open", open);
    sheetCp.setAttribute("aria-expanded", open ? "true" : "false");
  }
  sheetCp.addEventListener("click", function (e) {
    e.stopPropagation();
    setSheetGroup(!sheetCpMenu.classList.contains("open"));
  });
  sheet.addEventListener("click", function (e) { if (e.target === sheet) setSheet(false); });
  sheet.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { setSheet(false); });
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setSheet(false); });

  pjToggle.addEventListener("click", function (e) {
    e.stopPropagation();
    setPanel(!pjPanel.classList.contains("open"));
  });
  // anywhere else closes it
  document.addEventListener("click", function () { setPanel(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setPanel(false); });

  // Corner email icon → About page, landed on the contact form.
  var contactIcon = document.querySelector('.social a[data-contact]');
  if (contactIcon) {
    contactIcon.addEventListener("click", function () {
      scrollToForm = true;
      // Already on About? No hashchange fires, so scroll now.
      if (currentRoute() === "about") { scrollToForm = false; focusContactForm(); }
    });
  }

  function setNav(route) {
    document.querySelectorAll("[data-route]").forEach(function (a) {
      var r = a.dataset.route;
      a.classList.toggle("active", r === route || route.indexOf(r + "/") === 0);
    });
    // Projects reads as current whenever you are inside one of its projects.
    var inProjects = route === "abandoned-america" ||
                     route === "bible-belt" || route.indexOf("bible-belt/") === 0;
    pjToggle.classList.toggle("active", inProjects);
    sheetCp.classList.toggle("active", inProjects);
    if (inProjects) setSheetGroup(true);
    setPanel(false);          // navigating always closes the panel
    // Portraits reads as current anywhere inside it, sessions included
    document.querySelector('[data-route="portraits"]')
      .classList.toggle("active", route.indexOf("portraits") === 0);
    setSheet(false);
  }

  function currentRoute() {
    return location.hash.replace(/^#\/?/, "").replace(/\/+$/, "");
  }

  function renderRoute() {
    stopCarousel();
    closeLightbox();
    closeCine();
    var route = currentRoute();
    setNav(route);
    window.scrollTo(0, 0);

    // Grid pages bleed to the edges; every page starts with the nav in view.
    document.body.classList.toggle("bleed", isMosaicRoute(route));
    bar.classList.remove("away");
    lastY = 0;
    // The landing carousel gets no top scrim — nothing scrolls under it there.
    document.body.classList.toggle("home", route === "");

    if (route === "in-passing") renderInPassing();
    else if (route === "portraits") renderPortraits();
    else if (route === "portraits/places-and-faces") renderPlacesAndFaces();
    else if (route.indexOf("portraits/s/") === 0) renderSession(parseInt(route.slice(12), 10));
    else if (route === "about") renderAbout();
    else if (route === "bible-belt/ephemera") renderEphemera();
    else if (route === "") renderLanding();
    else renderProject(route);

    var titles = {
      "": "Oil & Altar",
      "bible-belt": "Oil & Altar — Bible Belt",
      "bible-belt/ephemera": "Oil & Altar — View Ephemera",
      "abandoned-america": "Oil & Altar — Abandoned America",
      "portraits": "Oil & Altar — Portraits",
      "portraits/places-and-faces": "Oil & Altar — Places and Faces",
      "wanderings": "Oil & Altar — Wanderings",
      "in-passing": "Oil & Altar — In Passing",
      "about": "Oil & Altar — About"
    };
    document.title = titles[route] || "Oil & Altar";
  }

  window.addEventListener("hashchange", renderRoute);

  /* Warm the cache with the top images of every section during idle time so
   * switching tabs shows the top of the page instantly instead of after a
   * download. Only the first few per series (above the fold) — the rest
   * lazy-load on scroll. Videos are never prefetched (too heavy). */
  function warmGallery() {
    var urls = [];
    (GALLERY.series || []).forEach(function (s) {
      (s.plates || []).slice(0, 8).forEach(function (p) {
        // Warm the file each layout will actually request: grids render from
        // the 900px thumbs, scroll pages from the full-size export.
        var u = s.layout === "scroll" ? p.image_url : (p.thumb_url || p.image_url);
        if (u) urls.push(u);
      });
    });
    var i = 0;
    var idle = window.requestIdleCallback || function (fn) { return setTimeout(fn, 200); };
    function next() {
      if (i >= urls.length) return;
      var img = new Image();
      img.onload = img.onerror = function () { idle(next); };
      img.src = urls[i++];
    }
    idle(next);
  }

  var revealSupported = window.CSS && CSS.supports && CSS.supports("animation-timeline: view()");
  var revealWatchdog = null;
  var revealBroken = false;   // sticky once detected

  function armReveal(host) {
    var tiles = Array.prototype.slice.call(host.children);
    if (!tiles.length) return;

    // First screenful loads eagerly — lazy-loading a frame that is already on
    // screen is what makes a grid look empty on arrival.
    tiles.slice(0, 9).forEach(function (fig) {
      var img = fig.querySelector("img");
      if (!img) return;
      img.loading = "eager";
      img.setAttribute("fetchpriority", "high");
    });

    if (revealWatchdog) { revealWatchdog.disconnect(); revealWatchdog = null; }

    /* Once we have learned the CSS timeline does not drive these tiles, stay on
     * the observer. Re-testing on every page meant each new section sat blank
     * for the half-second the watchdog took to decide again, so the frames
     * snapped in rather than rising — which is why Bible Belt animated and the
     * sections you opened after it did not. */
    if (reduceMotion || !revealSupported || revealBroken) { jsReveal(tiles); return; }
    document.documentElement.classList.remove("js-reveal");

    revealWatchdog = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        setTimeout(function () {
          if (document.documentElement.classList.contains("js-reveal")) return;
          var r = el.getBoundingClientRect();
          var onScreen = r.top < window.innerHeight * 0.85 && r.bottom > 0;
          if (onScreen && parseFloat(getComputedStyle(el).opacity) < 0.05) jsReveal(tiles);
        }, 500);
      });
    }, { threshold: 0.5 });
    tiles.forEach(function (f) { revealWatchdog.observe(f); });

    // last resort: nothing stays invisible
    setTimeout(function () {
      tiles.forEach(function (f) {
        var r = f.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0 &&
            parseFloat(getComputedStyle(f).opacity) < 0.05) f.classList.add("shown");
      });
    }, 1500);
  }

  function jsReveal(tiles) {
    revealBroken = true;
    document.documentElement.classList.add("js-reveal");
    if (revealWatchdog) { revealWatchdog.disconnect(); revealWatchdog = null; }
    if (reduceMotion) {
      tiles.forEach(function (f) { f.classList.add("shown"); });
      return;
    }
    /* Let the browser paint the hidden state before anything is revealed.
     * An observer reports tiles that are already on screen almost immediately,
     * so without this the class lands in the same frame the tiles were created
     * in — there is no previous state to transition from and they simply
     * appear. Two frames is the reliable way to say "after the next paint".
     *
     * This is why Bible Belt animated and the sections opened after it did not:
     * on the first page the watchdog delayed this path by half a second, which
     * happened to give the hidden state time to paint. */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            e.target.classList.add("shown");
            io.unobserve(e.target);
          });
        }, { rootMargin: "120px 0px", threshold: 0 });
        tiles.forEach(function (f) { io.observe(f); });
      });
    });
  }

  /* ================================================================
   * collapsing identity block on the grid pages
   * ================================================================ */

  var bar = document.getElementById("bar");
  var lastY = 0;
  var ticking = false;
  /* Far enough in that the bar does not twitch while you are still at the top. */
  var HIDE_AFTER = 200;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      ticking = false;
      var y = window.pageYOffset || document.documentElement.scrollTop;
      // Down past the opening retires it; any upward move brings it back.
      if (y > HIDE_AFTER && y > lastY + 4) { bar.classList.add("away"); setPanel(false); }
      else if (y < lastY - 4 || y <= HIDE_AFTER) bar.classList.remove("away");
      lastY = y;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });

  /* ================================================================
   * portraits tabs
   *
   * Sessions and Places and Faces sit on the page, not in the top bar. Three
   * photographs should not hold a slot in a navigation a visitor scans before
   * they know anything — and tabs show both rooms at once, so neither can be
   * mistaken for the whole section.
   * ================================================================ */

  /* the on-page switch, for mode 2 */
  function portraitTabs(current) {
    var wrap = document.createElement("div");
    wrap.className = "ptabs";
    [["#/portraits", "Sessions", "sessions"],
     ["#/portraits/places-and-faces", "Places and Faces", "places"]].forEach(function (t) {
      var a = document.createElement("a");
      a.href = t[0];
      a.textContent = t[1];
      if (t[2] === current) a.className = "on";
      wrap.appendChild(a);
    });
    return wrap;
  }

  /* ================================================================
   * lightbox — click a mosaic frame to see it full-size with its title
   * ================================================================ */

  var lb = null;          // the overlay element, built once and reused
  var lbPlates = [];
  var lbIndex = 0;
  var lbReturnTo = null;  // element that opened it, refocused on close
  var lbPending = null;   // pending decode-then-swap
  var lbToken = 0;        // invalidates a swap superseded by a later press
  var SWIPE_MIN = 48;     // px of travel before a drag counts as a swipe

  function buildLightbox() {
    lb = document.createElement("div");
    lb.className = "lightbox";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.hidden = true;
    lb.innerHTML =
      '<button type="button" class="lb-close" aria-label="Close">&#215;</button>' +
      '<div class="lb-stage"><img class="lb-img" alt=""></div>' +
      '<div class="lb-meta">' +
        '<button type="button" class="lb-nav lb-prev" aria-label="Previous photo">&#8249;</button>' +
        '<div class="lb-meta-text">' +
          '<p class="lb-title"></p>' +
          '<p class="lb-count"></p>' +
        '</div>' +
        '<button type="button" class="lb-nav lb-next" aria-label="Next photo">&#8250;</button>' +
      '</div>' +
      // Shown once per visitor, on touch devices only — see maybeShowHint().
      '<div class="lb-hint" hidden>' +
        '<svg class="lb-hand" viewBox="0 0 92 56" aria-hidden="true">' +
          '<g class="glyph" fill="none" stroke="currentColor" stroke-width="2.2" ' +
              'stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M14 28h-7m3-4-4 4 4 4"/>' +
            '<path d="M78 28h7m-3-4 4 4-4 4"/>' +
            '<path d="M46 44V26m0 0v-9a3 3 0 0 1 6 0v9m0 0v-5a3 3 0 0 1 6 0v5m0 0v-3a3 3 0 0 1 6 0v12' +
              'a12 12 0 0 1-12 12h-4a10 10 0 0 1-8-4l-6-8a3.2 3.2 0 0 1 5-4l3 3"/>' +
          '</g>' +
        '</svg>' +
        '<p class="lb-hint-say">Swipe to browse</p>' +
        '<p class="lb-hint-sub">Tap anywhere to dismiss</p>' +
      '</div>';

    lb.querySelector(".lb-close").addEventListener("click", closeLightbox);
    lb.querySelector(".lb-prev").addEventListener("click", function (e) { e.stopPropagation(); stepLightbox(-1); });
    lb.querySelector(".lb-next").addEventListener("click", function (e) { e.stopPropagation(); stepLightbox(1); });
    // Clicking the backdrop closes; clicking the photo itself does not.
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });

    var hint = lb.querySelector(".lb-hint");
    hint.addEventListener("click", function (e) { e.stopPropagation(); dismissHint(); });
    hint.addEventListener("touchstart", dismissHint, { passive: true });

    /* Swipe, where there is a finger to swipe with. A gesture counts only if it
     * travels far enough horizontally AND is more horizontal than vertical, so
     * scrolling never reads as a swipe. Left goes forward, as in every photo app. */
    var sx = 0, sy = 0, tracking = false;
    lb.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) { tracking = false; return; }
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; tracking = true;
    }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (!tracking) return;
      tracking = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy)) return;
      dismissHint();
      stepLightbox(dx < 0 ? 1 : -1);
    }, { passive: true });

    document.body.appendChild(lb);
  }

  /* ---- one-time swipe hint -------------------------------------------
   * Appears the first time a visitor opens a photo on a touch device, then
   * never again — remembered in localStorage, so it returns if they clear
   * site data. Pointer users never see it: they have arrows and arrow keys. */
  var HINT_KEY = "oa-swipe-hint-seen";
  var hintTimer = null;

  function canSwipe() {
    return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  }
  function hintSeen() {
    try { return localStorage.getItem(HINT_KEY) === "1"; } catch (e) { return false; }
  }
  function maybeShowHint() {
    if (!lb || !canSwipe() || hintSeen() || lbPlates.length < 2) return;
    var hint = lb.querySelector(".lb-hint");
    hint.hidden = false;
    requestAnimationFrame(function () { hint.classList.add("show"); });
    hintTimer = setTimeout(dismissHint, 3800);
  }
  function dismissHint() {
    if (!lb) return;
    var hint = lb.querySelector(".lb-hint");
    if (hint.hidden) return;
    clearTimeout(hintTimer);
    try { localStorage.setItem(HINT_KEY, "1"); } catch (e) {}
    hint.classList.remove("show");
    var done = function () { hint.hidden = true; };
    reduceMotion ? done() : setTimeout(done, 300);
  }

  function showLightboxPlate() {
    var p = lbPlates[lbIndex];
    var img = lb.querySelector(".lb-img");
    img.src = p.image_url;
    img.alt = p.title;
    lb.querySelector(".lb-title").textContent = p.title;
    lb.querySelector(".lb-count").textContent = (lbIndex + 1) + " / " + lbPlates.length;
    var many = lbPlates.length > 1;
    lb.querySelector(".lb-prev").hidden = !many;
    lb.querySelector(".lb-next").hidden = !many;
  }

  function openLightbox(plates, index) {
    if (!lb) buildLightbox();
    lbPlates = plates;
    lbIndex = index;
    lbReturnTo = document.activeElement;
    showLightboxPlate();
    lb.hidden = false;
    document.body.classList.add("lb-open");   // freeze the page behind it
    lb.querySelector(".lb-close").focus();
    document.addEventListener("keydown", lightboxKeys);
    maybeShowHint();
  }

  function closeLightbox() {
    if (!lb || lb.hidden) return;
    dismissHint();
    clearTimeout(lbPending);
    lbPending = null;
    lbToken++;
    lb.classList.remove("stepping");
    lb.hidden = true;
    lb.querySelector(".lb-img").src = "";
    document.body.classList.remove("lb-open");
    document.removeEventListener("keydown", lightboxKeys);
    if (lbReturnTo && lbReturnTo.focus) lbReturnTo.focus();
  }

  /* Decode the next photo off-screen before swapping it in, so a
   * half-painted frame can never appear over the one it replaces. A second
   * press supersedes the first rather than stacking on it, and a timeout
   * guarantees a slow file never leaves the view empty. */
  function stepLightbox(delta) {
    if (!lbPlates.length) return;
    var next = (lbIndex + delta + lbPlates.length) % lbPlates.length;
    lbIndex = next;

    if (reduceMotion) { showLightboxPlate(); return; }

    var mine = ++lbToken;
    clearTimeout(lbPending);
    lb.classList.add("stepping");

    var pre = new Image();
    pre.src = lbPlates[next].image_url;
    var show = function () {
      if (mine !== lbToken) return;
      showLightboxPlate();
      lb.classList.remove("stepping");
    };
    if (pre.decode) pre.decode().then(show).catch(show);
    else pre.onload = pre.onerror = show;
    lbPending = setTimeout(show, 700);
  }

  function lightboxKeys(e) {
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowLeft") stepLightbox(-1);
    else if (e.key === "ArrowRight") stepLightbox(1);
  }

  /* ================================================================
   * cinema — one clip, the whole screen, on black
   *
   * Separate from the photo lightbox because video needs what a still does
   * not: play state, sound, and stopping the download on close. It borrows
   * that one's controls exactly — arrows, swipe, Esc — so nothing new has to
   * be learned moving between sections.
   * ================================================================ */

  var cine = null;
  var cineClips = [];
  var cineIndex = 0;
  var cineReturnTo = null;
  var cineWantSound = true;
  var cineStep = null;

  function buildCine() {
    cine = document.createElement("div");
    cine.className = "cine";
    cine.setAttribute("role", "dialog");
    cine.setAttribute("aria-modal", "true");
    cine.hidden = true;
    cine.innerHTML =
      '<button type="button" class="cine-close" aria-label="Close">&#215;</button>' +
      '<button type="button" class="cine-sound">Sound off</button>' +
      '<div class="cine-stage"></div>' +
      '<div class="cine-meta">' +
        '<button type="button" class="cine-nav cine-prev" aria-label="Previous clip">&#8249;</button>' +
        '<div class="cine-text"><p class="cine-title"></p><p class="cine-count"></p></div>' +
        '<button type="button" class="cine-nav cine-next" aria-label="Next clip">&#8250;</button>' +
      '</div>';

    cine.querySelector(".cine-close").addEventListener("click", closeCine);
    cine.querySelector(".cine-prev").addEventListener("click", function (e) { e.stopPropagation(); stepCine(-1); });
    cine.querySelector(".cine-next").addEventListener("click", function (e) { e.stopPropagation(); stepCine(1); });
    cine.querySelector(".cine-sound").addEventListener("click", function (e) {
      e.stopPropagation();
      cineWantSound = !cineWantSound;
      var v = cine.querySelector("video");
      if (v) v.muted = !cineWantSound;
      paintCineSound();
    });
    // the black surround closes; the clip itself pauses
    cine.addEventListener("click", function (e) {
      if (e.target === cine || e.target.className === "cine-stage") closeCine();
    });
    cine.querySelector(".cine-stage").addEventListener("click", function (e) {
      if (e.target.tagName !== "VIDEO") return;
      if (e.target.paused) { var p = e.target.play(); if (p) p.catch(function () {}); }
      else e.target.pause();
    });

    /* swipe, where there is a finger — same threshold as the photographs */
    var sx = 0, sy = 0, tracking = false;
    cine.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) { tracking = false; return; }
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; tracking = true;
    }, { passive: true });
    cine.addEventListener("touchend", function (e) {
      if (!tracking) return;
      tracking = false;
      var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy)) return;
      stepCine(dx < 0 ? 1 : -1);
    }, { passive: true });

    document.body.appendChild(cine);
  }

  function paintCineSound() {
    cine.querySelector(".cine-sound").textContent = cineWantSound ? "Sound on" : "Sound off";
  }

  function mountCine(i) {
    var stage = cine.querySelector(".cine-stage");
    var old = stage.querySelector("video");
    if (old) { old.pause(); old.removeAttribute("src"); old.load(); old.remove(); }

    var c = cineClips[i];
    var v = document.createElement("video");
    v.src = c.src;
    if (c.poster) v.poster = c.poster;
    v.playsInline = true;
    v.setAttribute("playsinline", "");
    v.preload = "auto";
    v.muted = !cineWantSound;
    if (c.w && c.h) { v.width = c.w; v.height = c.h; }
    stage.appendChild(v);

    cine.querySelector(".cine-title").textContent = c.title;
    cine.querySelector(".cine-count").textContent = (i + 1) + " / " + cineClips.length;

    /* They asked for this clip, so try it with sound. Autoplay rules refuse
     * that in plenty of situations — fall back to muted rather than leaving a
     * frozen frame, and let the button turn it on. */
    var p = v.play();
    if (p) p.catch(function () {
      v.muted = true; cineWantSound = false; paintCineSound();
      var q = v.play(); if (q) q.catch(function () {});
    });
    paintCineSound();
  }

  function openCine(clips, i, fig) {
    if (!cine) buildCine();
    cineClips = clips; cineIndex = i; cineReturnTo = fig || null;
    cine.hidden = false;
    requestAnimationFrame(function () { cine.classList.add("show"); });
    document.body.classList.add("lb-open");
    document.addEventListener("keydown", cineKeys);
    mountCine(i);
    cine.querySelector(".cine-close").focus();
  }

  function closeCine() {
    if (!cine || cine.hidden) return;
    clearTimeout(cineStep);
    cine.classList.remove("show", "stepping");
    var v = cine.querySelector("video");
    // stop the download, not just the playback
    if (v) { v.pause(); v.removeAttribute("src"); v.load(); v.remove(); }
    document.body.classList.remove("lb-open");
    document.removeEventListener("keydown", cineKeys);
    var done = function () { cine.hidden = true; };
    reduceMotion ? done() : setTimeout(done, 260);
    if (cineReturnTo) cineReturnTo.focus();
  }

  function stepCine(delta) {
    if (!cineClips.length) return;
    cineIndex = (cineIndex + delta + cineClips.length) % cineClips.length;
    if (reduceMotion) { mountCine(cineIndex); return; }
    clearTimeout(cineStep);
    cine.classList.add("stepping");
    cineStep = setTimeout(function () {
      mountCine(cineIndex);
      cine.classList.remove("stepping");
    }, 170);
  }

  function cineKeys(e) {
    if (e.key === "Escape") closeCine();
    else if (e.key === "ArrowLeft") stepCine(-1);
    else if (e.key === "ArrowRight") stepCine(1);
    else if (e.key === " ") {
      e.preventDefault();
      var v = cine.querySelector("video");
      if (v) { if (v.paused) { var p = v.play(); if (p) p.catch(function () {}); } else v.pause(); }
    }
  }

  /* ================================================================
   * boot — gallery data is embedded (gallery-data.js), so render directly.
   * ================================================================ */

  renderRoute();
  warmGallery();
})();
