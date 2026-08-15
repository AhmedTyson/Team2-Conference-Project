/**
 * home.js — customer home page (converted from React HomePage).
 * Hero + ticker + dashboard stats + weather + features + destinations.
 * Depends on app-shell.js (It.app).
 */
(function (global) {
  "use strict";

  var It = global.Itinari;
  if (!It || !It.app) return;

  var WORDS = ["DESTINATIONS", "HOTELS", "RESTAURANTS", "ATTRACTIONS", "TRIPS", "SURVEYS", "REVIEWS", "PLANS", "FAVOURITES"];

  var WEATHER_CODES = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Icy fog", 51: "Light drizzle", 61: "Light rain",
    63: "Rain", 71: "Light snow", 80: "Light showers", 95: "Thunderstorm",
  };

  var FEATURES = [
    { to: "/explore.html", title: "Explore the catalog", text: "Destinations, hotels, restaurants, attractions — all live.", icon: "⌂" },
    { to: "/surveys.html", title: "Tell us your style", text: "A three-question survey shapes every plan.", icon: "✦" },
    { to: "/trips.html", title: "Sketch a trip", text: "Dates, budget, vibe — attach places as you go.", icon: "✈" },
    { to: "/plans.html", title: "Pick a plan", text: "Free, Pro or Business — switch any time.", icon: "◈" },
  ];

  function el(id) { return document.getElementById(id); }

  function renderTicker() {
    var track = el("ticker-content");
    if (!track) return;
    var html = "";
    for (var copy = 0; copy < 2; copy++) {
      WORDS.forEach(function (w) {
        html += '<span class="ticker__word">' + w + ' <span class="ticker__star">✦</span></span>';
      });
    }
    track.innerHTML = html;
  }

  function renderFeatures() {
    var grid = el("feature-grid");
    if (!grid) return;
    grid.innerHTML = FEATURES.map(function (f) {
      return '<a href="' + f.to + '" class="feature-card">' +
        '<span class="feature-card__icon" aria-hidden="true">' + f.icon + "</span>" +
        '<h3 class="feature-card__title">' + It.app.esc(f.title) + "</h3>" +
        '<p class="feature-card__text">' + It.app.esc(f.text) + "</p>" +
        '<span class="feature-card__arrow">→</span></a>';
    }).join("");
  }

  function renderDestinations(items) {
    var grid = el("destinations-grid");
    if (!grid) return;
    grid.innerHTML = items.map(function (d) {
      return '<a href="/entity.html?type=destination&id=' + d.id + '" class="card card--tile">' +
        It.app.imageHtml(d.image, d.name, "card__media", "destinations") +
        '<div class="card__body">' +
        '<div class="card__topline"><span>' + It.app.esc((d.country && d.country.name) || "Destination") + "</span><span>→</span></div>" +
        '<h3 class="card__title">' + It.app.esc(d.name) + "</h3>" +
        '<p class="card__sub">' + It.app.esc(d.city_name || "") + "</p>" +
        "</div></a>";
    }).join("");
  }

  It.app.boot(function (user) {
    var eyebrow = el("hero-eyebrow");
    var title = el("hero-title");
    if (eyebrow) eyebrow.textContent = "Travel Planner";
    if (title) title.textContent = "Hello, " + (user && user.name ? user.name.split(" ")[0] : "there") + ".";

    if (user) {
      It.apiGet(It.CONFIG.routes.me, { auth: true }).then(function () { /* warm cache */ }).catch(function () { /* ignore */ });
    }

    It.apiGet("/v1/site-settings").then(function (res) {
      var data = It.app.unwrapData(res) || {};
      var lead = el("hero-lead");
      if (lead && data.tagline) lead.textContent = data.tagline;
      if (eyebrow && data.site_name) eyebrow.textContent = data.site_name;
    }).catch(function () { /* ignore */ });

    It.apiGet("/v1/stats/summary").then(function (res) {
      var stats = It.app.unwrapData(res);
      if (!stats) return;
      var sh = el("stat-hotels");
      var st = el("stat-tours");
      var sf = el("stat-flights");
      var sr = el("stat-reviews");
      if (sh && stats.hotels != null) sh.textContent = Number(stats.hotels).toLocaleString();
      if (st && stats.tours != null) st.textContent = Number(stats.tours).toLocaleString();
      if (sf && stats.flights != null) sf.textContent = Number(stats.flights).toLocaleString();
      if (sr && stats.reviews != null) sr.textContent = String(stats.reviews);
    }).catch(function () { /* ignore */ });

    if (user) {
      It.apiGet("/stats/summary", { auth: true }).then(function (res) {
        var data = It.app.unwrapData(res);
        if (!data) return;
        var t = el("stat-trips");
        var f = el("stat-favs");
        if (t) t.textContent = (data.total_trips || 0).toLocaleString();
        if (f) f.textContent = (data.total_favourites || 0).toLocaleString();
      }).catch(function () { /* ignore */ });
    }

    It.apiGet("/v1/destinations").then(function (res) {
      var items = It.app.unwrapData(res);
      if (Array.isArray(items) && items.length) renderDestinations(items.slice(0, 3));
    }).catch(function () { /* ignore */ });

    It.apiGet("/v1/destinations").then(function (res) {
      var items = It.app.unwrapData(res);
      if (!Array.isArray(items)) return;
      var coords = items.find(function (d) {
        return d.latitude != null && d.longitude != null && Number(d.latitude) !== 0;
      });
      return It.apiGet("/weather?lat=" + (coords ? coords.latitude : 30.04) + "&lon=" + (coords ? coords.longitude : 31.23));
    }).then(function (res) {
      var w = el("stat-weather");
      if (!w || !res || !res.ok || !res.body || !res.body.current_weather) return;
      var cw = res.body.current_weather;
      var label = WEATHER_CODES[cw.weathercode] || "Weather";
      w.textContent = cw.temperature + "° " + label;
    }).catch(function () { /* ignore */ });
  });

  function initSlideshow() {
    var slides = document.querySelectorAll(".hero-slide");
    var dots = document.querySelectorAll(".slider-dots .dot");
    if (!slides.length) return;
    
    var currentIdx = 0;
    var timer = null;

    function showSlide(idx) {
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === idx);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === idx);
      });
      currentIdx = idx;
    }

    function nextSlide() {
      var next = (currentIdx + 1) % slides.length;
      showSlide(next);
    }

    function resetTimer() {
      clearInterval(timer);
      timer = setInterval(nextSlide, 5000);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        showSlide(i);
        resetTimer();
      });
    });

    resetTimer();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initSlideshow();
  });

  renderTicker();
  renderFeatures();
})(window);
