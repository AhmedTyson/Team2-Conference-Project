/**
 * weather.service.js — Centralized weather telemetry service.
 */
(function (global) {
  "use strict";

  var It = global.Itinera || (global.Itinera = {});
  var Svc = It.services || (It.services = {});

  Svc.weather = {
    getWeather: function (lat, lon) {
      return It.apiGet("/weather?lat=" + encodeURIComponent(lat) + "&lon=" + encodeURIComponent(lon));
    }
  };
})(window);
