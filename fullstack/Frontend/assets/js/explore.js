/**
 * explore.js — catalog browser (converted from React ExplorePage).
 * Tabs: destinations / hotels / restaurants / attractions. Public API.
 */
(function (global) {
  "use strict";

  var It = global.Itinari || (global.Itinari = {});

  var TAB = "destinations";
  var REGION = "all";
  var SEARCH = "";
  var searchTimer = null;

  var grid = document.getElementById("catalog-grid");
  var tabs = document.getElementById("catalog-tabs");
  var searchInput = document.getElementById("catalog-search");
  var regionPills = document.getElementById("region-pills");

  function esc(str) {
    if (str == null) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function cardFor(type, item) {
    var href = "entity.html?type=" + (type === "destinations" ? "destinations" : (type === "hotels" ? "hotels" : (type === "restaurants" ? "restaurants" : "attractions"))) + "&id=" + item.id;
    var kicker, sub, badges = "";
    var name = item.name || item.city || "Curated Destination";
    var country = (item.country && item.country.name) || item.country || "";
    var unsplashFallback = (global.Itinari && global.Itinari.getUnsplashImage) ? global.Itinari.getUnsplashImage(name, type, country) : "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80";
    var img = item.image_url || item.image || unsplashFallback;

    if (type === "destinations") {
      kicker = (item.country && item.country.region && item.country.region.name) || item.region_name || "Destination";
      sub = (item.city ? item.city + ", " : "") + (country || "");
      badges = '<span class="dest-badge">' + esc(kicker) + '</span>' +
        '<span class="dest-badge"><i class="fas fa-hotel mr-1 opacity-60"></i>' + (item.hotels_count || 12) + ' Hotels</span>' +
        '<span class="dest-badge"><i class="fas fa-route mr-1 opacity-60"></i>' + (item.tours_count || 8) + ' Tours</span>';
    } else if (type === "hotels") {
      kicker = (item.stars ? "★".repeat(Math.min(5, Number(item.stars))) : "5-Star Hotel");
      sub = (item.destination && item.destination.city) || (item.destination && item.destination.name) || (item.city_name || "Luxury Resort");
      badges = '<span class="dest-badge text-amber-400">' + kicker + '</span>' +
        '<span class="dest-badge font-bold text-white">' + (item.price_per_night != null ? "$" + Number(item.price_per_night).toLocaleString() + "/nt" : "$450/nt") + '</span>' +
        (item.reviews_count ? '<span class="dest-badge">' + item.reviews_count + ' Reviews</span>' : '');
    } else if (type === "restaurants") {
      kicker = item.cuisine || "Fine Dining";
      sub = (item.destination && item.destination.city) || (item.destination && item.destination.name) || (item.city_name || "Michelin Selection");
      badges = '<span class="dest-badge">' + esc(kicker) + '</span>' +
        '<span class="dest-badge text-emerald-400">' + esc(item.price_range || "$$$$") + '</span>' +
        '<span class="dest-badge text-amber-400"><i class="fas fa-star mr-1"></i>' + (item.rating || 4.9) + '</span>';
    } else {
      kicker = (item.category && item.category.name) || "Cultural Landmark";
      sub = (item.destination && item.destination.name) || (item.city_name || "Must-Visit");
      badges = '<span class="dest-badge">' + esc(kicker) + '</span>' +
        '<span class="dest-badge text-sky-400"><i class="fas fa-camera mr-1"></i>Guided Tour</span>';
    }

    return '<div class="dest-card" onclick="window.location.href=\'' + href + '\'">' +
      '<img src="' + img + '" alt="' + esc(name) + '" loading="lazy" onerror="this.onerror=null;this.src=\'' + unsplashFallback + '\';" />' +
      '<div class="dest-name">' +
        '<span>' + esc(name) + '</span>' +
        '<span class="text-xs text-amber-400 font-semibold flex items-center gap-1"><i class="fas fa-star text-[10px]"></i> ' + (item.rating || 4.9) + '</span>' +
      '</div>' +
      '<div class="dest-location"><i class="fas fa-location-dot text-white/40"></i><span>' + esc(sub) + '</span></div>' +
      '<div class="dest-desc">' + esc(item.description || "Discover bespoke luxury highlights and unforgettable moments.") + '</div>' +
      '<div class="dest-badges">' + badges + '</div>' +
    '</div>';
  }

  function render(items) {
    if (!grid) return;
    if (!items || !items.length) {
      grid.innerHTML = '<div class="col-span-full py-16 text-center text-white/40">' +
        '<i class="fas fa-compass text-3xl mb-3 block opacity-30"></i>' +
        '<p class="text-lg font-bold text-white mb-1">No items found</p>' +
        '<p class="text-sm">Try adjusting your search query or selecting a different tab.</p></div>';
      return;
    }
    grid.innerHTML = items.map(function (item) { return cardFor(TAB, item); }).join("");
  }

  function loadRegions() {
    if (!regionPills) return;
    It.apiGet("/regions").then(function (res) {
      var regions = (It.unwrapData && It.unwrapData(res)) || (res && res.body && res.body.data) || res.body;
      if (!Array.isArray(regions)) return;
      regionPills.innerHTML = regions.map(function (r) {
        var active = r.key === REGION || r.id === REGION;
        return '<button type="button" class="btn btn--xs ' + (active ? 'btn--primary' : 'btn--ghost') + '" data-region="' + (r.key || r.id) + '">' +
          esc(r.label || r.name) + '</button>';
      }).join("");
    }).catch(function () { /* fallback */ });
  }

  var CURRENT_PAGE = 1;
  var PER_PAGE = 20;
  var ALL_ITEMS = [];

  function updatePage(page) {
    CURRENT_PAGE = page;
    var start = (CURRENT_PAGE - 1) * PER_PAGE;
    var paged = ALL_ITEMS.slice(start, start + PER_PAGE);
    render(paged);

    var pagContainer = document.getElementById("catalog-pagination");
    if (!pagContainer && grid && grid.parentNode) {
      pagContainer = document.createElement("div");
      pagContainer.id = "catalog-pagination";
      pagContainer.className = "w-full col-span-full mt-6";
      grid.parentNode.insertBefore(pagContainer, grid.nextSibling);
    }
    if (pagContainer && global.ItPaginate) {
      global.ItPaginate.render({
        container: pagContainer,
        totalItems: ALL_ITEMS.length,
        currentPage: CURRENT_PAGE,
        itemsPerPage: PER_PAGE,
        onPageChange: function (newPage) {
          updatePage(newPage);
          if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  }

  function load(tab) {
    TAB = tab;
    CURRENT_PAGE = 1;
    var params = [];
    if (TAB === "destinations") {
      if (REGION && REGION !== "all") params.push("region=" + encodeURIComponent(REGION));
    }
    if (SEARCH.trim()) {
      params.push("query=" + encodeURIComponent(SEARCH.trim()));
    }

    var qs = params.length ? "?" + params.join("&") : "";
    var url = "/" + (tab === "destinations" ? "destinations" : tab) + qs;

    if (regionPills) {
      regionPills.style.display = TAB === "destinations" ? "flex" : "none";
    }

    grid.innerHTML = '<div class="skeleton skeleton--card"></div><div class="skeleton skeleton--card"></div><div class="skeleton skeleton--card"></div>';
    It.apiGet(url).then(function (res) {
      var data = (It.unwrapData && It.unwrapData(res)) || (res && res.body && res.body.data) || res.body;
      var items = data;
      if (data && typeof data === "object" && Array.isArray(data.data)) items = data.data;
      if (!Array.isArray(items) && Array.isArray(res.body)) items = res.body;
      if (!Array.isArray(items)) items = [];
      ALL_ITEMS = items;
      updatePage(1);
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

  if (regionPills) {
    regionPills.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-region]");
      if (!btn) return;
      REGION = btn.getAttribute("data-region");
      regionPills.querySelectorAll("[data-region]").forEach(function (b) {
        var active = b === btn;
        b.classList.toggle("btn--primary", active);
        b.classList.toggle("btn--ghost", !active);
      });
      load(TAB);
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        SEARCH = searchInput.value;
        load(TAB);
      }, 300);
    });
  }

  function boot() {
    loadRegions();
    load(TAB);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window);
