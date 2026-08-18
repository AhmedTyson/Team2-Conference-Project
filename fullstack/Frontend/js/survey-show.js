/**
 * survey-show.js — Survey Show (survey.html?id=N).
 * GET /surveys/{id} (auth, owner only) → renders the saved answers.
 * Owner actions: Change answers (survey-answer.html), Delete, Back.
 * 404 / not-owner → not-found state.
 */
(function (global) {
  "use strict";

  const It = global.Itinera;
  const SC = It && It.surveysCore;
  if (!SC) return;

  const bodyEl = document.getElementById("surveyBody");
  const titleEl = document.getElementById("surveyTitle");
  const id = new URLSearchParams(global.location.search).get("id");

  document.addEventListener("itinera:auth", function () { if (SC.isMember()) load(); });

  function notFound(title, sub) {
    titleEl.textContent = "Survey";
    bodyEl.innerHTML =
      '<div class="glass-card p-8 text-center">' +
      '<i class="fas fa-clipboard-question text-3xl text-white/30" aria-hidden="true"></i>' +
      '<h3 class="mt-4 text-lg font-bold">' + SC.escapeHtml(title) + "</h3>" +
      '<p class="mt-2 text-white/45 text-sm">' + SC.escapeHtml(sub) + "</p>" +
      '<div class="mt-6"><a href="surveys.html" class="btn-outline"><i class="fas fa-arrow-left" aria-hidden="true"></i>Back to surveys</a></div>' +
      "</div>";
  }

  function render(s) {
    titleEl.textContent = s.travel_style ? "Travel style: " + s.travel_style : "Survey";
    bodyEl.innerHTML =
      '<div class="glass-card p-8">' +
      '<div class="flex items-start justify-between gap-3 flex-wrap mb-2">' +
      "<div>" +
      '<p class="text-xs uppercase tracking-widest text-white/35 font-bold">Saved ' + SC.fmtDate(s.created_at) + "</p>" +
      '<h3 class="text-xl font-bold mt-1">' + SC.escapeHtml(s.travel_style || "Untitled survey") + "</h3>" +
      "</div>" +
      '<span class="chip"><i class="fas fa-wallet" aria-hidden="true"></i>' + SC.budgetLabel(s.budget_level) + "</span>" +
      "</div>" +
      '<div class="mt-4">' +
      '<div class="answer-row"><span class="a-label">Travel style</span><span class="a-value font-semibold text-white">' + SC.escapeHtml(s.travel_style || "—") + "</span></div>" +
      '<div class="answer-row"><span class="a-label">Budget</span><span class="a-value font-semibold text-white">' + SC.budgetLabel(s.budget_level) + "</span></div>" +
      '<div class="answer-row"><span class="a-label">Interests</span><span class="a-value"><span class="flex flex-wrap gap-2 justify-end">' + SC.interestChipsHtml(s.interests) + "</span></span></div>" +
      '<div class="answer-row"><span class="a-label">Updated</span><span class="a-value text-white/60">' + SC.fmtDate(s.updated_at) + "</span></div>" +
      "</div>" +
      '<div class="flex items-center justify-between gap-3 mt-6 flex-wrap">' +
      '<a href="surveys.html" class="btn-outline"><i class="fas fa-arrow-left" aria-hidden="true"></i>Back</a>' +
      '<div class="flex items-center gap-3 flex-wrap">' +
      '<a href="survey-answer.html?id=' + encodeURIComponent(s.id) + '" class="btn-primary"><i class="fas fa-pen" aria-hidden="true"></i>Change answers</a>' +
      '<button type="button" class="btn-outline !text-red-400 !border-red-500/40" id="delSurvey"><i class="fas fa-trash" aria-hidden="true"></i>Delete</button>' +
      "</div></div>" +
      "</div>";

    document.getElementById("delSurvey").addEventListener("click", function () {
      if (!global.confirm("Delete this survey? This cannot be undone.")) return;
      const btn = document.getElementById("delSurvey");
      btn.disabled = true;
      It.apiDelete(SC.ROUTES.survey(s.id), { auth: true })
        .then(function (res) {
          if (res.ok) {
            if (typeof global.toast === "function") global.toast("Survey deleted.");
            global.location.href = "surveys.html";
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
  }

  function load() {
    if (!id) { notFound("Survey not found", "No survey id was given."); return; }
    It.apiGet(SC.ROUTES.survey(id), { auth: true })
      .then(function (res) {
        if (!res.ok) {
          notFound(
            "Survey not found",
            "It may have been deleted, or you are not its owner. Only your own surveys are visible."
          );
          return;
        }
        render((res.body && res.body.data) || {});
      })
      .catch(function () {
        notFound("Could not load this survey", "The server is unreachable right now. Please try again shortly.");
      });
  }

  if (!SC.gate(bodyEl, "Sign in to view this survey", "Only the survey owner can view it.")) return;
  load();
})(window);
