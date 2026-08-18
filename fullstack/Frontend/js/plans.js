/**
 * plans.js — Plans & Pricing grid.
 * Renders GET /v1/plans into frosted-glass cards. "Choose" is auth-smart:
 * guests get the auth modal ("sign in to subscribe"), members go to
 * checkout.html?plan=<id>. Supports ?choose=<planId> from the landing page
 * (redirects to checkout for a logged-in member). Marks the member's current
 * plan when an active subscription exists.
 */
(function () {
  "use strict";

  const It = window.Itinera;
  const PC = It && It.plansCore;
  if (!PC) return;

  const $ = (id) => document.getElementById(id);
  const grid = $("plansGrid");
  const sourceNote = $("plans-source-note");

  let subscription = null;

  function planTagline(plan) {
    const feats = Array.isArray(plan.features) ? plan.features : [];
    if (plan.billing_cycle === "yearly") return "Annual billing — save for the year ahead";
    if (feats.length) return String(feats[0]).replace(/_/g, " ");
    return "Unlock Itinera premium";
  }

  function chooseHandler(plan) {
    PC.gateToCheckout(plan.name, plan.id, function (mode, msg) {
      window.openAuthModal(mode, msg);
    });
  }

  function render(plans) {
    grid.innerHTML = "";
    if (!plans.length) {
      grid.innerHTML =
        '<div class="empty-state" style="grid-column:1/-1;">' +
        '<i class="fas fa-wifi" aria-hidden="true"></i>' +
        "<p class=\"mt-3\">Plans are temporarily unavailable. Please try again shortly.</p>" +
        "</div>";
      sourceNote.textContent = "Live plans could not be loaded.";
      return;
    }

    sourceNote.textContent = "Live plans — prices shown in the plan currency. Subscribe from the dashboard too.";

    const activeSub = subscription && subscription.status === "active" ? subscription : null;
    const currentPlanId = activeSub && activeSub.plan ? activeSub.plan.id : null;

    plans.forEach(function (plan) {
      const card = document.createElement("div");
      card.className = "glass-card p-8 plan-card" + (plan.id === currentPlanId ? " is-current" : "");

      const head = document.createElement("div");
      head.className = "flex items-center justify-between";
      head.innerHTML =
        "<h4 class=\"font-semibold text-lg\">" + escapeHtml(plan.name) + "</h4>" +
        (plan.id === currentPlanId ? '<span class="badge-current"><i class="fas fa-check"></i> Current</span>' : "");

      const tagline = document.createElement("p");
      tagline.className = "text-sm text-white/50 mt-1";
      tagline.textContent = planTagline(plan);

      const price = document.createElement("div");
      price.className = "plan-price my-5";
      price.innerHTML =
        PC.fmtCents(plan.price_cents, plan.currency) +
        '<span class="plan-per"> ' + (Number(plan.price_cents) === 0 ? "" : PC.monthlyLabel(plan.billing_cycle)) + "</span>";

      const feats = Array.isArray(plan.features) ? plan.features : [];
      const ul = document.createElement("ul");
      ul.className = "space-y-2 flex-1";
      feats.forEach(function (f) {
        const li = document.createElement("li");
        li.className = "plan-feature";
        li.innerHTML =
          '<i class="fas fa-check" aria-hidden="true"></i>' +
          "<span>" + escapeHtml(String(f).replace(/_/g, " ")) + "</span>";
        ul.appendChild(li);
      });
      if (!feats.length) {
        ul.innerHTML =
          '<li class="plan-feature"><i class="fas fa-check" aria-hidden="true"></i><span>AI trip planning</span></li>' +
          '<li class="plan-feature"><i class="fas fa-check" aria-hidden="true"></i><span>Personal itinerary builder</span></li>';
      }

      const btn = document.createElement("button");
      btn.type = "button";
      const isCurrent = plan.id === currentPlanId;
      btn.className = (isCurrent ? "btn-outline" : (plan.price_cents > 0 ? "btn-primary" : "btn-outline")) + " w-full justify-center mt-6";
      btn.innerHTML = isCurrent
        ? '<i class="fas fa-crown" aria-hidden="true"></i>Current plan'
        : '<i class="fas fa-gem" aria-hidden="true"></i>' + (plan.price_cents > 0 ? "Choose" : "Choose free");
      if (isCurrent) btn.disabled = true;
      btn.addEventListener("click", function () { chooseHandler(plan); });

      card.appendChild(head);
      card.appendChild(tagline);
      card.appendChild(price);
      card.appendChild(ul);
      card.appendChild(btn);
      grid.appendChild(card);
    });
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function handleChooseParam(plans) {
    const params = new URLSearchParams(globalThis.location.search);
    const raw = params.get("choose");
    if (!raw) return;
    const plan = plans.find(function (p) { return p.name.toLowerCase() === raw.toLowerCase(); }) ||
      plans.find(function (p) { return String(p.id) === raw; });
    if (plan) {
      const member = PC.isMember();
      if (member) {
        globalThis.location.replace("checkout.html?plan=" + encodeURIComponent(plan.id));
      } else {
        window.openAuthModal("login", "Sign in to subscribe to the " + plan.name + " plan.");
      }
    }
  }

  Promise.all([PC.fetchPlans(), PC.isMember() ? PC.fetchSubscription() : Promise.resolve(null)])
    .then(function (results) {
      subscription = results[1];
      render(results[0] || []);
      handleChooseParam(results[0] || []);
    });
})();
