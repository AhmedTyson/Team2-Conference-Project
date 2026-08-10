/**
 * agency.js — Agency Concierge Desk (Phase 8).
 * Assignments from GET /v1/agency/assignments; approve/decline via POST.
 * Gate: requires role agency.
 */
(function (global) {
  "use strict";

  const It = global.Itinari;

  function el(id) { return document.getElementById(id); }

  function reducedMotion() {
    return global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function entrance() {
    const g = global.gsap;
    const tickets = document.querySelectorAll(".kpi-grid .ticket, .ticket-panel");
    if (!g || reducedMotion()) return;
    g.fromTo(
      tickets,
      { autoAlpha: 0, y: 14 },
      { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.08, ease: "power2.out" }
    );
  }

  function renderProfile(user) {
    const chip = el("user-chip");
    if (!chip) return;
    el("chip-name").textContent = user.name || "";
    el("chip-role").textContent = It.session.roleOf(user) || "agency";
    chip.hidden = false;
  }

  function setKpi(id, value) {
    const card = el(id);
    if (!card) return;
    const v = card.querySelector(".kpi-value");
    if (v) v.textContent = value;
    card.classList.remove("skeleton");
  }

  function statusBadge(status) {
    const b = document.createElement("span");
    b.className = "chip chip-role";
    b.textContent = String(status || "").replace(/_/g, " ");
    return b;
  }

  function actionButton(label, tone, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = tone;
    btn.textContent = label;
    btn.addEventListener("click", onClick);
    return btn;
  }

  function renderTable(rows) {
    const host = el("assignment-host");
    if (!host) return;
    if (!rows || !rows.length) {
      host.innerHTML = '<div class="kit-empty">No assignments yet. Awaiting admin allocation.</div>';
      return;
    }
    const table = document.createElement("table");
    table.className = "kit-table";
    table.innerHTML =
      "<thead><tr>" +
      "<th>ID</th><th>Customer</th><th>Budget</th><th>Status</th><th>Assigned</th><th>Actions</th>" +
      "</tr></thead>";
    const tbody = document.createElement("tbody");
    rows.forEach(function (a) {
      const tr = document.createElement("tr");
      const actions = document.createElement("td");
      if (a.status === "admin_approved") {
        actions.appendChild(actionButton("Approve", "btn btn-primary btn-sm", function () { respond(a.id, "approve"); }));
        actions.appendChild(actionButton("Decline", "btn btn-ghost btn-sm", function () { respond(a.id, "decline"); }));
      } else {
        actions.textContent = "\u2014";
      }
      tr.innerHTML =
        "<td>" + (a.id || "") + "</td>" +
        "<td>" + (a.customer ? (a.customer.name || a.customer.email || "Customer #" + a.customer_id) : "Customer #" + a.customer_id) + "</td>" +
        "<td>" + (a.budget_level || "\u2014") + "</td>";
      const statusTd = document.createElement("td");
      statusTd.appendChild(statusBadge(a.status));
      tr.appendChild(statusTd);
      tr.innerHTML += "<td>" + (a.admin_approved_at ? new Date(a.admin_approved_at).toLocaleDateString() : "\u2014") + "</td>";
      tr.appendChild(actions);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    host.innerHTML = "";
    host.appendChild(table);
  }

  function respond(id, verb) {
    It.apiPost("/v1/agency/assignments/" + id + "/" + verb, {}, { auth: true }).then(function () {
      It.feedback.banner(verb === "approve" ? "Assignment accepted." : "Assignment declined.", "is-ok");
      load();
    }).catch(function () {
      It.feedback.banner("Action failed. Check permissions.", "is-error");
    });
  }

  function load() {
    It.apiGet("/v1/agency/assignments", { auth: true }).then(function (res) {
      const rows = (res && res.data) || [];
      setKpi("kpi-total", rows.length);
      setKpi("kpi-awaiting", rows.filter(function (a) { return a.status === "admin_approved"; }).length);
      setKpi("kpi-active", rows.filter(function (a) { return a.status === "agency_approved"; }).length);
      setKpi("kpi-completed", rows.filter(function (a) { return a.status === "completed"; }).length);
      renderTable(rows);
      entrance();
    }).catch(function () {
      It.feedback.banner("Could not load assignments.", "is-error");
      entrance();
    });
  }

  function boot(user) {
    renderProfile(user);
    load();
  }

  function init() {
    const logoutBtn = el("logout-btn");
    if (logoutBtn) logoutBtn.addEventListener("click", function () { It.session.logout(); });

    if (!It.session.hasToken()) { It.session.redirectToLogin(); return; }
    It.session.currentUser().then(function (user) {
      if (!user) { It.session.clearSession(); It.session.redirectToLogin(); return; }
      if (It.session.roleOf(user) !== "agency") {
        It.session.clearSession();
        It.session.redirectToLogin();
        return;
      }
      boot(user);
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})(window);
