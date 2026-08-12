/**
 * admin-report-details.js — Per-report detail (Phase 9 Admin Ops).
 * GET /v1/admin/reports/{id} → { data: { report, kpis } }
 * Download reuses the same endpoint family as the list page.
 */
(function (global) {
  "use strict";

  const It = global.Itinari;

  function el(id) { return document.getElementById(id); }

  function getQueryParam(param) {
    return new URLSearchParams(global.location.search).get(param);
  }

  function renderProfile(user) {
    const chip = el("user-chip");
    if (!chip) return;
    el("chip-name").textContent = user.name || "";
    el("chip-role").textContent = It.session.roleOf(user) || "admin";
    chip.hidden = false;
  }

  function fmtDate(v) {
    if (!v) return "–";
    const d = new Date(v);
    return isNaN(d) ? "–" : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }

  function statusBadge(status) {
    const cls = status === "ready" ? "badge-ok" : status === "failed" ? "badge-danger" : "badge-warn";
    return '<span class="badge ' + cls + '">' + String(status || "?").toUpperCase() + "</span>";
  }

  function money(v) {
    return v == null ? "–" : "$" + Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  function renderKpis(kpis) {
    const host = el("report-kpis");
    if (!kpis || typeof kpis !== "object") {
      host.innerHTML = '<div class="kit-empty">No KPIs available for this period.</div>';
      return;
    }
    const cards = [
      { label: "Revenue", value: money(kpis.revenue) },
      { label: "Bookings", value: kpis.bookings != null ? kpis.bookings : "–" },
      { label: "Active users", value: kpis.users != null ? kpis.users : "–" },
      { label: "Growth", value: kpis.growth_percent != null ? kpis.growth_percent + "%" : "–" },
    ];
    host.innerHTML = cards.map(function (c) {
      return '<div class="kpi"><span class="kpi-label">' + c.label + '</span><span class="kpi-value">' + c.value + "</span></div>";
    }).join("");
  }

  function renderReport(r) {
    el("report-title").textContent = "Report #" + r.id + " · " + fmtDate(r.from_date) + " → " + fmtDate(r.to_date);
    el("report-subtitle").textContent = (r.user && r.user.name) ? "Requested by " + r.user.name : "";

    const ready = r.status === "ready" && r.file_url;
    const host = el("report-details-content");
    host.innerHTML =
      '<div class="kit-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">' +
      "<div><strong>ID:</strong> " + r.id + "</div>" +
      "<div><strong>Status:</strong> " + statusBadge(r.status) + "</div>" +
      "<div><strong>Period:</strong> " + fmtDate(r.from_date) + " → " + fmtDate(r.to_date) + "</div>" +
      "<div><strong>Requested by:</strong> " + ((r.user && r.user.name) || "–") + "</div>" +
      "<div><strong>Requested at:</strong> " + fmtDate(r.created_at) + "</div>" +
      "<div><strong>Updated at:</strong> " + fmtDate(r.updated_at) + "</div>" +
      "</div>" +
      (r.file_path ? "<div style='margin-top: 1rem;'><strong>File:</strong> <span class='muted'>" + r.file_path + "</span></div>" : "") +
      '<div style="margin-top: 1.25rem;">' +
      (ready
        ? '<button type="button" class="btn-sm" id="report-download">Download PDF</button>'
        : r.status === "pending"
          ? '<span class="badge badge-warn">PDF generation in progress — refresh later.</span>'
          : '<span class="badge badge-danger">No file available.</span>') +
      "</div>";

    const dl = el("report-download");
    if (dl) dl.addEventListener("click", function () { download(ready); });
  }

  function download() {
    const id = getQueryParam("id");
    const token = It.readToken();
    if (!token) return;
    fetch(It.CONFIG.apiBase + "/v1/admin/reports/" + id + "/download", {
      headers: { Authorization: "Bearer " + token },
    }).then(function (res) {
      if (!res.ok) {
        It.feedback.banner(res.status === 409 ? "Report generation is still in progress." : "Download failed.", "is-error");
        return;
      }
      return res.blob().then(function (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "report-" + id + ".pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      });
    }).catch(function () {
      It.feedback.banner("Could not download the report.", "is-error");
    });
  }

  function load() {
    const id = getQueryParam("id");
    if (!id) {
      It.feedback.banner("No report ID provided.", "is-error");
      return;
    }
    It.apiGet("/v1/admin/reports/" + encodeURIComponent(id), { auth: true }).then(function (res) {
      if (!res.ok) {
        el("report-details-content").innerHTML = '<div class="kit-error">Could not load this report.</div>';
        It.feedback.banner("Failed to fetch report.", "is-error");
        return;
      }
      const data = res.body && res.body.data;
      if (!data || !data.report) {
        el("report-details-content").innerHTML = '<div class="kit-error">Malformed report payload.</div>';
        return;
      }
      renderReport(data.report);
      renderKpis(data.kpis);
    });
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
      renderProfile(user);
      load();
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})(window);
