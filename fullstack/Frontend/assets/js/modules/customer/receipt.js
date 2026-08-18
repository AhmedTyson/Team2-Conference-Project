/**
 * receipt.js — order receipt (receipt.html).
 *
 * Confirmation arrives asynchronously: Paymob redirects to the API callback
 * (`/api/v1/paymob/callback`) and the webhook fulfils the order, creating the
 * active subscription. This page polls GET /v1/me/subscription until the
 * purchased plan shows up, then renders the receipt from live data.
 *
 * Context (order_id, plan, amount) comes from sessionStorage set by
 * checkout.js, or from the `?order=` query param.
 */
(function () {
  "use strict";

  const It = window.Itinera;
  const PC = It && It.plansCore;
  if (!PC) return;

  const root = document.getElementById("receiptRoot");
  const ORDER_KEY = "itinera_order_ctx";

  const params = new URLSearchParams(global.location.search);
  let ctx = null;
  try {
    ctx = JSON.parse(sessionStorage.getItem(ORDER_KEY) || "null");
  } catch (e) { ctx = null; }
  const queryOrder = params.get("order");
  if (queryOrder && (!ctx || ctx.order_id === null)) {
    ctx = Object.assign({}, ctx || {}, { order_id: queryOrder });
  }

  const MAX_ATTEMPTS = 12;
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
    root.innerHTML =
      '<div class="glass-card p-6 receipt-card"><div class="empty-state">' +
      '<i class="fas ' + icon + '" aria-hidden="true"></i>' +
      '<h3 class="mt-4 text-lg font-bold">' + escapeHtml(title) + "</h3>" +
      (sub ? '<p class="mt-2 text-white/45 text-sm">' + escapeHtml(sub) + "</p>" : "") +
      "</div></div>";
  }

  function gate() {
    emptyState("fa-lock", "Sign in to view your receipt", "Log in to see the subscription linked to your account.");
    root.insertAdjacentHTML(
      "beforeend",
      '<div class="mt-6 flex items-center justify-center gap-4 flex-wrap">' +
      '<button type="button" class="btn-primary" id="gateLogin"><i class="fas fa-sign-in-alt" aria-hidden="true"></i>Log in</button>' +
      "</div>"
    );
    document.getElementById("gateLogin").addEventListener("click", function () {
      global.openAuthModal("login", "Sign in to view your receipt.");
    });
  }

  function renderSuccess(sub) {
    const plan = sub.plan || {};
    const cycle = plan.billing_cycle === "yearly" ? "per year" : "per month";
    const amount = sub.price_cents != null
      ? PC.fmtCents(sub.price_cents, sub.currency)
      : (ctx && ctx.amount) || "—";

    root.innerHTML =
      '<div class="glass-card p-8 receipt-card">' +
      '<div class="receipt-stamp mb-6"><i class="fas fa-check" aria-hidden="true"></i>PAID</div>' +
      '<div class="text-center mb-6">' +
      '<h3 class="text-2xl font-bold text-white">' + escapeHtml(plan.name || (ctx && ctx.plan_name) || "Plan") + " subscription</h3>" +
      '<p class="text-white/45 text-sm mt-1">Thank you — your subscription is active.</p>' +
      "</div>" +
      '<div class="border-t border-b border-dashed border-white/15 py-2">' +
      '<div class="receipt-row"><span>Subscription ID</span><span class="val">#' + escapeHtml(String(sub.id != null ? sub.id : "—")) + "</span></div>" +
      '<div class="receipt-row"><span>Order reference</span><span class="val">#' + escapeHtml(String(sub.provider_ref || (ctx && ctx.order_id) || "—")) + "</span></div>" +
      '<div class="receipt-row"><span>Status</span><span class="val text-green-400">' + escapeHtml(String(sub.status || "active")) + "</span></div>" +
      '<div class="receipt-row"><span>Amount</span><span class="val">' + escapeHtml(amount) + "</span></div>" +
      '<div class="receipt-row"><span>Billing cycle</span><span class="val">' + escapeHtml(cycle) + "</span></div>" +
      '<div class="receipt-row"><span>Started</span><span class="val">' + escapeHtml(fmtDate(sub.started_at)) + "</span></div>" +
      '<div class="receipt-row"><span>Renews on</span><span class="val">' + escapeHtml(fmtDate(sub.renews_at)) + "</span></div>" +
      "</div>" +
      '<div class="flex items-center justify-center gap-4 flex-wrap mt-6 no-print">' +
      '<a href="dashboard.html" class="btn-primary"><i class="fas fa-tachometer-alt" aria-hidden="true"></i>Go to dashboard</a>' +
      '<button type="button" class="btn-outline" id="printBtn"><i class="fas fa-print" aria-hidden="true"></i>Print receipt</button>' +
      '<a href="contact.html" class="btn-outline"><i class="fas fa-envelope" aria-hidden="true"></i>Questions?</a>' +
      "</div>" +
      "</div>";
  }

  function renderPending() {
    root.innerHTML =
      '<div class="glass-card p-8 receipt-card">' +
      '<div class="text-center">' +
      '<span class="pulse-dot"></span>' +
      '<h3 class="mt-4 text-lg font-bold text-white">Waiting for payment confirmation…</h3>' +
      '<p class="text-white/45 text-sm mt-2 max-w-sm mx-auto">Your payment page may still be open, or the bank is confirming the transaction. This receipt refreshes automatically.</p>' +
      '<div class="receipt-row mt-6"><span>Plan</span><span class="val">' + escapeHtml((ctx && ctx.plan_name) || "—") + "</span></div>" +
      '<div class="receipt-row"><span>Amount</span><span class="val">' + escapeHtml((ctx && ctx.amount) || "—") + "</span></div>" +
      '<div class="receipt-row"><span>Order reference</span><span class="val">#' + escapeHtml((ctx && ctx.order_id) || "—") + "</span></div>" +
      "</div>" +
      '<div class="flex items-center justify-center gap-4 flex-wrap mt-6">' +
      '<button type="button" class="btn-outline" id="retryBtn"><i class="fas fa-sync-alt" aria-hidden="true"></i>Check again</button>' +
      '<a href="dashboard.html" class="btn-primary"><i class="fas fa-tachometer-alt" aria-hidden="true"></i>Go to dashboard</a>' +
      "</div>" +
      "</div>";

    const retry = document.getElementById("retryBtn");
    if (retry) retry.addEventListener("click", function () { boot(); });

    const printBtn = document.getElementById("printBtn");
    if (printBtn) printBtn.addEventListener("click", function () { window.print(); });
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

    const sub = await PC.fetchSubscription();
    if (sub && matchesCtx(sub)) {
      try { sessionStorage.removeItem(ORDER_KEY); } catch (e) { /* private mode */ }
      renderSuccess(sub);
      return;
    }

    if (attempt >= MAX_ATTEMPTS) {
      renderPending();
      return;
    }

    setTimeout(function () { poll(attempt + 1); }, POLL_MS);
  }

  function boot() {
    if (!PC.isMember()) {
      gate();
      return;
    }
    renderPending();
    poll(1);
  }

  // Guest logs in through the modal → start polling immediately.
  document.addEventListener("itinera:auth", function () {
    if (PC.isMember()) boot();
  });

  boot();
})();
