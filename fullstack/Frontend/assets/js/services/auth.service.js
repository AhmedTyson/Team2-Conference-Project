/**
 * auth.service.js — Centralized authentication service client.
 * Interacts with Itinari.api and Itinari.session.
 */
(function (global) {
  "use strict";

  var It = global.Itinari || (global.Itinari = {});
  var Svc = It.services || (It.services = {});

  Svc.auth = {
    login: function (credentials) {
      return It.apiPost("/login", credentials);
    },
    register: function (data) {
      return It.apiPost("/register", data);
    },
    forgotPassword: function (email) {
      return It.apiPost("/forgot", { email: email });
    },
    resetPassword: function (data) {
      return It.apiPost("/reset", data);
    },
    resendVerification: function (email) {
      return It.apiPost("/email/resend", { email: email });
    },
    getProfile: function () {
      return It.apiGet("/me");
    },
    updateProfile: function (data) {
      return It.apiPut("/me", data);
    },
    logout: function () {
      return It.session ? It.session.logout() : Promise.resolve();
    }
  };
})(window);
