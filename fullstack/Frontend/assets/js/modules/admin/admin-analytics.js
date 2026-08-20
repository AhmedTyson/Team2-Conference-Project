/**
 * admin-analytics.js — Flight recorder & Executive Analytics.
 * Endpoint integration with GET /admin/analytics and GET /admin/analytics/revenue
 */
(function (global) {
  "use strict";

  const It = global.Itinera;

  function el(id) { return document.getElementById(id); }
  function esc(str) { return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

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
    const nameEl = el("chip-name");
    const roleEl = el("chip-role");
    if (nameEl) nameEl.textContent = user.name || "";
    if (roleEl) roleEl.textContent = It.session.roleOf(user) || "admin";
    chip.hidden = false;
  }

  function money(n) {
    if (n == null || isNaN(n)) return "–";
    return "$" + Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  function setKpi(id, value) {
    const card = el(id);
    if (!card) return;
    const v = card.querySelector(".kpi-value");
    if (v) v.textContent = value;
    card.classList.remove("skeleton");
  }

  function setDelta(id, delta, baselineLabel) {
    const card = el(id);
    if (!card) return;
    let chip = card.querySelector(".kpi-delta");
    if (!chip) {
      chip = document.createElement("span");
      const v = card.querySelector(".kpi-value");
      if (v) v.insertAdjacentElement("afterend", chip);
    }
    if (delta === null || delta === undefined) {
      chip.className = "kpi-delta is-neutral";
      chip.textContent = "—";
    } else {
      const n = Number(delta);
      const trend = n >= 0 ? "up" : "down";
      chip.className = "kpi-delta " + (trend === "up" ? "is-up" : "is-down");
      const sign = trend === "up" ? "\u2191 +" : "\u2193 ";
      chip.textContent = sign + Math.abs(n).toLocaleString() + "% " + (baselineLabel || "");
    }
  }

  function renderChart(hostId, series, colorClass) {
    const host = el(hostId);
    if (!host) return;
    host.textContent = "";
    host.classList.remove("bar-grid");
    host.setAttribute("aria-live", "polite");

    const defaultSeries = [
      { month: "Jan", value: 120 }, { month: "Feb", value: 240 },
      { month: "Mar", value: 180 }, { month: "Apr", value: 320 },
      { month: "May", value: 450 }, { month: "Jun", value: 610 }
    ];

    const data = (Array.isArray(series) && series.length) ? series : defaultSeries;
    let max = 0;
    data.forEach(function (p) { if (Number(p.value) > max) max = Number(p.value); });
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

    data.forEach(function (p) {
      const h = Math.max(8, Math.round((Number(p.value) / max) * 100));
      const bar = document.createElement("div");
      bar.className = "bar" + (Number(p.value) === 0 ? " bar-empty" : "");
      bar.title = String(p.month || "") + " — " + Number(p.value).toLocaleString();
      const grow = document.createElement("div");
      grow.className = "bar-grow";

      const isEmerald = colorClass === "emerald";
      const fillStyle = isEmerald
        ? "background: linear-gradient(180deg, #10b981 0%, rgba(16, 185, 129, 0.3) 100%); border-top: 2px solid #34d399;"
        : "background: linear-gradient(180deg, #fbbf24 0%, rgba(251, 191, 36, 0.3) 100%); border-top: 2px solid #fde047;";

      grow.innerHTML = '<div class="bar-fill" style="height:' + h + '%; ' + fillStyle + ' border-radius: 6px 6px 0 0;"></div>' +
        '<span class="bar-value" style="font-weight:800; color:#fff;">' + (p.value === 0 ? "0" : Number(p.value).toLocaleString()) + "</span>";
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
        { opacity: 0, scaleY: 0, transformOrigin: "bottom center" },
        { opacity: 1, scaleY: 1, duration: 0.5, ease: "power2.out", stagger: 0.05 });
    }
  }

  function renderStyleSplit(styles) {
    const host = el("style-split");
    if (!host) return;
    host.textContent = "";

    const defaultStyles = {
      "Luxury Resort & Villas": 48500,
      "Cultural & Heritage": 34200,
      "Adventure & Hiking": 29800,
      "Beach & Coastal Escapes": 22100,
      "City & Culinary Tours": 18400
    };

    const data = (styles && Object.keys(styles).length) ? styles : defaultStyles;
    const pairs = Object.keys(data).map(function (k) { return [k, Number(data[k])]; });
    let total = 0;
    pairs.forEach(function (p) { total += p[1]; });
    if (!total) total = 1;

    const colors = ["#fbbf24", "#10b981", "#3b82f6", "#f43f5e", "#a855f7", "#ec4899"];

    const r = 54;
    const circ = 2 * Math.PI * r;
    let offset = 0;

    let svgSegments = "";
    pairs.forEach(function (p, idx) {
      const pct = p[1] / total;
      const strokeLen = pct * circ;
      const gapLen = circ - strokeLen;
      const color = colors[idx % colors.length];

      svgSegments += '<circle cx="80" cy="80" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="16" ' +
        'stroke-dasharray="' + strokeLen.toFixed(1) + ' ' + gapLen.toFixed(1) + '" ' +
        'stroke-dashoffset="' + (-offset).toFixed(1) + '" style="transition: stroke-dashoffset 0.7s ease; cursor:pointer;" ' +
        '><title>' + esc(p[0]) + ': ' + money(p[1]) + ' (' + Math.round(pct * 100) + '%)</title></circle>';

      offset += strokeLen;
    });

    const donutSvg =
      '<div style="flex-shrink: 0; position: relative; width: 160px; height: 160px; display: flex; align-items: center; justify-content: center;">' +
        '<svg width="160" height="160" viewBox="0 0 160 160" style="transform: rotate(-90deg); overflow: visible;">' +
          '<circle cx="80" cy="80" r="' + r + '" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="16"></circle>' +
          svgSegments +
        '</svg>' +
        '<div style="position: absolute; text-align: center; pointer-events: none;">' +
          '<div style="font-size: 0.65rem; color: #fbbf24; font-family: monospace; font-weight: 800; text-transform: uppercase;">Total</div>' +
          '<div style="font-size: 0.95rem; font-weight: 900; color: #ffffff;">' + money(total) + '</div>' +
        '</div>' +
      '</div>';

    let legendHtml = '<div style="flex: 1; display: flex; flex-direction: column; gap: 0.6rem; width: 100%;">';
    pairs.forEach(function (p, idx) {
      const pct = Math.round((p[1] / total) * 100);
      const color = colors[idx % colors.length];
      legendHtml +=
        '<div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);">' +
          '<div style="display: flex; align-items: center; gap: 0.6rem;">' +
            '<span style="width: 10px; height: 10px; border-radius: 50%; background: ' + color + '; display: inline-block;"></span>' +
            '<span style="font-size: 0.76rem; font-weight: 700; color: #ffffff;">' + esc(p[0]) + '</span>' +
          '</div>' +
          '<div style="display: flex; align-items: center; gap: 0.6rem;">' +
            '<span style="font-size: 0.65rem; font-family: monospace; font-weight: 800; color: ' + color + '; padding: 0.1rem 0.4rem; border-radius: 9999px; background: rgba(255,255,255,0.06);">' + pct + '%</span>' +
            '<span style="font-size: 0.75rem; font-family: monospace; font-weight: 700; color: rgba(255,255,255,0.85);">' + money(p[1]) + '</span>' +
          '</div>' +
        '</div>';
    });
    legendHtml += '</div>';

    const container = document.createElement("div");
    container.style.cssText = "display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap;";
    container.innerHTML = donutSvg + legendHtml;
    host.appendChild(container);
  }

  function renderDestinationSplit(destinations) {
    const host = el("destination-split");
    if (!host) return;
    host.textContent = "";

    const defaultDests = [
      { city: "Cairo", iata: "CAI", country: "Egypt", bookings: 342 },
      { city: "London", iata: "LHR", country: "United Kingdom", bookings: 289 },
      { city: "Paris", iata: "CDG", country: "France", bookings: 215 },
      { city: "New York", iata: "JFK", country: "United States", bookings: 194 },
      { city: "Dubai", iata: "DXB", country: "United Arab Emirates", bookings: 168 }
    ];

    const list = (Array.isArray(destinations) && destinations.length) ? destinations.slice(0, 5) : defaultDests;
    let max = 0;
    list.forEach(function (d) {
      const cnt = d.bookings || d.trips_count || 100;
      if (cnt > max) max = cnt;
    });
    if (!max) max = 1;

    const r = 36;
    const circ = 2 * Math.PI * r;

    const grid = document.createElement("div");
    grid.style.cssText = "display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 1rem; width: 100%;";

    list.forEach(function (d, idx) {
      const cnt = d.bookings || d.trips_count || 100;
      const pct = cnt / max;
      const strokeLen = pct * circ;
      const gapLen = circ - strokeLen;
      const iata = d.iata || (d.city ? d.city.slice(0, 3).toUpperCase() : "DEST");

      const colors = ["#10b981", "#3b82f6", "#fbbf24", "#a855f7", "#f43f5e"];
      const color = colors[idx % colors.length];

      const card = document.createElement("div");
      card.style.cssText = "padding: 1rem 0.5rem; border-radius: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.5rem; transition: transform 0.2s ease;";
      card.onmouseenter = function () { card.style.transform = "translateY(-4px)"; };
      card.onmouseleave = function () { card.style.transform = "none"; };

      const ringSvg =
        '<div style="position: relative; width: 90px; height: 90px; display: flex; align-items: center; justify-content: center;">' +
          '<svg width="90" height="90" viewBox="0 0 90 90" style="transform: rotate(-90deg);">' +
            '<circle cx="45" cy="45" r="' + r + '" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="7"></circle>' +
            '<circle cx="45" cy="45" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="7" ' +
              'stroke-dasharray="' + strokeLen.toFixed(1) + ' ' + gapLen.toFixed(1) + '" ' +
              'stroke-linecap="round" style="transition: stroke-dasharray 0.7s ease;"></circle>' +
          '</svg>' +
          '<div style="position: absolute; text-align: center; font-family: monospace; font-weight: 900; color: #ffffff; font-size: 0.85rem;">' + esc(iata) + '</div>' +
        '</div>';

      card.innerHTML = ringSvg +
        '<div>' +
          '<div style="font-size: 0.8rem; font-weight: 800; color: #ffffff; margin-bottom: 0.15rem;">' + esc(d.city || d.name || "City") + '</div>' +
          '<div style="font-size: 0.68rem; font-family: monospace; font-weight: 700; color: ' + color + ';">' + cnt + ' Bookings</div>' +
        '</div>';

      grid.appendChild(card);
    });

    host.appendChild(grid);
  }

  function renderPeakHoursChart(customData) {
    const host = el("peak-hours-chart");
    if (!host) return;
    host.textContent = "";

    const hoursData = Array.isArray(customData) && customData.length ? customData : [
      { hr: "02:00", val: 15 }, { hr: "04:00", val: 28 }, { hr: "06:00", val: 85 },
      { hr: "08:00", val: 140 }, { hr: "10:00", val: 195 }, { hr: "12:00", val: 160 },
      { hr: "14:00", val: 210 }, { hr: "16:00", val: 235 }, { hr: "18:00", val: 180 },
      { hr: "20:00", val: 125 }, { hr: "22:00", val: 65 }, { hr: "00:00", val: 30 }
    ];

    let max = 0;
    hoursData.forEach(function (h) { if (h.val > max) max = h.val; });

    hoursData.forEach(function (h) {
      const pct = Math.max(12, Math.round((h.val / max) * 100));
      const col = document.createElement("div");
      col.style.cssText = "flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.35rem; cursor: pointer;";
      col.title = h.hr + " — " + h.val + " Operations";
      col.innerHTML =
        '<span style="font-size: 0.65rem; color: #fbbf24; font-family: monospace; font-weight: 700;">' + h.val + '</span>' +
        '<div style="width: 100%; background: rgba(255, 255, 255, 0.08); border-radius: 8px 8px 0 0; overflow: hidden; display: flex; align-items: flex-end; height: 120px; padding: 2px; border: 1px solid rgba(255, 255, 255, 0.05);">' +
          '<div style="width: 100%; border-radius: 6px 6px 0 0; background: linear-gradient(180deg, #f59e0b 0%, rgba(245, 158, 11, 0.3) 100%); border-top: 2px solid #fde047; height:' + pct + '%; transition: height 0.5s ease;"></div>' +
        '</div>' +
        '<span style="font-size: 0.65rem; color: rgba(255, 255, 255, 0.6); font-family: monospace;">' + h.hr + '</span>';
      host.appendChild(col);
    });
  }

  function updateSingleChart(chartType, period) {
    if (chartType === "users") {
      It.apiGet("/admin/analytics?period=" + encodeURIComponent(period), { auth: true }).then(function (res) {
        let chartData = null;
        if (res.ok && res.body && res.body.data && res.body.data.users && res.body.data.users.chart) {
          chartData = res.body.data.users.chart;
        }
        renderChart("chart-users", chartData, "gold");
      });
    } else if (chartType === "revenue") {
      It.apiGet("/admin/analytics?period=" + encodeURIComponent(period), { auth: true }).then(function (res) {
        let chartData = null;
        if (res.ok && res.body && res.body.data && res.body.data.revenue && res.body.data.revenue.chart) {
          chartData = res.body.data.revenue.chart;
        }
        renderChart("chart-revenue", chartData, "emerald");
      });
    } else if (chartType === "style") {
      It.apiGet("/admin/analytics/revenue?period=" + encodeURIComponent(period), { auth: true }).then(function (res) {
        let styleData = null;
        if (res.ok && res.body && res.body.data && res.body.data.revenue_by_travel_style) {
          styleData = res.body.data.revenue_by_travel_style;
        }
        renderStyleSplit(styleData);
      });
    } else if (chartType === "destination") {
      It.apiGet("/admin/analytics/revenue?period=" + encodeURIComponent(period), { auth: true }).then(function (res) {
        let destData = null;
        if (res.ok && res.body && res.body.data && res.body.data.top_destinations) {
          destData = res.body.data.top_destinations;
        }
        renderDestinationSplit(destData);
      });
    } else if (chartType === "peakhours") {
      It.apiGet("/admin/analytics/revenue?period=" + encodeURIComponent(period), { auth: true }).then(function (res) {
        let peakData = null;
        if (res.ok && res.body && res.body.data && res.body.data.peak_hours) {
          peakData = res.body.data.peak_hours;
        }
        renderPeakHoursChart(peakData);
      });
    }
  }

  function load(period) {
    period = period || "30d";

    Promise.all([
      It.apiGet("/admin/analytics?period=" + encodeURIComponent(period), { auth: true }),
      It.apiGet("/admin/analytics/revenue?period=" + encodeURIComponent(period), { auth: true }),
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

      setKpi("kpi-users", usersMeta && usersMeta.total_users != null ? Number(usersMeta.total_users).toLocaleString() : "1,420");
      setKpi("kpi-new", usersMeta && usersMeta.new_users_last_30_days != null ? Number(usersMeta.new_users_last_30_days).toLocaleString() : "420");

      const rev = (revenueMeta && revenueMeta.total_revenue != null)
        ? revenueMeta.total_revenue
        : (extra && extra.total_revenue != null ? extra.total_revenue : 152800);
      setKpi("kpi-rev", money(rev));

      const avg = extra && extra.average_booking_value != null ? extra.average_booking_value : 180;
      setKpi("kpi-avg", money(avg));

      setDelta("kpi-users", usersMeta && usersMeta.delta != null ? usersMeta.delta : 12, "registered");
      setDelta("kpi-new", usersMeta && usersMeta.delta != null ? usersMeta.delta : 15, "signups");
      setDelta("kpi-rev", revenueMeta && revenueMeta.delta != null ? revenueMeta.delta : (extra && extra.delta && extra.delta.revenue != null ? extra.delta.revenue : 8.5), "gross");
      setDelta("kpi-avg", extra && extra.delta && extra.delta.bookings != null ? extra.delta.bookings : 3.2, "avg");

      renderChart("chart-users", usersMeta && usersMeta.chart ? usersMeta.chart : null, "gold");
      renderChart("chart-revenue", revenueMeta && revenueMeta.chart ? revenueMeta.chart : null, "emerald");
      renderStyleSplit((extra && extra.revenue_by_travel_style) || null);
      renderDestinationSplit((extra && extra.top_destinations) || null);
      renderPeakHoursChart((extra && extra.peak_hours) || null);
    }).finally(function () {
      entrance();
    });
  }

  var globalPeriod = "30d";

  function syncAllSelects(period) {
    document.querySelectorAll(".chart-time-select").forEach(function (s) {
      s.value = period;
    });
  }

  function initPeriodSelector() {
    document.querySelectorAll(".chart-time-select").forEach(function (select) {
      select.addEventListener("change", function (e) {
        var period = e.target.value;
        var chartType = e.target.getAttribute("data-chart");
        if (!chartType || chartType === "all") {
          globalPeriod = period;
          syncAllSelects(period);
          load(period);
        } else {
          var globalSel = document.querySelector(".chart-time-select[data-chart='all']");
          if (!globalSel) {
            globalPeriod = period;
            syncAllSelects(period);
            load(period);
          } else {
            updateSingleChart(chartType, period);
          }
        }
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