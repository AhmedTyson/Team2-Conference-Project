/**
 * core/theme.js — Canonical Itinari theme engine.
 * @date    2026-08-14
 * @purpose Single source of truth for dark/light mode across ALL pages.
 *
 * Exposed API: window.ItTheme = { set(mode), toggle(), current(), mode() }
 *
 * Rules:
 *  - Canonical localStorage key: "itinari_theme"
 *  - Default is always "dark" unless explicitly set to "light" by the user.
 *  - Public pages stay dark by default and resist accidental light shifts.
 *  - Always applies BOTH html.dark class AND data-theme="dark" attribute.
 */
(function (global) {
  "use strict";

  var THEME_KEY = "itinari_theme";
  var doc = global.document;
  var html = doc && doc.documentElement;

  /* ── Helpers ── */
  function systemPrefersDark() {
    return !!(global.matchMedia && global.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  function isPublicPage() {
    return !!(doc && doc.body && doc.body.getAttribute("data-layout") === "public");
  }

  function storedMode() {
    try { return global.localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }

  function storeMode(mode) {
    try { global.localStorage.setItem(THEME_KEY, mode); } catch (e) { /* private mode */ }
  }

  /* ── Apply Theme ── */
  function applyDark(dark) {
    if (!html) return;
    html.classList.toggle("dark", dark);
    if (dark) {
      html.setAttribute("data-theme", "dark");
    } else {
      html.removeAttribute("data-theme");
    }

    /* Sync all theme-toggle buttons in the DOM */
    var btns = doc.querySelectorAll("#theme-toggle, .theme-toggle");
    for (var i = 0; i < btns.length; i++) {
      var btn = btns[i];
      btn.setAttribute("aria-pressed", String(dark));
      btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
      btn.classList.toggle("is-dark", dark);

      var sun = btn.querySelector(".icon-sun, .fa-sun");
      var moon = btn.querySelector(".icon-moon, .fa-moon");
      if (sun) sun.style.display = dark ? "inline-block" : "none";
      if (moon) moon.style.display = dark ? "none" : "inline-block";
    }

    /* Dispatch theme event */
    try {
      doc.dispatchEvent(new CustomEvent("itinera:theme", { detail: { dark: dark } }));
    } catch (e) {}
  }

  function resolve(mode) {
    if (mode === "dark") return true;
    if (mode === "light") return false;
    if (mode === "system") {
      if (isPublicPage()) return true;
      return systemPrefersDark();
    }
    // Default fallback: dark
    return true;
  }

  /* ── Public API ── */
  var ItTheme = {
    set: function (mode) {
      storeMode(mode);
      applyDark(resolve(mode));
    },

    toggle: function () {
      var currentlyDark = html && html.classList.contains("dark");
      var next = currentlyDark ? "light" : "dark";
      ItTheme.set(next);
    },

    current: function () {
      return (html && html.classList.contains("dark")) ? "dark" : "light";
    },

    mode: function () {
      return storedMode() || "dark";
    }
  };

  /* ── Boot ── */
  function boot() {
    var saved = storedMode();
    var effectiveMode = saved || (isPublicPage() ? "dark" : "dark");
    applyDark(resolve(effectiveMode));

    /* Listen to OS changes if system mode explicitly chosen */
    var mql = global.matchMedia && global.matchMedia("(prefers-color-scheme: dark)");
    if (mql && mql.addEventListener) {
      mql.addEventListener("change", function () {
        var m = storedMode();
        if (m === "system") {
          applyDark(resolve("system"));
        }
      });
    }
  }

  /* Boot immediately */
  boot();

  /* Wire toggle click handlers */
  function wireToggles() {
    var btns = doc.querySelectorAll("#theme-toggle, .theme-toggle");
    for (var i = 0; i < btns.length; i++) {
      (function (btn) {
        btn.onclick = function (e) {
          e.preventDefault();
          ItTheme.toggle();
        };
      })(btns[i]);
    }
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", wireToggles);
  } else {
    wireToggles();
  }

  global.ItTheme = ItTheme;

}(window));
