/**
 * catalog-categories.js — Categories index (categories.html).
 * Live data: GET /v1/categories (wrapped {success, data:[...]}).
 *
 * NOTE: CategoryResource exposes only id/name (type/icon exist in the DB
 * but are not serialized) — icons are derived from the category name.
 */
(function (global) {
  "use strict";

  const It = global.Itinera;
  const CC = It && It.catalog;
  if (!CC) return;

  const grid = document.getElementById("catGrid");

  const ICON_RULES = [
    [/food|restaurant|cuisine|coffee|cafe|bakery|dining/i, "fa-utensils"],
    [/museum|art|gallery|culture|culture|theatre|theater/i, "fa-landmark"],
    [/nature|park|beach|garden|outdoor|wildlife|mountain|desert/i, "fa-leaf"],
    [/history|heritage|monument|ancient|ruin|temple|castle/i, "fa-arch"],
    [/adventure|sport|hiking|activity|excursion|tour/i, "fa-person-hiking"],
    [/shopping|market|mall/i, "fa-bag-shopping"],
  ];

  function iconFor(name) {
    for (let i = 0; i < ICON_RULES.length; i++) {
      if (ICON_RULES[i][0].test(name)) return ICON_RULES[i][1];
    }
    return "fa-th-large";
  }

  function tile(c) {
    const el = document.createElement("a");
    el.className = "cat-tile";
    el.href = "category.html?id=" + encodeURIComponent(c.id);
    el.innerHTML =
      '<span class="cat-tile-icon"><i class="fas ' + iconFor(c.name) + '" aria-hidden="true"></i></span>' +
      "<h3>" + CC.escapeHtml(c.name) + "</h3>";
    return el;
  }

  async function load() {
    try {
      const res = await It.apiGet(CC.ROUTES.categories);
      const list = CC.dataOf(res.body);
      grid.innerHTML = "";
      if (!list.length) {
        grid.innerHTML = '<div style="grid-column:1/-1;">' + CC.emptyState("fa-th-large", "No categories yet", "The catalog is empty right now. Please check back soon.", "index.html") + "</div>";
        return;
      }
      list.forEach(function (c) { grid.appendChild(tile(c)); });
    } catch (e) {
      grid.innerHTML = '<div style="grid-column:1/-1;">' + CC.emptyState("fa-wifi", "Could not load categories", "The catalog server is unreachable right now. Please try again shortly.", "index.html") + "</div>";
    }
  }

  load();
})(window);
