/**
 * trip-form.js — create trip (converted from React TripCreatePage).
 * Travel styles from /v1/trips/create; interest chips from /v1/categories + extras.
 * End date auto-fills from start + days. POST /v1/trips → trip detail.
 * Depends on app-shell.js (It.app).
 */
(function (global) {
  "use strict";

  var It = global.Itinari;
  if (!It || !It.app) return;

  var EXTRA_INTERESTS = ["Food", "History", "Nature", "Nightlife", "Photography", "Shopping"];
  var DEFAULT_STYLES = ["solo", "couple", "family", "friends", "business"];

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

  function el(id) { return document.getElementById(id); }
  function showError(id, message) {
    var node = el(id);
    node.textContent = message;
    node.hidden = !message;
  }

  var state = { travelStyle: "", interests: new Set() };

  function setActive(chips, value) {
    Array.prototype.forEach.call(chips.querySelectorAll(".chip"), function (b) {
      b.classList.toggle("chip--on", b.dataset.value === value);
    });
  }

  function renderStyleChips(styles) {
    styleChips.innerHTML = "";
    styles.forEach(function (style) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.dataset.value = style;
      b.textContent = style.charAt(0).toUpperCase() + style.slice(1);
      b.addEventListener("click", function () {
        state.travelStyle = style;
        setActive(styleChips, style);
        showError("style-error", "");
      });
      styleChips.appendChild(b);
    });
  }

  function renderInterestChips(options) {
    interestChips.innerHTML = "";
    options.forEach(function (interest) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip chip--toggle";
      b.dataset.value = interest;
      b.textContent = interest;
      b.addEventListener("click", function () {
        if (state.interests.has(interest)) state.interests.delete(interest);
        else state.interests.add(interest);
        b.classList.toggle("chip--on", state.interests.has(interest));
        interestsCount.textContent = state.interests.size + " selected";
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

  It.app.boot(function () {
    It.apiGet("/v1/trips/create", { auth: true }).then(function (res) {
      var data = It.app.unwrapData(res);
      var styles = data && Array.isArray(data.travel_styles) && data.travel_styles.length
        ? data.travel_styles : DEFAULT_STYLES;
      renderStyleChips(styles);
    }).catch(function () {
      renderStyleChips(DEFAULT_STYLES);
    });

    It.apiGet("/v1/categories", { auth: true }).then(function (res) {
      var categories = It.app.unwrapData(res);
      var names = Array.isArray(categories) ? categories.map(function (c) { return c.name; }) : [];
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

    travelersInput.addEventListener("change", function () {
      travelersInput.value = Math.max(1, Number(travelersInput.value) || 1);
    });
    daysInput.addEventListener("change", function () {
      daysInput.value = Math.max(1, Number(daysInput.value) || 1);
      autoFillEnd();
    });
    startInput.addEventListener("change", autoFillEnd);
    endInput.addEventListener("input", function () { showError("end-error", ""); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var errors = {};
      var title = titleInput.value.trim();
      var budget = budgetInput.value.trim();
      if (!title) errors.title = "Give your trip a name.";
      if (!state.travelStyle) errors.travel_style = "Pick a travel style.";
      if (state.interests.size === 0) errors.interests = "Pick at least one interest.";
      if (!budget || Number(budget) < 0) errors.budget = "Enter a budget number.";
      if (!startInput.value) errors.start_date = "Pick a start date.";
      if (startInput.value && endInput.value && endInput.value < startInput.value) {
        errors.end_date = "End date is before start.";
      }
      showError("title-error", errors.title || "");
      showError("style-error", errors.travel_style || "");
      showError("interests-error", errors.interests || "");
      showError("budget-error", errors.budget || "");
      showError("start-error", errors.start_date || "");
      showError("end-error", errors.end_date || "");
      if (Object.keys(errors).length) return;

      var payload = {
        title: title,
        travel_style: state.travelStyle,
        interests: Array.from(state.interests),
        no_of_travelers: Number(travelersInput.value) || 1,
        budget: Number(budget),
        no_of_days: Number(daysInput.value) || 1,
        start_date: startInput.value,
        end_date: endInput.value || startInput.value
      };
      var submit = form.querySelector('button[type="submit"]');
      submit.disabled = true;
      submit.textContent = "Creating…";

      It.apiPost("/v1/trips", payload, { auth: true }).then(function (res) {
        if (res.ok) {
          var trip = It.app.unwrapData(res);
          It.app.showToast("Trip created — happy planning.", "success");
          global.location.href = "/trip.html?id=" + (trip && trip.id ? trip.id : "");
        } else {
          var body = res.body || {};
          var anyField = false;
          if (body.errors) {
            Object.keys(body.errors).forEach(function (key) {
              var first = body.errors[key][0];
              if (key === "title") showError("title-error", first);
              if (key === "travel_style") showError("style-error", first);
              if (key === "interests") showError("interests-error", first);
              if (key === "budget") showError("budget-error", first);
              if (key === "start_date") showError("start-error", first);
              if (key === "end_date") showError("end-error", first);
            });
            anyField = true;
          }
          if (!anyField && body.message) It.app.showToast(body.message, "error");
          submit.disabled = false;
          submit.textContent = "Create trip";
        }
      }).catch(function () {
        It.app.showToast("Could not create the trip.", "error");
        submit.disabled = false;
        submit.textContent = "Create trip";
      });
    });
  });
})(window);
