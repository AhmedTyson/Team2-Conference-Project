/**
 * admin-users.js — Passenger manifest (Phase 16, from scratch, no kit).
 * GET /v1/admin/users · POST · PUT /{id} · PATCH /{id}/active|block.
 * UserResource: id, name, email, verified_at, is_active, created_at.
 */
(function (global) {
  "use strict";

  const It = global.Itinari;

  const URL = "/v1/admin/users";

  function el(id) { return document.getElementById(id); }

  function renderProfile(user) {
    const chip = el("user-chip");
    if (!chip) return;
    el("chip-name").textContent = user.name || "";
    el("chip-role").textContent = It.session.roleOf(user) || "admin";
    chip.hidden = false;
  }

  function fmtDate(v) {
    if (!v) return "–";
    const d = new Date(v);
    return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString();
  }

  function badge(text, tone) {
    const b = document.createElement("span");
    b.className = "badge " + tone;
    b.textContent = text;
    return b;
  }

  function setActive(id, active, btnRow) {
    const act = document.querySelector('[data-block="' + id + '"]');
    if (!btnRow) return;
    It.apiPatch(URL + "/" + id + (active ? "/active" : "/block"), {}, { auth: true }).then(function (res) {
      if (res.ok) {
        It.feedback.banner(active ? "Passenger activated." : "Passenger blocked.", "is-ok");
        load();
      } else {
        It.feedback.banner((res.body && res.body.message) || "Update failed.", "is-error");
      }
    });
  }

  function openModal(mode, row) {
    const root = el("modal-root");
    root.textContent = "";
    const isEdit = mode === "edit";
    const wrap = document.createElement("div");
    wrap.className = "kit-modal-backdrop";
    wrap.id = "user-modal";
    const nameVal = isEdit && row ? row.name || "" : "";
    const emailVal = isEdit && row ? row.email || "" : "";
    wrap.innerHTML = (
      '<div class="kit-modal" role="dialog" aria-modal="true" aria-labelledby="user-modal-title">' +
      '<div class="kit-modal-head"><h3 id="user-modal-title">' + (isEdit ? "Edit passenger" : "New passenger") + '</h3></div>' +
      '<form id="user-form" class="kit-form">' +
      '<div class="kit-modal-body">' +
      '<div class="kit-field"><label for="m-name">Name <span class="field-hint">· required</span></label>' +
      '<input id="m-name" name="name" type="text" value="' + nameVal + '" autocomplete="off" required /></div>' +
      '<div class="kit-field"><label for="m-email">Email</label>' +
      '<input id="m-email" name="email" type="email" value="' + emailVal + '" autocomplete="email" ' + (isEdit ? "disabled" : "required") + ' /></div>' +
      (isEdit ? "" : '<div class="kit-field"><label for="m-pass">Password</label><input id="m-pass" name="password" type="password" autocomplete="new-password" required /></div>') +
      '</div>' +
      '<div class="kit-modal-foot">' +
      '<button type="button" class="btn-ghost" data-close>Cancel</button>' +
      '<button type="submit" class="btn-primary is-danger" style="background:hsl(var(--primary));color:hsl(var(--primary-foreground));border:1px solid transparent;border-radius:var(--radius-md);padding:0.45rem 0.95rem;font-weight:600;cursor:pointer;">Save</button>' +
      '</div>' +
      '</form>' +
      '</div>'
    );
    root.appendChild(wrap);

    wrap.querySelector("[data-close]").addEventListener("click", closeModal);
    wrap.addEventListener("click", function (e) { if (e.target === wrap) closeModal(); });

    wrap.querySelector("#user-form").addEventListener("submit", function (e) {
      e.preventDefault();
      const payload = {
        name: wrap.querySelector("#m-name").value,
        email: wrap.querySelector("#m-email").value,
      };
      if (!isEdit) payload.password = wrap.querySelector("#m-pass").value;
      const req = isEdit
        ? It.apiPut(URL + "/" + row.id, payload, { auth: true })
        : It.apiPost(URL, payload, { auth: true });
      req.then(function (res) {
        if (res.ok) {
          closeModal();
          It.feedback.banner(isEdit ? "Passenger updated." : "Passenger created.", "is-ok");
          load();
        } else {
          const msg = (res.body && (res.body.message || (res.body.error && res.body.error.name) || res.body.error)) || "Save failed.";
          It.feedback.banner(String(msg).slice(0, 180), "is-error");
        }
      });
    });
  }

  function closeModal() {
    const root = el("modal-root");
    if (root) root.textContent = "";
  }

  function renderTable(users) {
    const host = el("users-table");
    host.textContent = "";
    if (!Array.isArray(users) || !users.length) {
      const empty = document.createElement("div");
      empty.className = "kit-empty";
      empty.textContent = "No passengers yet.";
      host.appendChild(empty);
      return;
    }
    const table = document.createElement("table");
    table.className = "kit-table";
    const thead = document.createElement("thead");
    const htr = document.createElement("tr");
    ["ID", "Name", "Email", "Verified", "Status", "Created", "Actions"].forEach(function (t) {
      const th = document.createElement("th");
      th.textContent = t;
      htr.appendChild(th);
    });
    thead.appendChild(htr);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    users.forEach(function (u) {
      const tr = document.createElement("tr");
      const td = function (content) {
        const c = document.createElement("td");
        c.appendChild(typeof content === "string" ? document.createTextNode(content) : content);
        return c;
      };
      const active = !!u.is_active;
      tr.appendChild(td(String(u.id)));
      tr.appendChild(td(u.name || "–"));
      tr.appendChild(td(u.email || "–"));
      tr.appendChild(td(u.verified_at ? "✓" : "—"));
      tr.appendChild(td(active ? badge("ACTIVE", "badge-ok") : badge("BLOCKED", "badge-off")));
      tr.appendChild(td(fmtDate(u.created_at)));

      const cell = document.createElement("td");
      cell.className = "td-actions";
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn-ghost btn-sm";
      editBtn.textContent = "Edit";
      editBtn.dataset.edit = String(u.id);
      editBtn.addEventListener("click", function () { openModal("edit", u); });
      const toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = "btn-ghost btn-sm";
      toggleBtn.textContent = active ? "Block" : "Activate";
      toggleBtn.dataset.block = String(u.id);
      toggleBtn.addEventListener("click", function () { setActive(u.id, !active); });
      cell.appendChild(editBtn);
      cell.appendChild(toggleBtn);
      tr.appendChild(cell);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    host.appendChild(table);
  }

  function load() {
    const host = el("users-table");
    if (host) { host.textContent = ""; host.innerHTML = '<div class="kit-grid-skeleton"><div class="box skeleton"></div><div class="box skeleton"></div><div class="box skeleton"></div></div>'; }
    It.apiGet(URL, { auth: true }).then(function (res) {
      if (!res.ok) {
        host.textContent = "";
        host.innerHTML = '<div class="kit-error">Could not load passengers.</div>';
        It.feedback.banner("Could not load passengers.", "is-error");
        return;
      }
      renderTable((res.body.data && res.body.data.data) || res.body.data || []);
    });
  }

  function boot(user) {
    renderProfile(user);
    const btnNew = el("btn-new");
    if (btnNew) btnNew.addEventListener("click", function () { openModal("new"); });
    load();
  }

  function init() {
    document.addEventListener("admin:search", function (e) {
      const q = String(e.detail || "").toLowerCase();
      let visible = 0;
      document.querySelectorAll("#users-table tbody tr").forEach(function (tr) {
        const show = !q || tr.textContent.toLowerCase().indexOf(q) !== -1;
        tr.style.display = show ? "" : "none";
        if (show) visible++;
      });
      if (q && !visible) {
        let er = document.getElementById("search-empty-row");
        if (!er) {
          er = document.createElement("tr");
          er.id = "search-empty-row";
          const td = document.createElement("td");
          td.colSpan = 7;
          td.className = "kit-empty";
          td.textContent = "No matches for this search.";
          er.appendChild(td);
        }
        const tb = document.querySelector("#users-table tbody");
        if (tb && !tb.contains(er)) tb.appendChild(er);
      } else {
        const er = document.getElementById("search-empty-row");
        if (er) er.remove();
      }
    });
    const logoutBtn = el("logout-btn");
    if (logoutBtn) logoutBtn.addEventListener("click", function () { It.session.logout(); });

    if (!It.session.hasToken()) { It.session.redirectToLogin(); return; }
    It.session.currentUser().then(function (user) {
      if (!user) { It.session.clearSession(); It.session.redirectToLogin(); return; }
      if (!It.session.isAdminRole(It.session.roleOf(user))) {
        It.session.clearSession();
        It.session.redirectToLogin();
        return;
      }
      boot(user);
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})(window);