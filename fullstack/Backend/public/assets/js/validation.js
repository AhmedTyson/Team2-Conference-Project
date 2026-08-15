/**
 * validation.js — PURE validation logic. No DOM, no animation.
 * Each rule: (rawValue, fieldContext) => string | null   (error message, or null when valid).
 * auth.js composes these rules into per-field validators.
 */
(function (global) {
  "use strict";

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const Rules = {
    required: function (v) {
      return v && String(v).trim().length ? null : "This field is required.";
    },
    email: function (v) {
      return EMAIL_RE.test(String(v || "").trim()) ? null : "Enter a valid email address.";
    },
    phone: function (v) {
      if (!v || !String(v).trim().length) return "Phone number is required.";
      const cleaned = String(v).trim().replace(/[\s\-\(\)\.]/g, "");
      return cleaned.length >= 7 && /^\+?[0-9]{7,15}$/.test(cleaned) ? null : "Enter a valid phone number (e.g. +1234567890).";
    },
    password: function (v) {
      return String(v || "").length >= 8 ? null : "Use at least 8 characters.";
    },
    /** matches against the resolved value of another field (for password confirmation). Accepts a getter. */
    match: function (otherValueOrGetter) {
      return function (v) {
        const other = typeof otherValueOrGetter === "function" ? otherValueOrGetter() : otherValueOrGetter;
        return v === other ? null : "Passwords do not match.";
      };
    },
  };

  /**
   * Password strength scoring (pure). Returns { score, level, checks }.
   * score: 0..5 (each satisfied check adds 1). level: weak|fair|strong.
   * checks: per-rule booleans for the live checklist (length, upper, lower, digit, special).
   */
  function passwordStrength(v) {
    const s = String(v || "");
    const checks = {
      length: s.length >= 8,
      upper: /[A-Z]/.test(s),
      lower: /[a-z]/.test(s),
      digit: /\d/.test(s),
      special: /[^A-Za-z0-9]/.test(s),
    };
    let score = 0;
    Object.keys(checks).forEach(function (k) { if (checks[k]) score++; });
    var level = score <= 2 ? "weak" : score <= 4 ? "fair" : "strong";
    return { score: score, level: level, checks: checks };
  }

  /** Run an ordered list of rules, return first error message or null. */
  function validate(value, rules) {
    for (let i = 0; i < rules.length; i++) {
      const err = rules[i](value);
      if (err) return err;
    }
    return null;
  }

  global.Itinari = global.Itinari || {};
  global.Itinari.Rules = Rules;
  global.Itinari.passwordStrength = passwordStrength;
  global.Itinari.validate = validate;
})(window);