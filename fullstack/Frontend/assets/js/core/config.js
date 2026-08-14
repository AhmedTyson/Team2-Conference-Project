/**
 * config.js — global constants + token helpers. No DOM, no animation.
 * Load this before api.js / auth.js.
 */
(function (global) {
  "use strict";

  function resolveApiBase() {
    if (global.ITINARI_API_BASE) return global.ITINARI_API_BASE;
    try {
      var origin = global.location.origin;
      if (origin && !origin.includes(":8080") && !origin.includes(":5500") && !origin.includes(":3000") && !origin.includes(":5173") && !origin.includes("null") && !origin.startsWith("file:")) {
        return origin + "/api";
      }
    } catch (e) {}
    return "http://127.0.0.1:8000/api";
  }

  var CONFIG = {
    apiBase: resolveApiBase(),
    // frontend static pages (served from this site's root, e.g. :8080)
    dashboardUrl: "/app/dashboard.html",
    adminUrl: "/admin/index.html",
    agencyUrl: "/agency/index.html",
    tokenKey: "itinari_token",
    // token persistence: "localStorage" | "memory"
    tokenStorage: "localStorage",
    routes: {
      login: "/login",
      register: "/register",
      forgot: "/forgot-password",
      reset: "/reset-password",
      resend: "/email/resend",
      me: "/user",
      logout: "/logout",
    },
    // role → landing/gate mapping
    roleUrl: {
      super_admin: "/admin/index.html",
      admin: "/admin/index.html",
      agency: "/agency/index.html",
      user: "/app/dashboard.html",
      customer: "/app/dashboard.html",
    },
  };

  var memoryToken = null;

  function storeToken(tok) {
    if (CONFIG.tokenStorage === "memory") {
      memoryToken = tok;
      return;
    }
    try { localStorage.setItem(CONFIG.tokenKey, tok); } catch (e) { /* private mode */ }
  }

  function readToken() {
    if (CONFIG.tokenStorage === "memory") return memoryToken;
    try { return localStorage.getItem(CONFIG.tokenKey); } catch (e) { return null; }
  }

  function clearToken() {
    memoryToken = null;
    try { localStorage.removeItem(CONFIG.tokenKey); } catch (e) {}
  }

  global.Itinari = global.Itinari || {};
  global.Itinari.CONFIG = CONFIG;
  global.Itinari.storeToken = storeToken;
  global.Itinari.readToken = readToken;
  global.Itinari.clearToken = clearToken;
  global.It = global.Itinari;
})(window);
