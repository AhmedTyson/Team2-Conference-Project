/**
 * notifications.js - User notifications logic
 */
(function(global) {
  'use strict';

  var It = global.Itinari;
  if (!It || !It.app) return;

  function el(id) { return document.getElementById(id); }

  function formatDate(isoStr) {
    if (!isoStr) return '';
    var date = new Date(isoStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function renderNotifications(items) {
    var container = el('notifications-list');
    if (!container) return;

    if (!items || items.length === 0) {
      container.innerHTML = '<div class="state-panel"><p>You have no notifications at this time.</p></div>';
      return;
    }

    container.innerHTML = items.map(function(item) {
      var unreadClass = item.is_read ? '' : 'unread';
      var markReadBtn = item.is_read ? '' : '<button class="btn btn--ghost mark-read-btn" data-id="' + item.id + '">Mark as read</button>';
      
      return '<div class="notification-item ' + unreadClass + '">' +
             '<div class="notification-icon">🔔</div>' +
             '<div class="notification-content">' +
             '<h4 class="notification-title">' + It.app.esc(item.title || 'Notification') + '</h4>' +
             '<p class="notification-text">' + It.app.esc(item.message || '') + '</p>' +
             '<div class="notification-time">' + formatDate(item.created_at) + '</div>' +
             '</div>' +
             '<div class="notification-actions">' + markReadBtn + '</div>' +
             '</div>';
    }).join('');

    // Bind mark as read buttons
    var btns = container.querySelectorAll('.mark-read-btn');
    btns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = this.getAttribute('data-id');
        markAsRead(id);
      });
    });
  }

  function fetchNotifications() {
    It.apiGet('/v1/notifications', { auth: true })
      .then(function(res) {
        var items = It.app.unwrapData(res) || [];
        renderNotifications(items);
      })
      .catch(function(err) {
        It.app.toast('Failed to load notifications', 'error');
        var container = el('notifications-list');
        if (container) container.innerHTML = '<div class="state-panel"><p>Error loading notifications.</p></div>';
      });
  }

  function markAsRead(id) {
    It.apiPatch('/v1/notifications/' + id + '/read', null, { auth: true })
      .then(function() {
        fetchNotifications();
      })
      .catch(function() {
        It.app.toast('Failed to mark as read', 'error');
      });
  }

  function markAllAsRead() {
    It.apiPatch('/v1/notifications/read-all', null, { auth: true })
      .then(function() {
        It.app.toast('All notifications marked as read', 'success');
        fetchNotifications();
      })
      .catch(function() {
        It.app.toast('Failed to mark all as read', 'error');
      });
  }

  It.app.boot(function(user) {
    if (!user) {
      window.location.href = '/login.html?redirect=/notifications.html';
      return;
    }

    var markAllBtn = el('mark-all-read');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', markAllAsRead);
    }

    fetchNotifications();
  });

})(window);
