(function (global) {
  "use strict";
  var It = global.Itinari;
  if (!It || !It.app) return;

  var listEl = document.getElementById("categories-list");
  var modal = document.getElementById("category-modal");
  var form = document.getElementById("category-form");
  var modalTitle = document.getElementById("modal-title");
  
  function el(id) { return document.getElementById(id); }

  function renderCategories(cats) {
    if (!cats || !cats.length) {
      listEl.innerHTML = '<div class="empty-state" style="padding:2rem; text-align:center; color:var(--color-text-muted);">No categories found.</div>';
      return;
    }
    listEl.innerHTML = cats.map(function(c) {
      return '<div class="ticket-row" style="display:flex; justify-content:space-between; align-items:center; padding:1rem; border:1px solid var(--border-color); border-radius:8px;">' +
        '<div>' +
          '<h3 style="margin:0 0 0.25rem;">' + It.app.esc(c.name) + '</h3>' +
          '<p style="margin:0; font-size:0.85rem; color:var(--color-text-muted);">Slug: ' + It.app.esc(c.slug) + ' · Type: ' + It.app.esc(c.type) + '</p>' +
        '</div>' +
        '<div style="display:flex; gap:0.5rem;">' +
          '<button type="button" class="btn btn-outline edit-btn" data-id="' + c.id + '" data-name="' + It.app.esc(c.name) + '" data-slug="' + It.app.esc(c.slug) + '" data-type="' + It.app.esc(c.type) + '">Edit</button>' +
          '<button type="button" class="btn btn-ghost text-error delete-btn" data-id="' + c.id + '">Delete</button>' +
        '</div>' +
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
  }

  function fetchCategories() {
    It.apiGet('/admin/categories', { auth: true })
      .then(function(res) {
        var cats = It.unwrapData(res) || [];
        renderCategories(cats);
      })
      .catch(function(err) {
        It.app.showToast('Failed to load categories.', 'error');
        listEl.innerHTML = '<div class="empty-state">Error loading categories.</div>';
      });
  }

  It.app.boot(function () {
    fetchCategories();

    var createBtn = document.getElementById("create-btn");
    if (createBtn) {
      createBtn.addEventListener('click', function() {
        form.reset();
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
  });

})(window);
