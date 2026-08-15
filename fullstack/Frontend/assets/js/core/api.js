/**
 * api.js — Transport layer with transparent JWT auto-refresh and error resilience.
 * Pure HTTP transport. No DOM state, no UI animations.
 * Depends on config.js (window.Itinari.CONFIG / storeToken / readToken).
 */
(function (global) {
  "use strict";

  const It = global.Itinari || (global.Itinari = {});

  /**
   * Normalize API path:
   * 1. Strips duplicate leading '/api/' or 'api/'
   * 2. Maps legacy dashboard route aliases cleanly
   * 3. Ensures single leading slash
   */
  function normalizePath(path) {
    if (!path) return "";
    let p = String(path).trim();
    // Strip redundant leading /api/ or api/
    if (p.startsWith("/api/")) p = p.substring(4);
    else if (p.startsWith("api/")) p = p.substring(4);
    else if (p === "/api" || p === "api") p = "";

    // Normalize dashboard endpoint aliases
    if (p === "/v1/dashboard/trips" || p === "v1/dashboard/trips") p = "/dashboard/trips";
    if (p === "/v1/dashboard/favourites" || p === "v1/dashboard/favourites") p = "/dashboard/favourites";
    if (p === "/v1/dashboard" || p === "v1/dashboard") p = "/stats/summary";
    if (p === "/admin/regions" || p === "/v1/admin/regions" || p === "admin/regions" || p === "v1/admin/regions") p = "/regions";

    // Strip legacy /v1/ or v1/ from routes that are non-versioned in Laravel backend (admin, agency, me, etc.)
    if (
      p.startsWith("/v1/admin/") || p.startsWith("v1/admin/") ||
      p.startsWith("/v1/agency/") || p.startsWith("v1/agency/") ||
      p.startsWith("/v1/me/") || p.startsWith("v1/me/") ||
      p.startsWith("/v1/notifications") || p.startsWith("v1/notifications") ||
      p.startsWith("/v1/trips") || p.startsWith("v1/trips") ||
      p.startsWith("/v1/favourites") || p.startsWith("v1/favourites") ||
      p.startsWith("/v1/surveys") || p.startsWith("v1/surveys") ||
      p.startsWith("/v1/reports") || p.startsWith("v1/reports") ||
      p.startsWith("/v1/settings") || p.startsWith("v1/settings") ||
      p.startsWith("/v1/reviews") || p.startsWith("v1/reviews") ||
      p.startsWith("/v1/orders") || p.startsWith("v1/orders") ||
      p.startsWith("/v1/plans") || p.startsWith("v1/plans") ||
      p.startsWith("/v1/checkout") || p.startsWith("v1/checkout") ||
      p.startsWith("/v1/weather") || p.startsWith("v1/weather") ||
      p.startsWith("/v1/ai/") || p.startsWith("v1/ai/") ||
      p.startsWith("/v1/review/") || p.startsWith("v1/review/")
    ) {
      p = p.replace(/^\/?v1\//, "/");
    }

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
    const currentTok = (It.readToken && It.readToken()) || localStorage.getItem("itinari_token");
    if (!currentTok) throw new Error("No token to refresh");

    const defaultFallback = (global.location && global.location.origin && !global.location.origin.includes("null") && !global.location.origin.startsWith("file:")) ? global.location.origin.replace(/\/$/, "") + "/api" : "http://127.0.0.1:8000/api";
    const base = (It.CONFIG && It.CONFIG.apiBase) || (global.APP_CONFIG && global.APP_CONFIG.API_BASE_URL) || defaultFallback;
    const res = await fetch(base.replace(/\/$/, "") + "/refresh", {
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

    if (It.storeToken) It.storeToken(newToken);
    else localStorage.setItem("itinari_token", newToken);
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
    const defaultFallback = (global.location && global.location.origin && !global.location.origin.includes("null") && !global.location.origin.startsWith("file:")) ? global.location.origin.replace(/\/$/, "") + "/api" : "http://127.0.0.1:8000/api";
    const apiBase = (It.CONFIG && It.CONFIG.apiBase) ? It.CONFIG.apiBase.replace(/\/$/, "") : defaultFallback;
    
    const headers = Object.assign(
      {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      opts.headers || {}
    );
    if (data !== undefined) headers["Content-Type"] = "application/json";

    // Auto-attach token if available
    const token = (It.readToken && It.readToken()) || localStorage.getItem("itinari_token");
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = "Bearer " + token;
    }

    let res;
    try {
      res = await fetch(apiBase + normalizedPath, {
        method: method,
        headers: headers,
        body: data !== undefined ? JSON.stringify(data) : undefined,
      });
    } catch (e) {
      let altBase = null;
      if (apiBase.indexOf("127.0.0.1:8000") !== -1) {
        altBase = apiBase.replace("127.0.0.1:8000", "localhost:8000");
      } else if (apiBase.indexOf("localhost:8000") !== -1) {
        altBase = apiBase.replace("localhost:8000", "127.0.0.1:8000");
      }
      if (altBase) {
        try {
          res = await fetch(altBase + normalizedPath, {
            method: method,
            headers: headers,
            body: data !== undefined ? JSON.stringify(data) : undefined,
          });
          if (It.CONFIG) It.CONFIG.apiBase = altBase;
        } catch (e2) {
          const err = new Error("Could not reach the server. Please try again.");
          err.name = "NetworkError";
          throw err;
        }
      } else {
        const err = new Error("Could not reach the server. Please try again.");
        err.name = "NetworkError";
        throw err;
      }
    }

    let body = {};
    try {
      const rawText = await res.text();
      if (rawText) {
        try {
          body = JSON.parse(rawText);
        } catch (jsonErr) {
          body = { message: "Server response error (non-JSON).", raw: rawText };
        }
      }
    } catch (e) {
      body = {};
    }

    // Centralized 401 Unauthorized interceptor with Token Refresh queue
    if (
      res.status === 401 &&
      normalizedPath !== "/login" &&
      normalizedPath !== "/register" &&
      normalizedPath !== "/refresh" &&
      normalizedPath !== (It.CONFIG && It.CONFIG.routes && It.CONFIG.routes.logout ? It.CONFIG.routes.logout : "/logout")
    ) {
      if (token) {
        if (isRefreshing) {
          return new Promise(function (resolve) {
            refreshQueue.push({
              resolve: function (newTok) {
                opts.headers = Object.assign({}, opts.headers, { Authorization: "Bearer " + newTok });
                resolve(request(method, path, data, opts));
              },
              reject: function () {
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
        if (!opts.skipAuthRedirect && It.session && typeof It.session.clearSession === "function") {
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

  /** Extract pagination metadata (current_page, last_page, total, per_page) */
  function parseMeta(res) {
    if (!res) return { current_page: 1, last_page: 1, total: 0, per_page: 15 };
    const body = res.body !== undefined ? res.body : res;
    if (!body || typeof body !== "object") return { current_page: 1, last_page: 1, total: 0, per_page: 15 };
    if (body.meta) return body.meta;
    if (body.pagination) return body.pagination;
    if (body.data && body.data.meta) return body.data.meta;
    return {
      current_page: body.current_page || 1,
      last_page: body.last_page || 1,
      total: body.total || 0,
      per_page: body.per_page || 15
    };
  }

  /** The (errors) map is per-field arrays. Returns boolean. */
  function isFieldErrors(body) {
    return !!(body && body.errors && typeof body.errors === "object");
  }

  async function apiFetchAll(path, opts) {
    var res = await apiGet(path, opts);
    var items = unwrapData(res);
    return Array.isArray(items) ? items : (items && Array.isArray(items.data) ? items.data : []);
  }

  It.apiPost = apiPost;
  It.apiGet = apiGet;
  It.apiPut = apiPut;
  It.apiPatch = apiPatch;
  It.apiDelete = apiDelete;
  It.fetchAll = apiFetchAll;
  It.extractToken = extractToken;
  It.isFieldErrors = isFieldErrors;
  It.normalizePath = normalizePath;
  It.unwrapData = unwrapData;
  It.parseMeta = parseMeta;
  It.refreshToken = refreshToken;

  It.api = {
    get: apiGet,
    post: apiPost,
    put: apiPut,
    patch: apiPatch,
    delete: apiDelete,
    fetchAll: apiFetchAll,
    request: request
  };

  function esc(value) {
    return String(value === null || value === undefined ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function money(cents, currency) {
    if (cents === null || cents === undefined || isNaN(cents)) return "–";
    var num = Number(cents);
    if (num > 500 && num % 1 === 0 && cents > 1000) num = num / 100; // detect cents vs dollars
    return (currency ? currency + " " : "$") + num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  function starsHtml(rating) {
    var r = Number(rating) || 0;
    var out = '<span class="stars" aria-label="' + r + ' out of 5">';
    for (var i = 1; i <= 5; i++) out += i <= Math.round(r) ? "★" : "☆";
    out += "</span>";
    return out;
  }

  function badgeHtml(status) {
    var cls = "badge";
    var s = String(status || "").toLowerCase();
    if (s === "completed" || s === "approved" || s === "read" || s === "active" || s === "confirmed") cls += " badge--ok";
    else if (s === "pending" || s === "planning" || s === "unread") cls += " badge--warn";
    else if (s === "cancelled" || s === "rejected" || s === "past_due" || s === "blocked") cls += " badge--danger";
    return '<span class="' + cls + '">' + esc(String(status).replace(/_/g, " ")) + "</span>";
  }

  function imageHtml(src, name, cls, type) {
    var safeName = esc(name || '');
    var isPlaceholder = !src || src.indexOf('placeholder') > -1 || src.indexOf('null') > -1 || src.indexOf('undefined') > -1 || src.indexOf('loremflickr') > -1;
    var unsplashFallback = (global.Itinari && global.Itinari.getUnsplashImage) ? global.Itinari.getUnsplashImage(name, type) : 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80';
    var finalSrc = isPlaceholder ? unsplashFallback : src;
    return '<img class="' + (cls || '') + '" src="' + esc(finalSrc) + '" alt="' + safeName + '" loading="lazy" onerror="this.onerror=null; this.src=\'' + unsplashFallback + '\';">';
  }

  function appBoot(callback) {
    if (!It.session) return;
    if (!It.session.hasToken()) {
      It.session.redirectToLogin();
      return;
    }
    It.session.currentUser().then(function (user) {
      if (!user) {
        It.session.clearSession();
        It.session.redirectToLogin();
        return;
      }
      var role = It.session.roleOf(user);
      if (callback) callback(user, role);
    });
  }

  // Helper object fallback for standalone modules
  It.app = It.app || {};
  It.app.esc = It.app.esc || esc;
  It.app.showToast = It.app.showToast || function (msg, type) {
    if (It.toast) return It.toast(msg, type);
    if (global.ItTheme && global.ItTheme.toast) return global.ItTheme.toast(msg, type);
    console.log("[Toast " + type + "]:", msg);
  };
  It.app.toast = It.app.toast || It.app.showToast;
  It.app.money = It.app.money || money;
  It.app.starsHtml = It.app.starsHtml || starsHtml;
  It.app.badgeHtml = It.app.badgeHtml || badgeHtml;
  It.app.imageHtml = It.app.imageHtml || imageHtml;
  It.app.unwrapData = It.app.unwrapData || unwrapData;
  It.app.boot = It.app.boot || appBoot;

  It.feedback = It.feedback || {
    banner: function (msg, cls) {
      var box = document.getElementById("site-banner");
      var text = document.getElementById("site-banner-msg");
      if (!box || !text) return;
      text.textContent = msg || "";
      box.className = cls || "";
      box.classList.add("is-visible");
      setTimeout(function () { box.classList.remove("is-visible"); }, 4000);
    },
    toast: function (msg, type) {
      if (It.app && It.app.showToast) It.app.showToast(msg, type);
    }
  };

  global.Api = It.api;
})(window);