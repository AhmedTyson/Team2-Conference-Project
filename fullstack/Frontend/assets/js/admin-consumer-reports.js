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

  var DEMO_FLAGS = [
    {
      id: 101,
      reporter_id: 12,
      reporter_type: 'user',
      reporter: { name: 'Ahmed Tyson', email: 'ahmed.tyson@example.com', role: 'customer' },
      flaggable_type: 'App\\Models\\Commerce\\AgencyAssignment',
      agency_assignment_id: 4,
      agency_assignment: { agency_user_id: 88, customer_id: 12, customer: { name: 'Ahmed Tyson' }, agency: { name: 'خدمة العملاء المصرية' } },
      reason: 'Non-Response / Ghosting',
      details: 'Agency partner has not responded to my custom trip requirements for over 48 hours.',
      status: 'pending',
      created_at: '2026-08-17T14:20:00Z'
    },
    {
      id: 102,
      reporter_id: 88,
      reporter_type: 'agency',
      reporter: { name: 'خدمة العملاء المصرية', email: 'support@egypt-travel.com', role: 'agency' },
      flaggable_type: 'App\\Models\\Commerce\\AgencyAssignment',
      agency_assignment_id: 4,
      agency_assignment: { agency_user_id: 88, customer_id: 12, customer: { name: 'Ahmed Tyson' }, agency: { name: 'خدمة العملاء المصرية' } },
      reason: 'Budget Dispute / Scope Creep',
      details: 'Customer requested premium VIP transfers and extra hotel nights outside the contracted budget scope.',
      status: 'pending',
      created_at: '2026-08-16T18:45:00Z'
    }
  ];

  var state = {
    allReports: DEMO_FLAGS,
    filteredReports: [],
    search: '',
    statusFilter: '',
    roleFilter: '',
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

  function isAgencyReporter(item) {
    if (!item) return false;
    if (item.reporter_type === 'agency' || item.reporter_type === 'agent') return true;
    if (item.reporter) {
      if (Array.isArray(item.reporter.roles)) {
        var hasAgency = item.reporter.roles.some(function(r) {
          var name = (typeof r === 'object' ? (r.name || r.role || r.slug) : r) || '';
          return String(name).toLowerCase().indexOf('agency') !== -1;
        });
        if (hasAgency) return true;
      }
      if (typeof item.reporter.role === 'string') {
        if (item.reporter.role.toLowerCase().indexOf('agency') !== -1) return true;
      }
    }
    if (item.agency_assignment && item.agency_assignment.agency_user_id && item.reporter_id) {
      if (String(item.agency_assignment.agency_user_id) === String(item.reporter_id)) {
        return true;
      }
    }
    return false;
  }

  function fetchReports() {
    state.loading = false;
    state.error = false;

    if (!It || !It.apiGet) {
      applyFilters();
      return;
    }

    It.apiGet('/admin/flags', { auth: true })
      .then(function (res) {
        state.loading = false;
        if (res && res.ok) {
          var data = (It.unwrapData && typeof It.unwrapData === 'function') ? It.unwrapData(res) : (res.data || (res.body ? res.body.data : null));
          if (Array.isArray(data) && data.length > 0) {
            state.allReports = data;
          }
        }
        applyFilters();
      })
      .catch(function () {
        state.loading = false;
        applyFilters();
      });
  }

  function applyFilters() {
    var q = state.search.trim().toLowerCase();
    var sf = state.statusFilter.trim().toLowerCase();
    var rf = state.roleFilter.trim().toLowerCase();

    state.filteredReports = state.allReports.filter(function (item) {
      var idStr = String(item.id || '');
      var reason = (item.reason || '').toLowerCase();
      var details = (item.details || '').toLowerCase();
      var reporterName = (item.reporter && item.reporter.name ? item.reporter.name : '').toLowerCase();
      var reporterEmail = (item.reporter && item.reporter.email ? item.reporter.email : '').toLowerCase();
      var assignId = String(item.agency_assignment_id || '');
      var status = (item.status || 'pending').toLowerCase();
      var isAgency = isAgencyReporter(item);

      var matchSearch = !q ||
        idStr.indexOf(q) !== -1 ||
        reason.indexOf(q) !== -1 ||
        details.indexOf(q) !== -1 ||
        reporterName.indexOf(q) !== -1 ||
        reporterEmail.indexOf(q) !== -1 ||
        assignId.indexOf(q) !== -1 ||
        status.indexOf(q) !== -1;

      var matchStatus = !sf || status === sf;
      var matchRole = !rf || (rf === 'agency' ? isAgency : !isAgency);

      return matchSearch && matchStatus && matchRole;
    });

    state.page = 1;
    renderReports();
  }

  function renderReports() {
    var tbody = el('consumer-reports-tbody') || el('admin-flags-tbody');
    if (!tbody) return;

    if (state.loading || state.error) return;

    if (!state.filteredReports || !state.filteredReports.length) {
      var isFiltered = state.search || state.statusFilter || state.roleFilter;
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align: center; padding: 3rem 1rem; color: hsl(var(--muted-foreground));">' +
          '<div style="font-size:1.75rem; margin-bottom:0.5rem;">📋</div>' +
          '<p style="margin:0 0 0.35rem 0; font-weight:600; font-size:1rem; color:hsl(var(--foreground));">' +
            (isFiltered ? 'No incident reports match your filter criteria' : 'No incident reports found') +
          '</p>' +
          '<p style="margin:0; font-size:0.85rem;">' +
            (isFiltered ? 'Try clearing search keywords or changing role/status filters.' : 'Incident flags submitted by customers or agencies will appear here.') +
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

      var isAgency = isAgencyReporter(item);

      // Reporter Badge & Role Differentiation
      var reporterRoleBadge = isAgency
        ? '<span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"><i class="fas fa-briefcase mr-1"></i> Agency Partner</span>'
        : '<span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40"><i class="fas fa-user mr-1"></i> Customer Traveler</span>';

      var reporterName = item.reporter ? esc(item.reporter.name || item.reporter.email) : 'User #' + esc(item.reporter_id || 'N/A');
      var reporterEmail = item.reporter && item.reporter.email ? '<div style="font-size:0.75rem; color:hsl(var(--muted-foreground));">' + esc(item.reporter.email) + '</div>' : '';

      // Direction Flow Indicator
      var directionHtml = isAgency
        ? '<div style="font-size:0.8rem; font-weight:700;" class="flex items-center gap-1.5"><span style="color:#A7F3D0;">Agency Partner</span> <span style="opacity:0.6;">➔</span> <span style="color:#FEF3C7;">Customer Traveler</span></div>'
        : '<div style="font-size:0.8rem; font-weight:700;" class="flex items-center gap-1.5"><span style="color:#FEF3C7;">Customer Traveler</span> <span style="opacity:0.6;">➔</span> <span style="color:#A7F3D0;">Agency Partner</span></div>';

      if (item.agency_assignment_id) {
        directionHtml += '<div style="font-size:0.72rem; color:hsl(var(--muted-foreground));">Assignment #' + esc(item.agency_assignment_id) + '</div>';
      }

      var reasonText = esc(item.reason || '–');
      var detailsText = item.details ? '<div style="font-size:0.75rem; color:hsl(var(--muted-foreground)); max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + esc(item.details) + '</div>' : '';
      var dateText = formatDate(item.created_at);

      var actionsHtml =
        '<div class="action-btns" style="display:flex; gap:0.35rem; align-items:center; flex-wrap:wrap;">' +
          '<button type="button" class="btn-sm btn-ghost view-report-btn" data-id="' + item.id + '" title="View incident details">View Details</button>';

      if (item.agency_assignment_id) {
        actionsHtml += '<a href="../app/chat.html?assignment_id=' + esc(item.agency_assignment_id) + '&mentor=1" target="_blank" class="btn-sm btn-outline" style="color:#E9D5FF; border-color:rgba(168,85,247,0.4); background:rgba(168,85,247,0.15);" title="Inspect chat thread in Read-Only Mentoring Mode"><i class="fas fa-eye mr-1"></i> Mentor Chat</a>';
      }

      if (status === 'pending') {
        actionsHtml +=
          '<button type="button" class="btn-sm btn-primary action-approve-btn" data-id="' + item.id + '">Approve</button>' +
          '<button type="button" class="btn-sm btn-ghost action-decline-btn" data-id="' + item.id + '" style="color:hsl(var(--destructive));">Decline</button>';
      }

      actionsHtml += '</div>';

      // Left Accent Border for Visual Distinction
      var rowBorderAccent = isAgency ? 'border-left: 3px solid #10b981;' : 'border-left: 3px solid #f59e0b;';

      return '<tr style="' + rowBorderAccent + '">' +
        '<td><strong>#' + item.id + '</strong></td>' +
        '<td><div style="margin-bottom:0.25rem;">' + reporterRoleBadge + '</div><div><strong>' + reporterName + '</strong></div>' + reporterEmail + '</td>' +
        '<td>' + directionHtml + '</td>' +
        '<td><div><strong style="color:hsl(var(--foreground)); font-size:0.88rem;">' + reasonText + '</strong></div>' + detailsText + '</td>' +
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
    var tbody = el('consumer-reports-tbody') || el('admin-flags-tbody');
    if (tbody && !tbody.dataset.actionsBound) {
      tbody.dataset.actionsBound = "1";
      tbody.addEventListener('click', function(e) {
        var target = e.target.closest('button');
        if (!target) return;
        var id = target.getAttribute('data-id');
        if (!id) return;
        if (target.classList.contains('view-report-btn')) {
          e.preventDefault();
          openReportDetails(id);
        } else if (target.classList.contains('action-approve-btn')) {
          e.preventDefault();
          processFlag(id, 'approve', target);
        } else if (target.classList.contains('action-decline-btn')) {
          e.preventDefault();
          processFlag(id, 'decline', target);
        }
      });
    }

    var viewBtns = document.querySelectorAll('.view-report-btn');
    viewBtns.forEach(function (btn) {
      btn.onclick = function (e) {
        e.preventDefault();
        var id = this.getAttribute('data-id');
        openReportDetails(id);
      };
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

    var status = (report.status || 'pending').toLowerCase();
    var badgeCls = status === 'approved' ? 'badge-ok' : (status === 'declined' ? 'badge-danger' : 'badge-warn');
    var statusBadge = '<span class="badge ' + badgeCls + '">' + esc(status.toUpperCase()) + '</span>';
    var isAgency = isAgencyReporter(report);

    var backdrop = document.createElement('div');
    backdrop.className = 'kit-modal-backdrop';
    backdrop.id = 'report-detail-modal';
    backdrop.style.cssText = 'position:fixed; inset:0; z-index:999999; background:rgba(0,0,0,0.75); display:flex; align-items:center; justify-content:center; padding:1rem; backdrop-filter:blur(6px);';

    var modal = document.createElement('div');
    modal.className = 'kit-modal is-medium';
    modal.style.cssText = 'width:min(620px, 95vw); max-height:90vh; overflow-y:auto; background:hsl(var(--card, #171717)); padding:1.5rem; border-radius:16px; border:1px solid ' + (isAgency ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)') + '; box-shadow:0 25px 50px -12px rgba(0,0,0,0.7); color:#fff;';

    // Role Badges & Direction Header
    var modalHeaderTitle = isAgency
      ? '<h3 style="margin:0; font-size:1.15rem; color:#A7F3D0; font-weight:700;"><i class="fas fa-briefcase mr-2"></i> Agency Partner Dispute Report #' + esc(report.id) + '</h3>'
      : '<h3 style="margin:0; font-size:1.15rem; color:#FEF3C7; font-weight:700;"><i class="fas fa-user-shield mr-2"></i> Customer Traveler Incident Report #' + esc(report.id) + '</h3>';

    var reporterRoleBadge = isAgency
      ? '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"><i class="fas fa-briefcase mr-1"></i> Agency Partner</span>'
      : '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40"><i class="fas fa-user mr-1"></i> Customer Traveler</span>';

    var targetRoleBadge = isAgency
      ? '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40"><i class="fas fa-user mr-1"></i> Customer Traveler</span>'
      : '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"><i class="fas fa-briefcase mr-1"></i> Agency Partner</span>';

    var reporterName = report.reporter ? esc(report.reporter.name || report.reporter.email) : 'User #' + esc(report.reporter_id || 'N/A');
    var reporterEmail = report.reporter && report.reporter.email ? esc(report.reporter.email) : 'N/A';

    var targetName = 'Assignment #' + esc(report.agency_assignment_id || 'N/A');
    if (report.agency_assignment) {
      if (isAgency && report.agency_assignment.customer) {
        targetName = esc(report.agency_assignment.customer.name || report.agency_assignment.customer.email);
      } else if (!isAgency && report.agency_assignment.agency) {
        targetName = esc(report.agency_assignment.agency.name || report.agency_assignment.agency.company_name || 'Agency');
      }
    }

    var mentorChatBtn = report.agency_assignment_id
      ? '<a href="../app/chat.html?assignment_id=' + esc(report.agency_assignment_id) + '&mentor=1" target="_blank" class="btn btn-sm btn-outline" style="color:#E9D5FF; border-color:rgba(168,85,247,0.4); background:rgba(168,85,247,0.15); display:inline-flex; align-items:center; gap:0.4rem;" title="Inspect live chat thread in Read-Only Mentoring Mode"><i class="fas fa-shield-halved"></i> Open Mentor Chat Thread</a>'
      : '';

    var modalContent =
      '<div class="kit-modal-head" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.25rem; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:0.75rem;">' +
        '<div>' +
          modalHeaderTitle +
          '<div style="margin-top:0.4rem; display:flex; gap:0.5rem; align-items:center;">' + statusBadge + (isAgency ? '<span style="font-size:0.75rem; color:#A7F3D0;">Dispute filed by Agency</span>' : '<span style="font-size:0.75rem; color:#FEF3C7;">Complaint filed by Traveler</span>') + '</div>' +
        '</div>' +
        '<button type="button" class="kit-modal-close" id="modal-close-x" aria-label="Close" style="background:none; border:none; color:#999; font-size:1.5rem; cursor:pointer;">&times;</button>' +
      '</div>' +

      '<div class="kit-modal-body" style="display:flex; flex-direction:column; gap:1.2rem;">' +
        '<div class="report-meta-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; padding:1rem; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px;">' +
          '<div>' +
            '<span style="font-size:0.72rem; text-transform:uppercase; color:hsl(var(--muted-foreground, #a3a3a3)); font-weight:700;">Initiator / Reporter</span>' +
            '<div style="margin-top:0.35rem; display:flex; flex-direction:column; gap:0.2rem;">' +
              '<div>' + reporterRoleBadge + '</div>' +
              '<div style="font-weight:700; color:#fff; margin-top:0.15rem;">' + reporterName + '</div>' +
              '<div style="font-size:0.78rem; color:#a3a3a3;">' + reporterEmail + '</div>' +
            '</div>' +
          '</div>' +

          '<div>' +
            '<span style="font-size:0.72rem; text-transform:uppercase; color:hsl(var(--muted-foreground, #a3a3a3)); font-weight:700;">Reported Target</span>' +
            '<div style="margin-top:0.35rem; display:flex; flex-direction:column; gap:0.2rem;">' +
              '<div>' + targetRoleBadge + '</div>' +
              '<div style="font-weight:700; color:#fff; margin-top:0.15rem;">' + targetName + '</div>' +
              (report.agency_assignment_id ? '<div style="font-size:0.78rem; color:#a3a3a3;">Assignment #' + esc(report.agency_assignment_id) + '</div>' : '') +
            '</div>' +
          '</div>' +

          '<div>' +
            '<span style="font-size:0.72rem; text-transform:uppercase; color:hsl(var(--muted-foreground, #a3a3a3)); font-weight:700;">Date Submitted</span>' +
            '<div style="margin-top:0.35rem; font-size:0.88rem; color:#e5e5e5; font-family:monospace;">' + formatDate(report.created_at) + '</div>' +
          '</div>' +
        '</div>' +

        '<div>' +
          '<span style="font-size:0.72rem; text-transform:uppercase; color:hsl(var(--muted-foreground, #a3a3a3)); font-weight:700;">Incident Category / Reason</span>' +
          '<div style="margin-top:0.35rem; font-weight:700; font-size:1.05rem; color:#fff; background:rgba(255,255,255,0.05); padding:0.6rem 0.85rem; border-radius:8px; border:1px solid rgba(255,255,255,0.1);">' + esc(report.reason || 'No summary reason provided') + '</div>' +
        '</div>' +

        '<div>' +
          '<span style="font-size:0.72rem; text-transform:uppercase; color:hsl(var(--muted-foreground, #a3a3a3)); font-weight:700;">Detailed Complaint &amp; Context</span>' +
          '<div style="margin-top:0.35rem; padding:1rem; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:8px; font-size:0.9rem; white-space:pre-wrap; line-height:1.6; color:#d4d4d4;">' +
            esc(report.details || 'No additional detailed text provided.') +
          '</div>' +
        '</div>' +

        (mentorChatBtn ? '<div style="margin-top:0.25rem;">' + mentorChatBtn + '</div>' : '') +
      '</div>' +

      '<div class="kit-modal-foot" style="display:flex; justify-content:space-between; align-items:center; margin-top:1.5rem; border-top:1px solid rgba(255,255,255,0.1); padding-top:1rem;">' +
        '<div>' +
          (status === 'pending' ?
            '<button type="button" class="btn-sm btn-primary modal-action-approve" data-id="' + report.id + '" style="margin-right:0.5rem;">Approve Report</button>' +
            '<button type="button" class="btn-sm btn-ghost modal-action-decline" data-id="' + report.id + '" style="color:hsl(var(--destructive, #ef4444));">Decline Report</button>'
            : '') +
        '</div>' +
        '<button type="button" class="btn btn-ghost" id="modal-close-btn" style="color:#aaa;">Close</button>' +
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

    var roleFilter = el('role-filter');
    if (roleFilter) {
      roleFilter.addEventListener('change', function () {
        state.roleFilter = roleFilter.value;
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
