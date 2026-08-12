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
    password: function (v) {
      const s = String(v || "");
      if (s.length < 8) return "Use at least 8 characters.";
      if (!/[A-Z]/.test(s)) return "Add at least one uppercase letter.";
      if (!/[a-z]/.test(s)) return "Add at least one lowercase letter.";
      if (!/\d/.test(s)) return "Add at least one number.";
      if (!/[^A-Za-z0-9]/.test(s)) return "Add at least one special character.";
      return null;
    },
    /** basic international phone format check (digits/space/+/-/()/.). Empty is left to `required`. */
    phone: function (v) {
      const s = String(v || "").trim();
      if (!s) return null;
      const digits = s.replace(/\D/g, "");
      return digits.length >= 6 && digits.length <= 15 && /^\+?[\d\s\-().]*$/.test(s)
        ? null
        : "Enter a valid phone number.";
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