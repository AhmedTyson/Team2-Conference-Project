/**
 * assets/js/config.js — global constants + token & user session helpers.
 * Source of truth for client network configuration and session storage keys.
 * Load this before api.js / session.js / auth.js.
 */
(function (global) {
  "use strict";

  const Itinera = global.Itinera = global.Itinera || {};
  const It = global.It = global.Itinera;

  // Docker/Railway: the entrypoint replaces the __API_BASE__ marker with
  // the real backend URL at container boot (via sed). Left untouched
  // locally, so normal resolution below applies. The sentinel is assembled
  // from parts below so sed only ever touches a single literal occurrence.
  try {
    var injectedApiBase = "__API_BASE__";
    if (injectedApiBase && injectedApiBase !== "__API_" + "BASE__") {
      global.ITINERA_API_BASE = injectedApiBase;
    }
  } catch (e) {}

  function resolveApiBase() {
    // Highest priority: explicit override injected before this script
    if (global.ITINERA_API_BASE) return global.ITINERA_API_BASE;
    try {
      if (typeof location !== "undefined" && location.origin &&
          !location.origin.includes("null") && !location.origin.startsWith("file:")) {

        var hostname = location.hostname || "";
        var port     = location.port     || "";

        // Dev: served directly by Laravel on :8000 → same origin /api
        if (port === "8000") {
          return location.origin.replace(/\/$/, "") + "/api";
        }

        // Dev: Frontend served on :8080 or :5173, API on :8000 same host
        if (hostname === "localhost" || hostname === "127.0.0.1") {
          return location.protocol + "//" + hostname + ":8000/api";
        }

        // Production / Railway / any real domain:
        // Frontend is copied into Laravel's public/ by start.sh,
        // so both live at the same origin → use relative /api
        return location.origin.replace(/\/$/, "") + "/api";
      }
    } catch (e) {}
    return "http://127.0.0.1:8000/api";
  }

  var CONFIG = {
    apiBase: resolveApiBase(),
    dashboardUrl: "/app/dashboard.html",
    adminUrl: "/admin/index.html",
    agencyUrl: "/agency/assignments.html",
    tokenKey: "itinera_token",
    userKey: "itinera_user",
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

  Itinera.CONFIG = CONFIG;
  Itinera.storeToken = storeToken;
  Itinera.readToken = readToken;
  Itinera.clearToken = clearToken;
  Itinera.storeUser = storeUser;
  Itinera.readUser = readUser;
  Itinera.clearUser = clearUser;
  Itinera.resolveApiBase = resolveApiBase;

  global.APP_CONFIG = {
    API_BASE_URL: CONFIG.apiBase,
    ASSET_BASE_URL: CONFIG.apiBase.replace('/api', ''),
    REVERB_APP_KEY: 'app-key',
    TOKEN_KEY: CONFIG.tokenKey,
    USER_KEY: CONFIG.userKey,
    PAGINATION_PER_PAGE: 20
  };
})(window);
