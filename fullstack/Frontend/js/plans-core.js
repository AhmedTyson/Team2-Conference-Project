/**
 * plans-core.js — shared plans/subscription helpers for the money pages
 * (plans.html, plan-compare.html, checkout.html, receipt.html, dashboard).
 * Pure logic + fetch; no DOM, no styling. Depends on config.js + api.js.
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

  /** Fetch a specific plan by ID. Resolves plan object or null. */
  async function fetchPlan(id) {
    if (!id) return null;
    try {
      const res = await It.apiGet(ROUTES.plans + "/" + encodeURIComponent(id), { skipAuthRedirect: true });
      if (res.ok && res.body && res.body.data) return res.body.data;
    } catch (e) {}

    // Fallback: search in active plans list
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

  /** Initiate subscription checkout with Paymob through Laravel API. */
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

  /** Standard auth-gate: guests get the auth modal/redirect, members initiate Paymob checkout directly. */
  async function gateToCheckout(planName, planId, btnElement) {
    if (!isMember()) {
      if (typeof global.openAuthModal === "function") {
        global.openAuthModal("login", "Sign in to subscribe to the " + planName + " plan.");
      } else {
        const prefix = global.location.pathname.includes("/app/") ? "../" : "";
        global.location.href = prefix + "auth/login.html?redirect=" + encodeURIComponent(global.location.pathname);
      }
      return false;
    }

    let origHtml = "";
    if (btnElement) {
      origHtml = btnElement.innerHTML;
      btnElement.disabled = true;
      btnElement.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Connecting Paymob Gateway…';
    }

    try {
      const user = (It.session && It.session.user) || (It.readUser && It.readUser()) || {};
      const billingData = {
        first_name: user.name ? user.name.split(" ")[0] : "Traveler",
        last_name: user.name && user.name.split(" ").length > 1 ? user.name.split(" ").slice(1).join(" ") : "User",
        email: user.email || "",
        phone_number: user.phone || "01000000000",
      };

      const idempotencyKey = "sub_" + planId + "_" + Date.now();
      const res = await initiateCheckout(planId, billingData, idempotencyKey);

      if (!res.ok) {
        const msg = (res.body && res.body.message) || "Unable to initiate payment gateway. Please try again.";
        if (typeof global.showToast === "function") global.showToast(msg, true);
        else alert(msg);
        if (btnElement) {
          btnElement.disabled = false;
          btnElement.innerHTML = origHtml;
        }
        return false;
      }

      const data = (res.body && res.body.data) || {};
      if (data.checkout_url) {
        if (typeof global.showToast === "function") global.showToast("Redirecting to Paymob Gateway...", false);
        global.location.href = data.checkout_url;
        return true;
      }

      const receiptPath = global.location.pathname.includes("/app/") ? "receipt.html" : "app/receipt.html";
      global.location.href = receiptPath + "?order=" + encodeURIComponent(data.order_id || "");
      return true;

    } catch (e) {
      console.error("Direct Paymob checkout error:", e);
      if (btnElement) {
        btnElement.disabled = false;
        btnElement.innerHTML = origHtml;
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
