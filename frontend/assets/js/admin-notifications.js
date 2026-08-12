/**
 * admin-notifications.js — Admin Notifications center + Alert Inbox (Phase 9).
 * GET   /v1/admin/notifications?status=&type=&page=  → paginated + meta.unread_count
 * PATCH /v1/admin/notifications/{id}/read            → mark read
 * PATCH /v1/admin/notifications/{id}/resolve         → resolve (clears alert)
 */
(function (global) {
  "use strict";

  const It = global.Itinari;

  function el(id) { return document.getElementById(id); }

  let paginator = null;
  let status = "";
  let type = "";

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
    return isNaN(d) ? "–" : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }

  function statusBadge(s) {
    const cls = s === "unread" ? "badge-warn" : s === "resolved" ? "badge-ok" : "badge";
    return '<span class="badge ' + cls + '">' + String(s || "?").toUpperCase() + "</span>";
  }

  function render() {
    const host = el("notif-content");
    const rows = paginator && paginator.data ? paginator.data : [];

    if (!rows.length) {
      host.innerHTML = '<div class="kit-empty">No notifications in this view.</div>';
      return;
    }

    let html = '<ul class="notif-list">';
    rows.forEach(function (n) {
      const unread = n.status === "unread";
      html += '<li class="notif-item' + (unread ? " is-unread" : "") + '">' +
        '<div class="notif-main">' +
        '<span class="notif-type">' + esc(n.type || "?") + "</span>" +
        "<strong>" + esc(n.title || "(untitled)") + "</strong>" +
        (n.body ? "<p>" + esc(n.body) + "</p>" : "") +
        '<p class="muted notif-meta">' +
        "For " + esc(n.user ? n.user.name : "–") + " · " + fmtDate(n.created_at) +
        (n.read_at ? " · read " + fmtDate(n.read_at) : "") +
        "</p>" +
        "</div>" +
        '<div class="notif-actions">' + statusBadge(n.status) +
        (n.status === "unread"
          ? '<button type="button" class="btn-sm act-read" data-id="' + n.id + '">Mark read</button>'
          : "") +
        (n.status !== "resolved"
          ? '<button type="button" class="btn-sm act-resolve" data-id="' + n.id + '">Resolve</button>'
          : "") +
        "</div></li>";
    });
    html += "</ul>";
    host.innerHTML = html;

    document.querySelectorAll(".act-read").forEach(function (btn) {
      btn.addEventListener("click", function () {
        change(btn.getAttribute("data-id"), "read");
      });
    });
    document.querySelectorAll(".act-resolve").forEach(function (btn) {
      btn.addEventListener("click", function () {
        change(btn.getAttribute("data-id"), "resolve");
      });
    });

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

  function change(id, action) {
    It.apiPatch("/v1/admin/notifications/" + encodeURIComponent(id) + "/" + action, {}, { auth: true }).then(function (res) {
      if (!res.ok) {
        It.feedback.banner("Could not update notification.", "is-error");
        return;
      }
      It.feedback.toast((res.body && res.body.message) || "Notification updated.");
      if (window.ItinariNotif) window.ItinariNotif.refresh();
      load(paginator ? paginator.current_page : 1);
    });
  }

  function load(page) {
    const q = ["page=" + (page || 1)];
    if (status) q.push("status=" + encodeURIComponent(status));
    if (type) q.push("type=" + encodeURIComponent(type));
    It.apiGet("/v1/admin/notifications?" + q.join("&"), { auth: true }).then(function (res) {
      if (!res.ok) {
        el("notif-content").innerHTML = '<div class="kit-error">Could not load notifications.</div>';
        It.feedback.banner("Failed to load notifications.", "is-error");
        return;
      }
      paginator = res.body && res.body.data;
      const unread = res.body && res.body.meta ? res.body.meta.unread_count : null;
      el("notif-subtitle").textContent =
        (unread != null ? unread + " unread · " : "") +
        (paginator && paginator.total != null ? paginator.total + " total" : "");
      render();
    });
  }

  function init() {
    const logoutBtn = el("logout-btn");
    if (logoutBtn) logoutBtn.addEventListener("click", function () { It.session.logout(); });

    document.querySelectorAll("#notif-tabs .seg-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        document.querySelectorAll("#notif-tabs .seg-tab").forEach(function (t) { t.classList.remove("is-active"); });
        tab.classList.add("is-active");
        status = tab.getAttribute("data-status");
        load(1);
      });
    });

    const typeSel = el("notif-type");
    if (typeSel) typeSel.addEventListener("change", function () { type = typeSel.value; load(1); });

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
