/**
 * profile.js — Profile Settings page.
 * Pre-fills from GET /api/user (me) and saves via PATCH /v1/profile.
 * Accepts name, email, phone, optional profile_image (multipart) and an
 * optional password (+ password_confirmation, min 8, confirmed).
 */
(function (global) {
  "use strict";

  const It = global.Itinari;
  const $ = function (id) { return document.getElementById(id); };

  let currentUser = null;
  let pendingAvatarFile = null;

  function imgUrl(src) {
    if (!src) return null;
    if (/^https?:\/\//i.test(src)) return src;
    return It.CONFIG.apiBase.replace(/\/api$/, "") + src;
  }

  function renderAvatar() {
    const preview = $("avatar-preview");
    if (!preview) return;
    const removeBtn = $("remove-avatar-btn");
    const fileNameEl = $("avatar-filename");

    if (pendingAvatarFile) {
      const reader = new FileReader();
      reader.onload = function () {
        preview.innerHTML = "";
        const img = document.createElement("img");
        img.src = reader.result;
        preview.appendChild(img);
      };
      reader.readAsDataURL(pendingAvatarFile);
      if (fileNameEl) fileNameEl.textContent = pendingAvatarFile.name;
      if (removeBtn) removeBtn.hidden = false;
      return;
    }

    if (currentUser && currentUser.profile_image) {
      preview.innerHTML = "";
      const img = document.createElement("img");
      img.src = imgUrl(currentUser.profile_image);
      preview.appendChild(img);
      if (fileNameEl) fileNameEl.textContent = "";
      if (removeBtn) removeBtn.hidden = false;
    } else {
      preview.innerHTML = "";
      preview.textContent = currentUser && currentUser.name
        ? currentUser.name.charAt(0).toUpperCase()
        : "U";
      if (fileNameEl) fileNameEl.textContent = "";
      if (removeBtn) removeBtn.hidden = true;
    }
  }

  function fillForm(user) {
    $("name").value = user.name || "";
    $("email").value = user.email || "";
    $("phone").value = user.phone || "";
    $("profile-email-static").textContent = user.email || "–";
    const roles = typeof user.roles === "string" ? [user.roles] : (user.roles || []);
    $("profile-role-static").textContent = roles.length ? roles.join(", ") : "Member";
    renderAvatar();
  }

  function setFieldError(name, msg) {
    const err = $("err-" + name);
    const input = $(name);
    if (err) {
      err.textContent = msg || "";
      err.classList.toggle("is-show", !!msg);
    }
    if (input) input.classList.toggle("is-invalid-ring", !!msg);
  }

  function clearFieldErrors() {
    ["name", "email", "phone", "password", "password_confirmation"].forEach(function (n) {
      setFieldError(n, "");
    });
  }

  function validate() {
    let ok = true;
    const name = $("name").value.trim();
    const email = $("email").value.trim();
    const phone = $("phone").value.trim();
    const password = $("password").value;
    const confirmation = $("password_confirmation").value;

    if (!name) { setFieldError("name", "Please enter your name."); ok = false; }
    if (!email) { setFieldError("email", "Please enter your email address."); ok = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFieldError("email", "Please enter a valid email address."); ok = false; }

    if (password) {
      if (password.length < 8) { setFieldError("password", "Password must be at least 8 characters."); ok = false; }
      if (password !== confirmation) { setFieldError("password_confirmation", "Password confirmation does not match."); ok = false; }
    } else if (confirmation) {
      setFieldError("password", "Enter a new password to confirm it.");
      ok = false;
    }
    return ok;
  }

  function collectPayload() {
    const fd = new FormData();
    fd.append("name", $("name").value.trim());
    fd.append("email", $("email").value.trim());
    const phone = $("phone").value.trim();
    if (phone) fd.append("phone", phone);
    const password = $("password").value;
    if (password) {
      fd.append("password", password);
      fd.append("password_confirmation", $("password_confirmation").value);
    }
    if (pendingAvatarFile) fd.append("profile_image", pendingAvatarFile);
    return fd;
  }

  function showServerErrors(body) {
    if (body && body.errors && typeof body.errors === "object") {
      Object.keys(body.errors).forEach(function (key) {
        const msgs = body.errors[key];
        setFieldError(key, Array.isArray(msgs) ? msgs[0] : msgs);
      });
    }
  }

  function saveProfile(e) {
    if (e) e.preventDefault();
    clearFieldErrors();
    if (!validate()) return;

    const btn = $("save-btn");
    It.feedback.loading(btn, true);
    const formEl = $("profile-form");

    It.apiPatch("/v1/profile", collectPayload(), {})
      .then(function (r) {
        It.feedback.loading(btn, false);
        if (r.ok) {
          It.feedback.successPulse(formEl);
          const updated = r.body && r.body.user;
          if (updated) {
            currentUser = {
              id: currentUser && currentUser.id ? currentUser.id : updated.id,
              name: updated.name ? updated.name : (currentUser ? currentUser.name : ""),
              email: updated.email ? updated.email : (currentUser ? currentUser.email : ""),
              roles: currentUser && currentUser.roles ? currentUser.roles : [],
              profile_image: updated.profile_image,
            };
            pendingAvatarFile = null;
            fillForm(currentUser);
          }
          $("password").value = "";
          $("password_confirmation").value = "";
          It.feedback.toast((r.body && r.body.message) || "Profile updated successfully.", "ok");
        } else {
          showServerErrors(r.body);
          It.feedback.banner((r.body && (r.body.message || r.body.error)) || "Could not save changes.", "is-error");
        }
      })
      .catch(function () {
        It.feedback.loading(btn, false);
        It.feedback.banner("Could not reach the server. Please try again.", "is-error");
      });
  }

  function resetForm() {
    clearFieldErrors();
    pendingAvatarFile = null;
    if (currentUser) fillForm(currentUser);
    $("password").value = "";
    $("password_confirmation").value = "";
  }

  // Boot: guard + load user
  It.session.currentUser().then(function (user) {
    if (!user) {
      It.session.redirectToLogin();
      return;
    }
    currentUser = user;
    const nameEl = $("user-display-name");
    const roleEl = $("user-display-role");
    if (nameEl) nameEl.textContent = user.name || "Member";
    if (roleEl) {
      const role = It.session.roleOf(user);
      roleEl.textContent = role ? role.replace(/_/g, " ") : "Member";
    }
    const avatar = $("avatar-letters");
    if (avatar && user.name) avatar.textContent = user.name.charAt(0).toUpperCase();
    fillForm(user);
  });

  $("profile-form").addEventListener("submit", saveProfile);
  $("reset-btn").addEventListener("click", resetForm);

  const fileInput = $("avatar-file-input");
  $("upload-avatar-btn").addEventListener("click", function () { fileInput.click(); });
  fileInput.addEventListener("change", function () {
    if (fileInput.files && fileInput.files.length) {
      pendingAvatarFile = fileInput.files[0];
      renderAvatar();
    }
  });
  $("remove-avatar-btn").addEventListener("click", function () {
    pendingAvatarFile = null;
    fileInput.value = "";
    renderAvatar();
  });

  const logoutBtn = $("logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", function () { It.session.logout(); });
})(window);
