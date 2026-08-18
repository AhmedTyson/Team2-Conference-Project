/**
 * plan-compare.js — side-by-side plan comparison table from GET /v1/plans.
 * Rows: price, billing cycle, AI quota, plus the union of all plan features.
 * Each plan column gets a "Choose" action (auth-smart via plans-core).
 */
(function () {
  "use strict";

  const It = window.Itinera;
  const PC = It && It.plansCore;
  if (!PC) return;

  const wrap = document.getElementById("compareWrap");

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function chooseHandler(plan) {
    PC.gateToCheckout(plan.name, plan.id, function (mode, msg) {
      window.openAuthModal(mode, msg);
    });
  }

  function build(plans) {
    if (!plans.length) {
      wrap.innerHTML =
        '<div class="empty-state"><i class="fas fa-wifi" aria-hidden="true"></i>' +
        '<p class="mt-3">Plans are temporarily unavailable. Please try again shortly.</p></div>';
      return;
    }

    const featureSet = [];
    plans.forEach(function (p) {
      (Array.isArray(p.features) ? p.features : []).forEach(function (f) {
        const key = String(f).replace(/_/g, " ").trim();
        if (key && featureSet.indexOf(key) === -1) featureSet.push(key);
      });
    });

    const head =
      "<thead><tr><th class=\"feat-label\">Feature</th>" +
      plans.map(function (p) {
        return (
          '<th class="plan-head">' +
          '<div class="font-semibold">' + escapeHtml(p.name) + "</div>" +
          '<div class="plan-price mt-2">' + PC.fmtCents(p.price_cents, p.currency) + "</div>" +
          '<div class="text-xs text-white/40 mt-1">' +
          (Number(p.price_cents) === 0 ? "Free forever" : p.billing_cycle === "yearly" ? "per year" : "per month") +
          "</div>" +
          "</th>"
        );
      }).join("") +
      "</tr></thead>";

    const rows = [
      { label: "AI generations / month", value: function (p) { return p.ai_quota_monthly == null ? "—" : String(p.ai_quota_monthly); } },
      { label: "Billing cycle", value: function (p) { return p.billing_cycle === "yearly" ? "Yearly" : "Monthly"; } },
    ];
    featureSet.forEach(function (f) {
      rows.push({
        label: f,
        value: function (p) {
          const feats = (Array.isArray(p.features) ? p.features : []).map(function (x) { return String(x).replace(/_/g, " ").trim(); });
          return feats.indexOf(f) !== -1 ? "✓" : "—";
        },
      });
    });

    const bodyRows = rows.map(function (row) {
      return (
        "<tr>" +
        '<td class="feat-label">' + escapeHtml(row.label) + "</td>" +
        plans.map(function (p) {
          const v = row.value(p);
          const cls = v === "✓" ? "is-yes" : v === "—" ? "is-no" : "is-yes";
          return '<td class="' + cls + '">' + escapeHtml(v) + "</td>";
        }).join("") +
        "</tr>"
      );
    });

    const actions =
      "<tr>" +
      '<td class="feat-label">Get started</td>' +
      plans.map(function (p) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = (p.price_cents > 0 ? "btn-primary" : "btn-outline") + " text-xs px-4 py-2";
        btn.textContent = "Choose " + escapeHtml(p.name);
        btn.addEventListener("click", function () { chooseHandler(p); });
        return "<td style=\"text-align:center;\">" + btn.outerHTML + "</td>";
      }).join("") +
      "</tr>";

    const table = document.createElement("table");
    table.className = "compare-table";
    table.innerHTML = head + "<tbody>" + bodyRows.join("") + actions + "</tbody>";
    wrap.innerHTML = "";
    wrap.appendChild(table);
  }

  PC.fetchPlans().then(function (plans) { build(plans || []); });
})();
