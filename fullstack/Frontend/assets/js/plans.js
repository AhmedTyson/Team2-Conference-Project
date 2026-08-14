/**
 * assets/js/plans.js — Dynamic Pricing Plans Rendering & Interaction Engine
 * Connects frontend plans.html to Laravel backend APIs via plans-core.js.
 */
(function (global) {
  "use strict";

  const It = global.Itinari || (global.Itinari = {});
  const PC = It.plansCore;

  const gridEl = document.getElementById("plansGrid");
  const subBannerEl = document.getElementById("currentSubscriptionBanner");

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function formatDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" });
  }

  function showToast(msg, isError) {
    const toast = document.getElementById("toast");
    const toastMsg = document.getElementById("toastMessage");
    if (toast && toastMsg) {
      toastMsg.textContent = msg;
      toast.className = isError ? "toast toast-error show" : "toast toast-success show";
      setTimeout(function () { toast.classList.remove("show"); }, 4000);
    } else if (typeof global.toast === "function") {
      global.toast(msg, isError);
    } else {
      alert(msg);
    }
  }

  function renderAuthRequired(message) {
    if (!gridEl) return;
    if (subBannerEl) subBannerEl.classList.add("hidden");

    gridEl.innerHTML =
      '<div class="col-span-full glass-card p-10 sm:p-14 text-center max-w-2xl mx-auto w-full">' +
      '<div class="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-2xl mx-auto mb-5">' +
      '<i class="fas fa-lock"></i>' +
      '</div>' +
      '<h3 class="text-2xl sm:text-3xl font-bold text-white">Sign In to Access Membership Plans</h3>' +
      '<p class="text-sm text-white/60 mt-3 leading-relaxed">' +
      (message ? esc(message) : 'Pricing tiers and subscription privileges require an active Itinera account. Please log in to view and select your plan.') +
      '</p>' +
      '<div class="flex items-center justify-center gap-4 mt-8 flex-wrap">' +
      '<a href="auth/login.html?redirect=' + encodeURIComponent(global.location.pathname) + '" class="btn-primary px-7 py-3 font-bold flex items-center gap-2" id="plansSignInBtn">' +
      '<i class="fas fa-sign-in-alt"></i><span>Log In</span>' +
      '</a>' +
      '<a href="auth/register.html" class="btn-outline px-6 py-3 font-semibold flex items-center gap-2">' +
      '<i class="fas fa-user-plus"></i><span>Create Account</span>' +
      '</a>' +
      '</div>' +
      '</div>';

    const signInBtn = document.getElementById("plansSignInBtn");
    if (signInBtn && typeof global.openAuthModal === "function") {
      signInBtn.addEventListener("click", function (e) {
        e.preventDefault();
        global.openAuthModal("login", "Sign in to access membership plans.");
      });
    }
  }

  function renderActiveSubscription(sub) {
    if (!subBannerEl) return;
    if (!sub || sub.status !== "active") {
      subBannerEl.innerHTML = "";
      subBannerEl.classList.add("hidden");
      return;
    }

    const planName = (sub.plan && sub.plan.name) || "Active Plan";
    const renews = sub.renews_at ? "Renews on " + formatDate(sub.renews_at) : "No renewal scheduled";

    subBannerEl.className = "mb-10 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4";
    subBannerEl.innerHTML =
      '<div class="flex items-center gap-3.5">' +
      '<div class="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg font-bold"><i class="fas fa-crown"></i></div>' +
      '<div>' +
      '<div class="flex items-center gap-2">' +
      '<span class="text-xs uppercase tracking-widest text-emerald-400 font-bold">Current Active Membership</span>' +
      '<span class="plan-badge plan-badge-active">Active</span>' +
      '</div>' +
      '<h3 class="text-xl font-bold text-white mt-0.5">' + esc(planName) + '</h3>' +
      '<p class="text-xs text-white/60 mt-0.5">' + esc(renews) + ' · ' + (sub.currency || 'EGP') + ' ' + (Number(sub.price_cents || 0)/100).toFixed(0) + ' / ' + (sub.plan?.billing_cycle || 'monthly') + '</p>' +
      '</div>' +
      '</div>' +
      '<div class="flex items-center gap-3 w-full sm:w-auto">' +
      '<a href="app/dashboard.html" class="btn-outline text-xs px-4 py-2 justify-center flex-1 sm:flex-initial">Go to Dashboard</a>' +
      '<button type="button" id="btnCancelSub" class="btn-outline text-xs px-4 py-2 text-red-400 hover:text-red-300 border-red-500/30 hover:border-red-500/60 justify-center flex-1 sm:flex-initial">Cancel Plan</button>' +
      '</div>';

    const cancelBtn = document.getElementById("btnCancelSub");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", async function () {
        if (!confirm("Are you sure you want to cancel your active subscription? You will retain access until the current period ends.")) {
          return;
        }
        cancelBtn.disabled = true;
        cancelBtn.textContent = "Cancelling…";
        try {
          const res = await PC.cancelSubscription();
          if (res.ok) {
            showToast("Subscription cancelled successfully.", false);
            setTimeout(function () { global.location.reload(); }, 1200);
          } else {
            showToast((res.body && res.body.message) || "Failed to cancel subscription.", true);
            cancelBtn.disabled = false;
            cancelBtn.textContent = "Cancel Plan";
          }
        } catch (e) {
          showToast("Network error cancelling subscription.", true);
          cancelBtn.disabled = false;
          cancelBtn.textContent = "Cancel Plan";
        }
      });
    }
  }

  function renderPlanCard(plan, currentSub) {
    const isCurrent = currentSub && currentSub.status === "active" && Number(currentSub.plan_id) === Number(plan.id);
    const isFree = Number(plan.price_cents) === 0;
    const isFeatured = plan.name === "Pro" || plan.name === "Business";
    const cycle = plan.billing_cycle === "yearly" ? "/ yr" : "/ mo";
    const priceDisplay = isFree ? "Free" : PC.fmtCents(plan.price_cents, plan.currency);

    const featuresList = Array.isArray(plan.features) ? plan.features : [];

    let btnHtml = "";
    if (isCurrent) {
      btnHtml = '<button type="button" class="btn-outline w-full justify-center opacity-60 cursor-default" disabled><i class="fas fa-check mr-1.5 text-emerald-400"></i>Current Plan</button>';
    } else if (isFree) {
      btnHtml = '<a href="app/dashboard.html" class="btn-outline w-full justify-center"><span>Get Started</span></a>';
    } else {
      const btnClass = isFeatured ? "btn-primary w-full justify-center" : "btn-outline w-full justify-center";
      const btnLabel = currentSub && currentSub.status === "active" ? "Upgrade to " + esc(plan.name) : "Choose " + esc(plan.name);
      btnHtml = '<button type="button" class="' + btnClass + '" data-plan-id="' + plan.id + '" data-plan-name="' + esc(plan.name) + '">' +
        '<span>' + btnLabel + '</span><i class="fas fa-arrow-right text-xs ml-2"></i></button>';
    }

    return '<div class="glass-card ' + (isFeatured ? "glass-card-featured border-amber-400/40" : "") + ' p-8 flex flex-col justify-between space-y-6 relative">' +
      (isFeatured && !isCurrent ? '<div class="absolute -top-3 left-1/2 -translate-x-1/2 plan-badge plan-badge-featured">Most Popular</div>' : "") +
      (isCurrent ? '<div class="absolute -top-3 left-1/2 -translate-x-1/2 plan-badge plan-badge-active"><i class="fas fa-check"></i> Active Plan</div>' : "") +
      '<div>' +
      '<div class="text-xs uppercase tracking-widest text-white/50 font-semibold mb-2">' + esc(plan.billing_cycle || "Membership") + '</div>' +
      '<h3 class="text-2xl font-bold text-white">' + esc(plan.name) + '</h3>' +
      '<div class="text-4xl font-black text-white mt-4 tabular-nums">' +
      priceDisplay +
      (!isFree ? '<span class="text-sm font-normal text-white/50"> ' + cycle + '</span>' : '') +
      '</div>' +
      '<div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-amber-400 font-medium mt-3">' +
      '<i class="fas fa-bolt text-[10px]"></i> ' + (plan.ai_quota_monthly || 0) + ' AI generations / mo' +
      '</div>' +
      '<ul class="space-y-3 mt-6 text-sm text-white/70">' +
      featuresList.map(function (f) {
        return '<li class="flex items-center gap-2.5"><i class="fas fa-check text-xs text-emerald-400"></i> ' + esc(String(f).replace(/_/g, " ")) + '</li>';
      }).join("") +
      '<li class="flex items-center gap-2.5"><i class="fas fa-check text-xs text-emerald-400"></i> Full catalog & concierge access</li>' +
      '</ul>' +
      '</div>' +
      '<div>' + btnHtml + '</div>' +
      '</div>';
  }

  function renderEmpty() {
    if (!gridEl) return;
    gridEl.innerHTML =
      '<div class="col-span-full glass-card p-12 text-center">' +
      '<i class="fas fa-tags text-4xl text-white/30 mb-4"></i>' +
      '<h3 class="text-xl font-bold text-white">No active plans available</h3>' +
      '<p class="text-sm text-white/50 mt-2">Check back soon for new membership tiers.</p>' +
      '</div>';
  }

  function renderError(msg) {
    if (!gridEl) return;
    gridEl.innerHTML =
      '<div class="col-span-full glass-card p-12 text-center">' +
      '<i class="fas fa-triangle-exclamation text-4xl text-amber-400 mb-4"></i>' +
      '<h3 class="text-xl font-bold text-white">Unable to load pricing plans</h3>' +
      '<p class="text-sm text-white/50 mt-2">' + (msg ? esc(msg) : 'Please check your connection and try again.') + '</p>' +
      '<button type="button" id="btnRetryPlans" class="btn-primary mt-6"><i class="fas fa-rotate-right mr-2"></i>Retry</button>' +
      '</div>';

    const retryBtn = document.getElementById("btnRetryPlans");
    if (retryBtn) {
      retryBtn.addEventListener("click", function () {
        loadPlans();
      });
    }
  }

  async function loadPlans() {
    if (!gridEl) return;

    gridEl.innerHTML =
      '<div class="skeleton-card"></div>' +
      '<div class="skeleton-card"></div>' +
      '<div class="skeleton-card"></div>';

    try {
      const userIsMember = PC.isMember();
      const [plansRes, currentSub] = await Promise.all([
        PC.fetchPlans(),
        userIsMember ? PC.fetchSubscription() : Promise.resolve(null)
      ]);

      if (!plansRes.ok) {
        renderError(plansRes.message);
        return;
      }

      const plans = plansRes.data || [];

      if (currentSub) {
        renderActiveSubscription(currentSub);
      }

      if (!plans.length) {
        renderEmpty();
        return;
      }

      gridEl.innerHTML = plans.map(function (plan) {
        return renderPlanCard(plan, currentSub);
      }).join("");

      // Wire action buttons
      Array.prototype.forEach.call(gridEl.querySelectorAll("button[data-plan-id]"), function (btn) {
        btn.addEventListener("click", function () {
          const pId = btn.dataset.planId;
          const pName = btn.dataset.planName || "Selected";
          PC.gateToCheckout(pName, pId, btn);

        });
      });

    } catch (e) {
      console.error("Failed to load plans:", e);
      renderError(e.message);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    loadPlans();
  });

  // If user logs in while on this page
  document.addEventListener("itinera:auth", function () {
    loadPlans();
  });
})(window);
