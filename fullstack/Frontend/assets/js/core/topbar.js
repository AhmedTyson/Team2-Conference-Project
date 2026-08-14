/**
 * core/topbar.js — Unified global topbar-right & theme toggle renderer.
 * @date    2026-08-14
 * @purpose Renders and wires the universal topbar-right controls across ALL pages:
 *          - Public pages: theme toggle + user state / sign in
 *          - Auth pages: theme toggle
 *          - Customer App / Admin / Agency: notifications + theme toggle + user chip & dropdown
 */
(function (global) {
  "use strict";

  var doc = global.document;

  /* ── SVG Icons ── */
  var ICONS = {
    sun: '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.9" y1="4.9" x2="6.3" y2="6.3"/><line x1="17.7" y1="17.7" x2="19.1" y2="19.1"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.9" y1="19.1" x2="6.3" y2="17.7"/><line x1="17.7" y1="6.3" x2="19.1" y2="4.9"/></svg>',
    moon: '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    chevDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>'
  };

  function el(id) { return doc.getElementById(id); }

  function getLayout() {
    if (doc.body && doc.body.getAttribute("data-layout")) {
      return doc.body.getAttribute("data-layout");
    }
    var page = doc.body ? doc.body.getAttribute("data-page") : "";
    if (page === "admin") return "admin";
    if (page === "agency") return "agency";
    if (page === "login" || page === "register" || page === "forgot" || page === "reset") return "auth";
    return "app";
  }

  function initialsOf(name) {
    var n = String(name || "").trim();
    if (!n) return "U";
    var parts = n.split(/\s+/);
    return ((parts[0] && parts[0][0]) || "") +
      (parts.length > 1 && parts[parts.length - 1] ? parts[parts.length - 1][0] : "");
  }

  function roleLabel(role) {
    var map = { super_admin: "Admin", admin: "Admin", agency: "Agency", customer: "Customer", user: "Customer", traveler: "Traveler" };
    return map[role] || role || "User";
  }

  /* ── Ensure Command Palette Script ── */
  function ensureCmdPalette() {
    if (!global.ItinariCmd && !doc.querySelector('script[src*="command-palette.js"]')) {
      var s = doc.createElement("script");
      var path = global.location.pathname;
      var prefix = (path.indexOf("/admin/") !== -1 || path.indexOf("/agency/") !== -1 || path.indexOf("/app/") !== -1 || path.indexOf("/auth/") !== -1 || path.indexOf("/errors/") !== -1) ? "../" : "";
      s.src = prefix + "assets/js/core/command-palette.js";
      s.async = true;
      doc.head.appendChild(s);
    }
  }

  /* ── Build Command Palette Trigger ── */
  function buildCmdTrigger() {
    var existing = el("cmd-trigger-btn");
    if (existing) return existing;

    var btn = doc.createElement("button");
    btn.type = "button";
    btn.id = "cmd-trigger-btn";
    btn.className = "cmd-trigger-btn";
    btn.setAttribute("aria-label", "Search and commands");
    btn.innerHTML = '<svg style="width:14px;height:14px;opacity:0.8;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><span style="margin-left:0.15rem;font-size:0.75rem;">Search</span><kbd class="cmd-trigger-kbd">Ctrl K</kbd>';

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      if (global.ItinariCmd) global.ItinariCmd.open();
    });

    return btn;
  }

  /* ── Build / Wire Theme Toggle ── */
  function buildThemeToggle() {
    var btn = el("theme-toggle");
    if (!btn) {
      btn = doc.createElement("button");
      btn.type = "button";
      btn.id = "theme-toggle";
      btn.className = "icon-btn theme-toggle";
    }
    var dark = doc.documentElement.classList.contains("dark");
    btn.setAttribute("aria-pressed", String(dark));
    btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    btn.innerHTML = ICONS.sun + ICONS.moon;
    
    // Avoid multiple event listeners
    btn.onclick = function (e) {
      e.preventDefault();
      if (global.ItTheme) {
        global.ItTheme.toggle();
      }
    };
    return btn;
  }

  /* ── Build Notifications Bell ── */
  function buildBell(layout) {
    var existingWrap = doc.querySelector(".notif-wrap");
    if (existingWrap) return existingWrap;

    var wrap = doc.createElement("div");
    wrap.className = "notif-wrap";

    var btn = doc.createElement("button");
    btn.type = "button";
    btn.id = "notif-btn";
    btn.className = "icon-btn";
    btn.setAttribute("aria-label", "Notifications");
    btn.innerHTML = ICONS.bell;

    var badge = doc.createElement("span");
    badge.id = "notif-badge";
    badge.className = "notif-badge";
    badge.hidden = true;

    wrap.appendChild(btn);
    wrap.appendChild(badge);

    var It = global.Itinari;
    if (It && It.Api) {
      It.Api.get("/notifications?per_page=1&unread=1").then(function (res) {
        var count = (res && res.meta && res.meta.total) || (res && res.unread_count) || 0;
        if (count > 0) {
          badge.textContent = count > 99 ? "99+" : String(count);
          badge.hidden = false;
        }
      }).catch(function () { /* ignore error */ });
    }

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      if (layout === "admin") window.location.href = "notifications.html";
      else if (layout === "agency") window.location.href = "../agency/index.html";
      else window.location.href = "../app/notifications.html";
    });

    return wrap;
  }

  /* ── Build User Chip & Menu ── */
  function buildUserMenu(layout) {
    var existingMenu = el("user-menu");
    if (existingMenu) return existingMenu;

    var It = global.Itinari;
    var user = (It && It.session && It.session.user) || null;
    if (!user) {
      try {
        var raw = global.localStorage.getItem("itinari_user");
        if (raw) user = JSON.parse(raw);
      } catch (e) {}
    }
    if (!user) return null;

    var name = user.name || user.email || "User";
    var role = user.role || (user.roles && user.roles[0]) || layout;
    var initials = initialsOf(name);
    var avatar = user.profile_image
      ? (It && It.CONFIG && It.CONFIG.apiBase
          ? It.CONFIG.apiBase.replace("/api", "") + "/storage/" + user.profile_image
          : "/storage/" + user.profile_image)
      : null;

    var wrap = doc.createElement("div");
    wrap.className = "user-menu";
    wrap.id = "user-menu";

    var trigger = doc.createElement("button");
    trigger.type = "button";
    trigger.className = "user-menu-trigger";
    trigger.id = "user-menu-trigger";
    trigger.setAttribute("aria-haspopup", "menu");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-label", "User account menu");

    var chip = doc.createElement("span");
    chip.id = "user-chip";
    chip.className = "chip";

    var avatarEl = doc.createElement("span");
    avatarEl.className = "chip-avatar";
    if (avatar) {
      var img = doc.createElement("img");
      img.src = avatar;
      img.alt = name;
      img.style.cssText = "width:100%;height:100%;object-fit:cover;border-radius:50%;";
      img.onerror = function () { avatarEl.textContent = initials; img.remove(); };
      avatarEl.appendChild(img);
    } else {
      avatarEl.textContent = initials;
    }

    var nameEl = doc.createElement("span");
    nameEl.id = "chip-name";
    nameEl.className = "chip-name";
    nameEl.textContent = name.split(" ")[0];

    var roleEl = doc.createElement("span");
    roleEl.id = "chip-role";
    roleEl.className = "chip-role";
    roleEl.textContent = roleLabel(role);

    chip.appendChild(avatarEl);
    chip.appendChild(nameEl);
    chip.appendChild(roleEl);
    chip.appendChild(doc.createRange().createContextualFragment(ICONS.chevDown));

    trigger.appendChild(chip);

    var panel = doc.createElement("div");
    panel.className = "user-menu-panel";
    panel.id = "user-menu-panel";
    panel.setAttribute("role", "menu");
    panel.setAttribute("aria-labelledby", "user-menu-trigger");
    panel.hidden = true;

    var menuItems = [];
    if (layout === "admin") {
      menuItems = [
        { label: "My Profile", icon: ICONS.user, href: "user-details.html?id=current" },
        { label: "Settings", icon: ICONS.settings, href: "settings.html" }
      ];
    } else if (layout === "agency") {
      menuItems = [
        { label: "Agency Portal", icon: ICONS.user, href: "../agency/index.html" },
        { label: "Create Trip", icon: ICONS.settings, href: "../agency/create-trip.html" }
      ];
    } else {
      menuItems = [
        { label: "My Profile", icon: ICONS.user, href: "../app/profile.html" },
        { label: "Settings", icon: ICONS.settings, href: "../app/profile-settings.html" }
      ];
    }

    menuItems.forEach(function (item) {
      var a = doc.createElement("a");
      a.href = item.href;
      a.className = "user-menu-item";
      a.setAttribute("role", "menuitem");
      a.innerHTML = item.icon + "<span>" + item.label + "</span>";
      panel.appendChild(a);
    });

    var divider = doc.createElement("div");
    divider.className = "user-menu-divider";
    panel.appendChild(divider);

    var logout = doc.createElement("button");
    logout.type = "button";
    logout.className = "user-menu-item is-danger";
    logout.id = "user-menu-signout";
    logout.setAttribute("role", "menuitem");
    logout.innerHTML = ICONS.logout + "<span>Sign out</span>";
    logout.addEventListener("click", function (e) {
      e.preventDefault();
      if (global.Itinari && global.Itinari.session && global.Itinari.session.logout) {
        global.Itinari.session.logout();
      } else {
        try {
          global.localStorage.removeItem("itinari_token");
          global.localStorage.removeItem("itinari_user");
        } catch (e) {}
        window.location.href = "/auth/login.html";
      }
    });
    panel.appendChild(logout);

    wrap.appendChild(trigger);
    wrap.appendChild(panel);

    function toggleMenu(open) {
      panel.hidden = !open;
      trigger.setAttribute("aria-expanded", String(open));
    }

    trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleMenu(panel.hidden);
    });

    doc.addEventListener("click", function (e) {
      if (!wrap.contains(e.target)) toggleMenu(false);
    });

    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape") toggleMenu(false);
    });

    return wrap;
  }

  /* ── Main Render Function ── */
  function render() {
    var layout = getLayout();
    ensureCmdPalette();

    /* 1. Public Pages Integration */
    if (layout === "public") {
      var navAuth = el("navAuthContainer") || doc.querySelector(".nav-pill");
      if (navAuth) {
        var cmdBtn = buildCmdTrigger();
        if (!navAuth.contains(cmdBtn)) {
          navAuth.insertBefore(cmdBtn, navAuth.firstChild);
        }
        var toggle = buildThemeToggle();
        if (!navAuth.contains(toggle)) {
          navAuth.insertBefore(toggle, navAuth.firstChild);
        }
      }
      return;
    }

    /* 2. App / Admin / Agency / Auth Integration */
    var bar = doc.querySelector(".topbar-right") || el("app-user") || doc.querySelector(".top-bar .flex");
    if (!bar) {
      var topbar = doc.querySelector(".topbar, .app__header, .top-bar, .auth-shell");
      if (topbar) {
        bar = doc.createElement("div");
        bar.className = "topbar-right";
        topbar.appendChild(bar);
      }
    }

    if (!bar) return;

    /* Inject Command Trigger (App / Admin / Agency) */
    if (layout === "app" || layout === "admin" || layout === "agency") {
      if (!doc.querySelector(".cmd-trigger-btn")) {
        var cmdBtn = buildCmdTrigger();
        if (cmdBtn) bar.appendChild(cmdBtn);
      }
    }

    /* Inject Notifications (App / Admin / Agency) */
    if (layout === "app" || layout === "admin" || layout === "agency") {
      if (!doc.querySelector(".notif-wrap")) {
        var bell = buildBell(layout);
        if (bell) bar.appendChild(bell);
      }
    }

    /* Inject / Wire Theme Toggle */
    var toggleBtn = buildThemeToggle();
    if (!bar.contains(toggleBtn)) {
      bar.appendChild(toggleBtn);
    }

    /* Inject User Menu (App / Admin / Agency) */
    if (layout === "app" || layout === "admin" || layout === "agency") {
      if (!el("user-menu")) {
        var userMenu = buildUserMenu(layout);
        if (userMenu) bar.appendChild(userMenu);
      }
    }

    /* Sync Theme Toggle State */
    if (global.ItTheme) {
      var isDark = global.ItTheme.current() === "dark";
      var btn = el("theme-toggle");
      if (btn) {
        btn.setAttribute("aria-pressed", String(isDark));
        btn.classList.toggle("is-dark", isDark);
      }
    }
  }

  /* Execute immediately & on ready */
  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }

  doc.addEventListener("itinera:ready", render);
  global.addEventListener("load", render);

  global.ItTopbar = { render: render };

}(window));
