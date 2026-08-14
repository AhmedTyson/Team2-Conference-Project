/* ============================================================
   ITINERA — Shared UI components & utilities
   Cards, stars, favourite button, states, toast, modal, icons.
   ============================================================ */

const Ui = (() => {
  /* ---------- helpers ---------- */

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function money(value) {
    const n = Number(value);
    if (Number.isNaN(n) || n <= 0) return null;
    return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  function truncate(str, len) {
    const s = String(str || '');
    return s.length > len ? s.slice(0, len - 1).trimEnd() + '…' : s;
  }

  /* ---------- icons (inline, monochrome, stroke = currentColor) ---------- */

  const ICONS = {
    search: '<svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.8-3.8"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 20.5S3.5 15.5 3.5 9.3A4.8 4.8 0 0 1 12 6.6a4.8 4.8 0 0 1 8.5 2.7c0 6.2-8.5 11.2-8.5 11.2z"/></svg>',
    heartFill: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 20.5S3.5 15.5 3.5 9.3A4.8 4.8 0 0 1 12 6.6a4.8 4.8 0 0 1 8.5 2.7c0 6.2-8.5 11.2-8.5 11.2z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l1.8 5.6L19 10l-5.2 2.4L12 18l-1.8-5.6L5 10l5.2-2.4z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 12h16m-6-6l6 6-6 6"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4"/></svg>',
    wifiOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M5 13a9 9 0 0 1 3-2M19 13a9 9 0 0 0-2-1.5M12 20h.01"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5m0 3h.01"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M3.5 7L12 12l8.5-5M12 12v10"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    compass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5L13 13l-4.5 2.5L11 11z"/></svg>',
    bed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 18h18M3 18v2m18-2v2M6 10V6h12v4"/></svg>',
    plate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 5v4m4-3l-2 3M16 13h4"/></svg>',
    landmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 21h18M5 21V10m7 11V10m7 11V10M3 10l9-6 9 6M3 10h18"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4m0-14.2l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-9 0l1 13h10l1-13"/></svg>',
  };

  function icon(name, cls) {
    return (ICONS[name] || '').replace('<svg ', `<svg class="${cls || ''}" `);
  }

  /* ---------- images ---------- */

  const PLACEHOLDER_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#151515"/><g fill="none" stroke="#2e2e2e" stroke-width="3"><circle cx="400" cy="230" r="80"/><path d="M400 310v100M400 345l-60 65h120"/></g><g fill="#2e2e2e"><path d="M640 260l26 55 60 6-44 41 11 59-53-29-53 29 11-59-44-41 60-6z"/><circle cx="190" cy="420" r="14"/><circle cx="620" cy="430" r="10"/></g><text x="400" y="500" font-family="monospace" font-size="16" letter-spacing="6" fill="#4a4a4a" text-anchor="middle">ITINERA</text></svg>';

  const PLACEHOLDER_URL = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(PLACEHOLDER_SVG);

  /* Resolve a relative image path returned by the API against the asset origin. */
  function imgSrc(path) {
    if (!path) return null;
    if (/^(https?:)?\/\//.test(path)) return path;
    if (path.startsWith('data:')) return path;
    var baseUrl = (APP_CONFIG && APP_CONFIG.ASSET_BASE_URL) || '';
    if (!baseUrl) {
      // Try to derive from API_BASE_URL
      baseUrl = (APP_CONFIG && APP_CONFIG.API_BASE_URL) ? APP_CONFIG.API_BASE_URL.replace('/api', '') : '';
    }
    var base = baseUrl.replace(/\/+$/, '');
    return base + '/' + path.replace(/^\/+/, '');
  }

  const hotelImages = [
    'https://images.unsplash.com/photo-1566073171639-4d8ef58f4a13?w=800&q=80',
    'https://images.unsplash.com/photo-1551882547-ff40c0d83b44?w=800&q=80',
    'https://images.unsplash.com/photo-1542314831-c6a4d142104d?w=800&q=80',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
    'https://images.unsplash.com/photo-1621293954908-907159247fc8?w=800&q=80',
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
  ];

  const restaurantImages = [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&q=80',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80',
    'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80',
    'https://images.unsplash.com/photo-1502301103405-2d8e898e3235?w=800&q=80',
  ];

  const attractionImages = [
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80',
    'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=800&q=80',
    'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=800&q=80',
    'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
    'https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=800&q=80',
    'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80',
  ];

  const destinationImages = [
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
    'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
    'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80',
    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
    'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&q=80',
    'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&q=80',
    'https://images.unsplash.com/photo-1543785734-4b6e564642f8?w=800&q=80',
  ];

  /**
   * Returns a deterministic fallback image based on the query string.
   * Uses a hash of the full query (not substring matching on city names)
   * to avoid every item mapping to the same curated city image.
   */
  function getCuratedImage(query, entityType) {
    var q = (query || '').trim();
    // Compute a stable hash from the entire query string
    var hash = 0;
    for (var i = 0; i < q.length; i++) {
      hash = q.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);

    var t = (entityType || '').toLowerCase();
    var ql = q.toLowerCase();

    // Type-aware selection
    if (t === 'hotel' || ql.includes('hotel') || ql.includes('resort') || ql.includes('lodge') || ql.includes('inn') || ql.includes('motel') || ql.includes('suites')) {
      return hotelImages[hash % hotelImages.length];
    }
    if (t === 'restaurant' || ql.includes('restaurant') || ql.includes('cafe') || ql.includes('bistro') || ql.includes('grill') || ql.includes('dining')) {
      return restaurantImages[hash % restaurantImages.length];
    }
    if (t === 'attraction' || ql.includes('museum') || ql.includes('park') || ql.includes('tower') || ql.includes('palace') || ql.includes('temple') || ql.includes('beach')) {
      return attractionImages[hash % attractionImages.length];
    }
    if (t === 'destination') {
      return destinationImages[hash % destinationImages.length];
    }

    // Generic fallback — hash across all pools so different items get different images
    var allImages = [].concat(destinationImages, hotelImages, attractionImages, restaurantImages);
    return allImages[hash % allImages.length];
  }

  function bindImage(img, entityType) {
    // Ensure object-fit: cover always applied
    img.style.objectFit = 'cover';
    img.style.objectPosition = 'center';
    
    var src = img.src || '';
    var isPlaceholder = src === PLACEHOLDER_URL ||
                        src.includes('placeholder') ||
                        src.endsWith('/null') ||
                        src.endsWith('/undefined') ||
                        src.trim() === '';

    if (isPlaceholder && !img.dataset.fallback) {
      img.dataset.fallback = '1';
      img.src = getCuratedImage(img.alt || img.dataset.name || img.title || img.id || '', entityType || img.dataset.type || '');
    }

    img.addEventListener('error', () => {
      if (img.dataset.fallback === '2') return;
      if (!img.dataset.fallback) {
        img.dataset.fallback = '1';
        img.src = getCuratedImage(img.alt || img.dataset.name || img.title || img.id || '', entityType || img.dataset.type || '');
      } else if (img.dataset.fallback === '1') {
        img.dataset.fallback = '2';
        img.src = PLACEHOLDER_URL;
        img.classList.add('img-fallback');
      }
    });
    return img;
  }

  /* ---------- rating stars ---------- */

  function renderStars(rating, { large = false, showValue = false } = {}) {
    const value = Number(rating) || 0;
    const full = Math.round(value);
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      stars += `<span class="star${i <= full ? ' is-on' : ''}">${icon('star')}</span>`;
    }
    const valueText = showValue && value ? `<span class="rating-value">${value.toFixed(1)}</span>` : '';
    return `<span class="rating"><span class="rating-stars${large ? ' lg' : ''}">${stars}</span>${valueText}</span>`;
  }

  /* ---------- type helpers ---------- */

  const TYPE_META = {
    destination: { label: 'Destination', icon: 'compass' },
    hotel:       { label: 'Hotel',       icon: 'bed' },
    restaurant:  { label: 'Restaurant',  icon: 'plate' },
    attraction:  { label: 'Attraction',  icon: 'landmark' },
  };

  function normalizeType(type) {
    const t = String(type || '');
    const short = t.split('\\').pop().toLowerCase();
    if (short.endsWith('destination')) return 'destination';
    if (short.endsWith('hotel')) return 'hotel';
    if (short.endsWith('restaurant')) return 'restaurant';
    if (short.endsWith('attraction')) return 'attraction';
    return short;
  }

  function typeMeta(type) {
    return TYPE_META[normalizeType(type)] || { label: 'Item', icon: 'box' };
  }

  function detailLink(type, id) {
    const t = normalizeType(type);
    return `${t === 'destination' ? 'destination' : t}-details.html?id=${id}`;
  }

  /* ---------- favourite state (real backend favourites) ---------- */

  const Favourites = (() => {
    let favs = null; // [{type, id}] normalized keys

    async function load() {
      if (!Auth.isLoggedIn()) {
        favs = [];
        return favs;
      }
      try {
        const body = await Api.get('/dashboard/favourites', null, { auth: true });
        favs = (Array.isArray(body.data.data) ? body.data.data : []).map((f) => ({
          type: normalizeType(f.favorable_type),
          id: Number(f.favorable_id),
        }));
      } catch (e) {
        favs = [];
      }
      return favs;
    }

    function ready() {
      return Array.isArray(favs);
    }

    function isFav(type, id) {
      const t = normalizeType(type);
      const n = Number(id);
      return Array.isArray(favs) && favs.some((f) => f.type === t && f.id === n);
    }

    function set(type, id, on) {
      const t = normalizeType(type);
      const n = Number(id);
      if (!Array.isArray(favs)) favs = [];
      if (on) {
        if (!isFav(t, n)) favs.push({ type: t, id: n });
      } else {
        favs = favs.filter((f) => !(f.type === t && f.id === n));
      }
      window.dispatchEvent(new CustomEvent('itinera:favourites-changed', { detail: {} }));
    }

    /* Seed the cache from a dashboard/favourites payload (avoids a re-fetch). */
    function setList(rawFavs) {
      favs = (rawFavs || []).map((f) => ({
        type: normalizeType(f.favorable_type),
        id: Number(f.favorable_id),
      }));
    }

    async function toggle(type, id) {
      if (!Auth.isLoggedIn()) {
        const target = window.location.pathname.split('/').pop() + window.location.search;
        sessionStorage.setItem('itinera_redirect', target);
        Ui.toast('Log in to save favourites.', 'error');
        window.location.href = 'login.html';
        return null;
      }
      const t = normalizeType(type);
      const { data } = await Api.post(`/v1/favourites/${t}/${id}`, null, { auth: true });
      set(t, id, data.status === 'added');
      return data.status === 'added';
    }

    return { load, ready, isFav, set, setList, toggle };
  })();

  /* Renders a favourite (heart) button, wired to the real toggle endpoint. */
  function favButton(type, id, { active = null, size = '' } = {}) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `fav-btn ${size}`;
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.setAttribute('aria-label', 'Save to favourites');
    btn.innerHTML = active ? ICONS.heartFill : ICONS.heart;
    if (active !== null) btn.classList.toggle('is-active', active);

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.add('is-busy');
      try {
        const added = await Favourites.toggle(type, id);
        if (added !== null) {
          btn.classList.toggle('is-active', added);
          btn.setAttribute('aria-pressed', added ? 'true' : 'false');
          btn.innerHTML = added ? ICONS.heartFill : ICONS.heart;
          Ui.toast(added ? 'Saved to favourites.' : 'Removed from favourites.', added ? 'success' : '');
        }
      } catch (err) {
        Ui.toast(err.message || 'Could not update favourites.', 'error');
      } finally {
        btn.classList.remove('is-busy');
      }
    });
    return btn;
  }

  /* ---------- cards ---------- */

  function skeletonCard() {
    return `
      <div class="skeleton" role="status" aria-label="Loading">
        <div class="skeleton-media"></div>
        <div style="padding:20px;display:flex;flex-direction:column;gap:10px">
          <div class="skeleton-line" style="width:60%"></div>
          <div class="skeleton-line" style="width:90%"></div>
          <div class="skeleton-line" style="width:40%"></div>
        </div>
      </div>`;
  }

  function skeletonGrid(count) {
    return Array.from({ length: count }, () => skeletonCard()).join('');
  }

  /* ---------- UI states ---------- */

  const STATE_ICONS = {
    loading: 'sparkle',
    empty: 'box',
    error: 'alert',
    network: 'wifiOff',
    unauthorized: 'lock',
  };

  function statePanel({ type = 'empty', title, message, retry = null } = {}) {
    const icons = {
      empty: ICONS.box,
      error: ICONS.alert,
      network: ICONS.wifiOff,
      unauthorized: ICONS.lock,
      loading: ICONS.sparkle,
    };
    const defaults = {
      empty: { title: 'Nothing here yet', message: 'There are no items matching your search.' },
      error: { title: 'Something went wrong', message: 'The request could not be completed.' },
      network: { title: 'No connection', message: 'Check your internet connection and try again.' },
      unauthorized: { title: 'Authentication required', message: 'Please log in to view this content.' },
    };
    const d = defaults[type] || defaults.empty;
    const panel = document.createElement('div');
    panel.className = 'state-panel reveal';
    panel.setAttribute('role', 'status');
    panel.innerHTML = `
      <span class="state-icon">${icons[type] || icons.empty}</span>
      <h3>${esc(title || d.title)}</h3>
      <p>${esc(message || d.message)}</p>
      ${retry ? `<button class="btn btn-sm" data-action="retry">Try again</button>` : ''}
    `;
    if (retry) {
      panel.querySelector('[data-action="retry"]').addEventListener('click', retry);
    }
    return panel;
  }

  function setState(container, opts) {
    container.innerHTML = '';
    container.appendChild(statePanel(opts));
  }

  /* ---------- toast ---------- */

  let toastStack = null;

  function ensureToastStack() {
    if (!toastStack) {
      toastStack = document.createElement('div');
      toastStack.className = 'toast-stack';
      toastStack.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastStack);
    }
    return toastStack;
  }

  function toast(message, type = '') {
    const stack = ensureToastStack();
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ` is-${type}` : '');
    el.innerHTML = `<span class="toast-dot"></span><span>${esc(message)}</span>`;
    stack.appendChild(el);
    setTimeout(() => {
      el.classList.add('is-leaving');
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }, 3600);
  }

  /* ---------- modal ---------- */

  function openModal({ title, body, foot = '' }) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.setAttribute('aria-label', title);
    backdrop.innerHTML = `
      <div class="modal">
        <div class="modal-head">
          <h2>${esc(title)}</h2>
          <button class="modal-close" aria-label="Close dialog">✕</button>
        </div>
        <div class="modal-body">${body}</div>
        ${foot ? `<div class="modal-foot">${foot}</div>` : ''}
      </div>`;
    const close = () => backdrop.remove();
    backdrop.querySelector('.modal-close').addEventListener('click', close);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); }
    });
    document.body.appendChild(backdrop);
    return backdrop;
  }

  /* ---------- pagination ---------- */

  function pagination(meta, onPage) {
    if (!meta || !meta.last_page || meta.last_page <= 1) return '';
    const current = meta.current_page;
    const last = meta.last_page;
    const pages = [];
    const push = (n, label, currentFlag, disabled) => pages.push({ n, label, current: currentFlag, disabled });
    push(current - 1, '←', false, current === 1);
    const start = Math.max(1, current - 2);
    const end = Math.min(last, start + 4);
    for (let i = Math.max(1, start); i <= end; i++) push(i, String(i), i === current, false);
    push(current + 1, '→', false, current === last);
    const wrap = document.createElement('nav');
    wrap.className = 'pagination';
    wrap.setAttribute('aria-label', 'Pagination');
    wrap.innerHTML = pages.map((p) => `
      <button class="page-btn${p.current ? ' is-current' : ''}" data-page="${p.n}"
        ${p.disabled ? 'disabled' : ''} aria-current="${p.current ? 'page' : 'false'}">${p.label}</button>
    `).join('');
    wrap.addEventListener('click', (e) => {
      const btn = e.target.closest('.page-btn');
      if (!btn || btn.disabled) return;
      onPage(Number(btn.dataset.page));
      wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    return wrap;
  }

  /* ---------- misc shared renderers ---------- */

  function destinationMeta(dest) {
    const country = dest.country && (dest.country.name || dest.country.city_name) ? dest.country.name : null;
    return {
      subtitle: country ? `${country} · ${dest.city_name || ''}`.replace(/·\s*$/, '') : dest.city_name,
    };
  }

  /* ---------- theme toggle ---------- */

  const Theme = (() => {
    const KEY = 'itinera_theme';

    function current() {
      return document.documentElement.getAttribute('data-theme') || 'light';
    }

    function apply(theme) {
      if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else document.documentElement.removeAttribute('data-theme');
      try { localStorage.setItem(KEY, theme); } catch (e) { /* private mode */ }
    }

    function toggle() {
      apply(current() === 'dark' ? 'light' : 'dark');
    }

    function init() {
      document.querySelectorAll('.theme-toggle').forEach((btn) => {
        btn.addEventListener('click', toggle);
      });
    }

    return { current, apply, toggle, init };
  })();

  function init() {
    Theme.init();
    Auth.renderHeaderAuth();

    /* offline banner */
    window.addEventListener('itinera:offline', () => {
      if (document.querySelector('.offline-banner')) return;
      const banner = document.createElement('div');
      banner.className = 'offline-banner';
      banner.textContent = 'You are offline — showing cached connection state';
      document.body.prepend(banner);
    });

    /* mobile/desktop unified hamburger nav */
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('mobileMenu');
    if (toggle && menu) {
      // Re-configure mobileMenu to be our premium glassmorphic slide-over overlay
      menu.className = 'burger-menu-overlay';
      menu.id = 'app-burger-menu';
      
      const content = document.createElement('div');
      content.className = 'burger-menu-content';
      
      const menuNav = document.createElement('nav');
      menuNav.className = 'burger-menu-nav';

      const user = Auth.getUser();
      const items = [
        { to: 'home.html', label: 'Home' },
        { to: 'explore.html', label: 'Explore' },
        { to: 'attractions.html', label: 'Attractions' },
        { to: 'hotels.html', label: 'Hotels' },
        { to: 'restaurants.html', label: 'Restaurants' },
        { to: 'destinations.html', label: 'Destinations' },
        { to: 'weather.html', label: 'Weather' },
        { to: 'favourites.html', label: 'Favourites' },
        { to: 'contact.html', label: 'Contact' },
      ];

      // Add a header/title
      const titleEl = document.createElement('h3');
      titleEl.style.margin = '0 0 var(--sp-6) var(--sp-4)';
      titleEl.style.fontSize = 'var(--fs-xs)';
      titleEl.style.fontFamily = 'var(--font-mono)';
      titleEl.style.letterSpacing = '0.16em';
      titleEl.style.textTransform = 'uppercase';
      titleEl.style.color = 'var(--text-faint)';
      titleEl.textContent = 'Menu';
      content.appendChild(titleEl);

      const path = (window.location.pathname.split('/').pop() || 'home.html').split('?')[0];
      items.forEach((item) => {
        const a = document.createElement('a');
        a.href = item.to;
        a.className = 'burger-menu-link' + (item.to === path ? ' burger-menu-link--active' : '');
        a.textContent = item.label;
        menuNav.appendChild(a);
      });

      if (user && (user.roles || [user.role] || []).indexOf("super_admin") !== -1) {
        const admin = document.createElement("a");
        admin.href = "/admin/index.html";
        admin.className = "burger-menu-link";
        admin.textContent = "Admin Portal";
        menuNav.appendChild(admin);
      }

      if (user) {
        // Add dynamic logout button at bottom of menu
        const divider = document.createElement('hr');
        divider.style.border = 'none';
        divider.style.borderTop = '1px solid var(--border)';
        divider.style.marginBlock = 'var(--sp-6)';
        menuNav.appendChild(divider);

        const logoutBtn = document.createElement('button');
        logoutBtn.type = 'button';
        logoutBtn.className = 'burger-menu-link';
        logoutBtn.style.color = '#ef4444';
        logoutBtn.textContent = 'Log Out';
        logoutBtn.addEventListener('click', async () => {
          await Auth.logout();
          Ui.toast('You have been logged out.');
          window.location.href = 'login.html';
        });
        menuNav.appendChild(logoutBtn);
      }

      content.appendChild(menuNav);
      menu.innerHTML = '';
      menu.appendChild(content);

      // Setup event listeners
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = menu.classList.toggle('is-open');
        toggle.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });

      menu.addEventListener('click', (e) => {
        if (e.target === menu || e.target.closest('a') || e.target.closest('button')) {
          menu.classList.remove('is-open');
          toggle.classList.remove('is-open');
        }
      });
    }

    /* header scroll state */
    const header = document.querySelector('.site-header');
    if (header) {
      const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    /* active nav highlighting */
    const pageName = window.location.pathname.split('/').pop().replace('.html', '');
    const currentType = pageName === 'index' ? 'destinations'
      : pageName.includes('hotel') ? 'hotel'
      : pageName.includes('restaurant') ? 'restaurant'
      : pageName.includes('attraction') ? 'attraction'
      : pageName === 'favourites' ? 'favourites'
      : null;
    document.querySelectorAll('.site-nav a').forEach((a) => {
      const href = (a.getAttribute('href') || '');
      let matches = false;
      if (currentType === 'favourites') matches = href === 'favourites.html';
      else if (currentType) matches = href.startsWith(currentType);
      else matches = href === 'index.html' || href === 'destinations.html';
      a.classList.toggle('is-active', matches);
    });
    document.querySelectorAll('.tabbar a').forEach((a) => {
      const href = (a.getAttribute('href') || '');
      let matches = false;
      if (currentType === 'favourites') matches = href === 'favourites.html';
      else if (currentType) matches = href.startsWith(currentType);
      else matches = href === 'index.html' || href === 'destinations.html';
      a.classList.toggle('is-active', matches);
    });
  }

  /* Preload favourite state in the background (best-effort, never blocks). */
  function preloadFavourites() {
    Favourites.load().catch(() => {});
  }

  /* Keep the first item per key (used to hide duplicate seed rows). */
  function uniqueBy(list, keyFn) {
    const seen = new Set();
    return (list || []).filter((x) => {
      const k = keyFn(x);
      if (k === undefined || k === null || k === '') return true;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  return {
    esc, money, truncate, icon, imgSrc, bindImage, PLACEHOLDER_URL,
    renderStars, typeMeta, normalizeType, detailLink, favButton,
    skeletonCard, skeletonGrid, statePanel, setState,
    toast, openModal, pagination, destinationMeta,
    Favourites, Theme, init, preloadFavourites, uniqueBy, ICONS,
  };
})();
