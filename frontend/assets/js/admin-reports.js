/**
 * admin-reports.js — Reports list + generation (Phase 9 Admin Ops).
 * GET  /v1/admin/reports           → paginated list (data.data paginator)
 * POST /v1/admin/reports/generate  → { from, to } queues PDF job (202)
 * GET  /v1/admin/reports/{id}      → detail (used by report-details.html)
 * GET  /v1/admin/reports/{id}/download → binary PDF; fetched with the
 *       bearer token and saved as a blob (plain <a> can't send JWT headers).
 */
(function (global) {
  "use strict";

  const It = global.Itinari;

  function el(id) { return document.getElementById(id); }

  let paginator = null;

  function renderProfile(user) {
    const chip = el("user-chip");
    if (!chip) return;
    el("chip-name").textContent = user.name || "";
    el("chip-role").textContent = It.session.roleOf(user) || "admin";
    chip.hidden = false;
  }

  function statusBadge(status) {
    const cls = status === "ready" ? "badge-ok" : status === "failed" ? "badge-danger" : "badge-warn";
    return '<span class="badge ' + cls + '">' + String(status || "?").toUpperCase() + "</span>";
  }

  function fmtDate(v) {
    if (!v) return "–";
    const d = new Date(v);
    return isNaN(d) ? "–" : d.toLocaleDateString(undefined, { dateStyle: "medium" });
  }

  function downloadReport(id, btn) {
    const token = It.readToken();
    if (!token) {
      It.feedback.banner("You must be signed in to download.", "is-error");
      return;
    }
    btn.disabled = true;
    fetch(It.CONFIG.apiBase + "/v1/admin/reports/" + id + "/download", {
      headers: { Authorization: "Bearer " + token },
    }).then(function (res) {
      btn.disabled = false;
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
      btn.disabled = false;
      It.feedback.banner("Could not download the report.", "is-error");
    });
  }

  function render() {
    const host = el("reports-content");
    const rows = paginator && paginator.data ? paginator.data : [];

    if (!rows.length) {
      host.innerHTML = '<div class="kit-empty">No reports yet — queue one above.</div>';
      return;
    }

    let html = '<table class="kit-table"><thead><tr>' +
      "<th>ID</th><th>Period</th><th>Status</th><th>Requested by</th><th>Generated</th><th class='th-actions'>Actions</th>" +
      "</tr></thead><tbody>";

    rows.forEach(function (r) {
      const ready = r.status === "ready" && r.file_url;
      html += "<tr>" +
        "<td>" + r.id + "</td>" +
        "<td><a href='report-details.html?id=" + r.id + "' style='text-decoration:underline;'>" +
        fmtDate(r.from_date) + " → " + fmtDate(r.to_date) + "</a></td>" +
        "<td>" + statusBadge(r.status) + "</td>" +
        "<td>" + ((r.user && r.user.name) || "–") + "</td>" +
        "<td>" + fmtDate(r.created_at) + "</td>" +
        "<td class='td-actions'>" +
        '<a class="btn-sm" href="report-details.html?id=' + r.id + '">View</a>' +
        (ready
          ? '<button type="button" class="btn-sm act-download" data-id="' + r.id + '">Download</button>'
          : "") +
        "</td></tr>";
    });

    html += "</tbody></table>";
    host.innerHTML = html;

    document.querySelectorAll(".act-download").forEach(function (btn) {
      btn.addEventListener("click", function () { downloadReport(Number(btn.getAttribute("data-id")), btn); });
    });

    if (paginator && paginator.links && paginator.total > paginator.per_page) {
      const prev = paginator.current_page > 1;
      const next = paginator.current_page < paginator.last_page;
      let nav = '<div class="kit-pager">' +
        (prev ? '<button type="button" class="btn-sm" id="page-prev">← Previous</button>' : '<span class="muted">← Previous</span>') +
        '<span class="muted">Page ' + paginator.current_page + " of " + paginator.last_page + "</span>" +
        (next ? '<button type="button" class="btn-sm" id="page-next">Next →</button>' : '<span class="muted">Next →</span>') +
        "</div>";
      host.insertAdjacentHTML("beforeend", nav);
      const p = el("page-prev");
      const n = el("page-next");
      if (p) p.addEventListener("click", function () { load(paginator.current_page - 1); });
      if (n) n.addEventListener("click", function () { load(paginator.current_page + 1); });
    }
  }

  function load(page) {
    page = page || 1;
    It.apiGet("/v1/admin/reports?page=" + page + "&per_page=15", { auth: true }).then(function (res) {
      if (!res.ok) {
        el("reports-content").innerHTML = '<div class="kit-error">Could not load reports.</div>';
        It.feedback.banner("Failed to load reports.", "is-error");
        return;
      }
      paginator = res.body && res.body.data;
      el("reports-subtitle").textContent = paginator && paginator.total != null
        ? paginator.total + " report(s) on file"
        : "Reports archive";
      render();
    });
  }

  function generate() {
    const from = el("report-from").value;
    const to = el("report-to").value;
    if (!from || !to) {
      It.feedback.banner("Pick both dates to generate a report.", "is-error");
      return;
    }
    if (new Date(to) < new Date(from)) {
      It.feedback.banner("The end date must be after the start date.", "is-error");
      return;
    }
    const btn = el("report-generate-btn");
    btn.disabled = true;
    It.apiPost("/v1/admin/reports/generate", { from: from, to: to }, { auth: true }).then(function (res) {
      btn.disabled = false;
      if (!res.ok) {
        const body = res.body || {};
        let msg = "Could not queue the report.";
        if (body.error && body.error.validation_errors) {
          msg = body.error.validation_errors.map(function (v) { return v.message; }).join(" ");
        }
        It.feedback.banner(msg, "is-error");
        return;
      }
      It.feedback.banner("Report generation queued — refresh the list shortly.", "is-ok");
      setTimeout(load, 1500);
    });
  }

  function init() {
    const logoutBtn = el("logout-btn");
    if (logoutBtn) logoutBtn.addEventListener("click", function () { It.session.logout(); });

    const form = el("report-form");
    if (form) form.addEventListener("submit", function (e) { e.preventDefault(); generate(); });

    if (!It.session.hasToken()) { It.session.redirectToLogin(); return; }
    It.session.currentUser().then(function (user) {
      if (!user) { It.session.clearSession(); It.session.redirectToLogin(); return; }
      if (!It.session.isAdminRole(It.session.roleOf(user))) {
        It.session.clearSession();
        It.session.redirectToLogin();
        return;
      }
      renderProfile(user);
      load(1);
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})(window);
