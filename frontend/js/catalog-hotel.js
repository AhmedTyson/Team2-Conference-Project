/**
 * catalog-hotel.js — Hotel detail (hotel.html?id=<id>).
 * Live data: GET /v1/hotels/{id} (bare HotelResource).
 * Shows price/stars/rating/availability + favourite + review (stub).
 */
(function (global) {
  "use strict";

  const It = global.Itinari;
  const CC = It && It.catalog;
  if (!CC) return;

  const root = document.getElementById("detailRoot");
  const id = Number(new URLSearchParams(global.location.search).get("id"));

  function hero(h) {
    const dest = h.destination ? h.destination.name : "";
    return (
      '<div class="cat-hero">' +
      '<img alt="" data-w="1200" data-h="640" />' +
      '<div class="cat-hero-shade"></div>' +
      '<div class="cat-hero-caption">' +
      '<h1>' + CC.escapeHtml(h.name) + "</h1>" +
      (dest ? '<p class="text-white/60 text-sm mt-1"><i class="fas fa-map-marker-alt mr-1" aria-hidden="true"></i>' + CC.escapeHtml(dest) + "</p>" : "") +
      '<div class="flex items-center gap-3 mt-4 flex-wrap">' +
      '<button type="button" class="heart-btn" data-type="hotel" data-id="' + h.id + '" data-name="' + CC.escapeHtml(h.name) + '" aria-label="Favourite">' +
      '<i class="fas fa-heart" aria-hidden="true"></i></button>' +
      '<button type="button" class="btn-outline review-btn" data-type="hotel" data-id="' + h.id + '" data-name="' + CC.escapeHtml(h.name) + '">' +
      '<i class="fas fa-star" aria-hidden="true"></i>Review</button>' +
      "</div></div></div>"
    );
  }

  function facts(h) {
    const price = CC.fmtPrice(h.price_per_night);
    return (
      '<div class="facts">' +
      (price ? '<div class="fact"><div class="fact-label"><i class="fas fa-tag" aria-hidden="true"></i>Price / night</div><div class="fact-value">' + price + "</div></div>" : "") +
      '<div class="fact"><div class="fact-label"><i class="fas fa-star" aria-hidden="true"></i>Rating</div><div class="fact-value">' + (h.rating != null ? Number(h.rating).toFixed(1) : "—") + CC.stars(h.rating) + "</div></div>" +
      '<div class="fact"><div class="fact-label"><i class="fas fa-hotel" aria-hidden="true"></i>Stars</div><div class="fact-value">' + (h.stars ? h.stars + " star" : "—") + "</div></div>" +
      '<div class="fact"><div class="fact-label"><i class="fas fa-door-open" aria-hidden="true"></i>Availability</div><div class="fact-value">' + (h.availability != null ? (h.availability ? "Available" : "Fully booked") : "—") + "</div></div>" +
      "</div>"
    );
  }

  function render(h) {
    const dest = h.destination || null;
    root.innerHTML =
      hero(h) +
      '<div class="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">' +
      '<div class="glass-card p-6 lg:col-span-2">' +
      "<h2 class=\"text-lg font-bold mb-3\"><i class=\"fas fa-info-circle text-red-400 mr-2\" aria-hidden=\"true\"></i>About this stay</h2>" +
      (h.address ? '<p class="text-white/55 text-sm leading-relaxed mb-3"><i class="fas fa-location-dot mr-1" aria-hidden="true"></i>' + CC.escapeHtml(h.address) + "</p>" : "") +
      (h.rating != null
        ? '<div class="review-avg"><div class="big-score">' + Number(h.rating).toFixed(1) + "</div>" +
          '<div><div class="stars">' + CC.stars(h.rating) + "</div>" +
          '<p class="text-xs text-white/40 mt-1">Guest rating — individual reviews arrive with the reviews feature (next phase).</p></div></div>'
        : '<p class="text-white/40 text-sm">No guest rating yet.</p>') +
      "</div>" +
      '<div class="glass-card p-6">' +
      "<h2 class=\"text-lg font-bold mb-4\"><i class=\"fas fa-layer-group text-red-400 mr-2\" aria-hidden=\"true\"></i>Facts</h2>" +
      facts(h) +
      "</div>" +
      "</div>";

    const img = root.querySelector(".cat-hero img");
    if (img) CC.bindImg(img, h);

    CC.initFavs();
    CC.initReviewBtns();
  }

  async function load() {
    if (!id) {
      root.innerHTML = CC.emptyState("fa-hotel", "Hotel not found", "No hotel selected.", "hotels.html");
      return;
    }
    try {
      const res = await It.apiGet(CC.ROUTES.hotels + "/" + id);
      if (!res.ok || !res.body || !res.body.data) {
        root.innerHTML = CC.emptyState("fa-hotel", "Hotel not found", "It may have been removed from the catalog.", "hotels.html");
        return;
      }
      render(res.body.data);
    } catch (e) {
      root.innerHTML = CC.emptyState("fa-wifi", "Could not load this hotel", "The catalog server is unreachable right now. Please try again shortly.", "hotels.html");
    }
  }

  load();
})(window);
