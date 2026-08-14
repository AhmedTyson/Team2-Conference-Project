/**
 * assets/js/session.js — Auth, Session Lifecycle, Multi-Tab Sync & Role Resolution.
 * Depends on config.js (CONFIG, readToken, clearToken) + api.js (apiGet, apiPost).
 * Pure session state & route guard logic.
 */
(function (global) {
  "use strict";

  const It = global.Itinari || (global.Itinari = {});

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
    const token = (It.readToken && It.readToken()) || localStorage.getItem("itinari_token");
    if (!token) return null;
    return decodeJwt(token);
  }

  function hasToken() {
    return !!((It.readToken && It.readToken()) || localStorage.getItem("itinari_token"));
  }

  /** Check if token is near expiration (within 5 minutes) */
  function isTokenExpiringSoon() {
    const payload = tokenPayload();
    if (!payload || !payload.exp) return false;
    const nowSec = Math.floor(Date.now() / 1000);
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

  function getRedirectPath(role) {
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

  async function currentUser(forceRefresh) {
    if (_user && !forceRefresh) return _user;
    
    var cached = (It.readUser && It.readUser());
    if (cached && !forceRefresh) {
      _user = cached;
      return _user;
    }

    if (!hasToken()) return null;

    try {
      const res = await It.apiGet("/user");
      if (res.ok) {
        _user = (It.unwrapData && It.unwrapData(res)) || res.body.data || res.body;
        if (It.storeUser) It.storeUser(_user);
        return _user;
      }
    } catch (e) {
      // ignore network errors
    }
    return null;
  }

  function clearSession() {
    _user = null;
    if (It.clearToken) It.clearToken();
    else localStorage.removeItem("itinari_token");
    if (It.clearUser) It.clearUser();
    else localStorage.removeItem("itinari_user");
  }

  function redirectToLogin() {
    var cur = (global.location.pathname || "").toLowerCase();
    var isAuthDir = cur.indexOf("/auth/") !== -1;
    var isRoot = !isAuthDir && cur.indexOf("/app/") === -1 && cur.indexOf("/admin/") === -1 && cur.indexOf("/agency/") === -1 && cur.indexOf("/public/") === -1;
    var target = isAuthDir ? "login.html" : (isRoot ? "auth/login.html" : "../auth/login.html");
    global.location.replace(target);
  }

  async function logout() {
    try {
      if (hasToken()) {
        await It.apiPost("/logout");
      }
    } catch (e) {}
    clearSession();
    redirectToLogin();
  }

  const sessionApi = {
    hasToken: hasToken,
    tokenPayload: tokenPayload,
    isTokenExpiringSoon: isTokenExpiringSoon,
    roleOf: roleOf,
    isAdminRole: isAdminRole,
    getRedirectPath: getRedirectPath,
    currentUser: currentUser,
    getUserProfile: currentUser,
    clearSession: clearSession,
    redirectToLogin: redirectToLogin,
    logout: logout,
  };

  It.session = sessionApi;
  global.Session = sessionApi;
})(window);