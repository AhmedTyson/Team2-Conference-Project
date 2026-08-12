/**
 * animations.js — GSAP feedback layer. THE ONLY place that touches GSAP.
 * Swappable: to switch animation engines, replace this file and keep the
 * identical API surface (Itinari.feedback.*). No form logic lives here.
 */
(function (global) {
  "use strict";

  const It = (global.Itinari = global.Itinari || {});

  function reducedMotion() {
    return (
      global.matchMedia &&
      global.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  /** subtle horizontal shake + red border flash on a single input */
  function shakeField(inputEl) {
    if (!inputEl) return;
    inputEl.classList.add("is-invalid-ring");
    const g = global.gsap;
    if (!g || reducedMotion()) {
      window.setTimeout(function () {
        inputEl.classList.remove("is-invalid-ring");
      }, 600);
      return;
    }
    g.killTweensOf(inputEl);
    g.fromTo(
      inputEl,
      { x: 0 },
      {
        x: 6,
        duration: 0.05,
        repeat: 5,
        yoyo: true,
        ease: "sine.inOut",
        onComplete: function () {
          g.set(inputEl, { x: 0, clearProps: "x" });
          inputEl.classList.remove("is-invalid-ring");
        },
      }
    );
  }

  /** soft green pass flicker on an input that just validated clean */
  function validFlicker(inputEl) {
    if (!inputEl) return;
    const g = global.gsap;
    if (!g || reducedMotion()) return;
    g.killTweensOf(inputEl);
    g.fromTo(
      inputEl,
      { boxShadow: "0 0 0 3px rgba(88,180,137,0)" },
      { boxShadow: "0 0 0 3px rgba(88,180,137,0.35)", duration: 0.18, repeat: 1, yoyo: true, ease: "power1.out" }
    );
  }

  /** big success pulse on the whole form/card (after a 2xx) */
  function successPulse(formEl) {
    if (!formEl) return;
    const g = global.gsap;
    if (!g || reducedMotion()) return;
    g.fromTo(
      formEl,
      { opacity: 0.92, scale: 0.995 },
      { opacity: 1, scale: 1, duration: 0.45, ease: "power2.out" }
    );
  }

  /** toggle a button's loading state (disabled + spinner via class) */
  function loading(btn, on) {
    if (!btn) return;
    btn.classList.toggle("is-loading", on);
    btn.disabled = on;
    btn.setAttribute("aria-busy", String(on));
  }

  /** reveal / update a success note */
  function flashNote(el, msgOrNull) {
    if (!el) return;
    if (msgOrNull !== undefined && msgOrNull !== null) el.textContent = msgOrNull;
    const g = global.gsap;
    if (!g || reducedMotion()) {
      el.style.opacity = "1";
      el.classList.add("is-show");
      return;
    }
    g.killTweensOf(el);
    g.fromTo(el, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" });
    el.classList.add("is-show");
  }

  /** global banner (fixed bottom) for server-level errors + success toasts */
  function banner(msg, tone) {
    const el = document.getElementById("site-banner");
    if (!el) return;
    const msgEl = document.getElementById("site-banner-msg");
    if (msgEl) msgEl.textContent = msg;
    el.classList.remove("is-error", "is-info", "is-ok");
    if (tone) el.classList.add(tone);

    const g = global.gsap;
    if (g && !reducedMotion()) {
      g.killTweensOf(el);
      g.fromTo(el, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" });
    }
    el.classList.add("is-show");

    const drain = document.getElementById("site-banner-drain");
    if (drain) {
      if (g && !reducedMotion()) {
        g.killTweensOf(drain);
        g.set(drain, { transformOrigin: "left center", scaleX: 1 });
        g.to(drain, { scaleX: 0, duration: 5, ease: "linear" });
      } else {
        drain.style.transform = "scaleX(1)";
      }
    }

    clearTimeout(banner.__t);
    banner.__t = setTimeout(function () {
      if (g && !reducedMotion()) {
        g.killTweensOf(el);
        g.to(el, { autoAlpha: 0, y: 12, duration: 0.25, ease: "power2.in", onComplete: function () {
          el.classList.remove("is-show");
        } });
      } else {
        el.classList.remove("is-show");
      }
    }, 5000);
  }

  /** toast stack (bottom-right) — Phase 17 shadcn-style notifications */
  function toast(msg, tone, opts) {
    const g = global.gsap;
    const stack = document.querySelector(".toast-stack") ||
      (function () {
        const s = document.createElement("div");
        s.className = "toast-stack";
        s.setAttribute("aria-live", "polite");
        s.setAttribute("aria-relevant", "additions");
        document.body.appendChild(s);
        return s;
      })();

    const t = document.createElement("div");
    t.className = "toast " + (tone || "is-info");
    if (tone === "ok") t.setAttribute("role", "status");
    else if (tone === "error") t.setAttribute("role", "alert");
    const icon = document.createElement("span");
    icon.className = "toast-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = tone === "ok" ? "OK" : tone === "error" ? "!" : "i";
    const text = document.createElement("span");
    text.textContent = msg;
    const close = document.createElement("button");
    close.type = "button";
    close.className = "toast-close";
    close.setAttribute("aria-label", "Dismiss");
    close.textContent = "\u00d7";
    const drain = document.createElement("span");
    drain.className = "toast-drain";
    drain.setAttribute("aria-hidden", "true");
    t.appendChild(icon);
    t.appendChild(text);
    t.appendChild(close);
    t.appendChild(drain);

    const action = (opts && opts.action) || null;
    const holdMs = action ? 9000 : 4300;
    if (action) t.classList.add("is-action");

    function dismiss() {
      if (g && !reducedMotion()) {
        g.to(t, { autoAlpha: 0, y: 6, duration: 0.2, ease: "power2.in", onComplete: function () { t.remove(); } });
      } else {
        t.remove();
      }
    }
    if (action) {
      const undo = document.createElement("button");
      undo.type = "button";
      undo.className = "toast-undo";
      undo.textContent = action.label || "Undo";
      undo.addEventListener("click", function () {
        clearTimeout(t.__t);
        dismiss();
        if (typeof action.onClick === "function") action.onClick();
      });
      t.appendChild(undo);
      t.querySelector(".toast-close").addEventListener("click", function () { clearTimeout(t.__t); dismiss(); });
    }

    stack.appendChild(t);

    if (g && !reducedMotion()) {
      g.fromTo(t, { autoAlpha: 0, y: 10, scale: 0.97 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.25, ease: "power2.out" });
      g.fromTo(drain, { scaleX: 1 }, { scaleX: 0, duration: holdMs / 1000, ease: "linear", delay: 0.2 });
    } else {
      drain.style.transform = "scaleX(1)";
      drain.style.transition = "transform " + (holdMs / 1000) + "s linear 0.2s";
      drain.style.transformOrigin = "left center";
    }

    close.addEventListener("click", dismiss);
    t.__t = setTimeout(dismiss, holdMs + 200);
    while (stack.children.length > 4) stack.firstElementChild.remove();
  }

  It.feedback = {
    shakeField: shakeField,
    validFlicker: validFlicker,
    successPulse: successPulse,
    loading: loading,
    flashNote: flashNote,
    banner: banner,
    toast: toast,
  };

  /* ============================================================
     Itinari.motion — page-level choreography (hero, cards, modals).
     Same GSAP-only file invariant as feedback: swappable surface.
     All helpers no-op gracefully without GSAP or reduced motion.
     ============================================================ */

  function gsapOrNull() {
    return global.gsap || null;
  }

  function motionEnabled() {
    return !!gsapOrNull() && !reducedMotion();
  }

  function toArray(targets) {
    if (!targets) return [];
    if (typeof targets.length === "number") return Array.prototype.slice.call(targets);
    return [targets];
  }

  /** Fade-up entrance (hero, cards, modal body) with optional stagger. */
  function fadeUp(targets, opts) {
    opts = opts || {};
    const els = toArray(targets);
    if (!els.length) return;
    const g = gsapOrNull();
    if (!motionEnabled()) {
      g && g.set(els, { clearProps: "all" });
      els.forEach(function (e) { e.style.opacity = "1"; e.style.transform = "none"; });
      return;
    }
    g.killTweensOf(els);
    g.from(els, {
      autoAlpha: 0,
      y: opts.y != null ? opts.y : 22,
      duration: opts.duration != null ? opts.duration : 0.6,
      ease: opts.ease || "power3.out",
      stagger: opts.stagger != null ? opts.stagger : 0,
      delay: opts.delay != null ? opts.delay : 0,
      clearProps: "opacity,transform",
      overwrite: "auto",
    });
  }

  /** Soft pop-in (chips, badges, toggles). */
  function pop(targets, opts) {
    opts = opts || {};
    const els = toArray(targets);
    if (!els.length) return;
    const g = gsapOrNull();
    if (!motionEnabled()) {
      els.forEach(function (e) { e.style.opacity = "1"; e.style.transform = "none"; });
      return;
    }
    g.killTweensOf(els);
    g.from(els, {
      autoAlpha: 0,
      scale: opts.scale != null ? opts.scale : 0.94,
      duration: opts.duration != null ? opts.duration : 0.45,
      ease: opts.ease || "back.out(1.8)",
      stagger: opts.stagger != null ? opts.stagger : 0,
      delay: opts.delay != null ? opts.delay : 0,
      clearProps: "opacity,transform",
      overwrite: "auto",
    });
  }

  /** Animated number counter (localized). Falls back to a static set. */
  function countUp(el, to, opts) {
    if (!el) return;
    opts = opts || {};
    const g = gsapOrNull();
    const fmt = function (n) { return Math.round(n).toLocaleString(); };
    if (!motionEnabled()) {
      el.textContent = fmt(to);
      return;
    }
    const state = { v: 0 };
    g.killTweensOf(state);
    g.to(state, {
      v: to,
      duration: opts.duration != null ? opts.duration : 1.4,
      ease: opts.ease || "power2.out",
      delay: opts.delay != null ? opts.delay : 0,
      onUpdate: function () { el.textContent = fmt(state.v); },
      onComplete: function () { el.textContent = fmt(to); },
    });
  }

  It.motion = {
    enabled: motionEnabled,
    fadeUp: fadeUp,
    pop: pop,
    countUp: countUp,
  };
})(window);