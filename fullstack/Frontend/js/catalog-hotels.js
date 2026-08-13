/**
 * catalog-hotels.js — Hotels list (hotels.html).
 * Live data: GET /v1/hotels — bare Laravel paginator, items under body.data.
 */
(function (global) {
  "use strict";

  const It = global.Itinari;
  const CC = It && It.catalog;
  if (!CC) return;

  const grid = document.getElementById("hotelGrid");

  function card(h) {
    const dest = h.destination ? h.destination.name : "";
    const price = CC.fmtPrice(h.price_per_night);
    const el = document.createElement("a");
    el.className = "cat-card";
    el.href = "hotel-details.html?id=" + encodeURIComponent(h.id);
    el.innerHTML =
      '<div class="cat-thumb">' +
      '<button type="button" class="heart-btn" data-type="hotel" data-id="' + h.id + '" data-name="' + CC.escapeHtml(h.name) + '" aria-label="Favourite ' + CC.escapeHtml(h.name) + '">' +
      '<i class="fas fa-heart" aria-hidden="true"></i></button>' +
      '<img alt="" loading="lazy" data-w="640" data-h="420" />' +
      "</div>" +
      '<div class="cat-name">' + CC.escapeHtml(h.name) + "</div>" +
      '<div class="cat-meta">' +
      (h.stars ? '<span class="stars" aria-label="' + h.stars + ' star hotel">' + '<i class="fas fa-star" aria-hidden="true"></i>'.repeat(h.stars) + "</span>" : "") +
      (h.rating != null ? CC.stars(h.rating) : "") +
      "</div>" +
      (dest ? '<div class="cat-meta"><i class="fas fa-map-marker-alt" aria-hidden="true"></i>' + CC.escapeHtml(dest) + "</div>" : "") +
      '<div class="cat-meta" style="justify-content:space-between; margin-top:0.5rem;">' +
      (price ? '<span class="text-white font-bold text-sm">' + price + '<span class="text-white/40 font-normal text-xs"> /night</span></span>' : "<span></span>") +
      (h.availability != null
        ? '<span class="chip ' + (h.availability ? "green" : "") + '"><i class="fas ' + (h.availability ? "fa-check" : "fa-xmark") + '" aria-hidden="true"></i>' + (h.availability ? "Available" : "Booked") + "</span>"
        : "") +
      "</div>";

    CC.bindImg(el.querySelector("img"), h);
    return el;
  }

  async function load() {
    try {
      const res = await It.apiGet(CC.ROUTES.hotels);
      const list = CC.dataOf(res.body);
      grid.innerHTML = "";
      if (!list.length) {
        grid.innerHTML = '<div style="grid-column:1/-1;">' + CC.emptyState("fa-hotel", "No hotels yet", "The catalog is empty right now. Please check back soon.", "index.html") + "</div>";
        return;
      }
      list.forEach(function (h) { grid.appendChild(card(h)); });
      CC.initFavs();
    } catch (e) {
      grid.innerHTML = '<div style="grid-column:1/-1;">' + CC.emptyState("fa-wifi", "Could not load hotels", "The catalog server is unreachable right now. Please try again shortly.", "index.html") + "</div>";
    }
  }

  load();
})(window);
