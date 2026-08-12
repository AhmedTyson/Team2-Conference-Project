/**
 * api.js — transport layer. Pure HTTP. No animation, no DOM state.
 * Depends on config.js (window.Itinari.CONFIG / storeToken).
 */
(function (global) {
  "use strict";

  const It = global.Itinari;

  /**
   * Core request. method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE".
   * opts.auth  → attach `Authorization: Bearer <token>` from storage (no-op if absent).
   * opts.headers → extra headers merged in.
   * Returns { ok, status, body }.
   * Non-2xx surfaces as ok:false. Network errors throw Error with name "NetworkError".
   */
  async function request(method, path, data, opts) {
    opts = opts || {};
    const headers = Object.assign(
      { Accept: "application/json" },
      (opts.headers || {})
    );
    // FormData (multipart uploads) sets its own boundary — never force JSON.
    const isForm = typeof FormData !== "undefined" && data instanceof FormData;
    if (data !== undefined && !isForm) headers["Content-Type"] = "application/json";
    
    // Auto-attach token for any apiBase request
    const token = It.readToken();
    if (token) {
      headers["Authorization"] = "Bearer " + token;
    }

    let res;
    try {
      res = await fetch(It.CONFIG.apiBase + path, {
        method: method,
        headers: headers,
        body: data !== undefined ? (isForm ? data : JSON.stringify(data)) : undefined,
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
      if (path !== It.CONFIG.routes.logout) {
        It.session.clearSession();
        if (It.CONFIG.publicPage) {
          // Public pages: keep the visitor on the page — the app listens for
          // this event and shows a "Session expired" toast + guest nav.
          const evt = new CustomEvent("itinera:session-expired", { detail: { path } });
          document.dispatchEvent(evt);
        } else {
          It.session.redirectToLogin();
        }
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

  /** The (errors) map is per-field arrays. Returns type JsonObject if present. */
  function isFieldErrors(body) {
    return !!(body && body.errors && typeof body.errors === "object");
  }

  It.apiPost = apiPost;
  It.apiGet = apiGet;
  It.apiPut = apiPut;
  It.apiPatch = apiPatch;
  It.apiDelete = apiDelete;
  It.extractToken = extractToken;
  It.isFieldErrors = isFieldErrors;
})(window);