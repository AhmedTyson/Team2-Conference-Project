/**
 * admin-kit.js — generic admin CRUD kit (Phase 10).
 * Depends on config/api/animations/session + admin.css.
 * API:
 *  const grid = It.kit.renderGrid(el, {
 *      url, columns:[{key,label,render,className}], editing:true|false,
 *      onEdit(row)|null   // open edit form
 *  });
 *  grid.load() / grid.reload() → fetch + render; delete w/ confirm; 403 → inline error.
 *
 *  It.kit.renderForm({ title, schema:[{name,label,type,required,placeholder,options,min,max,step}],
 *                      submit: (values)=>Promise<{ok,body}>, onSaved, values|null })
 *    → form element (attach to modal body). Field 422 errors → inline hint + is-error + shake.
 *  It.kit.confirm(msg, onOk) · It.kit.modal({title,body,onClose}) · It.kit.closeModal()
 */
(function (global) {
  "use strict";

  const It = global.Itinari;
  const fb = It.feedback;

  function toastError(msg) {
    if (fb && fb.banner) fb.banner(msg, "is-error");
  }

  function toastOk(msg) {
    if (fb && fb.banner) fb.banner(msg, "is-ok");
  }

  /* ---------- modal ---------- */
  let overlayEl = null;

  function modal(cfg) {
    closeModal();
    const ov = document.createElement("div");
    ov.className = "kit-modal-backdrop";
    ov.addEventListener("mousedown", function (e) {
      if (e.target === ov && cfg.onClose) cfg.onClose();
    });
    ov.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && cfg.onClose) cfg.onClose();
    });

    const box = document.createElement("div");
    box.className = "kit-modal";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("tabindex", "-1");

    const head = document.createElement("div");
    head.className = "kit-modal-head";
    const title = document.createElement("h3");
    title.textContent = cfg.title || "";
    head.appendChild(title);

    const body = document.createElement("div");
    body.className = "kit-modal-body";
    if (typeof cfg.body === "string") body.innerHTML = cfg.body;
    else if (cfg.body) body.appendChild(cfg.body);

    box.appendChild(head);
    box.appendChild(body);
    ov.appendChild(box);
    document.body.appendChild(ov);
    overlayEl = ov;
    box.focus();
    return ov;
  }

  function closeModal() {
    if (overlayEl) {
      overlayEl.remove();
      overlayEl = null;
    }
  }

  function confirm(msg, onOk) {
    const body = document.createElement("div");
    const p = document.createElement("p");
    p.className = "confirm-text";
    p.textContent = msg;
    body.appendChild(p);
    const foot = document.createElement("div");
    foot.className = "kit-modal-foot";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "btn-ghost";
    cancel.textContent = "Cancel";
    cancel.addEventListener("click", closeModal);
    const ok = document.createElement("button");
    ok.type = "button";
    ok.className = "btn-primary is-danger";
    ok.textContent = "Delete";
    ok.addEventListener("click", function () { closeModal(); onOk(); });
    foot.appendChild(cancel);
    foot.appendChild(ok);
    body.appendChild(foot);
    modal({ title: "Confirm delete", body: body, onClose: closeModal });
  }

  /* ---------- field error helpers ---------- */
  function fieldErrorEl(input) {
    if (!input) return null;
    const field = input.closest(".kit-field");
    return field ? field.querySelector(".field-error") : null;
  }

  function markFieldError(input, msg) {
    if (!input) return;
    const field = input.closest(".kit-field");
    if (field) field.classList.add("has-error");
    input.classList.add("is-error");
    const hint = field ? field.querySelector(".field-error") : null;
    if (hint) {
      hint.hidden = false;
      hint.textContent = msg;
    }
    if (fb && fb.shakeField) fb.shakeField(input);
  }

  function clearFieldError(input) {
    if (!input) return;
    const field = input.closest(".kit-field");
    if (field) field.classList.remove("has-error");
    input.classList.remove("is-error");
    const hint = field ? field.querySelector(".field-error") : null;
    if (hint) hint.hidden = true;
  }

  /* ---------- input (shared builder) ---------- */
  function buildInput(f) {
    let input;
    if (f.type === "select") {
      input = document.createElement("select");
      (f.options || []).forEach(function (opt) {
        const o = document.createElement("option");
        o.value = opt.value;
        o.textContent = opt.label;
        input.appendChild(o);
      });
    } else if (f.type === "textarea") {
      input = document.createElement("textarea");
      input.rows = f.rows || 3;
    } else {
      input = document.createElement("input");
      input.type = f.type || "text";
    }
    if (f.type === "number" && f.min !== undefined) input.min = f.min;
    if (f.type === "number" && f.max !== undefined) input.max = f.max;
    if (f.type === "number" && f.step !== undefined) input.step = f.step;
    input.id = "kit-" + f.name;
    input.name = f.name;
    if (f.placeholder) input.placeholder = f.placeholder;
    return input;
  }

  /* ---------- grid ---------- */
  function renderGrid(el, cfg) {
    el.classList.add("kit-grid");
    const api = {};
    api.data = [];

    if (cfg.toolbar) {
      const tool = document.createElement("div");
      tool.className = "kit-toolbar";
      cfg.toolbar.forEach(function (b) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn-primary btn-sm";
        btn.textContent = b.label;
        btn.addEventListener("click", function () { if (typeof b.onClick === "function") b.onClick(); });
        tool.appendChild(btn);
      });
      el.appendChild(tool);
    }

    const skeleton = document.createElement("div");
    skeleton.className = "kit-grid-skeleton";
    skeleton.innerHTML =
      '<div class="skeleton box"></div>' +
      '<div class="skeleton box"></div>' +
      '<div class="skeleton box"></div>';
    el.appendChild(skeleton);

    const search = { q: "" };
    let built = null;

    function buildTable() {
      const table = document.createElement("table");
      table.className = "kit-table";
      const thead = document.createElement("thead");
      const tr = document.createElement("tr");
      cfg.columns.forEach(function (c) {
        const th = document.createElement("th");
        th.textContent = c.label || c.key;
        tr.appendChild(th);
      });
      if (cfg.editing !== false || cfg.rowActions) {
        const th = document.createElement("th");
        th.className = "th-actions";
        th.textContent = "Actions";
        tr.appendChild(th);
      }
      thead.appendChild(tr);
      table.appendChild(thead);
      const tbody = document.createElement("tbody");
      table.appendChild(tbody);
      return { table: table, tbody: tbody };
    }

    function emptyRow(tbody, msg) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = cfg.columns.length + (cfg.editing === false && !cfg.rowActions ? 0 : 1);
      td.className = "kit-empty";
      td.textContent = msg || "No records yet.";
      tr.appendChild(td);
      tbody.appendChild(tr);
    }

    function addActionsCell(row, tr) {
      const td = document.createElement("td");
      td.className = "td-actions";
      if (cfg.rowActions) {
        cfg.rowActions(row).forEach(function (btn) {
          if (btn) td.appendChild(btn);
        });
      }
      if (cfg.editing !== false) {
        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "btn-ghost btn-sm";
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", function () { if (cfg.onEdit) cfg.onEdit(row); });
        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "btn-ghost btn-sm is-danger-text";
        delBtn.textContent = "Delete";
        delBtn.addEventListener("click", function () {
          confirm("Delete this record permanently?", function () {
            api.deleteRow(row);
          });
        });
        td.appendChild(editBtn);
        td.appendChild(delBtn);
      }
      if (td.childNodes.length) tr.appendChild(td);
    }

    function fillRow(row, tbody) {
      const tr = document.createElement("tr");
      cfg.columns.forEach(function (col) {
        const td = document.createElement("td");
        const raw = row[col.key];
        const rendered = col.render ? col.render(raw, row) : (raw == null ? "–" : String(raw));
        if (rendered && rendered.nodeType === 1) td.appendChild(rendered);
        else td.textContent = rendered == null ? "" : String(rendered);
        if (col.className) td.classList.add(col.className);
        tr.appendChild(td);
      });
      addActionsCell(row, tr);
      tbody.appendChild(tr);
    }

    function renderRows(b) {
      b.tbody.textContent = "";
      let rows = api.data;
      if (search.q) {
        const q = search.q.toLowerCase();
        rows = rows.filter(function (row) {
          return cfg.columns.some(function (col) {
            const raw = row[col.key];
            return raw != null && String(raw).toLowerCase().indexOf(q) !== -1;
          });
        });
      }
      if (!rows.length) {
        emptyRow(b.tbody, search.q ? "No matches for this search." : cfg.emptyMsg);
        return;
      }
      rows.forEach(function (row) { fillRow(row, b.tbody); });
    }

    function showError(msg) {
      skeleton.style.display = "none";
      const err = document.createElement("div");
      err.className = "kit-error";
      err.textContent = msg;
      el.appendChild(err);
    }

    api.load = function () {
      skeleton.style.display = "";
      el.querySelectorAll(".kit-error").forEach(function (n) { n.remove(); });
      const tableEl = el.querySelector(".kit-table");
      if (tableEl) tableEl.remove();
      return It.apiGet(cfg.url, { auth: true }).then(function (res) {
        skeleton.style.display = "none";
        if (!res.ok) {
          const msg = res.status === 403
            ? "No permission to view " + (cfg.label || "records") + " (403)."
            : (res.body && res.body.message) || "Could not load records.";
          showError(msg);
          return api;
        }
        let rows = res.body.data;
        if (rows && rows.data) rows = rows.data; // paginated wrapper
        api.data = Array.isArray(rows) ? rows : [];
        built = buildTable();
        el.appendChild(built.table);
        renderRows(built);
        if (!renderGrid.__searchBound) {
          renderGrid.__searchBound = true;
          document.addEventListener("admin:search", function (e) {
            search.q = String(e.detail || "").trim();
            if (built) renderRows(built);
          });
        }
        return api;
      }).catch(function (err) {
        skeleton.style.display = "none";
        showError((err && err.message) || "Could not load records.");
        return api;
      });
    };
    api.reload = api.load;

    api.deleteRow = function (row) {
      return It.apiDelete(cfg.url + "/" + row.id, { auth: true }).then(function (res) {
        if (res.ok) {
          api.reload();
          if (cfg.onDeleted) cfg.onDeleted(row);
        } else {
          toastError((res.body && res.body.message) || "Could not delete record.");
        }
      });
    };

    return api;
  }

  /* ---------- form (modal body builder) ---------- */
  function renderForm(cfg) {
    const form = document.createElement("form");
    form.className = "kit-form";
    form.noValidate = true;

    cfg.schema.forEach(function (f) {
      const field = document.createElement("div");
      field.className = "kit-field";

      const label = document.createElement("label");
      label.setAttribute("for", "kit-" + f.name);
      label.textContent = f.label || f.name;
      if (f.required) label.classList.add("is-required");
      field.appendChild(label);

      const input = buildInput(f);
      if (cfg.values && f.name in cfg.values) {
        const v = cfg.values[f.name];
        if (f.type === "select") {
          let found = false;
          Array.prototype.forEach.call(input.options, function (o, idx) {
            if (o.value === String(v)) { input.selectedIndex = idx; found = true; }
          });
          if (!found) input.selectedIndex = 0;
        } else {
          input.value = v == null ? "" : String(v);
        }
      }
      input.addEventListener("input", function () { clearFieldError(input); });
      input.addEventListener("change", function () { clearFieldError(input); });
      field.appendChild(input);

      if (f.hint) {
        const hint = document.createElement("span");
        hint.className = "field-hint";
        hint.textContent = f.hint;
        field.appendChild(hint);
      }
      const err = document.createElement("span");
      err.className = "field-error";
      err.hidden = true;
      field.appendChild(err);

      form.appendChild(field);
    });

    const foot = document.createElement("div");
    foot.className = "kit-modal-foot";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "btn-ghost";
    cancel.textContent = "Cancel";
    cancel.addEventListener("click", function () { if (cfg.onCancel) cfg.onCancel(); closeModal(); });
    const save = document.createElement("button");
    save.type = "submit";
    save.className = "btn-primary";
    save.textContent = cfg.submitLabel || "Save";
    foot.appendChild(cancel);
    foot.appendChild(save);
    form.appendChild(foot);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const payload = {};
      cfg.schema.forEach(function (f) {
        const input = form.querySelector('[name="' + f.name + '"]');
        if (!input) return;
        if (f.type === "checkbox") payload[f.name] = input.checked;
        else payload[f.name] = input.value;
      });
      if (fb && fb.loading) fb.loading(save, true);
      Promise.resolve()
        .then(function () { return cfg.submit(payload); })
        .then(function (res) {
          if (fb && fb.loading) fb.loading(save, false);
          if (res && res.ok) {
            closeModal();
            if (cfg.onSaved) cfg.onSaved(res.body);
            return;
          }
          const bodyMsg = res && res.body ? res.body : {};
          const fieldErrors = bodyMsg.errors || (bodyMsg.error && typeof bodyMsg.error === "object" ? bodyMsg.error : null);
          let handled = false;
          if (fieldErrors && typeof fieldErrors === "object" && !Array.isArray(fieldErrors)) {
            cfg.schema.forEach(function (f) {
              const list = fieldErrors[f.name];
              if (list && list.length) {
                const input = form.querySelector('[name="' + f.name + '"]');
                markFieldError(input, list[0]);
                handled = true;
              }
            });
          }
          if (!handled) {
            toastError((bodyMsg.message) || "Save failed.");
          }
        })
        .catch(function (err) {
          if (fb && fb.loading) fb.loading(save, false);
          toastError((err && err.message) || "Save failed.");
        });
    });

    return form;
  }

  /* ---------- export ---------- */
  It.kit = {
    renderGrid: renderGrid,
    renderForm: renderForm,
    confirm: confirm,
    modal: modal,
    closeModal: closeModal,
    markFieldError: markFieldError,
    clearFieldError: clearFieldError,
    toastError: toastError,
    toastOk: toastOk,
  };
})(window);