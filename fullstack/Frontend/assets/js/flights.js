/**
 * flights.js — Flights catalog page with 20-card pagination.
 */
(function(global) {
  'use strict';
  
  var It = global.Itinari;
  if (!It || !It.app) return;

  function el(id) { return document.getElementById(id); }

  var CURRENT_PAGE = 1;
  var PER_PAGE = 20;
  var ALL_FLIGHTS = [];

  function renderFlights(flights) {
    var container = el('results');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!flights || flights.length === 0) {
      container.innerHTML = '<div class="card empty-state text-center py-10 col-span-full">No flights available.</div>';
      return;
    }
    
    flights.forEach(function(f) {
      var card = document.createElement('a');
      card.href = 'flight-details.html?id=' + f.id;
      card.className = 'card';
      card.style.display = 'block';
      card.style.textDecoration = 'none';
      card.style.color = 'inherit';
      
      var depTime = f.departure_time ? new Date(f.departure_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '10:00 AM';
      var arrTime = f.arrival_time ? new Date(f.arrival_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '02:30 PM';
      
      card.innerHTML = 
        '<div style="margin-bottom: var(--space-3); display:flex; justify-content:space-between;">' +
          '<span style="font-weight: 600;">' + It.app.esc(f.airline || f.airline_name || 'Global Airlines') + '</span>' +
          '<span style="font-family: monospace; color: var(--text-muted);">' + It.app.esc(f.flight_number || 'IT-' + f.id) + '</span>' +
        '</div>' +
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: var(--space-4);">' +
          '<div style="text-align:center;">' +
            '<div style="font-size: 1.5rem; font-weight: 700;">' + It.app.esc(f.origin || f.from || 'NYC') + '</div>' +
            '<div style="font-size: 0.85rem; color: var(--text-muted);">' + depTime + '</div>' +
          '</div>' +
          '<div style="flex:1; text-align:center; padding: 0 var(--space-3); color: var(--text-faint);">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:24px;height:24px;margin:0 auto;"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' +
            '<div style="border-top: 1px dashed var(--border); margin: 4px 0;"></div>' +
          '</div>' +
          '<div style="text-align:center;">' +
            '<div style="font-size: 1.5rem; font-weight: 700;">' + It.app.esc(f.destination || f.to || 'PAR') + '</div>' +
            '<div style="font-size: 0.85rem; color: var(--text-muted);">' + arrTime + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex; justify-content:space-between; align-items:flex-end;">' +
          '<div style="font-size: 0.85rem; color: var(--text-muted);">' + (f.available_seats != null ? f.available_seats : 14) + ' seats left</div>' +
          '<div style="font-weight: 600; font-size: 1.25rem;">' + (f.price != null ? '$' + Number(f.price).toLocaleString() : '$320') + '</div>' +
        '</div>';
        
      container.appendChild(card);
    });
  }

  function updatePage(page) {
    CURRENT_PAGE = page;
    var start = (CURRENT_PAGE - 1) * PER_PAGE;
    var paged = ALL_FLIGHTS.slice(start, start + PER_PAGE);
    renderFlights(paged);

    var container = el('results');
    var pagContainer = document.getElementById('catalog-pagination');
    if (!pagContainer && container && container.parentNode) {
      pagContainer = document.createElement('div');
      pagContainer.id = 'catalog-pagination';
      pagContainer.className = 'w-full col-span-full mt-6';
      container.parentNode.insertBefore(pagContainer, container.nextSibling);
    }
    if (pagContainer && global.ItPaginate) {
      global.ItPaginate.render({
        container: pagContainer,
        totalItems: ALL_FLIGHTS.length,
        currentPage: CURRENT_PAGE,
        itemsPerPage: PER_PAGE,
        onPageChange: function(newPage) {
          updatePage(newPage);
          if (container) container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  }

  It.app.boot(function() {
    It.apiGet('/flights')
      .then(function(res) {
        var data = It.app.unwrapData(res) || [];
        ALL_FLIGHTS = Array.isArray(data) ? data : (data.data || []);
        updatePage(1);
      })
      .catch(function(err) {
        It.app.showToast('Failed to load flights: ' + err.message, 'danger');
        var container = el('results');
        if (container) container.innerHTML = '<div class="card empty-state">Error loading flights.</div>';
      });
  });

})(window);
