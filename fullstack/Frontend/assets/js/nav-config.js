/**
 * nav-config.js — single source of truth for role-based navigation.
 * Every role gets its own item set:
 *   top nav   (customer app topbar)    : guest | user | agency
 *   sidebar   (admin shell)            : super_admin | admin | agency
 * Icons are inline SVG (lucide-style, 24 viewBox) reused from the admin pages.
 * Depends on config.js + session.js (Itinari namespace only, no DOM).
 */
(function (global) {
  "use strict";

  var It = global.Itinari || (global.Itinari = {});

  var svg = function (inner) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + "</svg>";
  };

  var ICONS = {
    dashboard: svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>'),
    users: svg('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
    trips: svg('<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>'),
    destinations: svg('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/>'),
    hotels: svg('<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6"/><path d="M18 9h2a2 2 0 0 1 2 2v9"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>'),
    restaurants: svg('<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>'),
    countries: svg('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Z"/><line x1="4" y1="22" x2="4" y2="15"/>'),
    attractions: svg('<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3"/>'),
    reviews: svg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/><path d="M8 9h8"/><path d="M8 13h5"/>'),
    agency: svg('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
    contacts: svg('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z"/>'),
    analytics: svg('<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>'),
    settings: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>'),
    home: svg('<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'),
    explore: svg('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8a3 3 0 0 0-3 3"/>'),
    surveys: svg('<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'),
    bookings: svg('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'),
    plans: svg('<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>'),
    favourites: svg('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'),
    myreviews: svg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>'),
    contact: svg('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z"/>'),
    assignments: svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>'),
    portal: svg('<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>'),
    weather: svg('<path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.9 20.3a5.5 5.5 0 0 0-10.78-2.3C3 18.5 3 20 4.5 20H15.9z"/>'),
    about: svg('<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'),
  };

  /* ------------------------------------------------------------------ */
  /* Customer-app top navigation (per role)                              */
  /* ------------------------------------------------------------------ */

  var TOP = {
    guest: [
      { to: "/index.html", label: "Home", icon: "home" },
      {
        label: "Discover",
        icon: "explore",
        dropdown: [
          { to: "/explore.html", label: "Explore Catalog", icon: "explore" },
          { to: "/countries.html", label: "Countries & Cities", icon: "countries" },
          { to: "/destinations.html", label: "Destinations", icon: "destinations" },
          { to: "/hotels.html", label: "Hotels", icon: "hotels" },
          { to: "/attractions.html", label: "Attractions", icon: "attractions" },
          { to: "/restaurants.html", label: "Restaurants", icon: "restaurants" },
          { to: "/flights.html", label: "Flights", icon: "bookings" },
          { to: "/weather.html", label: "Live Weather", icon: "weather" },
        ]
      },
      { to: "/plans.html", label: "Plans", icon: "plans" },
      {
        label: "More",
        icon: "about",
        dropdown: [
          { to: "/about.html", label: "About Us", icon: "about" },
          { to: "/contact.html", label: "Contact Us", icon: "contact" },
          { to: "/help.html", label: "Help Center", icon: "settings" },
        ]
      },
      { to: "/auth/login.html", label: "Sign in", cta: true, icon: "portal" },
    ],
    user: [
      { to: "/index.html", label: "Home", icon: "home" },
      {
        label: "Discover",
        icon: "explore",
        dropdown: [
          { to: "/explore.html", label: "Explore Catalog", icon: "explore" },
          { to: "/countries.html", label: "Countries & Cities", icon: "countries" },
          { to: "/destinations.html", label: "Destinations", icon: "destinations" },
          { to: "/hotels.html", label: "Hotels", icon: "hotels" },
          { to: "/attractions.html", label: "Attractions", icon: "attractions" },
          { to: "/restaurants.html", label: "Restaurants", icon: "restaurants" },
          { to: "/flights.html", label: "Flights", icon: "bookings" },
          { to: "/weather.html", label: "Live Weather", icon: "weather" },
        ]
      },
      {
        label: "My Travel",
        icon: "trips",
        dropdown: [
          { to: "/app/dashboard.html", label: "Dashboard", icon: "dashboard" },
          { to: "/app/trips.html", label: "My Trips", icon: "trips" },
          { to: "/public/community.html", label: "Traveler Community & Shared Trips", icon: "trips" },
          { to: "/app/bookings.html", label: "My Bookings", icon: "bookings" },
          { to: "/app/flight-booking.html", label: "Flight Search", icon: "bookings" },
          { to: "/app/favourites.html", label: "Saved Places", icon: "favourites" },
          { to: "/app/my-reviews.html", label: "My Reviews", icon: "myreviews" },
          { to: "/app/chat.html", label: "AI Concierge", icon: "reviews" },
          { to: "/app/report-agency.html", label: "Report Agency Issue", icon: "contacts" },
          { to: "/app/notifications.html", label: "Notifications", icon: "dashboard" },
        ]
      },
      { to: "/plans.html", label: "Plans", icon: "plans" },
      {
        label: "More",
        icon: "about",
        dropdown: [
          { to: "/about.html", label: "About Us", icon: "about" },
          { to: "/contact.html", label: "Contact Us", icon: "contact" },
          { to: "/help.html", label: "Help Center", icon: "settings" },
        ]
      },
    ],
    agency: [
      { to: "/index.html", label: "Home", icon: "home" },
      {
        label: "Discover",
        icon: "explore",
        dropdown: [
          { to: "/explore.html", label: "Explore Catalog", icon: "explore" },
          { to: "/destinations.html", label: "Destinations", icon: "destinations" },
          { to: "/hotels.html", label: "Hotels", icon: "hotels" },
          { to: "/attractions.html", label: "Attractions", icon: "attractions" },
          { to: "/restaurants.html", label: "Restaurants", icon: "restaurants" },
          { to: "/weather.html", label: "Live Weather", icon: "weather" },
        ]
      },
      {
        label: "Agency Portal",
        icon: "agency",
        dropdown: [
          { to: "/agency/index.html", label: "Dashboard", icon: "dashboard" },
          { to: "/agency/assignments.html", label: "My Assignments", icon: "assignments" },
          { to: "/agency/create-trip.html", label: "Create Trip Proposal", icon: "trips" },
          { to: "/agency/proposals.html", label: "Trip Proposals", icon: "trips" },
          { to: "/agency/inquiries.html", label: "Customer Inquiries", icon: "reviews" },
          { to: "/agency/earnings.html", label: "Earnings & Payouts", icon: "analytics" },
          { to: "/agency/settings.html", label: "Agency Profile", icon: "settings" },
        ]
      },
      { to: "/contact.html", label: "Contact", icon: "contact" },
    ],
  };

  /* ------------------------------------------------------------------ */
  /* Admin-shell sidebar (per role). hrefs are page-relative (same dir). */
  /* ------------------------------------------------------------------ */

  var ADMIN_ITEMS = [
    {
      section: "Overview",
      items: [
        { href: "dashboard.html", label: "Dashboard", icon: "dashboard" },
        { href: "analytics.html", label: "Analytics", icon: "analytics" },
        { href: "activity.html", label: "Audit Logs", icon: "activity" },
      ],
    },
    {
      section: "Catalog Management",
      items: [
        { href: "destinations.html", label: "Destinations", icon: "destinations" },
        { href: "hotels.html", label: "Hotels & Stays", icon: "hotels" },
        { href: "attractions.html", label: "Attractions & Sights", icon: "attractions" },
        { href: "restaurants.html", label: "Dining & Restaurants", icon: "restaurants" },
        { href: "flights.html", label: "Flights Catalog", icon: "flights" },
        { href: "categories.html", label: "Categories", icon: "categories" },
      ],
    },
    {
      section: "Operations & Governance",
      items: [
        { href: "users.html", label: "User Accounts", icon: "users" },
        { href: "trips.html", label: "All Trip Plans", icon: "trips" },
        { href: "reviews.html", label: "Review Moderation", icon: "reviews" },
        { href: "flags.html", label: "Reported Content", icon: "flags", badgeKey: "flags" },
        { href: "agency-requests.html", label: "Agency Proposals", icon: "agency", badgeKey: "agency" },
        { href: "contacts.html", label: "Support Messages", icon: "contacts", badgeKey: "contacts" },
        { href: "notifications.html", label: "System Broadcasts", icon: "dashboard" },
        { href: "settings.html", label: "Platform Settings", icon: "settings" },
      ],
    },
    {
      section: "Quick Access",
      items: [
        { href: "../index.html", label: "Live Customer Site", icon: "portal" },
      ],
    },
  ];

  /* agency role — assignments + customer tools */
  var AGENCY_ITEMS = [
    {
      section: "Agency Operations",
      items: [
        { href: "index.html", label: "Dashboard", icon: "dashboard" },
        { href: "assignments.html", label: "My Assignments", icon: "assignments" },
        { href: "create-trip.html", label: "Create Trip Proposal", icon: "trips" },
        { href: "proposals.html", label: "Trip Proposals", icon: "trips" },
        { href: "inquiries.html", label: "Customer Inquiries", icon: "reviews" },
      ],
    },
    {
      section: "Financials & Account",
      items: [
        { href: "earnings.html", label: "Earnings & Payouts", icon: "analytics" },
        { href: "settings.html", label: "Agency Profile", icon: "settings" },
        { href: "../index.html", label: "Live Customer Site", icon: "portal" },
      ],
    },
  ];

  var SIDEBAR = {
    super_admin: ADMIN_ITEMS,
    admin: ADMIN_ITEMS,
    agency: AGENCY_ITEMS,
  };

  /* ------------------------------------------------------------------ */

  function topFor(role) {
    if (role === "user" || role === "admin" || role === "super_admin") return TOP.user;
    if (role === "agency") return TOP.agency;
    return TOP.guest;
  }

  function sidebarFor(role) {
    return SIDEBAR[role] || null;
  }

  function renderItem(item, base) {
    var href = item.href;
    if (base && href.charAt(0) !== "/" && href.charAt(0) !== "#") href = base + href;
    var badgeAttr = item.badgeKey ? ' data-nav-badge="' + item.badgeKey + '"' : '';
    var badgeHtml = item.badgeKey ? '<span class="nav-badge" data-badge="' + item.badgeKey + '" hidden>0</span>' : '';
    if (item.icon) {
      return '<a href="' + href + '" class="nav-item"' + badgeAttr + ' title="' + item.label + '">' +
        '<span class="nav-icon">' + ICONS[item.icon] + "</span>" +
        '<span class="nav-label">' + item.label + "</span>" +
        badgeHtml + "</a>";
    }
    return '<a href="' + href + '" class="nav-item"' + badgeAttr + '>' + item.label + badgeHtml + "</a>";
  }

  function renderSidebarHtml(role, base) {
    var groups = sidebarFor(role);
    if (!groups) return "";
    var out = "";
    groups.forEach(function (group) {
      if (group.section) {
        out += '<span class="nav-section">' + group.section + "</span>";
      }
      group.items.forEach(function (item) {
        out += renderItem(item, base || "");
      });
    });
    return out;
  }

  It.nav = {
    topFor: topFor,
    sidebarFor: sidebarFor,
    renderSidebarHtml: renderSidebarHtml,
    ICONS: ICONS,
  };
})(window);
