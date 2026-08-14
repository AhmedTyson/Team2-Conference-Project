/**
 * commerce.service.js — Centralized commerce, checkout, and bookings service client.
 */
(function (global) {
  "use strict";

  var It = global.Itinari || (global.Itinari = {});
  var Svc = It.services || (It.services = {});

  Svc.commerce = {
    initiateCheckout: function (payload) {
      return It.apiPost("/checkout", payload);
    },
    getBookings: function () {
      return It.apiGet("/bookings");
    },
    getBooking: function (id) {
      return It.apiGet("/bookings/" + id);
    },
    getSubscriptions: function () {
      return It.apiGet("/subscriptions");
    }
  };
})(window);
