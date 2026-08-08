/**
 * admin-trips.js — Travel plans (Phase 16, from scratch, no kit).
 * GET /v1/admin/trips · PUT /{id} · DELETE /{id}.
 * TripResource: id, user_id, title, travel_style, interests, no_of_travelers,
 * budget, no_of_days, start_date, end_date, status, estimated_cost.
 */
(function (global) {
  "use strict";

  const It = global.Itinari;

  const URL = "/v1/admin/trips";
  const STATUSES = ["pending", "planning", "booked", "completed", "cancelled"];

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

  function fmtMoney(v) {
    if (v === null || v === undefined || v === "") return "–";
    return Number(v).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  }

  function badge(text) {
    const b = document.createElement("span");
    b.className = "badge badge-off";
    const t = String(text || "").toLowerCase();
    if (["booked", "completed"].indexOf(t) !== -1) b.className = "badge badge-ok";
    if (t === "pending") b.className = "badge badge-warn";
    if (t === "cancelled") b.className = "badge badge-off";
    b.textContent = String(text || "–").toUpperCase();
    return b;
  }

  function openModal(row) {
    const root = el("modal-root");
    root.textContent = "";
    const wrap = document.createElement("div");
    wrap.className = "kit-modal-backdrop";
    wrap.id = "trip-modal";
    const opt = STATUSES.map(function (s) {
      return '<option value="' + s + '"' + (row.status === s ? " selected" : "") + ">" + s + "</option>";
    }).join("");
    wrap.innerHTML = (
      '<div class="kit-modal" role="dialog" aria-modal="true" aria-labelledby="trip-modal-title">' +
      '<div class="kit-modal-head"><h3 id="trip-modal-title">Edit trip #' + row.id + '</h3></div>' +
      '<form id="trip-form" class="kit-form">' +
      '<div class="kit-modal-body">' +
      '<div class="kit-field"><label for="m-title">Title</label>' +
      '<input id="m-title" name="title" type="text" value="' + (row.title || "") + '" required /></div>' +
      '<div class="kit-field"><label for="m-style">Travel style</label>' +
      '<input id="m-style" name="travel_style" type="text" value="' + (row.travel_style || "") + '" /></div>' +
      '<div class="kit-grid-2">' +
      '<div class="kit-field"><label for="m-travelers">Travelers</label>' +
      '<input id="m-travelers" name="no_of_travelers" type="number" min="1" value="' + (row.no_of_travelers || 1) + '" /></div>' +
      '<div class="kit-field"><label for="m-days">Days</label>' +
      '<input id="m-days" name="no_of_days" type="number" min="1" value="' + (row.no_of_days || 1) + '" /></div>' +
      '</div>' +
      '<div class="kit-grid-2">' +
      '<div class="kit-field"><label for="m-start">Start</label>' +
      '<input id="m-start" name="start_date" type="date" value="' + (row.start_date || "") + '" /></div>' +
      '<div class="kit-field"><label for="m-end">End</label>' +
      '<input id="m-end" name="end_date" type="date" value="' + (row.end_date || "") + '" /></div>' +
      '</div>' +
      '<div class="kit-grid-2">' +
      '<div class="kit-field"><label for="m-budget">Budget (USD)</label>' +
      '<input id="m-budget" name="budget" type="number" min="0" step="0.01" value="' + (row.budget ?? "") + '" /></div>' +
      '<div class="kit-field"><label for="m-status">Status</label>' +
      '<select id="m-status" name="status">' + opt + "</select></div>" +
      '</div>' +
      '</div>' +
      '<div class="kit-modal-foot">' +
      '<button type="button" class="btn-ghost" data-close>Cancel</button>' +
      '<button type="submit" class="btn-primary is-danger" style="background:hsl(var(--primary));color:hsl(var(--primary-foreground));border:1px solid transparent;border-radius:var(--radius-md);padding:0.45rem 0.95rem;font-weight:600;cursor:pointer;">Save</button>' +
      '</div>' +
      '</form>' +
      '</div>'
    );
    root.appendChild(wrap);

    wrap.querySelector("[data-close]").addEventListener("click", closeModal);
    wrap.addEventListener("click", function (e) { if (e.target === wrap) closeModal(); });

    wrap.querySelector("#trip-form").addEventListener("submit", function (e) {
      e.preventDefault();
      const payload = {
        title: wrap.querySelector("#m-title").value,
        travel_style: wrap.querySelector("#m-style").value,
        no_of_travelers: wrap.querySelector("#m-travelers").value,
        no_of_days: wrap.querySelector("#m-days").value,
        start_date: wrap.querySelector("#m-start").value,
        end_date: wrap.querySelector("#m-end").value,
        budget: wrap.querySelector("#m-budget").value,
        status: wrap.querySelector("#m-status").value,
      };
      It.apiPut(URL + "/" + row.id, payload, { auth: true }).then(function (res) {
        if (res.ok) {
          closeModal();
          It.feedback.banner("Trip updated.", "is-ok");
          load();
        } else {
          const msg = (res.body && (res.body.message || (res.body.error && res.body.error.message))) || "Save failed.";
          It.feedback.banner(String(msg).slice(0, 180), "is-error");
        }
      });
    });
  }

  function closeModal() {
    const root = el("modal-root");
    if (root) root.textContent = "";
  }

  function removeTrip(id) {
    if (!global.confirm("Delete trip #" + id + "? This cannot be undone.")) return;
    It.apiDelete(URL + "/" + id, { auth: true }).then(function (res) {
      if (res.ok) {
        It.feedback.banner("Trip deleted.", "is-ok");
        load();
      } else {
        It.feedback.banner((res.body && res.body.message) || "Delete failed.", "is-error");
      }
    });
  }

  function renderTable(trips) {
    const host = el("trips-table");
    host.textContent = "";
    if (!Array.isArray(trips) || !trips.length) {
      const empty = document.createElement("div");
      empty.className = "kit-empty";
      empty.textContent = "No trips yet.";
      host.appendChild(empty);
      return;
    }
    const table = document.createElement("table");
    table.className = "kit-table";
    const thead = document.createElement("thead");
    const htr = document.createElement("tr");
    ["ID", "Title", "Travelers", "Style", "Days", "Budget", "Status", "Dates", "Actions"].forEach(function (t) {
      const th = document.createElement("th");
      th.textContent = t;
      htr.appendChild(th);
    });
    thead.appendChild(htr);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    trips.forEach(function (t) {
      const tr = document.createElement("tr");
      const td = function (content) {
        const c = document.createElement("td");
        c.appendChild(typeof content === "string" ? document.createTextNode(content) : content);
        return c;
      };
      tr.appendChild(td(String(t.id)));
      tr.appendChild(td(t.title || "–"));
      tr.appendChild(td(String(t.no_of_travelers ?? "–")));
      tr.appendChild(td(t.travel_style || "–"));
      tr.appendChild(td(String(t.no_of_days ?? "–")));
      tr.appendChild(td(fmtMoney(t.budget)));
      tr.appendChild(td(badge(t.status)));

      const dateCell = document.createElement("td");
      const start = fmtDate(t.start_date);
      const end = fmtDate(t.end_date);
      dateCell.textContent = start + " → " + end;
      tr.appendChild(dateCell);

      const cell = document.createElement("td");
      cell.className = "td-actions";
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn-ghost btn-sm";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", function () { openModal(t); });
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn-ghost btn-sm is-danger-text";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", function () { removeTrip(t.id); });
      cell.appendChild(editBtn);
      cell.appendChild(delBtn);
      tr.appendChild(cell);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    host.appendChild(table);
  }

  function load() {
    const host = el("trips-table");
    if (host) {
      host.textContent = "";
      host.innerHTML = '<div class="kit-grid-skeleton"><div class="box skeleton"></div><div class="box skeleton"></div><div class="box skeleton"></div></div>';
    }
    It.apiGet(URL, { auth: true }).then(function (res) {
      if (!res.ok) {
        host.textContent = "";
        host.innerHTML = '<div class="kit-error">Could not load trips.</div>';
        It.feedback.banner("Could not load trips.", "is-error");
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
      document.querySelectorAll("#trips-table tbody tr").forEach(function (tr) {
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
          td.colSpan = 7;
          td.className = "kit-empty";
          td.textContent = "No matches for this search.";
          er.appendChild(td);
        }
        const tb = document.querySelector("#trips-table tbody");
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