/**
 * core/pagination.js — Universal Pagination UI Component (20 cards per page).
 * @date    2026-08-16
 * @purpose Renders Tailwind glassmorphism pagination controls & info counters.
 */
(function (global) {
  "use strict";

  var doc = global.document;

  function renderPagination(options) {
    // options: { container, totalItems, currentPage, itemsPerPage, onPageChange }
    var container = typeof options.container === "string" ? doc.getElementById(options.container) : options.container;
    if (!container) return;

    var totalItems = Number(options.totalItems) || 0;
    var itemsPerPage = Number(options.itemsPerPage) || 20;
    var currentPage = Number(options.currentPage) || 1;
    var totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    var startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    var endItem = Math.min(currentPage * itemsPerPage, totalItems);

    var html = `
      <div class="w-full flex flex-col sm:flex-row items-center justify-between gap-4 mt-10 pt-6 border-t border-white/10 text-xs font-sans" id="pagination-controls-bar">
        <div class="text-white/60 font-medium">
          Showing <span class="text-amber-400 font-bold">${startItem}</span>–<span class="text-amber-400 font-bold">${endItem}</span> of <span class="text-white font-bold">${totalItems}</span> results
        </div>

        <div class="flex items-center gap-1.5 flex-wrap">
          <button type="button" class="btn-prev-page px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 text-white/80 hover:text-white font-semibold transition disabled:opacity-40 disabled:pointer-events-none" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left text-[10px] mr-1"></i> Previous
          </button>
    `;

    var maxPagesToShow = 5;
    var startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    var endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    if (startPage > 1) {
      html += `<button type="button" class="btn-page-num w-8 h-8 rounded-full border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/15 transition font-bold" data-page="1">1</button>`;
      if (startPage > 2) {
        html += `<span class="px-1 text-white/40 font-bold">...</span>`;
      }
    }

    for (var p = startPage; p <= endPage; p++) {
      var isActive = p === currentPage;
      html += `<button type="button" class="btn-page-num w-8 h-8 rounded-full ${isActive ? 'bg-amber-400 text-black font-extrabold ring-2 ring-amber-400/40 shadow-lg' : 'border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/15 font-bold'} transition" data-page="${p}">${p}</button>`;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        html += `<span class="px-1 text-white/40 font-bold">...</span>`;
      }
      html += `<button type="button" class="btn-page-num w-8 h-8 rounded-full border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/15 transition font-bold" data-page="${totalPages}">${totalPages}</button>`;
    }

    html += `
          <button type="button" class="btn-next-page px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 text-white/80 hover:text-white font-semibold transition disabled:opacity-40 disabled:pointer-events-none" ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}>
            Next <i class="fas fa-chevron-right text-[10px] ml-1"></i>
          </button>
        </div>
      </div>
    `;

    container.innerHTML = html;

    var prevBtn = container.querySelector(".btn-prev-page");
    if (prevBtn) {
      prevBtn.onclick = function () {
        if (currentPage > 1 && options.onPageChange) options.onPageChange(currentPage - 1);
      };
    }

    var nextBtn = container.querySelector(".btn-next-page");
    if (nextBtn) {
      nextBtn.onclick = function () {
        if (currentPage < totalPages && options.onPageChange) options.onPageChange(currentPage + 1);
      };
    }

    var numBtns = container.querySelectorAll(".btn-page-num");
    numBtns.forEach(function (btn) {
      btn.onclick = function () {
        var pageNum = Number(btn.getAttribute("data-page"));
        if (pageNum && pageNum !== currentPage && options.onPageChange) options.onPageChange(pageNum);
      };
    });
  }

  global.ItPaginate = {
    render: renderPagination
  };
})(window);
