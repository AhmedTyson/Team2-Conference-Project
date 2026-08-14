/**
 * report-agency.js — Customer Flag Submission Logic
 * Sends report to /api/agency-assignments/{assignment}/report
 */
(function(global) {
  'use strict';

  var It = global.Itinari;
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

  function boot() {
    var form = el('report-form');
    var btn = el('submit-btn');

    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        var id = el('assignment_id') ? el('assignment_id').value.trim() : '';
        var reason = el('reason') ? el('reason').value.trim() : '';
        var detailsEl = el('details');
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
                window.location.href = '/app/dashboard.html';
              }, 2000);
            } else {
              var errMsg = (res && res.body && res.body.message) ? res.body.message : 'Failed to submit report. Please check the assignment ID.';
              showToastMsg(errMsg, 'error');
              btn.disabled = false;
              btn.textContent = 'Submit Report';
            }
          })
          .catch(function(err) {
            showToastMsg('Network error while submitting report. Please try again.', 'error');
            btn.disabled = false;
            btn.textContent = 'Submit Report';
          });
      });
    }
  }

  document.addEventListener("itinari:ready", boot);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window);
