/**
 * agency-assignments.js — Agency partner ops view.
 * List from GET /v1/agency/assignments (role: agency);
 * respond via POST /v1/agency/assignments/{id}/approve | /decline.
 */
(function (global) {
  "use strict";

  const It = global.Itinari;

  function el(id) { return document.getElementById(id); }

  const STATUS_LABEL = {
    requested: "Requested",
    admin_approved: "Ready",
    agency_approved: "Accepted",
    agency_declined: "Declined",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  const STATUS_CLASS = {
    requested: "badge-off",
    admin_approved: "badge-warn",
    agency_approved: "badge-ok",
    agency_declined: "badge-danger",
    completed: "badge-ok",
    cancelled: "badge-off",
  };

  let rawAssignments = [];
  let currentFilter = "all";

  function respond(assignment, action) {
    It.apiPost("/agency/assignments/" + assignment.id + "/" + action, {}, { auth: true })
      .then(function () {
        It.feedback.banner(
          action === "approve" ? "Assignment accepted." : "Assignment declined.",
          "is-ok"
        );
        load();
      })
      .catch(function (err) {
        const msg = (err && err.message) || "Could not update the assignment.";
        It.feedback.banner(msg, "is-error");
      });
  }

  function filterAndRender() {
    const q = (el("search-input") ? el("search-input").value : "").toLowerCase().trim();
    const filtered = rawAssignments.filter(function (r) {
      const status = r.status || "requested";
      if (currentFilter !== "all" && status !== currentFilter) return false;
      if (!q) return true;
      const custName = r.customer ? (r.customer.name || r.customer.email || "") : "";
      return (
        String(r.id).includes(q) ||
        custName.toLowerCase().includes(q) ||
        status.toLowerCase().includes(q)
      );
    });
    renderTable(filtered);
  }

  function renderTable(rows) {
    const host = el("assignments-table");
    if (!host) return;

    if (!rows || !rows.length) {
      host.innerHTML = '<div class="kit-empty">No assignments found matching your filter.</div>';
      return;
    }

    const table = document.createElement("table");
    table.className = "kit-table";
    table.innerHTML =
      "<thead><tr><th>ID</th><th>Customer</th><th>Status</th><th>Trips</th><th>Assigned</th><th>Action</th></tr></thead>";

    const tbody = document.createElement("tbody");
    rows.forEach(function (r) {
      const tr = document.createElement("tr");
      const status = r.status || "requested";
      const canRespond = status === "admin_approved";

      tr.innerHTML =
        "<td>" + r.id + "</td>" +
        "<td>" + (r.customer ? (r.customer.name || r.customer.email) : "Customer #" + r.customer_id) + "</td>" +
        "<td><span class=\"badge " + (STATUS_CLASS[status] || "badge-off") + "\">" + (STATUS_LABEL[status] || status) + "</span></td>" +
        "<td>" + (r.trips && r.trips.length ? r.trips.length : "\u2014") + "</td>" +
        "<td>" + (r.created_at ? new Date(r.created_at).toLocaleDateString() : "\u2014") + "</td>";

      const actionTd = document.createElement("td");
      if (canRespond) {
        const accept = document.createElement("button");
        accept.type = "button";
        accept.className = "btn btn-primary btn-sm";
        accept.textContent = "Accept";
        accept.addEventListener("click", function () { respond(r, "approve"); });

        const decline = document.createElement("button");
        decline.type = "button";
        decline.className = "btn btn-outline btn-sm";
        decline.textContent = "Decline";
        decline.style.marginInlineStart = "0.5rem";
        decline.addEventListener("click", function () { respond(r, "decline"); });

        actionTd.appendChild(accept);
        actionTd.appendChild(decline);
      } else if (status === "agency_approved") {
        const createTrip = document.createElement("a");
        createTrip.href = "create-trip.html?assignment_id=" + r.id;
        createTrip.className = "btn btn-primary btn-sm";
        createTrip.textContent = "Create Trip";

        const completeBtn = document.createElement("button");
        completeBtn.type = "button";
        completeBtn.className = "btn btn-outline btn-sm";
        completeBtn.style.marginInlineStart = "0.5rem";
        completeBtn.textContent = "Mark Completed";
        completeBtn.addEventListener("click", function () { respond(r, "complete"); });

        actionTd.appendChild(createTrip);
        actionTd.appendChild(completeBtn);
      } else {
        actionTd.textContent = "\u2014";
      }
      tr.appendChild(actionTd);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    host.innerHTML = "";
    host.appendChild(table);
  }

  function setupControls() {
    const searchInput = el("search-input");
    if (searchInput) {
      searchInput.addEventListener("input", filterAndRender);
    }
    const filterBtns = document.querySelectorAll("[data-status-filter]");
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterBtns.forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        currentFilter = btn.getAttribute("data-status-filter") || "all";
        filterAndRender();
      });
    });
  }

  function load() {
    It.apiGet("/agency/assignments", { auth: true }).then(function (res) {
      rawAssignments = (res && res.data) || res || [];
      filterAndRender();
    }).catch(function () {
      It.feedback.banner("Could not load assignments.", "is-error");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupControls();
    load();
  });
})(window);
