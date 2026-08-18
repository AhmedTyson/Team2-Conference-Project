/**
 * loader.js — High-Performance Professional Luxury Splash & Loading Controller
 * Manages full-screen 3D glassmorphic splash loader, progress percentage counter,
 * status message rotator, and inline glass loading states across Itinera.
 *
 * @module core/loader
 */
(function (global) {
  "use strict";

  const It = (global.Itinari = global.Itinari || {});

  const STATUS_MESSAGES = [
    "Connecting to Private Concierge Desk...",
    "Curating bespoke travel itineraries...",
    "Synchronizing luxury hotel & flight availability...",
    "Preparing your bespoke travel portal..."
  ];

  let _overlay = null;
  let _titleEl = null;
  let _subtitleEl = null;
  let _fillEl = null;
  let _percentEl = null;
  let _hideTimer = null;
  let _progressInterval = null;
  let _statusInterval = null;
  let _currentProgress = 0;
  let _messageIndex = 0;

  function buildOverlay() {
    if (_overlay) return _overlay;

    let div = document.getElementById("itinera-global-loader");
    if (!div) {
      div = document.createElement("div");
      div.id = "itinera-global-loader";
      div.className = "itinera-loader-overlay";
      div.setAttribute("aria-live", "polite");
      div.setAttribute("aria-busy", "true");

      div.innerHTML = `
        <div class="itinera-loader-grid"></div>
        <div class="itinera-loader-card">
          
          <!-- Brand Eyebrow -->
          <div class="itinera-brand-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            ITINERA · PRIVATE CONCIERGE
          </div>

          <!-- Compass & Trajectory Stage -->
          <div class="itinera-compass-stage">
            <div class="itinera-orbit-outer"></div>
            <div class="itinera-orbit-inner"></div>
            <div class="itinera-compass-core" id="itinera-compass-icon">
              <!-- Celestial Compass Crest Icon -->
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width: 28px; height: 28px;">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
              </svg>
            </div>
          </div>

          <!-- Shimmer Title & Rotating Subtitle -->
          <div class="itinera-loader-title" id="itinera-loader-title-text">ITINERA</div>
          <div class="itinera-loader-subtitle" id="itinera-loader-sub-text">Curating Exceptional Journeys...</div>

          <!-- Liquid Gold Progress Line & Counter -->
          <div class="itinera-progress-wrap">
            <div class="itinera-progress-bar-track">
              <div class="itinera-progress-bar-fill" id="itinera-loader-fill"></div>
            </div>
            <div class="itinera-progress-text">
              <span>BESPOKE HOSPITALITY</span>
              <span id="itinera-loader-percent">0%</span>
            </div>
          </div>
        </div>
      `;

      if (document.body) {
        document.body.appendChild(div);
      } else {
        document.addEventListener("DOMContentLoaded", function () {
          if (!document.getElementById("itinera-global-loader")) {
            document.body.appendChild(div);
          }
        });
      }
    }

    _overlay = div;
    _titleEl = document.getElementById("itinera-loader-title-text");
    _subtitleEl = document.getElementById("itinera-loader-sub-text");
    _fillEl = document.getElementById("itinera-loader-fill");
    _percentEl = document.getElementById("itinera-loader-percent");

    return _overlay;
  }

  function startProgressSimulation() {
    if (_progressInterval) clearInterval(_progressInterval);
    if (_statusInterval) clearInterval(_statusInterval);

    _currentProgress = 15;
    updateProgressUI(_currentProgress);

    // Fast simulation up to 95%
    _progressInterval = setInterval(function () {
      if (_currentProgress < 95) {
        const increment = Math.floor(Math.random() * 10) + 6;
        _currentProgress = Math.min(_currentProgress + increment, 95);
        updateProgressUI(_currentProgress);
      }
    }, 120);

    // Rotate status messages every 1.5s
    _messageIndex = 0;
    _statusInterval = setInterval(function () {
      _messageIndex = (_messageIndex + 1) % STATUS_MESSAGES.length;
      if (_subtitleEl) {
        _subtitleEl.style.opacity = "0";
        _subtitleEl.style.transform = "translateY(3px)";
        setTimeout(function () {
          _subtitleEl.textContent = STATUS_MESSAGES[_messageIndex];
          _subtitleEl.style.opacity = "1";
          _subtitleEl.style.transform = "translateY(0)";
        }, 120);
      }
    }, 1500);
  }

  function updateProgressUI(val) {
    if (_fillEl) _fillEl.style.width = val + "%";
    if (_percentEl) _percentEl.textContent = Math.round(val) + "%";
  }

  const LoaderController = {
    show: function (title, subtitle) {
      if (_hideTimer) {
        clearTimeout(_hideTimer);
        _hideTimer = null;
      }

      const overlay = buildOverlay();
      if (title && _titleEl) _titleEl.textContent = title;
      else if (_titleEl) _titleEl.textContent = "ITINERA";

      if (subtitle !== undefined && _subtitleEl) {
        _subtitleEl.textContent = subtitle;
      } else if (_subtitleEl) {
        _subtitleEl.textContent = STATUS_MESSAGES[0];
      }

      startProgressSimulation();

      requestAnimationFrame(function () {
        if (overlay) overlay.classList.add("is-active");
      });
    },

    update: function (title, subtitle) {
      if (_titleEl && title) _titleEl.textContent = title;
      if (_subtitleEl && subtitle !== undefined) _subtitleEl.textContent = subtitle;
    },

    hide: function (delayMs) {
      if (!_overlay) _overlay = document.getElementById("itinera-global-loader");
      if (!_overlay) return;

      _currentProgress = 100;
      updateProgressUI(100);

      if (_progressInterval) { clearInterval(_progressInterval); _progressInterval = null; }
      if (_statusInterval) { clearInterval(_statusInterval); _statusInterval = null; }

      const ms = typeof delayMs === "number" ? delayMs : 200;

      _hideTimer = setTimeout(function () {
        if (_overlay) _overlay.classList.remove("is-active");
      }, ms);
    },

    showInline: function (target, title) {
      const container = typeof target === "string" ? document.querySelector(target) : target;
      if (!container) return null;

      const inline = document.createElement("div");
      inline.className = "itinera-loader-inline";
      inline.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; padding: 2rem;">
          <div class="itinera-compass-stage" style="width: 64px; height: 64px; margin-bottom: 0.8rem;">
            <div class="itinera-orbit-outer"></div>
            <div class="itinera-orbit-inner"></div>
            <div class="itinera-compass-core" style="width: 24px; height: 24px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
              </svg>
            </div>
          </div>
          <div style="font-size: 0.9rem; font-weight: 600; color: var(--color-amber-400, #d97706);">${title || "Loading details..."}</div>
        </div>
      `;

      container.appendChild(inline);
      return inline;
    }
  };

  It.loader = LoaderController;

  // Auto-show splash loader immediately before page rendering
  if (document.readyState !== "complete") {
    buildOverlay();
    startProgressSimulation();
    requestAnimationFrame(function () {
      if (_overlay) _overlay.classList.add("is-active");
    });
  }

  function handlePageReady() {
    LoaderController.hide(250);
  }

  if (document.readyState === "complete") {
    handlePageReady();
  } else {
    window.addEventListener("load", handlePageReady);
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(handlePageReady, 350);
    });
  }

  // Intercept internal links for ultra-smooth luxury page transition loader
  document.addEventListener("click", function (e) {
    const anchor = e.target.closest("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("javascript:") || anchor.target === "_blank" || e.ctrlKey || e.metaKey) return;

    LoaderController.show("ITINERA", "Curating Exceptional View...");
  });

})(window);
