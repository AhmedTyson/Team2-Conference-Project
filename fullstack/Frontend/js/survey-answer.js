/**
 * survey-answer.js — Survey Answer / Edit (survey-answer.html?id=N).
 * Loads the existing survey (GET /surveys/{id}, auth, owner only),
 * pre-fills the form, and saves changes via PUT /surveys/{id}.
 */
(function (global) {
  "use strict";

  const It = global.Itinari;
  const SC = It && It.surveysCore;
  if (!SC) return;

  const host = document.getElementById("surveyFormHost");
  const formErr = document.getElementById("formErr");
  const saveBtn = document.getElementById("saveBtn");
  const editTitle = document.getElementById("editTitle");
  const id = new URLSearchParams(global.location.search).get("id");

  document.addEventListener("itinera:auth", function () { if (SC.isMember()) load(); });

  function missing(message) {
    host.innerHTML =
      '<div class="text-center py-6">' +
      '<i class="fas fa-clipboard-question text-3xl text-white/30" aria-hidden="true"></i>' +
      '<h3 class="mt-4 text-lg font-bold">' + SC.escapeHtml(message) + "</h3>" +
      '<p class="mt-2 text-white/45 text-sm">Only your own surveys can be edited.</p>' +
      '<a href="surveys.html" class="btn-outline mt-6 inline-block"><i class="fas fa-arrow-left" aria-hidden="true"></i>Back to surveys</a>' +
      "</div>";
    saveBtn.hidden = true;
  }

  function load() {
    if (!id) { missing("Survey not found"); return; }
    It.apiGet(SC.ROUTES.survey(id), { auth: true })
      .then(function (res) {
        if (!res.ok) { missing("Survey not found"); return; }
        const s = (res.body && res.body.data) || {};
        editTitle.textContent = "Change your answers";
        const form = SC.buildForm(host, s);
        if (!form) return;

        saveBtn.addEventListener("click", function () {
          form.clearError();
          formErr.classList.add("hidden");
          const payload = form.collect();
          if (!payload) return;

          saveBtn.disabled = true;
          saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Saving…';

          It.apiPut(SC.ROUTES.survey(id), payload, { auth: true })
            .then(function (res2) {
              if (res2.ok) {
                if (typeof global.toast === "function") global.toast("Survey updated.");
                global.location.href = "survey.html?id=" + encodeURIComponent(id);
                return;
              }
              saveBtn.disabled = false;
              saveBtn.innerHTML = '<i class="fas fa-save" aria-hidden="true"></i>Save changes';
              const body = res2.body || {};
              const errors = body.errors || {};
              if (Array.isArray(body.error && body.error.validation_errors)) {
                body.error.validation_errors.forEach(function (ve) {
                  errors[ve.field] = errors[ve.field] || ve.message;
                });
              }
              let shown = false;
              ["travel_style", "budget_level", "interests"].forEach(function (field) {
                if (errors[field]) {
                  form.fieldError(field, Array.isArray(errors[field]) ? errors[field][0] : errors[field]);
                  shown = true;
                }
              });
              formErr.textContent = shown ? "" : (body.message || "Could not save the survey. Please try again.");
              formErr.classList.toggle("hidden", !formErr.textContent);
            })
            .catch(function () {
              saveBtn.disabled = false;
              saveBtn.innerHTML = '<i class="fas fa-save" aria-hidden="true"></i>Save changes';
              formErr.textContent = "Could not reach the server. Please try again.";
              formErr.classList.remove("hidden");
            });
        });
      })
      .catch(function () {
        host.innerHTML =
          '<div class="text-center py-6">' +
          '<i class="fas fa-wifi text-3xl text-white/30" aria-hidden="true"></i>' +
          '<h3 class="mt-4 text-lg font-bold">Could not load this survey</h3>' +
          '<p class="mt-2 text-white/45 text-sm">The server is unreachable right now. Please try again shortly.</p>' +
          "</div>";
        saveBtn.hidden = true;
      });
  }

  if (!SC.gate(host, "Sign in to edit this survey", "Only the survey owner can edit it.")) return;
  load();
})(window);
