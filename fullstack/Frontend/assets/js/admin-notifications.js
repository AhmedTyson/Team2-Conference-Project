/**
 * admin-notifications.js — System Broadcast & Notification Log.
 * Features: Search filtering, Client-side pagination, Formatted timestamps.
 */
(function(global) {
  'use strict';
  
  var It = global.Itinera;
  if (!It) return;

  var state = {
    allNotifs: [],
    filtered: [],
    search: '',
    page: 1,
    pageSize: 15
  };

  function el(id) { return document.getElementById(id); }

  function formatDate(isoStr) {
    if (!isoStr) return '–';
    var d = new Date(isoStr);
    return isNaN(d) ? isoStr : d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function applyFilter() {
    var q = state.search.trim().toLowerCase();

    state.filtered = state.allNotifs.filter(function (item) {
      if (!q) return true;
      return String(item.id).indexOf(q) !== -1 ||
        (item.user_id && String(item.user_id).toLowerCase().indexOf(q) !== -1) ||
        (item.title && item.title.toLowerCase().indexOf(q) !== -1) ||
        (item.message && item.message.toLowerCase().indexOf(q) !== -1);
    });

    state.page = 1;
    renderNotifications();
  }

  function renderPager() {
    var existingPager = document.getElementById("notifs-pager");
    if (existingPager) existingPager.remove();

    var total = state.filtered.length;
    var totalPages = Math.ceil(total / state.pageSize) || 1;

    var pager = document.createElement("div");
    pager.id = "notifs-pager";
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
    info.textContent = "Showing " + startIdx + "–" + endIdx + " of " + total + " notifications";

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
        renderNotifications();
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
        renderNotifications();
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

  function renderNotifications() {
    var tbody = el('admin-notifications-tbody');
    if (!tbody) return;

    if (!state.filtered || !state.filtered.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2.5rem; color: hsl(var(--muted-foreground));">No notifications found matching your search.</td></tr>';
      renderPager();
      return;
    }

    var start = (state.page - 1) * state.pageSize;
    var pageItems = state.filtered.slice(start, start + state.pageSize);

    tbody.innerHTML = pageItems.map(function(item) {
      return '<tr>' +
        '<td><span class="badge badge-warn">#' + item.id + '</span></td>' +
        '<td><strong>USR-' + item.user_id + '</strong></td>' +
        '<td><strong>' + It.app.esc(item.title || 'System Notification') + '</strong></td>' +
        '<td>' + It.app.esc(item.message || '–') + '</td>' +
        '<td style="font-size:0.85rem; color:hsl(var(--muted-foreground));">' + formatDate(item.created_at) + '</td>' +
      '</tr>';
    }).join('');

    renderPager();
  }

  function fetchAdminNotifications() {
    var tbody = el('admin-notifications-tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Loading logs...</td></tr>';

    It.apiGet('/admin/notifications', { auth: true })
      .then(function(res) {
        state.allNotifs = It.unwrapData(res) || [];
        applyFilter();
      })
      .catch(function() {
        var tbody = el('admin-notifications-tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: hsl(var(--destructive));">Error loading logs.</td></tr>';
        It.app.showToast('Failed to fetch admin notifications', 'error');
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

    fetchAdminNotifications();
  }

  document.addEventListener("itinera:ready", boot);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window);
