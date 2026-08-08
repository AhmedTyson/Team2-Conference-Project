/**
 * admin-destinations.js — Destinations admin page (kit.demo, Phase 10).
 * GET /api/v1/admin/destinations (paginated {data:{data:[..]}}) → grid (editing).
 * Toolbar New → create modal (POST), row Edit → PUT, Delete → DELETE w/ confirm.
 * Countries fetched once for the country select options.
 */
(function (global) {
  "use strict";

  const It = global.Itinari;
  const kit = It.kit;

  const URL = "/v1/admin/destinations";
  let countryOptions = [];

  function el(id) { return document.getElementById(id); }

  function loadCountries() {
    return It.apiGet("/v1/admin/countries", { auth: true }).then(function (res) {
      if (!res.ok || !res.body || !res.body.data) return [];
      let rows = res.body.data;
      if (rows.data) rows = rows.data;
      return Array.isArray(rows) ? rows : [];
    }).catch(function () { return []; });
  }

  function rowCountryName(row) {
    return row.country ? (typeof row.country === "object" ? row.country.name || row.country.code : row.country) : (row.country_name || "–");
  }

  function destinationSchema() {
    const schema = [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "city_name", label: "City", type: "text", required: true },
      { name: "country_id", label: "Country", type: "select", required: true, options: countryOptions },
      { name: "description", label: "Description", type: "textarea" },
      { name: "image", label: "Image URL", type: "url", placeholder: "https://…" },
      { name: "latitude", label: "Latitude", type: "number", min: -90, max: 90, step: 0.000001 },
      { name: "longitude", label: "Longitude", type: "number", min: -180, max: 180, step: 0.000001 },
    ];
    return schema;
  }

function openForm(row) {
    const isEdit = !!row;
    const schema = destinationSchema();
    const values = isEdit ? {
      name: row.name,
      city_name: row.city_name,
      country_id: row.country_id,
      description: row.description,
      image: row.image,
      latitude: row.latitude,
      longitude: row.longitude,
    } : null;

    const form = kit.renderForm({
      submitLabel: isEdit ? "Save changes" : "Create destination",
      values: values,
      schema: schema,
      submit: function (vals) {
        const clean = {
          name: vals.name,
          city_name: vals.city_name,
          country_id: vals.country_id,
          description: vals.description || null,
          image: vals.image || null,
          latitude: vals.latitude === "" || vals.latitude == null ? null : Number(vals.latitude),
          longitude: vals.longitude === "" || vals.longitude == null ? null : Number(vals.longitude),
        };
        if (isEdit) return It.apiPut(URL + "/" + row.id, clean, { auth: true });
        return It.apiPost(URL, clean, { auth: true });
      },
      onSaved: function (bodyMsg) {
        kit.toastOk((bodyMsg && bodyMsg.message) || (isEdit ? "Destination updated." : "Destination created."));
        grid.reload();
      },
    });

    kit.modal({ title: isEdit ? "Edit destination" : "New destination", body: form, onClose: kit.closeModal });
  }

  let grid;

  function boot(user) {
    renderProfile(user);
    loadCountries().then(function (countries) {
      countryOptions = countries.map(function (c) { return { value: c.id, label: c.name || c.code || c.id }; });
      if (!countryOptions.length) {
        countryOptions.push({ value: "", label: "No countries available yet" });
      }
      initGrid();
    });
  }

  function initGrid() {
    grid = kit.renderGrid(el("grid"), {
      url: URL,
      label: "destinations",
      editing: true,
      toolbar: [{ label: "New destination", onClick: function () { openForm(null); } }],
      columns: [
        { key: "id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "city_name", label: "City" },
        { key: "country_id", label: "Country", render: function (v, row) { return rowCountryName(row); } },
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