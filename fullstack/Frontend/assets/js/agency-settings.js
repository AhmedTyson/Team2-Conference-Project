/**
 * agency-settings.js — Agency Profile & Settings controller.
 * Handles loading and saving agency profile data via /agency/profile.
 */
(function (global) {
  "use strict";

  var It = global.Itinera;
  if (!It) return;

  function el(id) { return document.getElementById(id); }

  function banner(msg, type) {
    if (It.feedback && It.feedback.banner) {
      It.feedback.banner(msg, type);
    } else {
      alert(msg);
    }
  }

  function loadProfile() {
    if (!It.apiGet) return;
    It.apiGet("/agency/profile", { auth: true })
      .then(function (res) {
        var data = {};
        if (res && res.body && res.body.data) {
          data = res.body.data;
        } else if (res && res.data) {
          data = res.data;
        } else if (res && typeof res === "object") {
          data = res;
        }
        if (el("agency-name"))  el("agency-name").value  = data.name  || "";
        if (el("agency-email")) el("agency-email").value = data.email || "";
        if (el("agency-phone")) el("agency-phone").value = data.phone || "";
        if (el("agency-bio"))   el("agency-bio").value   = data.bio   || "";
      })
      .catch(function () {
        banner("Could not load agency profile.", "is-error");
      });
  }

  function saveProfile(e) {
    e.preventDefault();
    var submit = e.target.querySelector('[type="submit"]');
    if (submit) { submit.disabled = true; submit.textContent = "Saving…"; }

    var payload = {
      name:  el("agency-name")  ? el("agency-name").value.trim()  : "",
      phone: el("agency-phone") ? el("agency-phone").value.trim() : "",
      bio:   el("agency-bio")   ? el("agency-bio").value.trim()   : "",
    };

    var apiCall = It.apiPut || (It.api && It.api.put);
    if (!apiCall) {
      banner("API client not ready. Please refresh.", "is-error");
      if (submit) { submit.disabled = false; submit.textContent = "Save Profile Changes"; }
      return;
    }

    apiCall("/agency/profile", payload, { auth: true })
      .then(function () {
        banner("Agency profile updated successfully.", "is-ok");
        if (submit) { submit.disabled = false; submit.textContent = "Save Profile Changes"; }
      })
      .catch(function () {
        banner("Failed to update profile. Please try again.", "is-error");
        if (submit) { submit.disabled = false; submit.textContent = "Save Profile Changes"; }
      });
  }

  function boot() {
    loadProfile();
    var form = el("agency-profile-form");
    if (form) form.addEventListener("submit", saveProfile);
  }

  document.addEventListener("itinera:ready", boot);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

})(window);
