/**
 * profile-settings.js — edit profile (converted from React ProfileSettingsPage).
 * Avatar (image/*, ≤2MB, preview), name/email, optional password change.
 * File uploads go via POST + _method=PATCH FormData (PHP dev server only
 * populates $_FILES on POST); JSON fields use PATCH. Depends on app-shell.js.
 */
(function (global) {
  "use strict";

  var It = global.Itinari;
  if (!It || !It.app) return;

  var MAX_AVATAR_BYTES = 2 * 1024 * 1024;

  var form = document.getElementById("profile-form");
  var nameInput = document.getElementById("set-name");
  var emailInput = document.getElementById("set-email");
  var passwordInput = document.getElementById("set-password");
  var confirmInput = document.getElementById("set-password-confirm");
  var avatarInput = document.getElementById("avatar-input");
  var avatarWrap = document.getElementById("avatar-preview");
  var lead = document.getElementById("settings-lead");

  function el(id) { return document.getElementById(id); }
  function showError(id, message) {
    var node = el(id);
    node.textContent = message;
    node.hidden = !message;
  }

  var state = { avatarFile: null };

  function renderAvatar(user) {
    avatarWrap.innerHTML = It.app.imageHtml(user.profile_image || null, user.name || "?", "profile-avatar");
  }

  It.app.boot(function (user) {
    if (!user) return;
    lead.textContent = "Logged in as " + ((user.roles || []).join(", ") || "member") +
      " — manage your avatar, name, email and password.";
    nameInput.value = user.name || "";
    emailInput.value = user.email || "";
    renderAvatar(user);

    el("change-photo").addEventListener("click", function () { avatarInput.click(); });

    avatarInput.addEventListener("change", function () {
      var file = avatarInput.files && avatarInput.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        showError("avatar-error", "Please choose an image file.");
        return;
      }
      if (file.size > MAX_AVATAR_BYTES) {
        showError("avatar-error", "Image must be 2 MB or smaller.");
        return;
      }
      showError("avatar-error", "");
      avatarInput.value = "";
      state.avatarFile = file;
      avatarWrap.innerHTML = '<img class="profile-avatar" src="' + URL.createObjectURL(file) + '" alt="Avatar preview" />';
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var errors = {};
      var name = nameInput.value.trim();
      var email = emailInput.value.trim();
      var password = passwordInput.value;
      if (!name) errors.name = "Name is required.";
      if (!email) errors.email = "Email is required.";
      if (password && password.length < 8) errors.password = "At least 8 characters.";
      if (password !== confirmInput.value) errors.password_confirmation = "Passwords do not match.";
      showError("name-error", errors.name || "");
      showError("email-error", errors.email || "");
      showError("password-error", errors.password || "");
      showError("password-confirm-error", errors.password_confirmation || "");
      if (Object.keys(errors).length) return;

      var submit = form.querySelector('button[type="submit"]');
      submit.disabled = true;
      submit.textContent = "Saving…";

      var request;
      if (state.avatarFile) {
        var formData = new FormData();
        formData.append("name", name);
        formData.append("email", email);
        if (password) {
          formData.append("password", password);
          formData.append("password_confirmation", confirmInput.value);
        }
        formData.append("profile_image", state.avatarFile);
        formData.append("_method", "PATCH");
        var token = It.readToken();
        request = fetch(It.CONFIG.apiBase + "/profile", {
          method: "POST",
          headers: token ? { Authorization: "Bearer " + token } : {},
          body: formData
        }).then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (body) {
            return { ok: res.ok, status: res.status, body: body };
          });
        });
      } else {
        var payload = { name: name, email: email };
        if (password) {
          payload.password = password;
          payload.password_confirmation = confirmInput.value;
        }
        request = It.apiPatch("/profile", payload, { auth: true });
      }

      request.then(function (res) {
        if (res.ok) {
          var updatedUser = (res.body && res.body.data && res.body.data.user) || (res.body && res.body.user) || null;
          if (updatedUser) {
            try { localStorage.setItem("itinari_user", JSON.stringify(updatedUser)); } catch (e) {}
          }
          It.app.showToast("Profile updated.", "success");
          setTimeout(function () { global.location.reload(); }, 600);
        } else {
          var body = res.body || {};
          var anyField = false;
          if (body.errors) {
            Object.keys(body.errors).forEach(function (key) {
              var first = body.errors[key][0];
              if (key === "name") showError("name-error", first);
              if (key === "email") showError("email-error", first);
              if (key === "password") showError("password-error", first);
              if (key === "password_confirmation") showError("password-confirm-error", first);
              if (key === "profile_image") showError("avatar-error", first);
            });
            anyField = true;
          }
          if (!anyField && body.message) It.app.showToast(body.message, "error");
          submit.disabled = false;
          submit.textContent = "Save profile";
        }
      }).catch(function () {
        It.app.showToast("Could not save your profile.", "error");
        submit.disabled = false;
        submit.textContent = "Save profile";
      });
    });
  });
})(window);
