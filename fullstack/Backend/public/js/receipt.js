/**
 * receipt.js — Order Receipt & Subscription Verification Controller (receipt.html).
 *
 * Flow:
 *   1. Paymob redirects to API / frontend with transaction parameters, or user lands after checkout.
 *   2. Checks session. If guest, prompts login.
 *   3. If URL indicates failure (?success=false or ?cancelled=true), renders failed/cancelled state.
 *   4. Otherwise, polls GET /api/me/subscription to verify active status.
 *   5. Renders verified Paid receipt with subscription ID, reference, plan, dates, and print option.
 */
(function (global) {
  "use strict";

  const It = global.Itinari || (global.Itinari = {});
  const PC = It && It.plansCore;
  if (!PC) return;

  const root = document.getElementById("receiptRoot");
  const ORDER_KEY = "itinera_order_ctx";

  const params = new URLSearchParams(global.location.search);
  let ctx = null;
  try {
    ctx = JSON.parse(sessionStorage.getItem(ORDER_KEY) || "null");
  } catch (e) { ctx = null; }

  const queryOrder = params.get("order") || params.get("merchant_order_id") || params.get("reference");
  if (queryOrder && (!ctx || !ctx.order_id)) {
    ctx = Object.assign({}, ctx || {}, { order_id: queryOrder });
  }

  const isFailedParam = params.get("success") === "false" || params.get("status") === "failed";
  const isCancelledParam = params.get("cancelled") === "true" || params.get("status") === "cancelled";

  const MAX_ATTEMPTS = 15;
  const POLL_MS = 2500;

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" });
  }

  function emptyState(icon, title, sub) {
    return (
      '<div class="glass-card p-8 receipt-card text-center">' +
      '<i class="fas ' + icon + ' text-4xl text-white/30 mb-4" aria-hidden="true"></i>' +
      '<h3 class="text-xl font-bold text-white">' + escapeHtml(title) + "</h3>" +
      (sub ? '<p class="mt-2 text-white/50 text-sm max-w-md mx-auto">' + escapeHtml(sub) + "</p>" : "") +
      "</div>"
    );
  }

  function gate() {
    root.innerHTML =
      emptyState("fa-lock text-amber-400", "Sign in to view your receipt", "Please sign in to see the subscription status linked to your account.") +
      '<div class="mt-6 flex items-center justify-center gap-4 flex-wrap">' +
      '<button type="button" class="btn-primary" id="gateLogin"><i class="fas fa-sign-in-alt mr-2" aria-hidden="true"></i>Log in</button>' +
      '</div>';

    const loginBtn = document.getElementById("gateLogin");
    if (loginBtn) {
      loginBtn.addEventListener("click", function () {
        if (typeof global.openAuthModal === "function") {
          global.openAuthModal("login", "Sign in to view your receipt.");
        }
      });
    }
  }

  function renderFailed(isCancelled) {
    const title = isCancelled ? "Payment Cancelled" : "Payment Unsuccessful";
    const desc = isCancelled
      ? "Your transaction was cancelled. No charges were made to your account."
      : "The payment could not be completed by Paymob. Please check your payment details or try another card.";

    root.innerHTML =
      '<div class="glass-card p-8 receipt-card text-center">' +
      '<div class="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-2xl mx-auto mb-4"><i class="fas fa-xmark"></i></div>' +
      '<h3 class="text-2xl font-bold text-white">' + escapeHtml(title) + '</h3>' +
      '<p class="text-sm text-white/50 mt-2 max-w-md mx-auto">' + escapeHtml(desc) + '</p>' +
      '<div class="flex items-center justify-center gap-4 flex-wrap mt-8">' +
      '<a href="../plans.html" class="btn-primary"><i class="fas fa-rotate-right mr-2"></i>Choose a Plan</a>' +
      '<a href="dashboard.html" class="btn-outline">Go to Dashboard</a>' +
      '</div>' +
      '</div>';
  }

  function renderSuccess(sub) {
    const plan = sub.plan || {};
    const cycle = plan.billing_cycle === "yearly" ? "per year" : "per month";
    const amount = sub.price_cents != null
      ? PC.fmtCents(sub.price_cents, sub.currency)
      : (ctx && ctx.amount) || "—";

    root.innerHTML =
      '<div class="glass-card p-8 receipt-card">' +
      '<div class="receipt-stamp mb-6"><i class="fas fa-check mb-1" aria-hidden="true"></i>PAID</div>' +
      '<div class="text-center mb-6">' +
      '<h3 class="text-2xl font-black text-white">' + escapeHtml(plan.name || (ctx && ctx.plan_name) || "Membership") + " Subscription</h3>" +
      '<p class="text-emerald-400 text-sm font-semibold mt-1 flex items-center justify-center gap-1.5"><i class="fas fa-circle-check"></i> Active & Verified</p>' +
      "</div>" +
      '<div class="border-t border-b border-dashed border-white/15 py-3 space-y-1">' +
      '<div class="receipt-row"><span>Subscription ID</span><span class="val">#' + escapeHtml(String(sub.id != null ? sub.id : "—")) + "</span></div>" +
      '<div class="receipt-row"><span>Payment Reference</span><span class="val font-mono text-xs">#' + escapeHtml(String(sub.provider_ref || (ctx && ctx.order_id) || "—")) + "</span></div>" +
      '<div class="receipt-row"><span>Status</span><span class="val text-emerald-400 font-bold uppercase tracking-wider text-xs">Active</span></div>' +
      '<div class="receipt-row"><span>Amount</span><span class="val text-amber-400 font-bold">' + escapeHtml(amount) + "</span></div>" +
      '<div class="receipt-row"><span>Billing Frequency</span><span class="val capitalize">' + escapeHtml(cycle) + "</span></div>" +
      '<div class="receipt-row"><span>Activated On</span><span class="val">' + escapeHtml(fmtDate(sub.started_at)) + "</span></div>" +
      '<div class="receipt-row"><span>Next Renewal</span><span class="val">' + escapeHtml(fmtDate(sub.renews_at)) + "</span></div>" +
      '<div class="receipt-row"><span>Monthly AI Quota</span><span class="val text-amber-400 font-bold">' + (plan.ai_quota_monthly || 0) + ' generations</span></div>' +
      "</div>" +
      '<div class="flex items-center justify-center gap-4 flex-wrap mt-8 no-print">' +
      '<a href="dashboard.html" class="btn-primary"><i class="fas fa-tachometer-alt mr-2" aria-hidden="true"></i>Go to Dashboard</a>' +
      '<button type="button" class="btn-outline" id="printBtn"><i class="fas fa-print mr-2" aria-hidden="true"></i>Print Receipt</button>' +
      '<a href="../contact.html" class="btn-outline"><i class="fas fa-envelope mr-2" aria-hidden="true"></i>Support</a>' +
      "</div>" +
      "</div>";

    const printBtn = document.getElementById("printBtn");
    if (printBtn) {
      printBtn.addEventListener("click", function () {
        window.print();
      });
    }
  }

  function renderPending() {
    root.innerHTML =
      '<div class="glass-card p-8 receipt-card text-center">' +
      '<div class="mb-4"><span class="pulse-dot"></span></div>' +
      '<h3 class="text-xl font-bold text-white">Verifying payment confirmation…</h3>' +
      '<p class="text-white/50 text-sm mt-2 max-w-md mx-auto">Paymob is confirming your payment. Entitlements and AI quota are provisioned the moment payment is verified. This page refreshes automatically.</p>' +
      '<div class="border-t border-dashed border-white/15 my-6 pt-4 text-left">' +
      (ctx && ctx.plan_name ? '<div class="receipt-row"><span>Plan</span><span class="val">' + escapeHtml(ctx.plan_name) + '</span></div>' : '') +
      (ctx && ctx.amount ? '<div class="receipt-row"><span>Amount</span><span class="val text-amber-400">' + escapeHtml(ctx.amount) + '</span></div>' : '') +
      (ctx && ctx.order_id ? '<div class="receipt-row"><span>Order reference</span><span class="val font-mono text-xs">#' + escapeHtml(ctx.order_id) + '</span></div>' : '') +
      '</div>' +
      '<div class="flex items-center justify-center gap-4 flex-wrap mt-6">' +
      '<button type="button" class="btn-outline" id="retryPollBtn"><i class="fas fa-sync-alt mr-2" aria-hidden="true"></i>Check Status Now</button>' +
      '<a href="dashboard.html" class="btn-primary">Go to Dashboard</a>' +
      '</div>' +
      '</div>';

    const retryBtn = document.getElementById("retryPollBtn");
    if (retryBtn) {
      retryBtn.addEventListener("click", function () {
        poll(1);
      });
    }
  }

  function matchesCtx(sub) {
    if (!sub) return false;
    if (sub.status !== "active") return false;
    if (ctx && ctx.plan_id != null) {
      const subPlanId = sub.plan_id != null ? Number(sub.plan_id) : (sub.plan && Number(sub.plan.id));
      if (subPlanId !== Number(ctx.plan_id)) return false;
    }
    return true;
  }

  async function poll(attempt) {
    if (!PC.isMember()) {
      gate();
      return;
    }

    try {
      const sub = await PC.fetchSubscription();
      if (sub && sub.status === "active") {
        try { sessionStorage.removeItem(ORDER_KEY); } catch (e) {}
        renderSuccess(sub);
        return;
      }
    } catch (e) {
      console.warn("Poll subscription error:", e);
    }

    if (attempt >= MAX_ATTEMPTS) {
      renderPending();
      return;
    }

    setTimeout(function () {
      poll(attempt + 1);
    }, POLL_MS);
  }

  function boot() {
    if (isFailedParam || isCancelledParam) {
      renderFailed(isCancelledParam);
      return;
    }

    if (!PC.isMember()) {
      gate();
      return;
    }

    renderPending();
    poll(1);
  }

  document.addEventListener("itinera:auth", function () {
    if (PC.isMember()) boot();
  });

  document.addEventListener("DOMContentLoaded", function () {
    boot();
  });

  boot();
})(window);
