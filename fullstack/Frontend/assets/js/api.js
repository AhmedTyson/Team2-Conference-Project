/**
 * api.js — transport layer. Pure HTTP. No animation, no DOM state.
 * Depends on config.js (window.Itinari.CONFIG / storeToken).
 */
(function (global) {
  "use strict";

  const It = global.Itinari;

  /** Normalize API path: strips '/v1' prefix if present so all endpoints resolve cleanly. */
  function normalizePath(path) {
    if (!path) return "";
    let p = String(path).trim();
    if (p.startsWith("/v1/")) p = p.substring(3);
    else if (p.startsWith("v1/")) p = "/" + p.substring(3);
    return p.startsWith("/") ? p : "/" + p;
  }

  /**
   * Core request. method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE".
   * opts.auth  → attach `Authorization: Bearer <token>` from storage (no-op if absent).
   * opts.headers → extra headers merged in.
   * Returns { ok, status, body }.
   * Non-2xx surfaces as ok:false. Network errors throw Error with name "NetworkError".
   */
  async function request(method, path, data, opts) {
    opts = opts || {};
    const normalizedPath = normalizePath(path);
    const headers = Object.assign(
      { 
        Accept: "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      },
      (opts.headers || {})
    );
    if (data !== undefined) headers["Content-Type"] = "application/json";
    
    // Auto-attach token for any apiBase request
    const token = It.readToken();
    if (token) {
      headers["Authorization"] = "Bearer " + token;
    }

    let res;
    try {
      res = await fetch(It.CONFIG.apiBase + normalizedPath, {
        method: method,
        headers: headers,
        body: data !== undefined ? JSON.stringify(data) : undefined,
      });
    } catch (e) {
      const err = new Error("Could not reach the server. Please try again.");
      err.name = "NetworkError";
      throw err;
    }

    let body = {};
    try { body = await res.json(); }
    catch (e) { body = {}; }

    // Centralized 401 Unauthorized interceptor
    if (res.status === 401 && It.session && typeof It.session.logout === "function") {
      if (normalizedPath !== It.CONFIG.routes.logout) {
        It.session.clearSession();
        It.session.redirectToLogin();
      }
    }

    return { ok: res.ok, status: res.status, body };
  }

  /** POST JSON to an API route. See request(). */
  function apiPost(path, data, opts) {
    return request("POST", path, data, opts);
  }

  /** GET from an API route. opts.auth attaches Bearer automatically. */
  function apiGet(path, opts) {
    return request("GET", path, undefined, opts);
  }

  /** PUT JSON to an API route. */
  function apiPut(path, data, opts) {
    return request("PUT", path, data, opts);
  }

  /** PATCH JSON to an API route. */
  function apiPatch(path, data, opts) {
    return request("PATCH", path, data, opts);
  }

  /** DELETE a resource. */
  function apiDelete(path, opts) {
    return request("DELETE", path, undefined, opts);
  }

  /** Pull a JWT/token out of Laravel-style responses (token, access_token, or nested data). */
  function extractToken(body) {
    if (!body || typeof body !== "object") return null;
    if (body.token) return body.token;
    if (body.access_token) return body.access_token;
    if (body.data) return extractToken(body.data);
    return null;
  }

  /** Unwraps raw arrays, Laravel resource arrays, and paginated response objects */
  function unwrapData(res) {
    if (!res) return null;
    const body = (res && res.body !== undefined) ? res.body : res;
    if (!body || typeof body !== "object") return body;
    if (body.data !== undefined) {
      if (body.data && typeof body.data === "object" && Array.isArray(body.data.data)) {
        return body.data.data;
      }
      return body.data;
    }
    return body;
  }

  It.apiPost = apiPost;
  It.apiGet = apiGet;
  It.apiPut = apiPut;
  It.apiPatch = apiPatch;
  It.apiDelete = apiDelete;
  It.extractToken = extractToken;
  It.isFieldErrors = isFieldErrors;
  It.normalizePath = normalizePath;
  It.unwrapData = unwrapData;
})(window);