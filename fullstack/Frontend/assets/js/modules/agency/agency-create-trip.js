/**
 * agency-create-trip.js
 */
(function(global) {
  'use strict';
  
  var It = global.Itinera;
  if (!It || !It.app) return;

  function el(id) { return document.getElementById(id); }

  It.app.boot(function(user, role) {
    if (role !== 'agency') {
      window.location.href = '../login.html';
      return;
    }
    
    var urlParams = new URLSearchParams(window.location.search);
    var assignmentId = urlParams.get('assignment_id');
    
    var infoEl = el('assignment-info');
    if (!assignmentId) {
      if (infoEl) infoEl.textContent = 'Error: No assignment ID provided.';
      It.app.showToast('No assignment ID provided in URL', 'danger');
      return;
    }
    
    if (infoEl) infoEl.textContent = 'Building proposal for Assignment #' + assignmentId;

    var form = el('create-trip-form');
    var submitBtn = el('submit-btn');

    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';

        var payload = {
          title: el('trip-title').value,
          description: el('trip-description').value,
          price: parseFloat(el('trip-price').value),
          capacity: parseInt(el('trip-capacity').value, 10),
          start_date: el('trip-start').value,
          end_date: el('trip-end').value,
          currency: 'USD'
        };

        It.apiPost('/agency/assignments/' + encodeURIComponent(assignmentId) + '/trips', payload)
          .then(function() {
            It.app.showToast('Trip proposal created successfully!', 'success');
            setTimeout(function() {
              window.location.href = 'assignments.html';
            }, 1500);
          })
          .catch(function(err) {
            It.app.showToast('Failed to create trip: ' + err.message, 'danger');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Trip';
          });
      });
    }
  });

})(window);
