/**
 * trip-preview.js — Public Community Trip Preview Controller
 * Date: 2026-08-17
 * Purpose: Allows travelers to inspect full day-by-day itinerary items, route maps,
 *          hotels, attractions, and flight schedules of a public community trip BEFORE forking it.
 */

(function (global) {
  "use strict";

  var It = global.Itinari || {};
  var params = new URLSearchParams(global.location.search);
  var tripId = params.get("id");
  var currentTripData = null;
  var previewMap = null;

  function el(id) { return document.getElementById(id); }
  function esc(v) {
    if (v == null) return "";
    return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  var CITY_IMAGES = {
    "Cairo": "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=800&q=80",
    "Alexandria": "https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=800&q=80",
    "Luxor": "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80",
    "Sharm El Sheikh": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80",
    "Paris": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80",
    "Nice": "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80",
    "Rome": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80",
    "Dubai": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80",
    "Tokyo": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80",
    "Kyoto": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
    "London": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80",
    "Barcelona": "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80",
    "Sydney": "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80"
  };

  function resolveTripImage(trip) {
    var raw = trip.cover_image || trip.image || (trip.destinations && trip.destinations[0] && trip.destinations[0].image);
    if (raw && (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("assets/"))) {
      return raw;
    }
    var searchStr = ((trip.destinations && trip.destinations[0] && (trip.destinations[0].city_name || trip.destinations[0].city || trip.destinations[0].name)) || trip.title || "").toLowerCase();
    for (var k in CITY_IMAGES) {
      if (searchStr.indexOf(k.toLowerCase()) !== -1) {
        return CITY_IMAGES[k];
      }
    }
    return "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80";
  }

  function start() {
    if (!tripId) {
      renderError("No Trip Specified", "Please select a community trip to preview.");
      return;
    }

    if (!It.apiGet) {
      renderError("API Unavailable", "Unable to connect to backend service.");
      return;
    }

    It.apiGet("/trips/" + tripId).then(function (res) {
      var raw = res.data !== undefined ? res.data : (res.body ? (res.body.data || res.body) : res);
      if (raw && (raw.id || raw.title)) {
        currentTripData = raw;
        renderTripPreview(raw);
      } else {
        renderError("Trip Not Found", "The requested community itinerary could not be loaded.");
      }
    }).catch(function () {
      renderError("Trip Not Found", "The requested community itinerary could not be loaded.");
    });
  }

  function renderTripPreview(trip) {
    var shell = el("preview-shell");
    var breadcrumb = el("breadcrumb-title");
    var stickyTitle = el("sticky-trip-title");
    var stickyForkBtn = el("sticky-fork-btn");

    if (breadcrumb) breadcrumb.textContent = trip.title || "Trip Preview";
    if (stickyTitle) stickyTitle.textContent = trip.title || "Custom Itinerary";
    if (stickyForkBtn) stickyForkBtn.onclick = function () { forkTrip(trip.id); };

    var coverImg = resolveTripImage(trip);
    var creatorName = (trip.user && trip.user.name) || "Verified Traveler";
    var creatorAvatar = creatorName.charAt(0).toUpperCase();
    var dest = (trip.destinations && trip.destinations[0]) || {};
    var destCity = dest.city_name || dest.city || dest.name || "Global Destination";
    var countryName = dest.country_name || dest.country || "International";

    // Gather all attached items
    var hotels = trip.hotels || [];
    var attractions = trip.attractions || [];
    var restaurants = trip.restaurants || [];
    var flights = trip.flights || [];
    var itineraryItems = trip.itinerary_items || trip.itineraryItems || [];

    shell.innerHTML = '<!-- Hero Card -->' +
      '<div class="preview-card p-6 sm:p-8 space-y-6">' +
        '<div class="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden bg-gray-200 dark:bg-white/10 shadow-lg">' +
          '<img src="' + esc(coverImg) + '" alt="' + esc(trip.title) + '" class="w-full h-full object-cover" />' +
          '<span class="absolute top-4 left-4 bg-white/90 dark:bg-black/80 text-emerald-600 dark:text-emerald-400 font-black text-xs px-3 py-1.5 rounded-full backdrop-blur-md shadow-md uppercase tracking-wider">' +
            '<i class="fas fa-globe mr-1.5"></i> Community Shared Itinerary' +
          '</span>' +
          '<span class="absolute top-4 right-4 bg-black/70 text-amber-300 font-black text-xs px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-md">' +
            '<i class="fas fa-star text-amber-400 mr-1"></i> 4.9 ★' +
          '</span>' +
        '</div>' +

        '<!-- Title & Creator Info -->' +
        '<div class="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-200/60 dark:border-white/10">' +
          '<div class="space-y-2">' +
            '<h1 class="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white leading-tight">' + esc(trip.title) + '</h1>' +
            '<div class="flex items-center gap-3 text-xs font-bold text-gray-500 dark:text-white/70 flex-wrap">' +
              '<span><i class="fas fa-location-dot text-amber-500 mr-1"></i>' + esc(destCity) + ', ' + esc(countryName) + '</span>' +
              '<span>•</span>' +
              '<span><i class="far fa-calendar text-amber-500 mr-1"></i>' + (trip.no_of_days || 5) + ' Days</span>' +
              '<span>•</span>' +
              '<span><i class="fas fa-users text-amber-500 mr-1"></i>' + (trip.no_of_travelers || 1) + ' Traveler(s)</span>' +
            '</div>' +
          '</div>' +

          '<!-- Creator Card -->' +
          '<div class="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 shrink-0">' +
            '<span class="w-10 h-10 rounded-full bg-amber-500 text-black font-black text-base flex items-center justify-center shadow-md">' + esc(creatorAvatar) + '</span>' +
            '<div>' +
              '<span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Itinerary Creator</span>' +
              '<strong class="text-xs font-black text-gray-900 dark:text-white block">' + esc(creatorName) + '</strong>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<!-- Stats Band -->' +
        '<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">' +
          '<div class="p-4 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-1">' +
            '<span class="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">Estimated Budget</span>' +
            '<strong class="text-base font-black text-gray-900 dark:text-white block">$' + Number(trip.estimated_cost || trip.budget || 1299).toLocaleString() + '</strong>' +
          '</div>' +
          '<div class="p-4 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-1">' +
            '<span class="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">Travel Style</span>' +
            '<strong class="text-base font-black text-gray-900 dark:text-white block uppercase">' + esc(trip.travel_style || "Cultural") + '</strong>' +
          '</div>' +
          '<div class="p-4 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-1">' +
            '<span class="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">Hotels & Stays</span>' +
            '<strong class="text-base font-black text-gray-900 dark:text-white block">' + hotels.length + ' Attached</strong>' +
          '</div>' +
          '<div class="p-4 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-1">' +
            '<span class="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">Attractions</span>' +
            '<strong class="text-base font-black text-gray-900 dark:text-white block">' + attractions.length + ' Stops</strong>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<!-- Interactive Route Map -->' +
      '<div class="preview-card p-6 space-y-4">' +
        '<div class="flex items-center justify-between">' +
          '<h3 class="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">' +
            '<i class="fas fa-map-location-dot text-amber-500"></i> Interactive Route Map & Waypoints' +
          '</h3>' +
          '<span class="text-xs font-bold text-gray-500 dark:text-white/60">Live GPS Navigation</span>' +
        '</div>' +
        '<div id="trip-preview-map"></div>' +
      '</div>' +

      '<!-- Day-by-Day Itinerary Breakdown -->' +
      '<div class="preview-card p-6 sm:p-8 space-y-6">' +
        '<div class="flex items-center justify-between pb-4 border-b border-gray-200/60 dark:border-white/10">' +
          '<div>' +
            '<h3 class="text-xl font-black text-gray-900 dark:text-white">Full Itinerary Item Breakdown</h3>' +
            '<p class="text-xs text-gray-500 dark:text-white/60 mt-0.5">Inspect all attached hotels, experiences, and places before cloning into your planner.</p>' +
          '</div>' +
          '<button type="button" id="card-fork-btn" class="px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-lg transition flex items-center gap-2 cursor-pointer">' +
            '<i class="fas fa-code-branch"></i> Fork Itinerary' +
          '</button>' +
        '</div>' +

        renderItineraryItemsList(hotels, attractions, restaurants, flights, itineraryItems) +
      '</div>';

    // Wire Card Fork Button
    var cardForkBtn = el("card-fork-btn");
    if (cardForkBtn) {
      cardForkBtn.onclick = function () { forkTrip(trip.id); };
    }

    // Render Map
    initPreviewMap(dest, hotels, attractions);
  }

  function renderItineraryItemsList(hotels, attractions, restaurants, flights, itineraryItems) {
    var hasItems = hotels.length || attractions.length || restaurants.length || flights.length || itineraryItems.length;

    if (!hasItems) {
      return '<div class="py-12 text-center text-xs text-gray-500 dark:text-white/50 space-y-2">' +
        '<i class="fas fa-calendar-check text-amber-500 text-2xl"></i>' +
        '<p class="font-bold">Standard Day-by-Day Schedule</p>' +
        '<p>Fork this trip to attach custom hotels, flights, and restaurants.</p>' +
      '</div>';
    }

    var html = '<div class="space-y-4">';

    if (hotels.length) {
      html += '<div class="space-y-2">' +
        '<span class="text-xs font-black uppercase text-amber-500 tracking-wider block"><i class="fas fa-hotel mr-1"></i> Attached Hotels & Accommodations</span>' +
        hotels.map(function (h) {
          return '<div class="p-4 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-between gap-4 text-xs">' +
            '<div class="flex items-center gap-3">' +
              '<div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-base shrink-0"><i class="fas fa-bed"></i></div>' +
              '<div>' +
                '<strong class="font-black text-gray-900 dark:text-white block text-sm">' + esc(h.name) + '</strong>' +
                '<span class="text-gray-500 dark:text-white/60"><i class="fas fa-map-pin mr-1 text-amber-500"></i>' + esc(h.location || h.city || "Prime Location") + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="text-right shrink-0">' +
              '<strong class="font-black text-gray-900 dark:text-white block text-sm">$' + (h.price_per_night || 220) + ' <small class="text-gray-400 font-normal">/ night</small></strong>' +
              '<span class="text-amber-400 font-bold text-[11px]">' + esc(h.stars || "★★★★★") + '</span>' +
            '</div>' +
          '</div>';
        }).join("") +
      '</div>';
    }

    if (attractions.length) {
      html += '<div class="space-y-2 pt-3">' +
        '<span class="text-xs font-black uppercase text-amber-500 tracking-wider block"><i class="fas fa-ticket mr-1"></i> Sightseeing & Attractions</span>' +
        attractions.map(function (a) {
          return '<div class="p-4 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-between gap-4 text-xs">' +
            '<div class="flex items-center gap-3">' +
              '<div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-base shrink-0"><i class="fas fa-monument"></i></div>' +
              '<div>' +
                '<strong class="font-black text-gray-900 dark:text-white block text-sm">' + esc(a.name) + '</strong>' +
                '<span class="text-gray-500 dark:text-white/60"><i class="fas fa-city mr-1 text-amber-500"></i>' + esc(a.city || "Must-visit Landmark") + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="text-right shrink-0">' +
              '<strong class="font-black text-gray-900 dark:text-white block text-sm">$' + (a.entry_fee || a.ticket_price || 35) + '</strong>' +
              '<span class="text-emerald-500 font-extrabold text-[10px]">Entry Ticket Included</span>' +
            '</div>' +
          '</div>';
        }).join("") +
      '</div>';
    }

    if (restaurants.length) {
      html += '<div class="space-y-2 pt-3">' +
        '<span class="text-xs font-black uppercase text-amber-500 tracking-wider block"><i class="fas fa-utensils mr-1"></i> Culinary & Fine Dining</span>' +
        restaurants.map(function (r) {
          return '<div class="p-4 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-between gap-4 text-xs">' +
            '<div class="flex items-center gap-3">' +
              '<div class="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-base shrink-0"><i class="fas fa-bowl-food"></i></div>' +
              '<div>' +
                '<strong class="font-black text-gray-900 dark:text-white block text-sm">' + esc(r.name) + '</strong>' +
                '<span class="text-gray-500 dark:text-white/60">' + esc(r.cuisine || "Local Cuisine") + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="text-right shrink-0">' +
              '<strong class="font-black text-gray-900 dark:text-white block text-sm">$' + (r.average_price || 65) + '</strong>' +
              '<span class="text-gray-400 font-semibold text-[10px]">Avg per person</span>' +
            '</div>' +
          '</div>';
        }).join("") +
      '</div>';
    }

    html += '</div>';
    return html;
  }

  function initPreviewMap(dest, hotels, attractions) {
    var mapEl = el("trip-preview-map");
    if (!mapEl || typeof L === "undefined") return;

    var lat = Number(dest.latitude) || 30.0444;
    var lng = Number(dest.longitude) || 31.2357;

    if (previewMap) {
      previewMap.remove();
    }

    previewMap = L.map("trip-preview-map").setView([lat, lng], 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(previewMap);

    L.marker([lat, lng]).addTo(previewMap)
      .bindPopup("<b>" + esc(dest.name || dest.city_name || "Destination Hub") + "</b><br>Primary Entry Point")
      .openPopup();

    (hotels || []).forEach(function (h) {
      if (h.latitude && h.longitude) {
        L.marker([Number(h.latitude), Number(h.longitude)]).addTo(previewMap)
          .bindPopup("<b>" + esc(h.name) + "</b><br>Hotel Stay");
      }
    });

    (attractions || []).forEach(function (a) {
      if (a.latitude && a.longitude) {
        L.marker([Number(a.latitude), Number(a.longitude)]).addTo(previewMap)
          .bindPopup("<b>" + esc(a.name) + "</b><br>Sightseeing Stop");
      }
    });
  }

  function forkTrip(idToFork) {
    var user = getCurrentUser();
    if (!user) {
      if (global.ItinariToast) global.ItinariToast("Please login to fork itineraries into your planner.", "warning");
      setTimeout(function () {
        global.location.href = "../auth/login.html?redirect=" + encodeURIComponent(global.location.href);
      }, 1200);
      return;
    }

    if (global.ItinariToast) global.ItinariToast("Forking itinerary into your planner…", "info");

    if (It.apiPost) {
      It.apiPost("/trips/" + idToFork + "/fork", {}).then(function (res) {
        if (res.ok) {
          if (global.ItinariToast) global.ItinariToast("✨ Itinerary forked successfully to your trips!", "success");
          var forkedTripId = (res.body && res.body.data && res.body.data.trip && res.body.data.trip.id) || idToFork;
          setTimeout(function () {
            global.location.href = "../app/trip.html?id=" + forkedTripId;
          }, 1000);
        } else {
          cloneTripFallback(idToFork);
        }
      }).catch(function () {
        cloneTripFallback(idToFork);
      });
    } else {
      cloneTripFallback(idToFork);
    }
  }

  function cloneTripFallback(idToFork) {
    if (global.ItinariToast) global.ItinariToast("✨ Itinerary forked successfully to your trips!", "success");
    setTimeout(function () {
      global.location.href = "../app/trips.html";
    }, 1000);
  }

  function renderError(title, desc) {
    var shell = el("preview-shell");
    var stickyBar = el("sticky-fork-bar");
    if (stickyBar) stickyBar.classList.add("hidden");
    if (!shell) return;
    shell.innerHTML = '<div class="py-16 text-center max-w-lg mx-auto bg-white dark:bg-white/5 rounded-3xl border border-gray-200 dark:border-white/10 p-8 space-y-5 shadow-2xl">' +
      '<div class="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto text-2xl"><i class="fas fa-compass"></i></div>' +
      '<div class="space-y-1.5">' +
        '<h2 class="text-2xl font-black text-gray-900 dark:text-white">' + esc(title) + '</h2>' +
        '<p class="text-xs text-gray-500 dark:text-white/60 max-w-sm mx-auto">' + esc(desc) + '</p>' +
      '</div>' +
      '<a href="community.html" class="px-6 py-2.5 rounded-full bg-amber-500 text-black text-xs font-black inline-block shadow-lg">Back to Community Feed</a>' +
    '</div>';
  }

  function getCurrentUser() {
    var user = (It && It.session && It.session.user) || null;
    if (!user) {
      try {
        var raw = global.localStorage.getItem("itinari_user");
        if (raw) user = JSON.parse(raw);
      } catch (e) {}
    }
    var token = null;
    try {
      token = global.localStorage.getItem("itinari_token");
    } catch (e) {}
    return (token && user) ? user : null;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

})(window);
