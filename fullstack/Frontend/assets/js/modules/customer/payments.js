/**
 * payments.js — Payment History & Receipts Module
 * Fetches real payment transactions & order history from backend APIs.
 */
(function (global) {
  "use strict";

  var It = global.Itinera || {};

  function el(id) {
    return document.getElementById(id);
  }

  var currentFilter = "all";
  var searchQuery = "";
  var allPayments = [];

  function formatMoney(amount, currency) {
    currency = currency || "EGP";
    var num = typeof amount === "number" ? amount : parseFloat(amount || 0);
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency }).format(num);
  }

  function formatDate(dateStr) {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return dateStr;
    }
  }

  function getStatusBadge(status) {
    var st = (status || "pending").toLowerCase();
    if (st === "fulfilled" || st === "paid" || st === "completed") {
      return '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider"><i class="fas fa-check-circle"></i> Paid & Confirmed</span>';
    } else if (st === "pending") {
      return '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wider"><i class="fas fa-clock"></i> Pending Payment</span>';
    } else {
      return '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 uppercase tracking-wider"><i class="fas fa-times-circle"></i> Failed / Refunded</span>';
    }
  }

  function updateMetrics(payments, user) {
    var totalSpent = 0;
    var totalTxns = payments.length;

    payments.forEach(function (p) {
      var st = (p.status || "").toLowerCase();
      if (st === "fulfilled" || st === "paid" || st === "completed") {
        totalSpent += typeof p.total_amount === "number" ? p.total_amount : parseFloat(p.total_amount || 0);
      }
    });

    var totalSpentEl = el("stat-total-spent");
    var totalTxnsEl = el("stat-total-txns");
    var planNameEl = el("stat-plan-name");

    if (totalSpentEl) totalSpentEl.textContent = formatMoney(totalSpent, "EGP");
    if (totalTxnsEl) totalTxnsEl.textContent = totalTxns;
    if (planNameEl) {
      var plan = (user && (user.plan_name || (user.subscription && user.subscription.plan_name))) || "Standard Free";
      planNameEl.textContent = plan;
    }
  }

  function renderPaymentsTable(payments) {
    var container = el("payments-table-container");
    if (!container) return;

    var filtered = payments.filter(function (p) {
      var st = (p.status || "").toLowerCase();
      var matchesFilter = true;
      if (currentFilter === "paid") {
        matchesFilter = (st === "fulfilled" || st === "paid" || st === "completed");
      } else if (currentFilter === "pending") {
        matchesFilter = (st === "pending");
      } else if (currentFilter === "failed") {
        matchesFilter = (st !== "fulfilled" && st !== "paid" && st !== "completed" && st !== "pending");
      }

      var matchesSearch = true;
      if (searchQuery) {
        var q = searchQuery.toLowerCase();
        var ref = (p.merchant_order_id || p.transaction_reference || String(p.id)).toLowerCase();
        var itemName = (p.items && p.items[0] && p.items[0].name ? p.items[0].name : "").toLowerCase();
        var date = formatDate(p.created_at).toLowerCase();
        matchesSearch = ref.indexOf(q) !== -1 || itemName.indexOf(q) !== -1 || date.indexOf(q) !== -1;
      }

      return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
      container.innerHTML = '<div class="p-12 text-center text-white/50"><i class="fas fa-receipt text-3xl mb-3 text-white/30"></i><p class="text-sm font-medium">No payment transactions found in your account history.</p></div>';
      return;
    }

    var html = "";
    filtered.forEach(function (p) {
      var ref = p.merchant_order_id || p.transaction_reference || ("ORDER_" + p.id);
      var txnId = p.transaction_reference || p.paymob_transaction_id || p.id || "N/A";
      var itemName = (p.items && p.items[0] && (p.items[0].name || (p.items[0].metadata && p.items[0].metadata.name))) || "Itinera Travel Service / Plan";
      var amtStr = formatMoney(p.total_amount || (p.total_cents ? p.total_cents / 100 : 0), p.currency || "EGP");
      var badge = getStatusBadge(p.status);
      var dateStr = formatDate(p.created_at);

      html += '<div class="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.03] transition">';
      html += '  <div class="flex items-start gap-4">';
      html += '    <div class="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-lg shrink-0 mt-0.5"><i class="fas fa-receipt"></i></div>';
      html += '    <div>';
      html += '      <div class="flex items-center gap-2 mb-1">';
      html += '        <span class="font-mono text-xs font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">' + ref + '</span>';
      html += '        ' + badge;
      html += '      </div>';
      html += '      <h3 class="text-base font-bold text-white mb-1">' + itemName + '</h3>';
      html += '      <p class="text-xs text-white/60 flex items-center gap-3">';
      html += '        <span><i class="fas fa-credit-card text-white/40 mr-1"></i> Paymob 3D-Secure</span>';
      html += '        <span><i class="fas fa-clock text-white/40 mr-1"></i> ' + dateStr + '</span>';
      html += '      </p>';
      html += '    </div>';
      html += '  </div>';

      html += '  <div class="flex items-center justify-between md:justify-end gap-6 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-white/10">';
      html += '    <div class="text-left md:text-right">';
      html += '      <span class="text-lg font-black text-emerald-400 block">' + amtStr + '</span>';
      html += '      <span class="text-[11px] font-mono text-white/50">Txn ID: ' + txnId + '</span>';
      html += '    </div>';
      html += '    <div class="flex items-center gap-2">';
      html += '      <a href="payment-success.html?order_id=' + encodeURIComponent(ref) + '&success=true" class="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition flex items-center gap-1.5 border border-white/15"><i class="fas fa-eye"></i> Details</a>';
      html += '      <a href="receipt.html?order_id=' + encodeURIComponent(ref) + '&id=' + encodeURIComponent(txnId) + '" class="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-400/20"><i class="fas fa-receipt"></i> Receipt</a>';
      html += '    </div>';
      html += '  </div>';
      html += '</div>';
    });

    container.innerHTML = html;
  }

  function initTabs() {
    var tabsContainer = el("status-filter-tabs");
    if (!tabsContainer) return;

    tabsContainer.addEventListener("click", function (e) {
      var btn = e.target.closest(".tab-btn");
      if (!btn) return;

      tabsContainer.querySelectorAll(".tab-btn").forEach(function (b) {
        b.className = "tab-btn px-4 py-2 rounded-lg text-xs font-semibold text-white/70 hover:text-white transition";
      });

      btn.className = "tab-btn px-4 py-2 rounded-lg text-xs font-bold transition bg-amber-400 text-slate-950";
      currentFilter = btn.getAttribute("data-filter") || "all";
      renderPaymentsTable(allPayments);
    });
  }

  function initSearch() {
    var input = el("payments-search-input");
    if (!input) return;

    input.addEventListener("input", function () {
      searchQuery = (input.value || "").trim();
      renderPaymentsTable(allPayments);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var y = el("footerYear");
    if (y) y.textContent = new Date().getFullYear();

    initTabs();
    initSearch();

    // Fetch user orders & profile from backend API
    var apiGetFunc = (window.Itinera && window.Itinera.apiGet) || (window.Api && window.Api.get);
    if (apiGetFunc) {
      apiGetFunc("/me/orders", { auth: true })
        .then(function (res) {
          var user = (window.Itinera && window.Itinera.session && window.Itinera.session.currentUser && window.Itinera.session.currentUser()) || null;
          var data = (window.Itinera && window.Itinera.unwrapData) ? window.Itinera.unwrapData(res) : (res.body ? res.body.data : res);
          allPayments = Array.isArray(data) ? data : [];
          updateMetrics(allPayments, user);
          renderPaymentsTable(allPayments);
        })
        .catch(function () {
          allPayments = [];
          updateMetrics([], null);
          renderPaymentsTable([]);
        });
    } else {
      allPayments = [];
      updateMetrics([], null);
      renderPaymentsTable([]);
    }
  });

})(window);

})(window);
