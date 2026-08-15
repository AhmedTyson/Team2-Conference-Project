/**
 * surveys-core.js — shared helpers for the Surveys pages
 * (surveys.html, survey-create.html, survey.html, survey-answer.html).
 *
 * Backend contract (apiResource 'surveys', auth): a survey IS the member's
 * travel-preference profile — travel_style (string), budget_level (low |
 * medium | high | luxury), interests (array of strings). Only the owner can
 * list / view / update / delete their own surveys.
 *
 * NOTE: the docs describe a questions/answers survey with participation;
 * this backend stores preference profiles instead (see report).
 */
(function (global) {
  "use strict";

  const It = global.Itinari;

  const ROUTES = {
    surveys: "/surveys",
    survey: function (id) { return "/surveys/" + encodeURIComponent(id); },
  };

  const BUDGET_LEVELS = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "luxury", label: "Luxury" },
  ];

  const INTERESTS = [
    "food", "museums", "history", "nature", "beaches", "hiking",
    "shopping", "nightlife", "art", "culture", "adventure", "photography",
    "wellness", "family", "sports", "architecture",
  ];

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function isMember() {
    return !!(It && It.session && It.session.hasToken());
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" });
  }

  function budgetLabel(value) {
    const found = BUDGET_LEVELS.find(function (b) { return b.value === value; });
    return found ? found.label : escapeHtml(value || "—");
  }

  function interestChipsHtml(interests) {
    const list = Array.isArray(interests) ? interests : [];
    if (!list.length) return '<span class="text-white/35 text-sm">No interests selected</span>';
    return list.map(function (i) {
      return '<span class="chip"><i class="fas fa-star" aria-hidden="true"></i>' + escapeHtml(i) + "</span>";
    }).join(" ");
  }

  /** Auth gate: renders a sign-in card into root. Returns true when member. */
  function gate(root, title, sub) {
    if (isMember()) return true;
    root.innerHTML =
      '<div class="glass-card p-8 text-center max-w-lg mx-auto">' +
      '<i class="fas fa-lock text-3xl text-white/30" aria-hidden="true"></i>' +
      '<h3 class="mt-4 text-lg font-bold">' + escapeHtml(title || "Sign in to continue") + "</h3>" +
      (sub ? '<p class="mt-2 text-white/45 text-sm">' + escapeHtml(sub) + "</p>" : "") +
      '<div class="flex items-center justify-center gap-3 mt-6 flex-wrap">' +
      '<button type="button" class="btn-primary" id="survGateLogin"><i class="fas fa-sign-in-alt" aria-hidden="true"></i>Log in</button>' +
      '<button type="button" class="btn-outline" id="survGateRegister"><i class="fas fa-user-plus" aria-hidden="true"></i>Create account</button>' +
      "</div></div>";
    document.getElementById("survGateLogin").addEventListener("click", function () {
      global.openAuthModal("login", "Sign in to manage your travel surveys.");
    });
    document.getElementById("survGateRegister").addEventListener("click", function () {
      global.openAuthModal("register", "Create an account to manage your travel surveys.");
    });
    return false;
  }

  /**
   * Build the survey form (create + answer-edit share it).
   * data = { travel_style, budget_level, interests } — prefill for edits.
   * Returns { collect(): {travel_style, budget_level, interests} | null,
   *           showError(msg) }
   */
  function buildForm(container, data) {
    const d = data || {};
    const style = d.travel_style || "";
    const budget = d.budget_level || "";
    const interests = Array.isArray(d.interests) ? d.interests : [];

    container.innerHTML =
      '<form id="surveyForm" novalidate class="space-y-5">' +
      "<div>" +
      '<label class="field-label" for="sfStyle">Travel style</label>' +
      '<input class="field-input" id="sfStyle" list="sfStyleSuggestions" placeholder="e.g. adventure, cultural, relaxation…" value="' + escapeHtml(style) + '" maxlength="80" />' +
      '<datalist id="sfStyleSuggestions">' +
      ["adventure", "cultural", "relaxation", "business", "family", "solo", "culinary", "nature"].map(function (s) {
        return '<option value="' + s + '"></option>';
      }).join("") +
      "</datalist>" +
      '<p class="text-red-400 text-xs mt-1 hidden" id="sfStyleErr"></p>' +
      "</div>" +
      "<div>" +
      '<label class="field-label" for="sfBudget">Budget level</label>' +
      '<select class="field-input" id="sfBudget">' +
      '<option value="">Select a budget…</option>' +
      BUDGET_LEVELS.map(function (b) {
        return '<option value="' + b.value + '"' + (budget === b.value ? " selected" : "") + ">" + b.label + "</option>";
      }).join("") +
      "</select>" +
      '<p class="text-red-400 text-xs mt-1 hidden" id="sfBudgetErr"></p>' +
      "</div>" +
      "<div>" +
      '<label class="field-label">Interests <span class="text-white/35 font-normal">(pick any)</span></label>' +
      '<div class="flex flex-wrap gap-2" id="sfInterests">' +
      INTERESTS.map(function (i) {
        const on = interests.indexOf(i) !== -1;
        return '<button type="button" class="chip' + (on ? " on" : "") + '" data-interest="' + i + '" aria-pressed="' + on + '">' + escapeHtml(i) + "</button>";
      }).join("") +
      "</div>" +
      '<p class="text-red-400 text-xs mt-1 hidden" id="sfInterestsErr"></p>' +
      "</div>" +
      "</form>";

    const selected = new Set(interests);
    container.querySelectorAll("[data-interest]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const v = btn.dataset.interest;
        if (selected.has(v)) selected.delete(v); else selected.add(v);
        btn.classList.toggle("on", selected.has(v));
        btn.setAttribute("aria-pressed", String(selected.has(v)));
      });
    });

    function err(id, msg) {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = msg || "";
      el.classList.toggle("hidden", !msg);
    }

    return {
      collect: function () {
        const styleVal = (document.getElementById("sfStyle").value || "").trim();
        const budgetVal = document.getElementById("sfBudget").value;
        err("sfStyleErr", styleVal ? "" : "Please describe your travel style.");
        err("sfBudgetErr", budgetVal ? "" : "Please pick a budget level.");
        err("sfInterestsErr", selected.size ? "" : "Pick at least one interest.");
        if (!styleVal || !budgetVal || !selected.size) return null;
        return { travel_style: styleVal, budget_level: budgetVal, interests: Array.from(selected) };
      },
      clearError: function () {
        err("sfStyleErr", "");
        err("sfBudgetErr", "");
        err("sfInterestsErr", "");
      },
      fieldError: function (field, msg) {
        if (field === "travel_style") err("sfStyleErr", msg);
        else if (field === "budget_level") err("sfBudgetErr", msg);
        else if (field === "interests") err("sfInterestsErr", msg);
      },
    };
  }

  function firstError(errors) {
    if (!errors || typeof errors !== "object") return null;
    const key = Object.keys(errors)[0];
    if (!key) return null;
    const v = errors[key];
    return Array.isArray(v) ? v[0] : String(v);
  }

  It.surveysCore = {
    ROUTES: ROUTES,
    BUDGET_LEVELS: BUDGET_LEVELS,
    INTERESTS: INTERESTS,
    escapeHtml: escapeHtml,
    isMember: isMember,
    fmtDate: fmtDate,
    budgetLabel: budgetLabel,
    interestChipsHtml: interestChipsHtml,
    gate: gate,
    buildForm: buildForm,
    firstError: firstError,
  };
})(window);
