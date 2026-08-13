/**
 * config.js — global constants + token helpers. No DOM, no animation.
 * Load this before api.js / auth.js.
 */
(function (global) {
  "use strict";

  var CONFIG = {
    apiBase:
      global.location &&
      global.location.hostname !== "127.0.0.1" &&
      global.location.hostname !== "localhost"
        ? "/api"
        : "http://127.0.0.1:8001/api",
    // frontend static pages (served from this site's root, e.g. :8080)
    dashboardUrl: "/dashboard.html",
    adminUrl: "/admin/index.html",
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
    // role → landing/gate mapping (phase 8)
    role: {
      dashboard: "/dashboard.html",
      admin: "/admin/index.html",
      super_admin: "/admin/index.html",
      agency: "/agency/index.html",
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
})(window);
