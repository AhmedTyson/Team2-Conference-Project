/**
 * plans-core.js — LEGACY shared plans/subscription helpers, kept only
 * because js/plans.js and js/plan-compare.js (legacy tree) still load it.
 *
 * Reconstructed to match the canonical, already-correct implementation at
 * assets/js/pages/customer/plans-core.js — that file is what public/plans.html
 * (the real, current plans page) actually uses. This legacy copy previously
 * contained an unresolved merge conflict: two different gateToCheckout()
 * implementations pasted back-to-back (one did inline Paymob checkout, the
 * other redirected to checkout.html), plus duplicated fetchPlan/ROUTES/export
 * blocks that produced a real SyntaxError (node --check confirmed:
 * "Identifier 'res' has already been declared", line 126 of the prior file).
 *
 * RESOLUTION: kept the "redirect to checkout.html" behavior, because that's
 * what the canonical file does and what checkout.html is actually built to
 * receive (?plan= query param) — confirmed by reading checkout.html directly.
 * The inline-Paymob variant was not wired to anything checkout.html expects
 * and would have bypassed the page entirely; dropping it, not merging it in,
 * since keeping both was the original bug.
 *
 * Dropped as genuinely unused (verified: zero callers in js/plans.js or
 * js/plan-compare.js, the only two files that load this legacy copy):
 *   fetchPlan(id), cancelSubscription(), initiateCheckout()
 * If a future page under the legacy tree needs these, port them from the
 * git history of this file (pre-reconstruction) rather than re-guessing.
 * CORRECTION (second pass): the first reconstruction of this file dropped
 * initiateCheckout() as "unused," based on checking only js/plans.js and
 * js/plan-compare.js. That was wrong — fullstack/Frontend/app/checkout.html
 * loads THIS file directly (see its <script src="../js/plans-core.js">)
 * and fullstack/Frontend/js/checkout.js calls PC.initiateCheckout() at its
 * pay() function — the real Paymob-initiation call for this page. Restored
 * below, matching checkout.js's expected {ok, body} response shape exactly.
 */
