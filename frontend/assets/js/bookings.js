/**
 * bookings.js — My Previous Bookings page.
 * Trip / booking history from GET /v1/dashboard/trips (status chips:
 * pending / planning / booked / completed / cancelled) + membership from
 * GET /v1/me/subscription with cancel via POST /v1/me/subscription/cancel.
 * "View itinerary" uses the same active-trip handoff as the legacy planner
 * (localStorage "tp_active_trip" + itinerary.html).
 */
(function (global) {
  "use strict";

  const It = global.Itinari;
  const $ = function (id) { return document.getElementById(id); };

  const STATUS_LABELS = {
    pending: { label: "Pending", cls: "is-pending" },
    planning: { label: "Planning", cls: "is-planning" },
    booked: { label: "Booked", cls: "is-booked" },
    completed: { label: "Completed", cls: "is-completed" },
    cancelled: { label: "Cancelled", cls: "is-cancelled" },
  };

  let allTrips = [];
  let activeFilter = "all";

  function money(value) {
    const n = Number(value);
    if (!isFinite(n)) return "–";
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
    } catch (e) {
      return "$" + n.toFixed(2);
    }
  }

  function fmtDate(d) {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    return dt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function openItinerary(tripId) {
    try { localStorage.setItem("tp_active_trip", String(tripId)); } catch (e) { /* private mode */ }
    global.location.href = "itinerary.html";
  }

  function buildRow(trip) {
    const row = document.createElement("div");
    row.className = "booking-row";
    row.dataset.status = trip.status || "pending";

    const icon = document.createElement("div");
    icon.className = "booking-icon";
    const st = (trip.status || "").toLowerCase();
    icon.innerHTML = st === "completed"
      ? '<i class="fas fa-check-circle"></i>'
      : st === "cancelled"
        ? '<i class="fas fa-times-circle"></i>'
        : st === "booked"
          ? '<i class="fas fa-ticket-alt"></i>'
          : '<i class="fas fa-map-marked-alt"></i>';

    const main = document.createElement("div");
    main.className = "booking-main";
    const h3 = document.createElement("h3");
    h3.textContent = trip.title || "Untitled trip";
    const p = document.createElement("p");
    const parts = [];
    if (trip.no_of_days) parts.push(trip.no_of_days + " days");
    if (trip.no_of_travelers) parts.push(trip.no_of_travelers + " traveler" + (trip.no_of_travelers === 1 ? "" : "s"));
    if (trip.travel_style) parts.push(trip.travel_style);
    if (trip.activity_count != null) parts.push(trip.activity_count + " activities");
    p.textContent = parts.join(" · ") || "Trip details";
    main.appendChild(h3);
    main.appendChild(p);

    const actions = document.createElement("div");
    actions.className = "booking-actions";
    const viewBtn = document.createElement("button");
    viewBtn.type = "button";
    viewBtn.className = "btn-outline";
    viewBtn.innerHTML = '<i class="fas fa-route"></i> View itinerary';
    viewBtn.addEventListener("click", function () { openItinerary(trip.id); });
    actions.appendChild(viewBtn);
    main.appendChild(actions);

    const side = document.createElement("div");
    side.className = "booking-side";

    const chip = document.createElement("span");
    const meta = STATUS_LABELS[trip.status] || { label: trip.status || "Pending", cls: "is-pending" };
    chip.className = "chip " + meta.cls;
    chip.textContent = meta.label;
    side.appendChild(chip);

    const amount = document.createElement("div");
    amount.className = "amount";
    amount.textContent = money(trip.estimated_cost != null ? trip.estimated_cost : trip.budget);
    side.appendChild(amount);

    const dates = document.createElement("div");
    dates.className = "dates";
    dates.textContent = trip.start_date
      ? fmtDate(trip.start_date) + (trip.end_date ? " – " + fmtDate(trip.end_date) : "")
      : "Saved " + fmtDate(trip.created_at);
    side.appendChild(dates);

    row.appendChild(icon);
    row.appendChild(main);
    row.appendChild(side);
    return row;
  }

  function renderTrips() {
    const list = $("bookings-list");
    const empty = $("bookings-empty");
    list.innerHTML = "";

    const visible = activeFilter === "all"
      ? allTrips
      : allTrips.filter(function (t) { return (t.status || "pending") === activeFilter; });

    if (!visible.length) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    visible.forEach(function (t) { list.appendChild(buildRow(t)); });
  }

  function loadTrips() {
    It.apiGet("/v1/dashboard/trips")
      .then(function (r) {
        if (!r.ok) {
          It.feedback.banner((r.body && (r.body.message || r.body.error)) || "Could not load your trips.", "is-error");
          return;
        }
        allTrips = r.body.data || [];
        renderTrips();
      })
      .catch(function () {
        It.feedback.banner("Could not reach the server. Please try again.", "is-error");
        $("bookings-list").innerHTML = "";
        $("bookings-empty").hidden = false;
      });
  }

  function statusOf(subscription) {
    const raw = (subscription && subscription.status) || "";
    if (raw === "active") return "Active";
    if (raw === "cancelled") return "Cancelled";
    if (raw === "expired") return "Expired";
    return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "Free";
  }

  function renderMembership(data) {
    const chip = $("mem-status");
    const body = $("mem-body");
    if (!data) {
      chip.className = "chip is-planning";
      chip.textContent = "Free";
      body.innerHTML = '<div class="mem-note"><i class="fas fa-info-circle"></i> You are on the free plan. Upgrade anytime to unlock more features.</div>';
      return;
    }

    const isCancelled = data.status === "cancelled";
    chip.className = "chip " + (isCancelled ? "is-cancelled" : "is-booked");
    chip.textContent = statusOf(data);

    const plan = data.plan || {};
    const rows = [];
    if (plan.name) rows.push('<div class="mem-row"><span>Plan</span><b>' + plan.name + "</b></div>");
    if (data.price_cents != null) rows.push('<div class="mem-row"><span>Price</span><b>' + money(data.price_cents / 100) + "</b></div>");
    if (data.currency) rows.push('<div class="mem-row"><span>Currency</span><b>' + data.currency + "</b></div>");
    if (data.started_at) rows.push('<div class="mem-row"><span>Started</span><b>' + fmtDate(data.started_at) + "</b></div>");
    if (data.renews_at && !isCancelled) rows.push('<div class="mem-row"><span>Renews</span><b>' + fmtDate(data.renews_at) + "</b></div>");
    if (data.ends_at) rows.push('<div class="mem-row"><span>Ends</span><b>' + fmtDate(data.ends_at) + "</b></div>");

    let html = rows.join("");
    if (plan.features && plan.features.length) {
      html += '<div class="mem-note"><i class="fas fa-star"></i> ' +
        plan.features.slice(0, 3).map(function (f) {
          return String(f).replace(/_/g, " ");
        }).join(" · ") +
        "</div>";
    }

    if (!isCancelled && data.status === "active") {
      html += '<button type="button" id="cancel-sub-btn" class="btn-danger-outline"><i class="fas fa-ban"></i> Cancel subscription</button>';
    }
    body.innerHTML = html;

    const cancelBtn = $("cancel-sub-btn");
    if (cancelBtn) cancelBtn.addEventListener("click", cancelSubscription);
  }

  function loadMembership() {
    It.apiGet("/v1/me/subscription")
      .then(function (r) {
        if (!r.ok) {
          const chip = $("mem-status");
          if (chip) {
            chip.className = "chip is-cancelled";
            chip.textContent = "Unavailable";
          }
          return;
        }
        renderMembership(r.body.data || null);
      })
      .catch(function () {
        const chip = $("mem-status");
        if (chip) {
          chip.className = "chip is-cancelled";
          chip.textContent = "Unavailable";
        }
        const body = $("mem-body");
        if (body) body.innerHTML = '<div class="mem-note">Could not load membership. Please try again.</div>';
      });
  }

  function cancelSubscription() {
    const btn = $("cancel-sub-btn");
    It.feedback.loading(btn, true);
    It.apiPost("/v1/me/subscription/cancel", {}, {})
      .then(function (r) {
        It.feedback.loading(btn, false);
        if (r.ok) {
          It.feedback.toast("Subscription cancelled.", "ok");
          loadMembership();
        } else {
          It.feedback.banner((r.body && (r.body.message || r.body.error)) || "Could not cancel subscription.", "is-error");
          loadMembership();
        }
      })
      .catch(function () {
        It.feedback.loading(btn, false);
        It.feedback.banner("Could not reach the server. Please try again.", "is-error");
      });
  }

  // Filter pills
  $("trip-filter").addEventListener("click", function (e) {
    const btn = e.target.closest("button[data-filter]");
    if (!btn) return;
    activeFilter = btn.dataset.filter;
    document.querySelectorAll("#trip-filter button").forEach(function (b) {
      b.classList.toggle("is-active", b === btn);
    });
    renderTrips();
  });

  // Sidebar user block
  It.session.currentUser().then(function (user) {
    if (!user) {
      It.session.redirectToLogin();
      return;
    }
    const nameEl = $("user-display-name");
    const roleEl = $("user-display-role");
    if (nameEl) nameEl.textContent = user.name || "Member";
    if (roleEl) {
      const role = It.session.roleOf(user);
      roleEl.textContent = role ? role.replace(/_/g, " ") : "Member";
    }
    const avatar = $("avatar-letters");
    if (avatar && user.name) avatar.textContent = user.name.charAt(0).toUpperCase();
  });

  const logoutBtn = $("logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", function () { It.session.logout(); });

  loadTrips();
  loadMembership();
})(window);
