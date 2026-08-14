/**
 * checkout.js — Plan Checkout Controller (checkout.html).
 *
 * Flow (connected to existing Laravel Backend):
 *   1. `?plan=<id|slug>` selects a plan from backend API.
 *   2. Guests see an auth gate -> login modal.
 *   3. Free plans (price_cents === 0) show "Free — included" state.
 *   4. Members with an active subscription on the same plan see an "already subscribed" state;
 *      on another plan they get an upgrade banner.
 *   5. Paid plans -> pre-filled billing form -> POST /api/checkout/initiate
 *      { type: "subscription", plan_id, billing } -> redirect to data.checkout_url.
 *   6. Context is stashed in sessionStorage for receipt.html verification.
 */
(function (global) {
  "use strict";

  const It = global.Itinari || (global.Itinari = {});
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
    const toastEl = document.getElementById("toast");
    const toastMsg = document.getElementById("toastMessage");
    if (toastEl && toastMsg) {
      toastMsg.textContent = msg;
      toastEl.className = isError ? "toast toast-error show" : "toast toast-success show";
      setTimeout(function () { toastEl.classList.remove("show"); }, 4000);
    } else if (typeof global.toast === "function") {
      global.toast(msg, isError);
    } else {
      alert(msg);
    }
  }

  function card(inner, cls) {
    return '<div class="glass-card p-6 ' + (cls || "") + '">' + inner + "</div>";
  }

  function emptyState(title, sub) {
    return card(
      '<div class="empty-state text-center py-8">' +
      '<i class="fas fa-credit-card text-4xl text-white/30 mb-3" aria-hidden="true"></i>' +
      '<h3 class="mt-2 text-xl font-bold text-white">' + escapeHtml(title) + "</h3>" +
      (sub ? '<p class="mt-2 text-white/50 text-sm max-w-md mx-auto">' + escapeHtml(sub) + "</p>" : "") +
      "</div>"
    );
  }

  /* ── Auth gate (guests) ─────────────────────────────────────── */
  function renderGate() {
    root.innerHTML =
      emptyState("Sign in to continue", "You need an account to subscribe to a plan.") +
      '<div class="mt-6 flex items-center justify-center gap-4 flex-wrap">' +
      '<button type="button" class="btn-primary" id="gateLogin"><i class="fas fa-sign-in-alt mr-2" aria-hidden="true"></i>Log in</button>' +
      '<button type="button" class="btn-outline" id="gateRegister"><i class="fas fa-user-plus mr-2" aria-hidden="true"></i>Create account</button>' +
      "</div>";

    const loginBtn = document.getElementById("gateLogin");
    const regBtn = document.getElementById("gateRegister");
    if (loginBtn) {
      loginBtn.addEventListener("click", function () {
        if (typeof global.openAuthModal === "function") {
          global.openAuthModal("login", "Sign in to subscribe.");
        }
      });
    }
    if (regBtn) {
      regBtn.addEventListener("click", function () {
        if (typeof global.openAuthModal === "function") {
          global.openAuthModal("register", "Create an account to subscribe.");
        }
      });
    }
  }

  /* ── Same-plan / upgrade states ─────────────────────────────── */
  function renderAlreadySubscribed(plan) {
    root.innerHTML =
      emptyState("You're on the " + plan.name + " plan", "This plan is already active on your account.") +
      '<div class="mt-6 flex items-center justify-center gap-4 flex-wrap">' +
      '<a href="dashboard.html" class="btn-primary"><i class="fas fa-tachometer-alt mr-2" aria-hidden="true"></i>Go to dashboard</a>' +
      '<a href="../plan-compare.html" class="btn-outline"><i class="fas fa-scale-balanced mr-2" aria-hidden="true"></i>Compare plans</a>' +
      "</div>";
  }

  function renderUpgradeBanner(current, plan) {
    const currentName = (current && current.plan && current.plan.name) || "current plan";
    return (
      '<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 mb-6">' +
      '<div class="flex items-center gap-3">' +
      '<i class="fas fa-arrow-trend-up text-amber-400 text-2xl" aria-hidden="true"></i>' +
      "<div>" +
      '<p class="font-semibold text-white">Upgrade from ' + escapeHtml(currentName) + " → " + escapeHtml(plan.name) + "</p>" +
      '<p class="text-sm text-white/50 mt-0.5">Your active subscription will update automatically upon payment confirmation.</p>' +
      "</div></div>" +
      '<span class="plan-badge"><i class="fas fa-check-circle" aria-hidden="true"></i>Plan Upgrade</span>' +
      "</div>"
    );
  }

  /* ── Free plan state ────────────────────────────────────────── */
  function renderFreePlan(plan) {
    root.innerHTML =
      emptyState("Free — included with your account", "The " + plan.name + " plan requires no payment. Every account starts with full access to standard features.") +
      '<div class="mt-6 flex items-center justify-center gap-4 flex-wrap">' +
      '<a href="dashboard.html" class="btn-primary"><i class="fas fa-tachometer-alt mr-2" aria-hidden="true"></i>Go to dashboard</a>' +
      '<a href="../plans.html" class="btn-outline"><i class="fas fa-tags mr-2" aria-hidden="true"></i>Explore Paid Tiers</a>' +
      "</div>";
  }

  /* ── User info helper ───────────────────────────────────────── */
  function getBillingInfo() {
    const u = (It.session && It.session.getUser && It.session.getUser()) ||
              (It.readUser && It.readUser()) ||
              global.currentUser || {};
    const raw = u.name || "";
    const parts = String(raw).trim().split(/\s+/);
    return {
      first: parts[0] || "",
      last: parts.slice(1).join(" ") || "Traveler",
      email: u.email || "",
      phone: u.phone || "01000000000",
    };
  }

  /* ── Paid checkout form ─────────────────────────────────────── */
  function renderCheckoutForm(plan, currentSub) {
    const user = getBillingInfo();
    const cycle = plan.billing_cycle === "yearly" ? "per year" : "per month";
    const features = Array.isArray(plan.features) ? plan.features : [];

    let html = currentSub ? renderUpgradeBanner(currentSub, plan) : "";

    html +=
      '<div class="checkout-grid">' +
      /* Left: billing form */
      "<div>" +
      card(
        '<h3 class="text-lg font-bold mb-4 text-white flex items-center gap-2"><i class="fas fa-user-shield text-amber-400"></i>Billing Information</h3>' +
        '<form id="billingForm" novalidate>' +
        '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">' +
        '<div><label class="field-label" for="bfirst">First name</label>' +
        '<input class="field-input" id="bfirst" type="text" autocomplete="given-name" value="' + escapeHtml(user.first) + '" required /></div>' +
        '<div><label class="field-label" for="blast">Last name</label>' +
        '<input class="field-input" id="blast" type="text" autocomplete="family-name" value="' + escapeHtml(user.last) + '" required /></div>' +
        "</div>" +
        '<div class="mb-4"><label class="field-label" for="bemail">Email</label>' +
        '<input class="field-input" id="bemail" type="email" autocomplete="email" value="' + escapeHtml(user.email) + '" required /></div>' +
        '<div class="mb-4"><label class="field-label" for="bphone">Phone Number</label>' +
        '<input class="field-input" id="bphone" type="tel" autocomplete="tel" value="' + escapeHtml(user.phone) + '" /></div>' +
        '<div class="rounded-xl border border-white/10 bg-white/5 p-4 flex items-start gap-3 mt-4">' +
        '<i class="fas fa-shield-halved text-amber-400 mt-1"></i>' +
        '<div class="text-xs text-white/60 leading-relaxed">' +
        '<p class="font-semibold text-white/80">Paymob Unified Payment Gateway</p>' +
        '<p class="mt-0.5">You will be redirected to Paymob\'s secure payment gateway. Your payment credentials are encrypted end-to-end.</p>' +
        "</div></div>" +
        '<button type="submit" id="payBtn" class="btn-primary w-full mt-6 justify-center py-3.5 text-base font-bold flex items-center gap-2">' +
        '<i class="fas fa-lock"></i><span>Proceed to Pay ' + PC.fmtCents(plan.price_cents, plan.currency) + ' (' + escapeHtml(cycle) + ')</span>' +
        '</button>' +
        "</form>"
      ) +
      "</div>" +
      /* Right: order summary */
      "<div>" +
      card(
        '<h3 class="text-lg font-bold mb-4 text-white flex items-center gap-2"><i class="fas fa-receipt text-amber-400"></i>Order Summary</h3>' +
        '<div class="flex items-center justify-between mb-3 pb-3 border-b border-white/10">' +
        '<div>' +
        '<span class="font-bold text-white text-xl">' + escapeHtml(plan.name) + "</span>" +
        '<p class="text-xs text-white/50">' + escapeHtml(plan.billing_cycle || "monthly") + " billing</p>" +
        '</div>' +
        '<span class="plan-badge plan-badge-active">' + escapeHtml(cycle) + "</span>" +
        "</div>" +
        '<div class="summary-row"><span>AI generations</span><span class="text-amber-400 font-bold">' + (plan.ai_quota_monthly || 0) + ' / mo</span></div>' +
        '<div class="summary-row"><span>Currency</span><span class="text-white font-medium">' + escapeHtml(plan.currency || "EGP") + '</span></div>' +
        '<div class="border-t border-white/10 my-3"></div>' +
        '<p class="text-xs uppercase tracking-widest text-white/40 font-bold mb-2">Included Privileges</p>' +
        features.map(function (f) {
          return '<div class="summary-feature"><i class="fas fa-check text-emerald-400"></i><span>' + escapeHtml(String(f).replace(/_/g, " ")) + "</span></div>";
        }).join("") +
        '<div class="border-t border-white/10 my-4"></div>' +
        '<div class="summary-row !text-lg !font-extrabold text-white"><span>Total Due Today</span><span class="total text-amber-400">' + PC.fmtCents(plan.price_cents, plan.currency) + "</span></div>" +
        '<div class="summary-row !text-xs text-white/40" style="font-size:0.75rem;"><span>Recurring ' + escapeHtml(cycle) + "</span><span>Inclusive of taxes</span></div>"
      ) +
      "</div>" +
      "</div>";

    root.innerHTML = html;

    const billingForm = document.getElementById("billingForm");
    if (billingForm) {
      billingForm.addEventListener("submit", function (e) {
        e.preventDefault();
        pay(plan);
      });
    }
  }

  async function pay(plan) {
    const btn = document.getElementById("payBtn");
    const first = document.getElementById("bfirst").value.trim();
    const last = document.getElementById("blast").value.trim();
    const email = document.getElementById("bemail").value.trim();
    const phone = document.getElementById("bphone").value.trim();

    if (!first || !last || !email) {
      toast("Please complete the required billing fields (Name, Email).", true);
      return;
    }

    if (btn.disabled) return;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Initializing Secure Payment…';

    try {
      const billingData = {
        first_name: first,
        last_name: last,
        email: email,
        phone_number: phone || "01000000000",
      };

      const idempotencyKey = "sub_" + plan.id + "_" + Date.now();
      const res = await PC.initiateCheckout(plan.id, billingData, idempotencyKey);

      if (!res.ok) {
        const errMsg = (res.body && res.body.message) || (res.body && res.body.error && res.body.error.message) || "Unable to initiate payment. Please try again.";
        toast(errMsg, true);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-lock mr-2"></i> Proceed to Pay ' + PC.fmtCents(plan.price_cents, plan.currency);
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
      } catch (e) {}

      // If backend returned checkout URL, redirect to Paymob
      if (data.checkout_url) {
        toast("Redirecting to Paymob secure checkout...", false);
        setTimeout(function () {
          global.location.href = data.checkout_url;
        }, 300);
        return;
      }

      // If no URL (mock/local), navigate to receipt page
      global.location.href = "receipt.html?order=" + encodeURIComponent(data.order_id || "");

    } catch (e) {
      console.error("Checkout initiation error:", e);
      toast("A network error occurred while communicating with the checkout service.", true);
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-lock mr-2"></i> Proceed to Pay ' + PC.fmtCents(plan.price_cents, plan.currency);
    }
  }

  /* ── Boot ───────────────────────────────────────────────────── */
  async function boot() {
    if (!PC.isMember()) {
      renderGate();
      return;
    }

    root.innerHTML = '<div class="glass-card p-12 text-center text-white/50"><i class="fas fa-spinner fa-spin text-3xl mb-3 text-amber-400"></i><p>Loading plan details…</p></div>';

    try {
      const plans = await PC.fetchPlans();
      if (!plans || !plans.length) {
        root.innerHTML =
          emptyState("No Plans Available", "Pricing plans are currently unavailable. Please check back later.") +
          '<div class="mt-6 flex items-center justify-center"><a href="../plans.html" class="btn-primary"><i class="fas fa-arrow-left mr-2"></i>Back to Plans</a></div>';
        return;
      }

      let plan = null;
      if (planParam) {
        const paramLower = String(planParam).toLowerCase();
        plan = plans.find(function (p) {
          const pNameLower = p.name.toLowerCase();
          return Number(p.id) === Number(planParam) ||
                 pNameLower === paramLower ||
                 (paramLower === "jetsetter" && (pNameLower === "pro" || Number(p.id) === 2)) ||
                 (paramLower === "imperial" && (pNameLower === "business" || Number(p.id) === 3)) ||
                 (paramLower === "ai_luxury" && (pNameLower === "pro" || Number(p.id) === 2));
        });
      }

      // Default to first paid plan if none specified or resolved
      if (!plan) {
        plan = plans.find(function (p) { return Number(p.price_cents) > 0; }) || plans[0];
      }

      if (!plan) {
        root.innerHTML =
          emptyState("Plan not found", "The selected plan could not be found.") +
          '<div class="mt-6 flex items-center justify-center"><a href="../plans.html" class="btn-primary"><i class="fas fa-tags mr-2"></i>View Available Plans</a></div>';
        return;
      }

      const sub = await PC.fetchSubscription();
      const currentPlan = sub && sub.plan;

      if (sub && currentPlan && Number(currentPlan.id) === Number(plan.id) && sub.status === "active") {
        renderAlreadySubscribed(plan);
        return;
      }

      if (Number(plan.price_cents) === 0) {
        renderFreePlan(plan);
        return;
      }

      renderCheckoutForm(plan, sub && sub.status === "active" ? sub : null);

    } catch (e) {
      console.error("Failed to boot checkout:", e);
      root.innerHTML =
        emptyState("Unable to Load Checkout", "Failed to load checkout details. Please try again.") +
        '<div class="mt-6 flex items-center justify-center gap-4"><button type="button" class="btn-primary" onclick="location.reload()"><i class="fas fa-rotate-right mr-2"></i>Retry</button></div>';
    }
  }

  document.addEventListener("itinera:auth", function () {
    if (PC.isMember()) boot();
  });

  document.addEventListener("DOMContentLoaded", function () {
    boot();
  });

  boot();
})(window);
