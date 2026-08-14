/**
 * flight-details.js
 */
(function(global) {
  'use strict';
  
  var It = global.Itinari;
  if (!It || !It.app) return;

  function el(id) { return document.getElementById(id); }

  function renderFlight(f) {
    var container = el('flight-details');
    if (!container) return;
    
    if (!f) {
      container.innerHTML = '<div class="empty-state">Flight not found.</div>';
      return;
    }
    
    var depTime = new Date(f.departure_time);
    var arrTime = new Date(f.arrival_time);
    var durationMs = arrTime - depTime;
    var durationHrs = Math.floor(durationMs / 3600000);
    var durationMins = Math.floor((durationMs % 3600000) / 60000);
    
    container.innerHTML = 
      '<div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid var(--border); padding-bottom: var(--space-4); margin-bottom: var(--space-6);">' +
        '<div>' +
          '<h2 style="margin:0; font-size: 2rem;">' + It.app.esc(f.airline) + '</h2>' +
          '<p style="color: var(--text-muted); margin:0;">Flight ' + It.app.esc(f.flight_number) + '</p>' +
        '</div>' +
        '<div style="text-align:right;">' +
          '<div style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">' + It.app.money(f.price, 'USD') + '</div>' +
          '<p style="color: var(--text-muted); margin:0;">' + (f.available_seats || 0) + ' seats available</p>' +
        '</div>' +
      '</div>' +
      
      '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: var(--space-8); background: var(--surface-2); padding: var(--space-6); border-radius: var(--radius-lg);">' +
        '<div style="text-align:center;">' +
          '<div style="font-size: 0.85rem; color: var(--text-muted); text-transform:uppercase;">Departure</div>' +
          '<div style="font-size: 2.5rem; font-weight: 800; line-height:1;">' + It.app.esc(f.origin) + '</div>' +
          '<div style="font-size: 1rem; margin-top: var(--space-2);">' + depTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) + '</div>' +
          '<div style="font-size: 0.85rem; color: var(--text-faint);">' + depTime.toLocaleDateString() + '</div>' +
        '</div>' +
        
        '<div style="flex:1; text-align:center; padding: 0 var(--space-4);">' +
          '<div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: var(--space-2);">' + durationHrs + 'h ' + durationMins + 'm</div>' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:32px;height:32px; color: var(--primary);"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' +
          '<div style="border-top: 2px dashed var(--border); margin: 8px 0;"></div>' +
          '<div style="font-size: 0.85rem; color: var(--text-faint);">Direct Flight</div>' +
        '</div>' +
        
        '<div style="text-align:center;">' +
          '<div style="font-size: 0.85rem; color: var(--text-muted); text-transform:uppercase;">Arrival</div>' +
          '<div style="font-size: 2.5rem; font-weight: 800; line-height:1;">' + It.app.esc(f.destination) + '</div>' +
          '<div style="font-size: 1rem; margin-top: var(--space-2);">' + arrTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) + '</div>' +
          '<div style="font-size: 0.85rem; color: var(--text-faint);">' + arrTime.toLocaleDateString() + '</div>' +
        '</div>' +
      '</div>' +
      
      '<div style="text-align:center;">' +
        '<button class="btn btn--primary" style="font-size: 1.1rem; padding: var(--space-3) var(--space-8);" onclick="Itinari.app.showToast(\'Booking system coming soon!\', \'info\')">Select Flight</button>' +
      '</div>';
  }

  It.app.boot(function() {
    var id = new URLSearchParams(window.location.search).get('id');
    if (!id) {
      renderFlight(null);
      return;
    }
    
    It.apiGet('/v1/flights/' + id)
      .then(function(res) {
        renderFlight(It.app.unwrapData(res));
      })
      .catch(function(err) {
        It.app.showToast('Failed to load flight details: ' + err.message, 'danger');
        var container = el('flight-details');
        if (container) container.innerHTML = '<div class="empty-state">Error loading flight.</div>';
      });
  });

})(window);
