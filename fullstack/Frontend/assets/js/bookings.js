/**
 * bookings.js — booking history (converted from React BookingsPage).
 * Rows from /v1/dashboard/trips & /v1/orders with budget + full date range.
 * Depends on app-shell.js (It.app).
 */
(function (global) {
  "use strict";

  var It = global.Itinera;
  if (!It || !It.app) return;

  var list = document.getElementById("booking-list");

  var STATUS_LABEL = {
    pending: "Pending",
    planning: "Planning",
    booked: "Booked",
    completed: "Completed",
    cancelled: "Cancelled",
    paid: "Paid & Confirmed"
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

  function tripRowFor(trip, index) {
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

  function orderRowFor(order, index) {
    var status = order.status || "paid";
    var itemName = (order.items && order.items[0] && order.items[0].metadata && order.items[0].metadata.name) || "Direct Booking Transaction";
    return '<div class="trip-row anim-rise" style="animation-delay:' + Math.min(index * 70, 400) + 'ms;border-left:3px solid #f59e0b;">' +
      '<span class="trip-row__no">' + (order.confirmation_code || ('ORD-' + order.id)) + "</span>" +
      '<span class="trip-row__body">' +
      '<span class="trip-row__title">' + It.app.esc(itemName) + "</span>" +
      '<span class="trip-row__sub">Via Paymob Gateway · Ref: ' + It.app.esc(order.transaction_reference || 'N/A') + ' · Total: ' + formatBudget(order.total_amount) + "</span></span>" +
      '<span class="trip-row__dates">' + fmt(order.created_at) + "</span>" +
      '<span class="trip-status trip-status--booked">' + (STATUS_LABEL[status] || status.toUpperCase()) + "</span>" +
      '</div>';
  }

  It.app.boot(function () {
    Promise.all([
      It.apiGet("/dashboard/trips", { auth: true }),
      It.apiGet("/orders", { auth: true })
    ]).then(function (results) {
      var trips = It.app.unwrapData(results[0]);
      var orders = It.app.unwrapData(results[1]);
      if (!Array.isArray(trips)) trips = [];
      if (!Array.isArray(orders)) orders = [];

      if (!trips.length && !orders.length) {
        list.innerHTML = '<div class="empty" style="grid-column:1/-1;">' +
          '<span class="empty__icon">☑</span>' +
          '<p class="empty__title">No bookings yet.</p>' +
          '<p class="empty__text">Once you plan a trip or place a booking, it shows up here with its current status.</p>' +
          '<a href="/trip-form.html" class="btn btn--primary">Plan your first trip</a></div>';
        return;
      }

      var html = '';
      if (orders.length) {
        html += '<h3 style="font-size:1.1em;font-weight:600;margin:16px 0 10px 0;color:var(--color-text-title);">Confirmed Direct Reservations (' + orders.length + ')</h3>';
        html += orders.map(orderRowFor).join('');
      }

      if (trips.length) {
        html += '<h3 style="font-size:1.1em;font-weight:600;margin:24px 0 10px 0;color:var(--color-text-title);">Planned Trip Itineraries (' + trips.length + ')</h3>';
        html += trips.map(tripRowFor).join('');
      }

      list.innerHTML = html;
    }).catch(function () {
      list.innerHTML = '<div class="error-card" style="grid-column:1/-1;">' +
        '<p>Could not load your bookings.</p>' +
        '<button type="button" class="btn btn--primary" onclick="location.reload()">Retry</button></div>';
    });
  });
})(window);
