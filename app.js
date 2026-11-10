(function () {
  var A = window.ATLAS, H = A.h, W = A.w;
  var LABELS = { city: "City", haven: "Haven", works: "Forts and works", road: "Road and station", ruin: "Ruin", land: "Land" };
  var bounds = [[0, 0], [H, W]];
  var map = L.map("map", { crs: L.CRS.Simple, minZoom: -4, maxZoom: 1.5, zoomSnap: 0.25, zoomDelta: 0.5, maxBoundsViscosity: 0.85, attributionControl: false });
  L.imageOverlay("map.jpg", bounds, { alt: "Painted map of Erwood" }).addTo(map);
  function fit() { map.fitBounds(bounds); map.setMinZoom(map.getZoom() - 0.25); map.setMaxBounds([[-120, -120], [H + 120, W + 120]]); }
  fit();
  var N = L.control({ position: "bottomleft" }); N.onAdd = function () { var e = L.DomUtil.create("div", "compass"); e.textContent = "N ↑  Distances are approximate"; return e; }; N.addTo(map);
  var groups = {}, markers = {}, on = {};
  Object.keys(LABELS).forEach(function (k) { groups[k] = L.layerGroup().addTo(map); on[k] = true; });
  function pt(x, y) { return [H - y, x]; }
  A.regions.forEach(function (r) { L.marker(pt(r[1], r[2]), { interactive: false, keyboard: false, icon: L.divIcon({ className: "", iconSize: [0, 0], html: '<span class="region">' + r[0] + "</span>" }) }).addTo(map); });
  A.places.forEach(function (p) {
    var minor = p.kind !== "city" && p.kind !== "haven";
    var el = '<div class="pin-wrap k-' + p.kind + " side-" + p.side + (minor ? " minor" : "") + '" data-id="' + p.id + '"><div class="pin"></div><div class="lbl">' + p.name + "</div></div>";
    var m = L.marker(pt(p.x, p.y), { title: p.name, alt: p.name, icon: L.divIcon({ className: "", iconSize: [0, 0], html: el }) });
    m.on("click", function () { location.hash = p.id; });
    m.addTo(groups[p.kind]); markers[p.id] = m;
  });
  var mapEl = document.getElementById("map");
  function compact() { mapEl.classList.toggle("compact", W * Math.pow(2, map.getZoom()) < 680); }
  map.on("zoomend", compact); compact();
  window.addEventListener("resize", function () { map.invalidateSize(); compact(); });
  var panel = document.getElementById("panel");
  function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  function setActive(id) { document.querySelectorAll(".pin-wrap").forEach(function (e) { e.classList.toggle("active", e.dataset.id === id); }); }
  function home() {
    setActive(null);
    var f = Object.keys(LABELS).map(function (k) { return '<button type="button" data-k="' + k + '" aria-pressed="' + on[k] + '">' + LABELS[k] + "</button>"; }).join("");
    var list = A.places.filter(function (p) { return on[p.kind]; }).slice().sort(function (a, b) { return a.name.replace(/^The /, "").localeCompare(b.name.replace(/^The /, "")); }).map(function (p) { return '<li><button type="button" data-id="' + p.id + '">' + esc(p.name) + "<span>" + LABELS[p.kind] + "</span></button></li>"; }).join("");
    panel.innerHTML = '<h1>Erwood Atlas</h1><p class="intro">The floating cities, havens, mines and ruins of Erwood. Select a place on the map, or from the list.</p><p class="intro"><a href="primer/">Read the player primer</a> &nbsp;·&nbsp; <a href="dangers/">Dangers of the Green</a></p><div class="filters" role="group" aria-label="Show on map">' + f + '</div><ul class="places">' + list + "</ul>";
    panel.scrollTop = 0;
    panel.querySelectorAll(".filters button").forEach(function (b) { b.onclick = function () { var k = b.dataset.k; on[k] = !on[k]; if (on[k]) groups[k].addTo(map); else map.removeLayer(groups[k]); home(); }; });
    panel.querySelectorAll(".places button").forEach(function (b) { b.onclick = function () { location.hash = b.dataset.id; }; });
  }
  function show(p) {
    setActive(p.id);
    var secs = p.sections.map(function (s, i) {
      var title = (p.sections.length > 1 || s.title !== p.name) ? "<h3>" + esc(s.title) + "</h3>" : "";
      return "<figure>" + (s.img ? '<img src="' + s.img + '" width="1600" height="1200" alt="Painting of ' + esc(s.title) + '"' + (i ? ' loading="lazy"' : "") + ">" : "") + "<figcaption>" + title + "<p>" + esc(s.text) + "</p></figcaption></figure>";
    }).join("");
    var r = p.routes.length ? '<h4>Getting there</h4><ul class="routes">' + p.routes.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "";
    panel.innerHTML = '<button type="button" class="back">← All places</button><p class="kind">' + LABELS[p.kind] + "</p><h2>" + esc(p.name) + "</h2>" + secs + r;
    panel.scrollTop = 0;
    panel.querySelector(".back").onclick = function () { history.pushState("", "", location.pathname + location.search); home(); };
    map.panTo(pt(p.x, p.y));
  }
  function route() { var id = location.hash.slice(1), p = A.places.filter(function (x) { return x.id === id; })[0]; if (p) show(p); else home(); }
  window.addEventListener("hashchange", route); route();
})();
