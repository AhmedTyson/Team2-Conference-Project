/**
 * report-user.js — Agency Flag Submission for a Customer
 * Resolves the assignment context from the deep-link, then posts the
 * report to /api/agency-assignments/{assignment}/report
 */
(function(global) {
  'use strict';

  var It = global.Itinera;
  if (!It) return;

  function el(id) { return document.getElementById(id); }

  function showToastMsg(msg, type) {
    if (It.feedback && It.feedback.banner) {
      It.feedback.banner(msg, type === 'success' || type === 'ok' ? 'is-ok' : 'is-error');
    } else if (It.app && It.app.showToast) {
      It.app.showToast(msg, type);
    } else {
      alert(msg);
    }
  }

  async function resolveContext() {
    var assignmentId = null;
    var customerName = null;
    try {
      var qs = new global.URLSearchParams(global.location.search || '');
      assignmentId = qs.get('assignment_id') ? parseInt(qs.get('assignment_id'), 10) : null;
      customerName = qs.get('customer');
    } catch (err) {}

    var idInput = el('assignment_id');
    var contextLine = el('context-line');
    if (!idInput) return;

    if (!assignmentId) {
      if (contextLine) contextLine.textContent = 'No assignment reference found — please include the assignment number in the reason above.';
      return;
    }

    idInput.value = String(assignmentId);
    if (contextLine) {
      if (customerName) {
        contextLine.textContent = 'Reporting customer "' + customerName + '" · Assignment #' + assignmentId;
      } else {
        try {
          var res = await It.apiGet('/agency/assignments', { auth: true });
          var data = res.body && res.body.data ? res.body.data : (res.data || []);
          var list = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
          var match = list.find(function (a) { return Number(a.id) === assignmentId; });
          customerName = match && match.customer && match.customer.name ? match.customer.name : null;
          contextLine.textContent = 'Reporting customer "' + (customerName || 'Unknown') + '" · Assignment #' + assignmentId;
        } catch (err) {
          contextLine.textContent = 'Reporting customer · Assignment #' + assignmentId;
        }
      }
    }
  }

  function bindPresetChips() {
    var chips = document.querySelectorAll('.preset-chip');
    var reasonInput = el('report-reason');
    if (!chips || !reasonInput) return;

    chips.forEach(function(chip) {
      chip.addEventListener('click', function() {
        var reason = this.getAttribute('data-reason');
        if (reason) {
          reasonInput.value = reason;
          reasonInput.focus();
          chips.forEach(function(c) { c.classList.remove('bg-rose-500/20', 'border-rose-500/40', 'text-white'); });
          this.classList.add('bg-rose-500/20', 'border-rose-500/40', 'text-white');
        }
      });
    });
  }

  function boot() {
    var form = el('report-user-form');
    var btn = el('submit-btn');

    resolveContext();
    bindPresetChips();

    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();

        var id = el('assignment_id') ? el('assignment_id').value.trim() : '';
        var reason = el('report-reason') ? el('report-reason').value.trim() : '';
        var detailsEl = el('report-details');
        var details = detailsEl ? detailsEl.value.trim() : null;

        if (!id || !reason) {
          showToastMsg('Please provide both the Assignment ID and Reason.', 'error');
          return;
        }

        btn.disabled = true;
        btn.textContent = 'Submitting report...';

        var payload = {
          reason: reason,
          details: details || null
        };

        It.apiPost('/agency-assignments/' + encodeURIComponent(id) + '/report', payload, { auth: true })
          .then(function(res) {
            if (res && (res.ok || res.status === 200 || res.status === 201)) {
              showToastMsg('Report submitted successfully. Our admin team will review it.', 'success');
              form.reset();
              btn.disabled = true;
              btn.textContent = 'Report Submitted ✓';
              setTimeout(function() {
                global.history.length > 1 ? global.history.back() : (global.location.href = 'dashboard.html');
              }, 2000);
            } else {
              var errMsg = (res && res.body && res.body.message) ? res.body.message : 'Failed to submit report. Please check the assignment ID.';
              showToastMsg(errMsg, 'error');
              btn.disabled = false;
              btn.textContent = 'Submit Official Incident Report';
            }
          })
          .catch(function() {
            showToastMsg('Network error while submitting report. Please try again.', 'error');
            btn.disabled = false;
            btn.textContent = 'Submit Official Incident Report';
          });
      });
    }
  }

  document.addEventListener("itinera:ready", boot);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window);