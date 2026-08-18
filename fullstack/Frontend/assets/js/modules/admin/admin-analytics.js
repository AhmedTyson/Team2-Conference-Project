/**
 * admin-analytics.js — Flight recorder (Phase 16, from scratch, no kit).
 * GET /v1/admin/analytics -> { users:{total_users,new_users_last_30_days,chart[]},
 *                              revenue:{total_revenue,revenue_last_30_days,chart[]} }
 * GET /v1/admin/analytics/revenue -> { total_revenue, total_bookings,
 *   average_booking_value, revenue_by_month, revenue_by_travel_style, recent_bookings }
 */
(function (global) {
  "use strict";

  const It = global.Itinera;

  function el(id) { return document.getElementById(id); }

  function renderProfile(user) {
    const chip = el("user-chip");
    if (!chip) return;
    el("chip-name").textContent = user.name || "";
    el("chip-role").textContent = It.session.roleOf(user) || "admin";
    chip.hidden = false;
  }

  function money(v) {
    if (v === null || v === undefined) return "–";
    return Number(v).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  }

  function kpi(id, value) {
    const node = el(id);
    if (node) node.querySelector(".kpi-value").textContent = value;
  }

  function reducedMotion() {
    return global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function renderChartSkeleton(host) {
    host.textContent = "";
    host.classList.add("chart");
    host.setAttribute("aria-label", "Chart loading");
    for (let i = 0; i < 7; i++) {
      const box = document.createElement("div");
      box.className = "bar-skeleton";
      host.appendChild(box);
    }
  }

  function renderChart(hostId, series) {
    const host = el(hostId);
    host.textContent = "";
    host.classList.remove("bar-grid");
    host.setAttribute("aria-live", "polite");
    if (!Array.isArray(series) || !series.length) {
      host.innerHTML = '<div class="chart-empty">No data yet.</div>';
      return;
    }
    let max = 0;
    series.forEach(function (p) { if (Number(p.value) > max) max = Number(p.value); });
    if (!max) max = 1;

    const grid = document.createElement("div");
    grid.className = "chart-grid";
    const gridLabels = document.createElement("div");
    gridLabels.className = "chart-ticks";
    [max, max / 2, 0].forEach(function (tick) {
      const t = document.createElement("span");
      t.className = "chart-tick";
      t.textContent = Math.round(tick).toLocaleString();
      gridLabels.appendChild(t);
    });
    grid.appendChild(gridLabels);

    const bars = document.createElement("div");
    bars.className = "chart-bars";

    series.forEach(function (p) {
      const h = Math.max(4, Math.round((Number(p.value) / max) * 100));
      const bar = document.createElement("div");
      bar.className = "bar" + (Number(p.value) === 0 ? " bar-empty" : "");
      bar.setAttribute("role", "img");
      bar.setAttribute("aria-label", String(p.month || "") + ": " + Number(p.value).toLocaleString());
      bar.title = String(p.month || "") + " — " + Number(p.value).toLocaleString();
      const grow = document.createElement("div");
      grow.className = "bar-grow";
      grow.innerHTML = '<div class="bar-fill" style="height:' + h + '%"></div>' +
        '<span class="bar-value">' + (p.value === 0 ? "0" : Number(p.value).toLocaleString()) + "</span>";
      const label = document.createElement("span");
      label.className = "bar-label";
      label.textContent = String(p.month || "");
      bar.appendChild(grow);
      bar.appendChild(label);
      bars.appendChild(bar);
    });

    grid.appendChild(bars);
    host.appendChild(grid);

    const g = global.gsap;
    const fills = host.querySelectorAll(".bar-fill");
    if (g && !reducedMotion()) {
      g.fromTo(fills,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", stagger: 0.06 });
    } else if (g) {
      g.fromTo(fills,
        { transform: "translateY(14px)" },
        { transform: "translateY(0)", duration: 0.45, ease: "power2.out", stagger: 0.06 });
    }
  }

  function renderStyleSplit(styles) {
    const host = el("style-split");
    host.textContent = "";
    const pairs = Object.keys(styles || {}).map(function (k) {
      return [k, Number(styles[k])];
    });
    if (!pairs.length) {
      host.innerHTML = '<div class="kit-empty">No travel style data yet.</div>';
      return;
    }
    let max = 0;
    pairs.forEach(function (p) { if (p[1] > max) max = p[1]; });
    if (!max) max = 1;
    pairs.forEach(function (p) {
      const row = document.createElement("div");
      const w = Math.max(4, Math.round((p[1] / max) * 100));
      row.className = "kit-field";
      const width = String(w);
      row.innerHTML =
        '<label style="justify-content:space-between;display:flex;"><span>' + String(p[0]) +
        '</span><span class="muted">' + money(p[1]) + "</span></label>" +
        '<div class="dash" style="background:repeating-linear-gradient(90deg,hsl(var(--primary) / 0.4) 0 6px,transparent 6px 10px);height:6px;margin-top:var(--space-1);width:' + width + '%;"></div>';
      host.appendChild(row);
    });
  }

  function load() {
    renderChartSkeleton(el("chart-users"));
    renderChartSkeleton(el("chart-revenue"));
    It.apiGet("/admin/analytics", { auth: true }).then(function (res) {
      if (!res.ok) return;
      const d = res.body.data || {};
      const users = d.users || {};
      const revenue = d.revenue || {};
      if (users.total_users !== undefined) kpi("kpi-users", Number(users.total_users).toLocaleString());
      if (users.new_users_last_30_days !== undefined) kpi("kpi-new", Number(users.new_users_last_30_days).toLocaleString());
      if (revenue.total_revenue !== undefined) kpi("kpi-rev", money(revenue.total_revenue));
      renderChart("chart-users", users.chart || []);
      renderChart("chart-revenue", revenue.chart || []);
    });

    It.apiGet("/admin/analytics/revenue", { auth: true }).then(function (res) {
      if (!res.ok) return;
      const d = res.body.data || {};
      if (d.total_revenue !== undefined) kpi("kpi-rev", money(d.total_revenue));
      if (d.average_booking_value !== undefined) kpi("kpi-avg", money(d.average_booking_value));
      renderStyleSplit(d.revenue_by_travel_style || {});
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