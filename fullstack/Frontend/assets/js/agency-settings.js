/**
 * agency-settings.js — Agency Profile settings controller.
 */
(function (global) {
  "use strict";

  const It = global.Itinari;

  function el(id) { return document.getElementById(id); }

  function loadProfile() {
    It.apiGet("/agency/profile", { auth: true }).then(function (res) {
      const data = (res && res.data) || res || {};
      if (el("agency-name")) el("agency-name").value = data.name || "";
      if (el("agency-email")) el("agency-email").value = data.email || "";
      if (el("agency-phone")) el("agency-phone").value = data.phone || "";
      if (el("agency-bio")) el("agency-bio").value = data.bio || "";
    }).catch(function () {
      It.feedback.banner("Could not load agency profile.", "is-error");
    });
  }

  function saveProfile(e) {
    e.preventDefault();
    const payload = {
      name: el("agency-name") ? el("agency-name").value : "",
      phone: el("agency-phone") ? el("agency-phone").value : "",
      bio: el("agency-bio") ? el("agency-bio").value : "",
    };

    It.apiPut("/agency/profile", payload, { auth: true }).then(function () {
      It.feedback.banner("Agency profile updated successfully.", "is-ok");
    }).catch(function () {
      It.feedback.banner("Failed to update profile.", "is-error");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    loadProfile();
    const form = el("agency-profile-form");
    if (form) form.addEventListener("submit", saveProfile);
  });
})(window);
