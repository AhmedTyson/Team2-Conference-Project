/**
 * admin-reports.js — Analytics Reports Generator & Archive.
 * Features: Search filtering, Format filter (PDF/CSV), Client-side pagination, Report generation, Download link.
 */
(function(global) {
  'use strict';
  
  var It = global.Itinari;
  if (!It) return;

  var state = {
    allReports: [],
    filtered: [],
    search: '',
    formatFilter: '',
    page: 1,
    pageSize: 10
  };

  function el(id) { return document.getElementById(id); }

  function formatDate(isoStr) {
    if (!isoStr) return '–';
    var d = new Date(isoStr);
    return isNaN(d) ? isoStr : d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function applyFilter() {
    var q = state.search.trim().toLowerCase();
    var ff = state.formatFilter;

    state.filtered = state.allReports.filter(function (report) {
      var matchQ = !q || 
        (report.type && report.type.toLowerCase().indexOf(q) !== -1) ||
        (report.format && report.format.toLowerCase().indexOf(q) !== -1) ||
        (report.title && report.title.toLowerCase().indexOf(q) !== -1);
      
      var f = (report.format || '').toLowerCase();
      var matchFormat = !ff || f === ff.toLowerCase();
      return matchQ && matchFormat;
    });

    state.page = 1;
    renderReports();
  }

  function renderPager() {
    var existingPager = document.getElementById("reports-pager");
    if (existingPager) existingPager.remove();

    var total = state.filtered.length;
    var totalPages = Math.ceil(total / state.pageSize) || 1;

    var pager = document.createElement("div");
    pager.id = "reports-pager";
    pager.className = "table-controls";
    pager.style.display = "flex";
    pager.style.justifyContent = "space-between";
    pager.style.alignItems = "center";
    pager.style.padding = "var(--space-3) var(--space-4)";
    pager.style.borderTop = "1px solid hsl(var(--border) / 0.6)";

    var info = document.createElement("div");
    info.className = "pager-info";
    var startIdx = total === 0 ? 0 : (state.page - 1) * state.pageSize + 1;
    var endIdx = Math.min(state.page * state.pageSize, total);
    info.textContent = "Showing " + startIdx + "–" + endIdx + " of " + total + " reports";

    var btnGroup = document.createElement("div");
    btnGroup.className = "pager-group";
    btnGroup.style.display = "flex";
    btnGroup.style.gap = "0.5rem";

    var prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "btn-sm btn-ghost";
    prevBtn.textContent = "← Prev";
    prevBtn.disabled = state.page <= 1;
    prevBtn.addEventListener("click", function () {
      if (state.page > 1) {
        state.page--;
        renderReports();
      }
    });

    var pageIndicator = document.createElement("span");
    pageIndicator.style.display = "inline-flex";
    pageIndicator.style.alignItems = "center";
    pageIndicator.style.padding = "0 0.5rem";
    pageIndicator.style.fontSize = "0.85rem";
    pageIndicator.textContent = "Page " + state.page + " of " + totalPages;

    var nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "btn-sm btn-ghost";
    nextBtn.textContent = "Next →";
    nextBtn.disabled = state.page >= totalPages;
    nextBtn.addEventListener("click", function () {
      if (state.page < totalPages) {
        state.page++;
        renderReports();
      }
    });

    btnGroup.appendChild(prevBtn);
    btnGroup.appendChild(pageIndicator);
    btnGroup.appendChild(nextBtn);

    pager.appendChild(info);
    pager.appendChild(btnGroup);

    var card = document.querySelector(".ticket-panel");
    if (card) card.appendChild(pager);
  }

  function renderReports() {
    var container = el('reports-list');
    if (!container) return;
    
    if (!state.filtered || !state.filtered.length) {
      container.innerHTML = '<div class="kit-empty" style="padding: 2.5rem; text-align: center; color: hsl(var(--muted-foreground));">No reports found matching your search.</div>';
      renderPager();
      return;
    }

    var start = (state.page - 1) * state.pageSize;
    var pageItems = state.filtered.slice(start, start + state.pageSize);
    
    container.innerHTML = '';
    pageItems.forEach(function(report) {
      var card = document.createElement('div');
      card.className = 'ticket';
      card.style.display = 'flex';
      card.style.justifyContent = 'space-between';
      card.style.alignItems = 'center';
      card.style.padding = '1rem 1.25rem';
      card.style.background = 'hsl(var(--card))';
      card.style.border = '1px solid hsl(var(--border) / 0.6)';
      card.style.borderRadius = '8px';
      card.style.marginBottom = '0.5rem';
      card.style.flexWrap = 'wrap';
      card.style.gap = '0.75rem';
      
      var isPdf = (report.format || '').toLowerCase() === 'pdf';
      var formatBadge = '<span class="badge ' + (isPdf ? 'badge-danger' : 'badge-ok') + '">' + (report.format || 'PDF').toUpperCase() + '</span>';
      var statusBadge = '<span class="badge badge-ok">' + (report.status || 'READY').toUpperCase() + '</span>';
      
      card.innerHTML = 
        '<div style="display:flex; align-items:center; gap: 1rem;">' +
          '<div>' +
            '<div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">' +
              '<h3 style="margin: 0; font-size: 1rem; font-weight:600;">' + It.app.esc(report.type ? report.type.replace(/_/g, ' ') : 'Platform Analytics') + ' Report</h3>' +
              formatBadge +
              statusBadge +
            '</div>' +
            '<div style="font-size: 0.85rem; color: hsl(var(--muted-foreground));">' + formatDate(report.created_at) + ' · Range: ' + (report.range || '30 Days') + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex; align-items:center; gap: 0.5rem;">' +
          '<button type="button" class="btn-sm btn-secondary download-btn" data-id="' + report.id + '" style="display:inline-flex; align-items:center; gap:0.4rem;">' +
            '⬇ Download' +
          '</button>' +
        '</div>';
        
      container.appendChild(card);
    });

    Array.prototype.forEach.call(container.querySelectorAll('.download-btn'), function(btn) {
      btn.addEventListener('click', function() {
        var id = btn.getAttribute('data-id');
        downloadReport(id);
      });
    });

    renderPager();
  }

  function downloadReport(id) {
    It.apiGet('/admin/reports/' + id + '/download', { auth: true })
      .then(function(res) {
        if (res.ok && res.body && res.body.data && res.body.data.download_url) {
          window.open(res.body.data.download_url, '_blank');
        } else {
          It.app.showToast('Report download initiated.', 'success');
        }
      })
      .catch(function() {
        It.app.showToast('Failed to trigger report download', 'error');
      });
  }

  function fetchReports() {
    var container = el('reports-list');
    if (container) container.innerHTML = '<div class="skeleton-rect" style="height: 60px; margin-bottom:0.5rem;"></div><div class="skeleton-rect" style="height: 60px;"></div>';

    It.apiGet('/admin/reports', { auth: true })
      .then(function(res) {
        state.allReports = It.unwrapData(res) || [];
        applyFilter();
      })
      .catch(function() {
        It.app.showToast('Failed to load reports', 'error');
        var container = el('reports-list');
        if (container) container.innerHTML = '<div class="kit-error" style="padding:1.5rem; text-align:center;">Could not load reports.</div>';
      });
  }

  var isBooted = false;
  function boot() {
    if (isBooted) return;
    isBooted = true;

    var searchInput = document.getElementById("global-search");
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        state.search = searchInput.value;
        applyFilter();
      });
    }

    var formatFilter = document.getElementById("format-filter");
    if (formatFilter) {
      formatFilter.addEventListener("change", function () {
        state.formatFilter = formatFilter.value;
        applyFilter();
      });
    }

    var genModal = el('generate-modal');
    var genBtn = el('generate-btn');
    var genForm = el('generate-form');
    
    if (genBtn && genModal) {
      genBtn.addEventListener('click', function() {
        if (genForm) genForm.reset();
        genModal.showModal();
      });
    }

    if (genForm && genModal) {
      genForm.addEventListener('submit', function(e) {
        if (genForm.method === 'dialog') {
          e.preventDefault();
          var payload = {
            type: el('report-type').value,
            format: el('report-format').value,
            range: el('report-range').value
          };
          
          var submitBtn = el('submit-generate-btn');
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Generating...';
          }
          
          It.apiPost('/admin/reports/generate', payload, { auth: true })
            .then(function(res) {
              if (res.ok) {
                It.app.showToast('Report generated successfully!', 'success');
                genModal.close();
                fetchReports();
              } else {
                It.app.showToast((res.body && res.body.message) || 'Failed to generate report', 'error');
              }
            })
            .catch(function() {
              It.app.showToast('Error generating report', 'error');
            })
            .finally(function() {
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Generate';
              }
            });
        }
      });
    }

    fetchReports();
  }

  document.addEventListener("itinari:ready", boot);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window);
