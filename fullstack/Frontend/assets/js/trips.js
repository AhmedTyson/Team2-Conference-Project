/**
 * trips.js — Modern luxury trip list catalog manager (app/trips.html).
 * Fetches user trips from /api/dashboard/trips and renders glassmorphic itinerary cards with status filtering.
 */
(function (global) {
  "use strict";

  var It = global.Itinera || (global.Itinera = {});

  var list = document.getElementById("trip-list");
  var filterPills = document.getElementById("trip-filter-pills");
  var ALL_TRIPS = [];
  var FILTER_STATUS = "all";

  function esc(str) {
    if (str == null) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  var STATUS_LABEL = {
    pending: "Planning",
    planning: "Planning",
    planned: "Planning",
    booked: "Booked",
    completed: "Completed",
    cancelled: "Cancelled"
  };

  function formatDate(value) {
    if (!value) return "—";
    var d = new Date(String(value).slice(0, 10) + "T00:00:00");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function rowFor(trip, index) {
    var status = (trip.status || "planning").toLowerCase();
    var statusBadgeClass = "bg-amber-400/10 border-amber-400/30 text-amber-400";
    if (status === "booked") statusBadgeClass = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
    else if (status === "completed") statusBadgeClass = "bg-sky-400/10 border-sky-400/30 text-sky-400";
    else if (status === "cancelled") statusBadgeClass = "bg-rose-500/10 border-rose-500/30 text-rose-400";

    var travelStyle = trip.travel_style ? trip.travel_style.charAt(0).toUpperCase() + trip.travel_style.slice(1) : "Bespoke";

    return '<div class="group relative rounded-3xl bg-white/5 border border-white/10 p-6 shadow-xl hover:border-amber-400/40 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between space-y-6 cursor-pointer" onclick="window.location.href=\'trip.html?id=' + trip.id + '\'">' +
      '<div class="space-y-4">' +
        '<!-- Header Badge Row -->' +
        '<div class="flex items-center justify-between flex-wrap gap-2">' +
          '<span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ' + statusBadgeClass + '">' +
            (STATUS_LABEL[status] || status) +
          '</span>' +
          '<span class="text-xs text-white/40 font-mono font-semibold">#' + String(trip.id).padStart(2, "0") + '</span>' +
        '</div>' +

        '<!-- Trip Title -->' +
        '<h3 class="text-xl font-bold text-white group-hover:text-amber-400 transition leading-snug line-clamp-1">' + esc(trip.title) + '</h3>' +

        '<!-- Specs Badges -->' +
        '<div class="flex items-center gap-2 flex-wrap text-xs text-white/60 font-medium">' +
          '<span class="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1.5"><i class="fas fa-compass text-amber-400 text-[10px]"></i> ' + esc(travelStyle) + '</span>' +
          '<span class="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1.5"><i class="fas fa-calendar-days text-amber-400 text-[10px]"></i> ' + (trip.no_of_days || "—") + ' Days</span>' +
          '<span class="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1.5"><i class="fas fa-users text-amber-400 text-[10px]"></i> ' + (trip.no_of_travelers || 1) + ' Travelers</span>' +
          (trip.budget != null ? '<span class="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1.5"><i class="fas fa-dollar-sign text-[10px]"></i> ' + Number(trip.budget).toLocaleString() + '</span>' : '') +
        '</div>' +
      '</div>' +

      '<!-- Footer Dates & Link Row -->' +
      '<div class="flex items-center justify-between border-t border-white/10 pt-4 text-xs">' +
        '<span class="text-white/50 flex items-center gap-1.5"><i class="fas fa-clock text-[10px] text-amber-400"></i> ' + formatDate(trip.start_date) + ' → ' + formatDate(trip.end_date) + '</span>' +
        '<span class="font-bold text-amber-400 group-hover:translate-x-1 transition flex items-center gap-1">View Itinerary <i class="fas fa-arrow-right text-[10px]"></i></span>' +
      '</div>' +
    '</div>';
  }

  function renderTrips() {
    if (!list) return;
    var filtered = ALL_TRIPS.filter(function (t) {
      if (FILTER_STATUS === "all") return true;
      var s = (t.status || "planning").toLowerCase();
      if (FILTER_STATUS === "planning") return s === "planning" || s === "pending" || s === "planned";
      return s === FILTER_STATUS;
    });

    if (!filtered.length) {
      list.innerHTML = '<div class="col-span-full py-16 text-center text-white/50 bg-white/5 rounded-3xl border border-white/10 my-4 space-y-4 max-w-lg mx-auto">' +
        '<div class="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto text-2xl shadow-lg shadow-amber-500/10">' +
          '<i class="fas fa-suitcase-rolling"></i>' +
        '</div>' +
        '<h3 class="text-xl font-bold text-white mb-1">No Trips Found</h3>' +
        '<p class="text-sm text-white/60 mb-6">Sketch out your next luxury journey — pick dates, a travel style, and attach luxury stays.</p>' +
        '<a href="trip-form.html" class="px-6 py-2.5 rounded-full bg-amber-400 text-black text-xs font-bold hover:bg-amber-300 transition">Plan Your First Trip</a>' +
      '</div>';
      return;
    }

    list.innerHTML = filtered.map(rowFor).join("");
  }

  function loadTrips() {
    if (!list) return;
    if (!It.session || !It.session.hasToken()) {
      list.innerHTML = '<div class="col-span-full py-16 text-center text-white/50 bg-white/5 rounded-3xl border border-white/10 my-4 space-y-4 max-w-lg mx-auto">' +
        '<h3 class="text-xl font-bold text-white mb-2">Please Sign In</h3>' +
        '<p class="text-sm text-white/60 mb-6">You need an active user session to view and manage your travel itineraries.</p>' +
        '<a href="../auth/login.html" class="px-6 py-2.5 rounded-full bg-amber-400 text-black text-xs font-bold">Sign In to Account</a>' +
      '</div>';
      return;
    }

    It.apiGet("/dashboard/trips", { auth: true }).then(function (res) {
      var raw = res.data !== undefined ? res.data : (res.body ? (res.body.data || res.body) : res);
      ALL_TRIPS = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.data) ? raw.data : []);
      renderTrips();
    }).catch(function () {
      list.innerHTML = '<div class="col-span-full py-16 text-center text-white/50 bg-white/5 rounded-3xl border border-white/10 my-4">' +
        '<p class="text-base font-bold text-white mb-2">Could Not Load Your Trips</p>' +
        '<button type="button" class="px-5 py-2 rounded-full bg-amber-400 text-black text-xs font-bold" onclick="location.reload()">Retry Connection</button></div>';
    });
  }

  if (filterPills) {
    filterPills.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-status]");
      if (!btn) return;
      FILTER_STATUS = btn.getAttribute("data-status");
      filterPills.querySelectorAll("[data-status]").forEach(function (b) {
        var active = b === btn;
        b.className = active
          ? "px-4 py-2 rounded-full bg-amber-400 text-black font-bold text-xs shadow-md transition flex-shrink-0 cursor-pointer"
          : "px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-semibold text-xs transition flex-shrink-0 cursor-pointer";
      });
      renderTrips();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadTrips);
  } else {
    loadTrips();
  }
})(window);
