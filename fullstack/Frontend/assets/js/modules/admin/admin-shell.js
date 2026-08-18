/**
 * admin-shell.js — role-gated admin shell (admin / super_admin only).
 * Boot: no token → login. Non-admin role → Access denied view (shell hidden).
 * Dashboard view loads real KPIs from /api/v1/admin/analytics (users count)
 * + /api/v1/admin/analytics/revenue (revenue/bookings/trips).
 * All module views (Phase 10–12) render a placeholder card.
 */
(function (global) {
  "use strict";

  const It = global.Itinera;
  const fb = It.feedback;

  const VIEWS = {
    dashboard:   { title: "Admin dashboard", sub: "Platform overview", built: true },
    users:       { title: "Users", sub: "Accounts, active/block", built: false },
    trips:       { title: "Trips", sub: "Update & remove trips", built: false },
    destinations:{ title: "Destinations", sub: "Full CRUD", built: false },
    hotels:      { title: "Hotels", sub: "CRUD hotels", built: false },
    restaurants: { title: "Restaurants", sub: "CRUD restaurants", built: false },
    countries:   { title: "Countries", sub: "CRUD countries", built: false },
    attractions: { title: "Attractions", sub: "CRUD attractions", built: false },
    reviews:     { title: "Reviews", sub: "Approve / reject / delete", built: false },
    analytics:   { title: "Analytics", sub: "Users & revenue charts", built: false },
    settings:    { title: "Settings", sub: "Site settings", built: false },
  };

  const MODULE_NOTE = {
    users: "Accounts list with active/block toggles — built in Phase 10.",
    trips: "Trip grid with update/remove actions — Phase 10 generic CRUD kit.",
    destinations: "Destination CRUD grid + form — Phase 10 generic CRUD kit.",
    hotels: "Hotel management grid — Phase 11 batch CRUD.",
    restaurants: "Restaurant management grid — Phase 11 batch CRUD.",
    countries: "Country management grid — Phase 11 batch CRUD.",
    attractions: "Attraction management grid — Phase 11 batch CRUD.",
    reviews: "Review moderation (approve/reject/delete) — Phase 11.",
    analytics: "Charts & tables (users, revenue, top listings) — Phase 12.",
    settings: "Read-only site settings view — Phase 12.",
  };

  function el(id) { return document.getElementById(id); }

  function setKpi(id, value) {
    const card = el(id);
    if (!card) return;
    const v = card.querySelector(".kpi-value");
    if (v) v.textContent = value;
    card.classList.remove("skeleton");
  }

  function renderProfile(user) {
    const chip = el("user-chip");
    if (!chip) return;
    el("chip-name").textContent = user.name || "";
    el("chip-role").textContent = It.session.roleOf(user) || "admin";
    chip.hidden = false;
  }

  function loadDashboard() {
    Promise.all([
      It.apiGet("/admin/analytics", { auth: true }),
      It.apiGet("/admin/analytics/revenue", { auth: true }),
      It.apiGet("/admin/users", { auth: true }),
      It.apiGet("/admin/trips", { auth: true }),
    ]).then(function (results) {
      const [analytics, revenue, users, trips] = results;

      if (analytics.ok && analytics.body && analytics.body.data) {
        const d = analytics.body.data;
        const u = d.users || {};
        setKpi("kpi-users", u.total_users != null ? u.total_users : "–");
      } else setKpi("kpi-users", "–");

      if (revenue.ok && revenue.body && revenue.body.data) {
        const d = revenue.body.data;
        setKpi("kpi-revenue", d.total_revenue != null ? "$" + d.total_revenue : "–");
        setKpi("kpi-bookings", d.total_bookings != null ? d.total_bookings : "–");
      } else { setKpi("kpi-revenue", "–"); setKpi("kpi-bookings", "–"); }

      if (users.ok && users.body && users.body.data) {
        const d = users.body.data;
        const count = Array.isArray(d) ? d.length : d.total;
        if (count != null) setKpi("kpi-users", count);
      }
      if (trips.ok && trips.body && trips.body.data) {
        const d = trips.body.data;
        const count = Array.isArray(d) ? d.length : d.total;
        if (count != null) setKpi("kpi-trips", count);
        else setKpi("kpi-trips", "–");
      } else setKpi("kpi-trips", "–");
    }).catch(function (err) {
      fb.banner("Could not load admin overview: " + err.message, "is-error");
      ["kpi-users","kpi-revenue","kpi-bookings","kpi-trips"].forEach(function (id) { setKpi(id, "–"); });
    });
  }

  function switchView(name) {
    const meta = VIEWS[name] || VIEWS.dashboard;
    el("view-title").textContent = meta.title;
    el("view-sub").textContent = meta.sub;

    document.querySelectorAll(".view").forEach(function (v) { v.classList.remove("is-active"); v.hidden = true; });
    document.querySelectorAll(".nav-item").forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("data-view") === name); });

    if (meta.built) {
      const dash = el("view-dashboard");
      dash.hidden = false;
      dash.classList.add("is-active");
    } else {
      el("placeholder-title").textContent = meta.title;
      el("placeholder-note").textContent = MODULE_NOTE[name] || "Module planned for a later phase.";
      const ph = el("view-placeholder");
      ph.hidden = false;
      ph.classList.add("is-active");
    }
  }

  function boot() {
    if (!It.session.hasToken()) {
      It.session.redirectToLogin();
      return;
    }
    It.session.currentUser().then(function (user) {
      if (!user) {
        It.session.clearSession();
        It.session.redirectToLogin();
        return;
      }
      const role = It.session.roleOf(user);
      if (!It.session.isAdminRole(role)) {
        // 403 state: hide loading + shell, show access denied only
        el("shell-loading").hidden = true;
        el("access-denied").hidden = false;
        return;
      }
      render(user);
    });
  }

  function render(user) {
    renderProfile(user);
    el("shell-loading").hidden = true;
    el("shell").hidden = false;
    switchView("dashboard");
    loadDashboard();
  }

  document.addEventListener("DOMContentLoaded", function () {
    const denied = el("access-denied");
    const deniedLogout = el("denied-logout");
    if (deniedLogout) deniedLogout.addEventListener("click", function () { It.session.logout(); });

    const logoutBtn = el("logout-btn");
    if (logoutBtn) logoutBtn.addEventListener("click", function () { It.session.logout(); });

    document.querySelectorAll(".nav-item").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        switchView(a.getAttribute("data-view"));
      });
    });
    document.querySelectorAll(".module").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        switchView(a.getAttribute("data-view"));
      });
    });

    boot();
  });
})(window);