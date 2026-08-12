/**
 * admin-entity-details.js — read-only detail pages for destinations /
 * restaurants / attractions (driven by <body data-entity="...">).
 * Loads via the public show routes (the admin API has no show endpoint)
 * and deletes via the admin DELETE routes. Editing stays in the list
 * pages (admin-crud.js modals).
 */
(function (global) {
  "use strict";

  const It = global.Itinari;

  function $ (id) { return document.getElementById(id); }

  const ENTITIES = {
    destinations: {
      label: "Destination",
      listLabel: "Destinations",
      publicUrl: "/v1/destinations/",
      deleteUrl: "/v1/admin/destinations/",
      back: "destinations.html",
    },
    restaurants: {
      label: "Restaurant",
      listLabel: "Restaurants",
      publicUrl: "/v1/restaurants/",
      deleteUrl: "/v1/admin/restaurants/",
      back: "restaurants.html",
    },
    attractions: {
      label: "Attraction",
      listLabel: "Attractions",
      publicUrl: "/v1/attractions/",
      deleteUrl: "/v1/admin/attractions/",
      back: "attractions.html",
    },
  };

  let entity = null;
  let record = null;
  let id = null;

  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function imgUrl(src) {
    if (!src) return null;
    if (/^https?:\/\//i.test(src)) return src;
    return It.CONFIG.apiBase.replace(/\/api$/, "") + (src.charAt(0) === "/" ? src : "/" + src);
  }

  function fmtDate(v) {
    if (!v) return "–";
    const d = new Date(v);
    return isNaN(d) ? "–" : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function fact(label, value) {
    if (value == null || value === "" || value === "–") return "";
    return '<div class="fact"><dt>' + esc(label) + "</dt><dd>" + esc(value) + "</dd></div>";
  }

  function render() {
    const host = $("entity-content");
    const r = record || {};
    const name = r.name || r.title || entity.label + " #" + id;
    $("entity-title").textContent = name;
    $("entity-subtitle").textContent = entity.label + " · ID " + id;
    document.title = name + " · Itinari Admin";

    const img = imgUrl(r.image);
    let html = '<div class="entity-hero">';
    html += img
      ? '<img src="' + esc(img) + '" alt="' + esc(name) + '" class="entity-img" onerror="this.remove()" />'
      : '<div class="entity-placeholder" aria-hidden="true">' + esc((name || "?").charAt(0).toUpperCase()) + "</div>";
    html += '<div class="entity-title-wrap"><h2>' + esc(name) + "</h2>";
    html += '<span class="badge">' + esc(entity.label) + " #" + esc(id) + "</span></div></div>";

    const facts = [];

    if (entity.entity === "destinations") {
      facts.push(fact("City", r.city_name));
      facts.push(fact("Country", r.country && r.country.name));
      facts.push(fact("Latitude", r.latitude));
      facts.push(fact("Longitude", r.longitude));
    }
    if (entity.entity === "restaurants") {
      facts.push(fact("Cuisine", r.cuisine));
      facts.push(fact("Price range", r.price_range));
      facts.push(fact("Rating", r.rating == null ? null : Number(r.rating).toFixed(1) + " / 5"));
      facts.push(fact("Address", r.address));
      facts.push(fact("Destination", r.destination && r.destination.name));
      facts.push(fact("Category", r.category && (r.category.name || r.category.id)));
    }
    if (entity.entity === "attractions") {
      facts.push(fact("Destination", r.destination && r.destination.name));
      facts.push(fact("Category", r.category && (r.category.name || r.category.id)));
      facts.push(fact("Latitude", r.latitude));
      facts.push(fact("Longitude", r.longitude));
    }
    facts.push(fact("Created", fmtDate(r.created_at)));
    facts.push(fact("Updated", fmtDate(r.updated_at)));

    html += '<div class="entity-facts"><dl>' + facts.join("") + "</dl></div>";

    if (r.description) {
      html += '<div class="entity-section"><h3>Description</h3><p>' + esc(r.description) + "</p></div>";
    }

    if (r.latitude && r.longitude) {
      html += '<div class="entity-section"><h3>Location</h3><p><a class="entity-map" href="https://www.openstreetmap.org/?mlat=' +
        r.latitude + "&mlon=" + r.longitude + "#map=14/" + r.latitude + "/" + r.longitude +
        '" target="_blank" rel="noopener">Open in OpenStreetMap ↗</a></p></div>';
    }

    if (!facts.length && !r.description) {
      html = '<div class="kit-empty">No details available for this record.</div>';
    }

    host.innerHTML = html;
    $("entity-actions").hidden = false;
  }

  function load() {
    It.apiGet(entity.publicUrl + id, { auth: true }).then(function (res) {
      if (!res.ok || !res.body) {
        $("entity-content").innerHTML = '<div class="kit-error">Could not load this ' + entity.label.toLowerCase() + ".</div>";
        It.feedback.banner("Failed to load record.", "is-error");
        return;
      }
      record = res.body.data || res.body;
      render();
    }).catch(function () {
      $("entity-content").innerHTML = '<div class="kit-error">Could not reach the server.</div>';
      It.feedback.banner("Could not reach the server.", "is-error");
    });
  }

  function remove() {
    const name = (record && record.name) || entity.label + " #" + id;
    if (!global.confirm("Delete " + name + " permanently?")) return;
    const btn = $("entity-delete");
    It.feedback.loading(btn, true);
    It.apiDelete(entity.deleteUrl + id, { auth: true }).then(function (res) {
      It.feedback.loading(btn, false);
      if (res.ok) {
        global.location.href = entity.back;
      } else {
        It.feedback.banner((res.body && (res.body.message || res.body.error)) || "Delete failed.", "is-error");
      }
    }).catch(function () {
      It.feedback.loading(btn, false);
      It.feedback.banner("Could not reach the server.", "is-error");
    });
  }

  function init() {
    entity = ENTITIES[document.body.getAttribute("data-entity")];
    if (!entity) {
      document.body.textContent = "Unknown entity page.";
      return;
    }
    entity.entity = document.body.getAttribute("data-entity");
    $("entity-delete").addEventListener("click", remove);

    if (!It.session.hasToken()) { It.session.redirectToLogin(); return; }
    It.session.currentUser().then(function (user) {
      if (!user) { It.session.clearSession(); It.session.redirectToLogin(); return; }
      if (!It.session.isAdminRole(It.session.roleOf(user))) {
        It.session.clearSession();
        It.session.redirectToLogin();
        return;
      }
      const params = new URLSearchParams(global.location.search);
      id = params.get("id");
      if (!id || !/^\d+$/.test(id)) {
        $("entity-content").innerHTML = '<div class="kit-error">No valid record ID provided.</div>';
        It.feedback.banner("No record ID provided.", "is-error");
        return;
      }
      load();
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})(window);
