/**
 * api.js — Transport layer with transparent JWT auto-refresh and error resilience.
 * Pure HTTP transport. No DOM state, no UI animations.
 * Depends on config.js (window.Itinari.CONFIG / storeToken / readToken).
 */
(function (global) {
  "use strict";

  const It = global.Itinari || (global.Itinari = {});

  /** Normalize API path: strips '/v1' prefix if present so all endpoints resolve cleanly. */
  function normalizePath(path) {
    if (!path) return "";
    let p = String(path).trim();
    if (p.startsWith("/v1/")) p = p.substring(3);
    else if (p.startsWith("v1/")) p = "/" + p.substring(3);
    return p.startsWith("/") ? p : "/" + p;
  }

  // Token refresh concurrency control
  let isRefreshing = false;
  let refreshQueue = [];

  function processQueue(error, token) {
    refreshQueue.forEach(function (prom) {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    refreshQueue = [];
  }

  async function refreshToken() {
    const currentTok = It.readToken();
    if (!currentTok) throw new Error("No token to refresh");

    const res = await fetch(It.CONFIG.apiBase + "/refresh", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + currentTok,
      },
    });

    if (!res.ok) {
      throw new Error("Refresh failed with status " + res.status);
    }

    const data = await res.json();
    const newToken = extractToken(data);
    if (!newToken) throw new Error("No token in refresh response");

    It.storeToken(newToken);
    return newToken;
  }

  /**
   * Core request. method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE".
   * opts.auth  → attach `Authorization: Bearer <token>` from storage.
   * opts.headers → extra headers merged in.
   * Returns { ok, status, body }.
   */
  async function request(method, path, data, opts) {
    opts = opts || {};
    const normalizedPath = normalizePath(path);
    const headers = Object.assign(
      {
        Accept: "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      opts.headers || {}
    );
    if (data !== undefined) headers["Content-Type"] = "application/json";

    // Auto-attach token if available
    const token = It.readToken();
    if (token && !headers["Authorization"]) {
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

    // Centralized 401 Unauthorized interceptor with Token Refresh queue
    if (
      res.status === 401 &&
      normalizedPath !== "/login" &&
      normalizedPath !== "/register" &&
      normalizedPath !== "/refresh" &&
      normalizedPath !== (It.CONFIG.routes && It.CONFIG.routes.logout ? It.CONFIG.routes.logout : "/logout")
    ) {
      if (token) {
        if (isRefreshing) {
          return new Promise(function (resolve, reject) {
            refreshQueue.push({
              resolve: function (newTok) {
                opts.headers = Object.assign({}, opts.headers, { Authorization: "Bearer " + newTok });
                resolve(request(method, path, data, opts));
              },
              reject: function (err) {
                resolve({ ok: false, status: 401, body: body });
              },
            });
          });
        }

        isRefreshing = true;
        try {
          const newTok = await refreshToken();
          isRefreshing = false;
          processQueue(null, newTok);

          // Retry original request with newly issued token
          opts.headers = Object.assign({}, opts.headers, { Authorization: "Bearer " + newTok });
          return request(method, path, data, opts);
        } catch (refreshErr) {
          isRefreshing = false;
          processQueue(refreshErr, null);

          if (It.session && typeof It.session.clearSession === "function") {
            It.session.clearSession();
            It.session.redirectToLogin();
          }
          return { ok: false, status: 401, body: body };
        }
      } else {
        if (It.session && typeof It.session.clearSession === "function") {
          It.session.clearSession();
          It.session.redirectToLogin();
        }
      }
    }

    return { ok: res.ok, status: res.status, body: body };
  }

  /** POST JSON to an API route. See request(). */
  function apiPost(path, data, opts) {
    return request("POST", path, data, opts);
  }

  /** GET from an API route. */
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
    const body = res.body !== undefined ? res.body : res;
    if (!body || typeof body !== "object") return body;
    if (body.data !== undefined) {
      if (body.data && typeof body.data === "object" && Array.isArray(body.data.data)) {
        return body.data.data;
      }
      return body.data;
    }
    return body;
  }

  /** The (errors) map is per-field arrays. Returns boolean. */
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
  It.normalizePath = normalizePath;
  It.unwrapData = unwrapData;
  It.refreshToken = refreshToken;
})(window);