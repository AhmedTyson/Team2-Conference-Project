/**
 * catalog-destinations.js — Destinations list (destinations.html).
 * Live data: GET /v1/destinations (wrapped {success, data:[...]}).
 */
(function (global) {
  "use strict";

  const It = global.Itinari;
  const CC = It && It.catalog;
  if (!CC) return;

  const grid = document.getElementById("destGrid");

  function card(d) {
    const country = d.country ? d.country.name : "";
    const loc = [d.city_name, country].filter(Boolean).join(", ");
    const el = document.createElement("a");
    el.className = "cat-card";
    el.href = "destination-details.html?id=" + encodeURIComponent(d.id);
    el.innerHTML =
      '<div class="cat-thumb">' +
      '<button type="button" class="heart-btn" data-type="destination" data-id="' + d.id + '" data-name="' + CC.escapeHtml(d.name) + '" aria-label="Favourite ' + CC.escapeHtml(d.name) + '">' +
      '<i class="fas fa-heart" aria-hidden="true"></i></button>' +
      '<img alt="" loading="lazy" data-w="640" data-h="420" />' +
      "</div>" +
      '<div class="cat-name">' + CC.escapeHtml(d.name) + "</div>" +
      (loc ? '<div class="cat-meta"><i class="fas fa-map-marker-alt" aria-hidden="true"></i>' + CC.escapeHtml(loc) + "</div>" : "") +
      (d.description ? '<div class="cat-desc">' + CC.escapeHtml(d.description) + "</div>" : "");

    CC.bindImg(el.querySelector("img"), d);
    return el;
  }

  async function load() {
    try {
      const res = await It.apiGet(CC.ROUTES.destinations);
      const list = CC.dataOf(res.body);
      grid.innerHTML = "";
      if (!list.length) {
        grid.innerHTML = '<div style="grid-column:1/-1;">' + CC.emptyState("fa-map-marked-alt", "No destinations yet", "The catalog is empty right now. Please check back soon.", "index.html") + "</div>";
        return;
      }
      list.forEach(function (d) { grid.appendChild(card(d)); });
      CC.initFavs();
    } catch (e) {
      grid.innerHTML = '<div style="grid-column:1/-1;">' + CC.emptyState("fa-wifi", "Could not load destinations", "The catalog server is unreachable right now. Please try again shortly.", "index.html") + "</div>";
    }
  }

  load();
})(window);
