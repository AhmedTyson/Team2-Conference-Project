/**
 * bookings.js — Booking history (app/bookings.html), luxury glass cards.
 * Merges /dashboard/trips & /orders with budget + full date range.
 * Follows trips.js pattern: raw apiGet responses, Tailwind markup.
 */
(function (global) {
  "use strict";

  var It = global.Itinera || (global.Itinera = {});

  var list = document.getElementById("booking-list");
  var filterPills = document.getElementById("booking-filter-pills");
  var FILTER = "all";

  function esc(str) {
    if (str == null) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  var STATUS_LABEL = {
    pending: "Pending",
    planning: "Planning",
    booked: "Booked",
    completed: "Completed",
    cancelled: "Cancelled",
    paid: "Paid & Confirmed"
  };

  function statusBadgeClass(status) {
    if (status === "booked" || status === "paid") return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
    if (status === "completed") return "bg-sky-400/10 border-sky-400/30 text-sky-400";
    if (status === "cancelled") return "bg-rose-500/10 border-rose-500/30 text-rose-400";
    return "bg-amber-400/10 border-amber-400/30 text-amber-400";
  }

  function formatDate(value) {
    if (!value) return "—";
    var d = new Date(String(value).slice(0, 10) + "T00:00:00");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function formatDateRange(start, end) {
    var to = new Date(String(end || "").slice(0, 10) + "T00:00:00");
    var year = isNaN(to.getTime()) ? "" : ", " + to.getFullYear();
    return formatDate(start) + " → " + formatDate(end) + year;
  }

  function money(value) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
  }

  function chip(icon, text, extra) {
    return '<span class="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1.5 ' + (extra || "") + '"><i class="fas ' + icon + ' text-amber-400 text-[10px]"></i> ' + text + "</span>";
  }

  function tripCard(trip) {
    var status = (trip.status || "planning").toLowerCase();
    var travelStyle = trip.travel_style ? trip.travel_style.charAt(0).toUpperCase() + trip.travel_style.slice(1) : "Bespoke";

    var specs = chip("fa-compass", esc(travelStyle)) +
      chip("fa-calendar-days", (trip.no_of_days || "—") + " Days") +
      chip("fa-users", (trip.no_of_travelers || 1) + " Traveler" + (trip.no_of_travelers === 1 ? "" : "s")) +
      (trip.budget != null ? '<span class="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1.5"><i class="fas fa-dollar-sign text-[10px]"></i> ' + Number(trip.budget).toLocaleString() + "</span>" : "");

    return '<div class="group relative rounded-3xl bg-white/5 border border-white/10 p-6 shadow-xl hover:border-amber-400/40 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between space-y-6 cursor-pointer" onclick="window.location.href=\'trip.html?id=' + trip.id + '\'">' +
      '<div class="space-y-4">' +
        '<div class="flex items-center justify-between flex-wrap gap-2">' +
          '<span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ' + statusBadgeClass(status) + '"><i class="fas fa-route text-[9px] mr-1"></i>' + (STATUS_LABEL[status] || status) + "</span>" +
          '<span class="text-xs text-white/40 font-mono font-semibold">#' + String(trip.id).padStart(2, "0") + "</span>" +
        "</div>" +
        '<h3 class="text-xl font-bold text-white group-hover:text-amber-400 transition leading-snug line-clamp-1">' + esc(trip.title) + "</h3>" +
        '<div class="flex items-center gap-2 flex-wrap text-xs text-white/60 font-medium">' + specs + "</div>" +
      "</div>" +
      '<div class="flex items-center justify-between border-t border-white/10 pt-4 text-xs">' +
        '<span class="text-white/50 flex items-center gap-1.5"><i class="fas fa-clock text-[10px] text-amber-400"></i> ' + formatDateRange(trip.start_date, trip.end_date) + "</span>" +
        '<span class="font-bold text-amber-400 group-hover:translate-x-1 transition flex items-center gap-1">View Itinerary <i class="fas fa-arrow-right text-[10px]"></i></span>' +
      "</div>" +
    "</div>";
  }

  function orderCard(order) {
    var status = (order.status || "paid").toLowerCase();
    var itemName = (order.items && order.items[0] && order.items[0].metadata && order.items[0].metadata.name) || "Direct Booking Transaction";
    var ref = order.confirmation_code || String("ORD-" + order.id);

    var meta = chip("fa-credit-card", "Paymob Gateway") +
      chip("fa-hashtag", esc(order.transaction_reference || "N/A")) +
      '<span class="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1.5"><i class="fas fa-coins text-[10px]"></i> ' + money(order.total_amount) + "</span>";

    return '<div class="group relative rounded-3xl bg-white/5 border border-amber-400/20 p-6 shadow-xl hover:border-amber-400/50 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between space-y-6">' +
      '<div class="space-y-4">' +
        '<div class="flex items-center justify-between flex-wrap gap-2">' +
          '<span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ' + statusBadgeClass(status) + '"><i class="fas fa-circle-check text-[9px] mr-1"></i>' + (STATUS_LABEL[status] || status) + "</span>" +
          '<span class="text-xs text-amber-400/60 font-mono font-semibold">' + esc(ref) + "</span>" +
        "</div>" +
        '<h3 class="text-xl font-bold text-white leading-snug line-clamp-1">' + esc(itemName) + "</h3>" +
        '<div class="flex items-center gap-2 flex-wrap text-xs text-white/60 font-medium">' + meta + "</div>" +
      "</div>" +
      '<div class="flex items-center justify-between border-t border-white/10 pt-4 text-xs">' +
        '<span class="text-white/50 flex items-center gap-1.5"><i class="fas fa-clock-rotate-left text-[10px] text-amber-400"></i> Paid ' + formatDate(order.created_at) + "</span>" +
        '<span class="font-bold text-amber-400 flex items-center gap-1">Confirmed <i class="fas fa-shield-halved text-[10px]"></i></span>' +
      "</div>" +
    "</div>";
  }

  function sectionHeading(icon, label, count) {
    return '<div class="flex items-center gap-3 mb-6">' +
      '<span class="px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5"><i class="fas ' + icon + '"></i> ' + label + "</span>" +
      '<span class="text-xs text-white/40 font-bold">' + count + "</span>" +
      '<div class="flex-1 h-px bg-white/10"></div>' +
    "</div>";
  }

  function unwrap(raw) {
    var out = raw && raw.data !== undefined ? raw.data : (raw && raw.body ? (raw.body.data || raw.body) : raw);
    return Array.isArray(out) ? out : (out && Array.isArray(out.data) ? out.data : []);
  }

  function render(orders, trips) {
    setCount("all", orders.length + trips.length);
    setCount("orders", orders.length);
    setCount("trips", trips.length);

    if (!orders.length && !trips.length) {
      list.innerHTML = '<div class="py-16 text-center text-white/50 bg-white/5 rounded-3xl border border-white/10 space-y-4 max-w-lg mx-auto">' +
        '<div class="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto text-2xl shadow-lg shadow-amber-500/10">' +
          '<i class="fas fa-receipt"></i>' +
        "</div>" +
        '<h3 class="text-xl font-bold text-white mb-1">No Bookings Yet</h3>' +
        '<p class="text-sm text-white/60 mb-6">Once you plan a trip or place a booking, it shows up here with its current status.</p>' +
        '<a href="trip-form.html" class="px-6 py-2.5 rounded-full bg-amber-400 text-black text-xs font-bold hover:bg-amber-300 transition">Plan Your First Trip</a>' +
      "</div>";
      return;
    }

    var html = "";
    if (orders.length) {
      html += sectionHeading("fa-credit-card", "Confirmed Direct Reservations", orders.length);
      html += '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-group="orders">' + orders.map(orderCard).join("") + "</div>";
    }
    if (trips.length) {
      html += "<div class=\"pt-10\">" + sectionHeading("fa-suitcase-rolling", "Planned Trip Itineraries", trips.length) +
        '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-group="trips">' + trips.map(tripCard).join("") + "</div></div>";
    }
    list.innerHTML = html;
  }

  function setCount(filter, n) {
    if (!filterPills) return;
    var el = filterPills.querySelector('[data-count="' + filter + '"]');
    if (el) el.textContent = n;
  }

  function applyFilter() {
    if (!list) return;
    list.querySelectorAll("[data-group]").forEach(function (g) {
      var wrap = g.closest(".pt-10");
      var match = FILTER === "all" || g.getAttribute("data-group") === FILTER;
      g.style.display = match ? "" : "none";
      if (wrap) wrap.style.display = match ? "" : "none";
    });
  }

  function loadBookings() {
    if (!list) return;
    if (!It.session || !It.session.hasToken()) {
      list.innerHTML = '<div class="py-16 text-center text-white/50 bg-white/5 rounded-3xl border border-white/10 space-y-4 max-w-lg mx-auto">' +
        '<h3 class="text-xl font-bold text-white mb-2">Please Sign In</h3>' +
        '<p class="text-sm text-white/60 mb-6">You need an active user session to view your bookings.</p>' +
        '<a href="../auth/login.html" class="px-6 py-2.5 rounded-full bg-amber-400 text-black text-xs font-bold">Sign In to Account</a>' +
      "</div>";
      return;
    }

    Promise.all([
      It.apiGet("/dashboard/trips", { auth: true }),
      It.apiGet("/orders", { auth: true })
    ]).then(function (results) {
      render(unwrap(results[1]), unwrap(results[0]));
    }).catch(function () {
      list.innerHTML = '<div class="py-16 text-center text-white/50 bg-white/5 rounded-3xl border border-white/10 space-y-4 max-w-lg mx-auto">' +
        '<h3 class="text-xl font-bold text-white mb-2">Could Not Load Your Bookings</h3>' +
        '<p class="text-sm text-white/60 mb-6">Something went wrong on our side. Try again in a moment.</p>' +
        '<button type="button" class="px-5 py-2 rounded-full bg-amber-400 text-black text-xs font-bold" onclick="location.reload()">Retry Connection</button>' +
      "</div>";
    });
  }

  if (filterPills) {
    filterPills.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-filter]");
      if (!btn) return;
      FILTER = btn.getAttribute("data-filter");
      filterPills.querySelectorAll("[data-filter]").forEach(function (b) {
        var active = b === btn;
        b.className = active
          ? "px-4 py-2 rounded-full bg-amber-400 text-black font-bold text-xs shadow-md transition flex-shrink-0 cursor-pointer"
          : "px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-semibold text-xs transition flex-shrink-0 cursor-pointer";
      });
      applyFilter();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadBookings);
  } else {
    loadBookings();
  }
})(window);