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
    agencyUrl: "/agency/assignments.html",
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
    PAGINATION_PER_PAGE: 20
  };

  /* Automatically synchronize browser tab favicon & logo image assets across all pages */
  (function syncFaviconAndLogos() {
    if (typeof document === "undefined") return;
    function applyLogos() {
      var isSubDir = typeof location !== "undefined" && (
        location.pathname.includes("/admin/") ||
        location.pathname.includes("/app/") ||
        location.pathname.includes("/auth/") ||
        location.pathname.includes("/agency/") ||
        location.pathname.includes("/public/") ||
        location.pathname.includes("/errors/")
      );
      var relLogo = (isSubDir ? "../" : "./") + "assets/img/logo.png";

      // 1. Browser tab favicon
      var favicons = document.querySelectorAll("link[rel*='icon']");
      if (!favicons || favicons.length === 0) {
        var link = document.createElement("link");
        link.rel = "shortcut icon";
        link.type = "image/png";
        link.href = relLogo;
        var head = document.getElementsByTagName("head")[0];
        if (head) head.appendChild(link);
      } else {
        favicons.forEach(function (f) { f.href = relLogo; });
      }

      // 2. Navbar / Sidebar brand mark images
      document.querySelectorAll(".brand-mark").forEach(function (mark) {
        if (mark.tagName === "IMG") {
          mark.src = relLogo;
        } else {
          var img = document.createElement("img");
          img.src = relLogo;
          img.alt = "Itinari Logo";
          img.className = "brand-mark-img";
          img.style.cssText = "height: 28px; width: auto; vertical-align: middle; display: inline-block; object-fit: contain;";
          if (mark.parentNode) mark.parentNode.replaceChild(img, mark);
        }
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", applyLogos);
    } else {
      applyLogos();
    }
  })();
})(window);
