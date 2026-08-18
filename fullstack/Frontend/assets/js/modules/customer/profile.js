/**
 * profile.js — profile overview (converted from React ProfileOverviewPage).
 * Hero + stat strip + activity feed + travel style card + trips/favourites/reviews previews.
 * Depends on app-shell.js (It.app).
 */
(function (global) {
  "use strict";

  var It = global.Itinera;
  if (!It || !It.app) return;

  var page = document.getElementById("profile-page");

  var TYPE_LABEL = {
    hotel: "Hotel", restaurant: "Restaurant", attraction: "Attraction",
    destination: "Destination", flight: "Flight"
  };
  var MARKERS = { trip: "\u2708", favourite: "\u2665", review: "\u2605", survey: "\u2726" };
  var ROLE_LABELS = { user: "Member", admin: "Admin", super_admin: "Super Admin" };
  var TRAVELER_LABELS = {
    solo: "Solo Traveler", couple: "Couple Traveler", family: "Family Traveler",
    friends: "Group Traveler", business: "Business Traveler"
  };

  function esc(v) { return It.app.esc(v); }
  function el(id) { return document.getElementById(id); }

  function roleLabel(role) {
    return ROLE_LABELS[role] || String(role).replaceAll("_", " ");
  }

  function travelerLabel(style) {
    if (!style || !style.trim()) return null;
    var key = style.trim().toLowerCase();
    if (TRAVELER_LABELS[key]) return TRAVELER_LABELS[key].toUpperCase();
    var words = style.trim().split(/\s+/).map(function (word) {
      var lower = word.toLowerCase();
      if (lower.length > 4 && lower.endsWith("ing")) return word.slice(0, -3) + "er";
      return word;
    });
    var last = words[words.length - 1] || "";
    var label = last.toLowerCase().endsWith("er") ? words.join(" ") : words.join(" ") + " Traveler";
    return label.toUpperCase();
  }

  function relativeTime(iso) {
    var then = new Date(iso).getTime();
    if (isNaN(then)) return "";
    var diff = Math.max(0, Date.now() - then);
    var minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return minutes + "m ago";
    var hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + "h ago";
    var days = Math.floor(hours / 24);
    if (days < 7) return days + "d ago";
    if (days < 30) return Math.floor(days / 7) + "w ago";
    if (days < 365) return Math.floor(days / 30) + "mo ago";
    return new Date(iso).toLocaleDateString();
  }

  function favName(f) {
    var item = f.item || null;
    return (item && (item.name || item.flight_number)) || TYPE_LABEL[f.favorable_type] || "Saved item";
  }

  function buildActivity(trips, favourites, reviews, surveys) {
    var entries = [];
    (trips || []).forEach(function (t) {
      entries.push({ kind: "trip", label: "Trip planned", title: t.title, href: "/trip.html?id=" + t.id, date: t.created_at });
    });
    (favourites || []).forEach(function (f) {
      entries.push({ kind: "favourite", label: "Saved to favourites", title: favName(f), href: "/entity.html?type=" + f.favorable_type + "&id=" + f.favorable_id, date: f.created_at });
    });
    (reviews || []).forEach(function (r) {
      entries.push({ kind: "review", label: "Reviewed · " + r.rating + "/5", title: (r.reviewable && r.reviewable.title) || "Item", href: "/entity.html?type=" + r.reviewable_type + "&id=" + r.reviewable_id, date: r.created_at });
    });
    (surveys || []).forEach(function (s) {
      entries.push({ kind: "survey", label: "Survey submitted", title: s.travel_style + " travel style", href: "/survey.html?id=" + s.id, date: s.created_at });
    });
    return entries.sort(function (a, b) { return new Date(b.date) - new Date(a.date); }).slice(0, 8);
  }

  function activityHtml(entries) {
    if (!entries.length) {
      return '<div class="profile-empty"><p>No activity yet — every trip you plan, place you save, review you write and survey you submit will land here.</p>' +
        '<div class="btn-row"><a href="/trip-form.html" class="btn btn--primary">Plan a trip</a>' +
        '<a href="/explore.html" class="btn btn--ghost">Explore</a></div></div>';
    }
    return '<div class="activity-feed">' + entries.map(function (entry, index) {
      return '<a href="' + esc(entry.href || "#") + '" class="activity-item anim-rise" style="animation-delay:' + Math.min(index * 55, 400) + 'ms;">' +
        '<span class="activity-item__marker activity-item__marker--' + entry.kind + '" aria-hidden="true">' + MARKERS[entry.kind] + "</span>" +
        '<span class="activity-item__body">' +
        '<span class="activity-item__label">' + esc(entry.label) + "</span>" +
        '<span class="activity-item__title">' + esc(entry.title) + "</span>" +
        '<span class="activity-item__date">' + relativeTime(entry.date) + "</span></span></a>";
    }).join("") + "</div>";
  }

  function tripsPreviewHtml(trips) {
    var head = '<div class="profile-section__head"><div><p class="page-section__eyebrow">Planner</p>' +
      '<h2 class="page-section__title">Your trips</h2></div><a href="/trips.html" class="profile-section__more">All trips →</a></div>';
    if (!trips.length) {
      return '<section class="profile-section">' + head + '<div class="profile-empty"><p>No trips planned yet.</p>' +
        '<a href="/trip-form.html" class="btn btn--primary">Plan your first trip</a></div></section>';
    }
    return '<section class="profile-section">' + head + '<div class="preview-grid">' +
      trips.slice(0, 4).map(function (t, index) {
        return '<a href="/trip.html?id=' + t.id + '" class="preview-card anim-rise" style="animation-delay:' + Math.min(index * 70, 400) + 'ms;">' +
          '<div class="preview-card__top"><h3 class="preview-card__title">' + esc(t.title) + "</h3>" +
          '<span class="trip-status trip-status--' + esc(t.status) + '">' + esc(t.status) + "</span></div>" +
          '<div class="preview-card__meta">' +
          '<span class="preview-card__meta-item"><b>' + esc(String(t.start_date || "").slice(0, 10)) + "</b>" +
          (t.end_date ? " → " + esc(String(t.end_date).slice(0, 10)) : "") + "</span>" +
          '<span class="preview-card__meta-item">' + t.no_of_days + " day" + (t.no_of_days === 1 ? "" : "s") + "</span>" +
          '<span class="preview-card__meta-item">' + t.no_of_travelers + " traveler" + (t.no_of_travelers === 1 ? "" : "s") + "</span>" +
          "</div></a>";
      }).join("") + "</div></section>";
  }

  function favouritesPreviewHtml(favourites) {
    var head = '<div class="profile-section__head"><div><p class="page-section__eyebrow">Saved places</p>' +
      '<h2 class="page-section__title">Favourites</h2></div><a href="/favourites.html" class="profile-section__more">All favourites →</a></div>';
    if (!favourites.length) {
      return '<section class="profile-section">' + head + '<div class="profile-empty"><p>Nothing saved yet.</p>' +
        '<a href="/explore.html" class="btn btn--primary">Browse the catalog</a></div></section>';
    }
    return '<section class="profile-section">' + head + '<div class="mini-tiles">' +
      favourites.slice(0, 4).map(function (f, index) {
        var item = f.item || null;
        var name = (item && (item.name || item.flight_number)) || "Saved item";
        var city = (item && item.destination && item.destination.city_name) || (item && item.city_name) || null;
        return '<a href="/entity.html?type=' + esc(f.favorable_type) + "&id=" + f.favorable_id + '" class="mini-tile anim-rise" style="animation-delay:' + Math.min(index * 60, 400) + 'ms;">' +
          It.app.imageHtml(item && item.image, name, "mini-tile__image") +
          '<span class="mini-tile__name">' + esc(name) + "</span>" +
          '<span class="mini-tile__sub">' + (TYPE_LABEL[f.favorable_type] || f.favorable_type) + (city ? " · " + esc(city) : "") + "</span></a>";
      }).join("") + "</div></section>";
  }

  function reviewPreviewHtml(reviews) {
    var head = '<div class="profile-section__head"><div><p class="page-section__eyebrow">Reviews</p>' +
      '<h2 class="page-section__title">Your verdicts</h2></div><a href="/my-reviews.html" class="profile-section__more">All reviews →</a></div>';
    var latest = (reviews || []).slice().sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); })[0];
    if (!latest) {
      return '<section class="profile-section">' + head + '<div class="profile-empty"><p>Nothing rated yet — visit the Explore pages and share your verdict.</p>' +
        '<a href="/explore.html" class="btn btn--primary">Start reviewing</a></div></section>';
    }
    return '<section class="profile-section">' + head +
      '<div class="review-preview anim-rise" style="animation-delay:0.2s;">' +
      '<div class="review-preview__top"><p class="review-preview__title">' + esc((latest.reviewable && latest.reviewable.title) || "Rated item") + "</p>" +
      '<span class="review-preview__date">' + relativeTime(latest.created_at) + "</span></div>" +
      It.app.starsHtml(latest.rating) +
      (latest.comment ? '<p class="review-preview__comment">' + esc(latest.comment) + "</p>" : "") +
      "</div></section>";
  }

  function travelStyleCard(surveys) {
    var latest = (surveys || []).slice().sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); })[0];
    var head = '<div class="profile-section__head"><div><p class="page-section__eyebrow">Travel style</p>' +
      '<h2 class="page-section__title">On record</h2></div>';
    if (!latest) {
      return '<section class="profile-section">' + head + '<a href="/survey-form.html" class="profile-section__more">New survey →</a></div>' +
        '<div class="profile-empty"><p>No surveys yet — tell us how you like to travel.</p>' +
        '<a href="/survey-form.html" class="btn btn--primary">Create your first survey</a></div></section>';
    }
    var interests = latest.interests || [];
    return '<section class="profile-section">' + head + '<a href="/survey.html?id=' + latest.id + '" class="profile-section__more">View survey →</a></div>' +
      '<a href="/survey.html?id=' + latest.id + '" class="travel-style anim-rise" style="animation-delay:0.15s;">' +
      '<p class="travel-style__eyebrow">Latest survey</p>' +
      '<p class="travel-style__name">' + esc(latest.travel_style) + "</p>" +
      '<div class="travel-style__chips"><span class="chip chip--on-dark">' +
      esc(String(latest.budget_level || "").charAt(0).toUpperCase() + String(latest.budget_level || "").slice(1)) + " budget</span></div>" +
      (interests.length ? '<div class="travel-style__interests">' + interests.slice(0, 6).map(function (i) {
        return '<span class="chip chip--on-dark">' + esc(i) + "</span>";
      }).join("") + "</div>" : "") +
      "</a></section>";
  }

  It.app.boot(function (user) {
    if (!user) return;
    Promise.all([
      It.apiGet("/stats/summary", { auth: true }),
      It.apiGet("/dashboard/trips", { auth: true }),
      It.apiGet("/dashboard/favourites", { auth: true }),
      It.apiGet("/me/reviews", { auth: true }),
      It.apiGet("/surveys", { auth: true })
    ]).then(function (results) {
      var stats = It.app.unwrapData(results[0]) || {};
      var trips = It.app.unwrapData(results[1]);
      var favourites = It.app.unwrapData(results[2]);
      var reviews = It.app.unwrapData(results[3]);
      var surveys = It.app.unwrapData(results[4]);
      if (!Array.isArray(trips)) trips = [];
      if (!Array.isArray(favourites)) favourites = [];
      if (!Array.isArray(reviews)) reviews = [];
      if (!Array.isArray(surveys)) surveys = [];

      var statItems = [
        { label: "Trips planned", value: stats.total_trips },
        { label: "Trips completed", value: stats.trip_statistics && stats.trip_statistics.completed },
        { label: "Favourites", value: stats.total_favourites },
        { label: "Reviews", value: reviews.length },
        { label: "Surveys", value: surveys.length }
      ];
      var latestSurvey = surveys.slice().sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); })[0];
      var label = travelerLabel(latestSurvey && latestSurvey.travel_style);
      var surveyHref = latestSurvey ? "/survey.html?id=" + latestSurvey.id : "/survey-form.html";

      page.innerHTML =
        '<section class="profile-hero anim-rise">' +
        '<div class="profile-hero__identity anim-rise anim-rise--delay-1">' +
        '<p class="page-header__eyebrow">Profile</p>' +
        '<div class="profile-hero__avatar-frame">' +
        It.app.imageHtml(user.profile_image, user.name, "profile-hero__avatar") +
        "</div>" +
        '<h1 class="profile-hero__name">' + esc(user.name) + "</h1>" +
        '<p class="profile-hero__email">' + esc(user.email) + "</p>" +
        '<div class="profile-hero__roles">' + (user.roles || []).map(function (r) {
          return '<span class="chip">' + esc(roleLabel(r)) + "</span>";
        }).join("") + "</div>" +
        '<div class="profile-hero__actions"><a href="/profile.html" class="btn btn--ghost">Edit profile</a></div></div>' +

        '<a href="' + surveyHref + '" class="identity-plate anim-rise anim-rise--delay-2">' +
        '<span class="identity-plate__monogram" aria-hidden="true">' + esc(String(user.name || "?").trim().charAt(0).toUpperCase() || "?") + "</span>" +
        '<p class="identity-plate__eyebrow">✦ Travel identity</p>' +
        (label ? '<p class="identity-plate__label">' + esc(label) + "</p>"
               : '<p class="identity-plate__empty">No travel identity on record yet.</p>') +
        '<span class="identity-plate__foot">' + (latestSurvey ? "View survey" : "Create survey") +
        '<span class="identity-plate__arrow" aria-hidden="true">→</span></span></a>' +

        '<div class="stat-strip anim-rise anim-rise--delay-2">' + statItems.map(function (item) {
          return '<div class="stat-strip__item"><span class="stat-strip__value">' +
            (item.value === undefined || item.value === null ? "—" : esc(String(item.value))) + "</span>" +
            '<span class="stat-strip__label">' + esc(item.label) + "</span></div>";
        }).join("") + "</div></section>" +

        '<section class="profile-section"><div class="profile-section__head"><div>' +
        '<p class="page-section__eyebrow">Activity</p><h2 class="page-section__title">Recent activity</h2></div></div>' +
        activityHtml(buildActivity(trips, favourites, reviews, surveys)) + "</section>" +

        travelStyleCard(surveys) +

        '<div class="profile-body">' +
        tripsPreviewHtml(trips) +
        '<div class="profile-rail">' + favouritesPreviewHtml(favourites) + reviewPreviewHtml(reviews) + "</div></div>";
    }).catch(function () {
      page.innerHTML = '<div class="error-card"><p>Could not load your profile.</p>' +
        '<button type="button" class="btn btn--primary" onclick="location.reload()">Retry</button></div>';
    });
  });
})(window);
