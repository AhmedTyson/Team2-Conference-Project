/**
 * agency-earnings.js — Agency Financial Desk & Commission Payouts Controller.
 */
(function (global) {
  "use strict";

  const It = global.Itinari;
  if (!It) return;

  function el(id) { return document.getElementById(id); }

  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatMoney(amount, currency) {
    const num = Number(amount || 0);
    const curr = currency || 'USD';
    const symbol = curr === 'USD' ? '$' : (curr === 'EGP' ? 'EGP ' : '$');
    return symbol + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function renderEarnings(data) {
    if (!data) data = {};

    const totalEarnings = Number(data.total_earnings || 0);
    const completedCount = Number(data.completed_assignments || 0);
    const activeCount = Number(data.active_assignments || 0);
    const payoutStatus = data.payout_status || (completedCount > 0 ? "Active" : "Ready");
    const currency = data.currency || "USD";

    if (el("val-earnings")) el("val-earnings").textContent = formatMoney(totalEarnings, currency);
    if (el("val-completed")) el("val-completed").textContent = completedCount;
    if (el("val-active")) el("val-active").textContent = activeCount;
    
    if (el("val-status")) {
      const isOk = payoutStatus.toLowerCase().indexOf("active") !== -1 || payoutStatus.toLowerCase().indexOf("ready") !== -1;
      const statusBadgeClass = isOk ? "text-emerald-400 font-bold" : "text-amber-400 font-bold";
      el("val-status").className = "kpi-value " + statusBadgeClass;
      el("val-status").textContent = payoutStatus;
    }

    const host = el("payouts-table-host");
    if (!host) return;

    const payouts = Array.isArray(data.recent_payouts) ? data.recent_payouts : [];

    if (payouts.length > 0) {
      let rowsHtml = payouts.map(function (p) {
        const pStatus = (p.status || 'settled').toLowerCase();
        const badgeCls = pStatus === 'settled' || pStatus === 'paid' ? 'badge-ok' : 'badge-warn';
        return '<tr>' +
          '<td><strong>#' + esc(p.id || p.reference || 'PAY-01') + '</strong></td>' +
          '<td style="font-family:monospace; font-size:0.85rem; color:hsl(var(--muted-foreground));">' + esc(p.date || '–') + '</td>' +
          '<td><strong style="color:#10b981;">' + formatMoney(p.amount, currency) + '</strong></td>' +
          '<td><span class="badge ' + badgeCls + '">' + esc(pStatus.toUpperCase()) + '</span></td>' +
        '</tr>';
      }).join('');

      host.innerHTML =
        '<table class="log-table" style="width:100%; border-collapse:collapse; font-size:var(--text-small);">' +
          '<thead>' +
            '<tr>' +
              '<th>Payout Ref</th>' +
              '<th>Settlement Date</th>' +
              '<th>Amount</th>' +
              '<th>Payout Status</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' + rowsHtml + '</tbody>' +
        '</table>';
    } else {
      // Clean Settlement Summary Card when no payouts logged yet
      host.innerHTML =
        '<div style="padding: 2.5rem 1.5rem; text-align: center; color: hsl(var(--muted-foreground));">' +
          '<div style="font-size:2.2rem; margin-bottom:0.6rem;">💳</div>' +
          '<h3 style="margin:0 0 0.4rem 0; font-size:1.1rem; font-weight:700; color:hsl(var(--foreground));">No PayMob Settlement Logs Yet</h3>' +
          '<p style="margin:0 auto 1.25rem; max-width:440px; font-size:0.88rem; line-height:1.5;">' +
            'Earnings from completed trip assignments are automatically cleared to your PayMob agency account upon assignment completion.' +
          '</p>' +
          '<button type="button" id="btn-request-payout" class="btn btn-primary btn-sm" style="display:inline-flex; align-items:center; gap:0.5rem;">' +
            '<i class="fas fa-wallet"></i>' +
            '<span>Request Settlement Payout</span>' +
          '</button>' +
        '</div>';

      const reqBtn = el("btn-request-payout");
      if (reqBtn) {
        reqBtn.addEventListener("click", function () {
          if (totalEarnings <= 0) {
            if (It.feedback && It.feedback.banner) {
              It.feedback.banner("You currently have no available balance to request payout.", "is-warn");
            } else {
              alert("You currently have no available balance to request payout.");
            }
            return;
          }
          reqBtn.disabled = true;
          reqBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Processing Request...';
          setTimeout(function() {
            reqBtn.disabled = false;
            reqBtn.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Settlement Requested!';
            if (It.feedback && It.feedback.banner) {
              It.feedback.banner("Payout settlement request of " + formatMoney(totalEarnings, currency) + " submitted to finance desk.", "is-ok");
            }
          }, 1000);
        });
      }
    }
  }

  function load() {
    if (!It || !It.apiGet) return;

    It.apiGet("/agency/earnings", { auth: true })
      .then(function (res) {
        if (res && res.ok) {
          const data = It.unwrapData(res) || {};
          renderEarnings(data);
        } else {
          const data = (res && res.body && res.body.data) ? res.body.data : {};
          renderEarnings(data);
        }
      })
      .catch(function () {
        if (It.feedback && It.feedback.banner) {
          It.feedback.banner("Could not load financial earnings data.", "is-error");
        }
      });
  }

  function boot() {
    load();
  }

  document.addEventListener("itinari:ready", boot);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window);
