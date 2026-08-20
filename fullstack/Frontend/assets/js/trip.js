/**
 * trip.js — Luxury Trip Detail View with Modal Attachment & 5-Second Undo Queue Engine.
 * Features inline Item Attachment Modal, Action Confirmation Prompt, 5-Second Undo Queue for attach & detach, and Real Leaflet Maps.
 */
(function (global) {
  "use strict";

  var It = global.Itinera || (global.Itinera = {});

  var id = Number(new URLSearchParams(global.location.search).get("id")) || 0;
  var page = document.getElementById("trip-page");
  var LEAFLET_MAP_INSTANCE = null;
  var LEAFLET_MARKERS = [];
  var CURRENT_TRIP_DATA = null;

  var MODAL_CATEGORY = "hotels";
  var MODAL_CATALOG_ITEMS = [];

  var TYPE_ICON = {
    hotel: "fa-hotel",
    hotels: "fa-hotel",
    restaurant: "fa-utensils",
    restaurants: "fa-utensils",
    attraction: "fa-landmark",
    attractions: "fa-landmark",
    flight: "fa-plane",
    flights: "fa-plane",
    destination: "fa-location-dot",
    destinations: "fa-location-dot"
  };

  var TYPE_URL = {
    hotel: "../entity.html?type=hotels&id=",
    restaurant: "../entity.html?type=restaurants&id=",
    attraction: "../entity.html?type=attractions&id=",
    destination: "../entity.html?type=destinations&id=",
    flight: "../flight-details.html?id="
  };

  function el(id) { return document.getElementById(id); }
  function esc(v) {
    if (v == null) return "";
    return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function showToast(msg, type) {
    if (typeof It.showGlobalToast === "function") {
      It.showGlobalToast(msg, type !== "error");
    } else if (typeof global.showToast === "function") {
      global.showToast(msg, type);
    } else {
      alert(msg);
    }
  }

  function cleanTitle(title) {
    if (!title || typeof title !== "string") return "Cairo Ancient Wonders";
    var trimmed = title.trim();
    if (trimmed.toLowerCase().indexOf("atque") !== -1 || trimmed.toLowerCase().indexOf("lorem") !== -1) {
      return "Cairo Ancient Wonders";
    }
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }

  function formatDate(value) {
    if (!value) return "—";
    var d = new Date(String(value).slice(0, 10) + "T00:00:00");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  /* =========================================================================
   * 1. 5-SECOND UNDO QUEUE & CONFIRMATION ENGINE
   * ========================================================================= */

  function showConfirmationWindow(title, text, onConfirm) {
    var modal = el("confirm-modal");
    var titleEl = el("confirm-modal-title");
    var textEl = el("confirm-modal-text");
    var cancelBtn = el("confirm-modal-cancel");
    var okBtn = el("confirm-modal-ok");

    if (!modal || !okBtn || !cancelBtn) {
      if (confirm(text)) onConfirm();
      return;
    }

    if (titleEl) titleEl.textContent = title;
    if (textEl) textEl.textContent = text;
    modal.classList.remove("hidden");

    function cleanup() {
      modal.classList.add("hidden");
      okBtn.removeEventListener("click", handleOk);
      cancelBtn.removeEventListener("click", handleCancel);
    }

    function handleOk() {
      cleanup();
      onConfirm();
    }

    function handleCancel() {
      cleanup();
    }

    okBtn.addEventListener("click", handleOk);
    cancelBtn.addEventListener("click", handleCancel);
  }

  /** Pushes an action into the 5-second Undo Queue with In-Toast status transition */
  function pushUndoQueue(actionConfig) {
    var toastContainer = el("undo-toast-container");
    if (!toastContainer) return;

    var toastId = "undo-toast-" + Date.now();
    var secondsLeft = 5;

    var toast = document.createElement("div");
    toast.id = toastId;
    toast.className = "pointer-events-auto p-4 rounded-2xl bg-[#181b26] border border-amber-400/40 text-white shadow-2xl flex items-center justify-between gap-4 animate-slide-up backdrop-blur-xl z-50 transition-all duration-300";
    toast.innerHTML =
      '<div class="flex items-center gap-3">' +
        '<div class="w-8 h-8 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center text-xs font-bold icon-box">' +
          '<i class="fas fa-clock"></i>' +
        '</div>' +
        '<div>' +
          '<div class="text-xs font-extrabold text-white title-box">' + esc(actionConfig.message) + '</div>' +
          '<div class="text-[10px] text-white/50 font-mono status-box">Dispatches in <span class="text-amber-400 font-bold countdown-val">5s</span></div>' +
        '</div>' +
      '</div>' +
      '<button type="button" class="undo-btn px-4 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs shadow-md transition flex items-center gap-1 flex-shrink-0 cursor-pointer">' +
        '<i class="fas fa-rotate-left text-[10px]"></i> Undo' +
      '</button>';

    toastContainer.appendChild(toast);

    var countdownVal = toast.querySelector(".countdown-val");
    var undoBtn = toast.querySelector(".undo-btn");
    var iconBox = toast.querySelector(".icon-box");
    var titleBox = toast.querySelector(".title-box");
    var statusBox = toast.querySelector(".status-box");

    var timerInterval = setInterval(function () {
      secondsLeft--;
      if (countdownVal) countdownVal.textContent = secondsLeft + "s";
      if (secondsLeft <= 0) {
        clearInterval(timerInterval);
      }
    }, 1000);

    var dispatchTimeout = setTimeout(function () {
      clearInterval(timerInterval);
      if (undoBtn) undoBtn.style.display = "none";
      if (iconBox) iconBox.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      if (statusBox) statusBox.innerHTML = '<span class="text-amber-400 font-semibold">Dispatching request...</span>';

      actionConfig.executeFn(function (success, msg) {
        if (success) {
          toast.className = "pointer-events-auto p-4 rounded-2xl bg-[#0d1f18] border border-emerald-500/50 text-emerald-200 shadow-2xl flex items-center justify-between gap-4 backdrop-blur-xl z-50 transition-all duration-300";
          if (iconBox) iconBox.className = "w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold";
          if (iconBox) iconBox.innerHTML = '<i class="fas fa-circle-check text-sm"></i>';
          if (titleBox) titleBox.textContent = msg || "Action completed successfully!";
          if (statusBox) statusBox.innerHTML = '<span class="text-emerald-400 font-bold">Action Confirmed</span>';
        } else {
          toast.className = "pointer-events-auto p-4 rounded-2xl bg-[#280e14] border border-rose-500/50 text-rose-200 shadow-2xl flex items-center justify-between gap-4 backdrop-blur-xl z-50 transition-all duration-300";
          if (iconBox) iconBox.className = "w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs font-bold";
          if (iconBox) iconBox.innerHTML = '<i class="fas fa-triangle-exclamation text-sm"></i>';
          if (titleBox) titleBox.textContent = msg || "Request failed.";
          if (statusBox) statusBox.innerHTML = '<span class="text-rose-400 font-bold">Request Error</span>';
        }

        setTimeout(function () {
          if (toast.parentNode) {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(10px)";
            setTimeout(function () {
              if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
          }
        }, 3500);
      });
    }, 5000);

    if (undoBtn) {
      undoBtn.addEventListener("click", function () {
        clearTimeout(dispatchTimeout);
        clearInterval(timerInterval);
        if (toast.parentNode) toast.parentNode.removeChild(toast);
        if (typeof actionConfig.undoFn === "function") {
          actionConfig.undoFn();
        }
      });
    }
  }

  /* =========================================================================
   * 2. ADD ITEM CATALOG MODAL MANAGER
   * ========================================================================= */

  function openAddItemModal() {
    var modal = el("add-item-modal");
    if (modal) modal.classList.remove("hidden");

    var daySel = el("modal-day-select");
    if (daySel && CURRENT_TRIP_DATA) {
      daySel.innerHTML = "";
      var numDays = Number(CURRENT_TRIP_DATA.no_of_days) || 1;
      for (var d = 1; d <= numDays; d++) {
        var opt = document.createElement("option");
        opt.value = String(d);
        opt.textContent = "Day " + d;
        daySel.appendChild(opt);
      }
    }

    loadModalCatalog(MODAL_CATEGORY);
  }

  function closeAddItemModal() {
    var modal = el("add-item-modal");
    if (modal) modal.classList.add("hidden");
  }

  function loadModalCatalog(category) {
    MODAL_CATEGORY = category;
    var list = el("modal-catalog-list");
    if (!list) return;

    list.innerHTML = '<div class="py-14 text-center text-white/50 text-xs space-y-3"><i class="fas fa-spinner fa-spin text-amber-400 text-2xl block mx-auto"></i><span class="block">Loading ' + category + '…</span></div>';

    It.apiGet("/" + category).then(function (res) {
      var raw = res.data !== undefined ? res.data : (res.body ? (res.body.data || res.body) : res);
      MODAL_CATALOG_ITEMS = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.data) ? raw.data : []);
      renderModalCatalogItems(MODAL_CATALOG_ITEMS);
    }).catch(function () {
      list.innerHTML = '<div class="py-14 text-center text-white/50 text-xs space-y-3"><i class="fas fa-triangle-exclamation text-rose-400 text-xl block mx-auto"></i><span class="block">Could not load ' + category + '.</span></div>';
    });
  }

  function renderModalCatalogItems(items) {
    var list = el("modal-catalog-list");
    if (!list) return;

    if (!items || !items.length) {
      list.innerHTML = '<div class="py-14 text-center text-white/50 text-xs space-y-3"><i class="fas fa-suitcase text-white/20 text-2xl block mx-auto"></i><span class="block font-semibold text-white/60">No items found in this category.</span><span class="block">Try another category or clear your search.</span></div>';
      return;
    }

    list.innerHTML = items.map(function (item) {
      var name = item.name || item.airline || "Catalog Item";
      var sub = item.city_name || item.flight_number || item.category_name || "Experience Item";
      var iconCls = TYPE_ICON[MODAL_CATEGORY] || "fa-bookmark";

      return '<div class="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/40 hover:bg-white/[0.07] transition-all duration-200 flex items-center justify-between gap-4 group">' +
        '<div class="flex items-center gap-3.5 min-w-0">' +
          '<div class="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center text-base flex-shrink-0">' +
            '<i class="fas ' + iconCls + '"></i>' +
          '</div>' +
          '<div class="min-w-0">' +
            '<h4 class="text-sm font-bold text-white group-hover:text-amber-400 transition leading-snug truncate">' + esc(name) + '</h4>' +
            '<span class="text-xs text-white/40 truncate block">' + esc(sub) + '</span>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="attach-item-modal-btn px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-extrabold text-xs shadow-md shadow-amber-500/10 hover:shadow-amber-500/25 transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer" data-cat="' + MODAL_CATEGORY + '" data-item-id="' + item.id + '" data-item-name="' + esc(name) + '">' +
          '<i class="fas fa-plus"></i> Attach' +
        '</button>' +
      '</div>';
    }).join("");

    // Wire attach buttons inside modal
    list.querySelectorAll(".attach-item-modal-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cat = btn.getAttribute("data-cat");
        var itemId = Number(btn.getAttribute("data-item-id"));
        var itemName = btn.getAttribute("data-item-name");
        var daySel = el("modal-day-select");
        var selectedDay = daySel ? (Number(daySel.value) || 1) : 1;

        showConfirmationWindow(
          "Attach to Trip Itinerary (Day " + selectedDay + ")?",
          "Are you sure you want to attach '" + itemName + "' to Day " + selectedDay + " of your trip itinerary?",
          function () {
            closeAddItemModal();

            // Speculative UI update & 5-Second Undo Queue
            pushUndoQueue({
              title: "Attachment Scheduled (Day " + selectedDay + ")",
              message: "Attached '" + itemName + "' to Day " + selectedDay + " itinerary.",
              executeFn: function () {
                // Send actual HTTP POST request after 5s
                var singularCat = cat.replace(/s$/, "");
                It.apiPost("/trips/" + id + "/attach/" + singularCat, { item_id: itemId, id: itemId, day_number: selectedDay }, { auth: true }).then(function (res) {
                  if (res.ok) {
                    start();
                  }
                }).catch(function () {});
              },
              undoFn: function () {
                // User clicked Undo! Revert UI & cancel HTTP request.
                start();
              }
            });
          }
        );
      });
    });
  }

  /* =========================================================================
   * 3. REAL ADDRESS & STOP GENERATION ENGINE (Dynamic Lat/Lng & Place Hierarchy)
   * ========================================================================= */

  function getAllTripItems(trip) {
    var all = [];
    var seen = {};

    // Index itinerary_items by key (type:id)
    var itinMap = {};
    (trip.itinerary_items || []).forEach(function (it) {
      var type = (it.itemable_type || "attraction").toLowerCase().replace(/s$/, "");
      var key = type + ":" + (it.itemable_id || it.id);
      itinMap[key] = it;
    });

    // 1. Add attached destinations
    (trip.destinations || []).forEach(function (d) {
      var key = "destination:" + d.id;
      if (seen[key]) return;
      seen[key] = true;
      var it = itinMap[key] || {};
      all.push({
        id: it.id || d.id,
        itemable_type: "destination",
        itemable_id: d.id,
        title: it.title || d.name || d.city || "Destination",
        city: d.city || d.name,
        country: (d.country && d.country.name) || d.country_name || d.country || "",
        address: (d.name || d.city) + (d.country ? ", " + (d.country.name || d.country) : ""),
        latitude: Number(d.latitude) || null,
        longitude: Number(d.longitude) || null,
        day_number: Number(it.day_number || (d.pivot && d.pivot.day_number)) || 1,
        time_slot: it.time_slot || "",
        notes: it.notes || "",
        estimated_cost: Number(it.estimated_cost) || 0,
        itemable: d
      });
    });

    // 2. Add attached hotels
    (trip.hotels || []).forEach(function (h) {
      var key = "hotel:" + h.id;
      if (seen[key]) return;
      seen[key] = true;
      var it = itinMap[key] || {};
      var cost = Number((it.estimated_cost != null && it.estimated_cost > 0) ? it.estimated_cost : (h.price_per_night || h.price)) || 250;
      all.push({
        id: it.id || h.id,
        itemable_type: "hotel",
        itemable_id: h.id,
        title: it.title || h.name || "Hotel",
        city: h.city || (h.destination && h.destination.city) || "",
        country: (h.country && h.country.name) || h.country || (h.destination && (h.destination.country_name || h.destination.country)) || "",
        address: h.address || ((h.city || "") + (h.country ? ", " + h.country : "")),
        latitude: Number(h.latitude) || null,
        longitude: Number(h.longitude) || null,
        day_number: Number(it.day_number) || 1,
        time_slot: it.time_slot || "",
        notes: it.notes || "",
        estimated_cost: cost,
        itemable: h
      });
    });

    // 3. Add attached restaurants
    (trip.restaurants || []).forEach(function (r) {
      var key = "restaurant:" + r.id;
      if (seen[key]) return;
      seen[key] = true;
      var it = itinMap[key] || {};
      var cost = Number((it.estimated_cost != null && it.estimated_cost > 0) ? it.estimated_cost : (r.average_price || r.price)) || 80;
      all.push({
        id: it.id || r.id,
        itemable_type: "restaurant",
        itemable_id: r.id,
        title: it.title || r.name || "Restaurant",
        city: r.city || (r.destination && r.destination.city) || "",
        country: (r.country && r.country.name) || r.country || (r.destination && (r.destination.country_name || r.destination.country)) || "",
        address: r.address || ((r.city || "") + (r.country ? ", " + r.country : "")),
        latitude: Number(r.latitude) || null,
        longitude: Number(r.longitude) || null,
        day_number: Number(it.day_number) || 1,
        time_slot: it.time_slot || "",
        notes: it.notes || "",
        estimated_cost: cost,
        itemable: r
      });
    });

    // 4. Add attached attractions
    (trip.attractions || []).forEach(function (a) {
      var key = "attraction:" + a.id;
      if (seen[key]) return;
      seen[key] = true;
      var it = itinMap[key] || {};
      var cost = Number((it.estimated_cost != null && it.estimated_cost > 0) ? it.estimated_cost : (a.entry_fee || a.ticket_price || a.price)) || 35;
      all.push({
        id: it.id || a.id,
        itemable_type: "attraction",
        itemable_id: a.id,
        title: it.title || a.name || "Attraction",
        city: a.city || (a.destination && a.destination.city) || "",
        country: (a.country && a.country.name) || a.country || (a.destination && (a.destination.country_name || a.destination.country)) || "",
        address: a.address || ((a.city || "") + (a.country ? ", " + a.country : "")),
        latitude: Number(a.latitude) || null,
        longitude: Number(a.longitude) || null,
        day_number: Number(it.day_number) || 1,
        time_slot: it.time_slot || "",
        notes: it.notes || "",
        estimated_cost: cost,
        itemable: a
      });
    });

    // 5. Add attached flights
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
        day_number: Number(it.day_number) || 1,
        time_slot: it.time_slot || "",
        notes: it.notes || "",
        estimated_cost: cost,
        itemable: f
      });
    });

    // 6. Merge generic itinerary_items if present (including AI-generated items with no itemable)
    (trip.itinerary_items || []).forEach(function (it) {
      var raw = it.itemable;
      var type = (it.itemable_type || "attraction").toLowerCase().replace(/s$/, "");
      // For AI-generated items with no itemable_id, use the item id itself as key to avoid deduplication conflicts
      var key = it.itemable_id ? (type + ":" + it.itemable_id) : ("item:" + it.id);
      if (!seen[key]) {
        seen[key] = true;
        // Read coordinates: first from item row (AI-generated), fallback to itemable relation
        var itemLat = (it.latitude != null && it.latitude !== "" && isFinite(Number(it.latitude))) ? Number(it.latitude) : null;
        var itemLng = (it.longitude != null && it.longitude !== "" && isFinite(Number(it.longitude))) ? Number(it.longitude) : null;
        var rawLat = raw && Number(raw.latitude);
        var rawLng = raw && Number(raw.longitude);
        all.push({
          id: it.id,
          itemable_type: type,
          itemable_id: it.itemable_id || null,
          title: it.title || (raw && raw.name) || "Itinerary Item",
          city: (raw && raw.city) || "",
          country: (raw && (raw.country_name || raw.country)) || "",
          address: (raw && raw.address) || it.location_label || it.title || "",
          latitude: itemLat || rawLat || null,
          longitude: itemLng || rawLng || null,
          day_number: Number(it.day_number) || 1,
          time_slot: it.time_slot || "",
          notes: it.notes || "",
          estimated_cost: Number(it.estimated_cost || (raw && (raw.price_per_night || raw.price || raw.entry_fee || raw.average_price))) || 0,
          itemable: raw
        });
      }
    });

    return all;
  }

  function resolveOriginAddress(trip, items) {
    // Check if any attached item or destination has real location
    var firstLoc = (items || []).find(function (x) {
      return x.latitude && x.longitude && isFinite(x.latitude) && isFinite(x.longitude);
    });

    var firstDest = (trip.destinations && trip.destinations[0]) || null;
    var country = (firstLoc && firstLoc.country) || (firstDest && (firstDest.country_name || firstDest.country)) || "Egypt";
    var city = (firstLoc && firstLoc.city) || (firstDest && (firstDest.city || firstDest.name)) || "Cairo";
    var street = (firstLoc && firstLoc.address) || (city + " Central Departure Point");
    var lat = (firstLoc && firstLoc.latitude) || (firstDest && Number(firstDest.latitude)) || 30.0444;
    var lng = (firstLoc && firstLoc.longitude) || (firstDest && Number(firstDest.longitude)) || 31.2357;

    return {
      country: country,
      region: city + " District",
      city: city,
      district: city + " Center",
      street: street,
      hub: (firstLoc ? firstLoc.title : (city + " Airport")),
      coords: lat.toFixed(4) + "° N, " + lng.toFixed(4) + "° E",
      lat: lat,
      lng: lng
    };
  }

  function buildTripStops(trip, items, origin) {
    var stops = [];

    // Stop 1: Departure / Entry Point
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

    // Add each attached item as a real interactive stop
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

  function renderRealMap(stops, title) {
    var mapContainer = el("trip-map-container");
    if (!mapContainer) return;

    LEAFLET_MARKERS = [];

    mapContainer.innerHTML =
      '<div id="leaflet-map-canvas" class="w-full h-[420px] sm:h-[480px] rounded-3xl border border-white/15 overflow-hidden z-10 shadow-2xl"></div>' +
      '<div class="mt-3 text-xs text-white/50 flex items-center justify-between px-2">' +
        '<span id="map-stop-count-label"><i class="fas fa-route text-amber-400 mr-1.5"></i> ' + stops.length + ' Interactive Stop(s)</span>' +
        '<span class="font-medium text-emerald-400 flex items-center gap-1"><i class="fas fa-satellite text-[10px]"></i> Live Map Engine</span>' +
      '</div>';

    setTimeout(function () {
      if (!global.L) return;
      var mapCanvas = el("leaflet-map-canvas");
      if (!mapCanvas) return;

      var map = L.map(mapCanvas, {
        zoomControl: true,
        scrollWheelZoom: false
      });
      LEAFLET_MAP_INSTANCE = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      var latLngs = [];

      stops.forEach(function (s, idx) {
        var ll = [s.lat, s.lng];
        latLngs.push(ll);

        var iconClass = s.isStart ? "fa-plane-departure" : (TYPE_ICON[s.type] || "fa-location-dot");
        var customIcon = L.divIcon({
          className: 'custom-gold-marker',
          html: '<div class="w-9 h-9 rounded-full ' + (s.isStart ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold' : 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold') + ' border-2 border-white flex items-center justify-center text-xs shadow-xl shadow-amber-500/40 hover:scale-110 transition">' +
            '<span>' + s.number + '</span>' +
          '</div>',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        var m = L.marker(ll, { icon: customIcon }).addTo(map);
        m.bindPopup(
          '<div class="p-2 text-black font-sans">' +
            '<div class="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-0.5">Stop ' + s.number + ' · ' + esc(s.sub) + '</div>' +
            '<div class="text-xs font-extrabold text-slate-900 mb-1">' + esc(s.title) + '</div>' +
            '<div class="text-[11px] text-slate-600">' + esc(s.address) + '</div>' +
          '</div>'
        );
        LEAFLET_MARKERS.push(m);
      });

      if (latLngs.length > 1) {
        var polyline = L.polyline(latLngs, {
          color: '#fbbf24',
          weight: 4,
          opacity: 0.85,
          dashArray: '8, 8'
        }).addTo(map);

        map.fitBounds(polyline.getBounds(), { padding: [65, 65], maxZoom: 13 });
      } else if (latLngs.length === 1) {
        map.setView(latLngs[0], 12);
      }
    }, 150);
  }

  function unifiedItineraryCardHtml(stops, isLocked) {
    if (!stops || !stops.length) {
      return '<div class="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4 shadow-2xl">' +
        '<div class="flex items-center justify-between border-b border-white/10 pb-4">' +
          '<h3 class="text-base font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-2">' +
            '<i class="fas fa-route"></i> Complete Itinerary & Trail Map Stops (0 Stops)' +
          '</h3>' +
        '</div>' +
        '<div class="py-12 text-center text-white/40 text-xs space-y-3">' +
          '<div class="w-12 h-12 rounded-full bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto text-xl"><i class="fas fa-compass"></i></div>' +
          '<p class="font-semibold text-white/70">No itinerary stops added yet.</p>' +
          (!isLocked ? '<button type="button" class="open-add-item-btn px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer">+ Add Experience Items</button>' : '') +
        '</div>' +
      '</div>';
    }

    return '<div class="p-6 sm:p-8 rounded-3xl bg-white/5 border border-white/10 space-y-6 shadow-2xl">' +
      '<!-- Header Band -->' +
      '<div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-5 gap-4">' +
        '<div>' +
          '<div class="flex items-center gap-2 mb-1">' +
            '<span class="px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 text-[10px] font-extrabold uppercase tracking-widest border border-amber-400/20">' +
              '<i class="fas fa-layer-group mr-1"></i> Interactive Trail Timeline' +
            '</span>' +
            '<span class="text-xs text-white/50 font-medium">• ' + stops.length + ' Total Stop(s)</span>' +
          '</div>' +
          '<h3 class="text-xl font-black text-white flex items-center gap-2.5">' +
            '<i class="fas fa-route text-amber-400"></i> Full Itinerary & Interactive Map Trail Stops' +
          '</h3>' +
          '<p class="text-xs text-white/50 mt-1">Detailed breakdown of all scheduled experiences, locations, GPS coordinates, and map controls.</p>' +
        '</div>' +
        (!isLocked ? '<button type="button" class="open-add-item-btn px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black text-xs font-extrabold shadow-lg shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer shrink-0">' +
          '<i class="fas fa-plus"></i> Add Items' +
        '</button>' : '') +
      '</div>' +

      '<!-- Detailed Stops Cards List -->' +
      '<div class="space-y-4" id="interactive-stops-list">' + stops.map(function (s, idx) {
        var raw = s.rawItem || {};
        var badgeClass = s.isStart
          ? "bg-gradient-to-br from-amber-400 to-amber-500 text-black font-black shadow-lg shadow-amber-400/30"
          : "bg-white/10 text-amber-400 font-extrabold border border-amber-400/30 shadow-md";
        
        var iconCls = s.isStart ? "fa-plane-departure" : (TYPE_ICON[s.type] || "fa-location-dot");
        var urlPrefix = TYPE_URL[s.type];
        var titleHtml = (urlPrefix && raw.itemable_id)
          ? '<a href="' + urlPrefix + raw.itemable_id + '" class="hover:text-amber-400 transition font-black">' + esc(s.title) + '</a>'
          : esc(s.title);

        var dayText = raw.day_number ? ("Day " + raw.day_number) : (s.date || "Day 1");
        var costText = raw.estimated_cost ? (" · $" + Number(raw.estimated_cost).toLocaleString()) : "";
        var coordsText = (isFinite(s.lat) && isFinite(s.lng)) ? (s.lat.toFixed(4) + "° N, " + s.lng.toFixed(4) + "° E") : "";

        return '<div class="p-5 sm:p-6 rounded-2xl bg-white/[0.03] text-xs border border-white/10 hover:border-amber-400/50 hover:bg-white/[0.06] transition-all duration-300 interactive-stop-card group space-y-4" data-stop-idx="' + idx + '" data-lat="' + s.lat + '" data-lng="' + s.lng + '">' +
          '<!-- Stop Card Top Row -->' +
          '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">' +
            '<div class="flex items-center gap-3.5">' +
              '<span class="w-9 h-9 rounded-2xl ' + badgeClass + ' flex items-center justify-center text-sm flex-shrink-0">' + s.number + '</span>' +
              '<div>' +
                '<h4 class="font-black text-sm text-white leading-snug group-hover:text-amber-400 transition flex items-center gap-2">' +
                  titleHtml +
                '</h4>' +
                '<div class="flex items-center gap-2 mt-1 flex-wrap text-[11px]">' +
                  '<span class="px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 font-bold border border-amber-400/20"><i class="far fa-calendar mr-1"></i>' + esc(dayText + costText) + '</span>' +
                  '<span class="text-white/60 font-bold uppercase tracking-wider bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10"><i class="fas ' + iconCls + ' text-amber-400 mr-1"></i>' + esc(s.sub) + '</span>' +
                '</div>' +
              '</div>' +
            '</div>' +

            '<!-- Control Buttons (Focus Map, Edit, Remove) -->' +
            '<div class="flex items-center gap-2 shrink-0 self-end sm:self-center">' +
              '<button type="button" class="px-3 py-1.5 rounded-full bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 font-bold text-[11px] border border-amber-400/30 transition flex items-center gap-1.5 cursor-pointer focus-map-btn" data-stop-idx="' + idx + '" data-lat="' + s.lat + '" data-lng="' + s.lng + '">' +
                '<i class="fas fa-crosshairs"></i> Focus Map' +
              '</button>' +
              (!s.isStart && !isLocked && raw ? '<button type="button" class="item-row__edit p-2 rounded-full bg-white/5 hover:bg-white/15 text-white/60 hover:text-amber-400 transition text-xs cursor-pointer" data-id="' + (raw.id || raw.itemable_id) + '" data-title="' + esc(s.title) + '" data-day="' + (raw.day_number || 1) + '" data-time="' + esc(raw.time_slot || "") + '" data-cost="' + (raw.estimated_cost || 0) + '" data-notes="' + esc(raw.notes || "") + '" aria-label="Edit item"><i class="fas fa-pen-to-square"></i></button>' : '') +
              (!s.isStart && !isLocked && raw ? '<button type="button" class="item-row__remove p-2 rounded-full bg-white/5 hover:bg-white/15 text-white/60 hover:text-rose-400 transition text-xs cursor-pointer" data-pivot="' + (raw.id || raw.itemable_id) + '" data-title="' + esc(s.title) + '" aria-label="Remove item"><i class="fas fa-trash-can"></i></button>' : '') +
            '</div>' +
          '</div>' +

          '<!-- Detailed Info Grid -->' +
          '<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-[11px] pt-1">' +
            '<!-- Location Address -->' +
            '<div class="p-3 bg-white/5 rounded-xl border border-white/5 space-y-0.5">' +
              '<span class="text-[10px] font-bold text-amber-400/90 uppercase tracking-wider block"><i class="fas fa-map-pin mr-1"></i> Address & District</span>' +
              '<span class="text-white/80 font-medium block leading-snug">' + esc(s.address) + '</span>' +
            '</div>' +

            '<!-- GPS Coordinates -->' +
            '<div class="p-3 bg-white/5 rounded-xl border border-white/5 space-y-0.5">' +
              '<span class="text-[10px] font-bold text-amber-400/90 uppercase tracking-wider block"><i class="fas fa-satellite mr-1"></i> Live GPS Coordinates</span>' +
              '<span class="text-emerald-400 font-bold block">' + esc(coordsText || "Location Pinned") + '</span>' +
            '</div>' +

            '<!-- Time Slot & Notes -->' +
            '<div class="p-3 bg-white/5 rounded-xl border border-white/5 space-y-0.5 sm:col-span-2 md:col-span-1">' +
              '<span class="text-[10px] font-bold text-amber-400/90 uppercase tracking-wider block"><i class="far fa-clock mr-1"></i> Schedule & Notes</span>' +
              '<span class="text-white/90 font-semibold block">' + esc(raw.time_slot || "Scheduled Experience") + '</span>' +
              (raw.notes ? '<span class="text-amber-200/80 italic block text-[10px] truncate">' + esc(raw.notes) + '</span>' : '') +
            '</div>' +
          '</div>' +
        '</div>';
      }).join("") + '</div>' +
    '</div>';
  }

  function renderTrip(trip) {
    if (!page) return;
    if (!trip) {
      page.innerHTML = '<div class="py-16 text-center max-w-lg mx-auto bg-white/5 rounded-3xl border border-white/10 p-8 space-y-5 shadow-2xl">' +
        '<div class="w-16 h-16 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center mx-auto text-2xl shadow-inner"><i class="fas fa-compass"></i></div>' +
        '<div class="space-y-1.5">' +
          '<h2 class="text-2xl font-black text-white">No Active Trip Selected</h2>' +
          '<p class="text-xs text-white/60 max-w-sm mx-auto">Select a trip from your dashboard or fork a public itinerary from the community feed.</p>' +
        '</div>' +
        '<div class="flex items-center justify-center gap-3 pt-2 flex-wrap">' +
          '<a href="trips.html" class="px-5 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-black text-xs font-extrabold shadow-lg transition inline-flex items-center gap-1.5"><i class="fas fa-route"></i> My Trips Hub</a>' +
          '<a href="../public/community.html" class="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/15 inline-flex items-center gap-1.5"><i class="fas fa-code-branch text-emerald-400"></i> Fork Community Itinerary</a>' +
        '</div>' +
      '</div>';
      return;
    }

    CURRENT_TRIP_DATA = trip;

    var items = getAllTripItems(trip);
    var cleanedTitle = cleanTitle(trip.title);
    var origin = resolveOriginAddress(trip, items);
    var stops = buildTripStops(trip, items, origin);

    var totalEstimated = items.reduce(function (sum, item) {
      return sum + (Number(item.estimated_cost) || 0);
    }, 0);
    var budgetPct = trip.budget > 0 ? Math.min(100, Math.round((totalEstimated / trip.budget) * 100)) : 0;
    var budgetPct = trip.budget > 0 ? Math.min(100, Math.round((totalEstimated / trip.budget) * 100)) : 0;
    var isOverBudget = trip.budget > 0 && totalEstimated > trip.budget;

    var statusStr = String(trip.status || "").toLowerCase();
    var isLocked = statusStr === "booked" || statusStr === "completed" || statusStr === "paid";

    var isPublic = !!(trip.is_public || trip.public);
    var publicToggleBtnHtml = '<button type="button" id="toggle-trip-public-btn" class="px-5 py-2.5 rounded-full ' + (isPublic ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30' : 'bg-white/10 text-white border border-white/15 hover:bg-white/20') + ' text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer">' +
      '<i class="fas ' + (isPublic ? 'fa-globe text-emerald-400' : 'fa-lock text-amber-400') + '"></i> ' + (isPublic ? 'Public in Community' : 'Make Public & Share') +
    '</button>';

    var actionButtonsHtml = isLocked
      ? '<span class="px-4 py-2.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold inline-flex items-center gap-2 shadow-lg">' +
          '<i class="fas fa-lock text-amber-400"></i> Paid & Booked Trip (Read-Only)' +
        '</span>'
      : '<button type="button" id="open-edit-trip-btn" class="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer border border-white/15">' +
          '<i class="fas fa-pen-to-square text-amber-400"></i> Edit Trip Details' +
        '</button>' +
        publicToggleBtnHtml +
        '<button type="button" class="open-add-item-btn px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black text-xs font-extrabold transition shadow-lg shadow-amber-500/20 inline-flex items-center gap-2 cursor-pointer">' +
          '<i class="fas fa-plus"></i> Add Items' +
        '</button>' +
        '<button type="button" id="ai-review-btn" class="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition inline-flex items-center gap-2 border border-white/15">' +
          '<i class="fas fa-brain text-amber-400"></i> AI Trip Review' +
        '</button>';

    page.innerHTML =
      '<!-- Top Navigation Link -->' +
      '<div class="mb-4">' +
        '<a href="trips.html" class="inline-flex items-center gap-2 text-xs text-white/50 hover:text-white transition">' +
          '<i class="fas fa-arrow-left text-[10px]"></i> Back to My Trips' +
        '</a>' +
      '</div>' +

      '<!-- Header Hero Card -->' +
      '<div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-white/10 pb-8">' +
        '<div>' +
          '<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3 border border-amber-400/20">' +
            '<i class="fas fa-compass"></i> Trip #' + trip.id + ' · ' + esc(trip.travel_style || "Bespoke") + ' Style' +
          '</div>' +
          '<h1 class="text-3xl sm:text-5xl font-black tracking-tight text-white">' + esc(cleanedTitle) + '</h1>' +
          '<p class="text-white/60 text-xs sm:text-sm mt-2 flex items-center gap-4 font-medium">' +
            '<span><i class="far fa-calendar mr-1.5 text-amber-400"></i>' + (trip.no_of_days || "—") + ' Days</span>' +
            '<span><i class="fas fa-users mr-1.5 text-amber-400"></i>' + (trip.no_of_travelers || 1) + ' Traveler(s)</span>' +
          '</p>' +
        '</div>' +
        '<div class="flex items-center gap-3 flex-wrap">' + actionButtonsHtml + '</div>' +
      '</div>' +

      '<!-- Stats Band -->' +
      '<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">' +
        '<div class="p-4 rounded-2xl bg-white/5 border border-white/10">' +
          '<span class="text-[11px] text-white/40 uppercase tracking-wider font-bold block mb-1">Dates</span>' +
          '<span class="text-xs sm:text-sm font-bold text-white block">' + formatDate(trip.start_date) + ' → ' + formatDate(trip.end_date) + '</span>' +
        '</div>' +
        '<div class="p-4 rounded-2xl bg-white/5 border border-white/10">' +
          '<span class="text-[11px] text-white/40 uppercase tracking-wider font-bold block mb-1">Budget</span>' +
          '<span class="text-xs sm:text-sm font-bold text-amber-400 block">' + (trip.budget != null ? '$' + Number(trip.budget).toLocaleString() : '—') + '</span>' +
        '</div>' +
        '<div class="p-4 rounded-2xl bg-white/5 border border-white/10">' +
          '<span class="text-[11px] text-white/40 uppercase tracking-wider font-bold block mb-1">Est. Cost (' + budgetPct + '%)</span>' +
          '<span class="text-xs sm:text-sm font-bold block ' + (isOverBudget ? 'text-rose-400' : 'text-emerald-400') + '">$' + totalEstimated.toLocaleString() + '</span>' +
        '</div>' +
        '<div class="p-4 rounded-2xl bg-white/5 border border-white/10">' +
          '<span class="text-[11px] text-white/40 uppercase tracking-wider font-bold block mb-1">Attached Items</span>' +
          '<span class="text-xs sm:text-sm font-bold text-white block">' + items.length + ' Items</span>' +
        '</div>' +
      '</div>' +

      '<!-- Luxury Official Departure & Origin Point Address Card -->' +
      '<div class="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-white/5 to-transparent border border-amber-500/30 shadow-2xl mb-8 space-y-4">' +
        '<div class="flex items-center justify-between border-b border-amber-500/20 pb-3 flex-wrap gap-2">' +
          '<div class="flex items-center gap-3">' +
            '<div class="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-400 border border-amber-400/40 flex items-center justify-center text-lg shadow-lg">' +
              '<i class="fas fa-plane-departure"></i>' +
            '</div>' +
            '<div>' +
              '<h3 class="text-base font-extrabold text-white">Official Trip Departure & Origin Location</h3>' +
              '<p class="text-xs text-amber-300/80">Complete departure address hierarchy starting from country to street</p>' +
            '</div>' +
          '</div>' +
          '<span class="px-3.5 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">' +
            '<i class="fas fa-location-crosshairs mr-1"></i> Origin Hub' +
          '</span>' +
        '</div>' +

        '<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">' +
          '<!-- Country & Region -->' +
          '<div class="p-3.5 bg-white/5 rounded-2xl border border-white/10 space-y-1">' +
            '<span class="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">1. Country & Region</span>' +
            '<span class="font-extrabold text-white text-sm block">' + esc(origin.country) + '</span>' +
            '<span class="text-[11px] text-white/50 block">' + esc(origin.region) + '</span>' +
          '</div>' +

          '<!-- City & District -->' +
          '<div class="p-3.5 bg-white/5 rounded-2xl border border-white/10 space-y-1">' +
            '<span class="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">2. City & District</span>' +
            '<span class="font-extrabold text-white text-sm block">' + esc(origin.city) + '</span>' +
            '<span class="text-[11px] text-white/50 block">' + esc(origin.district) + '</span>' +
          '</div>' +

          '<!-- Street Address -->' +
          '<div class="p-3.5 bg-white/5 rounded-2xl border border-white/10 space-y-1">' +
            '<span class="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">3. Street Address</span>' +
            '<span class="font-extrabold text-white text-sm block">' + esc(origin.street) + '</span>' +
            '<span class="text-[11px] text-white/50 block">Near Departure Terminal</span>' +
          '</div>' +

          '<!-- Coordinates & Terminal -->' +
          '<div class="p-3.5 bg-white/5 rounded-2xl border border-white/10 space-y-1">' +
            '<span class="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">4. Coordinates & Terminal</span>' +
            '<span class="font-extrabold text-white text-sm block">' + esc(origin.hub) + '</span>' +
            '<span class="text-[11px] text-emerald-400 font-semibold block">' + esc(origin.coords) + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<!-- AI Diagnostic Container -->' +
      '<div id="ai-review-result" class="mb-8" hidden></div>' +

      '<!-- Map & Detailed Itinerary Stack -->' +
      '<div class="space-y-8">' +
        '<!-- Real Leaflet Map (Full Width) -->' +
        '<div>' +
          '<div class="flex items-center justify-between mb-4">' +
            '<h2 class="text-lg font-bold text-white flex items-center gap-2"><i class="fas fa-map-location-dot text-amber-400"></i> Route Trail Map & Live Radar</h2>' +
          '</div>' +
          '<div id="trip-map-container"></div>' +
        '</div>' +

        '<!-- Detailed Full Itinerary & Map Trail Stops (Full Width Under Map) -->' +
        '<div>' +
          unifiedItineraryCardHtml(stops, isLocked) +
        '</div>' +
      '</div>';

    // Render Real Leaflet Map
    renderRealMap(stops, cleanedTitle);

    // Wire Public Toggle Button
    var togglePublicBtn = el("toggle-trip-public-btn");
    if (togglePublicBtn) {
      togglePublicBtn.addEventListener("click", function () {
        var currentIsPublic = !!(trip.is_public || trip.public);
        var targetPublicState = !currentIsPublic;
        It.apiPut("/trips/" + trip.id, { is_public: targetPublicState }, { auth: true }).then(function (res) {
          if (res.ok) {
            if (global.ItineraToast) global.ItineraToast(targetPublicState ? "🎉 Your trip is now Public and shared on the Community feed!" : "🔒 Your trip is now Private.", "success");
            start();
          }
        });
      });
    }

    // Wire Open Add Modal buttons
    page.querySelectorAll(".open-add-item-btn").forEach(function (btn) {
      btn.addEventListener("click", openAddItemModal);
    });

    // Wire Edit Trip Modal
    var openEditBtn = el("open-edit-trip-btn");
    var editModal = el("edit-trip-modal");
    var closeEditBtn = el("close-edit-trip-modal");
    var cancelEditBtn = el("cancel-edit-trip");
    var editForm = el("edit-trip-form");

    if (openEditBtn && editModal) {
      openEditBtn.addEventListener("click", function () {
        el("edit-trip-title").value = trip.title || "";
        el("edit-trip-style").value = trip.travel_style || "cultural";
        el("edit-trip-travelers").value = trip.no_of_travelers || 1;
        el("edit-trip-budget").value = trip.budget || 0;
        el("edit-trip-days").value = trip.no_of_days || 3;
        el("edit-trip-start").value = trip.start_date ? String(trip.start_date).slice(0, 10) : "";
        el("edit-trip-end").value = trip.end_date ? String(trip.end_date).slice(0, 10) : "";
        editModal.classList.remove("hidden");
      });
    }

    function closeEditModal() {
      if (editModal) editModal.classList.add("hidden");
    }

    if (closeEditBtn) closeEditBtn.onclick = closeEditModal;
    if (cancelEditBtn) cancelEditBtn.onclick = closeEditModal;

    if (editForm) {
      editForm.onsubmit = function (ev) {
        ev.preventDefault();
        var saveBtn = el("save-edit-trip-btn");
        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Saving…';
        }

        var payload = {
          title: el("edit-trip-title").value,
          travel_style: el("edit-trip-style").value,
          no_of_travelers: Number(el("edit-trip-travelers").value) || 1,
          budget: Number(el("edit-trip-budget").value) || 0,
          no_of_days: Number(el("edit-trip-days").value) || 1,
          start_date: el("edit-trip-start").value || null,
          end_date: el("edit-trip-end").value || null
        };

        It.apiPut("/trips/" + trip.id, payload, { auth: true, skipNotification: true }).then(function (res) {
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Save Changes';
          }
          if (res.ok) {
            closeEditModal();
            showToast("Trip details updated successfully!", "success");
            start();
          } else {
            showToast((res.body && res.body.message) || "Could not update trip.", "error");
          }
        }).catch(function () {
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Save Changes';
          }
          showToast("Could not reach the server.", "error");
        });
      };
    }

    // Wire Interactive Stop Card Clicks to Leaflet Map Focus
    page.querySelectorAll(".interactive-stop-card").forEach(function (card) {
      card.addEventListener("click", function () {
        var sIdx = Number(card.getAttribute("data-stop-idx"));
        var lat = Number(card.getAttribute("data-lat"));
        var lng = Number(card.getAttribute("data-lng"));

        if (LEAFLET_MAP_INSTANCE && isFinite(lat) && isFinite(lng)) {
          LEAFLET_MAP_INSTANCE.flyTo([lat, lng], 14, { duration: 1.2 });
          if (LEAFLET_MARKERS[sIdx]) {
            LEAFLET_MARKERS[sIdx].openPopup();
          }
        }
      });
    });

    // AI Review Event Handler
    var aiReviewBtn = el("ai-review-btn");
    if (aiReviewBtn) {
      aiReviewBtn.addEventListener("click", function () {
        var resBox = el("ai-review-result");
        aiReviewBtn.disabled = true;
        aiReviewBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Running AI Engine…';
        It.apiGet("/ai/review/" + trip.id, { auth: true }).then(function (res) {
          aiReviewBtn.disabled = false;
          aiReviewBtn.innerHTML = '<i class="fas fa-brain mr-1"></i> Re-run AI Review';
          if (res.ok && res.body) {
            var reviewData = res.body.data || res.body;
            var summary = reviewData.review_summary || reviewData.review || reviewData.content || (typeof reviewData === "string" ? reviewData : JSON.stringify(reviewData));
            var suggestions = Array.isArray(reviewData.suggestions) ? reviewData.suggestions : [];

            resBox.hidden = false;
            resBox.innerHTML = '<div class="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-white shadow-2xl space-y-4">' +
              '<div class="flex items-center justify-between border-b border-amber-500/20 pb-3">' +
                '<h3 class="text-sm font-bold text-amber-400 flex items-center gap-2"><i class="fas fa-sparkles"></i> AI Itinerary Diagnostic & Recommendations</h3>' +
                '<button type="button" class="text-xs text-white/40 hover:text-white" onclick="document.getElementById(\'ai-review-result\').hidden=true"><i class="fas fa-xmark"></i> Close</button>' +
              '</div>' +
              '<p class="text-xs text-white/90 leading-relaxed font-medium">' + esc(summary) + '</p>' +
              (suggestions.length ? '<div class="space-y-2 border-t border-amber-500/20 pt-3">' +
                '<div class="text-[11px] font-bold text-amber-400 uppercase tracking-wider">AI Tailored Suggestions</div>' +
                suggestions.map(function (s) { return '<div class="text-xs text-white/80 flex items-start gap-2"><i class="fas fa-check text-amber-400 mt-0.5 text-[10px]"></i><span>' + esc(s) + '</span></div>'; }).join("") +
                '</div>' : '') +
              '</div>';
          } else {
            resBox.hidden = false;
            resBox.innerHTML = '<div class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">' +
              'Could not fetch AI review for this trip.' +
            '</div>';
          }
        }).catch(function () {
          aiReviewBtn.disabled = false;
          aiReviewBtn.innerHTML = '<i class="fas fa-brain mr-1"></i> Re-run AI Review';
        });
      });
    }

    // Wire Edit Item Buttons (.item-row__edit)
    var editItemModal = el("edit-item-modal");
    var closeEditItemBtn = el("close-edit-item-modal");
    var cancelEditItemBtn = el("cancel-edit-item");
    var editItemForm = el("edit-item-form");

    function closeEditItemModal() {
      if (editItemModal) editItemModal.classList.add("hidden");
    }

    if (closeEditItemBtn) closeEditItemBtn.onclick = closeEditItemModal;
    if (cancelEditItemBtn) cancelEditItemBtn.onclick = closeEditItemModal;

    page.querySelectorAll(".item-row__edit").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!editItemModal) return;
        var itemId = btn.getAttribute("data-id");
        var itemTitle = btn.getAttribute("data-title");
        var itemDay = Number(btn.getAttribute("data-day")) || 1;
        var itemTime = btn.getAttribute("data-time") || "10:00 AM";
        var itemCost = Number(btn.getAttribute("data-cost")) || 0;
        var itemNotes = btn.getAttribute("data-notes") || "";

        el("edit-item-id").value = itemId;
        el("edit-item-title").value = itemTitle;
        el("edit-item-time").value = itemTime;
        el("edit-item-cost").value = itemCost;
        el("edit-item-notes").value = itemNotes;

        var daySel = el("edit-item-day");
        if (daySel) {
          daySel.innerHTML = "";
          var numDays = Number(trip.no_of_days) || 1;
          for (var d = 1; d <= numDays; d++) {
            var opt = document.createElement("option");
            opt.value = String(d);
            opt.textContent = "Day " + d;
            if (d === itemDay) opt.selected = true;
            daySel.appendChild(opt);
          }
        }

        editItemModal.classList.remove("hidden");
      });
    });

    if (editItemForm) {
      editItemForm.onsubmit = function (ev) {
        ev.preventDefault();
        var saveBtn = el("save-edit-item-btn");
        var itemId = el("edit-item-id").value;
        if (!itemId) return;

        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Saving…';
        }

        var payload = {
          day_number: Number(el("edit-item-day").value) || 1,
          title: el("edit-item-title").value,
          time_slot: el("edit-item-time").value,
          estimated_cost: Number(el("edit-item-cost").value) || 0,
          notes: el("edit-item-notes").value
        };

        It.apiPut("/trips/" + trip.id + "/items/" + itemId, payload, { auth: true, skipNotification: true }).then(function (res) {
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Save Item';
          }
          if (res.ok) {
            closeEditItemModal();
            showToast("Itinerary item updated successfully!", "success");
            start();
          } else {
            showToast((res.body && res.body.message) || "Could not update item.", "error");
          }
        }).catch(function () {
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Save Item';
          }
          showToast("Could not reach the server.", "error");
        });
      };
    }

    // Attach Detach Handlers with Confirmation Prompt & 5-Second Undo Queue
    page.querySelectorAll(".item-row__remove").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var pivotId = btn.getAttribute("data-pivot");
        var itemTitle = btn.getAttribute("data-title");

        showConfirmationWindow(
          "Detach Itinerary Item?",
          "Are you sure you want to detach '" + itemTitle + "' from your itinerary?",
          function () {
            // Speculative UI update & 5-Second Undo Queue
            pushUndoQueue({
              title: "Detachment Scheduled",
              message: "Detaching '" + itemTitle + "' from itinerary...",
              executeFn: function (callback) {
                // Send actual HTTP DELETE request after 5s
                It.apiDelete("/trips/" + trip.id + "/detach/" + pivotId, { auth: true, skipNotification: true }).then(function (res) {
                  if (res.ok) {
                    callback(true, (res.body && res.body.message) || "Item detached successfully!");
                    start();
                  } else {
                    var msg = (res.body && res.body.message) || (res.body && res.body.error && res.body.error.message) || "Could not detach item.";
                    callback(false, msg);
                  }
                }).catch(function () {
                  callback(false, "Network error detaching item.");
                });
              },
              undoFn: function () {
                if (typeof It.showGlobalToast === "function") {
                  It.showGlobalToast("Detachment cancelled.", true);
                }
              }
            });
          }
        );
      });
    });
  }

  function bootModalEvents() {
    var closeBtn = el("close-add-modal-btn");
    if (closeBtn) closeBtn.addEventListener("click", closeAddItemModal);

    var categoryTabs = el("modal-category-tabs");
    if (categoryTabs) {
      categoryTabs.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-cat]");
        if (!btn) return;
        var cat = btn.getAttribute("data-cat");
        categoryTabs.querySelectorAll("[data-cat]").forEach(function (b) {
          var active = b === btn;
          b.className = active
            ? "px-3.5 py-1.5 rounded-full bg-amber-400 text-black font-bold text-xs shadow-md transition cursor-pointer"
            : "px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-semibold text-xs transition cursor-pointer";
        });
        loadModalCatalog(cat);
      });
    }

    var searchInput = el("modal-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        var q = searchInput.value.toLowerCase().trim();
        var filtered = MODAL_CATALOG_ITEMS.filter(function (i) {
          var name = (i.name || i.airline || "").toLowerCase();
          var sub = (i.city_name || i.flight_number || i.category_name || "").toLowerCase();
          return name.indexOf(q) !== -1 || sub.indexOf(q) !== -1;
        });
        renderModalCatalogItems(filtered);
      });
    }

  }

  function start() {
    bootModalEvents();

    if (!id) {
      // If no ID in URL, attempt to fetch user's latest active trip from API
      if (It.apiGet && It.session && It.session.hasToken()) {
        It.apiGet("/trips", { auth: true }).then(function (res) {
          var raw = res.data !== undefined ? res.data : (res.body ? (res.body.data || res.body) : res);
          var trips = Array.isArray(raw) ? raw : [];
          if (trips.length) {
            id = trips[0].id;
            renderTrip(trips[0]);
          } else {
            renderTrip(null);
          }
        }).catch(function () {
          renderTrip(null);
        });
      } else {
        renderTrip(null);
      }
      return;
    }

    if (!It.session || !It.session.hasToken()) {
      page.innerHTML = '<div class="py-16 text-center max-w-md mx-auto bg-white/5 rounded-3xl border border-white/10 space-y-4">' +
        '<h2 class="text-xl font-bold text-white">Please Sign In</h2>' +
        '<p class="text-xs text-white/60">You need an active user session to view this trip itinerary.</p>' +
        '<a href="../auth/login.html" class="px-6 py-2.5 rounded-full bg-amber-400 text-black text-xs font-bold inline-block">Sign In to Account</a>' +
      '</div>';
      return;
    }

    It.apiGet("/trips/" + id, { auth: true }).then(function (res) {
      var raw = res.data !== undefined ? res.data : (res.body ? (res.body.data || res.body) : res);
      if (raw && (raw.id || raw.title)) {
        renderTrip(raw);
      } else {
        attemptFallbackTripLoad(id);
      }
    }).catch(function () {
      attemptFallbackTripLoad(id);
    });
  }

  function attemptFallbackTripLoad(targetId) {
    // Attempt to load from user trips list
    It.apiGet("/trips", { auth: true }).then(function (res) {
      var raw = res.data !== undefined ? res.data : (res.body ? (res.body.data || res.body) : res);
      var trips = Array.isArray(raw) ? raw : [];
      var match = trips.find(function (t) { return String(t.id) === String(targetId); });
      if (match) {
        renderTrip(match);
      } else if (trips.length) {
        renderTrip(trips[0]);
      } else {
        renderTrip(null);
      }
    }).catch(function () {
      renderTrip(null);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})(window);
