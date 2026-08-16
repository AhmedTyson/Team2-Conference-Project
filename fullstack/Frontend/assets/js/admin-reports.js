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

  function updateKpis() {
    var total = state.allReports.length;
    var pdfCount = 0;
    var csvCount = 0;
    var latestDate = "—";

    state.allReports.forEach(function (r) {
      var fmt = (r.format || "").toLowerCase();
      if (fmt === "pdf") pdfCount++;
      else if (fmt === "csv") csvCount++;
    });

    if (total > 0 && state.allReports[0] && state.allReports[0].created_at) {
      latestDate = formatDate(state.allReports[0].created_at).split(" ")[0];
    }

    if (el("kpi-total-reports")) el("kpi-total-reports").textContent = total;
    if (el("kpi-pdf-count")) el("kpi-pdf-count").textContent = pdfCount;
    if (el("kpi-csv-count")) el("kpi-csv-count").textContent = csvCount;
    if (el("kpi-latest-date")) el("kpi-latest-date").textContent = latestDate;
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
    updateKpis();
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
          '<button type="button" class="btn-sm btn-secondary download-btn" data-id="' + report.id + '" data-format="' + (report.format || 'pdf') + '" style="display:inline-flex; align-items:center; gap:0.4rem;">' +
            '⬇ Download' +
          '</button>' +
        '</div>';
        
      container.appendChild(card);
    });

    Array.prototype.forEach.call(container.querySelectorAll('.download-btn'), function(btn) {
      btn.addEventListener('click', function() {
        var id = btn.getAttribute('data-id');
        var format = btn.getAttribute('data-format') || 'pdf';
        downloadReport(id, format, btn);
      });
    });

    renderPager();
  }

  function showDownloadToast(status, message, filename) {
    var toast = document.getElementById("download-toaster");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "download-toaster";
      toast.style.cssText = "position: fixed; bottom: 2.25rem; right: 2.25rem; z-index: 99999; display: flex; align-items: center; gap: 1rem; padding: 1.1rem 1.35rem; background: rgba(15, 23, 42, 0.94); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(251, 191, 36, 0.35); border-radius: 16px; color: #fff; box-shadow: 0 20px 40px rgba(0,0,0,0.65), 0 0 24px rgba(245, 158, 11, 0.18); transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1); transform: translateY(24px); opacity: 0; min-width: 330px; max-width: 450px;";
      document.body.appendChild(toast);
      setTimeout(function() {
        toast.style.transform = "translateY(0)";
        toast.style.opacity = "1";
      }, 10);
    }

    var iconHtml = '';
    var badgeColor = '#fbbf24';
    
    if (status === 'loading') {
      iconHtml = '<div style="width: 40px; height: 40px; border-radius: 50%; background: rgba(245, 158, 11, 0.15); display: flex; align-items: center; justify-content: center; border: 1px solid rgba(245, 158, 11, 0.35); color: #fbbf24; flex-shrink: 0; font-size: 1.1rem;"><i class="fas fa-circle-notch fa-spin"></i></div>';
      badgeColor = '#fbbf24';
      toast.style.borderColor = 'rgba(251, 191, 36, 0.35)';
      toast.style.boxShadow = '0 20px 40px rgba(0,0,0,0.65), 0 0 24px rgba(245, 158, 11, 0.18)';
    } else if (status === 'success') {
      iconHtml = '<div style="width: 40px; height: 40px; border-radius: 50%; background: rgba(16, 185, 129, 0.18); display: flex; align-items: center; justify-content: center; border: 1px solid rgba(16, 185, 129, 0.4); color: #10b981; flex-shrink: 0; font-size: 1.1rem;"><i class="fas fa-file-download"></i></div>';
      badgeColor = '#10b981';
      toast.style.borderColor = 'rgba(16, 185, 129, 0.45)';
      toast.style.boxShadow = '0 20px 40px rgba(0,0,0,0.65), 0 0 24px rgba(16, 185, 129, 0.22)';
    } else {
      iconHtml = '<div style="width: 40px; height: 40px; border-radius: 50%; background: rgba(239, 68, 68, 0.18); display: flex; align-items: center; justify-content: center; border: 1px solid rgba(239, 68, 68, 0.4); color: #ef4444; flex-shrink: 0; font-size: 1.1rem;"><i class="fas fa-exclamation-triangle"></i></div>';
      badgeColor = '#ef4444';
      toast.style.borderColor = 'rgba(239, 68, 68, 0.45)';
      toast.style.boxShadow = '0 20px 40px rgba(0,0,0,0.65), 0 0 24px rgba(239, 68, 68, 0.22)';
    }

    var progressTrack = status === 'loading'
      ? '<div style="width: 100%; height: 3px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; margin-top: 0.5rem;"><div style="width: 75%; height: 100%; background: linear-gradient(90deg, #d97706, #fbbf24); animation: pulseTrack 1.5s infinite linear; border-radius: 4px;"></div></div>'
      : '';

    toast.innerHTML = 
      iconHtml +
      '<div style="flex: 1; min-width: 0;">' +
        '<div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.15rem;">' +
          '<span style="font-size: 0.72rem; font-weight: 800; letter-spacing: 0.06em; color: ' + badgeColor + '; text-transform: uppercase;">EXECUTIVE DOWNLOAD</span>' +
          '<button type="button" onclick="var t=document.getElementById(\'download-toaster\'); if(t){ t.style.opacity=\'0\'; t.style.transform=\'translateY(24px)\'; setTimeout(function(){t.remove();},300); }" style="background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer; font-size: 0.9rem; padding: 0;"><i class="fas fa-times"></i></button>' +
        '</div>' +
        '<p style="margin: 0; font-size: 0.88rem; font-weight: 700; color: #fff; line-height: 1.35; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + (message || 'Processing file stream...') + '</p>' +
        (filename ? '<span style="font-size: 0.72rem; color: rgba(255,255,255,0.55); font-family: monospace; display: block; margin-top: 0.15rem;">' + filename + '</span>' : '') +
        progressTrack +
      '</div>';

    if (status === 'success' || status === 'error') {
      setTimeout(function() {
        var t = document.getElementById("download-toaster");
        if (t) {
          t.style.opacity = "0";
          t.style.transform = "translateY(24px)";
          setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 300);
        }
      }, 4500);
    }
  }

  function downloadReport(id, format, btn) {
    var ext = (format || 'pdf').toLowerCase() === 'csv' ? 'csv' : 'pdf';
    var defaultFilename = 'report-' + id + '.' + ext;

    var token = (It.readToken && It.readToken()) || localStorage.getItem('itinari_token');
    
    var apiBase = 'http://127.0.0.1:8000/api';
    if (It.CONFIG && It.CONFIG.apiBase) {
      apiBase = It.CONFIG.apiBase.replace(/\/$/, '');
    } else if (window.location && window.location.hostname) {
      apiBase = window.location.protocol + '//' + window.location.hostname + ':8000/api';
    }

    var downloadUrl = apiBase + '/admin/reports/' + id + '/download' + (token ? '?token=' + encodeURIComponent(token) : '');

    showDownloadToast('loading', 'Opening local storage download prompt...', defaultFilename);

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading...';
    }

    // Try opening download URL directly to trigger native browser Save As / Local Storage dialog
    var win = window.open(downloadUrl, '_blank');
    if (!win) {
      window.location.href = downloadUrl;
    }

    setTimeout(function() {
      showDownloadToast('success', 'Native file download sent to local storage!', defaultFilename);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '⬇ Download';
      }
    }, 1000);
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
          var now = new Date();
          var defaultTo = now.toISOString().slice(0, 10);
          var defaultFromDate = new Date();
          defaultFromDate.setDate(now.getDate() - 30);
          var defaultFrom = defaultFromDate.toISOString().slice(0, 10);

          var fromInput = el('report-from') ? el('report-from').value : '';
          var toInput = el('report-to') ? el('report-to').value : '';

          var payload = {
            type: el('report-type') ? el('report-type').value : 'financial',
            format: el('report-format') ? el('report-format').value : 'pdf',
            from: fromInput || defaultFrom,
            to: toInput || defaultTo
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
