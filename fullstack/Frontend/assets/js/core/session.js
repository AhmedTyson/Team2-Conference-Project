/**
 * session.js — Auth, Session Lifecycle, Multi-Tab Sync & Role Resolution.
 * Depends on config.js (CONFIG, readToken, clearToken) + api.js (apiGet, apiPost).
 * Pure session state & route guard logic.
 */
(function (global) {
  "use strict";

  const It = global.Itinera || (global.Itinera = {});

  // Cached profile so boot role resolution hits /api/user at most once
  let _user = null;

  /** Decode a JWT payload (display only — no signature verification). */
  function decodeJwt(token) {
    if (!token) return null;
    try {
      const part = token.split(".")[1];
      if (!part) return null;
      const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
      const json = decodeURIComponent(
        atob(b64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  }

  /** Payload of stored token (sub, id, exp). Null when no token or undecodable. */
  function tokenPayload() {
    const token = (It.readToken && It.readToken()) || localStorage.getItem("itinera_token");
    if (!token) return null;
    return decodeJwt(token);
  }

  function hasToken() {
    return !!((It.readToken && It.readToken()) || localStorage.getItem("itinera_token"));
  }

  /** Check if token is near expiration (within 5 minutes) */
  function isTokenExpiringSoon() {
    const payload = tokenPayload();
    if (!payload || !payload.exp) return false;
    const nowSec = Math.floor(Date.now() / 1000);
    // Expiring in less than 300 seconds (5 min)
    return payload.exp - nowSec < 300;
  }

  /** First meaningful role from a user's roles list. */
  function roleOf(user) {
    if (!user) return "customer";
    if (user.user && typeof user.user === "object") user = user.user;
    if (user.data && typeof user.data === "object") user = user.data;
    let list = user.roles || user.role;
    if (typeof list === "string") list = [list];
    if (Array.isArray(list) && list.length && typeof list[0] === "object") {
      list = list.map(function (r) {
        return (r && (r.name || r.role || r.slug)) || "";
      });
    }
    list = (list || []).map(function (r) { return String(r).trim().toLowerCase(); });
    
    if (list.indexOf("super_admin") !== -1 || list.indexOf("superadmin") !== -1) return "super_admin";
    if (list.indexOf("admin") !== -1 || list.indexOf("administrator") !== -1) return "admin";
    if (list.indexOf("agency") !== -1 || list.indexOf("agency_manager") !== -1 || list.indexOf("agent") !== -1) return "agency";
    if (list.indexOf("user") !== -1 || list.indexOf("customer") !== -1 || list.indexOf("traveler") !== -1) return "customer";
    return list.length && list[0] ? list[0] : "customer";
  }

  function isAdminRole(role) {
    return role === "admin" || role === "super_admin";
  }

  function getRedirectPath(role, user) {
    var cur = (global.location.pathname || "").toLowerCase();
    var isAuthDir = cur.indexOf("/auth/") !== -1;
    var isRoot = !isAuthDir && cur.indexOf("/app/") === -1 && cur.indexOf("/admin/") === -1 && cur.indexOf("/agency/") === -1 && cur.indexOf("/public/") === -1;

    if (role === "super_admin" || role === "admin") {
      if (isAuthDir) return "../admin/index.html";
      if (isRoot) return "admin/index.html";
      return (It.CONFIG && It.CONFIG.adminUrl) || "/admin/index.html";
    }
    if (role === "agency" || role === "agency_manager" || role === "agent") {
      if (isAuthDir) return "../agency/assignments.html";
      if (isRoot) return "agency/assignments.html";
      return (It.CONFIG && It.CONFIG.agencyUrl) || "/agency/assignments.html";
    }
    // Default user / traveler
    if (isAuthDir) return "../app/dashboard.html";
    if (isRoot) return "app/dashboard.html";
    return (It.CONFIG && It.CONFIG.dashboardUrl) || "/app/dashboard.html";
  }

  /** Pull the user object out of a /api/user response body or login response */
  function extractUser(body) {
    if (!body || typeof body !== "object") return null;
    if (body.data && typeof body.data === "object") {
      if (body.data.user && typeof body.data.user === "object") return body.data.user;
      if (!Array.isArray(body.data) && (body.data.id !== undefined || body.data.email !== undefined)) {
        return body.data;
      }
    }
    if (body.user && typeof body.user === "object") return body.user;
    if (body.id !== undefined || body.email !== undefined) return body;
    return null;
  }

  /**
   * Resolve current user: cached profile, else GET /api/user (Bearer).
   * Resolves null on no token / failure. Never throws.
   */
  async function currentUser(forceRefresh) {
    if (_user && !forceRefresh) return _user;
    if (!hasToken()) return null;

    // Check proactive token refresh
    if (isTokenExpiringSoon() && typeof It.refreshToken === "function") {
      try { await It.refreshToken(); } catch (e) {}
    }

    try {
      const stored = (It.readUser && It.readUser()) || localStorage.getItem("itinera_user");
      if (stored && !forceRefresh) {
        const parsed = typeof stored === "string" ? JSON.parse(stored) : stored;
        const extracted = extractUser(parsed) || parsed;
        if (extracted && typeof extracted === "object" && (extracted.id || extracted.email || extracted.name || extracted.roles || extracted.role)) {
          _user = extracted;
          return _user;
        }
      }
    } catch (e) {}

    try {
      const res = await It.apiGet((It.CONFIG && It.CONFIG.routes ? It.CONFIG.routes.me : "/user") + "?_t=" + Date.now(), { auth: true, skipAuthRedirect: true });
      if (res.ok) {
        const user = extractUser(res.body);
        if (user) {
          _user = user;
          if (It.storeUser) It.storeUser(user);
          else {
            try { localStorage.setItem("itinera_user", JSON.stringify(user)); } catch (e) {}
          }
          return _user;
        }
      } else if (res.status === 401 || res.status === 403) {
        if (!_user) return null;
      }
    } catch (e) {
      if (_user) return _user;
    }
    return _user;
  }

  const PUBLIC_PAGES = [
    "",
    "index.html",
    "home.html",
    "explore.html",
    "entity.html",
    "weather.html",
    "contact.html",
    "about.html",
    "plans.html",
    "plan-compare.html",
    "help.html",
    "login.html",
    "register.html",
    "forgot.html",
    "reset.html",
    "verify.html",
    "email-notice.html",
    "403.html",
    "404.html",
    "500.html",
    "destinations.html",
    "destination-details.html",
    "hotels.html",
    "hotel-details.html",
    "restaurants.html",
    "restaurant-details.html",
    "attractions.html",
    "attraction-details.html",
    "flights.html",
    "flight-details.html",
    "search.html",
  ];

  function isPublicPage() {
    var p = (global.location.pathname || "").toLowerCase();
    if (p.indexOf("/app/") !== -1 || p.indexOf("/admin/") !== -1 || p.indexOf("/agency/") !== -1) {
      return false;
    }
    var filename = (p.split("/").pop() || "index.html").split("?")[0];
    return PUBLIC_PAGES.indexOf(filename) !== -1;
  }

  /** Guard route based on layout and role */
  function guardRoute(user) {
    var p = (global.location.pathname || "").toLowerCase();
    var role = roleOf(user);
    var layout = document.body && document.body.dataset ? document.body.dataset.layout : null;

    var isSubDir = p.indexOf("/admin/") !== -1 || p.indexOf("/agency/") !== -1 || p.indexOf("/app/") !== -1;
    var errorPage = isSubDir ? "../403.html" : "403.html";

    // Admin layout / path protection
    if (p.indexOf("/admin/") !== -1 || layout === "admin") {
      if (!user) {
        redirectToLogin();
        return false;
      }
      if (role !== "admin" && role !== "super_admin") {
        global.location.replace(errorPage);
        return false;
      }
    }

    // Agency layout / path protection
    if (p.indexOf("/agency/") !== -1 || layout === "agency") {
      if (!user) {
        redirectToLogin();
        return false;
      }
      if (role !== "agency" && role !== "agency_manager" && role !== "agent" && role !== "admin" && role !== "super_admin") {
        global.location.replace(errorPage);
        return false;
      }
    }

    // App layout / path protection
    if (p.indexOf("/app/") !== -1 || layout === "app") {
      if (!user) {
        redirectToLogin();
        return false;
      }
    }

    return true;
  }

  /**
   * Async boot guard. Returns { user, role, redirected }.
   */
  async function resolveSession() {
    if (!hasToken()) {
      if (isPublicPage()) {
        return { user: null, role: null, redirected: false };
      }
      redirectToLogin();
      return { user: null, role: null, redirected: true };
    }

    const user = await currentUser();
    if (!user) {
      clearSession();
      if (isPublicPage()) {
        return { user: null, role: null, redirected: false };
      }
      redirectToLogin();
      return { user: null, role: null, redirected: true };
    }

    if (user.is_active === false) {
      clearSession();
      redirectToLogin("blocked");
      return { user: null, role: null, redirected: true };
    }

    if (!guardRoute(user)) {
      return { user: user, role: roleOf(user), redirected: true };
    }

    return { user: user, role: roleOf(user), redirected: false };
  }

  /** Sync gate for pages that can redirect before async work */
  function requireAuth() {
    if (hasToken()) return false;
    redirectToLogin();
    return true;
  }

  function redirectToLogin(reason) {
    var cur = (global.location.pathname || "").toLowerCase();
    var isAuthDir = cur.indexOf("/auth/") !== -1;
    var isRoot = !isAuthDir && cur.indexOf("/app/") === -1 && cur.indexOf("/admin/") === -1 && cur.indexOf("/agency/") === -1 && cur.indexOf("/public/") === -1;

    var redirectTarget = encodeURIComponent(global.location.pathname + global.location.search);
    var baseTarget = isAuthDir ? "login.html" : (isRoot ? "auth/login.html" : "../auth/login.html");
    var url = baseTarget + (reason ? "?blocked=1" : "");
    if (!reason && global.location.pathname && !isPublicPage()) {
      url += (url.indexOf("?") === -1 ? "?" : "&") + "redirect=" + redirectTarget;
    }
    global.location.replace(url);
  }

  function clearSession() {
    _user = null;
    if (It.clearToken) It.clearToken();
    else localStorage.removeItem("itinera_token");
    if (It.clearUser) It.clearUser();
    else try { localStorage.removeItem("itinera_user"); } catch (e) {}
  }

  /** POST logout (best-effort), then wipe local session + go to login. */
  function logout() {
    try {
      It.apiPost(It.CONFIG && It.CONFIG.routes ? It.CONFIG.routes.logout : "/logout", {}, { auth: true }).catch(function () {});
    } catch (e) {}
    clearSession();
    redirectToLogin();
  }

  // Multi-tab synchronization via StorageEvent
  if (typeof window !== "undefined" && window.addEventListener) {
    window.addEventListener("storage", function (e) {
      var tokenKey = (It.CONFIG && It.CONFIG.tokenKey) || "itinera_token";
      if (e.key === tokenKey) {
        if (!e.newValue) {
          // Token removed in another tab -> Logout in this tab too
          _user = null;
          if (!isPublicPage()) {
            redirectToLogin();
          } else if (global.ItTopbar && typeof global.ItTopbar.render === "function") {
            global.ItTopbar.render();
          }
        } else {
          // Token updated in another tab -> reload current user & re-render topbar
          _user = null;
          currentUser(true).then(function () {
            if (global.ItTopbar && typeof global.ItTopbar.render === "function") {
              global.ItTopbar.render();
            }
          });
        }
      }
    });
  }

  It.session = {
    hasToken: hasToken,
    tokenPayload: tokenPayload,
    decodeJwt: decodeJwt,
    roleOf: roleOf,
    isAdminRole: isAdminRole,
    getRedirectPath: getRedirectPath,
    currentUser: currentUser,
    getUserProfile: currentUser,
    extractUser: extractUser,
    bootAuth: resolveSession,
    resolveSession: resolveSession,
    requireAuth: requireAuth,
    guardRoute: guardRoute,
    redirectToLogin: redirectToLogin,
    clearSession: clearSession,
    logout: logout,
    isTokenExpiringSoon: isTokenExpiringSoon,
  };
})(window);