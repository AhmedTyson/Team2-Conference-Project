/**
 * destinations.js — destinations atlas explorer (v2).
 * Boot: same session gate as the rest of the app (no token → login).
 * Fetches GET /api/v1/destinations (list) and GET /api/v1/destinations/{id} (detail).
 * Motion goes through Itinari.motion (animations.js — the only GSAP file).
 */
(function (global) {
  "use strict";

  const It = global.Itinari;
  const fb = It.feedback;
  const motion = It.motion;

  const DEST = "/v1/destinations";
  const THEME_KEY = "itinari_theme";

  let all = [];
  let sortMode = "name-asc";

  function el(id) { return document.getElementById(id); }

  /* ---------- theme ---------- */
  function initTheme() {
    let dark = false;
    if (localStorage.getItem(THEME_KEY) !== null) {
      dark = localStorage.getItem(THEME_KEY) === "dark";
    } else {
      dark = global.matchMedia && global.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    applyTheme(dark);
    const btn = el("theme-btn");
    if (btn) btn.addEventListener("click", function () {
      applyTheme(!document.documentElement.classList.contains("dark"));
    });
  }

  function applyTheme(dark) {
    document.documentElement.classList.toggle("dark", dark);
    try { localStorage.setItem(THEME_KEY, dark ? "dark" : "light"); } catch (e) {}
    const btn = el("theme-btn");
    if (btn) btn.setAttribute("aria-pressed", String(dark));
  }

  /* ---------- data helpers ---------- */
  function apiRoot() {
    return String(It.CONFIG.apiBase).replace(/\/api\/?$/, "");
  }

  function resolveImage(src) {
    if (!src) return null;
    if (/^(https?:)?\/\//.test(src)) return src;
    return apiRoot() + "/" + src.replace(/^\/+/, "");
  }

  function flagOf(d) {
    return d.country && d.country.flag_url ? d.country.flag_url : null;
  }

  /* ---------- render ---------- */
  function renderProfile(user) {
    const chip = el("user-chip");
    if (!chip) return;
    const name = user ? user.name : "";
    const role = user ? It.session.roleOf(user) : "user";
    el("chip-name").textContent = name;
    el("chip-role").textContent = role;
    chip.hidden = false;
    motion.pop(chip);
  }

  function mediaBlock(d, cls) {
    const media = document.createElement("div");
    media.className = cls || "dest-card-media";
    const initial = (d.name || "?").trim().charAt(0).toUpperCase();

    const badge = document.createElement("span");
    badge.className = "dest-card-badge";
    const flag = flagOf(d);
    if (flag) {
      const img = document.createElement("img");
      img.src = flag;
      img.alt = "";
      img.loading = "lazy";
      img.addEventListener("error", function () { img.remove(); });
      badge.appendChild(img);
    }
    badge.appendChild(document.createTextNode((d.country && d.country.name) || "—"));
    media.appendChild(badge);

    const src = resolveImage(d.image);
    const initialEl = document.createElement("span");
    initialEl.className = "dest-card-initial";
    initialEl.textContent = initial;
    if (src) {
      const img = document.createElement("img");
      img.src = src;
      img.alt = d.name || "Destination";
      img.loading = "lazy";
      img.addEventListener("error", function () {
        img.remove();
        media.appendChild(initialEl);
      });
      media.appendChild(img);
    } else {
      media.appendChild(initialEl);
    }

    const coords = document.createElement("p");
    coords.className = "dest-card-coords";
    coords.textContent = (d.latitude != null && d.longitude != null)
      ? d.latitude.toFixed(2) + ", " + d.longitude.toFixed(2)
      : "";
    if (coords.textContent) media.appendChild(coords);

    return media;
  }

  function buildCard(d) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "dest-card";
    card.dataset.id = d.id;

    card.appendChild(mediaBlock(d, "dest-card-media"));

    const body = document.createElement("div");
    body.className = "dest-card-body";

    const city = document.createElement("p");
    city.className = "dest-card-city";
    city.textContent = d.city_name || "—";

    const title = document.createElement("h3");
    title.className = "dest-card-title";
    title.textContent = d.name || "Untitled";

    const desc = document.createElement("p");
    desc.className = "dest-card-desc";
    desc.textContent = d.description || "";

    const cta = document.createElement("div");
    cta.className = "dest-card-cta";
    const ctaText = document.createElement("span");
    ctaText.textContent = "Explore";
    const arrow = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    arrow.setAttribute("viewBox", "0 0 24 24");
    arrow.setAttribute("fill", "none");
    arrow.setAttribute("stroke", "currentColor");
    arrow.setAttribute("stroke-width", "2");
    arrow.setAttribute("stroke-linecap", "round");
    arrow.setAttribute("stroke-linejoin", "round");
    arrow.setAttribute("aria-hidden", "true");
    arrow.innerHTML = '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>';
    cta.appendChild(ctaText);
    cta.appendChild(arrow);

    body.appendChild(city);
    body.appendChild(title);
    body.appendChild(desc);
    body.appendChild(cta);

    card.appendChild(body);
    return card;
  }

  function renderGrid(list) {
    const grid = el("dest-grid");
    grid.textContent = "";
    const empty = el("dest-empty");

    empty.hidden = !!(list && list.length);
    el("dest-count").textContent = list
      ? list.length + " of " + all.length
      : "";

    if (!list || !list.length) return;

    const cards = list.map(buildCard);
    cards.forEach(function (c) { grid.appendChild(c); });
    motion.fadeUp(cards, { y: 26, stagger: 0.04 });
  }

  function applyFilter(query) {
    const q = (query || "").trim().toLowerCase();
    let list = q
      ? all.filter(function (d) {
          const hay = [
            d.name,
            d.city_name,
            d.description,
            d.country && d.country.name,
          ].filter(Boolean).join(" ").toLowerCase();
          return hay.indexOf(q) !== -1;
        })
      : all.slice();
    applySort(list);
    renderGrid(list);
  }

  function sortValue(d, mode) {
    if (mode === "name-desc") return d.name || "";
    if (mode === "newest") return d.created_at ? new Date(d.created_at).getTime() : 0;
    if (mode === "oldest") return d.created_at ? new Date(d.created_at).getTime() : 0;
    return d.name || "";
  }

  function applySort(list) {
    list.sort(function (a, b) {
      if (sortMode === "name-asc" || sortMode === "name-desc") {
        const cmp = String(a.name || "").localeCompare(String(b.name || ""));
        return sortMode === "name-desc" ? -cmp : cmp;
      }
      return sortMode === "newest" ? (sortValue(b, sortMode) - sortValue(a, sortMode)) : (sortValue(a, sortMode) - sortValue(b, sortMode));
    });
  }

  /* ---------- stats ---------- */
  function renderStats(data) {
    const countries = new Set();
    const cities = new Set();
    data.forEach(function (d) {
      if (d.country && d.country.name) countries.add(d.country.name);
      if (d.city_name) cities.add(d.city_name);
    });
    motion.countUp(el("stat-destinations"), data.length, { duration: 1.2 });
    motion.countUp(el("stat-countries"), countries.size, { duration: 1.4, delay: 0.15 });
    motion.countUp(el("stat-cities"), cities.size, { duration: 1.6, delay: 0.3 });
  }

  /* ---------- modal ---------- */
  function openDetail(d) {
    const modal = el("dest-modal");
    const mediaEl = el("dest-modal-media");
    const bodyEl = el("dest-modal-body");

    mediaEl.textContent = "";
    const placeholder = document.createElement("span");
    placeholder.className = "dest-card-initial";
    placeholder.textContent = "?";
    mediaEl.appendChild(placeholder);
    const closeBtn = el("dest-modal-close");
    mediaEl.appendChild(closeBtn);
    bodyEl.textContent = "";
    bodyEl.appendChild(document.createElement("div")).className = "skeleton";

    if (typeof modal.showModal === "function") modal.showModal();

    It.apiGet(DEST + "/" + d.id).then(function (res) {
      const data = res.ok && res.body && res.body.data ? res.body.data : null;
      if (!data) {
        bodyEl.textContent = "";
        const p = document.createElement("p");
        p.textContent = "Could not load this destination.";
        bodyEl.appendChild(p);
        return;
      }
      bodyEl.textContent = "";

      const src = resolveImage(data.image);
      if (src) {
        const img = document.createElement("img");
        img.src = src;
        img.alt = data.name || "Destination";
        img.addEventListener("error", function () { img.remove(); });
        mediaEl.insertBefore(img, closeBtn);
        placeholder.remove();
      }

      const title = document.createElement("h2");
      title.id = "dest-modal-title";
      title.className = "dest-modal-title";
      title.textContent = data.name || "Untitled";

      const city = document.createElement("p");
      city.className = "dest-modal-city";
      city.textContent = data.city_name || "—";

      const desc = document.createElement("p");
      desc.className = "dest-modal-desc";
      desc.textContent = data.description || "No description yet.";

      const meta = document.createElement("div");
      meta.className = "dest-modal-meta";

      function metaItem(label, value) {
        const item = document.createElement("div");
        item.className = "dest-meta-item";
        const l = document.createElement("span");
        l.textContent = label;
        const v = document.createElement("strong");
        v.textContent = value || "—";
        item.appendChild(l);
        item.appendChild(v);
        return item;
      }

      const country = data.country || {};
      meta.appendChild(metaItem("Country", country.name));
      meta.appendChild(metaItem("Capital", country.capital));
      meta.appendChild(metaItem("Currency", country.currency));
      meta.appendChild(metaItem("Languages", Array.isArray(country.languages) ? country.languages.join(", ") : null));
      meta.appendChild(metaItem("Coordinates",
        data.latitude != null && data.longitude != null
          ? data.latitude.toFixed(4) + ", " + data.longitude.toFixed(4)
          : null));

      const actions = document.createElement("div");
      actions.className = "dest-modal-actions";
      if (data.latitude != null && data.longitude != null) {
        const map = document.createElement("a");
        map.className = "btn-map";
        map.href = "https://www.google.com/maps?q=" + data.latitude + "," + data.longitude;
        map.target = "_blank";
        map.rel = "noopener noreferrer";
        map.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg><span>View on map</span>';
        actions.appendChild(map);
      }

      bodyEl.appendChild(title);
      bodyEl.appendChild(city);
      bodyEl.appendChild(desc);
      bodyEl.appendChild(meta);
      bodyEl.appendChild(actions);

      motion.fadeUp([title, city, desc, meta, actions], { y: 18, stagger: 0.06 });
    }).catch(function (err) {
      bodyEl.textContent = "";
      const p = document.createElement("p");
      p.textContent = err.message || "Could not load this destination.";
      bodyEl.appendChild(p);
    });
  }

  /* ---------- page load ---------- */
  function heroEntrance() {
    motion.fadeUp([
      ".hero-eyebrow",
      ".hero-title",
      ".hero-sub",
      ".hero-search",
      ".hero-stats",
    ].map(document.querySelector.bind(document)).filter(Boolean), { y: 30, stagger: 0.1 });
  }

  function load(user) {
    renderProfile(user);
    heroEntrance();

    It.apiGet(DEST).then(function (res) {
      const data = res.ok && res.body && Array.isArray(res.body.data) ? res.body.data : [];
      all = data;
      renderStats(data);
      applyFilter("");
      motion.pop([".section-head"], { delay: 0.2 });
    }).catch(function (err) {
      fb.banner(err.message || "Could not load destinations.", "is-error");
      renderGrid([]);
    });
  }

  function boot() {
    // if (!It.session.hasToken()) {
    //   It.session.redirectToLogin();
    //   return;
    // }
    // It.session.currentUser().then(function (user) {
    //   if (!user) {
    //     It.session.clearSession();
    //     It.session.redirectToLogin();
    //     return;
    //   }
    //   const role = It.session.roleOf(user);
    //   if (It.session.isAdminRole(role)) {
    //     global.location.replace(It.CONFIG.role.admin);
    //     return;
    //   }
    //   if (role === "agency") {
    //     global.location.replace(It.CONFIG.role.agency);
    //     return;
    //   }
    //   load(user);
    // });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();

    const logoutBtn = el("logout-btn");
    if (logoutBtn) logoutBtn.addEventListener("click", function () { It.session.logout(); });

    const search = el("dest-search");
    if (search) {
      search.addEventListener("input", function () { applyFilter(search.value); });

      // Prevent Enter key inside the search field from submitting a
      // wrapping <form> and reloading the page.
      search.addEventListener("keydown", function (e) {
        if (e.key === "Enter") e.preventDefault();
      });

      const searchForm = search.closest("form");
      if (searchForm) {
        searchForm.addEventListener("submit", function (e) { e.preventDefault(); });
      }
    }

    const sort = el("dest-sort");
    if (sort) {
      sort.addEventListener("change", function () {
        sortMode = sort.value;
        applyFilter(el("dest-search").value);
      });

      const sortForm = sort.closest("form");
      if (sortForm) {
        sortForm.addEventListener("submit", function (e) { e.preventDefault(); });
      }
    }

    const grid = el("dest-grid");
    if (grid) grid.addEventListener("click", function (e) {
      const card = e.target.closest(".dest-card");
      if (card && card.dataset.id) openDetail({ id: card.dataset.id });
    });

    const closeBtn = el("dest-modal-close");
    if (closeBtn) closeBtn.addEventListener("click", function () {
      const modal = el("dest-modal");
      if (typeof modal.close === "function") modal.close();
    });

    const modal = el("dest-modal");
    if (modal) modal.addEventListener("click", function (e) {
      if (e.target === modal && typeof modal.close === "function") modal.close();
    });

    boot();
  });
})(window);