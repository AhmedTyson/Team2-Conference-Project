/**
 * catalog.service.js — Centralized catalog inventory service.
 * Handles destinations, hotels, restaurants, attractions, regions, and search.
 */
(function (global) {
  "use strict";

  var It = global.Itinera || (global.Itinera = {});
  var Svc = It.services || (It.services = {});

  Svc.catalog = {
    getRegions: function () {
      return It.apiGet("/regions");
    },
    getDestinations: function (params) {
      var qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return It.apiGet("/destinations" + qs);
    },
    getDestination: function (id) {
      return It.apiGet("/destinations/" + id);
    },
    getHotels: function (params) {
      var qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return It.apiGet("/hotels" + qs);
    },
    getHotel: function (id) {
      return It.apiGet("/hotels/" + id);
    },
    getRestaurants: function (params) {
      var qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return It.apiGet("/restaurants" + qs);
    },
    getRestaurant: function (id) {
      return It.apiGet("/restaurants/" + id);
    },
    getAttractions: function (params) {
      var qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return It.apiGet("/attractions" + qs);
    },
    getAttraction: function (id) {
      return It.apiGet("/attractions/" + id);
    },
    getStatsSummary: function () {
      return It.apiGet("/stats/summary");
    }
  };
})(window);
