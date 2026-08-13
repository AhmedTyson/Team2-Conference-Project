/**
 * admin-notifications.js
 */
(function(global) {
  'use strict';
  
  var It = global.Itinari;
  if (!It || !It.app) return;

  function el(id) { return document.getElementById(id); }

  function formatDate(isoStr) {
    if (!isoStr) return '';
    var d = new Date(isoStr);
    return d.toLocaleString();
  }

  function fetchAdminNotifications() {
    It.apiGet('/v1/admin/notifications', { auth: true })
      .then(function(res) {
        var items = It.app.unwrapData(res) || [];
        var tbody = el('admin-notifications-tbody');
        if (!tbody) return;

        if (items.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No notifications found.</td></tr>';
          return;
        }

        tbody.innerHTML = items.map(function(item) {
          return '<tr>' +
            '<td><span class="log-type info">#' + item.id + '</span></td>' +
            '<td>USR-' + item.user_id + '</td>' +
            '<td><strong>' + It.app.esc(item.title || '') + '</strong></td>' +
            '<td>' + It.app.esc(item.message || '') + '</td>' +
            '<td>' + formatDate(item.created_at) + '</td>' +
          '</tr>';
        }).join('');
      })
      .catch(function() {
        var tbody = el('admin-notifications-tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--danger-fg);">Error loading logs.</td></tr>';
        It.app.toast('Failed to fetch admin notifications', 'error');
      });
  }

  It.app.boot(function(user) {
    if (!user || user.role !== 'admin') {
      window.location.href = '/login.html';
      return;
    }
    fetchAdminNotifications();
  });

})(window);
