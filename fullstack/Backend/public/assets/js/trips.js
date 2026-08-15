/**
 * trips.js — trip list (converted from React TripsPage).
 * Rows from /v1/dashboard/trips with status badges.
 * Depends on app-shell.js (It.app).
 */
(function (global) {
  "use strict";

  var It = global.Itinari;
  if (!It || !It.app) return;

  var list = document.getElementById("trip-list");

  var STATUS_LABEL = {
    pending: "Pending",
    planning: "Planning",
    booked: "Booked",
    completed: "Completed",
    cancelled: "Cancelled"
  };
  var STATUS_TONE = {
    pending: "warn",
    planning: "",
    booked: "ok",
    completed: "ok",
    cancelled: "danger"
  };

  function formatDate(value) {
    if (!value) return "—";
    var d = new Date(String(value).slice(0, 10) + "T00:00:00");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function rowFor(trip, index) {
    var status = trip.status || "pending";
    return '<a href="/trip.html?id=' + trip.id + '" class="trip-row anim-rise" style="animation-delay:' + Math.min(index * 70, 400) + 'ms;">' +
      '<span class="trip-row__no">#' + String(trip.id).padStart(2, "0") + "</span>" +
      '<span class="trip-row__body">' +
      '<span class="trip-row__title">' + It.app.esc(trip.title) + "</span>" +
      '<span class="trip-row__sub">' + It.app.esc(trip.travel_style || "") + " · " + (trip.no_of_days || "—") + " days · " +
      (trip.no_of_travelers || "—") + " traveler" + (trip.no_of_travelers === 1 ? "" : "s") + "</span></span>" +
      '<span class="trip-row__dates">' + formatDate(trip.start_date) + " → " + formatDate(trip.end_date) + "</span>" +
      '<span class="trip-status trip-status--' + It.app.esc(status) + '">' + (STATUS_LABEL[status] || status) + "</span>" +
      '<span class="trip-row__arrow">→</span></a>';
  }

  It.app.boot(function () {
    It.apiGet("/dashboard/trips", { auth: true }).then(function (res) {
      var items = It.app.unwrapData(res);
      if (!Array.isArray(items)) items = [];
      if (!items.length) {
        list.innerHTML = '<div class="empty" style="grid-column:1/-1;">' +
          '<span class="empty__icon">✈</span>' +
          '<p class="empty__title">No trips yet.</p>' +
          '<p class="empty__text">Sketch out your next journey — pick dates, a travel style, and build from there.</p>' +
          '<a href="/trip-form.html" class="btn btn--primary">Plan your first trip</a></div>';
        return;
      }
      list.innerHTML = items.map(rowFor).join("");
    }).catch(function () {
      list.innerHTML = '<div class="error-card" style="grid-column:1/-1;">' +
        '<p>Could not load your trips.</p>' +
        '<button type="button" class="btn btn--primary" onclick="location.reload()">Retry</button></div>';
    });
  });
})(window);
