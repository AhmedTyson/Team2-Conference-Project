/**
 * trip.js — trip detail (converted from React TripDetailPage).
 * ?id=N. Stats band, route SVG map, itinerary with detach, destination stops.
 * Depends on app-shell.js (It.app).
 */
(function (global) {
  "use strict";

  var It = global.Itinari;
  if (!It || !It.app) return;

  var id = Number(new URLSearchParams(global.location.search).get("id")) || 0;
  var page = document.getElementById("trip-page");

  var TYPE_ICON = { hotel: "\u2302", restaurant: "\u2715", attraction: "\u2736", flight: "\u2708", destination: "\u25CE" };
  var TYPE_URL = { hotel: "/entity.html?type=hotel&id=", restaurant: "/entity.html?type=restaurant&id=", attraction: "/entity.html?type=attraction&id=", destination: "/entity.html?type=destination&id=" };

  function el(id) { return document.getElementById(id); }
  function esc(v) { return It.app.esc(v); }

  function formatDate(value) {
    if (!value) return "—";
    var d = new Date(String(value).slice(0, 10) + "T00:00:00");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function pointsFromItems(items) {
    var points = [];
    var seen = {};
    (items || []).forEach(function (item) {
      var raw = item.itemable;
      var lat = Number(raw && raw.latitude);
      var lng = Number(raw && raw.longitude);
      if (raw && isFinite(lat) && isFinite(lng) && lat !== 0 && lng !== 0) {
        var key = lat + "," + lng;
        if (!seen[key]) { seen[key] = true; points.push({ name: item.title, lat: lat, lng: lng }); }
      }
    });
    return points;
  }

  function mapSvg(points, title) {
    if (!points || !points.length) {
      return '<div class="empty"><span class="empty__icon">◎</span><p class="empty__text">No map data for this trip yet.</p></div>';
    }
    var SIZE = 600;
    var lats = points.map(function (p) { return p.lat; });
    var lngs = points.map(function (p) { return p.lng; });
    var minLat = Math.min.apply(null, lats), maxLat = Math.max.apply(null, lats);
    var minLng = Math.min.apply(null, lngs), maxLng = Math.max.apply(null, lngs);
    var pad = 90;
    var spanLat = Math.max(maxLat - minLat, 0.01);
    var spanLng = Math.max(maxLng - minLng, 0.01);
    var grid = "";
    for (var i = 1; i < 7; i++) {
      var x = (SIZE / 7) * i;
      var y = (SIZE / 7) * i;
      grid += '<line x1="' + x + '" y1="0" x2="' + x + '" y2="' + SIZE + '" class="map-grid" />' +
        '<line x1="0" y1="' + y + '" x2="' + SIZE + '" y2="' + y + '" class="map-grid" />';
    }
    var pins = points.map(function (p, idx) {
      var px = pad + ((p.lng - minLng) / spanLng) * (SIZE - pad * 2);
      var py = SIZE - pad - ((p.lat - minLat) / spanLat) * (SIZE - pad * 2);
      return '<g class="map-pin">' +
        '<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="' + (idx === 0 ? 22 : 18) + '" class="map-halo" />' +
        '<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="7" class="map-dot" />' +
        '<text x="' + px.toFixed(1) + '" y="' + (py - 18).toFixed(1) + '" text-anchor="middle" class="map-label">' +
        esc(p.name) + "</text></g>";
    }).join("");
    return '<div class="map-frame" role="img" aria-label="' + esc(title) + '">' +
      '<svg viewBox="0 0 ' + SIZE + " " + SIZE + '" style="width:100%;height:100%;">' +
      '<rect width="' + SIZE + '" height="' + SIZE + '" fill="hsl(var(--muted))" />' + grid + pins + "</svg>" +
      '<div style="padding:var(--space-2) var(--space-4);font-size:12px;color:hsl(var(--muted-foreground));">' + points.length + " locations</div></div>";
  }

  function detachBtn(item) {
    return '<button type="button" class="item-row__remove" data-pivot="' + item.id + '" data-title="' +
      esc(item.title) + '" aria-label="Remove ' + esc(item.title) + '">✕</button>';
  }

  function itineraryHtml(items) {
    if (!items.length) {
      return '<p class="hint">Nothing attached yet — add hotels, restaurants or attractions from the Explore pages.</p>';
    }
    return '<ul class="item-list">' + items.map(function (item) {
      var url = TYPE_URL[item.itemable_type];
      var title = url ? '<a href="' + url + (item.itemable_id || "") + '">' + esc(item.title) + "</a>" : esc(item.title);
      return '<li class="item-row">' +
        '<span class="item-row__icon" aria-hidden="true">' + (TYPE_ICON[item.itemable_type] || "\u2022") + "</span>" +
        '<span class="item-row__body">' +
        '<span class="item-row__title">' + title + "</span>" +
        '<span class="item-row__sub">' + esc(item.time_slot || "Day " + (item.day_number || "—")) +
        (item.estimated_cost ? " · " + Number(item.estimated_cost).toLocaleString() : "") + "</span></span>" +
        detachBtn(item) + "</li>";
    }).join("") + "</ul>";
  }

  function stopsHtml(destinations) {
    if (!destinations.length) return "";
    return '<div class="card card--flat">' +
      '<p class="page-section__eyebrow">Stops</p><h3 class="page-section__title" style="margin-bottom:var(--space-3);">Destinations</h3>' +
      '<ul class="stop-list">' + destinations.map(function (d) {
        return '<li class="stop-row">' +
          '<span class="stop-row__no">' + (d.pivot && d.pivot.visit_order != null ? d.pivot.visit_order : "\u00B7") + "</span>" +
          '<span class="stop-row__name">' + esc(d.name) + "</span>" +
          (d.pivot && d.pivot.estimated_date ? '<span class="stop-row__date">' + formatDate(d.pivot.estimated_date) + "</span>" : "") +
          "</li>";
      }).join("") + "</ul></div>";
  }

  It.app.boot(function () {
    if (!id) {
      page.innerHTML = '<div class="card card--flat"><h2 class="page-section__title">Trip not found.</h2>' +
        '<a href="/trips.html" class="btn btn--primary">Back to trips</a></div>';
      return;
    }
    It.apiGet("/trips/" + id, { auth: true }).then(function (res) {
      var trip = It.app.unwrapData(res);
      if (!res.ok || !trip) {
        page.innerHTML = '<div class="card card--flat"><h2 class="page-section__title">Trip not found.</h2>' +
          '<p class="page-section__lead">It may belong to someone else — or never existed.</p>' +
          '<a href="/trips.html" class="btn btn--primary">Back to trips</a></div>';
        return;
      }
      var items = trip.itinerary_items || [];
      var destinations = trip.destinations || [];
      var points = pointsFromItems(items);

      page.innerHTML =
        '<header class="page-header"><p class="page-header__eyebrow">Trip #' + trip.id + "</p>" +
        '<h1 class="page-header__title">' + esc(trip.title) + "</h1>" +
        '<p class="page-header__lead">' + esc(trip.travel_style || "") + " style · " + (trip.no_of_days || "—") + " days · " +
        (trip.no_of_travelers || "—") + " traveler" + (trip.no_of_travelers === 1 ? "" : "s") + "</p>" +
        '<div class="btn-row"><a href="/trip-form.html" class="btn btn--primary">New trip</a></div></header>' +

        '<section class="stats-band"><div class="stat-card"><span class="stat-card__value">' +
        formatDate(trip.start_date) + " → " + formatDate(trip.end_date) + '</span><span class="stat-card__label">Dates</span></div>' +
        '<div class="stat-card"><span class="stat-card__value">' + (trip.budget != null ? Number(trip.budget).toLocaleString() : "—") + '</span><span class="stat-card__label">Budget</span></div>' +
        '<div class="stat-card"><span class="stat-card__value">' + items.length + '</span><span class="stat-card__label">Items attached</span></div>' +
        '<div class="stat-card"><span class="stat-card__value">' + destinations.length + '</span><span class="stat-card__label">Destinations</span></div></section>' +

        '<div class="split"><div class="split__main"><section class="page-section">' +
        '<p class="page-section__eyebrow">Route</p><h2 class="page-section__title" style="margin-bottom:var(--space-3);">Your trail</h2>' +
        '<div id="trip-map"><div class="skeleton skeleton--card"></div></div></section></div>' +

        '<aside class="split__side"><div class="card card--flat">' +
        '<p class="page-section__eyebrow">Itinerary</p><h3 class="page-section__title" style="margin-bottom:var(--space-3);">' +
        items.length + " attached</h3>" + itineraryHtml(items) +
        '<a href="/explore.html" class="btn btn--ghost btn--block" style="margin-top:var(--space-3);">Add from Explore</a></div>' +
        stopsHtml(destinations) + "</aside></div>";

      Array.prototype.forEach.call(page.querySelectorAll(".item-row__remove"), function (btn) {
        btn.addEventListener("click", function () {
          var pivotId = btn.dataset.pivot;
          if (!global.confirm('Remove "' + btn.dataset.title + '" from this trip?')) return;
          btn.disabled = true;
          It.apiDelete("/trips/" + id + "/detach/" + pivotId, { auth: true }).then(function (res) {
            if (res.ok) {
              It.app.showToast("Item removed from the trip.", "info");
              var list = page.querySelector(".item-list");
              var row = btn.closest(".item-row");
              if (row && list) {
                row.parentNode.removeChild(row);
                var title = page.querySelector(".card--flat .page-section__title");
                if (title) title.textContent = page.querySelectorAll(".item-row").length + " attached";
              }
            } else {
              It.app.showToast((res.body && res.body.message) || "Could not remove the item.", "error");
              btn.disabled = false;
            }
          }).catch(function () {
            It.app.showToast("Could not remove the item.", "error");
            btn.disabled = false;
          });
        });
      });

      It.apiGet("/v1/maps/trip/" + id, { auth: true }).then(function (res) {
        var mapNode = el("trip-map");
        if (!mapNode) return;
        if (!res.ok || !points.length) {
          mapNode.innerHTML = '<div class="card card--flat"><p class="page-section__lead">The route needs at least two locations with coordinates — attach more items to draw it.</p></div>';
        } else {
          mapNode.innerHTML = mapSvg(points, trip.title);
        }
      }).catch(function () {
        var mapNode = el("trip-map");
        if (mapNode) {
          mapNode.innerHTML = '<div class="card card--flat"><p class="page-section__lead">The route needs at least two locations with coordinates — attach more items to draw it.</p></div>';
        }
      });
    }).catch(function () {
      page.innerHTML = '<div class="error-card"><p>Could not load this trip.</p>' +
        '<a href="/trips.html" class="btn btn--primary">Back to trips</a></div>';
    });
  });
})(window);
