/**
 * config.js — global constants + token & user session helpers.
 * Source of truth for client network configuration and session storage keys.
 * Load this before api.js / session.js / auth.js.
 */
(function (global) {
  "use strict";

  function resolveApiBase() {
    if (global.ITINARI_API_BASE) return global.ITINARI_API_BASE;
    try {
      var origin = global.location.origin;
      if (origin && !origin.includes(":8080") && !origin.includes(":5500") && !origin.includes(":3000") && !origin.includes(":5173") && !origin.includes("null") && !origin.startsWith("file:") && !origin.includes("127.0.0.1") && !origin.includes("localhost")) {
        return origin + "/api";
      }
    } catch (e) {}
    return "https://itinari.up.railway.app/api";
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

  global.Itinari = global.Itinari || {};
  global.Itinari.CONFIG = CONFIG;
  global.Itinari.storeToken = storeToken;
  global.Itinari.readToken = readToken;
  global.Itinari.clearToken = clearToken;
  global.Itinari.storeUser = storeUser;
  global.Itinari.readUser = readUser;
  global.Itinari.clearUser = clearUser;

  global.It = global.Itinari;
  global.APP_CONFIG = {
    API_BASE_URL: CONFIG.apiBase,
    ASSET_BASE_URL: CONFIG.apiBase.replace('/api', ''),
    TOKEN_KEY: CONFIG.tokenKey,
    USER_KEY: CONFIG.userKey,
    PAGINATION_PER_PAGE: 12
  };
})(window);
