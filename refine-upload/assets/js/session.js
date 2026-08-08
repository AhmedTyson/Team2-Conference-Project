/**
 * session.js — auth/session + role resolution.
 * Depends on config.js (CONFIG, readToken, clearToken) + api.js (apiGet, apiPost).
 * No DOM, no animation.
 */
(function (global) {
  "use strict";

  const It = global.Itinari;

  // cached profile so boot role resolution hits /api/user at most once
  let _user = null;

  /** Decode a JWT payload (display only — no signature verification). */
  function decodeJwt(token) {
    if (!token) return null;
    try {
      const part = token.split(".")[1];
      if (!part) return null;
      const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
      const json = decodeURIComponent(
        atob(b64).split("").map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        }).join("")
      );
      return JSON.parse(json);
    } catch (e) { return null; }
  }

  /** Payload of stored token (sub/id). Null when no token or undecodable. */
  function tokenPayload() {
    const token = It.readToken();
    if (!token) return null;
    return decodeJwt(token);
  }

  function hasToken() {
    return !!It.readToken();
  }

  /** First meaningful/role from a user's roles list. */
  function roleOf(user) {
    if (!user) return null;
    let list = user.roles || user.role;
    if (typeof list === "string") list = [list];
    list = list || [];
    if (list.indexOf("super_admin") !== -1) return "super_admin";
    if (list.indexOf("admin") !== -1) return "admin";
    return list.length ? list[0] : null;
  }

  function isAdminRole(role) {
    return role === "admin" || role === "super_admin";
  }

  /**
   * Resolve current user: cached profile, else GET /api/user (Bearer).
   * Resolves null on no token / failure. Never throws.
   */
  async function currentUser() {
    if (_user) return _user;
    const payload = tokenPayload();
    if (!payload) return null;
    try {
      const res = await It.apiGet(It.CONFIG.routes.me, { auth: true });
      if (res.ok && res.body && res.body.success && res.body.user) {
        _user = res.body.user;
        return _user;
      }
    } catch (e) { /* network — caller decides */ }
    return null;
  }

  /**
   * Async boot guard. Returns { user, role, redirected }.
   * - no token  → redirect to login, redirected:true
   * - token but user fetch fails → still acknowledges token (defensive)
   */
  async function resolveSession() {
    if (!hasToken()) {
      redirectToLogin();
      return { user: null, role: null, redirected: true };
    }
    const user = await currentUser();
    if (!user) {
      clearSession();
      redirectToLogin();
      return { user: null, role: null, redirected: true };
    }
    return { user: user, role: roleOf(user), redirected: false };
  }

  /** Sync gate for pages that can redirect before async work (cheap). */
  function requireAuth() {
    if (hasToken()) return false;
    redirectToLogin();
    return true;
  }

  function redirectToLogin() {
    global.location.replace("/login.html");
  }

  function clearSession() {
    _user = null;
    It.clearToken();
  }

  /** POST logout (best-effort), then wipe local session + go to login. */
  async function logout() {
    try {
      await It.apiPost(It.CONFIG.routes.logout, {}, { auth: true });
    } catch (e) { /* best-effort */ }
    clearSession();
    redirectToLogin();
  }

  It.session = {
    hasToken: hasToken,
    tokenPayload: tokenPayload,
    decodeJwt: decodeJwt,
    roleOf: roleOf,
    isAdminRole: isAdminRole,
    currentUser: currentUser,
    bootAuth: resolveSession,
    requireAuth: requireAuth,
    redirectToLogin: redirectToLogin,
    clearSession: clearSession,
    logout: logout,
  };
})(window);