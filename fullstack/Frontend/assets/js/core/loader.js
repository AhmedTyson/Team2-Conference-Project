/**
 * loader.js — Redesigned Next-Gen Luxury Splash & Loading Controller
 * Manages full-screen 3D glassmorphic splash loader, progress percentage counter,
 * status message rotator, and inline glass loading states across Itinera.
 *
 * @module core/loader
 */
(function (global) {
  "use strict";

  const It = (global.Itinari = global.Itinari || {});

  const STATUS_MESSAGES = [
    "Connecting to Itinera AI Concierge...",
    "Curating bespoke destinations & itineraries...",
    "Synchronizing live flight & hotel inventory...",
    "Preparing your luxury travel workspace..."
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
          <div class="itinera-loader-glow-orb"></div>
          
          <!-- Brand Eyebrow -->
          <div class="itinera-brand-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            ITINERA LUXURY CONCIERGE
          </div>

          <!-- Compass & Flight Trajectory Stage -->
          <div class="itinera-compass-stage">
            <div class="itinera-orbit-outer"></div>
            <div class="itinera-orbit-inner"></div>
            <div class="itinera-compass-core" id="itinera-compass-icon">
              <!-- Jet Aircraft & Starburst Icon -->
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width: 32px; height: 32px;">
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3.5c-.5-.5-2.5 0-4 1.5L13.5 8.5 5.3 6.7c-.7-.2-1.4.1-1.7.7l-.6 1.2c-.3.6-.1 1.4.4 1.8l4.4 3.7-3.1 3.1-2.1-.7c-.4-.1-.8 0-1.1.3l-.6.6c-.3.3-.3.8 0 1.1l2.4 2.4c.3.3.8.3 1.1 0l.6-.6c.3-.3.4-.7.3-1.1l-.7-2.1 3.1-3.1 3.7 4.4c.4.5 1.2.7 1.8.4l1.2-.6c.6-.3.9-1 .7-1.7z"/>
              </svg>
            </div>
          </div>

          <!-- Shimmer Title & Rotating Subtitle -->
          <div class="itinera-loader-title" id="itinera-loader-title-text">Crafting Your Luxury Experience</div>
          <div class="itinera-loader-subtitle" id="itinera-loader-sub-text">Connecting to Itinera AI Concierge...</div>

          <!-- Liquid Glowing Progress Bar & Counter -->
          <div class="itinera-progress-wrap">
            <div class="itinera-progress-bar-track">
              <div class="itinera-progress-bar-fill" id="itinera-loader-fill"></div>
            </div>
            <div class="itinera-progress-text">
              <span>EXPLORE & DISCOVER</span>
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

    _currentProgress = 10;
    updateProgressUI(_currentProgress);

    // Smooth progress counter simulation up to 92%
    _progressInterval = setInterval(function () {
      if (_currentProgress < 92) {
        const increment = Math.floor(Math.random() * 8) + 4;
        _currentProgress = Math.min(_currentProgress + increment, 92);
        updateProgressUI(_currentProgress);
      }
    }, 180);

    // Rotate status messages every 1.8s
    _messageIndex = 0;
    _statusInterval = setInterval(function () {
      _messageIndex = (_messageIndex + 1) % STATUS_MESSAGES.length;
      if (_subtitleEl) {
        _subtitleEl.style.opacity = "0";
        _subtitleEl.style.transform = "translateY(4px)";
        setTimeout(function () {
          _subtitleEl.textContent = STATUS_MESSAGES[_messageIndex];
          _subtitleEl.style.opacity = "1";
          _subtitleEl.style.transform = "translateY(0)";
        }, 150);
      }
    }, 1800);
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
      else if (_titleEl) _titleEl.textContent = "Crafting Your Luxury Experience";

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

      // Complete progress to 100% before smooth fade out
      _currentProgress = 100;
      updateProgressUI(100);

      if (_progressInterval) { clearInterval(_progressInterval); _progressInterval = null; }
      if (_statusInterval) { clearInterval(_statusInterval); _statusInterval = null; }

      const ms = typeof delayMs === "number" ? delayMs : 300;

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
          <div class="itinera-compass-stage" style="width: 72px; height: 72px; margin-bottom: 1rem;">
            <div class="itinera-orbit-outer"></div>
            <div class="itinera-orbit-inner"></div>
            <div class="itinera-compass-core" style="width: 28px; height: 28px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
              </svg>
            </div>
          </div>
          <div style="font-size: 0.95rem; font-weight: 600; color: var(--color-amber-400, #f59e0b);">${title || "Loading details..."}</div>
        </div>
      `;

      container.appendChild(inline);
      return inline;
    }
  };

  It.loader = LoaderController;

  // Auto-show redesigned luxury splash screen on page load
  if (document.readyState !== "complete") {
    buildOverlay();
    startProgressSimulation();
    requestAnimationFrame(function () {
      if (_overlay) _overlay.classList.add("is-active");
    });
  }

  function handlePageReady() {
    LoaderController.hide(450);
  }

  if (document.readyState === "complete") {
    handlePageReady();
  } else {
    window.addEventListener("load", handlePageReady);
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(handlePageReady, 600);
    });
  }

  // Intercept internal page links for luxury transition loader
  document.addEventListener("click", function (e) {
    const anchor = e.target.closest("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("javascript:") || anchor.target === "_blank" || e.ctrlKey || e.metaKey) return;

    LoaderController.show("Navigating Luxury Destination...", "Preparing View");
  });

})(window);
