/**
 * core/command-palette.js — Universal Command Palette & Notifications Hub.
 * @date    2026-08-14
 * @purpose Global Ctrl+K / Cmd+K Command Palette with quick navigation,
 *          live catalog searching, recent notifications, and quick actions.
 */
(function (global) {
  "use strict";

  var doc = global.document;
  var isOpen = false;
  var selectedIndex = 0;
  var searchTimeout = null;
  var allItems = [];

  var ICONS = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    nav: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    mapPin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>'
  };

  function getBasePrefix() {
    var path = global.location.pathname;
    if (path.indexOf("/admin/") !== -1 || path.indexOf("/agency/") !== -1 || path.indexOf("/app/") !== -1 || path.indexOf("/auth/") !== -1 || path.indexOf("/errors/") !== -1) {
      return "../";
    }
    return "";
  }

  function getNavigationItems() {
    var p = getBasePrefix();
    var It = global.Itinera;
    var user = null;
    try {
      var raw = global.localStorage.getItem("itinera_user");
      if (raw) user = JSON.parse(raw);
    } catch (e) {}

    var role = user ? (user.role || (user.roles && user.roles[0]) || "customer") : "guest";

    var items = [
      { group: "Navigation", title: "Home Page", sub: "Public landing", url: p + "index.html", icon: ICONS.nav },
      { group: "Navigation", title: "Explore Catalog", sub: "Destinations & stays", url: p + "explore.html", icon: ICONS.nav },
      { group: "Navigation", title: "Weather Radar", sub: "Live forecasts", url: p + "weather.html", icon: ICONS.nav },
      { group: "Navigation", title: "Plans & Pricing", sub: "Subscription tiers", url: p + "plans.html", icon: ICONS.nav },
      { group: "Navigation", title: "About Itinera", sub: "Brand story", url: p + "about.html", icon: ICONS.nav },
      { group: "Navigation", title: "Contact Support", sub: "Help desk", url: p + "contact.html", icon: ICONS.nav }
    ];

    if (user) {
      items.push(
        { group: "Traveler Workspace", title: "My Dashboard", sub: "Recent activity", url: p + "app/dashboard.html", icon: ICONS.nav },
        { group: "Traveler Workspace", title: "My Itineraries", sub: "Trip plans", url: p + "app/trips.html", icon: ICONS.nav },
        { group: "Traveler Workspace", title: "AI Travel Concierge", sub: "Smart trip assistant", url: p + "app/chat.html", icon: ICONS.bolt },
        { group: "Traveler Workspace", title: "Saved Favourites", sub: "Bookmarks", url: p + "app/favourites.html", icon: ICONS.nav },
        { group: "Traveler Workspace", title: "My Reviews", sub: "Submitted feedback", url: p + "app/my-reviews.html", icon: ICONS.nav },
        { group: "Traveler Workspace", title: "Profile Settings", sub: "Account & preferences", url: p + "app/profile-settings.html", icon: ICONS.nav }
      );
    }

    if (role === "admin" || role === "super_admin") {
      items.push(
        { group: "Admin Departure Control", title: "Admin Overview", sub: "Live platform metrics", url: p + "admin/index.html", icon: ICONS.nav },
        { group: "Admin Departure Control", title: "Manage Destinations", sub: "Cities & coordinates", url: p + "admin/destinations.html", icon: ICONS.mapPin },
        { group: "Admin Departure Control", title: "Manage Hotels", sub: "Luxury stays", url: p + "admin/hotels.html", icon: ICONS.mapPin },
        { group: "Admin Departure Control", title: "Manage Restaurants", sub: "Fine dining", url: p + "admin/restaurants.html", icon: ICONS.mapPin },
        { group: "Admin Departure Control", title: "Manage Users", sub: "Platform accounts", url: p + "admin/users.html", icon: ICONS.nav },
        { group: "Admin Departure Control", title: "Agency Requests", sub: "Lead assignments", url: p + "admin/agency-requests.html", icon: ICONS.nav },
        { group: "Admin Departure Control", title: "Executive Reports", sub: "PDF data exports", url: p + "admin/reports.html", icon: ICONS.nav },
        { group: "Admin Departure Control", title: "System Settings", sub: "Platform configuration", url: p + "admin/settings.html", icon: ICONS.nav }
      );
    }

    if (role === "agency" || role === "admin" || role === "super_admin") {
      items.push(
        { group: "Agency Desk", title: "My Assignments", sub: "Assigned customers & trip plans", url: p + "agency/assignments.html", icon: ICONS.nav }
      );
    }

    return items;
  }

  function getActionItems() {
    return [
      {
        group: "Quick Actions",
        title: "Toggle Theme",
        sub: "Switch Dark / Light mode",
        icon: ICONS.sun,
        action: function () {
          if (global.ItTheme) global.ItTheme.toggle();
        }
      }
    ];
  }

  function renderPalette() {
    var existing = doc.getElementById("cmd-backdrop");
    if (existing) return existing;

    var backdrop = doc.createElement("div");
    backdrop.id = "cmd-backdrop";
    backdrop.className = "cmd-backdrop";
    backdrop.style.display = "none";

    backdrop.innerHTML =
      '<div class="cmd-dialog" role="dialog" aria-modal="true" aria-label="Command Palette">' +
        '<div class="cmd-header">' +
          ICONS.search +
          '<input type="search" id="cmd-input" class="cmd-input" placeholder="Type a destination, page, or action..." autocomplete="off" />' +
          '<kbd class="cmd-esc-badge">ESC</kbd>' +
        '</div>' +
        '<div class="cmd-body" id="cmd-body"></div>' +
        '<div class="cmd-footer">' +
          '<div class="cmd-footer-keys">' +
            '<span><kbd class="cmd-esc-badge">↑↓</kbd> Navigate</span>' +
            '<span><kbd class="cmd-esc-badge">↵</kbd> Select</span>' +
            '<span><kbd class="cmd-esc-badge">ESC</kbd> Close</span>' +
          '</div>' +
          '<span>Itinera Global Command</span>' +
        '</div>' +
      '</div>';

    doc.body.appendChild(backdrop);

    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop) close();
    });

    var input = doc.getElementById("cmd-input");
    input.addEventListener("input", function () {
      var query = input.value.trim();
      handleSearch(query);
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(selectedIndex + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(selectedIndex - 1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        activateSelected();
      } else if (e.key === "Escape") {
        close();
      }
    });

    return backdrop;
  }

  function setSelectedIndex(idx) {
    if (!allItems.length) return;
    if (idx < 0) idx = allItems.length - 1;
    if (idx >= allItems.length) idx = 0;
    selectedIndex = idx;

    var domItems = doc.querySelectorAll(".cmd-item");
    domItems.forEach(function (el, i) {
      if (i === selectedIndex) {
        el.classList.add("is-selected");
        el.scrollIntoView({ block: "nearest" });
      } else {
        el.classList.remove("is-selected");
      }
    });
  }

  function activateSelected() {
    if (!allItems.length || !allItems[selectedIndex]) return;
    var item = allItems[selectedIndex];
    close();
    if (item.action) {
      item.action();
    } else if (item.url) {
      global.location.href = item.url;
    }
  }

  function populateList(items) {
    allItems = items;
    selectedIndex = 0;
    var body = doc.getElementById("cmd-body");
    if (!body) return;
    body.innerHTML = "";

    if (!items.length) {
      body.innerHTML = '<div style="padding: 2rem; text-align: center; color: hsl(var(--muted-foreground)); font-size: 0.85rem;">No results found.</div>';
      return;
    }

    var currentGroup = "";
    var domIndex = 0;

    items.forEach(function (item) {
      if (item.group !== currentGroup) {
        currentGroup = item.group;
        var groupEl = doc.createElement("div");
        groupEl.className = "cmd-group-title";
        groupEl.textContent = currentGroup;
        body.appendChild(groupEl);
      }

      var itemEl = doc.createElement("button");
      itemEl.type = "button";
      itemEl.className = "cmd-item" + (domIndex === selectedIndex ? " is-selected" : "");
      itemEl.setAttribute("data-index", String(domIndex));

      itemEl.innerHTML =
        '<div class="cmd-item-left">' +
          '<span class="cmd-item-icon">' + (item.icon || ICONS.nav) + '</span>' +
          '<div>' +
            '<span class="cmd-item-title">' + item.title + '</span>' +
            (item.sub ? '<span class="cmd-item-sub">' + item.sub + '</span>' : '') +
          '</div>' +
        '</div>' +
        (item.badge ? '<span class="cmd-item-badge' + (item.badgeAccent ? ' badge-accent' : '') + '">' + item.badge + '</span>' : '');

      var thisIdx = domIndex;
      itemEl.addEventListener("mouseenter", function () {
        setSelectedIndex(thisIdx);
      });

      itemEl.addEventListener("click", function () {
        selectedIndex = thisIdx;
        activateSelected();
      });

      body.appendChild(itemEl);
      domIndex++;
    });
  }

  function handleSearch(query) {
    if (!query) {
      loadInitialList();
      return;
    }

    var q = query.toLowerCase();
    var navs = getNavigationItems().filter(function (it) {
      return it.title.toLowerCase().indexOf(q) !== -1 || (it.sub && it.sub.toLowerCase().indexOf(q) !== -1);
    });

    var actions = getActionItems().filter(function (it) {
      return it.title.toLowerCase().indexOf(q) !== -1;
    });

    var results = [].concat(navs, actions);

    // Live catalog search if 2+ chars
    if (query.length >= 2) {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(function () {
        var It = global.Itinera;
        if (It && It.apiGet) {
          It.apiGet("/destinations?search=" + encodeURIComponent(query)).then(function (res) {
            var list = (res && res.body && (res.body.data || res.body)) || (res && res.data) || [];
            if (Array.isArray(list) && list.length) {
              var p = getBasePrefix();
              list.slice(0, 5).forEach(function (d) {
                results.unshift({
                  group: "Catalog Match",
                  title: d.name || d.title,
                  sub: d.country || "Destination",
                  badge: "Destination",
                  badgeAccent: true,
                  url: p + "entity.html?type=destination&id=" + (d.id || d._id),
                  icon: ICONS.mapPin
                });
              });
              populateList(results);
            }
          }).catch(function () {});
        }
      }, 200);
    }

    populateList(results);
  }

  function loadInitialList() {
    var p = getBasePrefix();
    var It = global.Itinera;
    var list = [].concat(getNavigationItems(), getActionItems());

    // Check for recent notifications
    if (It && It.apiGet) {
      It.apiGet("/notifications?per_page=3&unread=1").then(function (res) {
        var notifs = (res && res.body && (res.body.data || res.body)) || (res && res.data) || [];
        if (Array.isArray(notifs) && notifs.length) {
          notifs.forEach(function (n) {
            list.unshift({
              group: "Recent Notifications",
              title: n.data && n.data.title ? n.data.title : (n.type || "Notification"),
              sub: n.data && n.data.message ? n.data.message : "Unread alert",
              badge: "New",
              badgeAccent: true,
              icon: ICONS.bell,
              url: p + "app/notifications.html"
            });
          });
        }
        populateList(list);
      }).catch(function () {
        populateList(list);
      });
    } else {
      populateList(list);
    }
  }

  function open() {
    var bd = renderPalette();
    bd.style.display = "flex";
    isOpen = true;
    var inp = doc.getElementById("cmd-input");
    if (inp) {
      inp.value = "";
      inp.focus();
    }
    loadInitialList();
  }

  function close() {
    var bd = doc.getElementById("cmd-backdrop");
    if (bd) bd.style.display = "none";
    isOpen = false;
  }

  function toggle() {
    if (isOpen) close();
    else open();
  }

  // Keyboard shortcut listener (Ctrl+K or Cmd+K)
  global.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      toggle();
    }
  });

  // Export global API
  global.ItineraCmd = {
    open: open,
    close: close,
    toggle: toggle
  };

})(typeof window !== "undefined" ? window : this);
