/**
 * catalog-search.js — Catalog search (search.html).
 * Live data: fetches the four catalog endpoints once, then filters
 * client-side (name / description / city / cuisine / address).
 *
 * NOTE: /v1/hotels returns only the first 10 entries (backend paginate(10),
 * no per_page param), so hotel search coverage is limited to those.
 */
(function (global) {
  "use strict";

  const It = global.Itinari;
  const CC = It && It.catalog;
  if (!CC) return;

  const input = document.getElementById("searchInput");
  const resultsEl = document.getElementById("searchResults");
  const noteEl = document.getElementById("searchNote");

  let catalog = null; // { destinations: [], hotels: [], restaurants: [], attractions: [] }
  let debounceTimer = null;

  function haystack(item, keys) {
    return keys
      .map(function (k) {
        const v = item[k];
        if (v == null) return "";
        return typeof v === "object" ? JSON.stringify(v) : String(v);
      })
      .join(" ")
      .toLowerCase();
  }

  function matches(item, q) {
    const keys = item.__searchKeys;
    if (!keys || !keys.length) return false;
    return keys.some(function (v) { return v.indexOf(q) !== -1; });
  }

  function prepare() {
    (catalog.destinations || []).forEach(function (d) {
      d.__searchKeys = [d.name, d.city_name, d.description, (d.country && d.country.name)].map(norm);
    });
    (catalog.hotels || []).forEach(function (h) {
      h.__searchKeys = [h.name, h.address, (h.destination && h.destination.name)].map(norm);
    });
    (catalog.restaurants || []).forEach(function (r) {
      r.__searchKeys = [r.name, r.cuisine, r.address, (r.destination && r.destination.name)].map(norm);
    });
    (catalog.attractions || []).forEach(function (a) {
      a.__searchKeys = [a.name, a.description, (a.destination && a.destination.name)].map(norm);
    });
  }

  function norm(v) {
    return String(v == null ? "" : v).toLowerCase();
  }

  function section(icon, label, items, cardFn) {
    let html =
      '<section class="result-group">' +
      '<h3 class="result-group-title"><i class="fas ' + icon + '" aria-hidden="true"></i>' +
      label + ' <span class="result-count">' + items.length + "</span></h3>" +
      '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">';
    items.forEach(function (item) { html += cardFn(item); });
    html += "</div></section>";
    return html;
  }

  function card(kind, item) {
    const url = kind + ".html?id=" + encodeURIComponent(item.id);
    const dest = item.destination ? item.destination.name : "";
    let meta = "";
    let sub = "";

    if (kind === "destination") {
      sub = item.city_name ? '<div class="cat-meta"><i class="fas fa-map-marker-alt" aria-hidden="true"></i>' + CC.escapeHtml(item.city_name) + "</div>" : "";
      meta = item.description ? '<div class="cat-desc">' + CC.escapeHtml(item.description) + "</div>" : "";
    } else if (kind === "hotel") {
      sub =
        '<div class="cat-meta">' +
        (item.rating != null ? CC.stars(item.rating) : "") +
        '<span class="ml-auto text-white/60 font-semibold">' + CC.fmtPrice(item.price_per_night) + '<span class="text-xs text-white/35 font-normal"> / night</span></span>' +
        "</div>";
      meta = dest ? '<div class="cat-meta"><i class="fas fa-map-marker-alt" aria-hidden="true"></i>' + CC.escapeHtml(dest) + "</div>" : "";
    } else if (kind === "restaurant") {
      sub =
        '<div class="cat-meta">' +
        (item.cuisine ? '<span class="chip"><i class="fas fa-utensils" aria-hidden="true"></i>' + CC.escapeHtml(item.cuisine) + "</span>" : "") +
        (item.price_range ? '<span class="chip">' + CC.escapeHtml(item.price_range) + "</span>" : "") +
        "</div>";
      meta =
        '<div class="cat-meta">' +
        (item.rating != null ? CC.stars(item.rating) : "") +
        (dest ? '<span class="ml-auto"><i class="fas fa-map-marker-alt" aria-hidden="true"></i>' + CC.escapeHtml(dest) + "</span>" : "") +
        "</div>";
    } else {
      sub = item.category ? '<div class="cat-meta"><span class="chip"><i class="fas fa-th-large" aria-hidden="true"></i>' + CC.escapeHtml(item.category.name) + "</span></div>" : "";
      meta =
        (dest ? '<div class="cat-meta"><i class="fas fa-map-marker-alt" aria-hidden="true"></i>' + CC.escapeHtml(dest) + "</div>" : "") +
        (item.description ? '<div class="cat-desc">' + CC.escapeHtml(item.description) + "</div>" : "");
    }

    return (
      '<a class="cat-card" href="' + url + '">' +
      '<div class="cat-thumb">' +
      '<button type="button" class="heart-btn" data-type="' + kind + '" data-id="' + item.id + '" data-name="' + CC.escapeHtml(item.name) + '" aria-label="Favourite ' + CC.escapeHtml(item.name) + '">' +
      '<i class="fas fa-heart" aria-hidden="true"></i></button>' +
      '<img alt="" loading="lazy" data-w="640" data-h="420" /></div>' +
      '<div class="cat-name">' + CC.escapeHtml(item.name) + "</div>" +
      sub +
      meta +
      "</a>"
    );
  }

  function render(q) {
    if (!q) {
      resultsEl.innerHTML =
        '<div class="result-group">' +
        CC.emptyState("fa-search", "Search the catalog", "Start typing above — results appear as you type. Try a city, cuisine, or landmark.", null) +
        "</div>";
      noteEl.hidden = true;
      return;
    }

    const filtered = {
      destinations: catalog.destinations.filter(function (d) { return matches(d, q); }),
      hotels: catalog.hotels.filter(function (h) { return matches(h, q); }),
      restaurants: catalog.restaurants.filter(function (r) { return matches(r, q); }),
      attractions: catalog.attractions.filter(function (a) { return matches(a, q); }),
    };

    const total =
      filtered.destinations.length + filtered.hotels.length + filtered.restaurants.length + filtered.attractions.length;
    noteEl.hidden = false;

    if (!total) {
      resultsEl.innerHTML =
        '<div class="result-group">' +
        CC.emptyState("fa-search-minus", 'No results for "' + CC.escapeHtml(q) + '"', "Try a different city, cuisine, or landmark — or browse the whole catalog.", "destinations.html") +
        "</div>";
      return;
    }

    let html = "";
    if (filtered.destinations.length) html += section("fa-map-marked-alt", "Destinations", filtered.destinations, function (d) { return card("destination", d); });
    if (filtered.hotels.length) html += section("fa-hotel", "Hotels", filtered.hotels, function (h) { return card("hotel", h); });
    if (filtered.restaurants.length) html += section("fa-utensils", "Restaurants", filtered.restaurants, function (r) { return card("restaurant", r); });
    if (filtered.attractions.length) html += section("fa-camera", "Attractions", filtered.attractions, function (a) { return card("attraction", a); });
    resultsEl.innerHTML = html;

    resultsEl.querySelectorAll("img[data-w]").forEach(function (img) {
      const el = img.closest(".cat-card");
      const href = el.getAttribute("href");
      const m = href && href.match(/(\w+)\.html\?id=(\d+)/);
      if (!m) return;
      const kind = m[1];
      const item = filtered[kind + "s"].find(function (x) { return String(x.id) === m[2]; });
      CC.bindImg(img, item);
    });
    CC.initFavs();
  }

  async function ensureCatalog() {
    if (catalog) return;
    try {
      const [resD, resH, resR, resA] = await Promise.all([
        It.apiGet(CC.ROUTES.destinations),
        It.apiGet(CC.ROUTES.hotels),
        It.apiGet(CC.ROUTES.restaurants),
        It.apiGet(CC.ROUTES.attractions),
      ]);
      catalog = {
        destinations: CC.dataOf(resD.body),
        hotels: CC.dataOf(resH.body),
        restaurants: CC.dataOf(resR.body),
        attractions: CC.dataOf(resA.body),
      };
      prepare();
      render(input.value.trim().toLowerCase());
    } catch (e) {
      resultsEl.innerHTML =
        '<div class="result-group">' +
        CC.emptyState("fa-wifi", "Could not load the catalog", "The catalog server is unreachable right now. Please try again shortly.", "index.html") +
        "</div>";
      noteEl.hidden = true;
    }
  }

  input.addEventListener("input", function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      if (catalog) render(input.value.trim().toLowerCase());
    }, 300);
  });

  ensureCatalog();
})(window);
