/**
 * admin-contacts.js — Contact Inbox (Phase 9 Admin Ops).
 * GET  /v1/admin/contacts             → full list (latest first)
 * PATCH /v1/admin/contacts/batch      → { ids[], action: read|resolve }
 * PATCH /v1/admin/contacts/{id}/read  → single mark read
 * PATCH /v1/admin/contacts/{id}/resolve → single resolve
 * Filter tabs (all/unread/read/resolved) are client-side; the backend
 * returns the full inbox in one call (no pagination/filters yet — flagged).
 */
(function (global) {
  "use strict";

  const It = global.Itinari;

  function el(id) { return document.getElementById(id); }

  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  let messages = [];
  let filter = "";
  let selected = new Set();

  function renderProfile(user) {
    const chip = el("user-chip");
    if (!chip) return;
    el("chip-name").textContent = user.name || "";
    el("chip-role").textContent = It.session.roleOf(user) || "admin";
    chip.hidden = false;
  }

  function statusBadge(status) {
    const cls = status === "unread" ? "badge-warn" : status === "read" ? "badge" : "badge-ok";
    return '<span class="badge ' + cls + '">' + String(status).toUpperCase() + "</span>";
  }

  function fmtDate(v) {
    if (!v) return "–";
    const d = new Date(v);
    return isNaN(d) ? "–" : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }

  function visibleMessages() {
    return filter ? messages.filter(function (m) { return m.status === filter; }) : messages;
  }

  function updateCounts() {
    const count = function (s) { return s ? messages.filter(function (m) { return m.status === s; }).length : messages.length; };
    const set = function (id, v) {
      const node = el(id);
      if (node) node.textContent = v;
    };
    set("count-unread", count("unread"));
    set("count-read", count("read"));
    set("count-resolved", count("resolved"));
  }

  function refreshSelected() {
    const list = visibleMessages().map(function (m) { return m.id; });
    selected.forEach(function (id) { if (list.indexOf(id) === -1) selected.delete(id); });
    document.querySelectorAll(".msg-check").forEach(function (cb) {
      cb.checked = selected.has(Number(cb.value));
    });
    const bar = el("batch-bar");
    if (selected.size) {
      bar.hidden = false;
      el("batch-count-label").textContent = selected.size + " selected";
    } else {
      bar.hidden = true;
    }
  }

  function render() {
    const host = el("contacts-content");
    const list = visibleMessages();

    if (!messages.length) {
      host.innerHTML = '<div class="kit-empty">No contact messages yet.</div>';
      return;
    }
    if (!list.length) {
      host.innerHTML = '<div class="kit-empty">No messages in this status.</div>';
      return;
    }

    let html = '<table class="kit-table"><thead><tr>' +
      '<th class="th-check"><input type="checkbox" id="check-all" aria-label="Select all" /></th>' +
      "<th>From</th><th>Subject</th><th>Message</th><th>Status</th><th>Received</th><th class='th-actions'>Actions</th>" +
      "</tr></thead><tbody>";

    list.forEach(function (m) {
      html += "<tr" + (m.status === "unread" ? ' class="is-unread"' : "") + ">" +
        '<td class="td-check"><input type="checkbox" class="msg-check" value="' + m.id + '" aria-label="Select message" /></td>' +
        "<td><strong>" + esc(m.name || "–") + "</strong><br /><span class='muted'>" + esc(m.email || "") + "</span></td>" +
        "<td>" + esc(m.subject || "–") + "</td>" +
        "<td class='td-comment' title='" + esc(m.message || "").replace(/'/g, "&#39;") + "'>" + esc((m.message || "").slice(0, 90)) + "</td>" +
        "<td>" + statusBadge(m.status) + "</td>" +
        "<td>" + fmtDate(m.created_at) + "</td>" +
        "<td class='td-actions'>" +
        (m.status !== "resolved"
          ? '<button type="button" class="btn-sm act-read" data-id="' + m.id + '" data-status="' + m.status + '">' +
            (m.status === "unread" ? "Mark read" : "Mark unread") + "</button>"
          : "") +
        (m.status !== "resolved"
          ? '<button type="button" class="btn-sm act-resolve" data-id="' + m.id + '">Resolve</button>'
          : '<span class="muted">Resolved</span>') +
        "</td></tr>";
    });

    html += "</tbody></table>";
    host.innerHTML = html;

    const checkAll = el("check-all");
    if (checkAll) {
      checkAll.addEventListener("change", function () {
        visibleMessages().forEach(function (m) {
          if (checkAll.checked) selected.add(m.id); else selected.delete(m.id);
        });
        refreshSelected();
      });
    }

    document.querySelectorAll(".msg-check").forEach(function (cb) {
      cb.addEventListener("change", function () {
        const id = Number(cb.value);
        if (cb.checked) selected.add(id); else selected.delete(id);
        refreshSelected();
      });
    });

    document.querySelectorAll(".act-read").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const id = Number(btn.getAttribute("data-id"));
        const status = btn.getAttribute("data-status");
        if (status === "unread") markSingle(id, "read");
        else markSingle(id, "unread");
      });
    });

    document.querySelectorAll(".act-resolve").forEach(function (btn) {
      btn.addEventListener("click", function () {
        markSingle(Number(btn.getAttribute("data-id")), "resolve");
      });
    });

    refreshSelected();
  }

  function markSingle(id, action) {
    const patch = action === "unread" ? "read" : action; // backend has no un-read route
    if (action === "unread") {
      // Backend has no "mark unread" endpoint — flag: not implemented backend-side.
      It.feedback.banner("The backend has no un-read action yet — marking read instead.", "is-warn");
    }
    It.apiPatch("/v1/admin/contacts/" + id + "/" + patch, {}, { auth: true }).then(function (res) {
      if (!res.ok) {
        It.feedback.banner("Could not update message.", "is-error");
        return;
      }
      It.feedback.toast((res.body && res.body.message) || "Message updated.");
      load();
    });
  }

  function batch(action) {
    const ids = Array.from(selected);
    if (!ids.length) return;
    It.apiPatch("/v1/admin/contacts/batch", { ids: ids, action: action }, { auth: true }).then(function (res) {
      if (!res.ok) {
        const body = res.body || {};
        let msg = "Batch action failed.";
        if (body.error && body.error.validation_errors) {
          msg = body.error.validation_errors.map(function (v) { return v.message; }).join(" ");
        }
        It.feedback.banner(msg, "is-error");
        return;
      }
      It.feedback.toast((res.body && res.body.message) || "Messages updated.");
      selected.clear();
      load();
    });
  }

  function load() {
    It.apiGet("/v1/admin/contacts", { auth: true }).then(function (res) {
      if (!res.ok) {
        el("contacts-content").innerHTML = '<div class="kit-error">Could not load the contact inbox.</div>';
        It.feedback.banner("Failed to load messages.", "is-error");
        return;
      }
      const list = res.body && res.body.data;
      messages = Array.isArray(list) ? list : [];
      el("contacts-subtitle").textContent = messages.length + " message(s) in the inbox";
      updateCounts();
      render();
    });
  }

  function init() {
    const logoutBtn = el("logout-btn");
    if (logoutBtn) logoutBtn.addEventListener("click", function () { It.session.logout(); });

    document.querySelectorAll("#contacts-tabs .seg-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        document.querySelectorAll("#contacts-tabs .seg-tab").forEach(function (t) { t.classList.remove("is-active"); });
        tab.classList.add("is-active");
        filter = tab.getAttribute("data-status");
        render();
      });
    });

    const bRead = el("batch-read");
    const bResolve = el("batch-resolve");
    const bClear = el("batch-clear");
    if (bRead) bRead.addEventListener("click", function () { batch("read"); });
    if (bResolve) bResolve.addEventListener("click", function () { batch("resolve"); });
    if (bClear) bClear.addEventListener("click", function () { selected.clear(); refreshSelected(); });

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

