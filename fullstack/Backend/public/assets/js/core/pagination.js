/**
 * pagination.js — Canonical Response Unwrapping & Pagination Controller
 * Handles Laravel LengthAwarePaginator metadata & renders accessible UI controls.
 * 
 * @module core/pagination
 */
(function (global) {
  'use strict';

  var ItPagination = {
    /**
     * Unwraps any API response payload and extracts data records + pagination metadata.
     * @param {Object} res API response
     * @returns {{ items: Array, meta: { currentPage: number, lastPage: number, perPage: number, total: number, from: number, to: number } }}
     */
    unwrap: function (res) {
      if (!res) return { items: [], meta: { currentPage: 1, lastPage: 1, perPage: 15, total: 0, from: 0, to: 0 } };

      var payload = res.body !== undefined ? res.body : res;
      var rawData = payload.data !== undefined ? payload.data : payload;
      var rawMeta = payload.meta || (res.meta !== undefined ? res.meta : null);

      var items = [];
      if (Array.isArray(rawData)) {
        items = rawData;
      } else if (rawData && Array.isArray(rawData.data)) {
        items = rawData.data;
        if (!rawMeta && rawData.current_page) {
          rawMeta = rawData;
        }
      } else if (rawData && typeof rawData === 'object') {
        items = [rawData];
      }

      var meta = {
        currentPage: 1,
        lastPage: 1,
        perPage: items.length || 15,
        total: items.length,
        from: items.length ? 1 : 0,
        to: items.length
      };

      if (rawMeta) {
        meta.currentPage = rawMeta.current_page || rawMeta.currentPage || 1;
        meta.lastPage = rawMeta.last_page || rawMeta.lastPage || 1;
        meta.perPage = rawMeta.per_page || rawMeta.perPage || 15;
        meta.total = rawMeta.total !== undefined ? rawMeta.total : items.length;
        meta.from = rawMeta.from !== undefined ? rawMeta.from : (meta.currentPage - 1) * meta.perPage + 1;
        meta.to = rawMeta.to !== undefined ? rawMeta.to : Math.min(meta.currentPage * meta.perPage, meta.total);
      }

      return { items: items, meta: meta };
    },

    /**
     * Render pagination controls into a target DOM container.
     * @param {HTMLElement|string} container Target element or selector
     * @param {Object} meta Pagination metadata
     * @param {Function} onPageChange Callback when page is changed (pageNumber)
     */
    renderControls: function (container, meta, onPageChange) {
      var el = typeof container === 'string' ? document.querySelector(container) : container;
      if (!el || !meta) return;

      if (meta.lastPage <= 1) {
        el.innerHTML = '';
        el.style.display = 'none';
        return;
      }

      el.style.display = 'flex';
      var html = '<div class="pagination flex items-center justify-between gap-4 w-full py-4">';
      html += '<div class="text-xs text-white/50">Showing <span class="text-white font-medium">' + meta.from + '</span> to <span class="text-white font-medium">' + meta.to + '</span> of <span class="text-white font-medium">' + meta.total + '</span> entries</div>';
      
      html += '<div class="flex items-center gap-1.5">';
      
      // Prev Button
      var prevDisabled = meta.currentPage <= 1;
      html += '<button type="button" class="btn-page icon-btn ' + (prevDisabled ? 'opacity-40 pointer-events-none' : '') + '" data-page="' + (meta.currentPage - 1) + '" ' + (prevDisabled ? 'disabled' : '') + ' aria-label="Previous Page">&laquo; Prev</button>';

      // Page Numbers
      var start = Math.max(1, meta.currentPage - 2);
      var end = Math.min(meta.lastPage, meta.currentPage + 2);

      if (start > 1) {
        html += '<button type="button" class="btn-page" data-page="1">1</button>';
        if (start > 2) html += '<span class="px-1 text-white/30">...</span>';
      }

      for (var p = start; p <= end; p++) {
        var active = p === meta.currentPage;
        html += '<button type="button" class="btn-page ' + (active ? 'active font-bold bg-white text-black' : '') + '" data-page="' + p + '">' + p + '</button>';
      }

      if (end < meta.lastPage) {
        if (end < meta.lastPage - 1) html += '<span class="px-1 text-white/30">...</span>';
        html += '<button type="button" class="btn-page" data-page="' + meta.lastPage + '">' + meta.lastPage + '</button>';
      }

      // Next Button
      var nextDisabled = meta.currentPage >= meta.lastPage;
      html += '<button type="button" class="btn-page icon-btn ' + (nextDisabled ? 'opacity-40 pointer-events-none' : '') + '" data-page="' + (meta.currentPage + 1) + '" ' + (nextDisabled ? 'disabled' : '') + ' aria-label="Next Page">Next &raquo;</button>';

      html += '</div></div>';
      el.innerHTML = html;

      // Attach click listeners
      var buttons = el.querySelectorAll('button[data-page]');
      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var targetPage = parseInt(this.getAttribute('data-page'), 10);
          if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= meta.lastPage && targetPage !== meta.currentPage) {
            if (typeof onPageChange === 'function') {
              onPageChange(targetPage);
            }
          }
        });
      });
    }
  };

  // Expose globally
  global.ItPagination = ItPagination;
  if (global.Itinari) {
    global.Itinari.Pagination = ItPagination;
  }
})(typeof window !== 'undefined' ? window : this);
