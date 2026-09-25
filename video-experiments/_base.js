/* Shared scaffolding for the In Passing experiments — NOT part of the site.
 * Reads the real clip list and points at the real mp4s; nothing is re-encoded. */
function clips() {
  var ip = (window.GALLERY || {}).inPassing || {};
  return (ip.clips || []).map(function (c) {
    return {
      title: c.title, w: c.w, h: c.h,
      src: "../frontend/" + c.src,
      poster: "../frontend/" + c.poster,
      portrait: (c.w / c.h) < 0.9
    };
  });
}
/* A <video> set up the way mobile browsers actually require: muted and
 * playsinline, or iOS refuses to autoplay and takes over the whole screen. */
function makeVideo(c, opts) {
  opts = opts || {};
  var v = document.createElement("video");
  v.src = c.src;
  v.poster = c.poster;
  v.muted = opts.muted !== false;
  v.loop = opts.loop !== false;
  v.playsInline = true;
  v.setAttribute("playsinline", "");
  v.preload = opts.preload || "none";
  if (opts.controls) v.controls = true;
  v.width = c.w; v.height = c.h;       // reserves the box: no layout shift
  return v;
}
/* Play only what is on screen. Eleven clips decoding at once is what makes a
 * page like this melt a laptop battery. */
function playWhenVisible(pairs, margin) {
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target.querySelector("video") || e.target;
      if (!v || v.tagName !== "VIDEO") return;
      if (e.isIntersecting) { v.preload = "auto"; var p = v.play(); if (p) p.catch(function () {}); }
      else v.pause();
    });
  }, { rootMargin: margin || "100px 0px", threshold: 0.25 });
  pairs.forEach(function (el) { io.observe(el); });
  return io;
}
