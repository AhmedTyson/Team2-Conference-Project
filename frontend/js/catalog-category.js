/**
 * catalog-category.js — Category detail (category.html?id=N).
 * Live data:
 *   GET /v1/categories/{id} → bare model {id, name}
 *   GET /v1/restaurants + GET /v1/attractions → filtered client-side by category_id
 *
 * NOTE: Destinations & hotels carry no category relation in this backend,
 * so a category page can only surface restaurants and attractions.
 */
(function (global) {
  "use strict";

  const It = global.Itinari;
  const CC = It && It.catalog;
  if (!CC) return;

  const catId = new URLSearchParams(global.location.search).get("id");
  const titleEl = document.getElementById("catTitle");
  const bodyEl = document.getElementById("catBody");

  function sectionHtml(icon, label, items, cardFn) {
    let html =
      '<section class="result-group">' +
      '<h3 class="result-group-title"><i class="fas ' + icon + '" aria-hidden="true"></i>' +
      CC.escapeHtml(label) + ' <span class="result-count">' + items.length + "</span></h3>" +
      '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">';
    items.forEach(function (item) { html += cardFn(item); });
    html += "</div></section>";
    return html;
  }

  function restaurantCard(r) {
    const dest = r.destination ? r.destination.name : "";
    return (
      '<a class="cat-card" href="restaurant-details.html?id=' + encodeURIComponent(r.id) + '">' +
      '<div class="cat-thumb">' +
      '<button type="button" class="heart-btn" data-type="restaurant" data-id="' + r.id + '" data-name="' + CC.escapeHtml(r.name) + '" aria-label="Favourite ' + CC.escapeHtml(r.name) + '">' +
      '<i class="fas fa-heart" aria-hidden="true"></i></button>' +
      '<img alt="" loading="lazy" data-w="640" data-h="420" /></div>' +
      '<div class="cat-name">' + CC.escapeHtml(r.name) + "</div>" +
      '<div class="cat-meta">' +
      (r.cuisine ? '<span class="chip"><i class="fas fa-utensils" aria-hidden="true"></i>' + CC.escapeHtml(r.cuisine) + "</span>" : "") +
      (r.price_range ? '<span class="chip">' + CC.escapeHtml(r.price_range) + "</span>" : "") +
      "</div>" +
      '<div class="cat-meta">' +
      (r.rating != null ? CC.stars(r.rating) : "") +
      (dest ? '<span class="ml-auto"><i class="fas fa-map-marker-alt" aria-hidden="true"></i>' + CC.escapeHtml(dest) + "</span>" : "") +
      "</div></a>"
    );
  }

  function attractionCard(a) {
    const dest = a.destination ? a.destination.name : "";
    return (
      '<a class="cat-card" href="attraction-details.html?id=' + encodeURIComponent(a.id) + '">' +
      '<div class="cat-thumb">' +
      '<button type="button" class="heart-btn" data-type="attraction" data-id="' + a.id + '" data-name="' + CC.escapeHtml(a.name) + '" aria-label="Favourite ' + CC.escapeHtml(a.name) + '">' +
      '<i class="fas fa-heart" aria-hidden="true"></i></button>' +
      '<img alt="" loading="lazy" data-w="640" data-h="420" /></div>' +
      '<div class="cat-name">' + CC.escapeHtml(a.name) + "</div>" +
      (a.category ? '<div class="cat-meta"><span class="chip"><i class="fas fa-th-large" aria-hidden="true"></i>' + CC.escapeHtml(a.category.name) + "</span></div>" : "") +
      (dest ? '<div class="cat-meta"><i class="fas fa-map-marker-alt" aria-hidden="true"></i>' + CC.escapeHtml(dest) + "</div>" : "") +
      (a.description ? '<div class="cat-desc">' + CC.escapeHtml(a.description) + "</div>" : "") +
      "</a>"
    );
  }

  function empty() {
    bodyEl.innerHTML =
      '<div class="result-group">' +
      CC.emptyState("fa-th-large", "Nothing in this category yet", "No restaurants or attractions are tagged with this category right now. Try another one.", "categories.html") +
      "</div>";
  }

  function render(cat, restaurants, attractions) {
    titleEl.textContent = cat.name;
    const rest = restaurants.filter(function (r) { return Number(r.category_id) === Number(cat.id); });
    const attr = attractions.filter(function (a) { return Number(a.category_id) === Number(cat.id); });

    if (!rest.length && !attr.length) { empty(); return; }

    let html = "";
    if (rest.length) html += sectionHtml("fa-utensils", "Restaurants", rest, restaurantCard);
    if (attr.length) html += sectionHtml("fa-camera", "Attractions", attr, attractionCard);
    bodyEl.innerHTML = html;

    bodyEl.querySelectorAll("img[data-w]").forEach(function (img) {
      const list = rest.concat(attr);
      const id = img.closest(".cat-card").getAttribute("href");
      const m = id && id.match(/id=(\d+)/);
      const item = m && list.find(function (x) { return String(x.id) === m[1]; });
      CC.bindImg(img, item);
    });
    CC.initFavs();
  }

  async function load() {
    if (!catId) {
      titleEl.textContent = "Category";
      empty();
      return;
    }
    try {
      const [resCat, resRest, resAttr] = await Promise.all([
        It.apiGet(CC.ROUTES.categories + "/" + encodeURIComponent(catId)),
        It.apiGet(CC.ROUTES.restaurants),
        It.apiGet(CC.ROUTES.attractions),
      ]);
      const catBody = resCat.body && resCat.body.data;
      const cat = Array.isArray(catBody) ? catBody[0] : catBody;
      if (!cat || !cat.id) { empty(); return; }
      render(cat, CC.dataOf(resRest.body), CC.dataOf(resAttr.body));
    } catch (e) {
      titleEl.textContent = "Category";
      bodyEl.innerHTML =
        '<div class="result-group">' +
        CC.emptyState("fa-wifi", "Could not load this category", "The catalog server is unreachable right now. Please try again shortly.", "categories.html") +
        "</div>";
    }
  }

  load();
})(window);
