/**
 * entity.js — catalog item detail (converted from React EntityDetailPage).
 * ?type=destination|hotel|restaurant|attraction&id=N
 * Hero + meta + description, destination map, favourite toggle,
 * add-to-trip (hotel/restaurant/attraction), review form.
 * Depends on app-shell.js (It.app).
 */
(function (global) {
  "use strict";

  var It = global.Itinari;
  if (!It || !It.app) return;

  var TYPE_LABEL = { destination: "Destination", hotel: "Hotel", restaurant: "Restaurant", attraction: "Attraction" };
  var ATTACH_TYPE = { hotel: "hotels", restaurant: "restaurants", attraction: "attractions" };

  var params = new URLSearchParams(global.location.search);
  var type = params.get("type") || "";
  var id = Number(params.get("id")) || 0;
  var page = document.getElementById("entity-page");

  function el(id) { return document.getElementById(id); }

  function entityName(e) { return e.name || "Item"; }
  function entitySub(e) { return (e.destination && e.destination.city_name) || ""; }
  function entityImage(e) { return e.image || null; }
  function entityDescription(e) { return e.description || ""; }

  function metaHtml(e) {
    if (type === "hotel") {
      return '<div class="card__meta">' + It.app.starsHtml(e.rating) +
        '<span class="card__price">' + (e.price_per_night != null ? Number(e.price_per_night).toLocaleString() + " / night" : "Price on request") + "</span>" +
        '<span class="badge' + (e.availability ? " badge--ok" : "") + '">' + (e.availability ? "Available" : "Unavailable") + "</span></div>";
    }
    if (type === "restaurant") {
      return '<div class="card__meta">' + It.app.starsHtml(e.rating) +
        '<span class="card__price">' + It.app.esc(e.price_range || "—") + "</span>" +
        '<span class="badge">' + It.app.esc(e.cuisine || "Cuisine") + "</span></div>";
    }
    var d = e;
    return '<div class="card__meta"><span class="badge">' + It.app.esc((d.country && d.country.name) || "Destination") + "</span>" +
      '<span class="card__price">' + (d.latitude != null && d.longitude != null
        ? Number(d.latitude).toFixed(2) + "°, " + Number(d.longitude).toFixed(2) + "°"
        : "Coordinates pending") + "</span></div>";
  }

  function mapSvg(points, title) {
    if (!points || !points.length) {
      return '<div class="empty"><span class="empty__icon">◎</span><p class="empty__text">No map data for this area yet.</p></div>';
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
        It.app.esc(p.name) + "</text></g>";
    }).join("");
    return '<div class="map-frame" role="img" aria-label="' + It.app.esc(title) + '">' +
      '<svg viewBox="0 0 ' + SIZE + " " + SIZE + '" style="width:100%;height:100%;">' +
      '<rect width="' + SIZE + '" height="' + SIZE + '" fill="hsl(var(--muted))" />' + grid + pins + "</svg>" +
      '<div style="padding:var(--space-2) var(--space-4);font-size:12px;color:hsl(var(--muted-foreground));">' + points.length + " locations</div></div>";
  }

  function render(e) {
    var name = entityName(e);
    var favBtn = '<button type="button" id="fav-btn" class="btn btn--ghost" aria-pressed="false">♡ Save to favourites</button>';
    page.innerHTML =
      '<header class="page-header"><p class="page-header__eyebrow">' + TYPE_LABEL[type] + "</p>" +
      '<h1 class="page-header__title">' + It.app.esc(name) + "</h1>" +
      '<p class="page-header__lead">' + It.app.esc(entitySub(e)) + "</p>" +
      '<div class="btn-row">' + favBtn + "</div></header>" +
      '<div class="detail-hero"><div>' +
      It.app.imageHtml(entityImage(e), name, "detail-hero__media") +
      '<div class="card card--flat" style="margin-top:var(--space-4);">' + metaHtml(e) +
      (entityDescription(e) ? '<p style="margin:var(--space-3) 0 0;line-height:var(--text-body-lh);">' + It.app.esc(entityDescription(e)) + "</p>" : "") +
      '</div></div><aside style="display:flex;flex-direction:column;gap:var(--space-4);">' +
      '<div class="card card--flat"><p class="page-section__eyebrow">Plan together</p>' +
      '<h3 class="page-section__title" style="margin-bottom:var(--space-3);">Add to a trip</h3>' +
      '<select id="trip-select" class="field__select" style="width:100%;margin-bottom:var(--space-3);"><option value="">Pick a trip…</option></select>' +
      '<button type="button" id="attach-btn" class="btn btn--primary" disabled style="width:100%;">Add to trip</button></div>' +
      '<div class="card card--flat"><p class="page-section__eyebrow">Your voice</p>' +
      '<h3 class="page-section__title" style="margin-bottom:var(--space-3);">Rate ' + It.app.esc(name) + "</h3>" +
      '<div class="chip-row" id="rating-chips"></div><p class="field__error" id="rating-error" hidden>Pick a star rating.</p>' +
      '<textarea id="review-comment" class="field__textarea" style="margin:var(--space-3) 0;min-height:110px;" placeholder="What should others know? (optional)" maxlength="1000"></textarea>' +
      '<button type="button" id="review-btn" class="btn btn--primary">Submit review</button></div>' +
      '<a href="/explore.html" class="btn btn--ghost" style="width:100%;">Back to explore</a></aside></div>';

    var rating = 0;
    var chips = el("rating-chips");
    for (var i = 1; i <= 5; i++) {
      (function (v) {
        var c = document.createElement("button");
        c.type = "button";
        c.className = "chip";
        c.textContent = "★ " + v;
        c.addEventListener("click", function () {
          rating = v;
          chips.querySelectorAll(".chip").forEach(function (b) {
            b.classList.toggle("chip--on", Number(b.textContent.replace("★ ", "")) <= v);
          });
          el("rating-error").hidden = true;
        });
        chips.appendChild(c);
      })(i);
    }

    It.apiGet("/v1/dashboard/trips", { auth: true }).then(function (res) {
      var trips = It.app.unwrapData(res);
      if (!Array.isArray(trips)) return;
      var sel = el("trip-select");
      if (!sel) return;
      trips.forEach(function (t) {
        var o = document.createElement("option");
        o.value = t.id;
        o.textContent = t.title;
        sel.appendChild(o);
      });
      sel.addEventListener("change", function () {
        el("attach-btn").disabled = !sel.value;
      });
    }).catch(function () { /* ignore */ });

    if (ATTACH_TYPE[type]) {
      el("attach-btn").addEventListener("click", function () {
        var sel = el("trip-select");
        if (!sel.value) return;
        var btn = this;
        btn.disabled = true;
        It.apiPost("/v1/trips/" + sel.value + "/attach/" + ATTACH_TYPE[type], { id: id }, { auth: true }).then(function (res) {
          if (res.ok) {
            It.app.showToast("Added to your trip.", "success");
            sel.value = "";
            btn.disabled = true;
          } else {
            It.app.showToast((res.body && res.body.message) || "Could not add to trip.", "error");
            btn.disabled = false;
          }
        }).catch(function () {
          It.app.showToast("Could not add to trip.", "error");
          btn.disabled = false;
        });
      });
    }

    el("fav-btn").addEventListener("click", function () {
      var btn = this;
      btn.disabled = true;
      It.apiPost("/v1/favourites/" + type + "/" + id, {}, { auth: true }).then(function (res) {
        var status = res.body && res.body.status;
        if (status === "added" || status === "removed") {
          btn.textContent = status === "added" ? "♥ Saved" : "♡ Save to favourites";
          btn.setAttribute("aria-pressed", String(status === "added"));
          It.app.showToast(status === "added" ? "Saved to favourites." : "Removed from favourites.", "success");
        } else {
          It.app.showToast((res.body && res.body.message) || "Could not update favourites.", "error");
        }
        btn.disabled = false;
      }).catch(function () {
        It.app.showToast("Could not update favourites.", "error");
        btn.disabled = false;
      });
    });

    el("review-btn").addEventListener("click", function () {
      if (rating < 1) {
        el("rating-error").hidden = false;
        return;
      }
      var btn = this;
      btn.disabled = true;
      It.apiPost("/v1/reviews/" + type + "/" + id, {
        rating: rating,
        comment: el("review-comment").value.trim() || undefined,
      }, { auth: true }).then(function (res) {
        if (res.ok) {
          It.app.showToast("Review submitted — pending approval.", "success");
          rating = 0;
          el("review-comment").value = "";
          chips.querySelectorAll(".chip").forEach(function (b) { b.classList.remove("chip--on"); });
        } else {
          var errs = res.body && res.body.errors;
          var first = null;
          if (errs && typeof errs === "object") {
            Object.keys(errs).forEach(function (k) { if (!first) first = errs[k][0]; });
          }
          It.app.showToast(first || (res.body && res.body.message) || "Could not submit the review.", "error");
        }
        btn.disabled = false;
      }).catch(function () {
        It.app.showToast("Could not submit the review.", "error");
        btn.disabled = false;
      });
    });

    if (type === "destination") {
      It.apiGet("/v1/maps/destination/" + id).then(function (res) {
        if (!res.ok || !res.body) return;
        var seen = {};
        var all = [];
        ["attractions", "hotels", "restaurants"].forEach(function (group) {
          (res.body[group] || []).forEach(function (p) {
            var key = p.lat + "," + p.lng;
            if (!seen[key]) { seen[key] = true; all.push(p); }
          });
        });
        var hero = page.querySelector(".detail-hero");
        var mapSection = document.createElement("section");
        mapSection.className = "page-section";
        mapSection.style.gridColumn = "1 / -1";
        mapSection.innerHTML = '<p class="page-section__eyebrow">Local Guide</p>' +
          '<h2 class="page-section__title">What\'s around</h2>' + mapSvg(all, name);
        if (hero) hero.style.gridTemplateColumns = "1fr";
        page.appendChild(mapSection);
      }).catch(function () { /* map unavailable */ });
    }
  }

  if (!TYPE_LABEL[type] || !id) {
    page.innerHTML = '<div class="card card--flat"><h2 class="page-section__title">Unknown item type.</h2>' +
      '<a href="/explore.html" class="btn btn--primary">Back to explore</a></div>';
  } else {
    It.app.boot(function () {
      It.apiGet("/v1/" + type + "s/" + id).then(function (res) {
        if (res.ok && res.body) {
          var item = res.body;
          if (item.data && typeof item.data === "object" && !Array.isArray(item.data)) item = item.data;
          render(item);
        } else {
          page.innerHTML = '<div class="error-card"><p>Could not load this item.</p>' +
            '<a href="/explore.html" class="btn btn--primary">Back to explore</a></div>';
        }
      }).catch(function () {
        page.innerHTML = '<div class="error-card"><p>Could not load this item.</p>' +
          '<a href="/explore.html" class="btn btn--primary">Back to explore</a></div>';
      });
    });
  }
})(window);
