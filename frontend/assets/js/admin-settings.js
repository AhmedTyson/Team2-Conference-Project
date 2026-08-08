/**
 * admin-settings.js v3 — split-screen settings page.
 * GET  /v1/admin/settings → { data: { key: value, … } }   (flat object)
 * PATCH /v1/admin/settings/{key} → { value: "..." }        (per-key update)
 *
 * Sections: pricing (known keys), platform (known keys), other (remainder).
 */
(function (global) {
  "use strict";

  var It = global.Itinari;
  var URL_BASE = "/v1/admin/settings";

  // Keys that belong to each named section.
  var PRICING_KEYS = ["trip_fork_price_cents", "platform_booking_commission_rate"];

  function el(id) { return document.getElementById(id); }

  // ── session chip ──────────────────────────────────────────────────────────
  function renderProfile(user) {
    var chip = el("user-chip");
    if (!chip) return;
    el("chip-name").textContent = user.name || "";
    el("chip-role").textContent = It.session.roleOf(user) || "admin";
    chip.hidden = false;
  }

  // ── section nav active state ──────────────────────────────────────────────
  function initSectionNav() {
    var links = document.querySelectorAll(".settings-nav-item");
    links.forEach(function (link) {
      link.addEventListener("click", function (e) {
        links.forEach(function (l) { l.classList.remove("is-active"); });
        link.classList.add("is-active");
      });
    });
  }

  // ── entrance animation ────────────────────────────────────────────────────
  function entrance() {
    var g = global.gsap;
    var panels = document.querySelectorAll(".settings-section");
    if (!g || !panels.length) return;
    if (global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    g.fromTo(panels, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" });
  }

  // ── fill known pricing inputs ─────────────────────────────────────────────
  function fillPricing(data) {
    PRICING_KEYS.forEach(function (key) {
      var input = document.querySelector("[data-key=\"" + key + "\"]");
      if (input && data[key] !== undefined) {
        input.value = data[key];
      }
    });
  }

  // ── build platform panel (any keys not in pricing / other) ───────────────
  // Currently there are only 2 seeded keys; platform panel shows a summary.
  function fillPlatform(data) {
    var host = el("panel-platform");
    host.textContent = "";

    var knownKeys = PRICING_KEYS;
    var otherKeys = Object.keys(data).filter(function (k) { return knownKeys.indexOf(k) === -1; });

    if (otherKeys.length === 0 && Object.keys(data).length === 0) {
      host.innerHTML = '<div class="kit-empty">No settings stored yet.</div>';
      return;
    }

    // Summary cards for all keys
    var grid = document.createElement("div");
    grid.className = "settings-summary-grid";

    Object.keys(data).forEach(function (key) {
      var card = document.createElement("div");
      card.className = "settings-summary-card";
      var label = document.createElement("span");
      label.className = "settings-summary-label";
      label.textContent = key.replace(/_/g, " ");
      var val = document.createElement("span");
      val.className = "settings-summary-value";
      val.textContent = data[key] !== null && data[key] !== undefined ? String(data[key]) : "—";
      card.appendChild(label);
      card.appendChild(val);
      grid.appendChild(card);
    });

    host.appendChild(grid);

    // Other keys editable form
    var otherSection = el("section-other");
    var otherFields = el("other-fields");
    var otherActions = el("other-actions");
    otherFields.textContent = "";

    if (otherKeys.length > 0) {
      otherSection.hidden = false;
      otherActions.hidden = false;
      otherKeys.forEach(function (key, i) {
        var wrap = document.createElement("div");
        wrap.className = "kit-field";
        var id = "set-other-" + i;
        var label = document.createElement("label");
        label.htmlFor = id;
        label.textContent = key.replace(/_/g, " ");
        var input = document.createElement("input");
        input.id = id;
        input.setAttribute("data-key", key);
        input.type = "text";
        input.value = data[key] !== null && data[key] !== undefined ? String(data[key]) : "";
        wrap.appendChild(label);
        wrap.appendChild(input);
        otherFields.appendChild(wrap);
      });
    } else {
      otherSection.hidden = true;
    }
  }

  // ── PATCH a single key ────────────────────────────────────────────────────
  function patchKey(key, value) {
    return It.apiPatch(URL_BASE + "/" + encodeURIComponent(key), { value: value }, { auth: true });
  }

  // ── save status helper ────────────────────────────────────────────────────
  function setStatus(form, msg, isError) {
    var span = form.querySelector(".settings-save-status");
    if (!span) return;
    span.textContent = msg;
    span.style.color = isError ? "hsl(var(--destructive))" : "hsl(var(--primary))";
    clearTimeout(span._timer);
    span._timer = setTimeout(function () { span.textContent = ""; }, 3000);
  }

  // ── handle pricing form submit ────────────────────────────────────────────
  function onPricingSubmit(e) {
    e.preventDefault();
    var form = el("form-pricing");
    var btn = el("save-pricing");
    btn.disabled = true;
    btn.textContent = "Saving…";

    var inputs = form.querySelectorAll("[data-key]");
    var patches = Array.prototype.map.call(inputs, function (input) {
      return patchKey(input.getAttribute("data-key"), input.value);
    });

    Promise.all(patches).then(function (results) {
      var allOk = results.every(function (r) { return r.ok; });
      if (allOk) {
        setStatus(form, "Saved.", false);
        It.feedback.banner("Pricing settings saved.", "is-ok");
      } else {
        setStatus(form, "Some keys failed to save.", true);
        It.feedback.banner("Could not save all pricing settings.", "is-error");
      }
    }).catch(function () {
      setStatus(form, "Network error.", true);
      It.feedback.banner("Network error saving settings.", "is-error");
    }).finally(function () {
      btn.disabled = false;
      btn.textContent = "Save pricing";
    });
  }

  // ── handle other form submit ──────────────────────────────────────────────
  function onOtherSubmit(e) {
    e.preventDefault();
    var form = el("form-other");
    var btn = form.querySelector("[type=submit]");
    btn.disabled = true;
    btn.textContent = "Saving…";

    var inputs = form.querySelectorAll("[data-key]");
    var patches = Array.prototype.map.call(inputs, function (input) {
      return patchKey(input.getAttribute("data-key"), input.value);
    });

    Promise.all(patches).then(function (results) {
      var allOk = results.every(function (r) { return r.ok; });
      if (allOk) {
        setStatus(form, "Saved.", false);
        It.feedback.banner("Settings saved.", "is-ok");
      } else {
        setStatus(form, "Some keys failed.", true);
        It.feedback.banner("Could not save all keys.", "is-error");
      }
    }).catch(function () {
      setStatus(form, "Network error.", true);
    }).finally(function () {
      btn.disabled = false;
      btn.textContent = "Save other";
    });
  }

  // ── load settings from API ────────────────────────────────────────────────
  function load() {
    It.apiGet(URL_BASE, { auth: true }).then(function (res) {
      if (!res.ok) {
        el("panel-platform").innerHTML = '<div class="kit-error">Could not load settings.</div>';
        It.feedback.banner("Could not load settings.", "is-error");
        return;
      }
      // Backend returns data as flat object { key: value }
      var data = (res.body && res.body.data) ? res.body.data : {};
      fillPricing(data);
      fillPlatform(data);
      entrance();
    }).catch(function () {
      el("panel-platform").innerHTML = '<div class="kit-error">Network error.</div>';
      It.feedback.banner("Network error loading settings.", "is-error");
    });
  }

  // ── boot ──────────────────────────────────────────────────────────────────
  function boot(user) {
    renderProfile(user);
    initSectionNav();

    var pricingForm = el("form-pricing");
    if (pricingForm) pricingForm.addEventListener("submit", onPricingSubmit);

    var otherForm = el("form-other");
    if (otherForm) otherForm.addEventListener("submit", onOtherSubmit);

    load();
  }

  function init() {
    var logoutBtn = el("logout-btn");
    if (logoutBtn) logoutBtn.addEventListener("click", function () { It.session.logout(); });

    if (!It.session.hasToken()) { It.session.redirectToLogin(); return; }
    It.session.currentUser().then(function (user) {
      if (!user) { It.session.clearSession(); It.session.redirectToLogin(); return; }
      if (!It.session.isAdminRole(It.session.roleOf(user))) {
        It.session.clearSession();
        It.session.redirectToLogin();
        return;
      }
      boot(user);
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})(window);
