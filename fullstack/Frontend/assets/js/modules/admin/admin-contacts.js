/* global It */
(function (window) {
  "use strict";

  var state = {
    page: 1,
    rows: [],
    meta: null,
    query: ""
  };

  var STATUS_LABELS = { unread: "Unread", read: "Read", resolved: "Resolved" };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderTable(rows) {
    var host = document.getElementById("contacts-table");
    var table = document.createElement("table");
    table.className = "kit-table";

    var thead = document.createElement("thead");
    var headRow = document.createElement("tr");
    ["ID", "Name", "Email", "Subject", "Message", "Status", "Received", ""].forEach(function (label, i) {
      var th = document.createElement("th");
      th.textContent = label;
      if (i === 0) th.className = "th-actions";
      if (i === 7) th.className = "th-actions";
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    var tbody = document.createElement("tbody");
    if (!rows || !rows.length) {
      var emptyRow = document.createElement("tr");
      var emptyCell = document.createElement("td");
      emptyCell.className = "kit-empty";
      emptyCell.setAttribute("colspan", "8");
      emptyCell.textContent = "No contacts found.";
      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
      table.appendChild(tbody);
      host.innerHTML = "";
      host.appendChild(table);
      renderPager();
      return;
    }

    rows.forEach(function (c) {
      var tr = document.createElement("tr");

      var idTd = document.createElement("td");
      idTd.textContent = "#" + c.id;
      tr.appendChild(idTd);

      var nameTd = document.createElement("td");
      nameTd.textContent = c.name || "\u2014";
      tr.appendChild(nameTd);

      var emailTd = document.createElement("td");
      var emailLink = document.createElement("a");
      emailLink.href = "mailto:" + esc(c.email || "");
      emailLink.textContent = c.email || "\u2014";
      emailTd.appendChild(emailLink);
      tr.appendChild(emailTd);

      var subjectTd = document.createElement("td");
      subjectTd.textContent = c.subject || "\u2014";
      tr.appendChild(subjectTd);

      var msgTd = document.createElement("td");
      msgTd.textContent = c.message || "\u2014";
      msgTd.title = c.message || "";
      tr.appendChild(msgTd);

      var statusTd = document.createElement("td");
      var chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = STATUS_LABELS[c.status] || c.status || "\u2014";
      statusTd.appendChild(chip);
      tr.appendChild(statusTd);

      var dateTd = document.createElement("td");
      dateTd.textContent = c.created_at ? new Date(c.created_at).toLocaleDateString() : "\u2014";
      tr.appendChild(dateTd);

      var actionsTd = document.createElement("td");
      actionsTd.className = "td-actions";
      if (c.status === "unread") {
        actionsTd.appendChild(actionBtn("Mark read", function () { markRead(c.id); }));
      }
      if (c.status !== "resolved") {
        actionsTd.appendChild(actionBtn("Resolve", function () { markResolved(c.id); }));
      }
      tr.appendChild(actionsTd);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    host.innerHTML = "";
    host.appendChild(table);
    renderPager();
  }

  function actionBtn(label, handler) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-primary btn-sm";
    btn.textContent = label;
    btn.style.marginInlineStart = "0.5rem";
    btn.addEventListener("click", handler);
    return btn;
  }

  function renderPager() {
    var pager = document.getElementById("contacts-pager");
    var meta = state.meta;
    if (!meta || meta.last_page <= 1) {
      pager.hidden = true;
      pager.innerHTML = "";
      return;
    }
    pager.hidden = false;
    pager.innerHTML = "";

    var info = document.createElement("span");
    info.textContent = "Page " + meta.current_page + " of " + meta.last_page + " \u00b7 " + meta.total + " messages";

    var group = document.createElement("div");
    group.className = "pager-group";

    var prev = document.createElement("button");
    prev.type = "button";
    prev.className = "pager-btn";
    prev.textContent = "Prev";
    prev.disabled = meta.current_page <= 1;
    prev.addEventListener("click", function () { load(meta.current_page - 1); });
    group.appendChild(prev);

    var next = document.createElement("button");
    next.type = "button";
    next.className = "pager-btn";
    next.textContent = "Next";
    next.disabled = meta.current_page >= meta.last_page;
    next.addEventListener("click", function () { load(meta.current_page + 1); });
    group.appendChild(next);

    pager.appendChild(info);
    pager.appendChild(group);
  }

  function load(page) {
    state.page = page;
    It.apiGet("/admin/contacts?page=" + page, { auth: true }).then(function (res) {
      var data = (res && res.body) || {};
      state.rows = data.data || [];
      state.meta = data.meta || null;
      applyFilter();
    }).catch(function () {
      It.feedback.banner("Could not load contacts.", "is-error");
    });
  }

  function applyFilter() {
    var q = state.query.trim().toLowerCase();
    var rows = state.rows;
    if (q) {
      rows = rows.filter(function (c) {
        return (c.name || "").toLowerCase().indexOf(q) !== -1 ||
          (c.email || "").toLowerCase().indexOf(q) !== -1 ||
          (c.subject || "").toLowerCase().indexOf(q) !== -1 ||
          (c.message || "").toLowerCase().indexOf(q) !== -1;
      });
    }
    renderTable(rows);
  }

  function markRead(id) {
    It.apiPatch("/admin/contacts/" + id + "/read", undefined, { auth: true }).then(function (res) {
      if (res && res.ok) {
        It.feedback.banner("Contact marked as read.", "is-ok");
        load(state.page);
      } else {
        It.feedback.banner("Could not update contact.", "is-error");
      }
    }).catch(function () {
      It.feedback.banner("Could not update contact.", "is-error");
    });
  }

  function markResolved(id) {
    It.apiPatch("/admin/contacts/" + id + "/resolve", undefined, { auth: true }).then(function (res) {
      if (res && res.ok) {
        It.feedback.banner("Contact marked as resolved.", "is-ok");
        load(state.page);
      } else {
        It.feedback.banner("Could not update contact.", "is-error");
      }
    }).catch(function () {
      It.feedback.banner("Could not update contact.", "is-error");
    });
  }

  function init() {
    if (!It.session.hasToken()) { It.session.redirectToLogin(); return; }
    It.session.currentUser().then(function (user) {
      if (!user) { It.session.redirectToLogin(); return; }
      const role = It.session.roleOf(user);
      if (!It.session.isAdminRole(role)) {
        global.location.replace(It.session.getRedirectPath(role));
        return;
      }
      var search = document.getElementById("global-search");
      if (search) {
        search.addEventListener("input", function () {
          state.query = search.value;
          applyFilter();
        });
      }
      load(1);
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})(window);