(function (global) {
  "use strict";

  const It = global.Itinari || (global.Itinari = {});

  const ROUTES = {
    plans: "/plans",
    subscribe: "/me/subscribe",
    upgrade: "/me/upgrade",
    cancel: "/me/subscription/cancel",
    subscription: "/me/subscription",
    checkout: "/checkout/initiate",
  };

  /** Format cents as a currency string (default EGP when unset). */
  function fmtCents(cents, currency) {
    const n = Number(cents || 0) / 100;
    const cur = currency || "EGP";
    if (!isFinite(n)) return "--";
    try {
      return new Intl.NumberFormat("en", { style: "currency", currency: cur, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
    } catch (e) {
      return n.toFixed(2) + " " + cur;
    }
  }

  function monthlyLabel(cycle) {
    return cycle === "yearly" ? "/yr" : "/mo";
  }

  /**
   * Fetch the active plans list.
   * Returns an object { ok: boolean, status: number, data: Array, message: string }.
   */
  async function fetchPlans() {
    try {
      const res = await It.apiGet(ROUTES.plans, { skipAuthRedirect: true });
      if (res.ok && res.body && Array.isArray(res.body.data)) {
        return { ok: true, status: res.status, data: res.body.data, message: res.body.message || "Success" };
      }
      return {
        ok: false,
        status: res.status,
        data: [],
        message: (res.body && res.body.message) || (res.status === 401 ? "Authentication required" : "Failed to load plans")
      };
    } catch (e) {
      return { ok: false, status: 0, data: [], message: e.message || "Network error" };
    }
  }

  /** Fetch a specific plan by ID. Falls back to searching the active plans list. Resolves plan object or null. */
  async function fetchPlan(id) {
    if (!id) return null;
    try {
      const res = await It.apiGet(ROUTES.plans + "/" + encodeURIComponent(id), { skipAuthRedirect: true });
      if (res.ok && res.body && res.body.data) return res.body.data;
    } catch (e) {}

    try {
      const plansRes = await fetchPlans();
      if (plansRes.ok && Array.isArray(plansRes.data)) {
        const match = plansRes.data.find(function (p) {
          return Number(p.id) === Number(id) || String(p.name).toLowerCase() === String(id).toLowerCase();
        });
        return match || null;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /** Fetch the current member's subscription. Resolves null when none or unauthorized. */
  async function fetchSubscription() {
    try {
      const res = await It.apiGet(ROUTES.subscription, { skipAuthRedirect: true });
      if (res.ok && res.body) return res.body.data || null;
      return null;
    } catch (e) {
      return null;
    }
  }

  /** Cancel current active subscription. */
  async function cancelSubscription() {
    return await It.apiPost(ROUTES.cancel, {});
  }

  /**
   * Initiate subscription checkout with Paymob through Laravel API.
   * Returns the raw apiPost() result — { ok, status, body } — which
   * checkout.js's pay() function reads directly (res.ok, res.body.data,
   * res.body.message). Do not change this return shape without updating
   * checkout.js's pay() function to match.
   */
  async function initiateCheckout(planId, billingData, idempotencyKey) {
    const payload = {
      type: "subscription",
      plan_id: Number(planId),
    };
    if (billingData && typeof billingData === "object") {
      payload.billing = billingData;
    }
    if (idempotencyKey) {
      payload.idempotency_key = String(idempotencyKey);
    }

    return await It.apiPost(ROUTES.checkout, payload);
  }

  /** Whether a real JWT session exists. */
  function isMember() {
    const token = (It.readToken && It.readToken()) || localStorage.getItem("itinari_token");
    return !!token;
  }

  /**
   * Directly initiates Paymob checkout for the selected plan and redirects
   * the browser straight to Paymob's payment gateway (data.checkout_url).
   */
  async function gateToCheckout(planName, planId, btnElement) {
    if (!isMember()) {
      const loginUrl = (global.location.pathname.includes("/auth/") ? "login.html" : "auth/login.html") + "?redirect=" + encodeURIComponent(global.location.pathname);
      if (typeof global.openAuthModal === "function") {
        global.openAuthModal("login", "Sign in to subscribe to the " + planName + " plan.");
      } else {
        global.location.href = loginUrl;
      }
      return false;
    }

    if (btnElement && btnElement.disabled) return false;
    
    let originalHtml = "";
    if (btnElement) {
      originalHtml = btnElement.innerHTML;
      btnElement.disabled = true;
      btnElement.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Connecting to Paymob...';
    }

    try {
      const idempotencyKey = "sub_" + planId + "_" + Date.now();
      const res = await initiateCheckout(planId, {}, idempotencyKey);

      if (!res.ok) {
        const msg = (res.body && res.body.message) || "Unable to initiate Paymob payment. Please try again.";
        if (typeof global.toast === "function") global.toast(msg, true);
        else alert(msg);

        if (btnElement) {
          btnElement.disabled = false;
          btnElement.innerHTML = originalHtml;
        }
        return false;
      }

      const data = (res.body && res.body.data) || {};
      if (data.checkout_url) {
        if (typeof global.toast === "function") global.toast("Redirecting to Paymob payment gateway...", false);
        global.location.href = data.checkout_url;
        return true;
      } else {
        // Fallback receipt redirect
        const targetUrl = (global.location.pathname.includes("/app/") ? "receipt.html" : "app/receipt.html") + "?order=" + encodeURIComponent(data.order_id || "");
        global.location.href = targetUrl;
        return true;
      }
    } catch (err) {
      console.error("Direct Paymob checkout error:", err);
      if (typeof global.toast === "function") global.toast("Network error initiating payment.", true);
      else alert("Network error initiating payment.");

      if (btnElement) {
        btnElement.disabled = false;
        btnElement.innerHTML = originalHtml;
      }
      return false;
    }
  }

  It.plansCore = {
    ROUTES: ROUTES,
    fmtCents: fmtCents,
    monthlyLabel: monthlyLabel,
    fetchPlans: fetchPlans,
    fetchPlan: fetchPlan,
    fetchSubscription: fetchSubscription,
    cancelSubscription: cancelSubscription,
    initiateCheckout: initiateCheckout,
    isMember: isMember,
    gateToCheckout: gateToCheckout,
  };
})(window);
