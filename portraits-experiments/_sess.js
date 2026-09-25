/* Shared by both session variants.
   Builds a frame whose box is the right shape before the photograph lands. */
function frame(p, onClick, cover) {
  var box = document.createElement("div");
  box.className = "frame loading";
  box.style.aspectRatio = (cover ? "4 / 5" : p.w + " / " + p.h);
  var img = document.createElement("img");
  img.src = p.thumb;
  img.alt = p.session;
  img.loading = "lazy";
  img.decoding = "async";
  img.style.objectFit = cover ? "cover" : "contain";
  img.addEventListener("load", function () { img.classList.add("ready"); box.classList.remove("loading"); });
  if (img.complete) { img.classList.add("ready"); box.classList.remove("loading"); }
  box.appendChild(img);
  if (onClick) box.addEventListener("click", onClick);
  return box;
}
