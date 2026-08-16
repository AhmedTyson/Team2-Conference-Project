/**
 * trip-form.js — 4-Step luxury trip wizard (app/trip-form.html).
 * Features 4 horizontal progress bars, step validation, trip summary preview, and POST /api/trips.
 */
(function (global) {
  "use strict";

  var It = global.Itinari || (global.Itinari = {});

  var EXTRA_INTERESTS = ["Food & Fine Dining", "History & Culture", "Nature & Wildlife", "Nightlife", "Photography", "Shopping & Luxury"];
  var DEFAULT_STYLES = ["solo", "couple", "family", "friends", "business"];

  var currentStep = 1;
  var form = document.getElementById("trip-form");
  var titleInput = document.getElementById("trip-title");
  var styleChips = document.getElementById("style-chips");
  var interestChips = document.getElementById("interest-chips");
  var interestsCount = document.getElementById("interests-count");
  var travelersInput = document.getElementById("trip-travelers");
  var budgetInput = document.getElementById("trip-budget");
  var daysInput = document.getElementById("trip-days");
  var startInput = document.getElementById("trip-start");
  var endInput = document.getElementById("trip-end");

  var STEP_HEADLINES = {
    1: "Destination & Travel Timeline",
    2: "Travel Style & Vibe",
    3: "Activities & Highlights",
    4: "Travelers, Budget & Confirmation"
  };

  function el(id) { return document.getElementById(id); }

  function showToast(msg, type) {
    if (It.feedback && typeof It.feedback.banner === "function") {
      It.feedback.banner(msg, type === "success" || type === "is-ok" ? "is-ok" : "is-error");
      return;
    }
    var t = document.getElementById("appToast");
    var m = document.getElementById("appToastMsg");
    if (t && m) {
      m.textContent = msg;
      t.className = "toast show " + (type || "info");
      setTimeout(function () { t.classList.remove("show"); }, 3000);
    } else {
      alert(msg);
    }
  }

  function showError(id, message) {
    var node = el(id);
    if (!node) return;
    node.textContent = message;
    if (message) node.classList.remove("hidden");
    else node.classList.add("hidden");
  }

  var state = { travelStyle: "couple", interests: new Set(["Food & Fine Dining"]) };

  function setWizardStep(step) {
    currentStep = step;

    // Update Headline Title
    var headline = el("step-headline");
    if (headline) {
      headline.textContent = STEP_HEADLINES[step] || "Destination & Travel Timeline";
    }

    // Update 4 Bar Indicators
    var stepBars = document.querySelectorAll(".step-bar-item");
    stepBars.forEach(function (item) {
      var s = Number(item.getAttribute("data-step"));
      var bar = item.querySelector(".step-bar");
      var label = item.querySelector(".step-label");

      if (s <= step) {
        if (bar) bar.className = "h-1.5 rounded-full bg-amber-400 shadow-md shadow-amber-400/20 transition-all duration-300 step-bar";
        if (label) label.className = "text-xs font-semibold text-white/90 block truncate step-label";
      } else {
        if (bar) bar.className = "h-1.5 rounded-full bg-white/15 transition-all duration-300 step-bar";
        if (label) label.className = "text-xs font-medium text-white/40 block truncate step-label";
      }
    });

    // Toggle Step Content Panels
    [1, 2, 3, 4].forEach(function (s) {
      var content = el("step-" + s + "-content");
      if (content) {
        if (s === step) content.classList.remove("hidden");
        else content.classList.add("hidden");
      }
    });

    if (step === 4) {
      updateSummaryPreview();
    }
  }

  function updateSummaryPreview() {
    var preview = el("wizard-summary-preview");
    if (!preview) return;

    var title = titleInput ? (titleInput.value.trim() || "Untitled Trip") : "Untitled Trip";
    var style = state.travelStyle ? state.travelStyle.charAt(0).toUpperCase() + state.travelStyle.slice(1) : "Bespoke";
    var interestsArr = Array.from(state.interests);
    var interestsList = interestsArr.join(", ") || "General Exploration";
    var travelers = travelersInput ? Number(travelersInput.value) || 1 : 1;
    var days = daysInput ? Number(daysInput.value) || 1 : 1;
    var rawBudget = budgetInput && budgetInput.value ? Number(budgetInput.value) : 0;
    var budgetStr = rawBudget > 0 ? "$" + rawBudget.toLocaleString() : "Budget on request";
    var startDate = startInput && startInput.value ? startInput.value : "TBD";
    var endDate = endInput && endInput.value ? endInput.value : "TBD";

    preview.innerHTML =
      '<div class="p-3 bg-white/5 rounded-xl border border-white/10"><strong class="text-amber-400 font-bold block mb-1">Title:</strong> <span class="text-white font-semibold">' + esc(title) + '</span></div>' +
      '<div class="p-3 bg-white/5 rounded-xl border border-white/10"><strong class="text-amber-400 font-bold block mb-1">Dates & Duration:</strong> <span class="text-white font-semibold">' + esc(startDate) + ' → ' + esc(endDate) + ' (' + days + ' Days)</span></div>' +
      '<div class="p-3 bg-white/5 rounded-xl border border-white/10"><strong class="text-amber-400 font-bold block mb-1">Style & Party:</strong> <span class="text-white font-semibold">' + esc(style) + ' · ' + travelers + ' Traveler(s)</span></div>' +
      '<div class="p-3 bg-white/5 rounded-xl border border-white/10"><strong class="text-amber-400 font-bold block mb-1">Estimated Budget:</strong> <span class="text-white font-semibold">' + esc(budgetStr) + '</span></div>' +
      '<div class="col-span-full p-3 bg-white/5 rounded-xl border border-white/10"><strong class="text-amber-400 font-bold block mb-1">Selected Interests:</strong> <span class="text-white/90 font-medium">' + esc(interestsList) + '</span></div>';
  }

  function renderStyleChips(styles) {
    if (!styleChips) return;
    styleChips.innerHTML = "";
    styles.forEach(function (style) {
      var b = document.createElement("button");
      b.type = "button";
      var isSelected = state.travelStyle === style;
      b.className = isSelected
        ? "px-5 py-2.5 rounded-2xl bg-amber-400 text-black font-bold text-xs shadow-md transition-all cursor-pointer"
        : "px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-white/80 font-semibold text-xs transition-all cursor-pointer";
      b.dataset.value = style;
      b.textContent = style.charAt(0).toUpperCase() + style.slice(1);
      b.addEventListener("click", function () {
        state.travelStyle = style;
        renderStyleChips(styles);
        showError("style-error", "");
      });
      styleChips.appendChild(b);
    });
  }

  function renderInterestChips(options) {
    if (!interestChips) return;
    interestChips.innerHTML = "";
    options.forEach(function (interest) {
      var b = document.createElement("button");
      b.type = "button";
      var isSelected = state.interests.has(interest);
      b.className = isSelected
        ? "px-4 py-2 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
        : "px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white/70 font-medium text-xs transition-all cursor-pointer flex items-center gap-1.5";
      b.dataset.value = interest;
      b.innerHTML = (isSelected ? '<i class="fas fa-check text-[10px]"></i> ' : '') + interest;
      b.addEventListener("click", function () {
        if (state.interests.has(interest)) state.interests.delete(interest);
        else state.interests.add(interest);
        renderInterestChips(options);
        if (interestsCount) interestsCount.textContent = state.interests.size + " selected";
        showError("interests-error", "");
      });
      interestChips.appendChild(b);
    });
  }

  function autoFillEnd() {
    if (!startInput.value || !Number(daysInput.value)) return;
    var end = new Date(startInput.value + "T00:00:00");
    end.setDate(end.getDate() + Number(daysInput.value) - 1);
    endInput.value = end.toISOString().slice(0, 10);
  }

  function bootForm() {
    if (!form) return;

    // Set default start date to tomorrow
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (startInput) startInput.value = tomorrow.toISOString().slice(0, 10);

    renderStyleChips(DEFAULT_STYLES);

    It.apiGet("/categories").then(function (res) {
      var raw = res.data !== undefined ? res.data : (res.body ? (res.body.data || res.body) : res);
      var categories = Array.isArray(raw) ? raw : [];
      var names = categories.map(function (c) { return c.name; });
      var merged = names.concat(EXTRA_INTERESTS);
      var seen = {};
      var options = [];
      merged.forEach(function (i) {
        i = String(i || "").trim();
        if (i && !seen[i]) { seen[i] = true; options.push(i); }
      });
      renderInterestChips(options);
    }).catch(function () {
      renderInterestChips(EXTRA_INTERESTS);
    });

    if (travelersInput) {
      travelersInput.addEventListener("change", function () {
        travelersInput.value = Math.max(1, Number(travelersInput.value) || 1);
        if (currentStep === 4) updateSummaryPreview();
      });
    }
    if (daysInput) {
      daysInput.addEventListener("change", function () {
        daysInput.value = Math.max(1, Number(daysInput.value) || 1);
        autoFillEnd();
        if (currentStep === 4) updateSummaryPreview();
      });
    }
    if (budgetInput) {
      budgetInput.addEventListener("input", function () {
        if (currentStep === 4) updateSummaryPreview();
      });
    }
    if (startInput) {
      startInput.addEventListener("change", function () {
        autoFillEnd();
        if (currentStep === 4) updateSummaryPreview();
      });
      autoFillEnd();
    }

    // Step 1 Next Button
    var btnNext1 = el("btn-next-1");
    if (btnNext1) {
      btnNext1.addEventListener("click", function () {
        var title = titleInput ? titleInput.value.trim() : "";
        if (!title) {
          showError("title-error", "Please enter a trip name or destination.");
          return;
        }
        showError("title-error", "");

        if (!startInput || !startInput.value) {
          showError("start-error", "Please select a start date.");
          return;
        }
        showError("start-error", "");

        setWizardStep(2);
      });
    }

    // Step 2 Back & Next Buttons
    var btnBack2 = el("btn-back-2");
    if (btnBack2) {
      btnBack2.addEventListener("click", function () { setWizardStep(1); });
    }
    var btnNext2 = el("btn-next-2");
    if (btnNext2) {
      btnNext2.addEventListener("click", function () {
        if (!state.travelStyle) {
          showError("style-error", "Please select a travel style.");
          return;
        }
        showError("style-error", "");
        setWizardStep(3);
      });
    }

    // Step 3 Back & Next Buttons
    var btnBack3 = el("btn-back-3");
    if (btnBack3) {
      btnBack3.addEventListener("click", function () { setWizardStep(2); });
    }
    var btnNext3 = el("btn-next-3");
    if (btnNext3) {
      btnNext3.addEventListener("click", function () {
        if (state.interests.size === 0) {
          showError("interests-error", "Please select at least one interest.");
          return;
        }
        showError("interests-error", "");
        setWizardStep(4);
      });
    }

    // Step 4 Back Button
    var btnBack4 = el("btn-back-4");
    if (btnBack4) {
      btnBack4.addEventListener("click", function () { setWizardStep(3); });
    }

    // Final Form Submission
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!It.session || !It.session.hasToken()) {
        showToast("Please sign in to create a trip.", "error");
        return;
      }

      var title = titleInput ? titleInput.value.trim() : "";
      var budget = budgetInput ? budgetInput.value.trim() : "";

      var payload = {
        title: title,
        status: "planning",
        travel_style: state.travelStyle,
        interests: Array.from(state.interests),
        no_of_travelers: Number(travelersInput.value) || 1,
        budget: budget ? Number(budget) : 0,
        no_of_days: Number(daysInput.value) || 1,
        start_date: startInput.value,
        end_date: endInput.value || startInput.value
      };

      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Creating Itinerary…';
      }

      It.apiPost("/trips", payload, { auth: true }).then(function (res) {
        if (res.ok) {
          var raw = res.data !== undefined ? res.data : (res.body ? (res.body.data || res.body) : res);
          var trip = raw;
          showToast("Trip itinerary created successfully!", "success");
          setTimeout(function () {
            global.location.href = "trip.html?id=" + (trip && trip.id ? trip.id : "");
          }, 500);
        } else {
          var body = res.body || {};
          showToast((body.message || "Could not create trip itinerary."), "error");
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Create Trip & Open AI Itinerary';
          }
        }
      }).catch(function () {
        showToast("Network error creating trip itinerary.", "error");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Create Trip & Open AI Itinerary';
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootForm);
  } else {
    bootForm();
  }
})(window);
