/**
 * agency-inquiries.js — Agency Customer Inquiries controller.
 */
(function (global) {
  "use strict";

  const It = global.Itinari;

  function el(id) { return document.getElementById(id); }

  function renderInquiries(rows) {
    const host = el("inquiries-host");
    if (!host) return;

    if (!rows || !rows.length) {
      host.innerHTML = '<div class="kit-empty">No pending customer inquiries. Direct messages from assigned travelers will appear here.</div>';
      return;
    }

    const table = document.createElement("table");
    table.className = "kit-table";
    table.innerHTML =
      "<thead><tr><th>Assignment ID</th><th>Customer</th><th>Status</th><th>Last Activity</th><th>Chat Action</th></tr></thead>";

    const tbody = document.createElement("tbody");
    rows.forEach(function (r) {
      const tr = document.createElement("tr");
      const status = r.status || "requested";
      const custName = r.customer ? (r.customer.name || r.customer.email) : "Customer #" + r.customer_id;

      tr.innerHTML =
        "<td>#" + r.id + "</td>" +
        "<td><strong>" + custName + "</strong></td>" +
        "<td><span class=\"badge badge-ok\">" + status.replace(/_/g, " ").toUpperCase() + "</span></td>" +
        "<td>" + (r.updated_at ? new Date(r.updated_at).toLocaleDateString() : "Today") + "</td>" +
        "<td><a href=\"../app/chat.html?assignment_id=" + r.id + "\" class=\"btn btn-primary btn-sm\"><i class=\"fas fa-comments mr-1\"></i> Open Chat</a></td>";

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    host.innerHTML = "";
    host.appendChild(table);
  }

  function load() {
    It.apiGet("/agency/assignments", { auth: true }).then(function (res) {
      const rows = (res && res.data) || res || [];
      renderInquiries(rows);
    }).catch(function () {
      It.feedback.banner("Could not load inquiries.", "is-error");
    });
  }

  document.addEventListener("DOMContentLoaded", load);
})(window);
