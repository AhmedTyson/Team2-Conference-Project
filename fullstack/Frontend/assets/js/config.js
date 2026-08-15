/**
 * assets/js/config.js — global constants + token & user session helpers.
 * Source of truth for client network configuration and session storage keys.
 * Load this before api.js / session.js / auth.js.
 */
(function (global) {
  "use strict";

  const Itinari = global.Itinari = global.Itinari || {};
  const It = global.It = global.Itinari;

  function resolveApiBase() {
    if (global.ITINARI_API_BASE) return global.ITINARI_API_BASE;
    try {
      if (typeof location !== "undefined" && location.origin && !location.origin.includes("null") && !location.origin.startsWith("file:")) {
        var hostname = location.hostname || "";
        var port = location.port || "";
        // Only use same origin if served on port 8000 (Laravel API port)
        if (port === "8000") {
          return location.origin.replace(/\/$/, "") + "/api";
        }
        // Match client hostname (localhost vs 127.0.0.1) on API target port 8000
        if (hostname === "localhost" || hostname === "127.0.0.1") {
          return location.protocol + "//" + hostname + ":8000/api";
        }
        return location.origin.replace(/\/$/, "") + "/api";
      }
    } catch (e) {}
    return "http://127.0.0.1:8000/api";
  }

  var CONFIG = {
    apiBase: resolveApiBase(),
    dashboardUrl: "/app/dashboard.html",
    adminUrl: "/admin/index.html",
    agencyUrl: "/agency/index.html",
    tokenKey: "itinari_token",
    userKey: "itinari_user",
    tokenStorage: "localStorage",
    routes: {
      login: "/login",
      register: "/register",
      forgot: "/forgot-password",
      reset: "/reset-password",
      resend: "/email/resend",
      me: "/user",
      logout: "/logout",
      trips: "/trips",
      stats: "/stats/summary",
      notifications: "/notifications",
      weather: "/weather"
    },
    roleUrl: {
      super_admin: "/admin/index.html",
      admin: "/admin/index.html",
      agency_manager: "/agency/assignments.html",
      agency: "/agency/assignments.html",
      user: "/app/dashboard.html",
      customer: "/app/dashboard.html"
    }
  };

  var memoryToken = null;
  var memoryUser = null;

  function storeToken(tok) {
    if (CONFIG.tokenStorage === "memory") {
      memoryToken = tok;
      return;
    }
    try {
      if (tok) localStorage.setItem(CONFIG.tokenKey, tok);
      else localStorage.removeItem(CONFIG.tokenKey);
    } catch (e) {}
  }

  function readToken() {
    if (CONFIG.tokenStorage === "memory") return memoryToken;
    try { return localStorage.getItem(CONFIG.tokenKey); } catch (e) { return null; }
  }

  function clearToken() {
    memoryToken = null;
    try { localStorage.removeItem(CONFIG.tokenKey); } catch (e) {}
  }

  function storeUser(user) {
    if (CONFIG.tokenStorage === "memory") {
      memoryUser = user;
      return;
    }
    try {
      if (user) localStorage.setItem(CONFIG.userKey, typeof user === "string" ? user : JSON.stringify(user));
      else localStorage.removeItem(CONFIG.userKey);
    } catch (e) {}
  }

  function readUser() {
    if (CONFIG.tokenStorage === "memory") return memoryUser;
    try {
      var raw = localStorage.getItem(CONFIG.userKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function clearUser() {
    memoryUser = null;
    try { localStorage.removeItem(CONFIG.userKey); } catch (e) {}
  }

  Itinari.CONFIG = CONFIG;
  Itinari.storeToken = storeToken;
  Itinari.readToken = readToken;
  Itinari.clearToken = clearToken;
  Itinari.storeUser = storeUser;
  Itinari.readUser = readUser;
  Itinari.clearUser = clearUser;
  Itinari.resolveApiBase = resolveApiBase;

  global.APP_CONFIG = {
    API_BASE_URL: CONFIG.apiBase,
    ASSET_BASE_URL: CONFIG.apiBase.replace('/api', ''),
    REVERB_APP_KEY: 'app-key',
    TOKEN_KEY: CONFIG.tokenKey,
    USER_KEY: CONFIG.userKey,
    PAGINATION_PER_PAGE: 12
  };
})(window);
