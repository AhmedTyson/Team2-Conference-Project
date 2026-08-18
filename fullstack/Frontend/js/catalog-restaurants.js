/**
 * catalog-restaurants.js — Restaurants list (restaurants.html).
 * Live data: GET /v1/restaurants — bare collection (items under body.data).
 */
(function (global) {
  "use strict";

  const It = global.Itinera;
  const CC = It && It.catalog;
  if (!CC) return;

  const grid = document.getElementById("restGrid");

  function card(r) {
    const dest = r.destination ? r.destination.name : "";
    const el = document.createElement("a");
    el.className = "cat-card";
    el.href = "restaurant-details.html?id=" + encodeURIComponent(r.id);
    el.innerHTML =
      '<div class="cat-thumb">' +
      '<button type="button" class="heart-btn" data-type="restaurant" data-id="' + r.id + '" data-name="' + CC.escapeHtml(r.name) + '" aria-label="Favourite ' + CC.escapeHtml(r.name) + '">' +
      '<i class="fas fa-heart" aria-hidden="true"></i></button>' +
      '<img alt="" loading="lazy" data-w="640" data-h="420" />' +
      "</div>" +
      '<div class="cat-name">' + CC.escapeHtml(r.name) + "</div>" +
      '<div class="cat-meta">' +
      (r.cuisine ? '<span class="chip"><i class="fas fa-utensils" aria-hidden="true"></i>' + CC.escapeHtml(r.cuisine) + "</span>" : "") +
      (r.price_range ? '<span class="chip">' + CC.escapeHtml(r.price_range) + "</span>" : "") +
      "</div>" +
      '<div class="cat-meta">' +
      (r.rating != null ? CC.stars(r.rating) : "") +
      (dest ? '<span class="ml-auto"><i class="fas fa-map-marker-alt" aria-hidden="true"></i>' + CC.escapeHtml(dest) + "</span>" : "") +
      "</div>";

    CC.bindImg(el.querySelector("img"), r);
    return el;
  }

  async function load() {
    try {
      const res = await It.apiGet(CC.ROUTES.restaurants);
      const list = CC.dataOf(res.body);
      grid.innerHTML = "";
      if (!list.length) {
        grid.innerHTML = '<div style="grid-column:1/-1;">' + CC.emptyState("fa-utensils", "No restaurants yet", "The catalog is empty right now. Please check back soon.", "index.html") + "</div>";
        return;
      }
      list.forEach(function (r) { grid.appendChild(card(r)); });
      CC.initFavs();
    } catch (e) {
      grid.innerHTML = '<div style="grid-column:1/-1;">' + CC.emptyState("fa-wifi", "Could not load restaurants", "The catalog server is unreachable right now. Please try again shortly.", "index.html") + "</div>";
    }
  }

  load();
})(window);
