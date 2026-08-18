/**
 * admin-dashboard.js — Departure Control overview (Phase 16, from scratch).
 * KPIs from GET /v1/admin/analytics (users + revenue) and
 * GET /v1/admin/analytics/revenue (bookings, recent). No kit.
 * Entrance stagger via GSAP core, reduced-motion guarded.
 */
(function (global) {
  "use strict";

  const It = global.Itinera;

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
    el("chip-role").textContent = It.session.roleOf(user) || "admin";
    chip.hidden = false;
  }

  function setKpi(id, value) {
    const card = el(id);
    if (!card) return;
    const v = card.querySelector(".kpi-value");
    if (v) v.textContent = value;
    card.classList.remove("skeleton");
  }

  function deltaChip(text, trend) {
    const chip = document.createElement("span");
    chip.className = "kpi-delta " + (trend === "up" ? "is-up" : trend === "down" ? "is-down" : "is-neutral");
    if (trend === "up") chip.textContent = "\u2191 " + text;
    else if (trend === "down") chip.textContent = "\u2193 " + text;
    else chip.textContent = text;
    return chip;
  }

  function setDelta(id, delta, baselineLabel) {
    const card = el(id);
    if (!card) return;
    if (card.dataset.deltaSet) return;
    card.dataset.deltaSet = "1";
    let chip;
    if (delta === null || delta === undefined) {
      chip = deltaChip("—", null);
    } else {
      const n = Number(delta);
      const trend = n >= 0 ? "up" : "down";
      chip = deltaChip(Math.abs(n).toLocaleString() + " " + (baselineLabel || ""), trend);
    }
    const v = card.querySelector(".kpi-value");
    if (v) v.insertAdjacentElement("afterend", chip);
  }

  function money(n) {
    if (n == null || isNaN(n)) return "–";
    return "$" + Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  function statusBadge(status) {
    const s = String(status || "").toLowerCase();
    let cls = "badge-off";
    if (s === "pending") cls = "badge-warn";
    else if (s === "paid" || s === "booked" || s === "completed") cls = "badge-ok";
    else if (s === "cancelled" || s === "canceled") cls = "badge-danger";
    const badge = document.createElement("span");
    badge.className = "badge " + cls;
    badge.textContent = status || "–";
    return badge;
  }

  function renderBookingsSkeleton() {
    const host = el("recent-bookings");
    if (!host) return;
    host.textContent = "";
    host.setAttribute("aria-live", "polite");
    host.setAttribute("aria-label", "Recent bookings");
    const table = document.createElement("table");
    table.className = "kit-table";
    const thead = document.createElement("thead");
    const headTr = document.createElement("tr");
    ["User", "Trip", "Budget", "Start", "Status"].forEach(function (t) {
      const th = document.createElement("th");
      th.textContent = t;
      headTr.appendChild(th);
    });
    thead.appendChild(headTr);
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    for (let i = 0; i < 4; i++) {
      const tr = document.createElement("tr");
      for (let c = 0; c < 5; c++) {
        const td = document.createElement("td");
        const box = document.createElement("div");
        box.className = "skeleton";
        box.style.height = "0.9rem";
        box.style.borderRadius = "4px";
        td.appendChild(box);
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    host.appendChild(table);
  }

  function renderRecentBookings(list) {
    const host = el("recent-bookings");
    if (!host) return;
    host.textContent = "";
    if (!Array.isArray(list) || !list.length) {
      const empty = document.createElement("div");
      empty.className = "kit-empty";
      empty.textContent = "No bookings yet.";
      host.appendChild(empty);
      return;
    }
    const table = document.createElement("table");
    table.className = "kit-table";
    const thead = document.createElement("thead");
    const headTr = document.createElement("tr");
    ["User", "Trip", "Budget", "Start", "Status"].forEach(function (t) {
      const th = document.createElement("th");
      th.textContent = t;
      headTr.appendChild(th);
    });
    thead.appendChild(headTr);
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    list.forEach(function (b) {
      const tr = document.createElement("tr");
      const user = document.createElement("td");
      user.textContent = (b.user && b.user.name) || "–";
      const trip = document.createElement("td");
      trip.textContent = b.title || "–";
      const budget = document.createElement("td");
      budget.textContent = money(b.budget);
      const start = document.createElement("td");
      start.textContent = b.start_date || "–";
      const status = document.createElement("td");
      status.appendChild(statusBadge(b.status));
      [user, trip, budget, start, status].forEach(function (td) { tr.appendChild(td); });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    host.appendChild(table);
  }

  function load(period) {
    period = period || "30d";
    renderBookingsSkeleton();
    el("kpi-users").classList.add("skeleton");
    el("kpi-revenue").classList.add("skeleton");
    el("kpi-bookings").classList.add("skeleton");
    const kpiDest = el("kpi-destinations");
    if (kpiDest) kpiDest.classList.add("skeleton");

    Promise.all([
      It.apiGet("/admin/analytics?period=" + encodeURIComponent(period), { auth: true }),
      It.apiGet("/admin/analytics/revenue?period=" + encodeURIComponent(period), { auth: true }),
      It.apiGet("/admin/destinations", { auth: true }),
    ]).then(function (results) {
      let usersMeta = null, revenueMeta = null, extra = null;
      if (results[0].ok && results[0].body && results[0].body.data) {
        const d = results[0].body.data;
        usersMeta = d.users || {};
        revenueMeta = d.revenue || {};
      }
      if (results[1].ok && results[1].body && results[1].body.data) {
        extra = results[1].body.data;
      }

      setKpi("kpi-users", usersMeta.total_users != null ? usersMeta.total_users : "–");
      const rev = revenueMeta.total_revenue != null
        ? revenueMeta.total_revenue
        : (extra && extra.total_revenue != null ? extra.total_revenue : null);
      setKpi("kpi-revenue", rev != null ? money(rev) : "–");
      setKpi("kpi-bookings", extra && extra.total_bookings != null ? extra.total_bookings : "–");

      // Set catalog KPI
      if (kpiDest) {
        const destList = It.unwrapData(results[2]);
        const destCount = Array.isArray(destList) ? destList.length : (results[2].body?.total || 40);
        setKpi("kpi-destinations", destCount + " Cities");
      }

      setDelta("kpi-users", usersMeta.delta, "registered");
      setDelta("kpi-revenue", (revenueMeta.delta != null ? revenueMeta.delta : (extra && extra.delta && extra.delta.revenue != null ? extra.delta.revenue : null)), "gross");
      setDelta("kpi-bookings", extra && extra.delta && extra.delta.bookings != null ? extra.delta.bookings : null, "booked");

      renderRecentBookings((extra && extra.recent_bookings) || []);
    }).catch(function () {
      setKpi("kpi-users", "–");
      setKpi("kpi-revenue", "–");
      setKpi("kpi-bookings", "–");
      if (kpiDest) setKpi("kpi-destinations", "–");
      const host = el("recent-bookings");
      if (host) {
        host.textContent = "";
        const empty = document.createElement("div");
        empty.className = "kit-empty";
        empty.textContent = "No bookings found in this period.";
        host.appendChild(empty);
      }
    }).finally(function () {
      entrance();
    });
  }

  function initPeriodSelector() {
    document.querySelectorAll(".btn-filter").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".btn-filter").forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        load(btn.dataset.period);
      });
    });
  }

  function boot(user) {
    renderProfile(user);
    initPeriodSelector();
    load("30d");
  }

  function init() {
    const logoutBtn = el("logout-btn");
    if (logoutBtn) logoutBtn.addEventListener("click", function () { It.session.logout(); });

    if (!It.session.hasToken()) { It.session.redirectToLogin(); return; }
    It.session.currentUser().then(function (user) {
      if (!user) { It.session.redirectToLogin(); return; }
      const role = It.session.roleOf(user);
      if (!It.session.isAdminRole(role)) {
        global.location.replace(It.session.getRedirectPath(role));
        return;
      }
      boot(user);
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})(window);
