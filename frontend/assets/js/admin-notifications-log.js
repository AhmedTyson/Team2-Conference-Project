/**
 * admin-notifications-log.js — Notification Log (Phase 9 Admin Ops).
 * GET /v1/admin/notifications/log?per_page=50 → latest rows incl. raw `data`
 * payload for debugging (docs: /admin/notifications/log, full history).
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

  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function fmtDate(v) {
    if (!v) return "–";
    const d = new Date(v);
    return isNaN(d) ? "–" : d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "medium" });
  }

  function statusBadge(s) {
    const cls = s === "unread" ? "badge-warn" : s === "resolved" ? "badge-ok" : "badge";
    return '<span class="badge ' + cls + '">' + String(s || "?").toUpperCase() + "</span>";
  }

  function render() {
    const host = el("log-content");
    const rows = paginator && paginator.data ? paginator.data : [];

    if (!rows.length) {
      host.innerHTML = '<div class="kit-empty">No notifications recorded yet.</div>';
      return;
    }

    let html = '<table class="kit-table kit-table-log"><thead><tr>' +
      "<th>Type</th><th>Title / body</th><th>User</th><th>Status</th><th>Created</th><th>Payload</th>" +
      "</tr></thead><tbody>";

    rows.forEach(function (n) {
      let payload = "";
      try {
        const raw = typeof n.data === "string" ? JSON.parse(n.data) : n.data;
        payload = raw && Object.keys(raw).length ? JSON.stringify(raw, null, 1) : "{}";
      } catch (e) {
        payload = "(unparsed)";
      }
      html += "<tr>" +
        '<td><span class="notif-type">' + esc(n.type || "?") + "</span></td>" +
        "<td><strong>" + esc(n.title || "(untitled)") + "</strong>" +
        (n.body ? "<div class='muted'>" + esc(n.body) + "</div>" : "") + "</td>" +
        "<td>" + esc(n.user ? n.user.name : "–") + "</td>" +
        "<td>" + statusBadge(n.status) + "</td>" +
        "<td>" + fmtDate(n.created_at) + "</td>" +
        '<td><pre class="log-payload">' + esc(payload) + "</pre></td>" +
        "</tr>";
    });

    html += "</tbody></table>";
    host.innerHTML = html;

    if (paginator && paginator.total > paginator.per_page) {
      let nav = '<div class="kit-pager">' +
        (paginator.current_page > 1 ? '<button type="button" class="btn-sm" id="page-prev">← Previous</button>' : '<span class="muted">← Previous</span>') +
        '<span class="muted">Page ' + paginator.current_page + " of " + paginator.last_page + "</span>" +
        (paginator.current_page < paginator.last_page ? '<button type="button" class="btn-sm" id="page-next">Next →</button>' : '<span class="muted">Next →</span>') +
        "</div>";
      host.insertAdjacentHTML("beforeend", nav);
      const p = el("page-prev");
      const n = el("page-next");
      if (p) p.addEventListener("click", function () { load(paginator.current_page - 1); });
      if (n) n.addEventListener("click", function () { load(paginator.current_page + 1); });
    }
  }

  function load(page) {
    It.apiGet("/v1/admin/notifications/log?page=" + (page || 1) + "&per_page=50", { auth: true }).then(function (res) {
      if (!res.ok) {
        el("log-content").innerHTML = '<div class="kit-error">Could not load the notification log.</div>';
        It.feedback.banner("Failed to load log.", "is-error");
        return;
      }
      paginator = res.body && res.body.data;
      el("log-subtitle").textContent =
        (paginator && paginator.total != null ? paginator.total + " records · " : "") + "latest first";
      render();
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
      load(1);
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})(window);
