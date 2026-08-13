/**
 * password-toggle.js — Eye/EyeOff show-hide toggles for password inputs.
 * Pure DOM/a11y behavior; no validation, no animation.
 * Works on any <input type="password"> wrapped in .input-wrap that contains a
 * <button data-pw-toggle aria-label="Show password" aria-pressed="false">.
 */
(function (global) {
  "use strict";

  var EYE_ON = "Show password";
  var EYE_OFF = "Hide password";

  function bindToggle(input, btn) {
    function setVisible(visible) {
      input.type = visible ? "text" : "password";
      btn.setAttribute("aria-pressed", visible ? "true" : "false");
      btn.setAttribute("aria-label", visible ? EYE_OFF : EYE_ON);
      btn.title = visible ? EYE_OFF : EYE_ON;
    }

    btn.addEventListener("click", function () {
      setVisible(input.type === "password");
      // keep caret at the end after type swap
      input.focus();
    });

    // keyboard a11y: Space/Enter already fire click for <button>; nothing else needed
    setVisible(false);
  }

  function init() {
    var btns = global.document.querySelectorAll("[data-pw-toggle]");
    btns.forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = "1";
      var wrap = btn.closest(".input-wrap");
      var input = wrap && wrap.querySelector('input[type="password"]');
      if (!input) input = btn.parentElement && btn.parentElement.querySelector('input[type="password"]');
      if (input) bindToggle(input, btn);
    });
  }

  if (global.document.readyState === "loading") {
    global.document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);