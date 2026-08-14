/**
 * core/topbar.js — Unified global topbar & theme controls engine.
 * @date    2026-08-14
 * @purpose Universal topbar controls across ALL pages (Public, Customer App, Admin, Agency, Auth):
 *          - Before Login: Command Palette + Theme Toggle + Sign In / Register CTA
 *          - After Login:  Command Palette + Notifications Bell (with badge) + Theme Toggle + User Avatar Chip & Dropdown Menu
 */
(function (global) {
  "use strict";

  var doc = global.document;

  /* ── SVG Icons ── */
  var ICONS = {
    sun: '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" style="width:16px;height:16px;"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.9" y1="4.9" x2="6.3" y2="6.3"/><line x1="17.7" y1="17.7" x2="19.1" y2="19.1"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.9" y1="19.1" x2="6.3" y2="17.7"/><line x1="17.7" y1="6.3" x2="19.1" y2="4.9"/></svg>',
    moon: '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:16px;height:16px;"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:16px;height:16px;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    chevDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:12px;height:12px;margin-left:4px;opacity:0.7;"><polyline points="6 9 12 15 18 9"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:15px;height:15px;margin-right:8px;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:15px;height:15px;margin-right:8px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    compass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:15px;height:15px;margin-right:8px;"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
    trips: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:15px;height:15px;margin-right:8px;"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:15px;height:15px;margin-right:8px;"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>'
  };

  function el(id) { return doc.getElementById(id); }

  function getBasePrefix() {
    var p = (global.location.pathname || "").toLowerCase();
    if (p.indexOf("/admin/") !== -1 || p.indexOf("/agency/") !== -1 || p.indexOf("/app/") !== -1 || p.indexOf("/auth/") !== -1 || p.indexOf("/public/") !== -1 || p.indexOf("/errors/") !== -1) {
      return "../";
    }
    return "";
  }

  function getLayout() {
    if (doc.body && doc.body.getAttribute("data-layout")) {
      return doc.body.getAttribute("data-layout");
    }
    var page = doc.body ? doc.body.getAttribute("data-page") : "";
    if (page === "admin") return "admin";
    if (page === "agency") return "agency";
    if (page === "login" || page === "register" || page === "forgot" || page === "reset" || page === "verify" || page === "email-notice") return "auth";
    return "app";
  }

  function getCurrentUser() {
    var It = global.Itinari;
    var user = (It && It.session && It.session.user) || null;
    if (!user) {
      try {
        var raw = global.localStorage.getItem("itinari_user");
        if (raw) user = JSON.parse(raw);
      } catch (e) {}
    }
    var token = null;
    try {
      token = global.localStorage.getItem("itinari_token");
    } catch (e) {}
    return (token && user) ? user : null;
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

  /* ── Ensure Command Palette Script Loaded ── */
  function ensureCmdPalette() {
    if (!global.ItinariCmd && !doc.querySelector('script[src*="command-palette.js"]')) {
      var s = doc.createElement("script");
      var prefix = getBasePrefix();
      s.src = prefix + "assets/js/core/command-palette.js";
      s.async = true;
      if (doc.head) doc.head.appendChild(s);
      else if (doc.body) doc.body.appendChild(s);
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
    btn.innerHTML = '<svg style="width:14px;height:14px;opacity:0.8;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><span style="margin-left:0.15rem;font-size:0.75rem;font-weight:500;">Search</span><kbd class="cmd-trigger-kbd">Ctrl K</kbd>';

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      if (global.ItinariCmd) {
        global.ItinariCmd.open();
      }
    });

    return btn;
  }

  /* ── Build Theme Toggle ── */
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
    
    btn.onclick = function (e) {
      e.preventDefault();
      if (global.ItTheme) {
        global.ItTheme.toggle();
      } else {
        var isDark = doc.documentElement.classList.toggle("dark");
        try { localStorage.setItem("itinari_theme", isDark ? "dark" : "light"); } catch (e) {}
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

    var prefix = getBasePrefix();
    var It = global.Itinari;
    if (It && It.apiGet) {
      It.apiGet("/notifications?per_page=1&unread=1", { auth: true }).then(function (res) {
        var count = (res && res.body && res.body.data && res.body.data.unread_count) || (res && res.body && res.body.meta && res.body.meta.total) || 0;
        if (count > 0) {
          badge.textContent = count > 99 ? "99+" : String(count);
          badge.hidden = false;
        }
      }).catch(function () {});
    }

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      if (layout === "admin") window.location.href = prefix + "admin/notifications.html";
      else if (layout === "agency") window.location.href = prefix + "agency/index.html";
      else window.location.href = prefix + "app/notifications.html";
    });

    return wrap;
  }

  /* ── Build User Chip & Interactive Dropdown Menu ── */
  function buildUserMenu(layout, user) {
    var existingMenu = el("user-menu");
    if (existingMenu) return existingMenu;

    var prefix = getBasePrefix();
    var name = (user && (user.name || user.email)) || "Traveler";
    var role = (user && (user.role || (user.roles && user.roles[0]))) || layout;
    var initials = initialsOf(name);
    var avatar = (user && user.profile_image)
      ? (global.Itinari && global.Itinari.CONFIG && global.Itinari.CONFIG.apiBase
          ? global.Itinari.CONFIG.apiBase.replace("/api", "") + "/storage/" + user.profile_image
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

    // Header info in dropdown
    var headInfo = doc.createElement("div");
    headInfo.style.cssText = "padding:0.75rem 1rem 0.6rem;border-bottom:1px solid hsl(var(--border));margin-bottom:0.35rem;";
    headInfo.innerHTML = '<p style="margin:0;font-weight:700;font-size:0.88rem;color:hsl(var(--foreground));">' + name + '</p>' +
      '<p style="margin:0;font-size:0.75rem;color:hsl(var(--muted-foreground));">' + (user && user.email ? user.email : '') + '</p>';
    panel.appendChild(headInfo);

    var menuItems = [];
    if (role === "admin" || role === "super_admin") {
      menuItems = [
        { label: "Admin Control", icon: ICONS.compass, href: prefix + "admin/index.html" },
        { label: "Passengers", icon: ICONS.user, href: prefix + "admin/users.html" },
        { label: "My Profile", icon: ICONS.user, href: prefix + "admin/user-details.html?id=current" },
        { label: "Settings", icon: ICONS.settings, href: prefix + "admin/settings.html" }
      ];
    } else if (role === "agency") {
      menuItems = [
        { label: "Agency Desk", icon: ICONS.compass, href: prefix + "agency/index.html" },
        { label: "Assignments", icon: ICONS.trips, href: prefix + "agency/assignments.html" },
        { label: "Create Trip", icon: ICONS.trips, href: prefix + "agency/create-trip.html" }
      ];
    } else {
      menuItems = [
        { label: "Dashboard", icon: ICONS.compass, href: prefix + "app/dashboard.html" },
        { label: "My Trips", icon: ICONS.trips, href: prefix + "app/trips.html" },
        { label: "Bookings", icon: ICONS.trips, href: prefix + "app/bookings.html" },
        { label: "Saved Places", icon: ICONS.compass, href: prefix + "app/favourites.html" },
        { label: "My Profile", icon: ICONS.user, href: prefix + "app/profile.html" },
        { label: "Settings", icon: ICONS.settings, href: prefix + "app/profile-settings.html" }
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
        window.location.href = prefix + "auth/login.html";
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

  /* ── Build Guest Sign In / Sign Up CTA ── */
  function buildGuestAuth(containerType) {
    var prefix = getBasePrefix();
    var wrap = doc.createElement("div");
    wrap.className = "guest-auth-wrap";
    wrap.style.cssText = "display:inline-flex;align-items:center;gap:0.5rem;";

    if (containerType === "pill") {
      wrap.innerHTML = '<a href="' + prefix + 'auth/login.html" class="guest-actions">' +
        '<span>Sign in</span>' +
        '<i class="fas fa-arrow-right" style="font-size:0.75rem;margin-left:4px;"></i>' +
      '</a>';
    } else {
      wrap.innerHTML = '<a href="' + prefix + 'auth/login.html" class="btn btn--ghost btn--login-nav" style="padding:0.4rem 0.85rem;font-size:0.85rem;">Log in</a>' +
        '<a href="' + prefix + 'auth/register.html" class="btn btn--primary btn--signup-nav" style="padding:0.4rem 0.95rem;font-size:0.85rem;border-radius:9999px;">Sign up</a>';
    }

    return wrap;
  }

  /* ── Main Render Function ── */
  function render() {
    var layout = getLayout();
    ensureCmdPalette();
    var user = getCurrentUser();
    var prefix = getBasePrefix();

    /* Find target container */
    var bar = doc.querySelector(".topbar-right") || el("app-user") || el("navAuthContainer") || doc.querySelector(".top-bar .flex");

    if (!bar) {
      var topbar = doc.querySelector(".topbar, .app__header, .top-bar, .nav-pill, .auth-shell");
      if (topbar) {
        bar = doc.createElement("div");
        bar.className = "topbar-right";
        topbar.appendChild(bar);
      }
    }

    if (!bar) return;

    // Clear old dynamic topbar injected nodes to re-render cleanly
    var oldCmd = bar.querySelector("#cmd-trigger-btn");
    var oldBell = bar.querySelector(".notif-wrap");
    var oldToggle = bar.querySelector("#theme-toggle");
    var oldUserMenu = bar.querySelector("#user-menu");
    var oldGuest = bar.querySelector(".guest-auth-wrap") || bar.querySelector(".guest-actions");

    if (oldCmd) oldCmd.remove();
    if (oldBell) oldBell.remove();
    if (oldToggle) oldToggle.remove();
    if (oldUserMenu) oldUserMenu.remove();
    if (oldGuest) oldGuest.remove();

    /* 1. Command Palette Trigger (Universal before and after login) */
    var cmdBtn = buildCmdTrigger();
    if (cmdBtn) bar.appendChild(cmdBtn);

    /* 2. Notifications Bell (When Logged in) */
    if (user) {
      var bell = buildBell(layout);
      if (bell) bar.appendChild(bell);
    }

    /* 3. Theme Toggle (Universal before and after login) */
    var toggleBtn = buildThemeToggle();
    if (toggleBtn) bar.appendChild(toggleBtn);

    /* 4. User Avatar Menu (Logged in) OR Guest Sign In (Before Login) */
    if (user) {
      var userMenu = buildUserMenu(layout, user);
      if (userMenu) bar.appendChild(userMenu);
    } else {
      var isPill = bar.id === "navAuthContainer" || bar.closest(".nav-pill") !== null;
      var guestAuth = buildGuestAuth(isPill ? "pill" : "standard");
      if (guestAuth) bar.appendChild(guestAuth);
    }

    /* 5. Sync Theme State */
    if (global.ItTheme) {
      var isDark = global.ItTheme.current() === "dark";
      var btn = el("theme-toggle");
      if (btn) {
        btn.setAttribute("aria-pressed", String(isDark));
        btn.classList.toggle("is-dark", isDark);
      }
    }
  }

  /* Execute on DOM ready and custom events */
  if (doc.readyState === "loading") {
    if (doc.addEventListener) doc.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }

  if (doc.addEventListener) doc.addEventListener("itinera:ready", render);
  if (global.addEventListener) global.addEventListener("load", render);

  global.ItTopbar = { render: render, getUser: getCurrentUser };

}(window));
