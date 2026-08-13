/**
 * survey-form.js — create/edit survey (converted from React SurveyFormPage).
 * Pill selectors for travel style/budget, toggle chips for interests (categories + extras).
 * Edit mode: ?id=N prefills; only owner can edit. Depends on app-shell.js (It.app).
 */
(function (global) {
  "use strict";

  var It = global.Itinari;
  if (!It || !It.app) return;

  var params = new URLSearchParams(global.location.search);
  var id = Number(params.get("id")) || 0;
  var isEdit = Boolean(id);

  var TRAVEL_STYLES = ["solo", "couple", "family", "friends", "business"];
  var EXTRA_INTERESTS = ["Food", "History", "Nature", "Nightlife", "Photography", "Shopping"];

  var form = document.getElementById("survey-form");
  var styleChips = document.getElementById("style-chips");
  var budgetChips = document.getElementById("budget-chips");
  var interestChips = document.getElementById("interest-chips");
  var styleError = document.getElementById("style-error");
  var budgetError = document.getElementById("budget-error");
  var interestsError = document.getElementById("interests-error");

  var state = { travelStyle: "", budgetLevel: "", selected: new Set() };

  function labelOf(v) {
    return String(v || "").charAt(0).toUpperCase() + String(v || "").slice(1);
  }

  function setActive(chips, value) {
    Array.prototype.forEach.call(chips.querySelectorAll(".chip"), function (b) {
      b.classList.toggle("chip--on", b.dataset.value === value);
    });
  }

  function renderInterestOptions(options) {
    interestChips.innerHTML = "";
    options.forEach(function (interest) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip chip--toggle";
      b.dataset.value = interest;
      b.innerHTML = It.app.esc(interest) +
        '<span class="chip__tick" aria-hidden="true">+</span>';
      b.addEventListener("click", function () {
        var active = state.selected.has(interest);
        if (active) state.selected.delete(interest);
        else state.selected.add(interest);
        b.classList.toggle("chip--on", !active);
        b.querySelector(".chip__tick").textContent = !active ? "\u2715" : "+";
        interestsError.hidden = true;
      });
      interestChips.appendChild(b);
    });
  }

  function showError(node, message) {
    node.textContent = message;
    node.hidden = false;
  }

  function renderSurvey(s) {
    state.travelStyle = s.travel_style || "";
    state.budgetLevel = s.budget_level || "";
    state.selected = new Set(s.interests || []);
    setActive(styleChips, state.travelStyle);
    setActive(budgetChips, state.budgetLevel);
    Array.prototype.forEach.call(interestChips.querySelectorAll(".chip"), function (b) {
      var active = state.selected.has(b.dataset.value);
      b.classList.toggle("chip--on", active);
      var tick = b.querySelector(".chip__tick");
      if (tick) tick.textContent = active ? "\u2715" : "+";
    });
  }

  It.app.boot(function (user) {
    var eyebrow = document.getElementById("form-eyebrow");
    var title = document.getElementById("form-title");
    var lead = document.querySelector(".page-header__lead");
    if (isEdit) {
      eyebrow.textContent = "Survey #" + id;
      title.textContent = "Edit your survey";
      lead.textContent = "Tweak how you like to travel — we keep the rest in mind.";
    } else {
      eyebrow.textContent = "Your Profile";
      title.textContent = "New survey";
      lead.textContent = "Hi " + It.app.esc((user.name || "").split(" ")[0]) + " — three quick picks and we know how to plan for you.";
    }

    It.apiGet("/v1/categories", { auth: true }).then(function (res) {
      var categories = It.app.unwrapData(res);
      if (!Array.isArray(categories)) categories = [];
      var names = categories.map(function (c) { return c.name; });
      var merged = names.concat(EXTRA_INTERESTS);
      var seen = {};
      var options = [];
      merged.forEach(function (i) {
        i = String(i || "").trim();
        if (i && !seen[i]) { seen[i] = true; options.push(i); }
      });
      renderInterestOptions(options);
    }).catch(function () {
      renderInterestOptions(EXTRA_INTERESTS);
    });

    if (isEdit) {
      It.apiGet("/v1/surveys/" + id, { auth: true }).then(function (res) {
        var s = It.app.unwrapData(res);
        if (!res.ok || !s) {
          form.style.display = "none";
          var card = document.createElement("div");
          card.className = "card card--flat";
          card.innerHTML = '<p class="page-section__lead">This survey could not be loaded.</p>' +
            '<a href="/surveys.html" class="btn btn--primary">Back to surveys</a>';
          form.parentNode.insertBefore(card, form);
          return;
        }
        if (s.user_id !== user.id) {
          form.style.display = "none";
          var notOwner = document.createElement("div");
          notOwner.className = "card card--flat";
          notOwner.innerHTML = '<p class="page-section__lead">This survey belongs to someone else — you can only edit your own.</p>' +
            '<a href="/surveys.html" class="btn btn--primary">Back to surveys</a>';
          form.parentNode.insertBefore(notOwner, form);
          return;
        }
        renderSurvey(s);
      }).catch(function () {
        form.style.display = "none";
      });
    }

    Array.prototype.forEach.call(styleChips.querySelectorAll(".chip"), function (b) {
      b.addEventListener("click", function () {
        state.travelStyle = b.dataset.value;
        setActive(styleChips, state.travelStyle);
        styleError.hidden = true;
      });
    });
    Array.prototype.forEach.call(budgetChips.querySelectorAll(".chip"), function (b) {
      b.addEventListener("click", function () {
        state.budgetLevel = b.dataset.value;
        setActive(budgetChips, state.budgetLevel);
        budgetError.hidden = true;
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var errors = {};
      if (!state.travelStyle.trim()) errors.travel_style = "Pick a travel style.";
      if (!state.budgetLevel) errors.budget_level = "Pick a budget level.";
      if (state.selected.size === 0) errors.interests = "Pick at least one interest.";
      showError(styleError, errors.travel_style || "");
      showError(budgetError, errors.budget_level || "");
      showError(interestsError, errors.interests || "");
      if (Object.keys(errors).length) return;

      var payload = {
        travel_style: state.travelStyle,
        budget_level: state.budgetLevel,
        interests: Array.from(state.selected)
      };
      var submit = form.querySelector('button[type="submit"]');
      submit.disabled = true;
      submit.textContent = "Saving…";

      var request = isEdit
        ? It.apiPut("/v1/surveys/" + id, payload, { auth: true })
        : It.apiPost("/v1/surveys", payload, { auth: true });

      request.then(function (res) {
        if (res.ok) {
          It.app.showToast(isEdit ? "Survey updated." : "Survey saved — welcome aboard.", "success");
          global.location.href = "/surveys.html";
        } else {
          var body = res.body || {};
          var anyField = false;
          if (body.errors) {
            Object.keys(body.errors).forEach(function (key) {
              if (key === "travel_style") showError(styleError, body.errors[key][0]);
              if (key === "budget_level") showError(budgetError, body.errors[key][0]);
              if (key === "interests") showError(interestsError, body.errors[key][0]);
            });
            anyField = true;
          }
          if (!anyField && body.message) It.app.showToast(body.message, "error");
          submit.disabled = false;
          submit.textContent = isEdit ? "Save changes" : "Save survey";
        }
      }).catch(function () {
        It.app.showToast("Could not save the survey.", "error");
        submit.disabled = false;
        submit.textContent = isEdit ? "Save changes" : "Save survey";
      });
    });
  });
})(window);
