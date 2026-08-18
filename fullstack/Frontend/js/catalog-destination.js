/**
 * catalog-destination.js — Destination detail (destination.html?id=<id>).
 * Live data: GET /v1/destinations/{id} + GET /v1/attractions (filtered by
 * destination_id for map pins). Includes the city weather shortcut that
 * prefills weather.html and auto-searches.
 *
 * The map is rendered locally from live lat/lon (deterministic SVG pins).
 * The backend /v1/maps/destination endpoint is not used here: it calls the
 * OpenStreetMap + AI providers synchronously (set_time_limit(90)) and would
 * hang the page offline.
 */
(function (global) {
  "use strict";

  const It = global.Itinera;
  const CC = It && It.catalog;
  if (!CC) return;

  const root = document.getElementById("detailRoot");
  const id = Number(new URLSearchParams(global.location.search).get("id"));

  function hero(d, country) {
    return (
      '<div class="cat-hero">' +
      '<img alt="" data-w="1200" data-h="640" />' +
      '<div class="cat-hero-shade"></div>' +
      '<div class="cat-hero-caption">' +
      '<h1>' + CC.escapeHtml(d.name) + "</h1>" +
      (country || d.city_name
        ? '<p class="text-white/60 text-sm mt-1"><i class="fas fa-map-marker-alt mr-1" aria-hidden="true"></i>' +
          CC.escapeHtml([d.city_name, country].filter(Boolean).join(", ")) + "</p>"
        : "") +
      '<div class="flex items-center gap-3 mt-4 flex-wrap">' +
      '<button type="button" class="heart-btn" data-type="destination" data-id="' + d.id + '" data-name="' + CC.escapeHtml(d.name) + '" aria-label="Favourite">' +
      '<i class="fas fa-heart" aria-hidden="true"></i></button>' +
      '<button type="button" class="btn-white" id="weatherBtn"><i class="fas fa-cloud-sun" aria-hidden="true"></i>Weather in ' + CC.escapeHtml(d.city_name || d.name) + "</button>" +
      '<button type="button" class="btn-outline review-btn" data-type="destination" data-id="' + d.id + '" data-name="' + CC.escapeHtml(d.name) + '">' +
      '<i class="fas fa-star" aria-hidden="true"></i>Review</button>' +
      "</div></div></div>"
    );
  }

  function facts(d, country) {
    return (
      '<div class="facts">' +
      (country ? '<div class="fact"><div class="fact-label"><i class="fas fa-flag" aria-hidden="true"></i>Country</div><div class="fact-value">' + CC.escapeHtml(country) + "</div></div>" : "") +
      (d.city_name ? '<div class="fact"><div class="fact-label"><i class="fas fa-city" aria-hidden="true"></i>City</div><div class="fact-value">' + CC.escapeHtml(d.city_name) + "</div></div>" : "") +
      (country && country.iso_code ? '<div class="fact"><div class="fact-label"><i class="fas fa-globe" aria-hidden="true"></i>ISO</div><div class="fact-value">' + CC.escapeHtml(country.iso_code) + "</div></div>" : "") +
      '<div class="fact"><div class="fact-label"><i class="fas fa-map-pin" aria-hidden="true"></i>Coordinates</div><div class="fact-value">' + (d.latitude != null ? Number(d.latitude).toFixed(3) + ", " + Number(d.longitude).toFixed(3) : "—") + "</div></div>" +
      (country && country.currency ? '<div class="fact"><div class="fact-label"><i class="fas fa-money-bill" aria-hidden="true"></i>Currency</div><div class="fact-value">' + CC.escapeHtml(country.currency) + "</div></div>" : "") +
      "</div>"
    );
  }

  /** Deterministic SVG pin map from live coordinates. */
  function renderMap(d, attractions) {
    const points = [{ lat: Number(d.latitude), lng: Number(d.longitude), name: d.name, dest: true }];
    (attractions || []).forEach(function (a) {
      if (a.latitude != null && a.longitude != null) {
        points.push({ lat: Number(a.latitude), lng: Number(a.longitude), name: a.name, dest: false });
      }
    });

    const W = 900, H = 340, PAD = 46;
    const lats = points.map(function (p) { return p.lat; });
    const lngs = points.map(function (p) { return p.lng; });
    const minLat = Math.min.apply(null, lats), maxLat = Math.max.apply(null, lats);
    const minLng = Math.min.apply(null, lngs), maxLng = Math.max.apply(null, lngs);
    const spanLat = Math.max(maxLat - minLat, 0.05), spanLng = Math.max(maxLng - minLng, 0.05);

    const x = function (lng) { return PAD + ((lng - minLng) / spanLng) * (W - 2 * PAD); };
    const y = function (lat) { return H - PAD - ((lat - minLat) / spanLat) * (H - 2 * PAD); };

    let grid = "";
    for (let i = 1; i < 8; i++) {
      grid += '<line class="map-grid-line" x1="' + (W / 8) * i + '" y1="0" x2="' + (W / 8) * i + '" y2="' + H + '" />';
      grid += '<line class="map-grid-line" x1="0" y1="' + (H / 6) * i + '" x2="' + W + '" y2="' + (H / 6) * i + '" />';
    }

    let pins = "";
    points.forEach(function (p) {
      const cls = p.dest ? "map-pin-dest" : "map-pin-other";
      const ring = p.dest ? "map-pin-dest-ring" : "map-pin-other-ring";
      pins +=
        '<circle class="' + ring + '" cx="' + x(p.lng) + '" cy="' + y(p.lat) + '" r="14" />' +
        '<circle class="' + cls + '" cx="' + x(p.lng) + '" cy="' + y(p.lat) + '" r="6" />' +
        '<text class="map-pin-label" x="' + (x(p.lng) + 10) + '" y="' + (y(p.lat) - 8) + '">' + CC.escapeHtml(p.name) + "</text>";
    });

    return (
      '<div class="map-frame" role="img" aria-label="Map of ' + CC.escapeHtml(d.name) + " with " + points.length + " pin(s)\">" +
      '<svg viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="xMidYMid meet">' + grid + pins + "</svg>" +
      '<span class="map-coords"><i class="fas fa-location-dot mr-1" aria-hidden="true"></i>' + Number(d.latitude).toFixed(4) + ", " + Number(d.longitude).toFixed(4) + "</span>" +
      "</div>"
    );
  }

  function render(d, attractions) {
    const country = d.country || null;
    root.innerHTML =
      hero(d, country ? country.name : "") +
      '<div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">' +
      '<div class="glass-card p-6">' +
      '<h2 class="text-lg font-bold mb-3"><i class="fas fa-info-circle text-red-400 mr-2" aria-hidden="true"></i>About ' + CC.escapeHtml(d.name) + "</h2>" +
      (d.description ? "<p class=\"text-white/55 text-sm leading-relaxed\">" + CC.escapeHtml(d.description) + "</p>" : '<p class="text-white/40 text-sm">No description available.</p>') +
      "</div>" +
      '<div class="glass-card p-6">' +
      "<h2 class=\"text-lg font-bold mb-4\"><i class=\"fas fa-layer-group text-red-400 mr-2\" aria-hidden=\"true\"></i>At a glance</h2>" +
      facts(d, country) +
      "</div>" +
      "</div>" +
      '<div class="mt-5 glass-card p-6">' +
      '<div class="flex items-center justify-between flex-wrap gap-2 mb-4">' +
      '<h2 class="text-lg font-bold"><i class="fas fa-map text-red-400 mr-2" aria-hidden="true"></i>Map</h2>' +
      '<span class="chip"><i class="fas fa-map-pin" aria-hidden="true"></i>' + (attractions || []).length + " attraction pin(s)</span>" +
      "</div>" +
      (d.latitude != null ? renderMap(d, attractions) : CC.emptyState("fa-map", "No map available", "This destination has no coordinates yet.", "destinations.html")) +
      "</div>";

    const img = root.querySelector(".cat-hero img");
    if (img) CC.bindImg(img, d);

    CC.initFavs();
    CC.initReviewBtns();

    const weatherBtn = document.getElementById("weatherBtn");
    if (weatherBtn) {
      weatherBtn.addEventListener("click", function () {
        CC.gotoWeather(d.city_name || d.name);
      });
    }
  }

  async function load() {
    if (!id) {
      root.innerHTML = CC.emptyState("fa-map-marked-alt", "Destination not found", "No destination selected.", "destinations.html");
      return;
    }
    try {
      const res = await It.apiGet(CC.ROUTES.destinations + "/" + id);
      if (!res.ok || !res.body || !res.body.data) {
        root.innerHTML = CC.emptyState("fa-map-marked-alt", "Destination not found", "It may have been removed from the catalog.", "destinations.html");
        return;
      }
      const d = res.body.data;
      let attractions = [];
      try {
        const attRes = await It.apiGet(CC.ROUTES.attractions);
        attractions = CC.dataOf(attRes.body).filter(function (a) {
          return String(a.destination_id) === String(d.id);
        });
      } catch (e) { /* map renders without attraction pins */ }
      render(d, attractions);
    } catch (e) {
      root.innerHTML = CC.emptyState("fa-wifi", "Could not load this destination", "The catalog server is unreachable right now. Please try again shortly.", "destinations.html");
    }
  }

  load();
})(window);
