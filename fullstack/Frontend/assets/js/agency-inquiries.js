(function (global) {
  "use strict";

  const It = global.Itinari;
  let allInquiries = [];
  let searchQuery = "";

  function el(id) { return document.getElementById(id); }

  function filterInquiries() {
    if (!searchQuery) return allInquiries;
    const q = searchQuery.toLowerCase().trim();
    return allInquiries.filter(function (r) {
      const custName = r.customer ? (r.customer.name || r.customer.email || "") : "";
      const status = (r.status || "").toLowerCase();
      const id = String(r.id || "");
      return custName.toLowerCase().includes(q) || status.includes(q) || id.includes(q);
    });
  }

  function renderInquiries() {
    const host = el("inquiries-host");
    if (!host) return;

    const rows = filterInquiries();

    if (!rows || !rows.length) {
      host.innerHTML = '<div class="kit-empty">No matching customer inquiries found.</div>';
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
        "<td><a href=\"../app/chat.html?assignment_id=" + r.id + "&customer_id=" + r.customer_id + "&customer=" + encodeURIComponent(custName) + "\" class=\"btn btn-primary btn-sm\"><i class=\"fas fa-comments mr-1\"></i> Open Chat</a></td>";

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    host.innerHTML = "";
    host.appendChild(table);
  }

  function bindSearch() {
    const searchInput = el("inquiry-search");
    if (searchInput) {
      searchInput.addEventListener("input", function (e) {
        searchQuery = e.target.value || "";
        renderInquiries();
      });
    }
  }

  function load() {
    bindSearch();
    It.apiGet("/agency/assignments", { auth: true }).then(function (res) {
      const raw = (res && res.data !== undefined) ? res.data : (res && res.body ? res.body.data : []);
      allInquiries = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.data) ? raw.data : []);
      renderInquiries();
    }).catch(function () {
      It.feedback.banner("Could not load inquiries.", "is-error");
    });
  }

  document.addEventListener("DOMContentLoaded", load);
})(window);
