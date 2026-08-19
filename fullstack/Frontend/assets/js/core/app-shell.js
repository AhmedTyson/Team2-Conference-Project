/**
 * app-shell.js — customer-app shared chrome (converted from React front/).
 * Auth boot, top nav, user chip, theme toggle, toasts, helpers.
 * Depends on config.js + api.js + session.js. Included by every *.html
 * page that lives under the authenticated customer app.
 */
(function (global) {
  "use strict";

  var It = global.Itinera;
  if (!It || !It.session) return;

  var THEME_KEY = "itinera_theme";

  function topItems(role) {
    return (It.nav && It.nav.topFor ? It.nav.topFor(role) : null) || [
      { to: "/home.html", label: "Home" },
      { to: "/explore.html", label: "Explore" },
      { to: "/contact.html", label: "Contact" },
    ];
  }

  function el(id) { return document.getElementById(id); }

  function systemDark() {
    return !!(global.matchMedia && global.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  function currentMode() {
    try { return global.localStorage.getItem(THEME_KEY) || "system"; } catch (e) { return "system"; }
  }

  function applyTheme(mode, persist) {
    var dark = mode === "dark" || (mode === "system" && systemDark());
    document.documentElement.classList.toggle("dark", dark);
    if (dark) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    if (persist) {
      try { global.localStorage.setItem(THEME_KEY, mode); } catch (e) { /* private mode */ }
    }
  }

  function initTheme() {
    applyTheme(currentMode(), false);
    var mql = global.matchMedia && global.matchMedia("(prefers-color-scheme: dark)");
    if (mql && mql.addEventListener) {
      mql.addEventListener("change", function () { applyTheme(currentMode(), false); });
    }
    var btn = el("theme-toggle");
    if (btn) btn.addEventListener("click", function () {
      applyTheme(document.documentElement.classList.contains("dark") ? "light" : "dark", true);
    });
  }

  function initialsOf(name) {
    var n = String(name || "").trim();
    if (!n) return "U";
    var parts = n.split(/\s+/);
    return ((parts[0] && parts[0][0]) || "") +
      (parts.length > 1 && parts[parts.length - 1] ? parts[parts.length - 1][0] : "");
  }

  function avatarUrl(user) {
    if (user && user.profile_image) return It.CONFIG.apiBase.replace("/api", "") + "/storage/" + user.profile_image;
    return null;
  }

  function initHeader(user) {
    if (el("global-navbar")) return;
    var p = (global.location.pathname.indexOf("/app/") !== -1 || global.location.pathname.indexOf("/admin/") !== -1 || global.location.pathname.indexOf("/agency/") !== -1 || global.location.pathname.indexOf("/auth/") !== -1 || global.location.pathname.indexOf("/public/") !== -1) ? "../" : "";
    
    var brand = el("app-brand");
    if (brand) {
      brand.href = p + "public/index.html";
      brand.innerHTML = 
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="brand-logo" aria-hidden="true" style="margin-right: 8px; flex-shrink: 0;">' +
          '<path d="M12 2C12 2 13 8 18 12C13 16 12 22 12 22C12 22 11 16 6 12C11 8 12 2 12 2Z" fill="currentColor"/>' +
        '</svg>' +
        '<span class="brand-name" style="font-size: 18px; font-weight: 700; tracking-wide;">Itinera</span>';
    }

    var nav = el("app-nav");
    if (nav) {
      nav.innerHTML = "";
      var role = user ? It.session.roleOf(user) : "customer";
      var items = topItems(role);
      var cur = (global.location.pathname.split("/").pop() || "dashboard.html").split("?")[0];

      items.forEach(function (item) {
        if (item.cta) return;

        if (item.dropdown && item.dropdown.length) {
          var dropWrap = document.createElement("div");
          dropWrap.className = "nav-dropdown";

          var triggerBtn = document.createElement("button");
          triggerBtn.type = "button";
          triggerBtn.className = "nav-dropdown-trigger";
          triggerBtn.innerHTML = '<span>' + item.label + '</span>' +
            '<svg class="nav-dropdown-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

          var menu = document.createElement("div");
          menu.className = "nav-dropdown-menu";

          var hasActive = false;
          item.dropdown.forEach(function (sub) {
            var a = document.createElement("a");
            var dest = sub.to.startsWith("/") ? p + sub.to.slice(1) : sub.to;
            a.href = dest;
            var isAct = (cur !== "" && dest.indexOf(cur) !== -1);
            if (isAct) hasActive = true;
            a.className = "nav-dropdown-item" + (isAct ? " active" : "");
            a.textContent = sub.label;
            menu.appendChild(a);
          });

          if (hasActive) triggerBtn.classList.add("active");

          dropWrap.appendChild(triggerBtn);
          dropWrap.appendChild(menu);
          nav.appendChild(dropWrap);
        } else if (item.to) {
          var a = document.createElement("a");
          var dest = item.to.startsWith("/") ? p + item.to.slice(1) : item.to;
          a.href = dest;
          a.className = "nav-link" + (dest.indexOf(cur) !== -1 ? " active" : "");
          a.textContent = item.label;
          nav.appendChild(a);
        }
      });
    }

    var userWrap = el("app-user");
    if (userWrap && global.ItTopbar && global.ItTopbar.render) {
      global.ItTopbar.render();
    }
  }

  /* ---------- toasts ---------- */

  var stack = null;
  function ensureStack() {
    if (stack && stack.parentNode) return stack;
    stack = document.createElement("div");
    stack.className = "toast-stack";
    document.body.appendChild(stack);
    return stack;
  }

  function showToast(message, type) {
    var t = document.createElement("div");
    t.className = "toast" + (type ? " toast--" + type : "");
    t.textContent = message;
    ensureStack().appendChild(t);
    setTimeout(function () {
      t.style.opacity = "0";
      t.style.transform = "translateY(8px)";
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 220);
    }, 3200);
  }

  /* ---------- helpers ---------- */

  function money(cents, currency) {
    var val = (Number(cents) || 0) / 100;
    return (currency ? currency + " " : "") + val.toLocaleString(undefined, {
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
    if (status === "completed" || status === "approved" || status === "read" || status === "active") cls += " badge--ok";
    else if (status === "pending" || status === "planning" || status === "unread") cls += " badge--warn";
    else if (status === "cancelled" || status === "rejected" || status === "past_due") cls += " badge--danger";
    return '<span class="' + cls + '">' + String(status).replace(/_/g, " ") + "</span>";
  }

  function esc(value) {
    return String(value === null || value === undefined ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function imageHtml(src, name, cls, type) {
    var safeName = esc(name || '');
    var isPlaceholder = !src || src.indexOf('placeholder') > -1 || src.indexOf('null') > -1 || src.indexOf('undefined') > -1 || src.indexOf('loremflickr') > -1;
    
    // Hyper-accurate AI Image generation based on the exact name and category
    var prompt = name || 'beautiful travel destination';
    if (type === 'destinations') prompt += ' city skyline landmark high quality photography';
    else if (type === 'hotels') prompt += ' luxury hotel resort exterior high quality photography';
    else if (type === 'restaurants') prompt += ' luxury restaurant interior dining high quality photography';
    else if (type === 'attractions') prompt += ' famous attraction landmark high quality photography';
    else prompt += ' beautiful travel photography';

    var aiUrl = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(prompt) + '?width=800&height=600&nologo=true';
    var finalSrc = isPlaceholder ? aiUrl : src;
    
    return '<img class="' + cls + '" src="' + esc(finalSrc) + '" alt="' + safeName + '" loading="lazy" onerror="this.onerror=null; this.src=\'' + aiUrl + '\';">';
  }

  function unwrapData(res) {
    if (!res || !res.ok) return null;
    var body = res.body;
    if (body && typeof body === "object" && "data" in body) {
      if (body.data && typeof body.data === "object" && Array.isArray(body.data.data)) {
        return body.data.data;
      }
      return body.data;
    }
    return body;
  }

  /**
   * Boot the customer app shell. Resolves the session, renders the header,
   * then calls callback(user, role) once ready. Redirects to login when
   * unauthenticated (RequiresAuth equivalent).
   */

  function boot(callback) {
    It.session.bootAuth().then(function (session) {
      if (session.redirected) return;
      initHeader(session.user);
      document.body.classList.remove("is-booting");
      document.dispatchEvent(new CustomEvent("itinera:ready", { detail: session.user }));
      if (callback) callback(session.user, session.role);
    });
  }

  It.app = {
    showToast: showToast,
    money: money,
    starsHtml: starsHtml,
    badgeHtml: badgeHtml,
    esc: esc,
    imageHtml: imageHtml,
    unwrapData: unwrapData,
    initialsOf: initialsOf,
    boot: boot,
  };

  function init() {
    initTheme();
    document.body.classList.add("is-booting");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
