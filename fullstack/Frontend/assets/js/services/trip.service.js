/**
 * trip.service.js — Centralized trip & planning service client.
 */
(function (global) {
  "use strict";

  var It = global.Itinari || (global.Itinari = {});
  var Svc = It.services || (It.services = {});

  Svc.trip = {
    listTrips: function (params) {
      var qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return It.apiGet("/trips" + qs);
    },
    getTrip: function (id) {
      return It.apiGet("/trips/" + id);
    },
    createTrip: function (data) {
      return It.apiPost("/trips", data);
    },
    updateTrip: function (id, data) {
      return It.apiPut("/trips/" + id, data);
    },
    deleteTrip: function (id) {
      return It.apiDelete("/trips/" + id);
    },
    attachItem: function (tripId, itemType, itemId) {
      return It.apiPost("/trips/" + tripId + "/attach", {
        item_type: itemType,
        item_id: itemId
      });
    },
    detachItem: function (tripId, itemType, itemId) {
      return It.apiDelete("/trips/" + tripId + "/detach", {
        item_type: itemType,
        item_id: itemId
      });
    },
    getMapCoordinates: function (tripId) {
      return It.apiGet("/trips/" + tripId + "/map");
    }
  };
})(window);
