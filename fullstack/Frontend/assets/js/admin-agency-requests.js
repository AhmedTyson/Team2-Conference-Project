/**
 * admin-agency-requests.js — Admin review queue for pending Agency requests.
 * List from GET /admin/agency-requests; approve assigns an agency user
 * via POST /admin/agency-requests/{id}/approve.
 */
(function (global) {
  "use strict";

  const It = global.Itinari;
  if (!It) return;

  var state = {
    allRows: [],
    filtered: [],
    search: '',
    statusFilter: '',
    page: 1,
    pageSize: 15
  };

  let agencyUsers = [];

  function el(id) { return document.getElementById(id); }

  function loadAgencyUsers() {
    return It.apiGet("/admin/users", { auth: true }).then(function (res) {
      const rows = It.unwrapData(res) || [];
      agencyUsers = (Array.isArray(rows) ? rows : []).filter(function (u) {
        if (!u) return false;
        const r = (u.roles && u.roles[0] && u.roles[0].name) || u.role || "";
        return r.includes("agency") || (Array.isArray(u.roles) && u.roles.indexOf("agency") !== -1);
      });
    }).catch(function () {
      agencyUsers = [];
    });
  }

  function agencySelect(requestId) {
    const select = document.createElement("select");
    select.className = "ctl-select";
    select.setAttribute("aria-label", "Choose agency");
    select.style.minWidth = "160px";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = agencyUsers.length ? "Choose agency…" : "No agency users found";
    select.appendChild(placeholder);

    agencyUsers.forEach(function (u) {
      const opt = document.createElement("option");
      opt.value = u.id;
      opt.textContent = u.name || u.email;
      select.appendChild(opt);
    });

    return select;
  }

  function approve(requestId, select) {
    const agencyUserId = select.value;
    if (!agencyUserId) {
      It.feedback.banner("Choose an agency first.", "is-error");
      return;
    }
    It.apiPost("/admin/agency-requests/" + requestId + "/approve", { agency_user_id: Number(agencyUserId) }, { auth: true })
      .then(function () {
        It.feedback.banner("Request assigned to agency.", "is-ok");
        load();
      })
      .catch(function (err) {
        const msg = (err && err.message) || "Could not assign agency — check the user has the agency role.";
        It.feedback.banner(msg, "is-error");
      });
  }

  function applyFilter() {
    var q = state.search.trim().toLowerCase();
    var sf = state.statusFilter;

    state.filtered = state.allRows.filter(function (r) {
      var customerText = (r.customer ? (r.customer.name || r.customer.email) : ("Customer #" + r.customer_id)).toLowerCase();
      var budgetText = (r.budget_level || "").toLowerCase();
      var idText = String(r.id);

      var matchQ = !q || customerText.indexOf(q) !== -1 || budgetText.indexOf(q) !== -1 || idText.indexOf(q) !== -1;
      
      var isAssigned = !!r.agency_id || (r.status && r.status.toLowerCase() === 'assigned');
      var status = isAssigned ? 'assigned' : 'pending';
      var matchStatus = !sf || status === sf.toLowerCase();

      return matchQ && matchStatus;
    });

    state.page = 1;
    renderTable();
  }

  function renderPager() {
    var existingPager = document.getElementById("agency-requests-pager");
    if (existingPager) existingPager.remove();

    var total = state.filtered.length;
    var totalPages = Math.ceil(total / state.pageSize) || 1;

    var pager = document.createElement("div");
    pager.id = "agency-requests-pager";
    pager.className = "table-controls";
    pager.style.display = "flex";
    pager.style.justifyContent = "space-between";
    pager.style.alignItems = "center";
    pager.style.padding = "var(--space-3) var(--space-4)";
    pager.style.borderTop = "1px solid hsl(var(--border) / 0.6)";

    var info = document.createElement("div");
    info.className = "pager-info";
    var startIdx = total === 0 ? 0 : (state.page - 1) * state.pageSize + 1;
    var endIdx = Math.min(state.page * state.pageSize, total);
    info.textContent = "Showing " + startIdx + "–" + endIdx + " of " + total + " requests";

    var btnGroup = document.createElement("div");
    btnGroup.className = "pager-group";
    btnGroup.style.display = "flex";
    btnGroup.style.gap = "0.5rem";

    var prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "btn-sm btn-ghost";
    prevBtn.textContent = "← Prev";
    prevBtn.disabled = state.page <= 1;
    prevBtn.addEventListener("click", function () {
      if (state.page > 1) {
        state.page--;
        renderTable();
      }
    });

    var pageIndicator = document.createElement("span");
    pageIndicator.style.display = "inline-flex";
    pageIndicator.style.alignItems = "center";
    pageIndicator.style.padding = "0 0.5rem";
    pageIndicator.style.fontSize = "0.85rem";
    pageIndicator.textContent = "Page " + state.page + " of " + totalPages;

    var nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "btn-sm btn-ghost";
    nextBtn.textContent = "Next →";
    nextBtn.disabled = state.page >= totalPages;
    nextBtn.addEventListener("click", function () {
      if (state.page < totalPages) {
        state.page++;
        renderTable();
      }
    });

    btnGroup.appendChild(prevBtn);
    btnGroup.appendChild(pageIndicator);
    btnGroup.appendChild(nextBtn);

    pager.appendChild(info);
    pager.appendChild(btnGroup);

    var card = document.querySelector(".ticket-panel");
    if (card) card.appendChild(pager);
  }

  function renderTable() {
    const host = el("agency-requests-table");
    if (!host) return;

    if (!state.filtered || !state.filtered.length) {
      host.innerHTML = '<div class="kit-empty" style="padding:2.5rem; text-align:center; color:hsl(var(--muted-foreground));">No agency requests found matching your filter.</div>';
      renderPager();
      return;
    }

    const table = document.createElement("table");
    table.className = "kit-table";
    table.innerHTML =
      "<thead><tr><th>ID</th><th>Customer</th><th>Budget level</th><th>Requested</th><th>Assign Action</th></tr></thead>";

    const tbody = document.createElement("tbody");
    
    var start = (state.page - 1) * state.pageSize;
    var pageItems = state.filtered.slice(start, start + state.pageSize);

    pageItems.forEach(function (r) {
      const tr = document.createElement("tr");
      tr.innerHTML =
        "<td><strong>#" + r.id + "</strong></td>" +
        "<td>" + (r.customer ? (r.customer.name || r.customer.email) : "Customer #" + r.customer_id) + "</td>" +
        "<td><span class=\"badge badge-warn\">" + (r.budget_level || "\u2014") + "</span></td>" +
        "<td style=\"font-size:0.85rem; color:hsl(var(--muted-foreground));\">" + (r.created_at ? new Date(r.created_at).toLocaleDateString() : "\u2014") + "</td>";

      const actionTd = document.createElement("td");
      if (r.agency_id) {
        actionTd.innerHTML = '<span class="badge badge-ok">Assigned to Agency #' + r.agency_id + '</span>';
      } else {
        const select = agencySelect(r.id);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn-sm btn-primary";
        btn.textContent = "Approve";
        btn.style.marginInlineStart = "0.5rem";
        btn.addEventListener("click", function () { approve(r.id, select); });

        actionTd.appendChild(select);
        actionTd.appendChild(btn);
      }
      tr.appendChild(actionTd);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    host.innerHTML = "";
    host.appendChild(table);
    renderPager();
  }

  function load() {
    const host = el("agency-requests-table");
    if (host) host.innerHTML = '<div class="skeleton-rect" style="height: 60px; margin-bottom: 0.5rem;"></div><div class="skeleton-rect" style="height: 60px;"></div>';

    Promise.all([loadAgencyUsers(), It.apiGet("/admin/agency-requests", { auth: true })])
      .then(function (res) {
        const apiRes = res[1];
        state.allRows = It.unwrapData(apiRes) || [];
        applyFilter();
      })
      .catch(function () {
        It.feedback.banner("Could not load agency requests.", "is-error");
        if (host) host.innerHTML = '<div class="kit-error" style="padding:1.5rem; text-align:center;">Could not load agency requests.</div>';
      });
  }

  var isBooted = false;
  function init() {
    if (isBooted) return;
    isBooted = true;

    var searchInput = document.getElementById("global-search");
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        state.search = searchInput.value;
        applyFilter();
      });
    }

    var statusFilter = document.getElementById("status-filter");
    if (statusFilter) {
      statusFilter.addEventListener("change", function () {
        state.statusFilter = statusFilter.value;
        applyFilter();
      });
    }

    load();
  }

  document.addEventListener("itinari:ready", init);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
