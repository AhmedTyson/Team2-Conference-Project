/**
 * admin-profile.js — Admin Profile page.
 * Pre-fills from GET /v1/user (me) and saves via PATCH /v1/profile.
 * Details form sends multipart (name, email, phone, optional profile_image);
 * password form sends JSON (password + password_confirmation, min 8).
 * Mirror of the public profile.js pattern with admin chrome integration.
 */
(function (global) {
  "use strict";

  const It = global.Itinari;
  function $ (id) { return document.getElementById(id); }

  let currentUser = null;
  let pendingAvatarFile = null;

  function imgUrl(src) {
    if (!src) return null;
    if (/^https?:\/\//i.test(src)) return src;
    return It.CONFIG.apiBase.replace(/\/api$/, "") + src;
  }

  function renderAvatar() {
    const img = $("avatar-img");
    const initials = $("avatar-initials");
    if (!img || !initials) return;

    if (pendingAvatarFile) {
      const reader = new FileReader();
      reader.onload = function () {
        img.src = reader.result;
        img.hidden = false;
        initials.hidden = true;
      };
      reader.readAsDataURL(pendingAvatarFile);
      return;
    }

    const src = currentUser && currentUser.profile_image ? imgUrl(currentUser.profile_image) : null;
    if (src) {
      img.src = src;
      img.hidden = false;
      initials.hidden = true;
    } else {
      const name = (currentUser && currentUser.name) || "";
      const parts = name.trim().split(/\s+/);
      initials.textContent = parts.length > 1
        ? (parts[0][0] || "") + (parts[parts.length - 1][0] || "")
        : (name ? name[0] : "U");
      img.hidden = true;
      initials.hidden = false;
    }
  }

  function fillForm(user) {
    $("pf-name").value = user.name || "";
    $("pf-email").value = user.email || "";
    $("pf-phone").value = user.phone || "";
    renderAvatar();
  }

  function setFieldError(name, msg) {
    const input = $(name);
    if (input) input.classList.toggle("is-invalid-ring", !!msg);
    input.setAttribute("aria-invalid", msg ? "true" : "false");
  }

  function clearFieldErrors() {
    ["pf-name", "pf-email", "pf-phone", "pf-password", "pf-password-confirm"].forEach(function (n) {
      setFieldError(n, "");
    });
  }

  function validateDetails() {
    let ok = true;
    const email = $("pf-email").value.trim();
    if (!$("pf-name").value.trim()) { setFieldError("pf-name", "required"); ok = false; }
    if (!email) { setFieldError("pf-email", "required"); ok = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFieldError("pf-email", "invalid"); ok = false; }
    return ok;
  }

  function validatePassword() {
    const password = $("pf-password").value;
    const confirmation = $("pf-password-confirm").value;
    if (!password && !confirmation) return true;
    let ok = true;
    if (password.length < 8) { setFieldError("pf-password", "min 8"); ok = false; }
    if (password !== confirmation) { setFieldError("pf-password-confirm", "mismatch"); ok = false; }
    if (!password) { setFieldError("pf-password", "required"); ok = false; }
    return ok;
  }

  function showServerErrors(body) {
    if (body && body.errors && typeof body.errors === "object") {
      Object.keys(body.errors).forEach(function (key) {
        const msgs = body.errors[key];
        const map = { password_confirmation: "pf-password-confirm", password: "pf-password", name: "pf-name", email: "pf-email", phone: "pf-phone", profile_image: "avatar-file" };
        setFieldError(map[key] || key, Array.isArray(msgs) ? msgs[0] : msgs);
      });
    }
  }

  function saveDetails(e) {
    e.preventDefault();
    clearFieldErrors();
    if (!validateDetails()) return;

    const btn = $("profile-save");
    const formEl = $("profile-form");
    It.feedback.loading(btn, true);

    const fd = new FormData();
    fd.append("name", $("pf-name").value.trim());
    fd.append("email", $("pf-email").value.trim());
    const phone = $("pf-phone").value.trim();
    if (phone) fd.append("phone", phone);
    if (pendingAvatarFile) fd.append("profile_image", pendingAvatarFile);

    It.apiPatch("/v1/profile", fd, { auth: true }).then(function (r) {
      It.feedback.loading(btn, false);
      if (r.ok) {
        It.feedback.successPulse(formEl);
        const updated = r.body && r.body.user;
        if (updated) {
          currentUser = {
            id: currentUser ? currentUser.id : updated.id,
            name: updated.name || (currentUser ? currentUser.name : ""),
            email: updated.email || (currentUser ? currentUser.email : ""),
            phone: (currentUser ? currentUser.phone : "") ,
            roles: currentUser && currentUser.roles ? currentUser.roles : [],
            profile_image: updated.profile_image,
          };
          pendingAvatarFile = null;
          fillForm(currentUser);
          const nameEl = $("chip-name");
          const roleEl = $("chip-role");
          if (nameEl) nameEl.textContent = currentUser.name;
          if (roleEl) roleEl.textContent = It.session.roleOf(currentUser) || "admin";
          $("avatar-file").value = "";
        }
        It.feedback.toast((r.body && r.body.message) || "Profile updated successfully.", "ok");
      } else {
        showServerErrors(r.body);
        It.feedback.banner((r.body && (r.body.message || r.body.error)) || "Could not save changes.", "is-error");
      }
    }).catch(function () {
      It.feedback.loading(btn, false);
      It.feedback.banner("Could not reach the server. Please try again.", "is-error");
    });
  }

  function savePassword(e) {
    e.preventDefault();
    clearFieldErrors();
    if (!validatePassword()) return;

    const btn = $("password-save");
    const formEl = $("password-form");
    It.feedback.loading(btn, true);

    It.apiPatch("/v1/profile", {
      password: $("pf-password").value,
      password_confirmation: $("pf-password-confirm").value,
    }, { auth: true }).then(function (r) {
      It.feedback.loading(btn, false);
      if (r.ok) {
        It.feedback.successPulse(formEl);
        $("pf-password").value = "";
        $("pf-password-confirm").value = "";
        It.feedback.toast((r.body && r.body.message) || "Password updated successfully.", "ok");
      } else {
        showServerErrors(r.body);
        It.feedback.banner((r.body && (r.body.message || r.body.error)) || "Could not update password.", "is-error");
      }
    }).catch(function () {
      It.feedback.loading(btn, false);
      It.feedback.banner("Could not reach the server. Please try again.", "is-error");
    });
  }

  function init() {
    if (!It.session.hasToken()) { It.session.redirectToLogin(); return; }
    It.session.currentUser().then(function (user) {
      if (!user) { It.session.clearSession(); It.session.redirectToLogin(); return; }
      if (!It.session.isAdminRole(It.session.roleOf(user))) {
        It.session.clearSession();
        It.session.redirectToLogin();
        return;
      }
      currentUser = user;
      fillForm(user);
      $("profile-subtitle").textContent = "Signed in as " + (user.email || "admin");
    });
  }

  $("profile-form").addEventListener("submit", saveDetails);
  $("password-form").addEventListener("submit", savePassword);

  const fileInput = $("avatar-file");
  $("avatar-pick").addEventListener("click", function () { fileInput.click(); });
  fileInput.addEventListener("change", function () {
    if (fileInput.files && fileInput.files.length) {
      pendingAvatarFile = fileInput.files[0];
      renderAvatar();
    }
  });

  init();
})(window);
