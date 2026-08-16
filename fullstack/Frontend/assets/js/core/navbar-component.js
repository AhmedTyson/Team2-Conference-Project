/**
 * navbar-component.js — Global Tailwind Navbar Component Loader & Controller.
 * Dynamically mounts Frontend/components/navbar.html across all non-admin pages,
 * adjusts relative links, highlights active tabs, and syncs auth/notifications state.
 */
(function (global) {
  "use strict";

  const doc = global.document;

  function el(id) { return doc.getElementById(id); }

  function ensurePaginationScript() {
    if (!global.ItPaginate && !doc.querySelector('script[src*="pagination.js"]')) {
      var s = doc.createElement("script");
      var prefix = getBasePrefix();
      s.src = prefix + "assets/js/core/pagination.js";
      s.async = false;
      if (doc.head) doc.head.appendChild(s);
      else if (doc.body) doc.body.appendChild(s);
    }
  }

  function getBasePrefix() {
    var p = (global.location.pathname || "").toLowerCase();
    if (p.indexOf("/app/") !== -1 || p.indexOf("/auth/") !== -1 || p.indexOf("/admin/") !== -1 || p.indexOf("/agency/") !== -1 || p.indexOf("/public/") !== -1 || p.indexOf("/errors/") !== -1) {
      return "../";
    }
    return "./";
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

  function ensureCmdPaletteLoaded() {
    if (!global.ItinariCmd && !doc.querySelector('script[src*="command-palette.js"]')) {
      var prefix = getBasePrefix();
      var s = doc.createElement("script");
      s.src = prefix + "assets/js/core/command-palette.js";
      doc.head.appendChild(s);
    }
  }

  function openCommandPalette() {
    if (global.ItinariCmd && typeof global.ItinariCmd.open === "function") {
      global.ItinariCmd.open();
    } else {
      ensureCmdPaletteLoaded();
      setTimeout(function () {
        if (global.ItinariCmd && global.ItinariCmd.open) global.ItinariCmd.open();
      }, 150);
    }
  }

  function adjustRelativeHref(href, prefix) {
    if (!href) return href;
    if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("#") || href.startsWith("javascript:")) {
      return href;
    }
    // Replace leading "./" or "../" with prefix
    var cleanPath = href.replace(/^(\.\/|\.\.\/)/, "");
    return prefix + cleanPath;
  }

  function mountComponent(htmlText) {
    ensurePaginationScript();
    var prefix = getBasePrefix();
    var user = getCurrentUser();

    // 1. Parse HTML template into element
    var temp = doc.createElement("div");
    temp.innerHTML = htmlText.trim();
    var navEl = temp.firstElementChild;
    if (!navEl) return;

    // 2. Clean up any existing global-navbar or placeholder elements
    var existingNav = el("global-navbar");
    if (existingNav && existingNav.parentNode) {
      existingNav.parentNode.removeChild(existingNav);
    }
    doc.querySelectorAll("header.app-nav-header, header.app__header").forEach(function (ph) {
      if (ph.parentNode) ph.parentNode.removeChild(ph);
    });

    // 3. Mount directly at top level of document.body so it escapes all parent stacking contexts & transforms
    if (doc.body) {
      doc.body.insertBefore(navEl, doc.body.firstChild);
    }

    // Ensure non-hero pages have top padding so content is never covered by the fixed navbar
    var hasHero = !!doc.querySelector(".hero-wrapper");
    if (!hasHero) {
      var appWrap = doc.querySelector(".app-wrapper") || doc.querySelector("main");
      if (appWrap && !appWrap.classList.contains("pt-24") && !appWrap.classList.contains("pt-28")) {
        appWrap.style.paddingTop = "5.5rem";
      }
    }

    // 1. Fix all link Hrefs & image Srcs relative to current directory
    navEl.querySelectorAll("a[href]").forEach(function (a) {
      var rawHref = a.getAttribute("href");
      a.setAttribute("href", adjustRelativeHref(rawHref, prefix));
    });

    navEl.querySelectorAll("img[src]").forEach(function (img) {
      var rawSrc = img.getAttribute("src");
      img.setAttribute("src", adjustRelativeHref(rawSrc, prefix));
    });

    // 2. Active Tab Highlight
    var currentPath = (global.location.pathname || "").split("/").pop() || "index.html";
    if (currentPath === "") currentPath = "index.html";

    navEl.querySelectorAll("[data-nav-id]").forEach(function (link) {
      var navId = link.getAttribute("data-nav-id");
      var href = link.getAttribute("href") || "";
      var hrefFileName = href.split("/").pop();

      if (hrefFileName === currentPath || (currentPath === "index.html" && navId === "home")) {
        link.classList.add("bg-white/15", "text-white", "font-bold", "shadow-sm");
        link.classList.remove("text-white/70");
      }
    });

    // 3. User Authentication State Toggle
    var guestCta = el("nav-guest-cta");
    var userMenu = el("nav-user-menu");
    var userHub = el("dropdown-user-hub");
    var bellWrap = el("nav-bell-wrapper");

    if (user) {
      if (guestCta) guestCta.classList.add("hidden");
      if (userMenu) userMenu.classList.remove("hidden");
      if (userHub) userHub.classList.remove("hidden");
      if (bellWrap) bellWrap.classList.remove("hidden");

      // Set user details
      var name = user.name || user.email || "Traveler";
      var initials = String(name).trim().substring(0, 1).toUpperCase();
      
      var avatarEl = el("nav-user-avatar");
      var nameEl = el("nav-user-name");
      var fullNameEl = el("dropdown-user-fullname");
      var emailEl = el("dropdown-user-email");

      if (avatarEl) avatarEl.textContent = initials;
      if (nameEl) nameEl.textContent = name;
      if (fullNameEl) fullNameEl.textContent = name;
      if (emailEl) emailEl.textContent = user.email || "";

      // Wire logout button
      var logoutBtn = el("nav-logout-btn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", function (e) {
          e.preventDefault();
          if (global.Itinari && global.Itinari.session && global.Itinari.session.logout) {
            global.Itinari.session.logout();
          } else {
            try {
              global.localStorage.removeItem("itinari_token");
              global.localStorage.removeItem("itinari_user");
            } catch (err) {}
            global.location.href = prefix + "auth/login.html";
          }
        });
      }

      // Fetch Notification Badge Count
      var It = global.Itinari;
      if (It && It.apiGet) {
        It.apiGet("/notifications", { auth: true })
          .then(function (res) {
            var items = [];
            if (res && res.ok && res.body) {
              if (Array.isArray(res.body)) items = res.body;
              else if (res.body.data && Array.isArray(res.body.data)) items = res.body.data;
            }
            var unread = items.filter(function (it) {
              return !it.read_at && it.is_read !== true && it.is_read !== 1;
            }).length;

            var badge = el("nav-bell-badge");
            if (badge && unread > 0) {
              badge.textContent = unread > 99 ? "99+" : unread;
              badge.classList.remove("hidden");
              badge.classList.add("flex");
            }
          })
          .catch(function () {});
      }

    } else {
      if (guestCta) guestCta.classList.remove("hidden");
      if (userMenu) userMenu.classList.add("hidden");
      if (userHub) userHub.classList.add("hidden");
      if (bellWrap) bellWrap.classList.add("hidden");
    }

    // 4. Command Palette Trigger Setup
    ensureCmdPaletteLoaded();
    var cmdBtn = el("cmd-trigger-btn");
    if (cmdBtn) {
      cmdBtn.addEventListener("click", function (e) {
        e.preventDefault();
        openCommandPalette();
      });
    }

    // 5. Theme Toggle Setup
    var themeBtn = el("theme-toggle");
    if (themeBtn) {
      themeBtn.addEventListener("click", function (e) {
        e.preventDefault();
        if (global.ItTheme) global.ItTheme.toggle();
        else {
          var isDark = doc.documentElement.classList.toggle("dark");
          try { localStorage.setItem("itinari_theme", isDark ? "dark" : "light"); } catch (err) {}
        }
      });
    }

    // 6. Mobile Drawer Setup
    var burgerBtn = el("mobile-hamburger-btn");
    if (burgerBtn) {
      burgerBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (global.ItTopbar && global.ItTopbar.toggleMobileNav) {
          global.ItTopbar.toggleMobileNav();
        } else {
          var drawer = doc.querySelector(".mobile-nav-overlay");
          if (drawer) drawer.classList.toggle("is-open");
        }
      });
    }
  }

  function initGlobalNavbar() {
    var prefix = getBasePrefix();

    // Skip admin pages
    var path = (global.location.pathname || "").toLowerCase();
    if (path.indexOf("/admin/") !== -1) return;

    fetch(prefix + "components/navbar.html")
      .then(function (res) {
        if (!res.ok) throw new Error("Navbar component not found");
        return res.text();
      })
      .then(function (htmlText) {
        mountComponent(htmlText);
      })
      .catch(function (err) {
        // Fallback component inline text if fetch fails
        var fallbackHtml = `
          <header class="sticky top-0 z-50 w-full px-4 py-3 bg-transparent" id="global-navbar">
            <div class="max-w-7xl mx-auto flex items-center justify-between gap-3 px-5 py-2.5 rounded-full bg-black/80 backdrop-blur-2xl border border-white/10 shadow-2xl">
              <a href="${prefix}index.html" class="flex items-center gap-2 text-white font-bold">
                <span class="w-8 h-8 rounded-lg bg-white text-black font-black text-xs flex items-center justify-center">IT</span>
                <span>Itinera</span>
              </a>
              <nav class="hidden lg:flex items-center gap-2 text-xs text-white/70">
                <a href="${prefix}index.html" class="hover:text-white px-3 py-1.5 rounded-full">Home</a>
                <a href="${prefix}explore.html" class="hover:text-white px-3 py-1.5 rounded-full">Explore</a>
                <a href="${prefix}weather.html" class="hover:text-white px-3 py-1.5 rounded-full">Weather</a>
                <a href="${prefix}plans.html" class="hover:text-white px-3 py-1.5 rounded-full">Plans</a>
                <a href="${prefix}about.html" class="hover:text-white px-3 py-1.5 rounded-full">About</a>
                <a href="${prefix}contact.html" class="hover:text-white px-3 py-1.5 rounded-full">Contact</a>
                <a href="${prefix}help.html" class="hover:text-white px-3 py-1.5 rounded-full">Help</a>
              </nav>
              <div class="flex items-center gap-2" id="nav-controls-container">
                <button type="button" id="theme-toggle" class="p-2 text-white/70 hover:text-white"><i class="fas fa-moon"></i></button>
                <div id="nav-guest-cta">
                  <a href="${prefix}auth/login.html" class="px-4 py-1.5 rounded-full bg-white text-black text-xs font-bold">Sign in</a>
                </div>
              </div>
            </div>
          </header>
        `;
        mountComponent(fallbackHtml);
      });
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", initGlobalNavbar);
  } else {
    initGlobalNavbar();
  }

  global.ItineraGlobalNavbar = { init: initGlobalNavbar };

})(window);
