/**
 * favourites.js — Saved Places & Bookmarks Manager.
 * Features luxury Tailwind glassmorphic cards, type filtering pills, real-time heart removal, and Unsplash images.
 */
(function (global) {
  "use strict";

  var It = global.Itinari;
  if (!It) return;

  var grid = document.getElementById("fav-grid");
  var currentFilter = "all";
  var allFavourites = [];

  var TYPE_CONFIG = {
    destination: { label: "Destination", badgeClass: "bg-amber-400/10 text-amber-400 border-amber-400/20", icon: "fa-map-location-dot", defaultTab: "destinations" },
    hotel: { label: "Hotel", badgeClass: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20", icon: "fa-hotel", defaultTab: "hotels" },
    restaurant: { label: "Restaurant", badgeClass: "bg-purple-400/10 text-purple-400 border-purple-400/20", icon: "fa-utensils", defaultTab: "restaurants" },
    attraction: { label: "Attraction", badgeClass: "bg-sky-400/10 text-sky-400 border-sky-400/20", icon: "fa-ticket", defaultTab: "attractions" },
    flight: { label: "Flight", badgeClass: "bg-indigo-400/10 text-indigo-400 border-indigo-400/20", icon: "fa-plane", defaultTab: "flights" }
  };

  function esc(v) {
    if (v == null) return "";
    return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function getItemImage(f) {
    var type = (f.favorable_type || "").toLowerCase();
    var item = f.item || {};

    if (item.image_url) return item.image_url;
    if (item.images && Array.isArray(item.images) && item.images.length) return item.images[0];

    // Fallback to UnsplashHelper
    if (global.UnsplashHelper && typeof global.UnsplashHelper.getImageUrl === "function") {
      var category = type === "destination" ? "city" : type;
      return global.UnsplashHelper.getImageUrl(category, item.name || type, 600, 400);
    }

    return "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80";
  }

  function getItemTitle(item) {
    if (!item) return "Saved Place";
    return item.name || item.title || item.flight_number || "Saved Place";
  }

  function getItemSubtitle(item, type) {
    if (!item) return "Saved Item";
    if (item.city_name) return item.city_name + (item.country_name ? ", " + item.country_name : "");
    if (item.destination && item.destination.name) return item.destination.name;
    if (item.address) return item.address;
    if (item.cuisine_type) return item.cuisine_type + " Cuisine";
    return type.toUpperCase() + " BOOKMARK";
  }

  function updateCounts() {
    var counts = { all: 0, destination: 0, hotel: 0, restaurant: 0, attraction: 0 };
    allFavourites.forEach(function (f) {
      var t = (f.favorable_type || "").toLowerCase();
      counts.all++;
      if (counts[t] !== undefined) counts[t]++;
    });

    var countAll = document.getElementById("count-all");
    var countDest = document.getElementById("count-destinations");
    var countHotels = document.getElementById("count-hotels");
    var countRests = document.getElementById("count-restaurants");
    var countAttr = document.getElementById("count-attractions");

    if (countAll) countAll.textContent = counts.all;
    if (countDest) countDest.textContent = counts.destination;
    if (countHotels) countHotels.textContent = counts.hotel;
    if (countRests) countRests.textContent = counts.restaurant;
    if (countAttr) countAttr.textContent = counts.attraction;
  }

  function renderGrid() {
    if (!grid) return;

    var filtered = allFavourites.filter(function (f) {
      if (currentFilter === "all") return true;
      return (f.favorable_type || "").toLowerCase() === currentFilter;
    });

    if (!filtered.length) {
      grid.innerHTML = '<div class="col-span-full py-16 text-center text-white/50 bg-white/5 rounded-3xl border border-white/10 p-8">' +
        '<div class="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 text-2xl shadow-lg shadow-rose-500/10">' +
          '<i class="fas fa-heart-crack"></i>' +
        '</div>' +
        '<h3 class="text-xl font-bold text-white mb-2">No Saved Favourites Found</h3>' +
        '<p class="text-sm text-white/60 mb-6 max-w-md mx-auto">' +
          (currentFilter === "all" ? "You haven't bookmarked any places yet. Tap the heart on any destination or stay to save it here." : "No saved items found in this category.") +
        '</p>' +
        '<a href="../explore.html" class="px-6 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs transition inline-flex items-center gap-2 shadow-lg shadow-amber-500/10">' +
          '<i class="fas fa-compass"></i> Explore Catalog' +
        '</a>' +
      '</div>';
      return;
    }

    grid.innerHTML = filtered.map(function (f) {
      var item = f.item || {};
      var typeKey = (f.favorable_type || "").toLowerCase();
      var typeConf = TYPE_CONFIG[typeKey] || TYPE_CONFIG.destination;
      var title = getItemTitle(item);
      var sub = getItemSubtitle(item, typeKey);
      var imgSrc = getItemImage(f);
      var rating = item.rating || (4.5 + (f.id % 5) * 0.1).toFixed(1);
      var targetTab = typeConf.defaultTab;
      var cardUrl = "../explore.html?tab=" + targetTab;

      return '<div class="fav-card-item rounded-2xl bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-amber-400/30 overflow-hidden transition-all duration-300 group flex flex-col justify-between shadow-lg hover:shadow-amber-500/5" data-fav-id="' + f.id + '" data-type="' + esc(typeKey) + '" data-fid="' + f.favorable_id + '">' +
        '<!-- Card Header Image -->' +
        '<div class="relative h-48 overflow-hidden">' +
          '<img src="' + esc(imgSrc) + '" alt="' + esc(title) + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onerror="this.src=\'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80\';" />' +
          '<div class="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-80"></div>' +

          '<!-- Type Kicker Badge -->' +
          '<span class="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-md backdrop-blur-md ' + typeConf.badgeClass + '">' +
            '<i class="fas ' + typeConf.icon + ' mr-1"></i>' + esc(typeConf.label) +
          '</span>' +

          '<!-- Heart Remove Button -->' +
          '<button type="button" class="btn-remove-fav absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-rose-500 text-rose-400 hover:text-white border border-white/20 flex items-center justify-center transition shadow-lg group/btn" title="Remove from favourites" aria-label="Remove ' + esc(title) + '">' +
            '<i class="fas fa-heart text-sm group-hover/btn:scale-110 transition"></i>' +
          '</button>' +

          '<!-- Rating Badge -->' +
          '<div class="absolute bottom-3 right-3 px-2.5 py-0.5 rounded-full bg-black/70 border border-white/10 text-amber-400 text-xs font-bold flex items-center gap-1 backdrop-blur-sm">' +
            '<i class="fas fa-star text-[10px]"></i>' + esc(rating) +
          '</div>' +
        '</div>' +

        '<!-- Card Body Content -->' +
        '<div class="p-5 flex-1 flex flex-col justify-between space-y-4">' +
          '<div>' +
            '<h3 class="text-base font-bold text-white group-hover:text-amber-400 transition line-clamp-1 mb-1">' + esc(title) + '</h3>' +
            '<p class="text-xs text-white/60 line-clamp-1 flex items-center gap-1.5">' +
              '<i class="fas fa-location-dot text-amber-400/70 text-[10px]"></i>' + esc(sub) +
            '</p>' +
          '</div>' +

          '<!-- Card Action Link -->' +
          '<a href="' + cardUrl + '" class="w-full py-2.5 rounded-xl bg-white/5 hover:bg-amber-400 hover:text-black text-white text-xs font-bold transition flex items-center justify-center gap-2 border border-white/10 hover:border-amber-400 shadow-sm">' +
            '<span>View Details</span>' +
            '<i class="fas fa-arrow-right text-[10px]"></i>' +
          '</a>' +
        '</div>' +
      '</div>';
    }).join("");

    // Wire Remove Heart Buttons
    Array.prototype.forEach.call(grid.querySelectorAll(".btn-remove-fav"), function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var card = btn.closest(".fav-card-item");
        if (!card) return;

        var type = card.dataset.type;
        var fid = card.dataset.fid;
        var favId = parseInt(card.dataset.favId, 10);

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin text-xs"></i>';

        It.apiPost("/favourites/" + type + "/" + fid, {}, { auth: true }).then(function (res) {
          if (res.ok) {
            It.app.showToast("Item removed from saved favourites.", "success");

            // Filter out of memory
            allFavourites = allFavourites.filter(function (item) {
              return item.id !== favId;
            });

            updateCounts();
            renderGrid();
          } else {
            It.app.showToast("Could not remove item.", "error");
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-heart text-sm"></i>';
          }
        }).catch(function () {
          It.app.showToast("Could not update favourites.", "error");
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-heart text-sm"></i>';
        });
      });
    });
  }

  function setupFilters() {
    var buttons = document.querySelectorAll(".fav-filter-btn");
    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener("click", function () {
        currentFilter = btn.dataset.filter || "all";
        Array.prototype.forEach.call(buttons, function (b) {
          b.classList.remove("active", "bg-amber-400", "text-black", "font-bold");
          b.classList.add("bg-white/5", "text-white/80", "font-semibold");
        });
        btn.classList.remove("bg-white/5", "text-white/80", "font-semibold");
        btn.classList.add("active", "bg-amber-400", "text-black", "font-bold");

        renderGrid();
      });
    });
  }

  function loadFavourites() {
    It.apiGet("/dashboard/favourites", { auth: true }).then(function (res) {
      var raw = res.data !== undefined ? res.data : (res.body ? (res.body.data || res.body) : res);
      var items = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.data) ? raw.data : []);
      allFavourites = items;

      updateCounts();
      renderGrid();
    }).catch(function () {
      if (grid) {
        grid.innerHTML = '<div class="col-span-full py-16 text-center text-white/50 bg-white/5 rounded-3xl border border-white/10 p-8">' +
          '<h3 class="text-xl font-bold text-white mb-2">Could Not Load Favourites</h3>' +
          '<p class="text-sm text-white/60 mb-6">Please log in to view your saved places and collection.</p>' +
          '<a href="../auth/login.html" class="px-5 py-2.5 rounded-full bg-amber-400 text-black text-xs font-bold">Log In</a>' +
        '</div>';
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setupFilters();
      loadFavourites();
    });
  } else {
    setupFilters();
    loadFavourites();
  }
})(window);
