/**
 * admin-reviews.js — Review moderation (Phase 16, from scratch, no kit).
 * GET /v1/admin/reviews · PATCH /{id}/approve|reject · DELETE /{id}.
 * ReviewResource: id, user_id, reviewable_type, reviewable_id, rating,
 * comment, status, created_at.
 */
(function (global) {
  "use strict";

  const It = global.Itinari;

  const URL = "/v1/admin/reviews";

  function el(id) { return document.getElementById(id); }

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
    return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString();
  }

  function badge(status) {
    const b = document.createElement("span");
    const s = String(status || "pending").toLowerCase();
    b.className = "badge " + (s === "approved" ? "badge-ok" : s === "pending" ? "badge-warn" : "badge-off");
    b.textContent = s.toUpperCase();
    return b;
  }

  function setStatus(id, action, approve) {
    It.apiPatch(URL + "/" + id + (approve ? "/approve" : "/reject"), {}, { auth: true }).then(function (res) {
      if (res.ok) {
        It.feedback.banner(approve ? "Review approved." : "Review rejected.", "is-ok");
        load();
      } else {
        It.feedback.banner((res.body && res.body.message) || "Update failed.", "is-error");
      }
    });
  }

  function removeReview(id) {
    if (!global.confirm("Delete review #" + id + "? This cannot be undone.")) return;
    It.apiDelete(URL + "/" + id, { auth: true }).then(function (res) {
      if (res.ok) {
        It.feedback.banner("Review deleted.", "is-ok");
        load();
      } else {
        It.feedback.banner((res.body && res.body.message) || "Delete failed.", "is-error");
      }
    });
  }

  function typeLabel(t) {
    return String(t || "–").split("\\").pop().split("/").pop().replace(/_/g, " ").toUpperCase();
  }

  function renderTable(reviews) {
    const host = el("reviews-table");
    host.textContent = "";
    if (!Array.isArray(reviews) || !reviews.length) {
      const empty = document.createElement("div");
      empty.className = "kit-empty";
      empty.textContent = "No reviews yet.";
      host.appendChild(empty);
      return;
    }
    const table = document.createElement("table");
    table.className = "kit-table";
    const thead = document.createElement("thead");
    const htr = document.createElement("tr");
    ["ID", "User", "On", "Rating", "Comment", "Status", "Created", "Actions"].forEach(function (t) {
      const th = document.createElement("th");
      th.textContent = t;
      htr.appendChild(th);
    });
    thead.appendChild(htr);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    reviews.forEach(function (r) {
      const tr = document.createElement("tr");
      const td = function (content) {
        const c = document.createElement("td");
        c.appendChild(typeof content === "string" ? document.createTextNode(content) : content);
        return c;
      };
      tr.appendChild(td(String(r.id)));
      tr.appendChild(td(r.user_id ? "User #" + r.user_id : "–"));
      tr.appendChild(td(typeLabel(r.reviewable_type) + " #" + (r.reviewable_id ?? "–")));
      tr.appendChild(td(r.rating == null ? "–" : "★ " + Number(r.rating).toFixed(1)));
      const commentCell = document.createElement("td");
      commentCell.className = "td-comment";
      commentCell.textContent = r.comment || "–";
      tr.appendChild(commentCell);
      tr.appendChild(td(badge(r.status)));
      tr.appendChild(td(fmtDate(r.created_at)));

      const cell = document.createElement("td");
      cell.className = "td-actions";
      const status = String(r.status || "pending").toLowerCase();
      if (status !== "approved") {
        const appBtn = document.createElement("button");
        appBtn.type = "button";
        appBtn.className = "btn-ghost btn-sm";
        appBtn.textContent = "Approve";
        appBtn.addEventListener("click", function () { setStatus(r.id, "approve", true); });
        cell.appendChild(appBtn);
      }
      if (status !== "rejected") {
        const rejBtn = document.createElement("button");
        rejBtn.type = "button";
        rejBtn.className = "btn-ghost btn-sm is-danger-text";
        rejBtn.textContent = "Reject";
        rejBtn.addEventListener("click", function () { setStatus(r.id, "reject", false); });
        cell.appendChild(rejBtn);
      }
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn-ghost btn-sm is-danger-text";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", function () { removeReview(r.id); });
      cell.appendChild(delBtn);
      tr.appendChild(cell);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    host.appendChild(table);
  }

  function load() {
    const host = el("reviews-table");
    if (host) {
      host.textContent = "";
      host.innerHTML = '<div class="kit-grid-skeleton"><div class="box skeleton"></div><div class="box skeleton"></div><div class="box skeleton"></div></div>';
    }
    It.apiGet(URL, { auth: true }).then(function (res) {
      if (!res.ok) {
        host.textContent = "";
        host.innerHTML = '<div class="kit-error">Could not load reviews.</div>';
        It.feedback.banner("Could not load reviews.", "is-error");
        return;
      }
      renderTable((res.body.data && res.body.data.data) || res.body.data || []);
    });
  }

  function boot(user) {
    renderProfile(user);
    load();
  }

  function init() {
    document.addEventListener("admin:search", function (e) {
      const q = String(e.detail || "").toLowerCase();
      let visible = 0;
      document.querySelectorAll("#reviews-table tbody tr").forEach(function (tr) {
        const show = !q || tr.textContent.toLowerCase().indexOf(q) !== -1;
        tr.style.display = show ? "" : "none";
        if (show) visible++;
      });
      if (q && !visible) {
        let er = document.getElementById("search-empty-row");
        if (!er) {
          er = document.createElement("tr");
          er.id = "search-empty-row";
          const td = document.createElement("td");
          td.colSpan = 6;
          td.className = "kit-empty";
          td.textContent = "No matches for this search.";
          er.appendChild(td);
        }
        const tb = document.querySelector("#reviews-table tbody");
        if (tb && !tb.contains(er)) tb.appendChild(er);
      } else {
        const er = document.getElementById("search-empty-row");
        if (er) er.remove();
      }
    });
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
      boot(user);
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})(window);