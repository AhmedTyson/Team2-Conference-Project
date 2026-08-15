/**
 * admin-categories.js — Category Taxonomy Management.
 * Features: Search, Type filter, Client-side pagination, Add/Edit/Delete modals.
 */
(function (global) {
  "use strict";
  var It = global.Itinari;
  if (!It) return;

  var state = {
    allCategories: [],
    filtered: [],
    search: "",
    typeFilter: "",
    page: 1,
    pageSize: 15
  };

  var listEl = document.getElementById("categories-list");
  var modal = document.getElementById("category-modal");
  var form = document.getElementById("category-form");
  var modalTitle = document.getElementById("modal-title");

  function el(id) { return document.getElementById(id); }

  function applyFilter() {
    var q = state.search.trim().toLowerCase();
    var tf = state.typeFilter;

    state.filtered = state.allCategories.filter(function (c) {
      var matchQ = !q || (c.name && c.name.toLowerCase().indexOf(q) !== -1) || (c.slug && c.slug.toLowerCase().indexOf(q) !== -1);
      var matchType = !tf || (c.type && c.type.toLowerCase() === tf.toLowerCase());
      return matchQ && matchType;
    });

    state.page = 1;
    renderCategories();
  }

  function renderPager() {
    var existingPager = document.getElementById("categories-pager");
    if (existingPager) existingPager.remove();

    var total = state.filtered.length;
    var totalPages = Math.ceil(total / state.pageSize) || 1;

    var pager = document.createElement("div");
    pager.id = "categories-pager";
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
    info.textContent = "Showing " + startIdx + "–" + endIdx + " of " + total + " categories";

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
        renderCategories();
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
        renderCategories();
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

  function renderCategories() {
    if (!listEl) return;

    if (!state.filtered || !state.filtered.length) {
      listEl.innerHTML = '<div class="kit-empty" style="padding:2.5rem; text-align:center; color:hsl(var(--muted-foreground));">No categories found matching your filter.</div>';
      renderPager();
      return;
    }

    var start = (state.page - 1) * state.pageSize;
    var pageItems = state.filtered.slice(start, start + state.pageSize);

    listEl.innerHTML = pageItems.map(function(c) {
      var typeBadge = '<span class="badge badge-warn">' + It.app.esc(c.type || "general") + '</span>';
      return '<div class="ticket-row" style="display:flex; justify-content:space-between; align-items:center; padding:0.85rem 1.25rem; background:hsl(var(--card)); border:1px solid hsl(var(--border) / 0.6); border-radius:8px; margin-bottom:0.5rem; transition:border-color 0.2s;">' +
        '<div>' +
          '<div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.25rem;">' +
            '<h3 style="margin:0; font-size:1rem; font-weight:600;">' + It.app.esc(c.name) + '</h3>' +
            typeBadge +
          '</div>' +
          '<p style="margin:0; font-size:0.85rem; color:hsl(var(--muted-foreground)); font-family:var(--font-mono, monospace);">slug: ' + It.app.esc(c.slug || "–") + '</p>' +
        '</div>' +
          '<button type="button" class="btn-icon btn-ghost btn-sm edit-btn" data-id="' + c.id + '" data-name="' + It.app.esc(c.name) + '" data-slug="' + It.app.esc(c.slug) + '" data-type="' + It.app.esc(c.type) + '" title="Edit Category" aria-label="Edit Category"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></button>' +
          '<button type="button" class="btn-icon btn-ghost btn-sm delete-btn" data-id="' + c.id + '" title="Delete Category" aria-label="Delete Category" style="color:hsl(var(--destructive));"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>' +
      '</div>';
    }).join('');

    Array.prototype.forEach.call(listEl.querySelectorAll('.edit-btn'), function(btn) {
      btn.addEventListener('click', function() {
        el('cat-id').value = btn.getAttribute('data-id');
        el('cat-name').value = btn.getAttribute('data-name');
        el('cat-slug').value = btn.getAttribute('data-slug');
        el('cat-type').value = btn.getAttribute('data-type');
        modalTitle.textContent = "Edit Category";
        modal.showModal();
      });
    });

    Array.prototype.forEach.call(listEl.querySelectorAll('.delete-btn'), function(btn) {
      btn.addEventListener('click', function() {
        if (!confirm("Are you sure you want to delete this category?")) return;
        var id = btn.getAttribute('data-id');
        It.apiDelete('/admin/categories/' + id, { auth: true })
          .then(function(res) {
            if (res.ok) {
              It.app.showToast('Category deleted successfully.', 'success');
              fetchCategories();
            } else {
              It.app.showToast((res.body && res.body.message) || 'Failed to delete.', 'error');
            }
          })
          .catch(function() {
            It.app.showToast('Failed to delete category.', 'error');
          });
      });
    });

    renderPager();
  }

  function fetchCategories() {
    listEl.innerHTML = '<div class="skeleton-rect" style="height: 60px; margin-bottom: 0.5rem;"></div><div class="skeleton-rect" style="height: 60px;"></div>';
    It.apiGet('/admin/categories', { auth: true })
      .then(function(res) {
        state.allCategories = It.unwrapData(res) || [];
        applyFilter();
      })
      .catch(function() {
        It.app.showToast('Failed to load categories.', 'error');
        listEl.innerHTML = '<div class="kit-error" style="padding:1.5rem; text-align:center;">Error loading categories.</div>';
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

    var typeFilter = document.getElementById("type-filter");
    if (typeFilter) {
      typeFilter.addEventListener("change", function () {
        state.typeFilter = typeFilter.value;
        applyFilter();
      });
    }

    var createBtn = document.getElementById("create-btn");
    if (createBtn) {
      createBtn.addEventListener('click', function() {
        if (form) form.reset();
        el('cat-id').value = "";
        modalTitle.textContent = "Add Category";
        modal.showModal();
      });
    }

    if (form) {
      form.addEventListener('submit', function(e) {
        if (form.method === 'dialog') {
          e.preventDefault();
          var id = el('cat-id').value;
          var payload = {
            name: el('cat-name').value,
            slug: el('cat-slug').value,
            type: el('cat-type').value
          };
          var req = id 
            ? It.apiPut('/admin/categories/' + id, payload, { auth: true })
            : It.apiPost('/admin/categories', payload, { auth: true });
          
          req.then(function(res) {
            if (res.ok) {
              It.app.showToast('Category saved!', 'success');
              modal.close();
              fetchCategories();
            } else {
              It.app.showToast((res.body && res.body.message) || 'Save failed.', 'error');
            }
          }).catch(function() {
            It.app.showToast('Save failed.', 'error');
          });
        }
      });
    }

    fetchCategories();
  }

  document.addEventListener("itinari:ready", boot);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window);
