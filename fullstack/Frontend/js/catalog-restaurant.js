/**
 * catalog-restaurant.js — Restaurant detail (restaurant.html?id=<id>).
 * Live data: GET /v1/restaurants/{id} (bare RestaurantResource).
 */
(function (global) {
  "use strict";

  const It = global.Itinera;
  const CC = It && It.catalog;
  if (!CC) return;

  const root = document.getElementById("detailRoot");
  const id = Number(new URLSearchParams(global.location.search).get("id"));

  function hero(r) {
    const dest = r.destination ? r.destination.name : "";
    return (
      '<div class="cat-hero">' +
      '<img alt="" data-w="1200" data-h="640" />' +
      '<div class="cat-hero-shade"></div>' +
      '<div class="cat-hero-caption">' +
      '<h1>' + CC.escapeHtml(r.name) + "</h1>" +
      (dest ? '<p class="text-white/60 text-sm mt-1"><i class="fas fa-map-marker-alt mr-1" aria-hidden="true"></i>' + CC.escapeHtml(dest) + "</p>" : "") +
      '<div class="flex items-center gap-3 mt-4 flex-wrap">' +
      '<button type="button" class="heart-btn" data-type="restaurant" data-id="' + r.id + '" data-name="' + CC.escapeHtml(r.name) + '" aria-label="Favourite">' +
      '<i class="fas fa-heart" aria-hidden="true"></i></button>' +
      '<button type="button" class="btn-outline review-btn" data-type="restaurant" data-id="' + r.id + '" data-name="' + CC.escapeHtml(r.name) + '">' +
      '<i class="fas fa-star" aria-hidden="true"></i>Review</button>' +
      "</div></div></div>"
    );
  }

  function facts(r) {
    return (
      '<div class="facts">' +
      (r.cuisine ? '<div class="fact"><div class="fact-label"><i class="fas fa-utensils" aria-hidden="true"></i>Cuisine</div><div class="fact-value">' + CC.escapeHtml(r.cuisine) + "</div></div>" : "") +
      (r.price_range ? '<div class="fact"><div class="fact-label"><i class="fas fa-tag" aria-hidden="true"></i>Price range</div><div class="fact-value">' + CC.escapeHtml(r.price_range) + "</div></div>" : "") +
      '<div class="fact"><div class="fact-label"><i class="fas fa-star" aria-hidden="true"></i>Rating</div><div class="fact-value">' + (r.rating != null ? Number(r.rating).toFixed(1) : "—") + "</div></div>" +
      (r.category ? '<div class="fact"><div class="fact-label"><i class="fas fa-th-large" aria-hidden="true"></i>Category</div><div class="fact-value">' + CC.escapeHtml(r.category.name) + "</div></div>" : "") +
      "</div>"
    );
  }

  function render(r) {
    root.innerHTML =
      hero(r) +
      '<div class="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">' +
      '<div class="glass-card p-6 lg:col-span-2">' +
      "<h2 class=\"text-lg font-bold mb-3\"><i class=\"fas fa-info-circle text-red-400 mr-2\" aria-hidden=\"true\"></i>About this place</h2>" +
      (r.address ? '<p class="text-white/55 text-sm leading-relaxed mb-3"><i class="fas fa-location-dot mr-1" aria-hidden="true"></i>' + CC.escapeHtml(r.address) + "</p>" : "") +
      (r.rating != null
        ? '<div class="review-avg"><div class="big-score">' + Number(r.rating).toFixed(1) + "</div>" +
          '<div><div class="stars">' + CC.stars(r.rating) + "</div>" +
          '<p class="text-xs text-white/40 mt-1">Guest rating — individual reviews arrive with the reviews feature (next phase).</p></div></div>'
        : '<p class="text-white/40 text-sm">No guest rating yet.</p>') +
      "</div>" +
      '<div class="glass-card p-6">' +
      "<h2 class=\"text-lg font-bold mb-4\"><i class=\"fas fa-layer-group text-red-400 mr-2\" aria-hidden=\"true\"></i>Facts</h2>" +
      facts(r) +
      "</div>" +
      "</div>";

    const img = root.querySelector(".cat-hero img");
    if (img) CC.bindImg(img, r);

    CC.initFavs();
    CC.initReviewBtns();
  }

  async function load() {
    if (!id) {
      root.innerHTML = CC.emptyState("fa-utensils", "Restaurant not found", "No restaurant selected.", "restaurants.html");
      return;
    }
    try {
      const res = await It.apiGet(CC.ROUTES.restaurants + "/" + id);
      if (!res.ok || !res.body || !res.body.data) {
        root.innerHTML = CC.emptyState("fa-utensils", "Restaurant not found", "It may have been removed from the catalog.", "restaurants.html");
        return;
      }
      render(res.body.data);
    } catch (e) {
      root.innerHTML = CC.emptyState("fa-wifi", "Could not load this restaurant", "The catalog server is unreachable right now. Please try again shortly.", "restaurants.html");
    }
  }

  load();
})(window);
