/**
 * plans-core.js — shared plans/subscription helpers for the money pages
 * (plans.html, plan-compare.html, checkout.html, receipt.html, dashboard).
 * Pure logic + fetch; no DOM, no styling. Depends on config.js + api.js.
 */
(function (global) {
  "use strict";

  const It = global.Itinera;

  const ROUTES = {
    plans: "/plans",
    subscribe: "/me/subscribe",
    upgrade: "/me/upgrade",
    cancel: "/me/subscription/cancel",
    subscription: "/subscription",
    checkout: "/checkout/initiate",
  };

  /** Format cents as a currency string (default EGP when unset). */
  function fmtCents(cents, currency) {
    const n = Number(cents || 0) / 100;
    const cur = currency || "EGP";
    if (!isFinite(n)) return "--";
    try {
      return new Intl.NumberFormat("en", { style: "currency", currency: cur }).format(n);
    } catch (e) {
      return n.toFixed(2) + " " + cur;
    }
  }

  function monthlyLabel(cycle) {
    return cycle === "yearly" ? "/yr" : "/mo";
  }

  /** Fetch the active plans list. Resolves [] on failure (never throws). */
  async function fetchPlans() {
    try {
      const res = await It.apiGet(ROUTES.plans);
      if (res.ok && Array.isArray(res.body && res.body.data)) return res.body.data;
      return [];
    } catch (e) {
      return [];
    }
  }

  /** Fetch the current member's subscription. Resolves null when none. */
  async function fetchSubscription() {
    try {
      const res = await It.apiGet(ROUTES.subscription);
      if (res.ok) return (res.body && res.body.data) || null;
      return null;
    } catch (e) {
      return null;
    }
  }

  /** Whether a real JWT session exists (public pages keep guests browsing). */
  function isMember() {
    return !!(It && It.session && It.session.hasToken());
  }

  /** Standard auth-gate: guests get redirected to login, members proceed to Paymob. */
  async function gateToCheckout(planName, planId, btnElement) {
    if (!isMember()) {
      global.location.href = "auth/login.html?redirect=" + encodeURIComponent(global.location.pathname);
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
      const res = await It.apiPost(ROUTES.checkout, { type: "subscription", plan_id: Number(planId) });
      
      if (!res.ok) {
        let msg = "Unable to initiate Paymob payment. Please try again.";
        if (res.body) {
          if (typeof res.body.message === "string" && res.body.message) msg = res.body.message;
          else if (res.body.error && typeof res.body.error === "string") msg = res.body.error;
          else if (res.body.error && typeof res.body.error.message === "string" && res.body.error.message) msg = res.body.error.message;
        }
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
      }
    } catch (e) {
      console.error("Paymob checkout error:", e);
      if (typeof global.toast === "function") global.toast("Network error initiating payment.", true);
      else alert("Network error initiating payment.");

      if (btnElement) {
        btnElement.disabled = false;
        btnElement.innerHTML = originalHtml;
      }
    }
    return false;
  }

  It.plansCore = {
    ROUTES: ROUTES,
    fmtCents: fmtCents,
    monthlyLabel: monthlyLabel,
    fetchPlans: fetchPlans,
    fetchSubscription: fetchSubscription,
    isMember: isMember,
    gateToCheckout: gateToCheckout,
  };
})(window);
