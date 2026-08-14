/**
 * app-shell.js — customer-app shared chrome (converted from React front/).
 * Auth boot, top nav, user chip, theme toggle, toasts, helpers.
 * Depends on config.js + api.js + session.js. Included by every *.html
 * page that lives under the authenticated customer app.
 */
(function (global) {
  "use strict";

  var It = global.Itinari;
  if (!It || !It.session) return;

  /* Theme is handled by core/theme.js (ItTheme) — no duplicate logic here. */

  function initTheme() {
    if (global.ItTheme) {
      global.ItTheme.set(global.ItTheme.mode()); /* re-apply to sync icons */
    }
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
    var brand = el("app-brand");
    if (brand) {
      brand.href = "/home.html";
      brand.innerHTML = 
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="brand-logo" aria-hidden="true" style="margin-right: 8px; flex-shrink: 0;">' +
          '<path d="M12 2C12 2 13 8 18 12C13 16 12 22 12 22C12 22 11 16 6 12C11 8 12 2 12 2Z" fill="currentColor"/>' +
        '</svg>' +
        '<span class="brand-name" style="font-size: 18px; font-weight: 700; tracking-wide;">Itinera</span>';
    }

    var nav = el("app-nav");
    if (nav) {
      nav.innerHTML = ""; // Clear center nav entirely to keep space clean
    }

    var userWrap = el("app-user");
    if (userWrap) {
      var toggle = el("theme-toggle");
      userWrap.innerHTML = "";

      // 1. Create Hamburger Button and place it on the side (far right next to user controls)
      var burgerBtn = document.createElement("button");
      burgerBtn.type = "button";
      burgerBtn.className = "burger-btn";
      burgerBtn.setAttribute("aria-label", "Toggle navigation menu");
      burgerBtn.innerHTML = "<span></span><span></span><span></span>";
      userWrap.appendChild(burgerBtn);

      // 2. Append Theme toggle
      if (toggle) userWrap.appendChild(toggle);

      // Always show Log in and Sign up buttons, even if logged in, as requested
      var loginLink = document.createElement("a");
      loginLink.href = "/login.html";
      loginLink.className = "btn btn--ghost btn--login-nav";
      loginLink.textContent = "Log in";
      userWrap.appendChild(loginLink);

      var signupLink = document.createElement("a");
      signupLink.href = "/register.html";
      signupLink.className = "btn btn--primary btn--signup-nav";
      signupLink.textContent = "Sign up";
      userWrap.appendChild(signupLink);

      // 5. Create Hamburger Menu Overlay
      var overlay = document.getElementById("app-burger-menu");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "app-burger-menu";
        overlay.className = "burger-menu-overlay";
        document.body.appendChild(overlay);
      }

      var content = document.createElement("div");
      content.className = "burger-menu-content";
      
      var menuNav = document.createElement("nav");
      menuNav.className = "burger-menu-nav";

      var path = (global.location.pathname.split("/").pop() || "home.html").split("?")[0];
      topItems(user && It.session.roleOf(user)).forEach(function (item) {
        if (item.cta) return; // skip sign in link inside burger
        var a = document.createElement("a");
        a.href = item.to;
        a.className = "burger-menu-link" + (item.to === "/" + path ? " burger-menu-link--active" : "");
        
        var iconHtml = "";
        if (item.icon && It.nav.ICONS && It.nav.ICONS[item.icon]) {
          iconHtml = '<span class="burger-menu-icon">' + It.nav.ICONS[item.icon] + '</span>';
        }
        
        a.innerHTML = iconHtml + '<span class="burger-menu-label">' + item.label + '</span>';
        menuNav.appendChild(a);
      });

      // ONLY show Admin Portal to super_admin!
      if (user && It.session.roleOf(user) === "super_admin") {
        var admin = document.createElement("a");
        admin.href = "/admin/index.html";
        admin.className = "burger-menu-link";
        
        var adminIconHtml = "";
        if (It.nav.ICONS && It.nav.ICONS.portal) {
          adminIconHtml = '<span class="burger-menu-icon">' + It.nav.ICONS.portal + '</span>';
        }
        
        admin.innerHTML = adminIconHtml + '<span class="burger-menu-label">Admin Portal</span>';
        menuNav.appendChild(admin);
      }

      content.appendChild(menuNav);
      overlay.innerHTML = ""; // clear old content if any
      overlay.appendChild(content);

      // Wire burger click
      burgerBtn.addEventListener("click", function () {
        var open = burgerBtn.classList.toggle("is-open");
        overlay.classList.toggle("is-open", open);
      });

      overlay.addEventListener("click", function (e) {
        if (e.target === overlay || e.target.closest("a")) {
          burgerBtn.classList.remove("is-open");
          overlay.classList.remove("is-open");
        }
      });
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
  function initFooter() {
    var footer = document.querySelector("footer.app__footer") || document.querySelector("footer");
    if (!footer) return;

    footer.className = "footer";
    footer.innerHTML = 
      '<div class="footer__container">' +
        '<div class="footer__grid">' +
          '<div>' +
            '<a href="/home.html" class="footer__brand-link">' +
              '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" class="footer__brand-logo" aria-hidden="true">' +
                '<path d="M12 2C12 2 13 8 18 12C13 16 12 22 12 22C12 22 11 16 6 12C11 8 12 2 12 2Z" fill="currentColor" />' +
              '</svg>' +
              '<span>Itinera</span>' +
            '</a>' +
            '<p class="footer__desc">' +
              'Plan it. Live it. From iconic cities to hidden gems — expert-crafted journeys with 24/7 support.' +
            '</p>' +
          '</div>' +
          '<div>' +
            '<h5 class="footer__title"><i class="fas fa-compass" aria-hidden="true"></i>Explore</h5>' +
            '<ul class="footer__list">' +
              '<li class="footer__list-item"><a href="/about.html" class="footer__link"><i class="fas fa-chevron-right" aria-hidden="true"></i>About Us</a></li>' +
              '<li class="footer__list-item"><a href="/explore.html" class="footer__link"><i class="fas fa-chevron-right" aria-hidden="true"></i>Explore</a></li>' +
              '<li class="footer__list-item"><a href="/booking.html" class="footer__link"><i class="fas fa-chevron-right" aria-hidden="true"></i>Booking</a></li>' +
            '</ul>' +
          '</div>' +
          '<div>' +
            '<h5 class="footer__title"><i class="fas fa-phone" aria-hidden="true"></i>Contact</h5>' +
            '<ul class="footer__contact-list">' +
              '<li class="footer__contact-item"><i class="fas fa-envelope" aria-hidden="true"></i>help@itinera.travel</li>' +
              '<li class="footer__contact-item"><i class="fas fa-phone" aria-hidden="true"></i>+1 (555) 123-4567</li>' +
              '<li class="footer__contact-item"><i class="fas fa-map-marker-alt" aria-hidden="true"></i>Cairo, Egypt</li>' +
            '</ul>' +
            '<div class="footer__socials">' +
              '<a href="#" class="footer__social-btn" title="X" aria-label="X"><i class="fab fa-x-twitter" aria-hidden="true"></i></a>' +
              '<a href="#" class="footer__social-btn" title="Instagram" aria-label="Instagram"><i class="fab fa-instagram" aria-hidden="true"></i></a>' +
              '<a href="#" class="footer__social-btn" title="Facebook" aria-label="Facebook"><i class="fab fa-facebook-f" aria-hidden="true"></i></a>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="footer__bottom">' +
          '<span class="footer__copy">&copy; ' + new Date().getFullYear() + ' Itinera &middot; Team 2 Conference Project</span>' +
          '<span class="footer__copy">Made with <i class="fas fa-heart footer__heart" aria-hidden="true"></i> in Egypt</span>' +
        '</div>' +
      '</div>';
  }

  function boot(callback) {
    It.session.bootAuth().then(function (session) {
      if (session.redirected) return;
      initHeader(session.user);
      initFooter();
      document.body.classList.remove("is-booting");
      document.dispatchEvent(new CustomEvent("itinari:ready", { detail: session.user }));
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
