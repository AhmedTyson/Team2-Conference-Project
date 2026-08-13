/* ============================================================
   ITINERA — API service layer
   Handles: GET/POST/PATCH/PUT/DELETE, JSON, JWT headers,
   refresh-on-401, network errors, and response normalization.
   ============================================================ */

class ApiError extends Error {
  constructor(message, { status = 0, data = null, errors = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.errors = errors;   // 422 field errors: {field: [messages]}
  }
}

const Api = (() => {
  let refreshing = null;

  function getToken() {
    return localStorage.getItem(APP_CONFIG.TOKEN_KEY);
  }

  function setToken(token) {
    localStorage.setItem(APP_CONFIG.TOKEN_KEY, token);
  }

  function buildUrl(path, params) {
    const base = APP_CONFIG.API_BASE_URL.replace(/\/+$/, '');
    const url = new URL(base + (path.startsWith('/') ? path : '/' + path));
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          url.searchParams.set(k, v);
        }
      });
    }
    return url.toString();
  }

  async function parseResponse(response) {
    let data = null;
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = null; // non-JSON body (e.g. HTML error page)
      }
    }
    return data;
  }

  function extractMessage(data, status) {
    if (!data) return `Request failed (HTTP ${status}).`;
    if (typeof data.message === 'string') return data.message;
    if (typeof data.error === 'string') return data.error;
    return `Request failed (HTTP ${status}).`;
  }

  /* Refresh the JWT once; concurrent callers share the same promise. */
  function refreshToken() {
    if (!refreshing) {
      refreshing = (async () => {
        const res = await fetch(buildUrl('/refresh'), { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) throw new Error('refresh failed');
        const body = await parseResponse(res);
        if (!body || !body.token) throw new Error('refresh failed: no token');
        setToken(body.token);
        return body.token;
      })().finally(() => {
        refreshing = null;
      });
    }
    return refreshing;
  }

  function notifyUnauthorized() {
    localStorage.removeItem(APP_CONFIG.TOKEN_KEY);
    localStorage.removeItem(APP_CONFIG.USER_KEY);
    window.dispatchEvent(new CustomEvent('itinera:unauthorized', { detail: {} }));
  }

  async function request(method, path, { body = null, params = null, auth = false, retry = true } = {}) {
    const headers = { 'Accept': 'application/json' };
    let payload = undefined;

    if (body instanceof FormData) {
      payload = body; // browser sets multipart boundary
    } else if (body !== null && body !== undefined) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }

    if (auth) {
      const token = getToken();
      if (token) headers['Authorization'] = 'Bearer ' + token;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), APP_CONFIG.REQUEST_TIMEOUT);

    let response;
    try {
      response = await fetch(buildUrl(path, params), {
        method,
        headers,
        body: payload,
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      if (err && err.name === 'AbortError') {
        throw new ApiError('The request timed out. Please try again.', { status: 0 });
      }
      if (err instanceof TypeError) {
        // fetch throws TypeError on network failure / CORS / offline
        window.dispatchEvent(new Event('itinera:offline'));
        throw new ApiError('Network error. Check your connection and try again.', { status: 0 });
      }
      throw err;
    }
    clearTimeout(timeoutId);

    const data = await parseResponse(response);

    // --- 401 handling: attempt one refresh, then replay ---
    if (response.status === 401 && auth && retry) {
      try {
        const newToken = await refreshToken();
        headers['Authorization'] = 'Bearer ' + newToken;
        const controller2 = new AbortController();
        const t2 = setTimeout(() => controller2.abort(), APP_CONFIG.REQUEST_TIMEOUT);
        try {
          response = await fetch(buildUrl(path, params), {
            method, headers, body: payload, signal: controller2.signal,
          });
        } finally {
          clearTimeout(t2);
        }
        const data2 = await parseResponse(response);
        if (response.ok) return { ok: true, status: response.status, data: data2 };
        throw new ApiError(extractMessage(data2, response.status), {
          status: response.status, data: data2, errors: data2 && data2.error,
        });
      } catch (refreshErr) {
        if (refreshErr instanceof ApiError) throw refreshErr;
        notifyUnauthorized();
        throw new ApiError('Your session has expired. Please log in again.', { status: 401 });
      }
    }

    if (!response.ok) {
      throw new ApiError(extractMessage(data, response.status), {
        status: response.status,
        data,
        errors: data && data.error,
      });
    }

    return { ok: true, status: response.status, data };
  }

  /* Fetch every page of a paginated collection endpoint.
     Accepts both {data, meta} paginated responses and plain {data} arrays.
     Remaining pages are requested in parallel to avoid slow sequential round-trips. */
  async function fetchAll(path, params = {}) {
    const extract = (data) => {
      if (Array.isArray(data)) return { items: data, lastPage: 1 };
      if (data && Array.isArray(data.data)) {
        return { items: data.data, lastPage: data.meta && data.meta.last_page ? data.meta.last_page : 1 };
      }
      return { items: [], lastPage: 1 };
    };

    const first = await request('GET', path, { params: { ...params, page: 1 } });
    const { items, lastPage } = extract(first.data);
    if (lastPage <= 1) return items;

    const rest = await Promise.all(
      Array.from({ length: lastPage - 1 }, (_, i) =>
        request('GET', path, { params: { ...params, page: i + 2 } })),
    );

    const out = [...items];
    rest.forEach(({ data }) => out.push(...extract(data).items));
    return out;
  }

  return {
    get: (path, params, opts = {}) => request('GET', path, { ...opts, params }),
    post: (path, body, opts = {}) => request('POST', path, { ...opts, body }),
    patch: (path, body, opts = {}) => request('PATCH', path, { ...opts, body }),
    put: (path, body, opts = {}) => request('PUT', path, { ...opts, body }),
    del: (path, opts = {}) => request('DELETE', path, { ...opts }),
    getToken,
    setToken,
    fetchAll,
  };
})();
