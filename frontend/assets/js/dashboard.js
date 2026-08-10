/**
 * dashboard.js — user dashboard (user role only).
 * Boot: no token → login. Token but user fetch fails → wipe + login.
 * Role: super_admin/admin → bounce to admin shell (dashboard is user-scoped).
 * Fetches GET /api/v1/dashboard, /api/v1/dashboard/trips, /api/v1/dashboard/favourites.
 */
(function (global) {
  "use strict";

  const It = global.Itinari;
  const fb = It.feedback;

  const DASH = {
    stats: "/v1/dashboard",
    trips: "/v1/dashboard/trips",
    favs: "/v1/dashboard/favourites",
  };

  function el(id) { return document.getElementById(id); }

  function setStat(id, value) {
    const card = el(id);
    if (!card) return;
    const v = card.querySelector(".stat-value");
    if (v) v.textContent = value;
    card.classList.remove("skeleton");
  }

  function buildCard(title, meta) {
    const div = document.createElement("div");
    div.className = "feed-item";
    const h = document.createElement("h3");
    h.textContent = title || "Untitled";
    const p = document.createElement("p");
    p.textContent = meta || "";
    div.appendChild(h);
    div.appendChild(p);
    return div;
  }

  function renderTrips(items) {
    return items.map(function (t) {
      return buildCard(
        t.destination_name || t.name || t.destination || "Trip",
        "Status: " + (t.status || "—") + (t.start_date ? " · " + t.start_date : "")
      );
    });
  }

  function renderFavs(items) {
    return items.map(function (f) {
      return buildCard(
        f.name || f.title || f.destination || "Place",
        f.address || f.city || f.category || ""
      );
    });
  }

  function setFeed(listEl, items, emptyMsg, render) {
    listEl.textContent = "";
    if (!items || !items.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = emptyMsg;
      listEl.appendChild(empty);
      return;
    }
    items.forEach(function (it) { listEl.appendChild(render([it])[0]); });
  }

  function renderProfile(user) {
    const chip = el("user-chip");
    if (!chip) return;
    const name = user ? user.name : "";
    const role = user ? It.session.roleOf(user) : "user";
    el("chip-name").textContent = name;
    el("chip-role").textContent = role;
    chip.hidden = false;
    const first = name.split(" ")[0].replace(/[.]+$/, "") || "there";
    el("greet").textContent = "Welcome back, " + first + ".";
    el("greet-sub").textContent = "Here's what's happening with your travels.";
  }

  function load(user) {
    renderProfile(user);
    const tripsList = el("trips-list");
    const favsList = el("favs-list");

    Promise.all([
      It.apiGet(DASH.stats, { auth: true }),
      It.apiGet(DASH.trips, { auth: true }),
      It.apiGet(DASH.favs, { auth: true }),
    ]).then(function (results) {
      const [statsRes, tripsRes, favsRes] = results;
      const stats = statsRes.ok && statsRes.body && statsRes.body.data ? statsRes.body.data : null;
      if (stats) {
        setStat("stat-total", stats.total_trips ?? "–");
        setStat("stat-pending", stats.trip_statistics ? stats.trip_statistics.pending : "–");
        setStat("stat-planning", stats.trip_statistics ? stats.trip_statistics.planning : "–");
        setStat("stat-booked", stats.trip_statistics ? stats.trip_statistics.booked : "–");
        setStat("stat-completed", stats.trip_statistics ? stats.trip_statistics.completed : "–");
        setStat("stat-cancelled", stats.trip_statistics ? stats.trip_statistics.cancelled : "–");
        setStat("stat-favs", stats.total_favourites ?? "–");
      } else {
        ["stat-total","stat-pending","stat-planning","stat-booked","stat-completed","stat-cancelled","stat-favs"].forEach(function (id) {
          setStat(id, "–");
        });
      }

      const trips = tripsRes.ok && tripsRes.body && tripsRes.body.data ? tripsRes.body.data : [];
      setFeed(tripsList, trips, "No trips yet. Start planning your next adventure!", renderTrips);

      const favs = favsRes.ok && favsRes.body && favsRes.body.data ? favsRes.body.data : [];
      setFeed(favsList, favs, "No favourites saved yet.", renderFavs);
    }).catch(function (err) {
      fb.banner(err.message || "Could not load your dashboard.", "is-error");
      setFeed(tripsList, [], "Could not load trips.", renderTrips);
      setFeed(favsList, [], "Could not load favourites.", renderFavs);
    });
  }

  function boot() {
    // no token → login
    if (!It.session.hasToken()) {
      It.session.redirectToLogin();
      return;
    }
    // token but profile fails → wipe + login (defensive)
    It.session.currentUser().then(function (user) {
      if (!user) {
        It.session.clearSession();
        It.session.redirectToLogin();
        return;
      }
      const role = It.session.roleOf(user);
      // dashboard is user-scoped — admins go to the admin shell
      if (It.session.isAdminRole(role)) {
        global.location.replace(It.CONFIG.role.admin);
        return;
      }
      if (role === "agency") {
        global.location.replace(It.CONFIG.role.agency);
        return;
      }
      load(user);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    const btn = el("logout-btn");
    if (btn) btn.addEventListener("click", function () { It.session.logout(); });
    boot();
  });
})(window);
