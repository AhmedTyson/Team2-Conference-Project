/**
 * loader.js — Luxury Celestial Compass Loader Controller
 * Manages full-screen, inline, and button loading states across Itinera.
 * Integrates with GSAP, theme toggle, and handles graceful page transitions.
 *
 * @module core/loader
 */
(function (global) {
  "use strict";

  const It = (global.Itinari = global.Itinari || {});
  let _overlay = null;
  let _titleEl = null;
  let _subtitleEl = null;
  let _hideTimer = null;

  function buildOverlay() {
    if (_overlay) return _overlay;

    const div = document.createElement("div");
    div.id = "itinera-global-loader";
    div.className = "itinera-loader-overlay";
    div.setAttribute("aria-live", "polite");
    div.setAttribute("aria-busy", "true");

    div.innerHTML = `
      <div class="itinera-loader-card">
        <div class="itinera-loader-glow"></div>
        <div class="itinera-compass-stage">
          <div class="itinera-orbit-outer"></div>
          <div class="itinera-orbit-inner"></div>
          <div class="itinera-compass-core">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width: 28px; height: 28px;">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
        </div>
        <div class="itinera-loader-title" id="itinera-loader-title-text">Crafting Your Luxury Experience</div>
        <div class="itinera-loader-subtitle" id="itinera-loader-sub-text">Connecting to AI Concierge • Curating Destinations</div>
      </div>
    `;

    document.body.appendChild(div);
    _overlay = div;
    _titleEl = document.getElementById("itinera-loader-title-text");
    _subtitleEl = document.getElementById("itinera-loader-sub-text");

    return _overlay;
  }

  const LoaderController = {
    /**
     * Show the global luxury loader overlay.
     * @param {string} [title] - Custom main title (e.g. "Generating Itinerary...")
     * @param {string} [subtitle] - Optional context subtitle
     */
    show: function (title, subtitle) {
      if (_hideTimer) {
        clearTimeout(_hideTimer);
        _hideTimer = null;
      }

      const overlay = buildOverlay();
      if (title && _titleEl) _titleEl.textContent = title;
      else if (_titleEl) _titleEl.textContent = "Crafting Your Luxury Experience";

      if (subtitle !== undefined && _subtitleEl) {
        _subtitleEl.textContent = subtitle;
        _subtitleEl.style.display = subtitle ? "block" : "none";
      } else if (_subtitleEl) {
        _subtitleEl.textContent = "Connecting to AI Concierge • Curating Destinations";
        _subtitleEl.style.display = "block";
      }

      requestAnimationFrame(function () {
        overlay.classList.add("is-active");
      });
    },

    /**
     * Update the active loader message dynamically.
     * @param {string} title
     * @param {string} [subtitle]
     */
    update: function (title, subtitle) {
      if (_titleEl && title) _titleEl.textContent = title;
      if (_subtitleEl && subtitle !== undefined) {
        _subtitleEl.textContent = subtitle;
        _subtitleEl.style.display = subtitle ? "block" : "none";
      }
    },

    /**
     * Hide the global luxury loader with a smooth fade.
     * @param {number} [delayMs=200] - Optional delay before hiding
     */
    hide: function (delayMs) {
      if (!_overlay) return;
      const ms = typeof delayMs === "number" ? delayMs : 150;

      _hideTimer = setTimeout(function () {
        _overlay.classList.remove("is-active");
      }, ms);
    },

    /**
     * Create an inline glass loader inside a target container.
     * @param {HTMLElement|string} target - Container element or selector
     * @param {string} [title="Loading details..."]
     * @returns {HTMLElement} - Built inline loader node for easy removal
     */
    showInline: function (target, title) {
      const container = typeof target === "string" ? document.querySelector(target) : target;
      if (!container) return null;

      const inline = document.createElement("div");
      inline.className = "itinera-loader-inline";
      inline.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; padding: 2rem;">
          <div class="itinera-compass-stage" style="width: 64px; height: 64px; margin-bottom: 1rem;">
            <div class="itinera-orbit-outer"></div>
            <div class="itinera-orbit-inner"></div>
            <div class="itinera-compass-core" style="width: 24px; height: 24px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
              </svg>
            </div>
          </div>
          <div style="font-size: 0.95rem; font-weight: 500; color: var(--color-amber-400, #f59e0b);">${title || "Loading details..."}</div>
        </div>
      `;

      container.appendChild(inline);
      return inline;
    }
  };

  It.loader = LoaderController;

  // Auto-wire loader to window unload / navigation transitions
  document.addEventListener("DOMContentLoaded", function () {
    // If page had pre-existing active loader, dismiss on ready
    const existing = document.getElementById("itinera-global-loader");
    if (existing && existing.classList.contains("is-active")) {
      LoaderController.hide(300);
    }
  });

})(window);
