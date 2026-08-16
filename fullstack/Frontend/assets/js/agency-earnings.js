/**
 * agency-earnings.js — Agency Earnings & Payouts controller.
 */
(function (global) {
  "use strict";

  const It = global.Itinari;

  function el(id) { return document.getElementById(id); }

  function renderEarnings(data) {
    if (el("val-earnings")) el("val-earnings").textContent = "$" + Number(data.total_earnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
    if (el("val-completed")) el("val-completed").textContent = data.completed_assignments || 0;
    if (el("val-active")) el("val-active").textContent = data.active_assignments || 0;
    if (el("val-status")) el("val-status").textContent = data.payout_status || "Active";

    const host = el("payouts-table-host");
    if (!host) return;

    const payouts = data.recent_payouts || [];
    if (!payouts.length) {
      host.innerHTML = '<div class="kit-empty">No payout settlement logs yet.</div>';
      return;
    }

    const table = document.createElement("table");
    table.className = "kit-table";
    table.innerHTML =
      "<thead><tr><th>Payout Ref</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>";

    const tbody = document.createElement("tbody");
    payouts.forEach(function (p) {
      const tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + p.id + "</td>" +
        "<td>" + p.date + "</td>" +
        "<td><strong>$" + Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) + "</strong></td>" +
        "<td><span class=\"badge badge-ok\">" + p.status + "</span></td>";
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    host.innerHTML = "";
    host.appendChild(table);
  }

  function load() {
    It.apiGet("/agency/earnings", { auth: true }).then(function (res) {
      const data = (res && res.data) || res || {};
      renderEarnings(data);
    }).catch(function () {
      It.feedback.banner("Could not load earnings data.", "is-error");
    });
  }

  document.addEventListener("DOMContentLoaded", load);
})(window);
