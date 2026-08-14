/**
 * admin-flags.js — Moderation Flags & User Reports against agencies.
 * Features: Live search, Status filtering, Pagination, Approve/Decline actions.
 */
(function(global) {
  'use strict';
  
  var It = global.Itinari;
  if (!It) return;

  var state = {
    allFlags: [],
    filtered: [],
    search: '',
    statusFilter: '',
    page: 1,
    pageSize: 15
  };

  function el(id) { return document.getElementById(id); }

  function applyFilter() {
    var q = state.search.trim().toLowerCase();
    var sf = state.statusFilter;

    state.filtered = state.allFlags.filter(function (item) {
      var matchQ = !q || 
        String(item.id).indexOf(q) !== -1 ||
        (item.reason && item.reason.toLowerCase().indexOf(q) !== -1) ||
        (item.agency_id && String(item.agency_id).toLowerCase().indexOf(q) !== -1) ||
        (item.user_id && String(item.user_id).toLowerCase().indexOf(q) !== -1);
      
      var s = (item.status || 'pending').toLowerCase();
      var matchStatus = !sf || s === sf.toLowerCase();
      return matchQ && matchStatus;
    });

    state.page = 1;
    renderFlags();
  }

  function renderPager() {
    var existingPager = document.getElementById("flags-pager");
    if (existingPager) existingPager.remove();

    var total = state.filtered.length;
    var totalPages = Math.ceil(total / state.pageSize) || 1;

    var pager = document.createElement("div");
    pager.id = "flags-pager";
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
    info.textContent = "Showing " + startIdx + "–" + endIdx + " of " + total + " reports";

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
        renderFlags();
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
        renderFlags();
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

  function renderFlags() {
    var tbody = el('admin-flags-tbody');
    if (!tbody) return;

    if (!state.filtered || !state.filtered.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: hsl(var(--muted-foreground));">No reports found matching your search.</td></tr>';
      renderPager();
      return;
    }

    var start = (state.page - 1) * state.pageSize;
    var pageItems = state.filtered.slice(start, start + state.pageSize);

    tbody.innerHTML = pageItems.map(function(item) {
      var status = (item.status || 'pending').toLowerCase();
      var badgeCls = status === 'approved' ? 'badge-ok' : (status === 'declined' ? 'badge-danger' : 'badge-warn');
      var statusBadge = '<span class="badge ' + badgeCls + '">' + status.toUpperCase() + '</span>';
      
      var actions = '';
      if (status === 'pending') {
        actions = '<div class="action-btns" style="display:flex; gap:0.4rem;">' +
          '<button type="button" class="btn-sm btn-primary flag-action" data-id="' + item.id + '" data-action="approve">Approve</button>' +
          '<button type="button" class="btn-sm btn-ghost flag-action" data-id="' + item.id + '" data-action="decline" style="color:hsl(var(--destructive));">Decline</button>' +
          '</div>';
      } else {
        actions = '<span style="color:hsl(var(--muted-foreground)); font-size:0.85rem; font-style:italic;">Actioned</span>';
      }

      return '<tr>' +
        '<td><strong>#' + item.id + '</strong></td>' +
        '<td>' + (item.agency ? (item.agency.name || ('AGN-' + item.agency.id)) : ('AGN-' + (item.agency_id || 'Unknown'))) + '</td>' +
        '<td>' + (item.user ? (item.user.name || ('USR-' + item.user.id)) : ('USR-' + (item.user_id || 'Unknown'))) + '</td>' +
        '<td>' + It.app.esc(item.reason || '–') + '</td>' +
        '<td>' + statusBadge + '</td>' +
        '<td>' + actions + '</td>' +
      '</tr>';
    }).join('');

    bindActions();
    renderPager();
  }

  function bindActions() {
    var btns = document.querySelectorAll('.flag-action');
    btns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = this.getAttribute('data-id');
        var action = this.getAttribute('data-action');
        processFlag(id, action);
      });
    });
  }

  function processFlag(id, action) {
    if (!confirm('Are you sure you want to ' + action + ' this report?')) return;
    
    It.apiPost('/admin/flags/' + id + '/' + action, null, { auth: true })
      .then(function(res) {
        if (res.ok) {
          It.app.showToast('Report successfully ' + action + 'd', 'success');
          fetchFlags();
        } else {
          It.app.showToast((res.body && res.body.message) || 'Action failed.', 'error');
        }
      })
      .catch(function() {
        It.app.showToast('Failed to process report', 'error');
      });
  }

  function fetchFlags() {
    var tbody = el('admin-flags-tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Loading reports...</td></tr>';

    It.apiGet('/admin/flags', { auth: true })
      .then(function(res) {
        state.allFlags = It.unwrapData(res) || [];
        applyFilter();
      })
      .catch(function() {
        var tbody = el('admin-flags-tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: hsl(var(--destructive));">Error loading reports.</td></tr>';
        It.app.showToast('Failed to fetch admin flags', 'error');
      });
  }

  var isBooted = false;
  function boot() {
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

    fetchFlags();
  }

  document.addEventListener("itinari:ready", boot);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window);
