/**
 * flights.js
 */
(function(global) {
  'use strict';
  
  var It = global.Itinera;
  if (!It || !It.app) return;

  function el(id) { return document.getElementById(id); }

  function renderFlights(flights) {
    var container = el('results');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (flights.length === 0) {
      container.innerHTML = '<div class="card empty-state">No flights available.</div>';
      return;
    }
    
    flights.forEach(function(f) {
      var card = document.createElement('a');
      card.href = '/flight-details.html?id=' + f.id;
      card.className = 'card';
      card.style.display = 'block';
      card.style.textDecoration = 'none';
      card.style.color = 'inherit';
      
      var depTime = new Date(f.departure_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      var arrTime = new Date(f.arrival_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      card.innerHTML = 
        '<div style="margin-bottom: var(--space-3); display:flex; justify-content:space-between;">' +
          '<span style="font-weight: 600;">' + It.app.esc(f.airline) + '</span>' +
          '<span style="font-family: monospace; color: var(--text-muted);">' + It.app.esc(f.flight_number) + '</span>' +
        '</div>' +
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: var(--space-4);">' +
          '<div style="text-align:center;">' +
            '<div style="font-size: 1.5rem; font-weight: 700;">' + It.app.esc(f.origin) + '</div>' +
            '<div style="font-size: 0.85rem; color: var(--text-muted);">' + depTime + '</div>' +
          '</div>' +
          '<div style="flex:1; text-align:center; padding: 0 var(--space-3); color: var(--text-faint);">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:24px;height:24px;"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' +
            '<div style="border-top: 1px dashed var(--border); margin: 4px 0;"></div>' +
          '</div>' +
          '<div style="text-align:center;">' +
            '<div style="font-size: 1.5rem; font-weight: 700;">' + It.app.esc(f.destination) + '</div>' +
            '<div style="font-size: 0.85rem; color: var(--text-muted);">' + arrTime + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex; justify-content:space-between; align-items:flex-end;">' +
          '<div style="font-size: 0.85rem; color: var(--text-muted);">' + (f.available_seats || 0) + ' seats left</div>' +
          '<div style="font-weight: 600; font-size: 1.25rem;">' + It.app.money(f.price, 'USD') + '</div>' +
        '</div>';
        
      container.appendChild(card);
    });
  }

  It.app.boot(function() {
    It.apiGet('/v1/flights')
      .then(function(res) {
        var flights = It.app.unwrapData(res) || [];
        renderFlights(flights);
      })
      .catch(function(err) {
        It.app.showToast('Failed to load flights: ' + err.message, 'danger');
        var container = el('results');
        if (container) container.innerHTML = '<div class="card empty-state">Error loading flights.</div>';
      });
  });

})(window);
