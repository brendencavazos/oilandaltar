/* Oil & Altar — Swiss-minimal portfolio (after brandnewalias.com).
 *
 * Hash-routed single page:
 *   #/                      landing — crossfade carousel (real photos, 1.5s)
 *   #/bible-belt            flagship project, continuous full-bleed scroll
 *   #/bible-belt/ephemera   View Ephemera — sub-section of Bible Belt
 *   #/abandoned-america     continuous scroll (Photography Portfolio)
 *   #/portraits             grouped by session (Photography Portfolio)
 *   #/wanderings            2-col grid (Photography Portfolio)
 *   #/in-passing            stacked 16:9 video bays (atmospheric clips)
 *   #/about                 bio, statement, contact + inquiry form
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

    // Portraits are grouped under session headers; other series are flat.
    if (s.layout === "sessions") return renderSessions(s);

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

  function renderSessions(s) {
    var host = null;
    var currentSession = null;
    s.plates.forEach(function (p) {
      if (p.session !== currentSession) {
        currentSession = p.session;
        var head = document.createElement("h2");
        head.className = "session-head";
        head.textContent = p.session;
        view.appendChild(head);
        host = document.createElement("div");
        host.className = "grid2";
        view.appendChild(host);
      }
      addPiece(host, p, s.kind, false, "grid");
    });
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

    var videos = [];
    clips.forEach(function (clip) {
      var wrap = document.createElement("figure");
      wrap.className = "bay-wrap";
      var bay = document.createElement("div");
      bay.className = "bay";
      if (clip.w && clip.h) {
        bay.style.aspectRatio = clip.w + " / " + clip.h;
        // Vertical clips: cap by viewport height instead of column width.
        if (clip.h > clip.w) {
          bay.style.maxWidth = "calc(78vh * " + (clip.w / clip.h).toFixed(4) + ")";
        }
      }

      var video = document.createElement("video");
      if (clip.poster) video.poster = clip.poster;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.controls = true;
      video.preload = "none";
      video.src = clip.src;
      bay.appendChild(video);
      videos.push(video);

      wrap.appendChild(bay);
      var cap = document.createElement("figcaption");
      cap.textContent = clip.title;
      wrap.appendChild(cap);
      view.appendChild(wrap);
    });

    // Stream only what's on screen: play clips as they enter the viewport,
    // pause them on the way out. Without IO support, first clip autoplays.
    if ("IntersectionObserver" in window && !reduceMotion) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var v = entry.target;
          if (entry.isIntersecting) {
            var p = v.play();
            if (p && p.catch) p.catch(function () {});
          } else if (!v.paused) {
            v.pause();
          }
        });
      }, { threshold: 0.35 });
      videos.forEach(function (v) { io.observe(v); });
    }
  }

  /* ---------- view ephemera (sub-section of Bible Belt) ---------- */

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

  var bbMenu = document.getElementById("bb-menu");
  var bbToggle = document.getElementById("bb-toggle");
  var cpMenu = document.getElementById("cp-menu");
  var cpToggle = document.getElementById("cp-toggle");

  function setOpen(menu, toggle, open) {
    menu.classList.toggle("open", open);
    toggle.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  bbToggle.addEventListener("click", function () {
    setOpen(bbMenu, bbToggle, !bbMenu.classList.contains("open"));
  });

  // Curated Projects reveals Bible Belt and Abandoned America on click.
  cpToggle.addEventListener("click", function () {
    setOpen(cpMenu, cpToggle, !cpMenu.classList.contains("open"));
  });

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
    document.querySelectorAll("#nav a[data-route]").forEach(function (a) {
      var r = a.dataset.route;
      a.classList.toggle("active", r === route || route.indexOf(r + "/") === 0);
    });
    // View Ephemera is a subcategory of Bible Belt — expand it in-section,
    // collapse it elsewhere (a manual caret open persists until you navigate).
    var inBibleBelt = route === "bible-belt" || route.indexOf("bible-belt/") === 0;
    setOpen(bbMenu, bbToggle, inBibleBelt);

    // Curated Projects stays open while you're inside one of its projects, so
    // the page you're on is never hidden behind a collapsed group.
    var inCurated = inBibleBelt || route === "abandoned-america";
    if (inCurated) setOpen(cpMenu, cpToggle, true);
  }

  function currentRoute() {
    return location.hash.replace(/^#\/?/, "").replace(/\/+$/, "");
  }

  function renderRoute() {
    stopCarousel();
    closeLightbox();
    var route = currentRoute();
    setNav(route);
    window.scrollTo(0, 0);

    // Grid pages bleed to the edges; every page starts with the nav in view.
    document.body.classList.toggle("bleed", isMosaicRoute(route));
    document.body.classList.remove("nav-collapsed", "menu-open");
    lastY = 0;

    if (route === "in-passing") renderInPassing();
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

  /* ================================================================
   * mosaic reveal — frames rise into place as they enter the viewport
   *
   * Driven by CSS (animation-timeline: view()) where the browser supports it,
   * which costs no JavaScript at all. That has one real failure mode: .mosaic
   * is a multi-column container, so every tile is a FRAGMENTED box, and
   * fragmented boxes are poorly handled by view-based features — in testing
   * the second and third columns never advanced and sat invisible forever.
   *
   * So the CSS path is watched. A tile sitting well inside the viewport that
   * is still transparent half a second later proves the timeline isn't
   * driving it, and the whole page switches to the observer path. A final
   * sweep forces anything still hidden: a blank grid is never acceptable.
   * ================================================================ */

  var revealSupported = window.CSS && CSS.supports && CSS.supports("animation-timeline: view()");
  var revealWatchdog = null;

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

    document.documentElement.classList.remove("js-reveal");
    if (revealWatchdog) { revealWatchdog.disconnect(); revealWatchdog = null; }

    if (reduceMotion || !revealSupported) { jsReveal(tiles); return; }

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
    document.documentElement.classList.add("js-reveal");
    if (revealWatchdog) { revealWatchdog.disconnect(); revealWatchdog = null; }
    if (reduceMotion) {
      tiles.forEach(function (f) { f.classList.add("shown"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("shown");
        io.unobserve(e.target);
      });
    }, { rootMargin: "200px 0px", threshold: 0 });
    tiles.forEach(function (f) { io.observe(f); });
  }

  /* ================================================================
   * collapsing identity block on the grid pages
   * ================================================================ */

  var navToggle = document.getElementById("nav-toggle");
  var lastY = 0;
  var ticking = false;
  /* Past the statement, so the nav only retires once you're into the work. */
  var COLLAPSE_AFTER = 220;

  function setCollapsed(on) {
    if (on === document.body.classList.contains("nav-collapsed")) return;
    document.body.classList.toggle("nav-collapsed", on);
    if (on) {
      document.body.classList.remove("menu-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      ticking = false;
      var y = window.pageYOffset || document.documentElement.scrollTop;
      if (!document.body.classList.contains("bleed")) { lastY = y; return; }
      // Down past the statement hides it; any upward move brings it back.
      if (y > COLLAPSE_AFTER && y > lastY + 4) setCollapsed(true);
      else if (y < lastY - 4 || y <= COLLAPSE_AFTER) setCollapsed(false);
      lastY = y;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });

  navToggle.addEventListener("click", function () {
    var open = !document.body.classList.contains("menu-open");
    document.body.classList.toggle("menu-open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

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
   * boot — gallery data is embedded (gallery-data.js), so render directly.
   * ================================================================ */

  renderRoute();
  warmGallery();
})();
