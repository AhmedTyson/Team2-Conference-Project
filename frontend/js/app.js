/* ── Itinera shared bootstrap: toast, auth modal, session UI ──
   Session model (single source of truth):
   - Real JWT stored under `itinera_token` (config.js/api.js/session.js stack).
   - Legacy demo session under `itinera_session` (localStorage) kept as an
     offline fallback so the site remains clickable without a backend.
   The auth modal hits the real API first and falls back to the demo login
   only when the server is unreachable. */

(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const DEMO_KEY = 'itinera_session';
  const REAL_KEY = 'itinera_token';

  const It = window.Itinari || null;

  let authMode = 'login';
  let authCallback = null;
  let toastTimer = null;

  /* ═══════════ Session ═══════════ */

  function getRealToken() {
    try { return It && It.readToken ? It.readToken() : localStorage.getItem(REAL_KEY); }
    catch (e) { return null; }
  }

  function getDemoSession() {
    try {
      const raw = localStorage.getItem(DEMO_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function hasSession() { return !!getRealToken() || !!getDemoSession(); }

  function getActiveUser() {
    const demo = getDemoSession();
    return demo && demo.user ? demo.user : null;
  }

  function setRealToken(token) {
    if (It && It.storeToken) It.storeToken(token);
    else {
      try { localStorage.setItem(REAL_KEY, token); } catch (e) { /* private mode */ }
    }
  }

  function clearAllSessions() {
    try { localStorage.removeItem(DEMO_KEY); } catch (e) {}
    if (It && It.clearToken) It.clearToken();
    else {
      try { localStorage.removeItem(REAL_KEY); } catch (e) {}
    }
    window.currentUser = null;
    window.isLoggedIn = false;
  }

  /* ═══════════ Toast ═══════════ */

  function toast(msg, isError) {
    const el = $('toast');
    const msgEl = $('toastMessage');
    if (!el || !msgEl) return;
    msgEl.textContent = msg;
    el.className = 'toast show' + (isError ? ' err' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = 'toast'; }, 3200);
  }

  window.toast = toast;

  /* ═══════════ Auth modal ═══════════ */

  function openAuthModal(mode, message, cb) {
    const modal = $('authModal');
    if (!modal) return;
    authMode = mode || 'login';
    authCallback = cb || null;
    $('tabLogin').classList.toggle('on', authMode === 'login');
    $('tabRegister').classList.toggle('on', authMode === 'register');
    $('loginForm').style.display = authMode === 'login' ? 'block' : 'none';
    $('registerForm').style.display = authMode === 'register' ? 'block' : 'none';
    $('authTitle').textContent = authMode === 'login' ? 'Welcome back' : 'Join Itinera';
    $('loginStatus').textContent = '';
    $('registerStatus').textContent = message || '';
    modal.classList.add('open');
    const first = authMode === 'login' ? $('loginEmail') : $('regName');
    if (first) setTimeout(() => first.focus(), 50);
  }

  function closeAuthModal() {
    const modal = $('authModal');
    if (modal) modal.classList.remove('open');
  }

  window.openAuthModal = openAuthModal;
  window.closeAuthModal = closeAuthModal;

  function runAuthCallback() {
    if (authCallback) {
      const cb = authCallback;
      authCallback = null;
      cb();
    }
  }

  /* ═══════════ Real API auth (with offline demo fallback) ═══════════ */

  function apiPost(path, payload) {
    if (!It || !It.apiPost) return Promise.reject(new Error('no-api'));
    return It.apiPost(path, payload);
  }

  async function resolveUserForToken() {
    if (!It || !It.session || !It.session.currentUser) return null;
    try {
      const user = await It.session.currentUser();
      if (user) return user;
      // profile fetch failed silently (e.g. unverified email / offline) —
      // decode JWT payload for a display name, keep the session.
      const payload = It.session.tokenPayload ? It.session.tokenPayload() : null;
      if (payload) {
        return {
          name: payload.name || payload.sub || payload.id || 'Member',
          email: payload.email || '',
          _decoded: true,
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  async function doLogin(email, password, statusEl) {
    statusEl.textContent = '⏳ Logging in…';
    try {
      const res = await apiPost(It.CONFIG.routes.login, { email, password });
      if (!res.ok) {
        statusEl.textContent = '❌ Invalid email or password.';
        return;
      }
      const token = It.extractToken(res.body);
      if (token) setRealToken(token);
      const user = (res.body && res.body.user) || await resolveUserForToken();
      if (user) {
        try { localStorage.setItem(DEMO_KEY, JSON.stringify({ token: 'jwt:' + (token || 'x'), user })); } catch (e) {}
        window.currentUser = user;
        window.isLoggedIn = true;
      }
      closeAuthModal();
      applySession();
      const name = (user && (user.name || user.email)) || 'traveler';
      toast('Welcome back, ' + (typeof name === 'string' ? name.split('@')[0] : 'member') + '!');
      document.dispatchEvent(new CustomEvent('itinera:auth', { detail: { user, action: 'login' } }));
      runAuthCallback();
    } catch (e) {
      // Server unreachable → demo fallback so the site stays clickable offline.
      demoLogin(email, password, statusEl);
    }
  }

  function demoLogin(email, password, statusEl) {
    if (!email || !password || password.length < 4) {
      statusEl.textContent = '❌ Invalid credentials. Try admin@example.com / password';
      return;
    }
    const user = { id: 1, name: email.split('@')[0] || 'Traveler', email, demo: true };
    try { localStorage.setItem(DEMO_KEY, JSON.stringify({ token: 'fake-token-' + Date.now(), user })); } catch (e) {}
    window.currentUser = user;
    window.isLoggedIn = true;
    closeAuthModal();
    applySession();
    toast('Demo login — backend offline. Welcome, ' + user.name + '!');
    runAuthCallback();
  }

  async function doRegister(name, email, phone, password, statusEl) {
    statusEl.textContent = '⏳ Creating account…';
    const payload = { name, email, password, password_confirmation: password };
    if (phone) payload.phone = phone;
    try {
      const res = await apiPost(It.CONFIG.routes.register, payload);
      if (!res.ok) {
        if (res.body && res.body.errors && res.body.errors.email) {
          statusEl.textContent = '❌ ' + (res.body.errors.email[0] || 'Email already taken.');
        } else {
          statusEl.textContent = '❌ ' + ((res.body && res.body.message) || 'Registration failed.');
        }
        return;
      }
      const token = It.extractToken(res.body);
      if (token) setRealToken(token);
      const user = (res.body && res.body.user) || { name, email, phone };
      try { localStorage.setItem(DEMO_KEY, JSON.stringify({ token: token ? 'jwt:' + token : 'fake', user })); } catch (e) {}
      window.currentUser = user;
      window.isLoggedIn = true;
      closeAuthModal();
      applySession();
      toast('Account created — check your inbox to verify your email.');
      document.dispatchEvent(new CustomEvent('itinera:auth', { detail: { user, action: 'register' } }));
      runAuthCallback();
    } catch (e) {
      // Offline fallback: accept locally, note verification step.
      const user = { id: Date.now(), name, email, phone, demo: true };
      try { localStorage.setItem(DEMO_KEY, JSON.stringify({ token: 'fake-token-' + Date.now(), user })); } catch (err) {}
      window.currentUser = user;
      window.isLoggedIn = true;
      closeAuthModal();
      applySession();
      toast('Demo account created (backend offline) — welcome to Itinera!');
      runAuthCallback();
    }
  }

  async function handleLogout() {
    if (It && getRealToken()) {
      try {
        await It.apiPost(It.CONFIG.routes.logout, {}, { auth: true });
      } catch (e) { /* best-effort */ }
    }
    clearAllSessions();
    applySession();
    toast('Logged out. See you soon!');
    document.dispatchEvent(new CustomEvent('itinera:logout'));
  }

  /* ═══════════ Session UI ═══════════ */

  function applySession() {
    const loggedIn = hasSession();
    document.querySelectorAll('.guest-actions').forEach((el) => {
      el.style.display = loggedIn ? 'none' : 'inline-flex';
    });
    document.querySelectorAll('.user-chip-area').forEach((el) => {
      el.classList.toggle('hidden', !loggedIn);
    });
    if (loggedIn) {
      const name = (window.currentUser && (window.currentUser.name || window.currentUser.email)) || '—';
      document.querySelectorAll('.user-name').forEach((el) => { el.textContent = name; });
      document.querySelectorAll('.user-avatar').forEach((el) => {
        el.textContent = (name || '?').charAt(0).toUpperCase();
      });
    }
  }

  async function restoreSession() {
    // Real JWT present → resolve the live profile so the chip shows the real
    // name; silent failure keeps the decoded-payload fallback.
    if (getRealToken() && It && It.session) {
      const user = await resolveUserForToken();
      if (user) {
        window.currentUser = user;
        window.isLoggedIn = true;
      }
    } else {
      window.currentUser = getActiveUser();
      window.isLoggedIn = hasSession();
    }
    applySession();
  }

  /* ═══════════ Wiring ═══════════ */

  function init() {
    const modal = $('authModal');

    if (modal) {
      $('authCloseBtn').addEventListener('click', closeAuthModal);
      modal.addEventListener('click', (e) => { if (e.target === modal) closeAuthModal(); });
      $('tabLogin').addEventListener('click', () => openAuthModal('login'));
      $('tabRegister').addEventListener('click', () => openAuthModal('register'));

      $('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = $('loginEmail').value.trim();
        const password = $('loginPassword').value;
        doLogin(email, password, $('loginStatus'));
      });

      $('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = $('regName').value.trim();
        const email = $('regEmail').value.trim();
        const phone = $('regPhone').value.trim();
        const password = $('regPassword').value;
        if (!name || !email || password.length < 8) {
          $('registerStatus').textContent = '❌ Please fill all fields correctly (password: min. 8 characters).';
          return;
        }
        doRegister(name, email, phone, password, $('registerStatus'));
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('open')) closeAuthModal();
      });
    }

    document.querySelectorAll('.btn-login').forEach((el) => el.addEventListener('click', (e) => {
      e.preventDefault();
      openAuthModal('login');
    }));

    document.querySelectorAll('.btn-logout').forEach((el) => el.addEventListener('click', handleLogout));

    // 401 on a public page → silent session clear + toast (README rule 2).
    document.addEventListener('itinera:session-expired', () => {
      window.currentUser = null;
      window.isLoggedIn = false;
      applySession();
      toast('Session expired. Please sign in again.', true);
    });

    const yearEl = $('footerYear') || document.querySelector('.footerYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    restoreSession();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
