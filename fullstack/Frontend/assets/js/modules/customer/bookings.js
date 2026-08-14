/**
 * bookings.js — booking history (converted from React BookingsPage).
 * Rows from /v1/dashboard/trips with budget + full date range.
 * Depends on app-shell.js (It.app).
 */
(function (global) {
  "use strict";

  var It = global.Itinari;
  if (!It || !It.app) return;

  var list = document.getElementById("booking-list");

  var STATUS_LABEL = {
    pending: "Pending",
    planning: "Planning",
    booked: "Booked",
    completed: "Completed",
    cancelled: "Cancelled"
  };

  function fmt(value) {
    if (!value) return "—";
    return new Date(String(value).slice(0, 10) + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function formatDateRange(start, end) {
    var from = fmt(start);
    var to = new Date(String(end || "").slice(0, 10) + "T00:00:00");
    var year = isNaN(to.getTime()) ? "" : ", " + to.getFullYear();
    return from + " – " + fmt(end) + year;
  }

  function formatBudget(value) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
  }

  function rowFor(trip, index) {
    var status = trip.status || "pending";
    return '<a href="/trip.html?id=' + trip.id + '" class="trip-row anim-rise" style="animation-delay:' + Math.min(index * 70, 400) + 'ms;">' +
      '<span class="trip-row__no">#' + String(trip.id).padStart(2, "0") + "</span>" +
      '<span class="trip-row__body">' +
      '<span class="trip-row__title">' + It.app.esc(trip.title) + "</span>" +
      '<span class="trip-row__sub">' + It.app.esc(trip.travel_style || "") + " · " + (trip.no_of_days || "—") + " days · " +
      (trip.no_of_travelers || "—") + " traveler" + (trip.no_of_travelers === 1 ? "" : "s") + " · " + formatBudget(trip.budget) + "</span></span>" +
      '<span class="trip-row__dates">' + formatDateRange(trip.start_date, trip.end_date) + "</span>" +
      '<span class="trip-status trip-status--' + It.app.esc(status) + '">' + (STATUS_LABEL[status] || status) + "</span>" +
      '<span class="trip-row__arrow">→</span></a>';
  }

  It.app.boot(function () {
    It.apiGet("/v1/dashboard/trips", { auth: true }).then(function (res) {
      var items = It.app.unwrapData(res);
      if (!Array.isArray(items)) items = [];
      if (!items.length) {
        list.innerHTML = '<div class="empty" style="grid-column:1/-1;">' +
          '<span class="empty__icon">☑</span>' +
          '<p class="empty__title">No bookings yet.</p>' +
          '<p class="empty__text">Once you plan a trip, it shows up here as a booking with its current status.</p>' +
          '<a href="/trip-form.html" class="btn btn--primary">Plan your first trip</a></div>';
        return;
      }
      list.innerHTML = items.map(rowFor).join("");
    }).catch(function () {
      list.innerHTML = '<div class="error-card" style="grid-column:1/-1;">' +
        '<p>Could not load your bookings.</p>' +
        '<button type="button" class="btn btn--primary" onclick="location.reload()">Retry</button></div>';
    });
  });
})(window);
