/**
 * agency-create-trip.js — Agency trip planner gateway.
 * Resolves the assigned customer from the URL (?assignment_id=) or a
 * fallback picker, shows WHO the plan is being built for, and hands off
 * to the user-side AI Trip Planner (app/planner.html). The planner links
 * the finished plan back to this customer's assignment via the agency
 * trip endpoint on save.
 */
(function(global) {
  'use strict';

  var It = global.Itinera;
  if (!It || !It.app) return;

  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var STATUS_LABEL = {
    requested: 'Requested',
    admin_approved: 'Ready',
    agency_approved: 'Accepted',
    agency_declined: 'Declined',
    completed: 'Completed',
    cancelled: 'Cancelled'
  };

  var STATUS_CLASS = {
    requested: 'badge-off',
    admin_approved: 'badge-warn',
    agency_approved: 'badge-ok',
    agency_declined: 'badge-danger',
    completed: 'badge-ok',
    cancelled: 'badge-off'
  };

  It.app.boot(function(user, role) {
    if (role !== 'agency') {
      window.location.href = '/auth/login.html';
      return;
    }

    var isBooted = false;
    function init() {
      if (isBooted) return;
      isBooted = true;

      var urlParams = new URLSearchParams(window.location.search);
      var targetAssignmentId = urlParams.get('assignment_id') ? Number(urlParams.get('assignment_id')) : null;

      It.apiGet('/agency/assignments', { auth: true }).then(function (res) {
        var rows = [];
        if (res && res.ok && res.body) {
          if (Array.isArray(res.body.data)) rows = res.body.data;
          else if (Array.isArray(res.body.data && res.body.data.data)) rows = res.body.data.data;
        }
        var assignment = targetAssignmentId
          ? rows.find(function (r) { return Number(r.id) === targetAssignmentId; })
          : null;

        if (!rows.length) {
          renderEmpty('No assigned customers yet — customers are routed to you after an admin approves their request.');
          return;
        }
        if (!assignment) {
          renderPicker(rows);
          return;
        }
        renderContext(assignment);
      }).catch(function () {
        renderEmpty('Could not load assignments. Please try again.');
      });
    }

    function renderEmpty(msg) {
      var host = el('assignment-context');
      if (!host) return;
      host.innerHTML =
        '<div class="kit-empty"><span class="kit-empty-icon">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></span>' +
        '<p class="kit-empty-title">' + esc(msg) + '</p>' +
        '<a href="assignments.html" class="btn btn-ghost">Back to My Assignments</a></div>';
    }

    function renderPicker(rows) {
      var selectable = rows.filter(function (r) {
        return r.status === 'admin_approved' || r.status === 'agency_approved';
      });
      var host = el('assignment-context');
      if (!host) return;
      if (!selectable.length) {
        renderEmpty('No assignments are ready for planning yet.');
        return;
      }

      var label = document.createElement('label');
      label.className = 'kit-field';
      label.innerHTML =
        '<label for="assignment-select">Select the customer you want to plan for</label>' +
        '<select id="assignment-select" class="input input-sm" style="width:100%; max-width:420px;">' +
        selectable.map(function (r) {
          var c = r.customer || {};
          return '<option value="' + r.id + '">' + esc(c.name || c.email || 'Customer #' + r.customer_id) + ' — Assignment #' + r.id + '</option>';
        }).join('') +
        '</select>';
      host.textContent = '';
      host.appendChild(label);

      var openBtn = document.createElement('a');
      openBtn.id = 'open-planner-btn';
      openBtn.className = 'btn btn-primary';
      openBtn.style.marginTop = '1rem';
      openBtn.textContent = 'Open Trip Planner';
      openBtn.href = plannerUrl(selectable[0]);
      host.appendChild(openBtn);

      var selectEl = el('assignment-select');
      if (selectEl) {
        selectEl.addEventListener('change', function () {
          var target = selectable.find(function (r) { return Number(r.id) === Number(selectEl.value); });
          if (target) openBtn.href = plannerUrl(target);
        });
      }
    }

    function plannerUrl(r) {
      var c = r.customer || {};
      return '../app/planner.html?assignment_id=' + r.id +
        '&customer_id=' + (c.id || r.customer_id) +
        '&customer=' + encodeURIComponent(c.name || c.email || 'assigned customer');
    }

    function renderContext(assignment) {
      var host = el('assignment-context');
      if (!host) return;
      var c = assignment.customer || {};
      var status = assignment.status || 'requested';
      var infoEl = el('assignment-info');
      if (infoEl) infoEl.textContent = 'Building a trip for Assignment #' + assignment.id;

      host.innerHTML =
        '<div style="display:flex; flex-wrap:wrap; gap:1.5rem; align-items:center; justify-content:space-between;">' +
        '  <div style="display:flex; align-items:center; gap:1rem; min-width:0;">' +
        '    <span class="chip-avatar" style="width:48px; height:48px; border-radius:999px; background:hsl(var(--primary)/0.15); color:hsl(var(--primary)); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1rem;">' +
              esc(String(c.name || 'U').trim().substring(0, 1).toUpperCase()) + '</span>' +
        '    <div style="min-width:0;">' +
        '      <h2 style="margin:0 0 0.2rem; font-size:1.15rem;" id="assignment-customer">' + esc(c.name || 'Customer #' + (assignment.customer_id || assignment.id)) + '</h2>' +
        '      <p style="margin:0; font-size:0.85rem; opacity:0.7;" id="assignment-email">' + esc(c.email || '—') + '</p>' +
        '    </div>' +
        '  </div>' +
        '  <div style="display:flex; align-items:center; gap:1rem; flex-wrap:wrap;">' +
        '    <span class="badge ' + (STATUS_CLASS[status] || 'badge-off') + '" id="assignment-status">' + esc(STATUS_LABEL[status] || status) + '</span>' +
        '    <span style="font-size:0.8rem; opacity:0.6;">Assignment #' + assignment.id + '</span>' +
        '  </div>' +
        '</div>' +
        '<div style="border-top:1px solid var(--color-border); margin-top:1.5rem; padding-top:1.5rem; display:flex; flex-wrap:wrap; gap:1rem; align-items:center; justify-content:space-between;">' +
        '  <p style="margin:0; font-size:0.85rem; opacity:0.75; max-width:520px;">' +
        '    The AI Trip Planner opens for this customer only. The finished plan is attached to ' +
            esc(c.name || 'their') + '\'s account via Assignment #' + assignment.id + '.</p>' +
        '  <a id="open-planner-btn" class="btn btn-primary" href="' + plannerUrl(assignment) + '">' +
        '    <i class="fas fa-sparkles" style="margin-inline-end:0.4rem;"></i>Open Trip Planner</a>' +
        '</div>';

      if (assignment.trips && assignment.trips.length) {
        var tripsNote = document.createElement('p');
        tripsNote.style.cssText = 'margin:1rem 0 0; font-size:0.8rem; opacity:0.6;';
        tripsNote.textContent = assignment.trips.length + (assignment.trips.length === 1 ? ' trip' : ' trips') + ' already planned for this customer.';
        host.appendChild(tripsNote);
      }
    }

    document.addEventListener('DOMContentLoaded', init);
  });

})(window);