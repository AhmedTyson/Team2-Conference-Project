/**
 * explore.js — catalog browser (converted from React ExplorePage).
 * Tabs: destinations / hotels / restaurants / attractions. Public API.
 * Depends on app-shell.js (It.app).
 */
(function (global) {
  "use strict";

  var It = global.Itinari;
  if (!It || !It.app) return;

  var TAB = "destinations";
  var grid = document.getElementById("catalog-grid");
  var tabs = document.getElementById("catalog-tabs");

  function el(id) { return document.getElementById(id); }

  function cardFor(type, item) {
    var href = "/entity.html?type=" + type + "&id=" + item.id;
    var kicker, sub, meta = "";
    if (type === "destinations") {
      kicker = (item.country && item.country.name) || "Destination";
      sub = item.city_name || "";
    } else if (type === "hotels") {
      kicker = "★".repeat(Number(item.stars) || 0) || "Hotel";
      sub = (item.destination && item.destination.city_name) || "Location TBA";
      meta = '<div class="card__meta">' + It.app.starsHtml(item.rating) +
        '<span class="card__price">' + (item.price_per_night != null ? Number(item.price_per_night).toLocaleString() + " / night" : "Price on request") + "</span></div>";
    } else if (type === "restaurants") {
      kicker = item.cuisine || "Restaurant";
      sub = (item.destination && item.destination.city_name) || "Location TBA";
      meta = '<div class="card__meta">' + It.app.starsHtml(item.rating) + "<span>" + It.app.esc(item.price_range || "") + "</span></div>";
    } else {
      kicker = (item.category && item.category.name) || "Attraction";
      sub = (item.destination && item.destination.name) || "";
      meta = "";
    }
    return '<a href="' + href + '" class="card card--tile">' +
      It.app.imageHtml(item.image, item.name, "card__media", type) +
      '<div class="card__body">' +
      '<div class="card__topline"><span>' + It.app.esc(kicker) + "</span><span>→</span></div>" +
      '<h3 class="card__title">' + It.app.esc(item.name) + "</h3>" +
      '<p class="card__sub">' + It.app.esc(sub) + "</p>" +
      meta + "</div></a>";
  }

  function render(items) {
    if (!grid) return;
    if (!items.length) {
      grid.innerHTML = '<div class="empty" style="grid-column:1/-1;">' +
        '<span class="empty__icon">🗺</span>' +
        '<p class="empty__title">Nothing here yet.</p>' +
        '<p class="empty__text">No items in this catalog section.</p></div>';
      return;
    }
    grid.innerHTML = items.map(function (item) { return cardFor(TAB, item); }).join("");
  }

  function load(tab) {
    TAB = tab;
    var url = "/v1/" + (tab === "destinations" ? "destinations" : tab);
    grid.innerHTML = '<div class="skeleton skeleton--card"></div><div class="skeleton skeleton--card"></div><div class="skeleton skeleton--card"></div>';
    It.apiGet(url).then(function (res) {
      var data = It.app.unwrapData(res);
      var items = data;
      if (data && typeof data === "object" && Array.isArray(data.data)) items = data.data;
      if (Array.isArray(items)) {
        render(items);
      } else if (Array.isArray(res.body)) {
        render(res.body);
      } else {
        render([]);
      }
    }).catch(function () {
      if (grid) {
        grid.innerHTML = '<div class="error-card" style="grid-column:1/-1;">' +
          '<p>Could not load this catalog section.</p>' +
          '<button type="button" class="btn btn--primary" onclick="location.reload()">Retry</button></div>';
      }
    });
  }

  if (tabs) {
    tabs.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-tab]");
      if (!btn) return;
      tabs.querySelectorAll("[data-tab]").forEach(function (b) {
        b.classList.toggle("tab--on", b === btn);
        b.setAttribute("aria-selected", String(b === btn));
      });
      load(btn.getAttribute("data-tab"));
    });
  }

  It.app.boot(function () { load(TAB); });
})(window);
