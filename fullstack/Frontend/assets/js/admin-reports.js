/**
 * admin-reports.js
 */
(function(global) {
  'use strict';
  
  var It = global.Itinari;
  if (!It || !It.app) return;

  function el(id) { return document.getElementById(id); }

  function formatDate(isoStr) {
    if (!isoStr) return '';
    var d = new Date(isoStr);
    return isNaN(d) ? isoStr : d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  }

  function fetchReports() {
    It.apiGet('/v1/admin/reports', { auth: true })
      .then(function(res) {
        var reports = It.app.unwrapData(res) || [];
        renderReports(reports);
      })
      .catch(function(err) {
        It.app.showToast('Failed to load reports', 'danger');
        var container = el('reports-list');
        if (container) container.innerHTML = '<div class="empty-state">Could not load reports.</div>';
      });
  }

  function renderReports(reports) {
    var container = el('reports-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (reports.length === 0) {
      container.innerHTML = '<div class="empty-state" style="padding: 2rem; text-align: center; color: var(--color-text-muted);">No reports generated yet.</div>';
      return;
    }
    
    reports.forEach(function(report) {
      var card = document.createElement('div');
      card.className = 'ticket';
      card.style.display = 'flex';
      card.style.justifyContent = 'space-between';
      card.style.alignItems = 'center';
      
      var icon = report.format === 'csv' ? 'fa-file-csv' : 'fa-file-pdf';
      var statusBadge = It.app.badgeHtml(report.status || 'completed');
      
      card.innerHTML = 
        '<div style="display:flex; align-items:center; gap: 1rem;">' +
          '<div style="font-size: 2rem; color: var(--color-primary);"><i class="fas ' + icon + '"></i></div>' +
          '<div>' +
            '<h3 style="margin: 0 0 0.25rem 0; font-size: 1rem;">' + It.app.esc(report.type || 'Analytics') + ' Report</h3>' +
            '<div style="font-size: 0.85rem; color: var(--color-text-muted);">' + formatDate(report.created_at) + ' · ' + (report.format || 'pdf').toUpperCase() + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex; align-items:center; gap: 1rem;">' +
          statusBadge + 
          '<button type="button" class="btn btn-outline" style="padding: 0.4rem 1rem; border-radius: 4px;" onclick="downloadReport(' + report.id + ')"><i class="fas fa-download"></i> Download</button>' +
        '</div>';
        
      container.appendChild(card);
    });
  }

  global.downloadReport = function(id) {
    // Actually redirect to the endpoint or fetch blob
    var token = localStorage.getItem('itinari_token');
    window.open(It.CONFIG.apiBase + '/v1/admin/reports/' + id + '/download?token=' + encodeURIComponent(token), '_blank');
  };

  function initForm() {
    var btn = el('generate-btn');
    var modal = el('generate-modal');
    var form = el('generate-form');
    var submitBtn = el('submit-generate-btn');

    if (btn && modal) {
      btn.addEventListener('click', function() {
        modal.showModal();
      });
    }

    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        var type = el('report-type').value;
        var format = el('report-format').value;
        var range = el('report-range').value;
        
        var toDate = new Date();
        var fromDate = new Date();
        if (range === '30d') {
          fromDate.setDate(fromDate.getDate() - 30);
        } else if (range === '90d') {
          fromDate.setDate(fromDate.getDate() - 90);
        } else if (range === 'year') {
          fromDate.setMonth(0, 1);
        } else {
          fromDate.setFullYear(2020, 0, 1);
        }
        var fromStr = fromDate.toISOString().split('T')[0];
        var toStr = toDate.toISOString().split('T')[0];
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Generating...';

        It.apiPost('/v1/admin/reports/generate', {
          type: type,
          format: format,
          from: fromStr,
          to: toStr
        }, { auth: true }).then(function(res) {
          modal.close();
          It.app.showToast('Report generation started', 'success');
          fetchReports();
        }).catch(function(err) {
          It.app.showToast('Failed to generate: ' + err.message, 'danger');
        }).finally(function() {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Generate';
        });
      });
    }
  }

  It.app.boot(function(user, role) {
    if (role !== 'admin' && role !== 'super_admin') {
      window.location.href = '../login.html';
      return;
    }
    
    // Inject font-awesome for icons in admin (if not already present in admin.css)
    if (!document.querySelector('link[href*="font-awesome"]')) {
      var fa = document.createElement('link');
      fa.rel = 'stylesheet';
      fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
      document.head.appendChild(fa);
    }
    
    initForm();
    fetchReports();
  });

})(window);
