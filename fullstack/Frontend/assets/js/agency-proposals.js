/**
 * agency-proposals.js — Agency Trip Proposals catalog controller.
 */
(function (global) {
  "use strict";

  const It = global.Itinari;

  function el(id) { return document.getElementById(id); }

  let rawTrips = [];

  function renderProposals(trips) {
    const host = el("proposals-host");
    if (!host) return;

    if (!trips || !trips.length) {
      host.innerHTML = '<div class="kit-empty">No trip proposals created yet. Click "Create Proposal" above to build one.</div>';
      return;
    }

    const table = document.createElement("table");
    table.className = "kit-table";
    table.innerHTML =
      "<thead><tr><th>ID</th><th>Trip Title</th><th>Client</th><th>Price</th><th>Duration</th><th>Created</th><th>Actions</th></tr></thead>";

    const tbody = document.createElement("tbody");
    trips.forEach(function (t) {
      const tr = document.createElement("tr");
      const priceVal = t.budget || t.price || 0;
      const priceStr = "$" + Number(priceVal).toLocaleString(undefined, { minimumFractionDigits: 2 });
      const clientStr = t.user ? (t.user.name || t.user.email) : "Assigned Client";
      const createdStr = t.created_at ? new Date(t.created_at).toLocaleDateString() : "Recently";
      const daysStr = (t.no_of_days || t.duration_days || 7) + " Days";

      tr.innerHTML =
        "<td>#" + t.id + "</td>" +
        "<td><strong>" + (t.title || "Untitled Proposal") + "</strong></td>" +
        "<td>" + clientStr + "</td>" +
        "<td><span class=\"badge badge-ok\">" + priceStr + "</span></td>" +
        "<td>" + daysStr + "</td>" +
        "<td>" + createdStr + "</td>" +
        "<td><a href=\"../app/trips.html?id=" + t.id + "\" class=\"btn btn-outline btn-sm\" target=\"_blank\">View Trip</a></td>";

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    host.innerHTML = "";
    host.appendChild(table);
  }

  function filterTrips() {
    const q = (el("proposal-search") ? el("proposal-search").value : "").toLowerCase().trim();
    if (!q) {
      renderProposals(rawTrips);
      return;
    }
    const filtered = rawTrips.filter(function (t) {
      return (t.title || "").toLowerCase().includes(q) || String(t.id).includes(q);
    });
    renderProposals(filtered);
  }

  function load() {
    It.apiGet("/agency/trips", { auth: true }).then(function (res) {
      rawTrips = (res && res.data) || res || [];
      renderProposals(rawTrips);
    }).catch(function () {
      It.feedback.banner("Could not load trip proposals.", "is-error");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    const searchInput = el("proposal-search");
    if (searchInput) searchInput.addEventListener("input", filterTrips);
    load();
  });
})(window);
