/**
 * admin-flags.js
 */
(function(global) {
  'use strict';
  
  var It = global.Itinera;
  if (!It || !It.app) return;

  function el(id) { return document.getElementById(id); }

  function fetchFlags() {
    It.apiGet('/admin/flags', { auth: true })
      .then(function(res) {
        var items = It.app.unwrapData(res) || [];
        var tbody = el('admin-flags-tbody');
        if (!tbody) return;

        if (items.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No reports found.</td></tr>';
          return;
        }

          tbody.innerHTML = items.map(function(item) {
            var status = (item.status || 'pending').toLowerCase();
            var badgeCls = status === 'approved' ? 'badge-ok' : (status === 'declined' ? 'badge-danger' : 'badge-warn');
            var statusBadge = '<span class="badge ' + badgeCls + '">' + status.toUpperCase() + '</span>';
            
            var reporterName = item.reporter ? (item.reporter.name || item.reporter.email) : 'User #' + item.reporter_id;
            var assignmentInfo = item.agency_assignment_id
              ? ('Assignment #' + item.agency_assignment_id + (item.agency_assignment && item.agency_assignment.customer ? ' (' + item.agency_assignment.customer.name + ')' : ''))
              : 'Direct Chat Inquiry';

            // Determine reporter role for filter
            var reporterRole = item.reporter_role || (item.agency_assignment_id ? 'customer' : 'customer');

            var mentorBtn = item.agency_assignment_id
              ? '<a href="../app/chat.html?assignment_id=' + item.agency_assignment_id + '&mentor=1" class="btn-sm btn-outline" style="white-space:nowrap;"><i class="fas fa-shield-halved mr-1"></i> Mentor Chat</a>'
              : '';

            var actions = '<div class="action-btns" style="display:flex; gap:0.4rem; align-items:center; flex-wrap:wrap;">';
            if (status === 'pending') {
              actions += '<button type="button" class="btn-sm btn-primary flag-action" data-id="' + item.id + '" data-action="approve">Approve</button>' +
                '<button type="button" class="btn-sm btn-ghost flag-action" data-id="' + item.id + '" data-action="decline" style="color:hsl(var(--destructive));">Decline</button>';
            } else {
              actions += '<span style="color:hsl(var(--muted-foreground)); font-size:0.85rem; font-style:italic;">Actioned</span>';
            }
            if (mentorBtn) actions += mentorBtn;
            actions += '</div>';

            var detailsText = item.details ? '<div style="font-size:0.8rem; color:hsl(var(--muted-foreground)); margin-top:4px;">' + (It.app && It.app.esc ? It.app.esc(item.details) : item.details) + '</div>' : '';
            var reasonText = (It.app && It.app.esc ? It.app.esc(item.reason || '–') : (item.reason || '–'));

            return '<tr data-flag-id="' + item.id + '" data-reporter-role="' + reporterRole + '" data-flag-status="' + status + '">' +
              '<td><strong>#' + item.id + '</strong></td>' +
              '<td><strong>' + (It.app && It.app.esc ? It.app.esc(reporterName) : reporterName) + '</strong></td>' +
              '<td>' + (It.app && It.app.esc ? It.app.esc(assignmentInfo) : assignmentInfo) + '</td>' +
              '<td><div><strong>' + reasonText + '</strong></div>' + detailsText + '</td>' +
              '<td>' + statusBadge + '</td>' +
              '<td>' + actions + '</td>' +
            '</tr>';
          }).join('');

          // Dispatch loaded event for KPI strip
          document.dispatchEvent(new CustomEvent('admin-flags:loaded', { detail: items }));

          bindActions();

      })
      .catch(function() {
        var tbody = el('admin-flags-tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--danger-fg);">Error loading reports.</td></tr>';
        It.app.toast('Failed to fetch admin flags', 'error');
      });
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
      .then(function() {
        It.app.toast('Report successfully ' + action + 'd', 'success');
        fetchFlags();
      })
      .catch(function(err) {
        It.app.toast('Failed to process report', 'error');
      });
  }

  It.app.boot(function(user, role) {
    if (!user || !It.session.isAdminRole(role)) {
      window.location.href = '../login.html';
      return;
    }
    fetchFlags();
  });

})(window);
