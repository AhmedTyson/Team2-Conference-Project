/**
 * admin-hotels.js — Hotels admin page (kit, Phase 11).
 * GET /api/v1/admin/hotels (paginated) → grid (editing).
 * Toolbar New → POST, row Edit → PUT, Delete → DELETE w/ confirm.
 * Destinations fetched once for the destination select.
 */
(function (global) {
  "use strict";

  const It = global.Itinari;
  const kit = It.kit;

  const URL = "/v1/admin/hotels";
  let destinationOptions = [];

  function el(id) { return document.getElementById(id); }

  function loadDestinations() {
    return It.apiGet("/v1/admin/destinations", { auth: true }).then(function (res) {
      if (!res.ok || !res.body || !res.body.data) return [];
      let rows = res.body.data;
      if (rows.data) rows = rows.data;
      return Array.isArray(rows) ? rows : [];
    }).catch(function () { return []; });
  }

  function rowDestinationName(row) {
    return row.destination ? (typeof row.destination === "object" ? row.destination.name || row.destination.city_name || row.destination.id : row.destination) : (row.destination_name || "–");
  }

  function hotelSchema() {
    return [
      { name: "destination_id", label: "Destination", type: "select", required: true, options: destinationOptions },
      { name: "name", label: "Name", type: "text", required: true },
      { name: "address", label: "Address", type: "text" },
      { name: "price_per_night", label: "Price / night", type: "number", min: 0, step: 0.01 },
      { name: "rating", label: "Rating", type: "number", min: 0, max: 5, step: 0.1 },
      { name: "stars", label: "Stars", type: "number", min: 1, max: 5, step: 1 },
      { name: "availability", label: "Availability", type: "text", placeholder: "e.g. available" },
      { name: "image", label: "Image URL", type: "url", placeholder: "https://…" },
    ];
  }

  function openForm(row) {
    const isEdit = !!row;
    const schema = hotelSchema();
    const values = isEdit ? {
      destination_id: row.destination_id,
      name: row.name,
      address: row.address,
      price_per_night: row.price_per_night,
      rating: row.rating,
      stars: row.stars,
      availability: row.availability,
      image: row.image,
    } : null;

    const form = kit.renderForm({
      submitLabel: isEdit ? "Save changes" : "Create hotel",
      values: values,
      schema: schema,
      submit: function (vals) {
        const clean = {
          destination_id: vals.destination_id,
          name: vals.name,
          address: vals.address || null,
          price_per_night: vals.price_per_night === "" || vals.price_per_night == null ? null : Number(vals.price_per_night),
          rating: vals.rating === "" || vals.rating == null ? null : Number(vals.rating),
          stars: vals.stars === "" || vals.stars == null ? null : Number(vals.stars),
          availability: vals.availability || null,
          image: vals.image || null,
        };
        if (isEdit) return It.apiPut(URL + "/" + row.id, clean, { auth: true });
        return It.apiPost(URL, clean, { auth: true });
      },
      onSaved: function (bodyMsg) {
        kit.toastOk((bodyMsg && bodyMsg.message) || (isEdit ? "Hotel updated." : "Hotel created."));
        grid.reload();
      },
    });

    kit.modal({ title: isEdit ? "Edit hotel" : "New hotel", body: form, onClose: kit.closeModal });
  }

  let grid;

  function boot(user) {
    renderProfile(user);
    loadDestinations().then(function (dests) {
      destinationOptions = dests.map(function (d) { return { value: d.id, label: d.name || d.id }; });
      if (!destinationOptions.length) destinationOptions.push({ value: "", label: "No destinations yet" });
      initGrid();
    });
  }

  function initGrid() {
    grid = kit.renderGrid(el("grid"), {
      url: URL,
      label: "hotels",
      editing: true,
      toolbar: [{ label: "New hotel", onClick: function () { openForm(null); } }],
      columns: [
        { key: "id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "destination_id", label: "Destination", render: function (v, row) { return rowDestinationName(row); } },
        { key: "price_per_night", label: "Price/night" },
        { key: "stars", label: "Stars" },
        { key: "rating", label: "Rating" },
      ],
      onEdit: function (row) { openForm(row); },
    });
    grid.load();
  }

  function renderProfile(user) {
    const chip = el("user-chip");
    if (!chip) return;
    el("chip-name").textContent = user.name || "";
    el("chip-role").textContent = It.session.roleOf(user) || "admin";
    chip.hidden = false;
  }

  function init() {
    const logoutBtn = el("logout-btn");
    if (logoutBtn) logoutBtn.addEventListener("click", function () { It.session.logout(); });

    if (!It.session.hasToken()) { It.session.redirectToLogin(); return; }
    It.session.currentUser().then(function (user) {
      if (!user) { It.session.clearSession(); It.session.redirectToLogin(); return; }
      if (!It.session.isAdminRole(It.session.roleOf(user))) {
        It.session.clearSession();
        It.session.redirectToLogin();
        return;
      }
      boot(user);
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})(window);