/**
 * admin-flags.js
 */
(function(global) {
  'use strict';
  
  var It = global.Itinari;
  if (!It || !It.app) return;

  function el(id) { return document.getElementById(id); }

  function fetchFlags() {
    It.apiGet('/v1/admin/flags', { auth: true })
      .then(function(res) {
        var items = It.app.unwrapData(res) || [];
        var tbody = el('admin-flags-tbody');
        if (!tbody) return;

        if (items.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No reports found.</td></tr>';
          return;
        }

        tbody.innerHTML = items.map(function(item) {
          var status = item.status || 'pending';
          var statusBadge = '<span class="status-badge ' + status + '">' + status.toUpperCase() + '</span>';
          
          var actions = '';
          if (status === 'pending') {
            actions = '<div class="action-btns">' +
              '<button class="btn btn--sm flag-action" data-id="' + item.id + '" data-action="approve" style="background:var(--ok-line);color:#fff;">Approve</button>' +
              '<button class="btn btn--sm flag-action" data-id="' + item.id + '" data-action="decline" style="background:var(--danger-fg);color:#fff;">Decline</button>' +
              '</div>';
          } else {
            actions = '<span style="color:var(--text-muted);font-style:italic;">Actioned</span>';
          }

          return '<tr>' +
            '<td><span class="log-type info">#' + item.id + '</span></td>' +
            '<td>AGN-' + (item.agency_id || 'Unknown') + '</td>' +
            '<td>USR-' + (item.user_id || 'Unknown') + '</td>' +
            '<td>' + It.app.esc(item.reason || '') + '</td>' +
            '<td>' + statusBadge + '</td>' +
            '<td>' + actions + '</td>' +
          '</tr>';
        }).join('');

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
    
    It.apiPost('/v1/admin/flags/' + id + '/' + action, null, { auth: true })
      .then(function() {
        It.app.toast('Report successfully ' + action + 'd', 'success');
        fetchFlags();
      })
      .catch(function(err) {
        It.app.toast('Failed to process report', 'error');
      });
  }

  It.app.boot(function(user) {
    if (!user || user.role !== 'admin') {
      window.location.href = '/login.html';
      return;
    }
    fetchFlags();
  });

})(window);
