/**
 * agency-create-trip.js
 */
(function(global) {
  'use strict';
  
  var It = global.Itinari;
  if (!It || !It.app) return;

  function el(id) { return document.getElementById(id); }

  It.app.boot(function(user, role) {
    if (role !== 'agency') {
      window.location.href = '../login.html';
      return;
    }
    
  function init() {
    var urlParams = new URLSearchParams(window.location.search);
    var assignmentId = urlParams.get('assignment_id');
    var infoEl = el('assignment-info');
    var selectGroup = el('assignment-select-group');
    var selectEl = el('assignment-select');

    if (assignmentId) {
      if (infoEl) infoEl.textContent = 'Building proposal for Assignment #' + assignmentId;
      if (selectGroup) selectGroup.style.display = 'none';
    } else {
      if (infoEl) infoEl.textContent = 'Select an active customer assignment below to build a trip proposal.';
      if (selectGroup) selectGroup.style.display = 'block';

      It.apiGet('/agency/assignments', { auth: true })
        .then(function(res) {
          var rows = (res && res.data) || res || [];
          var activeRows = rows.filter(function(r) {
            return r.status === 'agency_approved' || r.status === 'admin_approved';
          });

          if (selectEl) {
            selectEl.innerHTML = '<option value="">-- Choose Customer Assignment --</option>';
            activeRows.forEach(function(a) {
              var opt = document.createElement('option');
              opt.value = a.id;
              var custName = a.customer ? (a.customer.name || a.customer.email) : 'Customer #' + a.customer_id;
              opt.textContent = 'Assignment #' + a.id + ' — ' + custName + ' (' + (a.budget_level || 'standard') + ')';
              selectEl.appendChild(opt);
            });
          }
        })
        .catch(function() {
          if (infoEl) infoEl.textContent = 'Could not load customer assignments.';
        });
    }

    var form = el('create-trip-form');
    var submitBtn = el('submit-btn');

    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();

        var targetAssignmentId = assignmentId || (selectEl ? selectEl.value : null);
        if (!targetAssignmentId) {
          if (It.feedback && It.feedback.banner) {
            It.feedback.banner('Please select a customer assignment.', 'is-error');
          } else {
            alert('Please select a customer assignment.');
          }
          return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';

        var payload = {
          title: el('trip-title').value,
          description: el('trip-description').value,
          price: parseFloat(el('trip-price').value),
          capacity: parseInt(el('trip-capacity').value, 10),
          no_of_travelers: parseInt(el('trip-capacity').value, 10),
          start_date: el('trip-start').value,
          end_date: el('trip-end').value,
          currency: 'USD'
        };

        It.apiPost('/agency/assignments/' + encodeURIComponent(targetAssignmentId) + '/trips', payload, { auth: true })
          .then(function() {
            if (It.feedback && It.feedback.banner) {
              It.feedback.banner('Trip proposal created successfully!', 'is-ok');
            }
            setTimeout(function() {
              window.location.href = 'proposals.html';
            }, 1200);
          })
          .catch(function(err) {
            var msg = (err && err.message) || 'Failed to create trip proposal.';
            if (It.feedback && It.feedback.banner) {
              It.feedback.banner(msg, 'is-error');
            } else {
              alert(msg);
            }
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Trip';
          });
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);

})(window);
