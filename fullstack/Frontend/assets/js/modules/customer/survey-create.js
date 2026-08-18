/**
 * survey-create.js — Survey Create (survey-create.html).
 * POST /surveys { travel_style, budget_level, interests[] } → 201 → surveys.html.
 */
(function (global) {
  "use strict";

  const It = global.Itinera;
  const SC = It && It.surveysCore;
  if (!SC) return;

  const host = document.getElementById("surveyFormHost");
  const formErr = document.getElementById("formErr");
  const createBtn = document.getElementById("createBtn");

  document.addEventListener("itinera:auth", function () {
    if (SC.isMember()) boot();
  });

  function boot() {
    const form = SC.buildForm(host, null);

    createBtn.addEventListener("click", function () {
      form.clearError();
      formErr.classList.add("hidden");
      const payload = form.collect();
      if (!payload) return;

      createBtn.disabled = true;
      createBtn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Creating…';

      It.apiPost(SC.ROUTES.surveys, payload, { auth: true })
        .then(function (res) {
          if (res.ok) {
            if (typeof global.toast === "function") global.toast("Survey created.");
            global.location.href = "surveys.html";
            return;
          }
          createBtn.disabled = false;
          createBtn.innerHTML = '<i class="fas fa-paper-plane" aria-hidden="true"></i>Create survey';
          const body = res.body || {};
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
          formErr.textContent = shown ? "" : (body.message || "Could not create the survey. Please try again.");
          formErr.classList.toggle("hidden", !formErr.textContent);
        })
        .catch(function () {
          createBtn.disabled = false;
          createBtn.innerHTML = '<i class="fas fa-paper-plane" aria-hidden="true"></i>Create survey';
          formErr.textContent = "Could not reach the server. Please try again.";
          formErr.classList.remove("hidden");
        });
    });
  }

  if (!SC.gate(host, "Sign in to create a survey", "Surveys are stored on your account — create one after logging in.")) return;
  boot();
})(window);
