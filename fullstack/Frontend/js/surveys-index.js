/**
 * surveys-index.js — Surveys Index (surveys.html).
 * Lists the member's own surveys via GET /surveys (auth).
 * Each card: travel style, budget chip, interests chips, created date.
 * Actions: View, Change answers, Delete (DELETE /surveys/{id}).
 */
(function (global) {
  "use strict";

  const It = global.Itinera;
  const SC = It && It.surveysCore;
  if (!SC) return;

  const listEl = document.getElementById("surveysList");

  function card(s) {
    const el = document.createElement("div");
    el.className = "survey-card";
    el.innerHTML =
      '<div class="flex items-start justify-between gap-3 flex-wrap">' +
      '<div>' +
      '<div class="text-white font-bold text-lg">' + SC.escapeHtml(s.travel_style || "Untitled survey") + "</div>" +
      '<div class="text-xs text-white/35 mt-1">Created ' + SC.fmtDate(s.created_at) + "</div>" +
      "</div>" +
      '<span class="chip"><i class="fas fa-wallet" aria-hidden="true"></i>' + SC.budgetLabel(s.budget_level) + "</span>" +
      "</div>" +
      '<div class="flex flex-wrap gap-2">' + SC.interestChipsHtml(s.interests) + "</div>" +
      '<div class="flex items-center gap-3 mt-1 flex-wrap">' +
      '<a href="survey.html?id=' + encodeURIComponent(s.id) + '" class="btn-outline text-xs px-4 py-2"><i class="fas fa-eye" aria-hidden="true"></i>View</a>' +
      '<a href="survey-answer.html?id=' + encodeURIComponent(s.id) + '" class="btn-outline text-xs px-4 py-2"><i class="fas fa-pen" aria-hidden="true"></i>Change answers</a>' +
      '<button type="button" class="btn-outline text-xs px-4 py-2 !text-red-400 !border-red-500/40" data-del="' + s.id + '"><i class="fas fa-trash" aria-hidden="true"></i>Delete</button>' +
      "</div>";
    return el;
  }

  function render(surveys) {
    listEl.innerHTML = "";
    if (!surveys.length) {
      listEl.innerHTML =
        '<div style="grid-column:1/-1;">' +
        '<div class="empty-state">' +
        '<i class="fas fa-clipboard-list" aria-hidden="true"></i>' +
        '<h3 class="mt-4 text-lg font-bold">No surveys yet</h3>' +
        '<p class="mt-2 text-white/45 text-sm max-w-sm mx-auto">Create your first travel survey — it takes less than a minute.</p>' +
        '<a href="survey-create.html" class="btn-primary mt-5"><i class="fas fa-plus" aria-hidden="true"></i>Create a survey</a>' +
        "</div></div>";
      return;
    }
    surveys.forEach(function (s) { listEl.appendChild(card(s)); });

    listEl.querySelectorAll("[data-del]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const id = btn.dataset.del;
        if (!global.confirm("Delete this survey? This cannot be undone.")) return;
        btn.disabled = true;
        It.apiDelete(SC.ROUTES.survey(id), { auth: true })
          .then(function (res) {
            if (res.ok) {
              if (typeof global.toast === "function") global.toast("Survey deleted.");
              btn.closest(".survey-card").remove();
              const remaining = listEl.querySelectorAll(".survey-card").length;
              if (remaining === 0) render([]);
            } else {
              btn.disabled = false;
              if (typeof global.toast === "function") {
                global.toast((res.body && (res.body.message || res.body.error)) || "Could not delete the survey.", true);
              }
            }
          })
          .catch(function () {
            btn.disabled = false;
            if (typeof global.toast === "function") global.toast("Could not reach the server. Please try again.", true);
          });
      });
    });
  }

  function load() {
    It.apiGet(SC.ROUTES.surveys, { auth: true })
      .then(function (res) {
        if (!res.ok) {
          render([]);
          return;
        }
        render(Array.isArray(res.body && res.body.data) ? res.body.data : []);
      })
      .catch(function () {
        listEl.innerHTML =
          '<div style="grid-column:1/-1;">' +
          '<div class="empty-state">' +
          '<i class="fas fa-wifi" aria-hidden="true"></i>' +
          '<h3 class="mt-4 text-lg font-bold">Could not load surveys</h3>' +
          '<p class="mt-2 text-white/45 text-sm">The server is unreachable right now. Please try again shortly.</p>' +
          "</div></div>";
      });
  }

  document.addEventListener("itinera:auth", function () { if (SC.isMember()) load(); });

  if (!SC.gate(listEl, "Sign in to view your surveys", "Your travel surveys are stored on your account.")) return;
  load();
})(window);
