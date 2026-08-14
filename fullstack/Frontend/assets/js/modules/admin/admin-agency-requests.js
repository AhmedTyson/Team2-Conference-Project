/**
 * admin-agency-requests.js — Admin review queue for pending Agency requests.
 * List from GET /v1/admin/agency-requests; approve assigns an agency user
 * via POST /v1/admin/agency-requests/{id}/approve.
 */
(function (global) {
  "use strict";

  const It = global.Itinari;
  let agencyUsers = [];

  function el(id) { return document.getElementById(id); }

  function loadAgencyUsers() {
    return It.apiGet("/admin/users", { auth: true }).then(function (res) {
      const rows = (res && res.data) || res || [];
      agencyUsers = rows.filter(function (u) {
        return Array.isArray(u.roles) && u.roles.indexOf("agency") !== -1;
      });
    }).catch(function () {
      agencyUsers = [];
    });
  }

  function agencySelect(requestId) {
    const select = document.createElement("select");
    select.className = "input";
    select.setAttribute("aria-label", "Choose agency");

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = agencyUsers.length ? "Choose agency…" : "No agency users found";
    select.appendChild(placeholder);

    agencyUsers.forEach(function (u) {
      const opt = document.createElement("option");
      opt.value = u.id;
      opt.textContent = u.name || u.email;
      select.appendChild(opt);
    });

    return select;
  }

  function approve(requestId, select) {
    const agencyUserId = select.value;
    if (!agencyUserId) {
      It.feedback.banner("Choose an agency first.", "is-error");
      return;
    }
    It.apiPost("/admin/agency-requests/" + requestId + "/approve", { agency_user_id: Number(agencyUserId) }, { auth: true })
      .then(function () {
        It.feedback.banner("Request assigned to agency.", "is-ok");
        load();
      })
      .catch(function (err) {
        const msg = (err && err.message) || "Could not assign agency — check the user has the agency role.";
        It.feedback.banner(msg, "is-error");
      });
  }

  function renderTable(rows) {
    const host = el("agency-requests-table");
    if (!host) return;

    if (!rows || !rows.length) {
      host.innerHTML = '<div class="kit-empty">No pending agency requests.</div>';
      return;
    }

    const table = document.createElement("table");
    table.className = "kit-table";
    table.innerHTML =
      "<thead><tr><th>ID</th><th>Customer</th><th>Budget level</th><th>Requested</th><th>Assign</th></tr></thead>";

    const tbody = document.createElement("tbody");
    rows.forEach(function (r) {
      const tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + r.id + "</td>" +
        "<td>" + (r.customer ? (r.customer.name || r.customer.email) : "Customer #" + r.customer_id) + "</td>" +
        "<td>" + (r.budget_level || "\u2014") + "</td>" +
        "<td>" + (r.created_at ? new Date(r.created_at).toLocaleDateString() : "\u2014") + "</td>";

      const actionTd = document.createElement("td");
      const select = agencySelect(r.id);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-primary btn-sm";
      btn.textContent = "Approve";
      btn.style.marginInlineStart = "0.5rem";
      btn.addEventListener("click", function () { approve(r.id, select); });

      actionTd.appendChild(select);
      actionTd.appendChild(btn);
      tr.appendChild(actionTd);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    host.innerHTML = "";
    host.appendChild(table);
  }

  function load() {
    It.apiGet("/admin/agency-requests", { auth: true }).then(function (res) {
      const rows = (res && res.data) || res || [];
      renderTable(rows);
    }).catch(function () {
      It.feedback.banner("Could not load agency requests.", "is-error");
    });
  }

  function init() {
    if (!It.session.hasToken()) { It.session.redirectToLogin(); return; }
    It.session.currentUser().then(function (user) {
      if (!user || !It.session.isAdminRole(It.session.roleOf(user))) {
        It.session.redirectToLogin();
        return;
      }
      loadAgencyUsers().then(load);
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})(window);
