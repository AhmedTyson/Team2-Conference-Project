/**
 * survey.js — survey detail (converted from React SurveyDetailPage).
 * ?id=N. Ticket-style profile card + edit/delete for owner.
 * Depends on app-shell.js (It.app).
 */
(function (global) {
  "use strict";

  var It = global.Itinari;
  if (!It || !It.app) return;

  var id = Number(new URLSearchParams(global.location.search).get("id")) || 0;
  var page = document.getElementById("survey-page");

  function el(id) { return document.getElementById(id); }

  function budgetLabel(level) {
    return String(level || "").charAt(0).toUpperCase() + String(level || "").slice(1);
  }

  It.app.boot(function (user) {
    if (!id) {
      page.innerHTML = '<div class="card card--flat"><h2 class="page-section__title">Survey not found.</h2>' +
        '<a href="/surveys.html" class="btn btn--primary">Back to surveys</a></div>';
      return;
    }
    It.apiGet("/surveys/" + id, { auth: true }).then(function (res) {
      var s = It.app.unwrapData(res);
      if (!res.ok || !s) {
        page.innerHTML = '<div class="card card--flat"><h2 class="page-section__title">Survey not found.</h2>' +
          '<p class="page-section__lead">It may have been removed — or the link is wrong.</p>' +
          '<a href="/surveys.html" class="btn btn--primary">Back to surveys</a></div>';
        return;
      }
      var created = new Date(s.created_at).toLocaleDateString();
      var isOwner = user && s.user_id === user.id;
      var actions = "";
      if (isOwner) {
        actions = '<div class="btn-row">' +
          '<a href="/survey-form.html?id=' + s.id + '" class="btn btn--primary">Edit survey</a>' +
          '<button type="button" id="survey-delete" class="btn btn--ghost btn--danger">Delete</button></div>';
      }
      page.innerHTML =
        '<header class="page-header"><p class="page-header__eyebrow">Survey #' + s.id + " · Saved " + created + "</p>" +
        '<h1 class="page-header__title">' + It.app.esc(s.travel_style) + " travels</h1>" +
        '<p class="page-header__lead">Your on-record travel profile — kept safe for future trip planning.</p>' +
        actions + "</header>" +
        '<div class="card card--flat">' +
        '<div style="display:flex;flex-direction:column;gap:var(--space-3);">' +
        '<div style="display:flex;justify-content:space-between;"><span style="color:hsl(var(--muted-foreground));">Travel style</span><strong style="font-size:18px;">' + It.app.esc(s.travel_style) + "</strong></div>" +
        '<div style="display:flex;justify-content:space-between;"><span style="color:hsl(var(--muted-foreground));">Budget level</span><span class="badge badge--warn">' + budgetLabel(s.budget_level) + "</span></div>" +
        '<div><span style="color:hsl(var(--muted-foreground));display:block;margin-bottom:var(--space-2);">Interests</span>' +
        '<div class="chip-row">' + (s.interests || []).map(function (i) {
          return '<span class="chip">' + It.app.esc(i) + "</span>";
        }).join("") + "</div></div></div></div>";

      var del = el("survey-delete");
      if (del) {
        del.addEventListener("click", function () {
          if (!global.confirm("Delete this survey for good?")) return;
          del.disabled = true;
          del.textContent = "Deleting…";
          It.apiDelete("/surveys/" + id, { auth: true }).then(function (res) {
            if (res.ok) {
              It.app.showToast("Survey deleted.", "info");
              global.location.href = "/surveys.html";
            } else {
              It.app.showToast((res.body && res.body.message) || "Could not delete the survey.", "error");
              del.disabled = false;
              del.textContent = "Delete";
            }
          }).catch(function () {
            It.app.showToast("Could not delete the survey.", "error");
            del.disabled = false;
            del.textContent = "Delete";
          });
        });
      }
    }).catch(function () {
      page.innerHTML = '<div class="error-card"><p>Could not load this survey.</p>' +
        '<a href="/surveys.html" class="btn btn--primary">Back to surveys</a></div>';
    });
  });
})(window);
