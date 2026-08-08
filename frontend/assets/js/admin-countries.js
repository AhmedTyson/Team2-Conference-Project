/**
 * admin-countries.js — Countries admin page (kit, Phase 11).
 * GET /api/v1/admin/countries (paginated) → grid (editing).
 * Toolbar New → POST, row Edit → PUT, Delete → DELETE w/ confirm.
 * languages sent as array (comma-separated in textarea).
 */
(function (global) {
  "use strict";

  const It = global.Itinari;
  const kit = It.kit;

  const URL = "/v1/admin/countries";

  function el(id) { return document.getElementById(id); }

  function fmtLanguages(v) {
    if (!v) return "–";
    return Array.isArray(v) ? v.join(", ") : String(v);
  }

  function countrySchema() {
    return [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "iso_code", label: "ISO code", type: "text", required: true, placeholder: "e.g. EG" },
      { name: "capital", label: "Capital", type: "text", required: true },
      { name: "currency", label: "Currency", type: "text", required: true, placeholder: "e.g. EGP" },
      { name: "languages", label: "Languages", type: "textarea", rows: 2, hint: "Comma-separated, e.g. Arabic, English" },
      { name: "flag_url", label: "Flag URL", type: "url", placeholder: "https://…" },
    ];
  }

  function openForm(row) {
    const isEdit = !!row;
    const schema = countrySchema();
    const values = isEdit ? {
      name: row.name,
      iso_code: row.iso_code,
      capital: row.capital,
      currency: row.currency,
      languages: fmtLanguages(row.languages),
      flag_url: row.flag_url,
    } : null;

    const form = kit.renderForm({
      submitLabel: isEdit ? "Save changes" : "Create country",
      values: values,
      schema: schema,
      submit: function (vals) {
        const clean = {
          name: vals.name,
          iso_code: vals.iso_code,
          capital: vals.capital,
          currency: vals.currency,
          languages: vals.languages.split(",").map(function (s) { return s.trim(); }).filter(Boolean),
          flag_url: vals.flag_url || null,
        };
        if (isEdit) return It.apiPut(URL + "/" + row.id, clean, { auth: true });
        return It.apiPost(URL, clean, { auth: true });
      },
      onSaved: function (bodyMsg) {
        kit.toastOk((bodyMsg && bodyMsg.message) || (isEdit ? "Country updated." : "Country created."));
        grid.reload();
      },
    });

    kit.modal({ title: isEdit ? "Edit country" : "New country", body: form, onClose: kit.closeModal });
  }

  let grid;

  function boot(user) {
    renderProfile(user);
    initGrid();
  }

  function initGrid() {
    grid = kit.renderGrid(el("grid"), {
      url: URL,
      label: "countries",
      editing: true,
      toolbar: [{ label: "New country", onClick: function () { openForm(null); } }],
      columns: [
        { key: "id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "iso_code", label: "ISO" },
        { key: "capital", label: "Capital" },
        { key: "currency", label: "Currency" },
        { key: "languages", label: "Languages", render: function (v) { return fmtLanguages(v); } },
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