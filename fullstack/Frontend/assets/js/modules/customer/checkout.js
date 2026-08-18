/**
 * checkout.js — plan checkout (checkout.html).
 *
 * Flow (matches the live backend):
 *   1. `?plan=<id>` selects a plan from GET /v1/plans.
 *   2. Guests see an auth gate → modal → continue after login.
 *   3. Free plans (price_cents === 0) cannot be purchased via the payment
 *      gateway ("Invalid order amount") — they are the default for accounts,
 *      so we show a "Free — included" state instead of a pay button.
 *   4. Members with an active subscription on the same plan see an "already
 *      subscribed" state; on another plan they get an upgrade banner.
 *   5. Paid plans → billing form → POST /v1/checkout/initiate
 *      { type: "subscription", plan_id, billing } → redirect to
 *      data.checkout_url. Context is stashed in sessionStorage for the
 *      receipt page.
 *   6. Failed initiate (gateway keys missing etc.) → toast with the API
 *      message; the order is never created, nothing to refund.
 */
(function () {
  "use strict";

  const It = window.Itinera;
  const PC = It && It.plansCore;
  if (!PC) return;

  const root = document.getElementById("checkoutRoot");
  const ORDER_KEY = "itinera_order_ctx";

  const params = new URLSearchParams(global.location.search);
  const planParam = params.get("plan");

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function toast(msg, isError) {
    if (typeof global.toast === "function") global.toast(msg, isError);
  }

  function card(inner, cls) {
    return '<div class="glass-card p-6 ' + (cls || "") + '">' + inner + "</div>";
  }

  function emptyState(title, sub) {
    return card(
      '<div class="empty-state">' +
      '<i class="fas fa-credit-card" aria-hidden="true"></i>' +
      '<h3 class="mt-4 text-lg font-bold">' + escapeHtml(title) + "</h3>" +
      (sub ? '<p class="mt-2 text-white/45 text-sm">' + escapeHtml(sub) + "</p>" : "") +
      "</div>"
    );
  }

  /* ── Auth gate (guests) ─────────────────────────────────────── */

  function renderGate() {
    root.innerHTML =
      emptyState("Sign in to continue", "You need an account to subscribe to a plan.") +
      '<div class="mt-6 flex items-center justify-center gap-4 flex-wrap">' +
      '<button type="button" class="btn-primary" id="gateLogin"><i class="fas fa-sign-in-alt" aria-hidden="true"></i>Log in</button>' +
      '<button type="button" class="btn-outline" id="gateRegister"><i class="fas fa-user-plus" aria-hidden="true"></i>Create account</button>' +
      "</div>";

    document.getElementById("gateLogin").addEventListener("click", function () {
      global.openAuthModal("login", "Sign in to subscribe.");
    });
    document.getElementById("gateRegister").addEventListener("click", function () {
      global.openAuthModal("register", "Create an account to subscribe.");
    });
  }

  /* ── Same-plan / upgrade states ─────────────────────────────── */

  function renderAlreadySubscribed(plan) {
    root.innerHTML =
      emptyState("You're on the " + plan.name + " plan", "This plan is already active on your account.") +
      '<div class="mt-6 flex items-center justify-center gap-4 flex-wrap">' +
      '<a href="dashboard.html" class="btn-primary"><i class="fas fa-tachometer-alt" aria-hidden="true"></i>Go to dashboard</a>' +
      '<a href="plan-compare.html" class="btn-outline"><i class="fas fa-scale-balanced" aria-hidden="true"></i>Compare plans</a>' +
      "</div>";
  }

  function renderUpgradeBanner(current, plan) {
    const banner =
      '<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 mb-6">' +
      '<div class="flex items-center gap-3">' +
      '<i class="fas fa-arrow-trend-up text-red-400 text-2xl" aria-hidden="true"></i>' +
      "<div>" +
      '<p class="font-semibold text-white">Upgrade from ' + escapeHtml(current.plan ? current.plan.name : "current plan") + " → " + escapeHtml(plan.name) + "</p>" +
      '<p class="text-sm text-white/50 mt-1">Your active subscription is replaced the moment the new payment is confirmed.</p>' +
      "</div></div>" +
      '<span class="plan-badge"><i class="fas fa-check-circle" aria-hidden="true"></i>Overwrites current plan</span>' +
      "</div>";
    return banner;
  }

  /* ── Free plan state ────────────────────────────────────────── */

  function renderFreePlan(plan) {
    root.innerHTML =
      emptyState("Free — included with your account", "The " + plan.name + " plan needs no payment. Every account starts here.") +
      '<div class="mt-6 flex items-center justify-center gap-4 flex-wrap">' +
      '<a href="dashboard.html" class="btn-primary"><i class="fas fa-tachometer-alt" aria-hidden="true"></i>Go to dashboard</a>' +
      '<a href="plan-compare.html" class="btn-outline"><i class="fas fa-scale-balanced" aria-hidden="true"></i>Compare plans</a>' +
      "</div>";
  }

  /* ── Paid checkout form ─────────────────────────────────────── */

  function nameParts() {
    const u = global.currentUser || {};
    const raw = u.name || "";
    const parts = String(raw).trim().split(/\s+/);
    return { first: parts[0] || "", last: parts.slice(1).join(" ") || "" };
  }

  function renderCheckoutForm(plan, currentSub) {
    const parts = nameParts();
    const cycle = plan.billing_cycle === "yearly" ? "per year" : "per month";
    const features = (Array.isArray(plan.features) ? plan.features : []).map(function (f) {
      return String(f).replace(/_/g, " ");
    });

    let html = currentSub ? renderUpgradeBanner(currentSub, plan) : "";

    html +=
      '<div class="checkout-grid">' +
      /* Left: billing form */
      "<div>" +
      card(
        '<h3 class="text-lg font-bold mb-4"><i class="fas fa-user text-red-400 mr-2" aria-hidden="true"></i>Billing details</h3>' +
        '<form id="billingForm" novalidate>' +
        '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">' +
        '<div><label class="field-label" for="bfirst">First name</label>' +
        '<input class="field-input" id="bfirst" type="text" autocomplete="given-name" value="' + escapeHtml(parts.first) + '" required /></div>' +
        '<div><label class="field-label" for="blast">Last name</label>' +
        '<input class="field-input" id="blast" type="text" autocomplete="family-name" value="' + escapeHtml(parts.last) + '" required /></div>' +
        "</div>" +
        '<div class="mb-4"><label class="field-label" for="bemail">Email</label>' +
        '<input class="field-input" id="bemail" type="email" autocomplete="email" value="' + escapeHtml((global.currentUser && global.currentUser.email) || "") + '" required /></div>' +
        '<div class="mb-4"><label class="field-label" for="bphone">Phone</label>' +
        '<input class="field-input" id="bphone" type="tel" autocomplete="tel" value="' + escapeHtml((global.currentUser && global.currentUser.phone) || "") + '" /></div>' +
        '<div class="rounded-xl border border-white/10 bg-white/5 p-4 flex items-start gap-3">' +
        '<i class="fas fa-credit-card text-red-400 mt-1" aria-hidden="true"></i>' +
        "<div class=\"text-sm text-white/60\">" +
        '<p class="font-semibold text-white/80">Paymob unified checkout</p>' +
        '<p class="mt-1">You\'ll be redirected to a secure Paymob payment page after placing the order. No card details are handled by Itinera.</p>' +
        "</div></div>" +
        '<button type="submit" id="payBtn" class="btn-primary w-full mt-5"><i class="fas fa-lock" aria-hidden="true"></i>Pay ' +
        PC.fmtCents(plan.price_cents, plan.currency) + " " + escapeHtml(cycle) + "</button>" +
        "</form>" +
        "</div>"
      ) +
      /* Right: order summary */
      "<div>" +
      card(
        '<h3 class="text-lg font-bold mb-4"><i class="fas fa-receipt text-red-400 mr-2" aria-hidden="true"></i>Order summary</h3>' +
        '<div class="flex items-center justify-between mb-2">' +
        '<span class="font-semibold text-white text-lg">' + escapeHtml(plan.name) + "</span>" +
        '<span class="plan-badge">' + escapeHtml(cycle) + "</span>" +
        "</div>" +
        '<div class="summary-row"><span>AI generations / month</span><span class="text-white font-semibold">' + (plan.ai_quota_monthly == null ? "—" : escapeHtml(String(plan.ai_quota_monthly))) + "</span></div>" +
        '<div class="border-t border-white/10 my-3"></div>' +
        '<p class="text-xs uppercase tracking-widest text-white/35 font-bold mb-2">What\'s included</p>' +
        features.map(function (f) {
          return '<div class="summary-feature"><i class="fas fa-check" aria-hidden="true"></i>' + escapeHtml(f) + "</div>";
        }).join("") +
        '<div class="border-t border-white/10 my-3"></div>' +
        '<div class="summary-row"><span>Total</span><span class="total">' + PC.fmtCents(plan.price_cents, plan.currency) + "</span></div>" +
        '<div class="summary-row !text-xs text-white/35" style="font-size:0.75rem;"><span>Billed ' + escapeHtml(cycle) + "</span><span>EGP</span></div>" +
        "</div>"
      ) +
      "</div>";

    root.innerHTML = html;

    document.getElementById("billingForm").addEventListener("submit", function (e) {
      e.preventDefault();
      pay(plan);
    });
  }

  async function pay(plan) {
    const btn = document.getElementById("payBtn");
    const first = document.getElementById("bfirst").value.trim();
    const last = document.getElementById("blast").value.trim();
    const email = document.getElementById("bemail").value.trim();
    const phone = document.getElementById("bphone").value.trim();

    if (!first || !last || !email) {
      toast("Please complete the billing fields.", true);
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Placing order…';

    try {
      const res = await It.apiPost(PC.ROUTES.checkout, {
        type: "subscription",
        plan_id: plan.id,
        billing: {
          first_name: first,
          last_name: last,
          email: email,
          phone_number: phone || "01000000000",
        },
      });

      if (!res.ok) {
        const msg = (res.body && res.body.message) || "Checkout failed. Please try again.";
        toast(msg, true);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-lock" aria-hidden="true"></i>Pay ' + PC.fmtCents(plan.price_cents, plan.currency);
        return;
      }

      const data = (res.body && res.body.data) || {};
      try {
        sessionStorage.setItem(ORDER_KEY, JSON.stringify({
          order_id: data.order_id || null,
          plan_id: plan.id,
          plan_name: plan.name,
          amount: PC.fmtCents(plan.price_cents, plan.currency),
          ts: Date.now(),
        }));
      } catch (e) { /* private mode */ }

      // Live gateway: redirect to Paymob Unified Checkout.
      if (data.checkout_url) {
        global.location.href = data.checkout_url;
        return;
      }
      // No URL (gateway stub) → go straight to the receipt to poll.
      global.location.href = "receipt.html?order=" + encodeURIComponent(data.order_id || "");
    } catch (e) {
      toast(e.name === "NetworkError" ? "Could not reach the server. Your order was not placed — please retry." : e.message || "Checkout failed.", true);
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-lock" aria-hidden="true"></i>Pay ' + PC.fmtCents(plan.price_cents, plan.currency);
    }
  }

  /* ── Boot ───────────────────────────────────────────────────── */

  async function boot() {
    if (!PC.isMember()) {
      renderGate();
      return;
    }

    const plans = await PC.fetchPlans();
    let plan = null;
    if (planParam && Array.isArray(plans)) {
      const paramLower = String(planParam).toLowerCase();
      plan = plans.find(function (p) {
        const pNameLower = (p.name || "").toLowerCase();
        return Number(p.id) === Number(planParam) ||
               pNameLower === paramLower ||
               (paramLower === "jetsetter" && (pNameLower === "pro" || Number(p.id) === 2)) ||
               (paramLower === "imperial" && (pNameLower === "business" || Number(p.id) === 3)) ||
               (paramLower === "ai_luxury" && (pNameLower === "pro" || Number(p.id) === 2));
      });
    }

    if (!plan && Array.isArray(plans) && plans.length) {
      plan = plans.find(function (p) { return Number(p.price_cents) > 0; }) || plans[0];
    }

    if (!plan) {
      root.innerHTML =
        emptyState("Plan not found", "This plan is no longer available. Pick another one below.") +
        '<div class="mt-6 flex items-center justify-center"><a href="plans.html" class="btn-primary"><i class="fas fa-tags" aria-hidden="true"></i>View plans</a></div>';
      return;
    }

    const sub = await PC.fetchSubscription();
    const currentPlan = sub && sub.plan;

    if (sub && currentPlan && Number(currentPlan.id) === planId) {
      renderAlreadySubscribed(plan);
      return;
    }

    if (Number(plan.price_cents) === 0) {
      renderFreePlan(plan);
      return;
    }

    renderCheckoutForm(plan, sub && currentPlan ? sub : null);
  }

  // After a successful login through the modal (e.g. after the auth gate),
  // re-run the checkout flow with the member session.
  document.addEventListener("itinera:auth", function () {
    if (PC.isMember()) boot();
  });

  boot();
})();
