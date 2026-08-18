/**
 * catalog-attractions.js — Attractions list (attractions.html).
 * Live data: GET /v1/attractions — bare collection (items under body.data).
 */
(function (global) {
  "use strict";

  const It = global.Itinera;
  const CC = It && It.catalog;
  if (!CC) return;

  const grid = document.getElementById("attrGrid");

  function card(a) {
    const dest = a.destination ? a.destination.name : "";
    const el = document.createElement("a");
    el.className = "cat-card";
    el.href = "attraction-details.html?id=" + encodeURIComponent(a.id);
    el.innerHTML =
      '<div class="cat-thumb">' +
      '<button type="button" class="heart-btn" data-type="attraction" data-id="' + a.id + '" data-name="' + CC.escapeHtml(a.name) + '" aria-label="Favourite ' + CC.escapeHtml(a.name) + '">' +
      '<i class="fas fa-heart" aria-hidden="true"></i></button>' +
      '<img alt="" loading="lazy" data-w="640" data-h="420" />' +
      "</div>" +
      '<div class="cat-name">' + CC.escapeHtml(a.name) + "</div>" +
      (a.category ? '<div class="cat-meta"><span class="chip"><i class="fas fa-th-large" aria-hidden="true"></i>' + CC.escapeHtml(a.category.name) + "</span></div>" : "") +
      (dest ? '<div class="cat-meta"><i class="fas fa-map-marker-alt" aria-hidden="true"></i>' + CC.escapeHtml(dest) + "</div>" : "") +
      (a.description ? '<div class="cat-desc">' + CC.escapeHtml(a.description) + "</div>" : "");

    CC.bindImg(el.querySelector("img"), a);
    return el;
  }

  async function load() {
    try {
      const res = await It.apiGet(CC.ROUTES.attractions);
      const list = CC.dataOf(res.body);
      grid.innerHTML = "";
      if (!list.length) {
        grid.innerHTML = '<div style="grid-column:1/-1;">' + CC.emptyState("fa-camera", "No attractions yet", "The catalog is empty right now. Please check back soon.", "index.html") + "</div>";
        return;
      }
      list.forEach(function (a) { grid.appendChild(card(a)); });
      CC.initFavs();
    } catch (e) {
      grid.innerHTML = '<div style="grid-column:1/-1;">' + CC.emptyState("fa-wifi", "Could not load attractions", "The catalog server is unreachable right now. Please try again shortly.", "index.html") + "</div>";
    }
  }

  load();
})(window);
