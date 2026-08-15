/**
 * admin-consumer-reports.js — Admin Consumer Reports Management.
 * Features: Real API integration with AdminFlagController (/api/admin/flags),
 *           Live search, Status filtering, Client-side pagination,
 *           Detailed Modal viewer, Approve/Decline actions, CSV export.
 */
(function (global) {
  'use strict';

  var It = global.Itinari;
  if (!It) return;

  var state = {
    allReports: [],
    filteredReports: [],
    search: '',
    statusFilter: '',
    page: 1,
    pageSize: 10,
    loading: false,
    error: false,
    activeReport: null
  };

  function el(id) {
    return document.getElementById(id);
  }

  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(dateStr) {
    if (!dateStr) return '–';
    try {
      var d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  }

  function formatEntityName(type) {
    if (!type) return 'N/A';
    var clean = type.split('\\').pop();
    return clean.replace(/([A-Z])/g, ' $1').trim();
  }

  function fetchReports() {
    state.loading = true;
    state.error = false;
    renderLoadingState();

    It.apiGet('/admin/flags', { auth: true })
      .then(function (res) {
        state.loading = false;
        if (res.ok) {
          state.allReports = It.unwrapData(res) || [];
          applyFilters();
        } else {
          state.error = true;
          renderErrorState(res.body && res.body.message ? res.body.message : 'Unable to load consumer reports.');
        }
      })
      .catch(function (err) {
        state.loading = false;
        state.error = true;
        renderErrorState('Network error: Unable to connect to server.');
      });
  }

  function applyFilters() {
    var q = state.search.trim().toLowerCase();
    var sf = state.statusFilter.trim().toLowerCase();

    state.filteredReports = state.allReports.filter(function (item) {
      var idStr = String(item.id || '');
      var reason = (item.reason || '').toLowerCase();
      var details = (item.details || '').toLowerCase();
      var reporterName = (item.reporter && item.reporter.name ? item.reporter.name : '').toLowerCase();
      var reporterEmail = (item.reporter && item.reporter.email ? item.reporter.email : '').toLowerCase();
      var entityType = (item.flaggable_type || '').toLowerCase();
      var assignId = String(item.agency_assignment_id || '');
      var status = (item.status || 'pending').toLowerCase();

      var matchSearch = !q ||
        idStr.indexOf(q) !== -1 ||
        reason.indexOf(q) !== -1 ||
        details.indexOf(q) !== -1 ||
        reporterName.indexOf(q) !== -1 ||
        reporterEmail.indexOf(q) !== -1 ||
        entityType.indexOf(q) !== -1 ||
        assignId.indexOf(q) !== -1 ||
        status.indexOf(q) !== -1;

      var matchStatus = !sf || status === sf;

      return matchSearch && matchStatus;
    });

    state.page = 1;
    renderReports();
  }

  function renderLoadingState() {
    var tbody = el('consumer-reports-tbody') || el('admin-flags-tbody');
    if (!tbody) return;
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align: center; padding: 2.5rem 1rem;">' +
        '<div style="display:inline-flex; align-items:center; gap:0.75rem; color:hsl(var(--muted-foreground)); font-size:0.95rem;">' +
          '<span>Loading consumer reports from backend...</span>' +
        '</div>' +
      '</td></tr>';
  }

  function renderErrorState(msg) {
    var tbody = el('consumer-reports-tbody') || el('admin-flags-tbody');
    if (!tbody) return;
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align: center; padding: 3rem 1rem;">' +
        '<div style="max-width: 420px; margin: 0 auto;">' +
          '<div style="font-size:2rem; margin-bottom:0.5rem; color:hsl(var(--destructive));">⚠️</div>' +
          '<h3 style="margin:0 0 0.5rem 0; font-size:1.1rem; color:hsl(var(--foreground));">Failed to load reports</h3>' +
          '<p style="margin:0 0 1rem 0; font-size:0.875rem; color:hsl(var(--muted-foreground));">' + esc(msg) + '</p>' +
          '<button type="button" id="btn-retry-fetch" class="btn btn-primary btn-sm">' +
            '<span>🔄 Retry Loading</span>' +
          '</button>' +
        '</div>' +
      '</td></tr>';

    var retryBtn = el('btn-retry-fetch');
    if (retryBtn) {
      retryBtn.addEventListener('click', function () {
        fetchReports();
      });
    }

    renderPager();
  }

  function renderReports() {
    var tbody = el('consumer-reports-tbody') || el('admin-flags-tbody');
    if (!tbody) return;

    if (state.loading || state.error) return;

    if (!state.filteredReports || !state.filteredReports.length) {
      var isFiltered = state.search || state.statusFilter;
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align: center; padding: 3rem 1rem; color: hsl(var(--muted-foreground));">' +
          '<div style="font-size:1.75rem; margin-bottom:0.5rem;">📋</div>' +
          '<p style="margin:0 0 0.35rem 0; font-weight:600; font-size:1rem; color:hsl(var(--foreground));">' +
            (isFiltered ? 'No reports match your search criteria' : 'No consumer reports found') +
          '</p>' +
          '<p style="margin:0; font-size:0.85rem;">' +
            (isFiltered ? 'Try clearing your search or changing status filter.' : 'Consumer reports will appear here when users submit flags.') +
          '</p>' +
        '</td></tr>';
      renderPager();
      return;
    }

    var start = (state.page - 1) * state.pageSize;
    var pageItems = state.filteredReports.slice(start, start + state.pageSize);

    tbody.innerHTML = pageItems.map(function (item) {
      var status = (item.status || 'pending').toLowerCase();
      var badgeCls = status === 'approved' ? 'badge-ok' : (status === 'declined' ? 'badge-danger' : 'badge-warn');
      var statusBadge = '<span class="badge ' + badgeCls + '">' + esc(status.toUpperCase()) + '</span>';

      var consumerName = item.reporter ? esc(item.reporter.name || item.reporter.email) : 'User #' + esc(item.reporter_id || 'N/A');
      var consumerSub = item.reporter && item.reporter.email ? '<div style="font-size:0.75rem; color:hsl(var(--muted-foreground));">' + esc(item.reporter.email) + '</div>' : '';

      var targetInfo = esc(formatEntityName(item.flaggable_type));
      if (item.agency_assignment_id) {
        targetInfo += ' <span style="font-size:0.75rem; opacity:0.8;">(Assignment #' + esc(item.agency_assignment_id) + ')</span>';
      }

      var reasonText = esc(item.reason || '–');
      var dateText = formatDate(item.created_at);

      var actionsHtml =
        '<div class="action-btns" style="display:flex; gap:0.35rem; align-items:center;">' +
          '<button type="button" class="btn-sm btn-ghost view-report-btn" data-id="' + item.id + '" title="View report details">View</button>';

      if (status === 'pending') {
        actionsHtml +=
          '<button type="button" class="btn-sm btn-primary action-approve-btn" data-id="' + item.id + '">Approve</button>' +
          '<button type="button" class="btn-sm btn-ghost action-decline-btn" data-id="' + item.id + '" style="color:hsl(var(--destructive));">Decline</button>';
      }

      actionsHtml += '</div>';

      return '<tr>' +
        '<td><strong>#' + item.id + '</strong></td>' +
        '<td><div><strong>' + consumerName + '</strong></div>' + consumerSub + '</td>' +
        '<td>' + targetInfo + '</td>' +
        '<td><div style="max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="' + reasonText + '">' + reasonText + '</div></td>' +
        '<td>' + statusBadge + '</td>' +
        '<td style="white-space:nowrap; font-size:0.8rem; color:hsl(var(--muted-foreground));">' + dateText + '</td>' +
        '<td>' + actionsHtml + '</td>' +
      '</tr>';
    }).join('');

    bindRowActions();
    renderPager();
  }

  function renderPager() {
    var existingPager = el('reports-pager');
    if (existingPager) existingPager.remove();

    var total = state.filteredReports.length;
    if (state.loading || state.error) return;

    var totalPages = Math.ceil(total / state.pageSize) || 1;

    var pager = document.createElement('div');
    pager.id = 'reports-pager';
    pager.className = 'table-controls';
    pager.style.display = 'flex';
    pager.style.justifyContent = 'space-between';
    pager.style.alignItems = 'center';
    pager.style.padding = 'var(--space-3) var(--space-4)';
    pager.style.borderTop = '1px solid hsl(var(--border) / 0.6)';

    var info = document.createElement('div');
    info.className = 'pager-info';
    info.style.fontSize = '0.85rem';
    info.style.color = 'hsl(var(--muted-foreground))';
    var startIdx = total === 0 ? 0 : (state.page - 1) * state.pageSize + 1;
    var endIdx = Math.min(state.page * state.pageSize, total);
    info.textContent = 'Showing ' + startIdx + '–' + endIdx + ' of ' + total + ' consumer reports';

    var btnGroup = document.createElement('div');
    btnGroup.className = 'pager-group';
    btnGroup.style.display = 'flex';
    btnGroup.style.alignItems = 'center';
    btnGroup.style.gap = '0.5rem';

    var prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'btn-sm btn-ghost';
    prevBtn.textContent = '← Prev';
    prevBtn.disabled = state.page <= 1;
    prevBtn.addEventListener('click', function () {
      if (state.page > 1) {
        state.page--;
        renderReports();
      }
    });

    var pageIndicator = document.createElement('span');
    pageIndicator.style.display = 'inline-flex';
    pageIndicator.style.alignItems = 'center';
    pageIndicator.style.padding = '0 0.5rem';
    pageIndicator.style.fontSize = '0.85rem';
    pageIndicator.style.fontFamily = 'var(--font-mono, monospace)';
    pageIndicator.textContent = 'Page ' + state.page + ' of ' + totalPages;

    var nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'btn-sm btn-ghost';
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = state.page >= totalPages;
    nextBtn.addEventListener('click', function () {
      if (state.page < totalPages) {
        state.page++;
        renderReports();
      }
    });

    btnGroup.appendChild(prevBtn);
    btnGroup.appendChild(pageIndicator);
    btnGroup.appendChild(nextBtn);

    pager.appendChild(info);
    pager.appendChild(btnGroup);

    var card = document.querySelector('.ticket-panel');
    if (card) card.appendChild(pager);
  }

  function bindRowActions() {
    var viewBtns = document.querySelectorAll('.view-report-btn');
    viewBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-id');
        openReportDetails(id);
      });
    });

    var approveBtns = document.querySelectorAll('.action-approve-btn');
    approveBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-id');
        processFlag(id, 'approve', this);
      });
    });

    var declineBtns = document.querySelectorAll('.action-decline-btn');
    declineBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-id');
        processFlag(id, 'decline', this);
      });
    });
  }

  function processFlag(id, action, btnElement) {
    var verb = action === 'approve' ? 'approve' : 'decline';
    if (!confirm('Are you sure you want to ' + verb + ' consumer report #' + id + '?')) return;

    if (btnElement) {
      btnElement.disabled = true;
      btnElement.dataset.origHtml = btnElement.innerHTML;
      btnElement.innerHTML = 'Processing...';
    }

    It.apiPost('/admin/flags/' + id + '/' + action, null, { auth: true })
      .then(function (res) {
        if (res.ok) {
          if (It.feedback && It.feedback.banner) {
            It.feedback.banner('Consumer report #' + id + ' successfully ' + action + 'd.', 'is-ok');
          } else if (It.app && It.app.showToast) {
            It.app.showToast('Consumer report #' + id + ' successfully ' + action + 'd.', 'success');
          }
          closeModal();

          var updatedFlag = It.unwrapData(res);
          if (updatedFlag && updatedFlag.id) {
            var idx = state.allReports.findIndex(function (r) { return String(r.id) === String(updatedFlag.id); });
            if (idx !== -1) {
              state.allReports[idx] = updatedFlag;
            }
          }
          fetchReports();
        } else {
          if (btnElement) {
            btnElement.disabled = false;
            btnElement.innerHTML = btnElement.dataset.origHtml || (action === 'approve' ? 'Approve' : 'Decline');
          }
          var errMsg = (res.body && res.body.message) ? res.body.message : 'Action failed.';
          if (It.feedback && It.feedback.banner) {
            It.feedback.banner(errMsg, 'is-error');
          } else if (It.app && It.app.showToast) {
            It.app.showToast(errMsg, 'error');
          } else {
            alert(errMsg);
          }
        }
      })
      .catch(function () {
        if (btnElement) {
          btnElement.disabled = false;
          btnElement.innerHTML = btnElement.dataset.origHtml || (action === 'approve' ? 'Approve' : 'Decline');
        }
        if (It.feedback && It.feedback.banner) {
          It.feedback.banner('Network error while processing report.', 'is-error');
        } else {
          alert('Network error while processing report.');
        }
      });
  }

  function openReportDetails(id) {
    var report = state.allReports.find(function (r) {
      return String(r.id) === String(id);
    });
    if (!report) return;

    state.activeReport = report;

    var root = el('modal-root') || document.body;

    var status = (report.status || 'pending').toLowerCase();
    var badgeCls = status === 'approved' ? 'badge-ok' : (status === 'declined' ? 'badge-danger' : 'badge-warn');
    var statusBadge = '<span class="badge ' + badgeCls + '">' + esc(status.toUpperCase()) + '</span>';

    var backdrop = document.createElement('div');
    backdrop.className = 'kit-modal-backdrop';
    backdrop.id = 'report-detail-modal';

    var modal = document.createElement('div');
    modal.className = 'kit-modal is-medium';
    modal.style.background = 'hsl(var(--card))';
    modal.style.padding = '1.5rem';
    modal.style.borderRadius = '12px';
    modal.style.border = '1px solid hsl(var(--border))';

    var reporterInfo = report.reporter ? (
      '<div><strong>' + esc(report.reporter.name || 'N/A') + '</strong></div>' +
      '<div style="font-size:0.85rem; color:hsl(var(--muted-foreground));">Email: ' + esc(report.reporter.email || 'N/A') + '</div>'
    ) : 'User #' + esc(report.reporter_id || 'N/A');

    var modalContent =
      '<div class="kit-modal-head" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">' +
        '<div>' +
          '<h3 id="modal-report-title" style="margin:0;">Consumer Report #' + esc(report.id) + '</h3>' +
          '<div style="margin-top:0.25rem;">' + statusBadge + '</div>' +
        '</div>' +
        '<button type="button" class="kit-modal-close" id="modal-close-x" aria-label="Close">&times;</button>' +
      '</div>' +
      '<div class="kit-modal-body" style="display:flex; flex-direction:column; gap:1rem;">' +
        '<div class="report-meta-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; padding:0.75rem; background:hsl(var(--muted)/0.2); border-radius:var(--radius-md);">' +
          '<div>' +
            '<span style="font-size:0.75rem; text-transform:uppercase; color:hsl(var(--muted-foreground)); font-weight:600;">Consumer / Reporter</span>' +
            '<div style="margin-top:0.2rem;">' + reporterInfo + '</div>' +
          '</div>' +
          '<div>' +
            '<span style="font-size:0.75rem; text-transform:uppercase; color:hsl(var(--muted-foreground)); font-weight:600;">Reported Target</span>' +
            '<div style="margin-top:0.2rem;">' +
              '<div><strong>' + esc(formatEntityName(report.flaggable_type)) + '</strong></div>' +
              (report.agency_assignment_id ? '<div style="font-size:0.85rem; color:hsl(var(--muted-foreground));">Agency Assignment #' + esc(report.agency_assignment_id) + '</div>' : '') +
            '</div>' +
          '</div>' +
          '<div>' +
            '<span style="font-size:0.75rem; text-transform:uppercase; color:hsl(var(--muted-foreground)); font-weight:600;">Date Submitted</span>' +
            '<div style="margin-top:0.2rem; font-size:0.9rem;">' + formatDate(report.created_at) + '</div>' +
          '</div>' +
        '</div>' +

        '<div>' +
          '<span style="font-size:0.75rem; text-transform:uppercase; color:hsl(var(--muted-foreground)); font-weight:600;">Report Reason</span>' +
          '<div style="margin-top:0.35rem; font-weight:600; font-size:1rem; color:hsl(var(--foreground));">' + esc(report.reason || 'No summary reason provided') + '</div>' +
        '</div>' +

        '<div>' +
          '<span style="font-size:0.75rem; text-transform:uppercase; color:hsl(var(--muted-foreground)); font-weight:600;">Detailed Complaint Content</span>' +
          '<div style="margin-top:0.35rem; padding:0.85rem; background:hsl(var(--background)); border:1px solid hsl(var(--border)); border-radius:var(--radius-md); font-size:0.9rem; white-space:pre-wrap; line-height:1.5;">' +
            esc(report.details || 'No additional details provided by the consumer.') +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="kit-modal-foot" style="display:flex; justify-content:space-between; align-items:center; margin-top:1.5rem;">' +
        '<div>' +
          (status === 'pending' ?
            '<button type="button" class="btn-sm btn-primary modal-action-approve" data-id="' + report.id + '">Approve Report</button> ' +
            '<button type="button" class="btn-sm btn-ghost modal-action-decline" data-id="' + report.id + '" style="color:hsl(var(--destructive));">Decline Report</button>'
            : '') +
        '</div>' +
        '<button type="button" class="btn btn-ghost" id="modal-close-btn">Close</button>' +
      '</div>';

    modal.innerHTML = modalContent;
    backdrop.appendChild(modal);
    if (el('modal-root')) {
      el('modal-root').textContent = '';
      el('modal-root').appendChild(backdrop);
    } else {
      document.body.appendChild(backdrop);
    }

    el('modal-close-x').addEventListener('click', closeModal);
    el('modal-close-btn').addEventListener('click', closeModal);
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeModal();
    });

    var approveBtn = modal.querySelector('.modal-action-approve');
    if (approveBtn) {
      approveBtn.addEventListener('click', function () {
        processFlag(report.id, 'approve', this);
      });
    }

    var declineBtn = modal.querySelector('.modal-action-decline');
    if (declineBtn) {
      declineBtn.addEventListener('click', function () {
        processFlag(report.id, 'decline', this);
      });
    }
  }

  function closeModal() {
    var root = el('modal-root');
    if (root) root.textContent = '';
    var backdrop = el('report-detail-modal');
    if (backdrop) backdrop.remove();
    state.activeReport = null;
  }

  var isBooted = false;
  function boot() {
    if (isBooted) return;
    isBooted = true;

    var searchInput = el('global-search');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        state.search = searchInput.value;
        applyFilters();
      });
    }

    var statusFilter = el('status-filter');
    if (statusFilter) {
      statusFilter.addEventListener('change', function () {
        state.statusFilter = statusFilter.value;
        applyFilters();
      });
    }

    fetchReports();
  }

  document.addEventListener('itinari:ready', boot);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);
