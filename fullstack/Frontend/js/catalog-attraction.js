/**
 * catalog-attraction.js — Attraction detail (attraction.html?id=<id>).
 * Live data: GET /v1/attractions/{id} (bare AttractionResource).
 */
(function (global) {
  "use strict";

  const It = global.Itinera;
  const CC = It && It.catalog;
  if (!CC) return;

  const root = document.getElementById("detailRoot");
  const id = Number(new URLSearchParams(global.location.search).get("id"));

  function hero(a) {
    const dest = a.destination ? a.destination.name : "";
    return (
      '<div class="cat-hero">' +
      '<img alt="" data-w="1200" data-h="640" />' +
      '<div class="cat-hero-shade"></div>' +
      '<div class="cat-hero-caption">' +
      '<h1>' + CC.escapeHtml(a.name) + "</h1>" +
      (dest ? '<p class="text-white/60 text-sm mt-1"><i class="fas fa-map-marker-alt mr-1" aria-hidden="true"></i>' + CC.escapeHtml(dest) + "</p>" : "") +
      '<div class="flex items-center gap-3 mt-4 flex-wrap">' +
      '<button type="button" class="heart-btn" data-type="attraction" data-id="' + a.id + '" data-name="' + CC.escapeHtml(a.name) + '" aria-label="Favourite">' +
      '<i class="fas fa-heart" aria-hidden="true"></i></button>' +
      '<button type="button" class="btn-outline review-btn" data-type="attraction" data-id="' + a.id + '" data-name="' + CC.escapeHtml(a.name) + '">' +
      '<i class="fas fa-star" aria-hidden="true"></i>Review</button>' +
      "</div></div></div>"
    );
  }

  function facts(a) {
    return (
      '<div class="facts">' +
      (a.category ? '<div class="fact"><div class="fact-label"><i class="fas fa-th-large" aria-hidden="true"></i>Category</div><div class="fact-value">' + CC.escapeHtml(a.category.name) + "</div></div>" : "") +
      (a.destination ? '<div class="fact"><div class="fact-label"><i class="fas fa-map-marked-alt" aria-hidden="true"></i>Destination</div><div class="fact-value">' + CC.escapeHtml(a.destination.name) + "</div></div>" : "") +
      '<div class="fact"><div class="fact-label"><i class="fas fa-map-pin" aria-hidden="true"></i>Coordinates</div><div class="fact-value">' + (a.latitude != null ? Number(a.latitude).toFixed(3) + ", " + Number(a.longitude).toFixed(3) : "—") + "</div></div>" +
      "</div>"
    );
  }

  function render(a) {
    root.innerHTML =
      hero(a) +
      '<div class="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">' +
      '<div class="glass-card p-6 lg:col-span-2">' +
      "<h2 class=\"text-lg font-bold mb-3\"><i class=\"fas fa-info-circle text-red-400 mr-2\" aria-hidden=\"true\"></i>About this place</h2>" +
      (a.description ? '<p class="text-white/55 text-sm leading-relaxed">' + CC.escapeHtml(a.description) + "</p>" : '<p class="text-white/40 text-sm">No description available.</p>') +
      "</div>" +
      '<div class="glass-card p-6">' +
      "<h2 class=\"text-lg font-bold mb-4\"><i class=\"fas fa-layer-group text-red-400 mr-2\" aria-hidden=\"true\"></i>Facts</h2>" +
      facts(a) +
      "</div>" +
      "</div>";

    const img = root.querySelector(".cat-hero img");
    if (img) CC.bindImg(img, a);

    CC.initFavs();
    CC.initReviewBtns();
  }

  async function load() {
    if (!id) {
      root.innerHTML = CC.emptyState("fa-camera", "Attraction not found", "No attraction selected.", "attractions.html");
      return;
    }
    try {
      const res = await It.apiGet(CC.ROUTES.attractions + "/" + id);
      if (!res.ok || !res.body || !res.body.data) {
        root.innerHTML = CC.emptyState("fa-camera", "Attraction not found", "It may have been removed from the catalog.", "attractions.html");
        return;
      }
      render(res.body.data);
    } catch (e) {
      root.innerHTML = CC.emptyState("fa-wifi", "Could not load this attraction", "The catalog server is unreachable right now. Please try again shortly.", "attractions.html");
    }
  }

  load();
})(window);
