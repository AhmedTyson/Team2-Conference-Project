/**
 * flight-booking.js — Flight Booking informational page (flight-booking.html).
 * No live flight routes exist anywhere in the backend, so this page is
 * static demo content only: sample fares + payment method previews.
 * No API calls are made — by design (nothing to fetch).
 */
(function (global) {
  "use strict";

  const banner = document.querySelector(".demo-banner");
  if (banner) {
    banner.title = "There are no real flight routes in this project — the page shows sample data only.";
  }
})(window);
