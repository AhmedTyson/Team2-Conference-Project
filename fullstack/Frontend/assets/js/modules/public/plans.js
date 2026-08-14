/**
 * plans.js — membership plans (converted from React PlansPage).
 * Current-plan banner + plan cards. Subscribe/upgrade/cancel via /v1/me/*.
 * Depends on app-shell.js (It.app).
 */
(function (global) {
  "use strict";

  var It = global.Itinari;
  if (!It || !It.app) return;

  var currentBox = document.getElementById("current-plan");
  var grid = document.getElementById("plan-grid");

  function el(id) { return document.getElementById(id); }

  function formatPrice(cents) {
    return (Number(cents || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  function formatDate(value) {
    if (!value) return "—";
    return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function planCard(plan, index, current, busy) {
    var isCurrent = current && current.status === "active" && current.plan_id === plan.id;
    var featured = plan.name === "Pro";
    var free = Number(plan.price_cents) === 0;
    var btnClass = free ? "btn--ghost" : featured ? "btn--primary" : "btn--outline";
    var label = busy ? "Working…" : isCurrent ? "Your plan" : free ? "Start free" : "Choose plan";
    return '<div class="plan-card' + (featured ? " plan-card--featured" : "") + (isCurrent ? " plan-card--current" : "") +
      ' anim-rise" style="animation-delay:' + index * 80 + 'ms;">' +
      '<div class="plan-card__head"><span class="plan-card__name">' + It.app.esc(plan.name) + "</span>" +
      (isCurrent ? '<span class="plan-card__badge">Active</span>' : "") +
      (featured && !isCurrent ? '<span class="plan-card__badge plan-card__badge--dark">Popular</span>' : "") + "</div>" +
      '<div class="plan-card__price"><span class="plan-card__amount">' + formatPrice(plan.price_cents) + "</span>" +
      '<span class="plan-card__currency">' + It.app.esc(plan.currency) + "/" + It.app.esc(plan.billing_cycle || "monthly") + "</span></div>" +
      '<ul class="plan-card__features">' +
      (plan.features || []).map(function (f) {
        return '<li class="plan-card__feature"><span class="plan-card__check">✓</span>' + It.app.esc(f) + "</li>";
      }).join("") +
      '<li class="plan-card__feature"><span class="plan-card__check">✓</span>' + plan.ai_quota_monthly + " AI generations / month</li></ul>" +
      '<button type="button" class="btn btn--block ' + btnClass + '" data-plan-id="' + plan.id + '"' +
      (busy || isCurrent ? " disabled" : "") + ">" + label + "</button></div>";
  }

  function render(plans, current, busyPlan) {
    if (current) {
      var meta = It.app.esc(current.status || "") +
        (current.renews_at ? " · renews " + formatDate(current.renews_at) : " · no renewal scheduled");
      currentBox.hidden = false;
      currentBox.innerHTML =
        '<div><p class="current-plan__label">Current plan</p>' +
        '<p class="current-plan__name">' + It.app.esc((current.plan && current.plan.name) || "—") + "</p>" +
        '<p class="current-plan__meta">' + meta + "</p></div>" +
        (current.status === "active"
          ? '<button type="button" id="cancel-sub" class="btn btn--ghost">Cancel subscription</button>'
          : "");
      var cancel = el("cancel-sub");
      if (cancel) {
        cancel.addEventListener("click", function () {
          if (!global.confirm("Cancel your subscription?")) return;
          cancel.disabled = true;
          cancel.textContent = "Cancelling…";
          It.apiPost("/me/subscription/cancel", {}, { auth: true }).then(function (res) {
            if (res.ok) {
              It.app.showToast("Subscription cancelled — you keep access until renewal.", "info");
              global.location.reload();
            } else {
              It.app.showToast((res.body && res.body.message) || "Something went wrong.", "error");
              cancel.disabled = false;
              cancel.textContent = "Cancel subscription";
            }
          }).catch(function () {
            It.app.showToast("Something went wrong.", "error");
            cancel.disabled = false;
            cancel.textContent = "Cancel subscription";
          });
        });
      }
    }
    if (!plans.length) {
      grid.innerHTML = '<div class="empty" style="grid-column:1/-1;"><span class="empty__icon">◇</span>' +
        '<p class="empty__title">No plans available right now.</p><p class="empty__text">Check back soon.</p></div>';
      return;
    }
    grid.innerHTML = plans.map(function (plan, i) { return planCard(plan, i, current, busyPlan); }).join("");
    Array.prototype.forEach.call(grid.querySelectorAll("button[data-plan-id]"), function (btn) {
      if (btn.disabled) return;
      btn.addEventListener("click", function () {
        var planId = Number(btn.dataset.planId);
        var isUpgrade = current && current.status === "active" && current.plan_id !== planId;
        btn.disabled = true;
        btn.textContent = "Working…";
        var request = It.apiPost("/checkout/initiate", {
          type: "subscription",
          plan_id: planId
        }, { auth: true });
        
        request.then(function (res) {
          if (res.ok && res.body && res.body.data && res.body.data.checkout_url) {
            It.app.showToast("Redirecting to secure checkout...", "info");
            global.location.href = res.body.data.checkout_url;
          } else {
            It.app.showToast((res.body && res.body.message) || "Something went wrong.", "error");
            btn.disabled = false;
            btn.textContent = isUpgrade ? "Choose plan" : "Start free";
          }
        }).catch(function () {
          It.app.showToast("Something went wrong.", "error");
          btn.disabled = false;
          btn.textContent = isUpgrade ? "Choose plan" : "Start free";
        });
      });
    });
  }

  It.app.boot(function (user) {
    var reqs = [It.apiGet("/plans")];
    if (user) reqs.push(It.apiGet("/me/subscription", { auth: true }));

    Promise.all(reqs).then(function (results) {
      var plans = It.app.unwrapData(results[0]);
      var subscription = user && results.length > 1 ? It.app.unwrapData(results[1]) : null;
      if (!Array.isArray(plans)) plans = [];
      render(plans, subscription, null);
    }).catch(function (err) {
      console.error(err);
      grid.innerHTML = '<div class="error-card" style="grid-column:1/-1;">' +
        '<p>Plans are temporarily unavailable.</p>' +
        '<button type="button" class="btn btn--primary" onclick="location.reload()">Retry</button></div>';
    });
  });
})(window);
