/* ============================================================
   ITINERA — Auth state & session management (JWT)
   ============================================================ */

const Auth = (() => {
  function getUser() {
    try {
      const raw = localStorage.getItem(APP_CONFIG.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function isLoggedIn() {
    return !!Api.getToken();
  }

  function setSession(token, user) {
    Api.setToken(token);
    localStorage.setItem(APP_CONFIG.USER_KEY, JSON.stringify(user));
  }

  async function login(email, password) {
    const { data } = await Api.post('/login', { email, password });
    setSession(data.token, data.user);
    return data;
  }

  async function register(name, email, password) {
    const { data } = await Api.post('/register', { name, email, password });
    setSession(data.token, data.user);
    return data;
  }

  async function logout() {
    try {
      await Api.post('/logout', null, { auth: true, retry: false });
    } catch (e) {
      /* ignore network errors on logout — clear locally anyway */
    } finally {
      localStorage.removeItem(APP_CONFIG.TOKEN_KEY);
      localStorage.removeItem(APP_CONFIG.USER_KEY);
    }
  }

  async function me() {
    const { data } = await Api.get('/user', null, { auth: true });
    localStorage.setItem(APP_CONFIG.USER_KEY, JSON.stringify(data.user));
    return data.user;
  }

  /* Renders the auth area (header / mobile menu) and wires actions.
     Hydrates the user profile from the API when a token exists but no
     cached profile is stored (login page stores only the token). */
  async function renderHeaderAuth() {
    const scopes = document.querySelectorAll('[data-auth-scope]');
    if (!scopes.length) return;

    let user = getUser();
    if (!user && isLoggedIn()) {
      try {
        user = await me();
      } catch (e) {
        user = null;
      }
    }

    scopes.forEach((scope) => {
      if (user) {
        scope.innerHTML = `
          <span class="user-chip" title="${Ui.esc(user.email || '')}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>
            </svg>
            <b>${Ui.esc(user.name || 'User')}</b>
          </span>
        `;
      } else {
        scope.innerHTML = `
          <a class="btn btn-ghost btn-sm" href="login.html">Log in</a>
          <a class="btn btn-primary btn-sm" href="register.html">Sign up</a>
        `;
      }
    });
  }

  window.addEventListener('itinera:unauthorized', () => {
    renderHeaderAuth();
    const isAuthPage = /login\.html$|register\.html$/.test(window.location.pathname);
    if (!isAuthPage) {
      Ui.toast('Please log in to continue.', 'error');
    }
  });

  return { login, register, logout, me, isLoggedIn, getUser, setSession, renderHeaderAuth };
})();
