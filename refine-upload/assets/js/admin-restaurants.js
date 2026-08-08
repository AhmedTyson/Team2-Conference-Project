/**
 * admin-restaurants.js — Restaurants admin page (kit, Phase 11).
 * GET /api/v1/admin/restaurants ({data:[..]}) → grid (editing).
 * Toolbar New → POST, row Edit → PUT, Delete → DELETE w/ confirm.
 * Destinations + categories fetched once for selects.
 */
(function (global) {
  "use strict";

  const It = global.Itinari;
  const kit = It.kit;

  const URL = "/v1/admin/restaurants";
  let destinationOptions = [];
  let categoryOptions = [];

  function el(id) { return document.getElementById(id); }

  function loadList(path) {
    return It.apiGet(path, { auth: true }).then(function (res) {
      if (!res.ok || !res.body || !res.body.data) return [];
      let rows = res.body.data;
      if (rows.data) rows = rows.data;
      return Array.isArray(rows) ? rows : [];
    }).catch(function () { return []; });
  }

  function rowDestinationName(row) {
    return row.destination ? (typeof row.destination === "object" ? row.destination.name || row.destination.city_name || row.destination.id : row.destination) : (row.destination_name || "–");
  }

  function restaurantSchema() {
    return [
      { name: "destination_id", label: "Destination", type: "select", required: true, options: destinationOptions },
      { name: "name", label: "Name", type: "text" },
      { name: "cuisine", label: "Cuisine", type: "text" },
      { name: "category_id", label: "Category", type: "select", options: categoryOptions, required: false },
      { name: "price_range", label: "Price range", type: "select", options: [{ value: "$$", label: "$$" }, { value: "$$$", label: "$$$" }, { value: "$$$$", label: "$$$$" }] },
      { name: "rating", label: "Rating", type: "number", min: 0, max: 5, step: 0.1 },
      { name: "address", label: "Address", type: "text" },
      { name: "image", label: "Image URL", type: "url", placeholder: "https://…" },
    ];
  }

  function openForm(row) {
    const isEdit = !!row;
    const schema = restaurantSchema();
    const values = isEdit ? {
      destination_id: row.destination_id,
      name: row.name,
      cuisine: row.cuisine,
      category_id: row.category_id,
      price_range: row.price_range,
      rating: row.rating,
      address: row.address,
      image: row.image,
    } : null;

    const form = kit.renderForm({
      submitLabel: isEdit ? "Save changes" : "Create restaurant",
      values: values,
      schema: schema,
      submit: function (vals) {
        const clean = {
          destination_id: vals.destination_id,
          name: vals.name || null,
          cuisine: vals.cuisine || null,
          category_id: vals.category_id || null,
          price_range: vals.price_range || null,
          rating: vals.rating === "" || vals.rating == null ? null : Number(vals.rating),
          address: vals.address || null,
          image: vals.image || null,
        };
        if (isEdit) return It.apiPut(URL + "/" + row.id, clean, { auth: true });
        return It.apiPost(URL, clean, { auth: true });
      },
      onSaved: function (bodyMsg) {
        kit.toastOk((bodyMsg && bodyMsg.message) || (isEdit ? "Restaurant updated." : "Restaurant created."));
        grid.reload();
      },
    });

    kit.modal({ title: isEdit ? "Edit restaurant" : "New restaurant", body: form, onClose: kit.closeModal });
  }

  let grid;

  function boot(user) {
    renderProfile(user);
    Promise.all([
      loadList("/v1/admin/destinations"),
      loadList("/v1/admin/categories"),
    ]).then(function (results) {
      destinationOptions = results[0].map(function (d) { return { value: d.id, label: d.name || d.id }; });
      categoryOptions = results[1].map(function (c) { return { value: c.id, label: c.name || c.id }; });
      if (!destinationOptions.length) destinationOptions.push({ value: "", label: "No destinations yet" });
      if (!categoryOptions.length) categoryOptions.push({ value: "", label: "None" });
      initGrid();
    });
  }

  function loadList(path) {
    return load(
      path,
      function (rows) { return Array.isArray(rows) ? rows.map(function (r) { return { id: r.id, name: r.name }; }) : []; }
    );
  }

  function load(path, map) {
    return It.apiGet(path, { auth: true }).then(function (res) {
      if (!res.ok || !res.body || !res.body.data) return [];
      let rows = res.body.data;
      if (rows.data) rows = rows.data;
      const arr = Array.isArray(rows) ? rows : [];
      return map ? map(arr) : arr;
    }).catch(function () { return []; });
  }

  function initGrid() {
    grid = kit.renderGrid(el("grid"), {
      url: URL,
      label: "restaurants",
      editing: true,
      toolbar: [{ label: "New restaurant", onClick: function () { openForm(null); } }],
      columns: [
        { key: "id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "cuisine", label: "Cuisine" },
        { key: "destination_id", label: "Destination", render: function (v, row) { return rowDestinationName(row); } },
        { key: "price_range", label: "Price" },
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