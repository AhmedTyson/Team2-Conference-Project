/**
 * admin-chrome.js — shared admin chrome (Phase 17).
 * Theme toggle (.dark from tokens.css), sidebar collapse, active nav
 * highlight, global search bus, modal ESC + body scroll-lock.
 * Depends on config/api/session; included by every admin/*.html.
 */
(function (global) {
  "use strict";

  /* Theme is handled by core/theme.js (ItTheme). No duplicate logic here. */
  const SIDEBAR_KEY = "itinari_sidebar";

  function el(id) { return document.getElementById(id); }

  function initTheme() {
    /* core/theme.js boots before this script and wires the toggle button.
       Nothing extra needed — theme-toggle click is already handled by ItTheme. */
    if (global.ItTheme) {
      global.ItTheme.set(global.ItTheme.mode()); /* re-apply to sync icons */
    }
  }


  function setCollapsed(shell, btn, collapsed) {
    shell.classList.toggle("is-collapsed", collapsed);
    btn.setAttribute("aria-expanded", String(!collapsed));
    btn.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
  }

  function initSidebar() {
    const btn = el("sidebar-collapse");
    const shell = document.querySelector(".shell");
    if (!btn || !shell) return;

    // Inject mobile hamburger menu toggle inside topbar
    const topbar = document.querySelector(".topbar");
    if (topbar) {
      const burger = document.createElement("button");
      burger.type = "button";
      burger.id = "mobile-menu-toggle";
      burger.className = "icon-btn burger-menu-btn";
      burger.setAttribute("aria-label", "Toggle navigation drawer");
      burger.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:18px; height:18px;"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
      topbar.insertBefore(burger, topbar.firstChild);

      burger.addEventListener("click", function() {
        shell.classList.toggle("is-mobile-sidebar-open");
      });
    }

    // Inject mobile sidebar backdrop overlay
    const backdrop = document.createElement("div");
    backdrop.className = "sidebar-backdrop";
    shell.appendChild(backdrop);
    backdrop.addEventListener("click", function() {
      shell.classList.remove("is-mobile-sidebar-open");
    });

    // Close mobile drawer when clicking a navigation link
    document.querySelectorAll(".nav-item").forEach(function (a) {
      a.addEventListener("click", function () {
        shell.classList.remove("is-mobile-sidebar-open");
      });
    });

    let collapsed = false;
    try { collapsed = global.localStorage.getItem(SIDEBAR_KEY) === "1"; } catch (e) { /* ignore */ }
    setCollapsed(shell, btn, collapsed);
    function toggle() {
      collapsed = !collapsed;
      setCollapsed(shell, btn, collapsed);
      try { global.localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0"); } catch (e) { /* ignore */ }
    }
    btn.addEventListener("click", toggle);
    global.document.addEventListener("keydown", function (e) {
      var target = e.target;
      if (target && target.closest && target.closest("input, textarea, select, [contenteditable]")) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggle();
      }
    });
  }

  function initActiveNav() {
    const path = global.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-item").forEach(function (a) {
      const href = (a.getAttribute("href") || "").split("?")[0].split("#")[0];
      a.classList.toggle("is-active", href === path);
    });
  }

  function initSearch() {
    const input = el("global-search");
    if (!input) return;
    input.addEventListener("input", function () {
      document.dispatchEvent(new CustomEvent("admin:search", { detail: input.value }));
    });
  }

  function syncScrollLock() {
    const open = !!document.querySelector(".kit-modal-backdrop") || !!document.querySelector(".kit-modal[open], [aria-modal='true']:not([hidden])");
    document.body.classList.toggle("is-modal-open", open);
  }

  function initModalHandling() {
    const mo = new MutationObserver(syncScrollLock);
    mo.observe(document.body, { childList: true, subtree: true });
    global.document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      const backdrop = document.querySelector(".kit-modal-backdrop");
      if (!backdrop) return;
      e.stopPropagation();
      const root = el("modal-root");
      if (root) root.textContent = "";
      if (global.Itinari && global.Itinari.kit && global.Itinari.kit.closeModal) {
        global.Itinari.kit.closeModal();
      }
      syncScrollLock();
    });
  }

  function initialsOf(name) {
    const n = String(name || "").trim();
    if (!n) return "U";
    const parts = n.split(/\s+/);
    return (parts[0][0] || "") + (parts.length > 1 ? (parts[parts.length - 1][0] || "") : "").toUpperCase();
  }

  function initUserMenu() {
    const chip = el("user-chip");
    if (!chip) return;

    // Relocate user chip to topbar-right next to theme toggle
    const topbarRight = document.querySelector(".topbar-right");
    if (topbarRight) {
      topbarRight.appendChild(chip);
    }

    const wrap = document.createElement("div");
    wrap.className = "user-menu";
    wrap.id = "user-menu";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "user-menu-trigger";
    trigger.id = "user-menu-trigger";
    trigger.setAttribute("aria-haspopup", "menu");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-label", "Account menu");

    const avatar = document.createElement("span");
    avatar.className = "user-avatar";
    avatar.setAttribute("aria-hidden", "true");

    const caret = document.createElement("svg");
    caret.className = "user-caret";
    caret.setAttribute("viewBox", "0 0 24 24");
    caret.setAttribute("fill", "none");
    caret.setAttribute("stroke", "currentColor");
    caret.setAttribute("stroke-width", "2");
    caret.setAttribute("stroke-linecap", "round");
    caret.setAttribute("stroke-linejoin", "round");
    caret.setAttribute("aria-hidden", "true");
    caret.innerHTML = '<path d="m6 9 6 6 6-6"/>';

    trigger.appendChild(avatar);

    const panel = document.createElement("div");
    panel.className = "user-menu-panel";
    panel.id = "user-menu-panel";
    panel.setAttribute("role", "menu");
    panel.setAttribute("aria-labelledby", "user-menu-trigger");
    panel.hidden = true;

    const items = [
      { label: "Profile", id: "user-menu-profile", action: function () { window.location.href = "user-details.html?id=current"; } },
      { label: "Manage account", id: "user-menu-account", action: function () { window.location.href = "user-details.html?id=current"; } },
    ];
    items.forEach(function (it) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "user-menu-item";
      item.id = it.id;
      item.setAttribute("role", "menuitem");
      item.tabIndex = -1;
      item.textContent = it.label;
      item.addEventListener("click", function () {
        close();
        it.action();
      });
      panel.appendChild(item);
    });

    panel.appendChild(document.createElement("hr"));

    const logout = document.createElement("button");
    logout.type = "button";
    logout.className = "user-menu-item is-danger";
    logout.id = "user-menu-signout";
    logout.setAttribute("role", "menuitem");
    logout.tabIndex = -1;
    logout.textContent = "Sign out";
    logout.addEventListener("click", function () {
      close();
      if (global.Itinari && global.Itinari.session && global.Itinari.session.logout) {
        global.Itinari.session.logout();
      }
    });
    panel.appendChild(logout);

    /* observe chip so all per-page renderProfile() fills keep working */
    const render = function () {
      const uname = document.getElementById("chip-name");
      if (uname && uname.textContent) avatar.textContent = initialsOf(uname.textContent);
    };

    chip.parentNode.insertBefore(wrap, chip);
    wrap.appendChild(trigger);
    wrap.appendChild(panel);
    trigger.appendChild(chip);
    trigger.appendChild(caret);
    chip.classList.add("is-inline");

    var menuItems = function () {
      return Array.prototype.slice.call(panel.querySelectorAll('[role="menuitem"]'));
    };
    var indexOf = function (item) { return menuItems().indexOf(item); };
    var activeIndex = 0;

    function open() {
      activeIndex = 0;
      trigger.setAttribute("aria-expanded", "true");
      panel.hidden = false;
      const setItem = setActive.bind(null);
      setItem(0);
    }
    function setActive(i) {
      const list = menuItems();
      list.forEach(function (el2, idx) { el2.classList.toggle("is-active", idx === i); });
      activeIndex = i;
    }
    function close() {
      trigger.setAttribute("aria-expanded", "false");
      panel.hidden = true;
      menuItems().forEach(function (el2) { el2.classList.remove("is-active"); });
    }

    trigger.addEventListener("click", function () {
      if (panel.hidden) { open(); } else { close(); }
    });

    trigger.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        if (panel.hidden) {
          e.preventDefault();
          open();
        }
      }
      if (!panel.hidden && e.key === "ArrowDown") {
        e.preventDefault();
        const list = menuItems();
        activeIndex = (activeIndex + 1) % list.length;
        setActive(activeIndex);
        list[activeIndex].focus();
      }
      if (!panel.hidden && e.key === "ArrowUp") {
        e.preventDefault();
        const list = menuItems();
        activeIndex = (activeIndex - 1 + list.length) % list.length;
        setActive(activeIndex);
        list[activeIndex].focus();
      }
      if (!panel.hidden && e.key === "Tab") {
        e.preventDefault();
        close();
        trigger.focus();
      }
    });

    panel.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        e.preventDefault();
        close();
        trigger.focus();
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const list = menuItems();
        activeIndex = (activeIndex + 1) % list.length;
        setActive(activeIndex);
        list[activeIndex].focus();
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        const list = menuItems();
        activeIndex = (activeIndex - 1 + list.length) % list.length;
        setActive(activeIndex);
        list[activeIndex].focus();
      }
      if (e.key === "Home") {
        e.preventDefault();
        activeIndex = 0;
        setActive(0);
        menuItems()[0].focus();
      }
      if (e.key === "End") {
        e.preventDefault();
        const list = menuItems();
        activeIndex = list.length - 1;
        setActive(activeIndex);
        list[list.length - 1].focus();
      }
    });

    global.addEventListener("mousedown", function (e) {
      if (panel.hidden) return;
      if (e.target.closest && !e.target.closest(".user-menu-panel") && !e.target.closest("#user-menu-trigger")) close();
    });

    const ro = new MutationObserver(render);
    ro.observe(chip, { characterData: true, childList: true, subtree: true, attributes: true });
    render();
  }

  /* ---------- Phase 3: command palette (⌘K) ---------- */
  const PALETTE_MODULES = [
    { key: "destinations", label: "Destinations", page: "destinations.html", nameOf: function (r) { return r.name; }, subOf: function (r) { return r.city_name || ""; } },
    { key: "hotels", label: "Hotels", page: "hotels.html", nameOf: function (r) { return r.name; }, subOf: function (r) { return (r.destination && r.destination.name) || ""; } },
    { key: "users", label: "Users", page: "users.html", nameOf: function (r) { return r.name || r.email || ""; }, subOf: function (r) { return r.email || ""; } },
    { key: "trips", label: "Trips", page: "trips.html", nameOf: function (r) { return r.name || r.title || ""; }, subOf: function (r) { return ""; } },
    { key: "reviews", label: "Reviews", page: "reviews.html", nameOf: function (r) { return r.title || r.comment || ""; }, subOf: function (r) { return r.user && r.user.name ? r.user.name : ""; } },
    { key: "restaurants", label: "Restaurants", page: "restaurants.html", nameOf: function (r) { return r.name; }, subOf: function (r) { return ""; } },
    { key: "countries", label: "Countries", page: "countries.html", nameOf: function (r) { return r.name; }, subOf: function (r) { return r.code || ""; } },
    { key: "attractions", label: "Attractions", page: "attractions.html", nameOf: function (r) { return r.name; }, subOf: function (r) { return ""; } },
  ];

  function paletteShortcuts() {
    return [
      { label: "Theme: Light", hint: "Appearance", run: function () { applyTheme("light", true); } },
      { label: "Theme: Dark", hint: "Appearance", run: function () { applyTheme("dark", true); } },
      { label: "Theme: System", hint: "Appearance", run: function () { applyTheme("system", true); } },
      { label: "Collapse sidebar", hint: "Shortcut", run: function () {
          const btn = el("sidebar-collapse");
          if (btn) btn.click();
        } },
      { label: "Sign out", hint: "Shortcut", run: function () {
          if (global.Itinari && global.Itinari.session && global.Itinari.session.logout) global.Itinari.session.logout();
        } },
    ];
  }

  function palettePageItems() {
    const out = [];
    document.querySelectorAll(".nav-item").forEach(function (a) {
      const href = (a.getAttribute("href") || "").split("?")[0].split("#")[0];
      if (!href) return;
      const label = a.textContent.replace(/\s+/g, " ").trim() || href;
      out.push({ label: label, hint: "Page", url: href, run: function () { global.location.href = a.getAttribute("href"); } });
    });
    return out;
  }

  function initCmdPalette() {
    const bar = document.querySelector(".topbar-right");
    if (!bar) return;

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "icon-btn palette-trigger";
    trigger.id = "palette-trigger";
    trigger.setAttribute("aria-label", "Open command palette (Ctrl K)");
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3Z"/></svg>';
    bar.appendChild(trigger);

    const overlay = document.createElement("div");
    overlay.className = "palette-backdrop";
    overlay.hidden = true;

    const panel = document.createElement("div");
    panel.className = "palette";
    panel.id = "palette-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.hidden = true;
    panel.setAttribute("aria-labelledby", "palette-title");

    const title = document.createElement("h2");
    title.id = "palette-title";
    title.className = "palette-title";
    title.textContent = "Command palette";

    const input = document.createElement("input");
    input.type = "search";
    input.id = "palette-input";
    input.className = "palette-input";
    input.placeholder = "Type to search pages, records, actions…";
    input.setAttribute("aria-label", "Search pages, records, actions");
    input.autocomplete = "off";

    const results = document.createElement("div");
    results.className = "palette-results";
    results.id = "palette-results";
    results.setAttribute("role", "listbox");

    const empty = document.createElement("p");
    empty.className = "palette-empty";
    empty.textContent = "No matches.";

    const foot = document.createElement("div");
    foot.className = "palette-foot";
    foot.innerHTML = '<span>↑↓ navigate</span><span>↵ select</span><span>esc close</span>';

    panel.appendChild(title);
    panel.appendChild(input);
    panel.appendChild(results);
    panel.appendChild(empty);
    panel.appendChild(foot);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    var items = [];
    var activeIndex = 0;
    var moduleCache = null;

    function allItems(query) {
      const q = String(query || "").trim().toLowerCase();
      const out = [];
      function pushGroup(group) {
        group.forEach(function (it) {
          const hay = (it.label + " " + (it.hint || "")).toLowerCase();
          if (!q || hay.indexOf(q) !== -1) out.push(it);
        });
      }
      pushGroup(palettePageItems());
      pushGroup(paletteShortcuts());
      if (moduleCache) {
        moduleCache.forEach(function (group) {
          group.forEach(function (it) { pushGroup([it]); });
        });
      }
      return out;
    }

    function render(query) {
      items = allItems(query);
      results.textContent = "";
      if (!items.length) {
        empty.hidden = false;
        results.hidden = true;
        activeIndex = 0;
        return;
      }
      empty.hidden = true;
      results.hidden = false;
      items.forEach(function (it, i) {
        const row = document.createElement("button");
        row.type = "button";
        row.className = "palette-item" + (i === activeIndex ? " is-active" : "");
        row.setAttribute("role", "option");
        row.setAttribute("aria-selected", String(i === activeIndex));
        row.id = "palette-item-" + i;
        const l = document.createElement("span");
        l.className = "palette-item-label";
        l.textContent = it.label;
        const h = document.createElement("span");
        h.className = "palette-item-hint";
        h.textContent = it.hint || "";
        row.appendChild(l);
        row.appendChild(h);
        row.addEventListener("click", function () { activate(it); });
        row.addEventListener("mousemove", function () { setActive(i); });
        results.appendChild(row);
      });
    }

    function setActive(i) {
      activeIndex = i;
      const rows = results.querySelectorAll(".palette-item");
      rows.forEach(function (r, idx) {
        r.classList.toggle("is-active", idx === i);
        r.setAttribute("aria-selected", String(idx === i));
      });
    }

    function activate(it) {
      if (!it) return;
      closePalette();
      if (it.run) it.run();
    }

    function openPalette() {
      overlay.hidden = false;
        panel.hidden = false;
      loadModules();
      activeIndex = 0;
      render(input.value);
      input.focus();
      input.select();
      syncScrollLock();
    }

    function closePalette() {
      if (overlay.hidden) return;
      overlay.hidden = true;
        panel.hidden = true;
      items = [];
      syncScrollLock();
      trigger.focus();
    }

    function loadModules() {
      if (moduleCache) return;
      if (!global.Itinari || !global.Itinari.apiGet || !global.Itinari.session || !global.Itinari.session.hasToken()) {
        moduleCache = [];
        return;
      }
      moduleCache = [];
      PALETTE_MODULES.forEach(function (mod) {
        global.Itinari.apiGet("/v1/admin/" + mod.key, { auth: true }).then(function (res) {
          let list = [];
          if (res && res.ok && res.body) {
            if (Array.isArray(res.body)) list = res.body;
            else if (res.body.data && Array.isArray(res.body.data)) list = res.body.data;
            else if (res.body.data && res.body.data.data && Array.isArray(res.body.data.data)) list = res.body.data.data;
          }
          const group = list.filter(function (r) { return r && mod.nameOf(r); }).slice(0, 12).map(function (r) {
            return {
              label: mod.nameOf(r),
              hint: mod.label + (mod.subOf(r) ? " · " + mod.subOf(r) : ""),
              url: mod.page,
              run: function () { global.location.href = mod.page; },
            };
          });
          moduleCache.push(group);
          if (!overlay.hidden) render(input.value);
        }).catch(function () { /* offline — skip group */ });
      });
    }

    trigger.addEventListener("click", openPalette);

    input.addEventListener("input", function () { activeIndex = 0; render(input.value); });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); closePalette(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); if (!items.length) return; setActive((activeIndex + 1) % items.length); }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (!items.length) return; setActive((activeIndex - 1 + items.length) % items.length); }
      else if (e.key === "Enter") { e.preventDefault(); if (items.length) activate(items[activeIndex]); }
      else if (e.key === "Tab") { e.preventDefault(); closePalette(); }
    });

    overlay.addEventListener("mousedown", function (e) {
      if (e.target === overlay) closePalette();
    });

    global.document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (overlay.hidden) { openPalette(); } else { closePalette(); }
        return;
      }
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        const target = e.target;
        const inSearch = target && target.id === "global-search";
        if (inSearch) {
          e.preventDefault();
          openPalette();
        }
        return;
      }
    });
  }

  /* ---------- Phase 4: breadcrumb + action slot ---------- */
  function initBreadcrumb() {
    const head = document.querySelector(".content-head .right");
    if (!head) return;

    const nav = document.createElement("nav");
    nav.setAttribute("aria-label", "Breadcrumb");

    const ol = document.createElement("ol");
    ol.className = "breadcrumb";

    function crumb(label, href) {
      const li = document.createElement("li");
      if (href) {
        const a = document.createElement("a");
        a.href = href;
        a.textContent = label;
        li.appendChild(a);
      } else {
        const span = document.createElement("span");
        span.setAttribute("aria-current", "page");
        span.textContent = label;
        li.appendChild(span);
      }
      return li;
    }

    const h1 = head.querySelector("h1");
    const page = h1 ? h1.textContent.trim() : document.title.replace(/\s*·.*$/, "").trim() || "Admin";

    ol.appendChild(crumb("Home", "index.html"));
    ol.appendChild(crumb(page, null));
    nav.appendChild(ol);
    head.insertBefore(nav, head.firstChild);
  }

  function initActionSlot() {
    const head = document.querySelector(".content-head");
    if (!head) return;

    const toolbars = document.querySelectorAll(".kit-toolbar");
    if (!toolbars.length) return;

    const slot = document.createElement("div");
    slot.className = "content-actions";

    toolbars.forEach(function (tb) {
      const buttons = tb.querySelectorAll("button");
      if (!buttons.length) return;
      Array.prototype.slice.call(buttons).forEach(function (b) { slot.appendChild(b); });
      tb.remove();
    });

    head.appendChild(slot);
  }

  /* ---------- Phase 12: mobile off-canvas drawer ---------- */
  function initDrawer() {
    const shell = document.querySelector(".shell");
    const sidebar = document.querySelector(".sidebar");
    const topbar = document.querySelector(".topbar");
    if (!shell || !sidebar || !topbar) return;

    const burger = document.createElement("button");
    burger.type = "button";
    burger.className = "icon-btn topbar-burger";
    burger.id = "drawer-toggle";
    burger.setAttribute("aria-label", "Open navigation");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-controls", "drawer-sidebar");
    burger.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>';
    sidebar.id = sidebar.id || "drawer-sidebar";
    topbar.insertBefore(burger, topbar.firstChild);

    const backdrop = document.createElement("div");
    backdrop.className = "drawer-backdrop";
    backdrop.setAttribute("aria-hidden", "true");
    backdrop.hidden = true;
    shell.appendChild(backdrop);

    function open() {
      shell.classList.add("is-drawer-open");
      backdrop.hidden = false;
      burger.setAttribute("aria-expanded", "true");
      burger.setAttribute("aria-label", "Close navigation");
    }
    function close() {
      shell.classList.remove("is-drawer-open");
      backdrop.hidden = true;
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Open navigation");
    }
    burger.addEventListener("click", function () {
      if (shell.classList.contains("is-drawer-open")) close(); else open();
    });
    backdrop.addEventListener("click", close);
    global.document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && shell.classList.contains("is-drawer-open")) close();
    });
    sidebar.querySelectorAll("a, button").forEach(function (el) {
      el.addEventListener("click", function () {
        if (shell.classList.contains("is-drawer-open")) close();
      });
    });
    const mq = global.matchMedia && global.matchMedia("(max-width: 1023.98px)");
    if (mq && mq.addEventListener) {
      mq.addEventListener("change", function () { if (!mq.matches) close(); });
    }
  }

  function injectRoleNav(role) {
    const It = global.Itinari;
    if (!It || !It.nav || !It.nav.renderSidebarHtml) return;
    const nav = document.querySelector(".sidebar nav, .sidebar .nav");
    if (!nav) return;
    nav.innerHTML = It.nav.renderSidebarHtml(role);
    nav.querySelectorAll(".nav-item").forEach(function (a) {
      a.addEventListener("click", function () {
        const shell = document.querySelector(".shell");
        if (shell) shell.classList.remove("is-mobile-sidebar-open");
      });
    });
    const path = (global.location.pathname.split("/").pop() || "index.html").split("?")[0].split("#")[0];
    nav.querySelectorAll(".nav-item").forEach(function (a) {
      const href = (a.getAttribute("href") || "").split("?")[0].split("#")[0].split("/").pop();
      a.classList.toggle("is-active", href === path);
    });
  }

  function initGlobalUser() {
    const It = global.Itinari;
    if (!It || !It.session) return;
    
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
      const role = It.session.roleOf(user);
      injectRoleNav(role);
      const isAgencyPage = document.body.getAttribute("data-page") === "agency";
      if (isAgencyPage) {
        if (role !== "agency") {
          It.session.clearSession();
          It.session.redirectToLogin();
          return;
        }
      } else {
        if (!It.session.isAdminRole(role)) {
          It.session.clearSession();
          It.session.redirectToLogin();
          return;
        }
      }

      const chip = document.getElementById("user-chip");
      if (chip) {
        const nameEl = document.getElementById("chip-name");
        const roleEl = document.getElementById("chip-role");
        if (nameEl) nameEl.textContent = user.name || "";
        if (roleEl) {
          const rawRole = It.session.roleOf(user) || "admin";
          roleEl.textContent = rawRole.replace(/_/g, ' ');
        }
        chip.hidden = false;
        
        // Trigger manual update of the user menu avatar since the observer might have fired early
        const avatar = document.querySelector(".user-avatar");
        if (avatar && user.name) {
          const parts = user.name.split(" ");
          const initials = parts.length > 1 ? parts[0].charAt(0) + parts[parts.length - 1].charAt(0) : parts[0].substring(0, 2);
          avatar.textContent = initials.toUpperCase();
        }

        // Link profile if it's the dashboard
        if (!chip.closest("a")) {
            chip.style.cursor = "pointer";
            chip.addEventListener("click", function() {
                window.location.href = "user-details.html?id=current";
            });
        }
      }

      const logoutBtn = el("logout-btn");
      if (logoutBtn) {
          logoutBtn.addEventListener("click", function () { It.session.logout(); });
      }

      document.dispatchEvent(new CustomEvent("itinari:ready", { detail: user }));
      updateNavigationBadges();
    });
  }

  function updateNavigationBadges() {
    if (!global.Itinari || !global.Itinari.apiGet || !global.Itinari.session || !global.Itinari.session.hasToken()) return;
    
    // Contacts badge
    global.Itinari.apiGet("/admin/contacts?status=unread", { auth: true }).then(function (res) {
      const list = global.Itinari.unwrapData(res);
      const count = Array.isArray(list) ? list.length : (res.body?.total || 0);
      const b = document.querySelector('.nav-badge[data-badge="contacts"]');
      if (b && count > 0) { b.textContent = count > 99 ? '99+' : count; b.hidden = false; }
    }).catch(function () {});

    // Agency requests badge
    global.Itinari.apiGet("/admin/agency-requests", { auth: true }).then(function (res) {
      const list = global.Itinari.unwrapData(res);
      const pending = Array.isArray(list) ? list.filter(function(r){ return r.status === "pending" || r.status === "requested"; }).length : (res.body?.total || 0);
      const b = document.querySelector('.nav-badge[data-badge="agency"]');
      if (b && pending > 0) { b.textContent = pending > 99 ? '99+' : pending; b.hidden = false; }
    }).catch(function () {});

    // Flags badge
    global.Itinari.apiGet("/admin/flags", { auth: true }).then(function (res) {
      const list = global.Itinari.unwrapData(res);
      const pending = Array.isArray(list) ? list.filter(function(r){ return r.status === "pending" || r.status === "open"; }).length : (res.body?.total || 0);
      const b = document.querySelector('.nav-badge[data-badge="flags"]');
      if (b && pending > 0) { b.textContent = pending > 99 ? '99+' : pending; b.hidden = false; }
    }).catch(function () {});
  }

  function toast(message, type, duration) {
    type = type || "info";
    duration = duration || 3500;
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      container.setAttribute("role", "status");
      container.setAttribute("aria-live", "polite");
      document.body.appendChild(container);
    }
    const t = document.createElement("div");
    t.className = "toast toast-" + type;
    const iconSvg = type === "success" 
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
      : type === "error"
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    
    t.innerHTML = '<span class="toast-icon">' + iconSvg + '</span><span class="toast-message">' + (message || "") + '</span>';
    container.appendChild(t);
    
    setTimeout(function () { t.classList.add("is-visible"); }, 10);

    setTimeout(function () {
      t.classList.remove("is-visible");
      setTimeout(function () { t.remove(); }, 300);
    }, duration);
  }

  global.Itinari.toast = toast;

  function init() {
    initTheme();
    initSidebar();
    initDrawer();
    initActiveNav();
    initSearch();
    initModalHandling();
    initUserMenu();
    initCmdPalette();
    initBreadcrumb();
    initActionSlot();
    initGlobalUser();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
