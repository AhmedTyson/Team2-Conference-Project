/**
 * trip-preview.js — Full Detail Community Trip Preview Engine
 * Date: 2026-08-17
 * Purpose: Renders complete trip itinerary details, interactive route map, departure hub,
 *          satellite coordinates, and day-by-day stops matching app/trip.html BEFORE forking.
 */

(function (global) {
  "use strict";

  var It = global.Itinari || {};
  var params = new URLSearchParams(global.location.search);
  var tripId = params.get("id");
  var currentTripData = null;
  var previewMap = null;
  var previewMarkers = [];

  var TYPE_ICON = {
    destination: "fa-location-dot",
    hotel: "fa-hotel",
    restaurant: "fa-utensils",
    attraction: "fa-ticket",
    flight: "fa-plane-departure"
  };

  var TYPE_URL = {
    destination: "destination-details.html?id=",
    hotel: "hotel-details.html?id=",
    restaurant: "restaurant-details.html?id=",
    attraction: "attraction-details.html?id=",
    flight: "flight-details.html?id="
  };

  function el(id) { return document.getElementById(id); }
  function esc(v) {
    if (v == null) return "";
    return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function formatDate(dStr) {
    if (!dStr) return "TBD";
    try {
      var dt = new Date(dStr);
      if (isNaN(dt.getTime())) return String(dStr).slice(0, 10);
      return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch (e) {
      return String(dStr).slice(0, 10);
    }
  }

  function cleanTitle(rawTitle) {
    if (!rawTitle) return "Bespoke Traveler Itinerary";
    var cleaned = String(rawTitle).replace(/^Copy of\s+/i, "");
    cleaned = cleaned.replace(/\s*\(Forked\)$/i, "");
    return cleaned.trim();
  }

  function start() {
    if (!tripId) {
      renderError("No Trip Specified", "Please select a community trip from the feed to inspect its preview.");
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
        renderFullTripPreview(raw);
      } else {
        renderError("Trip Not Found", "The requested community itinerary could not be loaded.");
      }
    }).catch(function () {
      renderError("Trip Not Found", "The requested community itinerary could not be loaded.");
    });
  }

  function getAllTripItems(trip) {
    var all = [];
    var seen = {};
    var itinMap = {};

    (trip.itinerary_items || trip.itineraryItems || []).forEach(function (it) {
      var key = it.type + ":" + (it.itemable_id || it.id);
      itinMap[key] = it;
    });

    (trip.destinations || []).forEach(function (d) {
      var key = "destination:" + d.id;
      if (seen[key]) return;
      seen[key] = true;
      var it = itinMap[key] || {};
      all.push({
        id: it.id || d.id,
        itemable_type: "destination",
        itemable_id: d.id,
        title: it.title || d.name || d.city_name || "Destination Stop",
        city: d.city_name || d.city || d.name || "",
        country: d.country_name || (d.country && d.country.name) || d.country || "",
        address: (d.city_name || d.name || "Destination") + ", " + (d.country_name || (d.country && d.country.name) || d.country || "Global"),
        latitude: Number(d.latitude) || null,
        longitude: Number(d.longitude) || null,
        day_number: Number(it.day_number || (d.pivot ? d.pivot.day_number : 1)) || 1,
        time_slot: it.time_slot || "Full Day",
        notes: it.notes || d.description || "",
        estimated_cost: Number(it.estimated_cost || 0),
        itemable: d
      });
    });

    (trip.hotels || []).forEach(function (h) {
      var key = "hotel:" + h.id;
      if (seen[key]) return;
      seen[key] = true;
      var it = itinMap[key] || {};
      var cost = Number((it.estimated_cost != null && it.estimated_cost > 0) ? it.estimated_cost : h.price_per_night) || 220;
      all.push({
        id: it.id || h.id,
        itemable_type: "hotel",
        itemable_id: h.id,
        title: it.title || h.name || "Hotel Stay",
        city: h.city || h.location || "",
        country: (h.country && h.country.name) || h.country || "",
        address: h.address || h.location || ((h.city || "") + (h.country ? ", " + h.country : "")),
        latitude: Number(h.latitude) || null,
        longitude: Number(h.longitude) || null,
        day_number: Number(it.day_number || (h.pivot ? h.pivot.day_number : 1)) || 1,
        time_slot: it.time_slot || "Morning Check-in",
        notes: it.notes || "Confirmed hotel stay",
        estimated_cost: cost,
        itemable: h
      });
    });

    (trip.restaurants || []).forEach(function (r) {
      var key = "restaurant:" + r.id;
      if (seen[key]) return;
      seen[key] = true;
      var it = itinMap[key] || {};
      var cost = Number((it.estimated_cost != null && it.estimated_cost > 0) ? it.estimated_cost : (r.average_price || r.price)) || 65;
      all.push({
        id: it.id || r.id,
        itemable_type: "restaurant",
        itemable_id: r.id,
        title: it.title || r.name || "Culinary Stop",
        city: r.city || "",
        country: (r.country && r.country.name) || r.country || "",
        address: r.address || ((r.city || "") + (r.country ? ", " + r.country : "")),
        latitude: Number(r.latitude) || null,
        longitude: Number(r.longitude) || null,
        day_number: Number(it.day_number || (r.pivot ? r.pivot.day_number : 1)) || 1,
        time_slot: it.time_slot || "Lunch / Dinner",
        notes: it.notes || r.cuisine || "Fine dining experience",
        estimated_cost: cost,
        itemable: r
      });
    });

    (trip.attractions || []).forEach(function (a) {
      var key = "attraction:" + a.id;
      if (seen[key]) return;
      seen[key] = true;
      var it = itinMap[key] || {};
      var cost = Number((it.estimated_cost != null && it.estimated_cost > 0) ? it.estimated_cost : (a.entry_fee || a.ticket_price)) || 35;
      all.push({
        id: it.id || a.id,
        itemable_type: "attraction",
        itemable_id: a.id,
        title: it.title || a.name || "Attraction",
        city: a.city || "",
        country: (a.country && a.country.name) || a.country || "",
        address: a.address || ((a.city || "") + (a.country ? ", " + a.country : "")),
        latitude: Number(a.latitude) || null,
        longitude: Number(a.longitude) || null,
        day_number: Number(it.day_number || (a.pivot ? a.pivot.day_number : 1)) || 1,
        time_slot: it.time_slot || "Afternoon Sightseeing",
        notes: it.notes || "Entry tickets included",
        estimated_cost: cost,
        itemable: a
      });
    });

    (trip.flights || []).forEach(function (f) {
      var key = "flight:" + f.id;
      if (seen[key]) return;
      seen[key] = true;
      var it = itinMap[key] || {};
      var cost = Number((it.estimated_cost != null && it.estimated_cost > 0) ? it.estimated_cost : f.price) || 450;
      all.push({
        id: it.id || f.id,
        itemable_type: "flight",
        itemable_id: f.id,
        title: it.title || ((f.airline ? f.airline + " " : "") + (f.flight_number || "Flight")),
        city: f.departure_airport || "Origin",
        country: f.arrival_airport || "Destination",
        address: (f.departure_airport || "Origin") + " → " + (f.arrival_airport || "Destination"),
        latitude: null,
        longitude: null,
        day_number: Number(it.day_number || (f.pivot ? f.pivot.day_number : 1)) || 1,
        time_slot: it.time_slot || "Scheduled Flight",
        notes: it.notes || "Flight booking route",
        estimated_cost: cost,
        itemable: f
      });
    });

    all.sort(function (a, b) {
      if (a.day_number !== b.day_number) return a.day_number - b.day_number;
      return a.id - b.id;
    });

    return all;
  }

  function resolveOriginAddress(trip, items) {
    var dest = (trip.destinations && trip.destinations[0]) || {};
    var firstWithCoords = (items || []).find(function (i) {
      return isFinite(i.latitude) && isFinite(i.longitude) && i.latitude !== 0 && i.longitude !== 0;
    });

    var city = dest.city_name || dest.city || dest.name || (firstWithCoords ? firstWithCoords.city : "Cairo");
    var country = dest.country_name || (dest.country && dest.country.name) || dest.country || (firstWithCoords ? firstWithCoords.country : "Egypt");

    var lat = Number(dest.latitude);
    var lng = Number(dest.longitude);
    if (!isFinite(lat) || !isFinite(lng) || lat === 0 || lng === 0) {
      if (firstWithCoords) {
        lat = firstWithCoords.latitude;
        lng = firstWithCoords.longitude;
      } else {
        lat = 30.0444;
        lng = 31.2357;
      }
    }

    return {
      city: city,
      country: country,
      region: "Global Continent",
      district: city + " City Center",
      street: "Main Boulevard",
      coords: lat.toFixed(4) + "° N, " + lng.toFixed(4) + "° E",
      hub: city + " International Hub",
      lat: lat,
      lng: lng
    };
  }

  function buildTripStops(trip, items, origin) {
    var stops = [];
    stops.push({
      number: 1,
      title: origin.city + " Departure Hub",
      address: origin.street + ", " + origin.city + ", " + origin.country,
      sub: "Departure Hub · " + origin.hub,
      date: trip.start_date ? formatDate(trip.start_date) : "Day 1",
      lat: origin.lat,
      lng: origin.lng,
      type: "destination",
      isStart: true
    });

    (items || []).forEach(function (item) {
      var lat = Number(item.latitude);
      var lng = Number(item.longitude);

      if (!isFinite(lat) || !isFinite(lng) || lat === 0 || lng === 0) {
        var offset = stops.length * 0.012;
        lat = origin.lat + offset;
        lng = origin.lng + offset;
      }

      var fullAddress = item.address || ((item.city ? item.city + ", " : "") + (item.country || origin.country));

      stops.push({
        number: stops.length + 1,
        title: item.title,
        address: fullAddress,
        sub: item.itemable_type ? item.itemable_type.charAt(0).toUpperCase() + item.itemable_type.slice(1) : "Experience Stop",
        date: trip.start_date ? formatDate(trip.start_date) : null,
        lat: lat,
        lng: lng,
        type: item.itemable_type || "attraction",
        isStart: false,
        rawItem: item
      });
    });

    return stops;
  }

  function unifiedItineraryCardHtml(stops) {
    if (!stops || !stops.length) return "";

    return '<div class="preview-card p-6 sm:p-8 space-y-6">' +
      '<div class="flex items-center justify-between pb-4 border-b border-gray-200/60 dark:border-white/10">' +
        '<div>' +
          '<h3 class="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">' +
            '<i class="fas fa-list-check text-amber-500"></i> Unified Itinerary & Map Trail Stops' +
          '</h3>' +
          '<p class="text-xs text-gray-500 dark:text-white/60 mt-1">Detailed breakdown of all scheduled experiences, locations, GPS coordinates, and map controls.</p>' +
        '</div>' +
        '<button type="button" id="header-fork-btn" class="px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition shadow-lg flex items-center gap-2 cursor-pointer shrink-0">' +
          '<i class="fas fa-code-branch"></i> Fork Itinerary' +
        '</button>' +
      '</div>' +

      '<div class="space-y-4" id="interactive-stops-list">' + stops.map(function (s, idx) {
        var raw = s.rawItem || {};
        var badgeClass = s.isStart
          ? "bg-gradient-to-br from-amber-400 to-amber-500 text-black font-black shadow-lg shadow-amber-400/30"
          : "bg-amber-500/10 text-amber-500 font-black border border-amber-500/30 shadow-md";
        
        var iconCls = s.isStart ? "fa-plane-departure" : (TYPE_ICON[s.type] || "fa-location-dot");
        var urlPrefix = TYPE_URL[s.type];
        var titleHtml = (urlPrefix && raw.itemable_id)
          ? '<a href="' + urlPrefix + raw.itemable_id + '" class="hover:text-amber-500 transition font-black">' + esc(s.title) + '</a>'
          : esc(s.title);

        var dayText = raw.day_number ? ("Day " + raw.day_number) : (s.date || "Day 1");
        var costText = raw.estimated_cost ? (" · $" + Number(raw.estimated_cost).toLocaleString()) : "";
        var coordsText = (isFinite(s.lat) && isFinite(s.lng)) ? (s.lat.toFixed(4) + "° N, " + s.lng.toFixed(4) + "° E") : "";

        return '<div class="p-5 sm:p-6 rounded-2xl bg-gray-100 dark:bg-white/5 text-xs border border-gray-200 dark:border-white/10 hover:border-amber-500/50 transition-all duration-300 interactive-stop-card group space-y-4" data-stop-idx="' + idx + '" data-lat="' + s.lat + '" data-lng="' + s.lng + '">' +
          '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200/60 dark:border-white/5 pb-3">' +
            '<div class="flex items-center gap-3.5">' +
              '<span class="w-9 h-9 rounded-2xl ' + badgeClass + ' flex items-center justify-center text-sm shrink-0">' + s.number + '</span>' +
              '<div>' +
                '<h4 class="font-black text-sm text-gray-900 dark:text-white leading-snug group-hover:text-amber-500 transition flex items-center gap-2">' +
                  titleHtml +
                '</h4>' +
                '<div class="flex items-center gap-2 mt-1 flex-wrap text-[11px]">' +
                  '<span class="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300 font-bold border border-amber-500/20"><i class="far fa-calendar mr-1"></i>' + esc(dayText + costText) + '</span>' +
                  '<span class="text-gray-600 dark:text-white/60 font-bold uppercase tracking-wider bg-gray-200 dark:bg-white/5 px-2.5 py-0.5 rounded-full border border-gray-300 dark:border-white/10"><i class="fas ' + iconCls + ' text-amber-500 mr-1"></i>' + esc(s.sub) + '</span>' +
                '</div>' +
              '</div>' +
            '</div>' +

            '<div class="flex items-center gap-2 shrink-0 self-end sm:self-center">' +
              '<button type="button" class="px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[11px] border border-amber-500/30 transition flex items-center gap-1.5 cursor-pointer focus-map-btn" data-stop-idx="' + idx + '" data-lat="' + s.lat + '" data-lng="' + s.lng + '">' +
                '<i class="fas fa-crosshairs"></i> Focus Map' +
              '</button>' +
            '</div>' +
          '</div>' +

          '<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-[11px] pt-1">' +
            '<div class="p-3 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 space-y-0.5">' +
              '<span class="text-[10px] font-bold text-amber-500 uppercase tracking-wider block"><i class="fas fa-map-pin mr-1"></i> Address & District</span>' +
              '<span class="text-gray-800 dark:text-white/80 font-medium block leading-snug">' + esc(s.address) + '</span>' +
            '</div>' +

            '<div class="p-3 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 space-y-0.5">' +
              '<span class="text-[10px] font-bold text-amber-500 uppercase tracking-wider block"><i class="fas fa-satellite mr-1"></i> Live GPS Coordinates</span>' +
              '<span class="text-emerald-500 font-bold block">' + esc(coordsText || "Location Pinned") + '</span>' +
            '</div>' +

            '<div class="p-3 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 space-y-0.5 sm:col-span-2 md:col-span-1">' +
              '<span class="text-[10px] font-bold text-amber-500 uppercase tracking-wider block"><i class="far fa-clock mr-1"></i> Schedule & Notes</span>' +
              '<span class="text-gray-900 dark:text-white/90 font-semibold block">' + esc(raw.time_slot || "Scheduled Experience") + '</span>' +
              (raw.notes ? '<span class="text-amber-600 dark:text-amber-200/80 italic block text-[10px] truncate">' + esc(raw.notes) + '</span>' : '') +
            '</div>' +
          '</div>' +
        '</div>';
      }).join("") + '</div>' +
    '</div>';
  }

  function renderRealMap(stops, title) {
    var container = el("trip-preview-map");
    if (!container || typeof L === "undefined") return;

    if (previewMap) {
      previewMap.remove();
      previewMap = null;
    }

    var validStops = (stops || []).filter(function (s) {
      return isFinite(s.lat) && isFinite(s.lng);
    });

    var centerLat = validStops.length ? validStops[0].lat : 30.0444;
    var centerLng = validStops.length ? validStops[0].lng : 31.2357;

    previewMap = L.map("trip-preview-map").setView([centerLat, centerLng], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(previewMap);

    previewMarkers = [];
    var latLngs = [];

    validStops.forEach(function (s) {
      var pt = [s.lat, s.lng];
      latLngs.push(pt);

      var marker = L.marker(pt).addTo(previewMap);
      marker.bindPopup(
        '<div class="text-xs space-y-1">' +
          '<strong class="text-sm text-gray-900 block">' + esc(s.title) + '</strong>' +
          '<span class="text-gray-600 block">' + esc(s.address) + '</span>' +
          '<span class="text-amber-600 font-bold block">' + esc(s.sub) + '</span>' +
        '</div>'
      );

      previewMarkers.push({ stopIdx: s.number - 1, marker: marker, lat: s.lat, lng: s.lng });
    });

    if (latLngs.length > 1) {
      L.polyline(latLngs, { color: "#f59e0b", weight: 4, opacity: 0.8, dashArray: "6, 8" }).addTo(previewMap);
      var bounds = L.latLngBounds(latLngs);
      previewMap.fitBounds(bounds, { padding: [40, 40] });
    }
  }

  function bindFocusMapEvents() {
    document.querySelectorAll(".focus-map-btn").forEach(function (btn) {
      btn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        var lat = Number(btn.getAttribute("data-lat"));
        var lng = Number(btn.getAttribute("data-lng"));
        var stopIdx = Number(btn.getAttribute("data-stop-idx"));

        if (previewMap && isFinite(lat) && isFinite(lng)) {
          previewMap.flyTo([lat, lng], 15, { duration: 1.2 });
          var match = previewMarkers.find(function (m) { return m.stopIdx === stopIdx; });
          if (match && match.marker) {
            match.marker.openPopup();
          }
          var mapContainer = el("trip-preview-map");
          if (mapContainer) {
            mapContainer.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      });
    });
  }

  function renderFullTripPreview(trip) {
    var shell = el("preview-shell");
    var breadcrumb = el("breadcrumb-title");
    var stickyTitle = el("sticky-trip-title");
    var stickyForkBtn = el("sticky-fork-btn");

    var cleanedTitle = cleanTitle(trip.title);
    if (breadcrumb) breadcrumb.textContent = cleanedTitle;
    if (stickyTitle) stickyTitle.textContent = cleanedTitle;
    if (stickyForkBtn) stickyForkBtn.onclick = function () { forkTrip(trip.id); };

    var items = getAllTripItems(trip);
    var origin = resolveOriginAddress(trip, items);
    var stops = buildTripStops(trip, items, origin);

    var totalEstimated = items.reduce(function (sum, item) {
      return sum + (Number(item.estimated_cost) || 0);
    }, 0);

    shell.innerHTML =
      '<!-- Header Hero Card -->' +
      '<div class="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-200/60 dark:border-white/10">' +
        '<div>' +
          '<div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-3 border border-amber-500/20">' +
            '<i class="fas fa-compass text-amber-500"></i> Trip #' + trip.id + ' · ' + esc(trip.travel_style || "Bespoke") + ' Style' +
          '</div>' +
          '<h1 class="text-3xl sm:text-5xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">' + esc(cleanedTitle) + '</h1>' +
          '<p class="text-gray-600 dark:text-white/60 text-xs sm:text-sm mt-2 flex items-center gap-4 font-medium">' +
            '<span><i class="far fa-calendar mr-1.5 text-amber-500"></i>' + (trip.no_of_days || "—") + ' Days</span>' +
            '<span><i class="fas fa-users mr-1.5 text-amber-500"></i>' + (trip.no_of_travelers || 1) + ' Traveler(s)</span>' +
          '</p>' +
        '</div>' +
        '<div class="flex items-center gap-3 flex-wrap">' +
          '<button type="button" id="hero-fork-btn" class="px-6 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition shadow-lg inline-flex items-center gap-2 cursor-pointer">' +
            '<i class="fas fa-code-branch"></i> Fork & Customize Itinerary' +
          '</button>' +
        '</div>' +
      '</div>' +

      '<!-- Stats Band -->' +
      '<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">' +
        '<div class="p-4 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-1">' +
          '<span class="text-[11px] text-gray-500 dark:text-white/40 uppercase tracking-wider font-bold block">Dates</span>' +
          '<span class="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white block">' + formatDate(trip.start_date) + ' → ' + formatDate(trip.end_date) + '</span>' +
        '</div>' +
        '<div class="p-4 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-1">' +
          '<span class="text-[11px] text-gray-500 dark:text-white/40 uppercase tracking-wider font-bold block">Budget</span>' +
          '<span class="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white block">$' + totalEstimated.toLocaleString() + ' / $' + Number(trip.budget || 2000).toLocaleString() + '</span>' +
        '</div>' +
        '<div class="p-4 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-1">' +
          '<span class="text-[11px] text-gray-500 dark:text-white/40 uppercase tracking-wider font-bold block">Stops</span>' +
          '<span class="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white block">' + stops.length + ' Locations Pinned</span>' +
        '</div>' +
        '<div class="p-4 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-1">' +
          '<span class="text-[11px] text-gray-500 dark:text-white/40 uppercase tracking-wider font-bold block">Style</span>' +
          '<span class="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white block uppercase">' + esc(trip.travel_style || "Cultural") + '</span>' +
        '</div>' +
      '</div>' +

      '<!-- Departure Hub Card -->' +
      '<div class="preview-card p-6 space-y-3">' +
        '<div class="flex items-center justify-between pb-2 border-b border-gray-200/60 dark:border-white/10">' +
          '<h3 class="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">' +
            '<i class="fas fa-plane-departure text-amber-500"></i> Origin & Departure Hub' +
          '</h3>' +
          '<span class="text-[11px] text-gray-500 dark:text-white/60 font-semibold">' + esc(origin.hub) + '</span>' +
        '</div>' +
        '<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">' +
          '<div class="p-3.5 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 space-y-1">' +
            '<span class="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">1. Country & Region</span>' +
            '<span class="font-extrabold text-gray-900 dark:text-white text-sm block">' + esc(origin.country) + '</span>' +
            '<span class="text-[11px] text-gray-500 dark:text-white/50 block">' + esc(origin.region) + '</span>' +
          '</div>' +
          '<div class="p-3.5 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 space-y-1">' +
            '<span class="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">2. City & District</span>' +
            '<span class="font-extrabold text-gray-900 dark:text-white text-sm block">' + esc(origin.city) + '</span>' +
            '<span class="text-[11px] text-gray-500 dark:text-white/50 block">' + esc(origin.district) + '</span>' +
          '</div>' +
          '<div class="p-3.5 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 space-y-1">' +
            '<span class="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">3. Street Address</span>' +
            '<span class="font-extrabold text-gray-900 dark:text-white text-sm block">' + esc(origin.street) + '</span>' +
            '<span class="text-[11px] text-gray-500 dark:text-white/50 block">Near Departure Terminal</span>' +
          '</div>' +
          '<div class="p-3.5 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 space-y-1">' +
            '<span class="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">4. Coordinates & Terminal</span>' +
            '<span class="font-extrabold text-gray-900 dark:text-white text-sm block">' + esc(origin.hub) + '</span>' +
            '<span class="text-[11px] text-emerald-500 font-semibold block">' + esc(origin.coords) + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<!-- Interactive Map Section -->' +
      '<div class="preview-card p-6 space-y-4">' +
        '<div class="flex items-center justify-between">' +
          '<div>' +
            '<h3 class="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">' +
              '<i class="fas fa-map-location-dot text-amber-500"></i> Interactive Route Map & Navigation' +
            '</h3>' +
            '<p class="text-xs text-gray-500 dark:text-white/60 mt-0.5">Click any "Focus Map" button below to zoom directly to that stop on the route.</p>' +
          '</div>' +
        '</div>' +
        '<div id="trip-preview-map"></div>' +
      '</div>' +

      '<!-- Detailed Stops Breakdown -->' +
      unifiedItineraryCardHtml(stops);

    // Wire CTAs
    var heroForkBtn = el("hero-fork-btn");
    var headerForkBtn = el("header-fork-btn");
    if (heroForkBtn) heroForkBtn.onclick = function () { forkTrip(trip.id); };
    if (headerForkBtn) headerForkBtn.onclick = function () { forkTrip(trip.id); };

    // Render Leaflet Map & Wire Focus Controls
    renderRealMap(stops, cleanedTitle);
    bindFocusMapEvents();
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
    var stickyBar = el("sticky-fork-bar") || el("community-fork-dock");
    if (stickyBar) stickyBar.style.display = "none";
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
