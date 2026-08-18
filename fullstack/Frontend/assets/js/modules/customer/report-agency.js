/**
 * report-agency.js
 */
(function(global) {
  'use strict';

  var It = global.Itinera;
  if (!It || !It.app) return;

  function el(id) { return document.getElementById(id); }

  It.app.boot(function(user) {
    if (!user) {
      window.location.href = '/login.html?redirect=/report-agency.html';
      return;
    }

    var form = el('report-form');
    var btn = el('submit-btn');

    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        var id = el('assignment_id').value.trim();
        var reason = el('reason').value.trim();

        if (!id || !reason) {
          It.app.toast('Please fill out all fields', 'error');
          return;
        }

        btn.disabled = true;
        btn.textContent = 'Submitting...';

        It.apiPost('/v1/agency-assignments/' + id + '/report', { reason: reason }, { auth: true })
          .then(function() {
            It.app.toast('Report submitted successfully. Our team will review it.', 'success');
            form.reset();
            setTimeout(function() {
              window.location.href = '/home.html';
            }, 2000);
          })
          .catch(function(err) {
            It.app.toast('Failed to submit report. Please check the assignment ID.', 'error');
            btn.disabled = false;
            btn.textContent = 'Submit Report';
          });
      });
    }
  });

})(window);
