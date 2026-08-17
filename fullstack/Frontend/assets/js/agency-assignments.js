/**
 * agency-assignments.js — Agency partners: assigned customers hub.
 * Users-page style table of customers assigned to the logged-in agency.
 * Data: GET /agency/assignments (scoped to the agency user).
 * Actions: Chat (deep-link into the customer AI Concierge) + Plan Trip
 * (auto-accepts an admin-approved assignment, then opens the trip planner).
 */
(function (global) {
  "use strict";

  const It = global.Itinari;

  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function fmtDate(v) {
    if (!v) return "–";
    const d = new Date(v);
    return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString();
  }

  const STATUS_LABEL = {
    requested: "Requested",
    admin_approved: "Ready",
    agency_approved: "Accepted",
    agency_declined: "Declined",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  const STATUS_CLASS = {
    requested: "badge-off",
    admin_approved: "badge-warn",
    agency_approved: "badge-ok",
    agency_declined: "badge-danger",
    completed: "badge-ok",
    cancelled: "badge-off",
  };

  const COLS = ["ID", "Name", "Email", "Status", "Created"];
  const SOFT_KEYS = { Name: "name", Email: "email" };
  const PER_PAGE_DEFAULT = 25;
  const PAGE_SIZE_OPTIONS = [15, 25, 50, 100];

  const state = {
    rows: [],
    q: "",
    page: 1,
    sort: null,
    dir: "asc",
    pageSize: PER_PAGE_DEFAULT,
  };

  let searchTimer = null;

  /* ---------- sorting / filtering ---------- */

  function cellValue(row, label) {
    const c = row.customer || {};
    if (label === "ID") return row.id;
    if (label === "Name") return c.name || c.email || "";
    if (label === "Email") return c.email || "";
    if (label === "Status") return row.status || "requested";
    if (label === "Created") return row.created_at || "";
    return "";
  }

  function compare(a, b) {
    const av = cellValue(a, state.sort);
    const bv = cellValue(b, state.sort);
    const an = typeof av === "number";
    let cmp = 0;
    if (an && typeof bv === "number") cmp = av - bv;
    else cmp = String(av ?? "").localeCompare(String(bv ?? ""));
    return state.dir === "desc" ? -cmp : cmp;
  }

  function matches(row) {
    const q = state.q.toLowerCase().trim();
    if (!q) return true;
    const c = row.customer || {};
    return (
      String(row.id).toLowerCase().includes(q) ||
      String(c.name || "").toLowerCase().includes(q) ||
      String(c.email || "").toLowerCase().includes(q) ||
      String(STATUS_LABEL[row.status] || row.status || "").toLowerCase().includes(q)
    );
  }

  /* ---------- actions ---------- */

  function planTrip(assignment) {
    const status = assignment.status || "requested";
    if (status === "admin_approved") {
      It.apiPost("/agency/assignments/" + assignment.id + "/approve", {}, { auth: true })
        .then(function () {
          if (It.feedback && It.feedback.banner) {
            It.feedback.banner("Assignment accepted — opening trip planner.", "is-ok");
          }
          window.location.href = "create-trip.html?assignment_id=" + assignment.id;
        })
        .catch(function (err) {
          const msg = (err && err.message) || "Could not accept the assignment.";
          if (It.feedback && It.feedback.banner) It.feedback.banner(msg, "is-error");
        });
      return;
    }
    window.location.href = "create-trip.html?assignment_id=" + assignment.id;
  }

  function actionCell(row) {
    const cell = document.createElement("td");
    cell.className = "td-actions";
    cell.dataset.label = "Actions";

    const chat = document.createElement("a");
    chat.href = "../app/chat.html?assignment_id=" + row.id + "&customer_id=" + (row.customer ? row.customer.id : row.customer_id);
    chat.className = "btn-icon btn-ghost btn-sm";
    chat.title = "Chat with " + ((row.customer && row.customer.name) || ("customer #" + row.id));
    chat.setAttribute("aria-label", "Chat with customer");
    chat.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    cell.appendChild(chat);

    const status = row.status || "requested";
    const canPlan = status === "admin_approved" || status === "agency_approved";
    if (canPlan) {
      const plan = document.createElement("button");
      plan.type = "button";
      plan.className = "btn btn-primary btn-sm";
      plan.textContent = "Plan Trip";
      plan.style.marginInlineStart = "0.5rem";
      plan.setAttribute("aria-label", "Plan trip for " + ((row.customer && row.customer.name) || ("customer #" + row.id)));
      if (status === "admin_approved") {
        plan.title = "Accept the assignment and open the trip planner";
      } else {
        plan.title = "Open the trip planner";
      }
      plan.addEventListener("click", function () { planTrip(row); });
      cell.appendChild(plan);
    } else {
      const plan = document.createElement("button");
      plan.type = "button";
      plan.className = "btn btn-primary btn-sm";
      plan.textContent = "Plan Trip";
      plan.disabled = true;
      plan.style.marginInlineStart = "0.5rem";
      plan.title =
        status === "requested" ? "Waiting for admin approval"
        : status === "agency_declined" || status === "cancelled" ? "Assignment is closed"
        : "Trip already completed";
      cell.appendChild(plan);
    }

    return cell;
  }

  /* ---------- rendering ---------- */

  function sortHeader(th, label) {
    th.classList.add("sortable");
    if (state.sort === label) th.classList.add(state.dir === "asc" ? "sort-asc" : "sort-desc");
    if (state.sort === label) th.setAttribute("aria-sort", state.dir === "asc" ? "ascending" : "descending");
    else th.removeAttribute("aria-sort");
    const tip = document.createElement("span");
    tip.className = "th-sort";
    tip.innerHTML =
      '<svg class="arrow-up" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="m18 15-6-6-6 6"/></svg>' +
      '<svg class="arrow-down" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>';
    th.appendChild(tip);
    th.addEventListener("click", function () {
      if (state.sort === label && state.dir === "asc") state.dir = "desc";
      else if (state.sort === label && state.dir === "desc") { state.sort = null; state.dir = "asc"; }
      else { state.sort = label; state.dir = "asc"; }
      renderTable();
    });
  }

  function pageSizeSelect() {
    const sel = document.createElement("select");
    sel.className = "ctl-select";
    sel.setAttribute("aria-label", "Rows per page");
    PAGE_SIZE_OPTIONS.forEach(function (n) {
      const o = document.createElement("option");
      o.value = String(n);
      o.textContent = n + " rows / page";
      sel.appendChild(o);
    });
    sel.value = String(state.pageSize);
    sel.addEventListener("change", function () {
      state.pageSize = Number(sel.value);
      state.page = 1;
      renderTable();
    });
    return sel;
  }

  function renderEmpty(host) {
    const div = document.createElement("div");
    div.className = "kit-empty";
    div.innerHTML =
      '<span class="kit-empty-icon">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg></span>' +
      '<p class="kit-empty-title">' + (state.q ? "No matches" : "No assigned customers yet.") + "</p>" +
      '<p class="kit-empty-hint">' +
      (state.q
        ? 'Nothing matched &ldquo;' + esc(state.q) + '&rdquo;. Try a different term or clear the search.'
        : "Customers are routed to you after an admin approves their agency request.") +
      "</p>";
    host.appendChild(div);
  }

  function renderPagination(host, total) {
    const pages = Math.max(1, Math.ceil(total / state.pageSize));
    if (pages <= 1) return;
    const foot = document.createElement("div");
    foot.className = "kit-pagination";
    const from = (state.page - 1) * state.pageSize + 1;
    const to = Math.min(total, state.page * state.pageSize);
    const info = document.createElement("span");
    info.textContent = "Showing " + from + "–" + to + " of " + total + " assignments";
    const group = document.createElement("div");
    group.className = "pager-group";
    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "pager-btn";
    prev.textContent = "Prev";
    prev.disabled = state.page <= 1;
    prev.addEventListener("click", function () { state.page--; renderTable(); });

    const numbers = document.createElement("div");
    numbers.className = "pager-numbers";
    numbers.setAttribute("role", "group");
    numbers.setAttribute("aria-label", "Pagination");
    for (let p = 1; p <= pages; p++) {
      const num = document.createElement("button");
      num.type = "button";
      num.className = "pager-btn" + (p === state.page ? " is-current" : "");
      num.textContent = String(p);
      num.setAttribute("aria-label", "Page " + p);
      if (p === state.page) num.setAttribute("aria-current", "page");
      num.addEventListener("click", function () { state.page = p; renderTable(); });
      numbers.appendChild(num);
    }

    const next = document.createElement("button");
    next.type = "button";
    next.className = "pager-btn";
    next.textContent = "Next";
    next.disabled = state.page >= pages;
    next.addEventListener("click", function () { state.page++; renderTable(); });
    group.appendChild(prev);
    group.appendChild(numbers);
    group.appendChild(next);
    foot.appendChild(info);
    foot.appendChild(pageSizeSelect());
    foot.appendChild(group);
    host.appendChild(foot);
  }

  function renderTable() {
    const host = el("assignments-table");
    if (!host) return;
    host.textContent = "";

    let rows = state.rows.filter(matches);
    if (state.sort) rows = rows.slice().sort(compare);
    const total = rows.length;
    const clipped = Math.min(state.page, Math.max(1, Math.ceil(total / state.pageSize)));
    if (clipped !== state.page) state.page = clipped;
    const pageRows = rows.slice((state.page - 1) * state.pageSize, state.page * state.pageSize);

    if (!pageRows.length) {
      renderEmpty(host);
      return;
    }

    const bar = document.createElement("div");
    bar.className = "table-toolbar";
    const count = document.createElement("span");
    count.style.opacity = "0.65";
    count.style.fontSize = "0.85rem";
    count.textContent = total + " assignment" + (total === 1 ? "" : "s");
    bar.appendChild(count);
    bar.appendChild(pageSizeSelect());
    host.appendChild(bar);

    const scroll = document.createElement("div");
    scroll.className = "table-scroll";

    const table = document.createElement("table");
    table.className = "kit-table";
    const thead = document.createElement("thead");
    const htr = document.createElement("tr");
    COLS.forEach(function (label) {
      const th = document.createElement("th");
      th.textContent = label;
      sortHeader(th, label);
      htr.appendChild(th);
    });
    const actionsTh = document.createElement("th");
    actionsTh.textContent = "Actions";
    htr.appendChild(actionsTh);
    thead.appendChild(htr);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    pageRows.forEach(function (row) {
      const tr = document.createElement("tr");
      tr.dataset.rowId = String(row.id);
      const c = row.customer || {};

      const idTd = document.createElement("td");
      idTd.textContent = String(row.id);
      tr.appendChild(idTd);

      const nameTd = document.createElement("td");
      nameTd.textContent = c.name || c.email || ("Customer #" + (row.customer_id || row.id));
      tr.appendChild(nameTd);

      const emailTd = document.createElement("td");
      emailTd.textContent = c.email || "–";
      tr.appendChild(emailTd);

      const status = row.status || "requested";
      const statusTd = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = "badge " + (STATUS_CLASS[status] || "badge-off");
      badge.textContent = STATUS_LABEL[status] || status;
      statusTd.appendChild(badge);
      tr.appendChild(statusTd);

      const createdTd = document.createElement("td");
      createdTd.textContent = fmtDate(row.created_at);
      tr.appendChild(createdTd);

      tr.appendChild(actionCell(row));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    scroll.appendChild(table);
    host.appendChild(scroll);

    renderPagination(host, total);
  }

  /* ---------- data ---------- */

  function load() {
    const host = el("assignments-table");
    if (host) {
      host.textContent = "";
      host.innerHTML =
        '<div class="kit-grid-skeleton"><div class="box skeleton"></div><div class="box skeleton"></div><div class="box skeleton"></div></div>';
    }
    It.apiGet("/agency/assignments", { auth: true })
      .then(function (res) {
        let rows = [];
        if (res && res.ok && res.body) {
          if (Array.isArray(res.body.data)) rows = res.body.data;
          else if (Array.isArray(res.body.data && res.body.data.data)) rows = res.body.data.data;
          else if (Array.isArray(res.body)) rows = res.body;
        } else if (res && Array.isArray(res)) {
          rows = res;
        }
        state.rows = rows;
        state.page = 1;
        renderTable();
      })
      .catch(function () {
        if (It.feedback && It.feedback.banner) {
          It.feedback.banner("Could not load assignments.", "is-error");
        }
      });
  }

  /* ---------- boot ---------- */

  let isBooted = false;
  function init() {
    if (isBooted) return;
    isBooted = true;

    const searchInput = el("global-search");
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        if (searchTimer) global.clearTimeout(searchTimer);
        searchTimer = global.setTimeout(function () {
          state.q = searchInput.value || "";
          state.page = 1;
          renderTable();
        }, 150);
      });
    }

    load();
  }

  global.document.addEventListener("itinari:ready", init);

  if (global.document.readyState === "loading") {
    global.document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);