/**
 * auth.js — page glue. Wires forms to api.js + validation.js + animations.js.
 * Contains ZERO animation code and ZERO validation rules of its own:
 *   - rules come from Itinari.Rules (validation.js)
 *   - visuals come from Itinari.feedback (animations.js)
 *   - transport comes from Itinari.apiPost (api.js)
 */
(function (global) {
  "use strict";

  const It = global.Itinari;
  const R = It.Rules;
  const fb = It.feedback;

  /* ------------------------------------------------------------------ */
  /* page configuration                                                  */
  /* ------------------------------------------------------------------ */

  const PAGES = {
    login: {
      route: "login",
      fields: {
        email: { on: "blur", rules: [R.required, R.email] },
        password: { on: "blur", rules: [R.required] },
      },
      successNote: "li-success-note",
      onSuccess: function (body, form) {
        const token = It.extractToken(body);
        if (token) It.storeToken(token);
        const user = (body && body.data && body.data.user) || (body && body.user) || (body && body.data) || It._cachedUser;
        if (user && typeof user === "object") {
          try { localStorage.setItem("itinari_user", JSON.stringify(user)); } catch (e) {}
        }
        fb.banner("Logged in — taking you to your dashboard…", "is-ok");
        setTimeout(function () {
          const role = It.session.roleOf(user);
          const destination = It.session.getRedirectPath(role);
          global.location.href = destination;
        }, 900);
      },
    },

    register: {
      route: "register",
      fields: function (form) {
        return {
          name: { on: "blur", rules: [R.required] },
          email: { on: "blur", rules: [R.required, R.email] },
          password: { on: "input", rules: [R.required, R.password] },
          password_confirmation: {
            on: "input",
            rules: [R.required, R.match(function () { return form.elements.password.value; })],
          },
          terms: { on: "change", rules: [R.required] },
        };
      },
      successNote: "rg-success-note",
      onSuccess: function (body, form) {
        const token = It.extractToken(body);
        if (token) It.storeToken(token);
        const email = form.elements.email.value;
        fb.banner("Account created — check your inbox to verify.", "is-ok");
        setTimeout(function () {
          global.location.href = "verify.html" + (email ? "?email=" + encodeURIComponent(email) : "");
        }, 900);
      },
    },

    forgot: {
      route: "forgot",
      fields: {
        email: { on: "blur", rules: [R.required, R.email] },
      },
      successNote: "fo-success-note",
      onSuccess: function () {
        fb.banner("If an account exists, a reset link is on its way.", "is-ok");
      },
    },

    reset: {
      route: "reset",
      fields: function (form) {
        return {
          email: { on: "blur", rules: [R.required, R.email] },
          token: { on: "blur", rules: [R.required] },
          password: { on: "input", rules: [R.required, R.password] },
          password_confirmation: {
            on: "input",
            rules: [R.required, R.match(function () { return form.elements.password.value; })],
          },
        };
      },
      successNote: "rv-success-note",
      onSuccess: function () {
        fb.banner("Password updated — redirecting to log in…", "is-ok");
        setTimeout(function () {
          global.location.href = "login.html";
        }, 1400);
      },
    },
  };

  /* ------------------------------------------------------------------ */
  /* field controller: validation state on DOM                           */
  /* ------------------------------------------------------------------ */

  function createField(form, name, cfg) {
    const input = form.elements[name];
    if (!input) return null;
    const hint = document.getElementById("hint-" + name);

    function setState(err, checked) {
      const group = input.closest(".field");
      if (group) group.classList.toggle("has-error", !!err);
      input.classList.toggle("is-error", !!err);
      input.classList.toggle("is-valid", checked && !err);
      input.setAttribute("aria-invalid", err ? "true" : "false");
      if (hint) {
        hint.textContent = err || "";
        hint.classList.toggle("show", !!err);
      }
    }

    function validate(opts) {
      const isCheckbox = input.type === "checkbox";
      const value = isCheckbox ? input.checked : input.value;
      let err = It.validate(value, cfg.rules);
      if (err && isCheckbox && name === "terms") err = "Please accept the terms to continue.";
      setState(err, true);
      if (err && opts && opts.shake) fb.shakeField(isCheckbox ? input.closest(".terms-field") : input);
      if (!err) fb.validFlicker(isCheckbox ? input : input);
      return err;
    }

    function showError(msg, shake) {
      setState(msg, false);
      if (shake) fb.shakeField(input);
    }

    // live validation wiring (spec #5: blur for email, keystroke for passwords)
    input.addEventListener(cfg.on, function () {
      validate({ shake: false });
    });
    if (cfg.on === "blur") {
      input.addEventListener("input", function () { setState(null); });
    }
    // password confirm re-checks on the other field's keystrokes too
    if (name === "password_confirmation") {
      const other = form.elements.password;
      if (other) other.addEventListener("input", function () { validate({ shake: false }); });
    }

    return { name, input, validate, showError, clear: () => setState(null) };
  }

  /* ------------------------------------------------------------------ */
  /* phase 5: email availability + strength meter                        */
  /* ------------------------------------------------------------------ */

  // placeholder seed list — swap for real /register availability endpoint later
  const TAKEN_EMAILS = ["admin@threedos.com", "user@example.com", "ada@lovelace.dev"];

  function normalizeEmail(raw) {
    return String(raw || "").trim().toLowerCase();
  }

  function syncStrength(input) {
    const meter = document.getElementById("pw-meter");
    const note = document.getElementById("pw-strength-note");
    const list = document.getElementById("pw-checklist");
    if (!meter) return;
    const r = It.passwordStrength(input.value);
    meter.className = r.score === 0 ? "strength-meter" : "strength-meter " + r.level;
    if (note) {
      note.textContent = r.score === 0 ? "" : (r.level === "weak" ? "Weak — add more variety." : r.level === "fair" ? "Fair — getting stronger." : "Strong — looks great!");
      note.className = r.score === 0 ? "strength-note" : "strength-note " + r.level;
    }
    if (list) {
      Array.prototype.forEach.call(list.children, function (li) {
        const met = r.checks[li.dataset.check];
        li.classList.toggle("met", !!met);
      });
    }
  }

  function wirePasswordExtras(input) {
    if (!input) return;
    input.addEventListener("input", function () { syncStrength(input); });
    syncStrength(input);
  }

  function wireEmailAvailability(input, availEl) {
    if (!input || !availEl) return;
    let timer = null;
    input.addEventListener("input", function () {
      clearTimeout(timer);
      availEl.className = "hint-availability";
      availEl.textContent = "";
      const raw = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) return; // don't check malformed
      availEl.className = "hint-availability checking";
      availEl.textContent = "Checking availability…";
      timer = setTimeout(function () {
        const taken = TAKEN_EMAILS.indexOf(normalizeEmail(raw)) !== -1;
        availEl.className = "hint-availability " + (taken ? "taken" : "available");
        availEl.textContent = taken ? "This email is already registered." : "This email is available.";
      }, 400);
    });
  }

  /* ------------------------------------------------------------------ */
  /* submit flow (spec #1-4)                                             */
  /* ------------------------------------------------------------------ */

  function collectPayload(fields) {
    const payload = {};
    fields.forEach(function (f) { payload[f.name] = f.input.value; });
    return payload;
  }

  function validateAll(fields, shake) {
    let firstBad = null;
    fields.forEach(function (f) {
      const err = f.validate({ shake: shake });
      if (err && !firstBad) firstBad = f;
    });
    return firstBad;
  }

  function mapServerErrors(fields, errors) {
    let handled = false;
    let firstBad = null;
    Object.keys(errors || {}).forEach(function (key) {
      const f = fields.find(function (f) { return f.name === key; });
      if (f) {
        f.showError((errors[key] || ["Invalid value."])[0], true); // spec #4: shake + red border on invalid fields only
        if (!firstBad) firstBad = f;
        handled = true;
      }
    });
    if (firstBad) {
      firstBad.input.scrollIntoView({ behavior: "smooth", block: "center" });
      firstBad.input.focus({ preventScroll: true });
    }
    return handled;
  }

  function initForm(pageName, cfg) {
    const form = document.getElementById("auth-form");
    if (!form) return;
    form.setAttribute("novalidate", "novalidate");

    const fieldDefs = typeof cfg.fields === "function" ? cfg.fields(form) : cfg.fields;

    const fields = [];
    Object.keys(fieldDefs).forEach(function (name) {
      const f = createField(form, name, fieldDefs[name]);
      if (f) fields.push(f);
    });

    // phase 5: password strength meter on register + reset
    if (pageName === "register" || pageName === "reset") {
      wirePasswordExtras(form.elements.password);
    }
    // phase 5: debounced email availability on register
    if (pageName === "register") {
      wireEmailAvailability(form.elements.email, document.getElementById("avail-email"));
    }

form.addEventListener("submit", async function (e) {
      e.preventDefault(); // spec #1
      if (form.dataset.busy === "1") return;

      // local inline validation before hitting the server (spec #5)
      const bad = validateAll(fields, true);
      if (bad) { bad.input.focus(); return; }

      const btn = form.querySelector('button[type="submit"]');
      fb.loading(btn, true); // spec #2
      form.dataset.busy = "1";

      try {
        const res = await It.apiPost(It.CONFIG.routes[cfg.route] || cfg.route, collectPayload(fields));
        if (res.ok) {
          fb.successPulse(form); // spec #3
          cfg.onSuccess(res.body, form);
        } else if (It.isFieldErrors(res.body)) {
          // spec #4: 422 → per-field inline errors
          mapServerErrors(fields, res.body.errors);
        } else {
          fb.banner((res.body && res.body.message) || (res.body && res.body.error && res.body.error.message) || "Request failed. Please try again.", "is-error");
        }
      } catch (err) {
        fb.banner(err.message || "Network error. Please try again.", "is-error");
      } finally {
        fb.loading(btn, false);
        form.dataset.busy = "0";
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* verify page: resend link                                            */
  /* ------------------------------------------------------------------ */

  function initVerify() {
    const btn = document.getElementById("v-resend");
    if (!btn) return;

    // prefill email from ?email= query (set by register.html redirect)
    const q = new URLSearchParams(global.location.search);
    const email = q.get("email");
    const emailSrc = document.getElementById("v-email-src");
    if (email && emailSrc) emailSrc.value = email;
    const sub = document.querySelector('.auth-card .sub');
    if (email && sub) sub.textContent = "We sent a verification link to " + email + ". Follow it to activate your account.";

    btn.addEventListener("click", async function () {
      const token = It.readToken();
      if (!token) {
        fb.banner("No active session. Log in, then resend verification.", "is-error");
        return;
      }
      fb.loading(btn, true);
      try {
        const res = await It.apiPost(It.CONFIG.routes.resend, {}, { headers: { Authorization: "Bearer " + token } });
        if (res.ok) fb.banner((res.body && res.body.message) || "Verification link sent.", "is-info");
        else fb.banner((res.body && res.body.message) || "Could not send the link.", "is-error");
      } catch (err) {
        fb.banner(err.message || "Could not reach the server.", "is-error");
      } finally {
        fb.loading(btn, false);
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* boot                                                                */
  /* ------------------------------------------------------------------ */

  function init() {
    const page = document.body.dataset.page;

    // Auto-redirect removed so users can visit login/register freely
    // if ((page === "login" || page === "register") && It.session.hasToken()) {
    //   It.session.currentUser().then(function (user) {
    //     const role = It.session.roleOf(user);
    //     global.location.replace(It.session.getRedirectPath(role));
    //   }).catch(function () {
    //     global.location.replace("/dashboard.html");
    //   });
    //   return;
    // }

    if (PAGES[page]) initForm(page, PAGES[page]);
    if (page === "verify") initVerify();

    // blocked-account redirect: show reason banner on login page
    if (page === "login" && new URLSearchParams(global.location.search).get("blocked") === "1") {
      fb.banner("Your account has been blocked. Please contact support.", "is-error");
    }

    // Initialize split-screen slideshow backgrounds
    initAuthSlideshow();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function initAuthSlideshow() {
    var slides = document.querySelectorAll(".auth-slide");
    if (!slides.length) return;
    var currentIdx = 0;
    setInterval(function () {
      slides[currentIdx].classList.remove("active");
      currentIdx = (currentIdx + 1) % slides.length;
      slides[currentIdx].classList.add("active");
    }, 6000);
  }
})(window);
