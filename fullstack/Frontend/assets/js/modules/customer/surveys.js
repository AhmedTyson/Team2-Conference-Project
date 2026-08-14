/**
 * surveys.js — survey list (converted from React SurveyListPage).
 * Stats band + survey cards. Depends on app-shell.js (It.app).
 */
(function (global) {
  "use strict";

  var It = global.Itinari;
  if (!It || !It.app) return;

  var grid = document.getElementById("survey-grid");
  var stats = document.getElementById("survey-stats");

  function el(id) { return document.getElementById(id); }

  function cardFor(s) {
    var created = new Date(s.created_at).toLocaleDateString();
    return '<a href="/survey.html?id=' + s.id + '" class="card card--tile">' +
      '<div class="card__body">' +
      '<div class="card__topline"><span>Survey #' + s.id + "</span><span>→</span></div>" +
      '<h3 class="card__title">' + It.app.esc(s.travel_style) + " travels</h3>" +
      '<p class="card__sub">Saved ' + created + "</p>" +
      '<div class="card__meta">' +
      '<span class="badge badge--warn">' + It.app.esc(String(s.budget_level || "").charAt(0).toUpperCase() + String(s.budget_level || "").slice(1)) + "</span>" +
      '<span class="card__price">' + It.app.esc((s.interests || []).join(" · ")) + "</span>" +
      "</div></div></a>";
  }

  It.app.boot(function (user) {
    It.apiGet("/surveys", { auth: true }).then(function (res) {
      var items = It.app.unwrapData(res);
      if (!Array.isArray(items)) items = [];
      if (stats && items.length) {
        var styles = {};
        var budgets = {};
        items.forEach(function (s) {
          styles[s.travel_style] = (styles[s.travel_style] || 0) + 1;
          budgets[s.budget_level] = (budgets[s.budget_level] || 0) + 1;
        });
        var topStyle = Object.keys(styles).sort(function (a, b) { return styles[b] - styles[a]; })[0];
        var topBudget = Object.keys(budgets).sort(function (a, b) { return budgets[b] - budgets[a]; })[0];
        stats.hidden = false;
        stats.innerHTML =
          '<div class="stat-card"><span class="stat-card__label">Surveys on record</span><span class="stat-card__value">' + items.length + "</span></div>" +
          '<div class="stat-card"><span class="stat-card__label">Most common style</span><span class="stat-card__value" style="font-size:20px;">' + It.app.esc(topStyle || "—") + "</span></div>" +
          '<div class="stat-card"><span class="stat-card__label">Preferred budget</span><span class="stat-card__value" style="font-size:20px;">' + It.app.esc(topBudget ? topBudget.charAt(0).toUpperCase() + topBudget.slice(1) : "—") + "</span></div>";
      }
      if (grid) {
        if (!items.length) {
          grid.innerHTML = '<div class="empty" style="grid-column:1/-1;">' +
            '<span class="empty__icon">✦</span>' +
            '<p class="empty__title">No surveys yet, ' + It.app.esc((user.name || "").split(" ")[0]) + ".</p>" +
            '<p class="empty__text">Tell us your travel style, budget, and interests so we can plan better trips for you.</p>' +
            '<a href="/survey-form.html" class="btn btn--primary">Create your first survey</a></div>';
        } else {
          grid.innerHTML = items.map(cardFor).join("");
        }
      }
    }).catch(function () {
      if (grid) {
        grid.innerHTML = '<div class="error-card" style="grid-column:1/-1;">' +
          '<p>Could not load your surveys.</p>' +
          '<button type="button" class="btn btn--primary" onclick="location.reload()">Retry</button></div>';
      }
    });
  });
})(window);
