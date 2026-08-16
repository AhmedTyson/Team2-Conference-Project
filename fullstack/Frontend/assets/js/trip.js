/**
 * trip.js — Luxury Trip Detail View with Modal Attachment & 5-Second Undo Queue Engine.
 * Features inline Item Attachment Modal, Action Confirmation Prompt, 5-Second Undo Queue for attach & detach, and Real Leaflet Maps.
 */
(function (global) {
  "use strict";

  var It = global.Itinari || (global.Itinari = {});

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

    list.innerHTML = '<div class="py-12 text-center text-white/50 text-xs"><i class="fas fa-spinner fa-spin text-amber-400 text-xl block mb-2"></i> Loading ' + category + '...</div>';

    It.apiGet("/" + category).then(function (res) {
      var raw = res.data !== undefined ? res.data : (res.body ? (res.body.data || res.body) : res);
      MODAL_CATALOG_ITEMS = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.data) ? raw.data : []);
      renderModalCatalogItems(MODAL_CATALOG_ITEMS);
    }).catch(function () {
      list.innerHTML = '<div class="py-12 text-center text-white/50 text-xs">Could not load ' + category + '.</div>';
    });
  }

  function renderModalCatalogItems(items) {
    var list = el("modal-catalog-list");
    if (!list) return;

    if (!items || !items.length) {
      list.innerHTML = '<div class="py-12 text-center text-white/50 text-xs">No items found in this category.</div>';
      return;
    }

    list.innerHTML = items.map(function (item) {
      var name = item.name || item.airline || "Catalog Item";
      var sub = item.city_name || item.flight_number || item.category_name || "Experience Item";
      var iconCls = TYPE_ICON[MODAL_CATEGORY] || "fa-bookmark";

      return '<div class="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/40 transition flex items-center justify-between gap-4 group">' +
        '<div class="flex items-center gap-3.5">' +
          '<div class="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center text-base flex-shrink-0">' +
            '<i class="fas ' + iconCls + '"></i>' +
          '</div>' +
          '<div>' +
            '<h4 class="text-sm font-bold text-white group-hover:text-amber-400 transition leading-snug">' + esc(name) + '</h4>' +
            '<span class="text-xs text-white/40">' + esc(sub) + '</span>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="attach-item-modal-btn px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-extrabold text-xs shadow-md transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer" data-cat="' + MODAL_CATEGORY + '" data-item-id="' + item.id + '" data-item-name="' + esc(name) + '">' +
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

        showConfirmationWindow(
          "Attach to Trip Itinerary?",
          "Are you sure you want to attach '" + itemName + "' to your trip itinerary?",
          function () {
            closeAddItemModal();

            // Speculative UI update & 5-Second Undo Queue
            pushUndoQueue({
              title: "Attachment Scheduled",
              message: "Attached '" + itemName + "' to itinerary.",
              executeFn: function () {
                // Send actual HTTP POST request after 5s
                var singularCat = cat.replace(/s$/, "");
                It.apiPost("/trips/" + id + "/attach/" + singularCat, { item_id: itemId, id: itemId }, { auth: true }).then(function (res) {
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
   * 3. ADDRESS & STOP GENERATION ENGINE
   * ========================================================================= */

  function resolveOriginAddress(trip) {
    var rawTitle = (trip.title || "").toLowerCase();
    var firstDest = (trip.destinations && trip.destinations[0] && trip.destinations[0].name) || "";
    var combined = rawTitle + " " + firstDest.toLowerCase();

    if (combined.indexOf("paris") !== -1 || combined.indexOf("france") !== -1) {
      return {
        country: "France",
        region: "Île-de-France, Western Europe",
        city: "Paris",
        district: "8th Arrondissement / Champs-Élysées",
        street: "Avenue des Champs-Élysées, Bldg 42",
        hub: "CDG · Terminal 2E",
        coords: "48.8566° N, 2.3522° E",
        lat: 48.8566,
        lng: 2.3522
      };
    } else if (combined.indexOf("rome") !== -1 || combined.indexOf("italy") !== -1 || combined.indexOf("amalfi") !== -1) {
      return {
        country: "Italy",
        region: "Lazio / Campania Region",
        city: "Rome",
        district: "Municipio I / Historical Center",
        street: "Via del Corso, No. 128",
        hub: "FCO · Terminal 3",
        coords: "41.9028° N, 12.4964° E",
        lat: 41.9028,
        lng: 12.4964
      };
    } else if (combined.indexOf("london") !== -1 || combined.indexOf("uk") !== -1) {
      return {
        country: "United Kingdom",
        region: "Greater London, Western Europe",
        city: "London",
        district: "City of Westminster / Mayfair",
        street: "Piccadilly Circus, No. 15",
        hub: "LHR · Terminal 5",
        coords: "51.5074° N, 0.1278° W",
        lat: 51.5074,
        lng: -0.1278
      };
    }

    return {
      country: "Egypt",
      region: "Cairo Governorate, North Africa",
      city: "Cairo",
      district: "Zamalek / Downtown District",
      street: "26th of July Street, Building 14",
      hub: "CAI · Terminal 3",
      coords: "30.0444° N, 31.2357° E",
      lat: 30.0444,
      lng: 31.2357
    };
  }

  function sanitizeCoordinates(lat, lng, origin) {
    var latNum = Number(lat);
    var lngNum = Number(lng);

    if (!isFinite(latNum) || !isFinite(lngNum) || latNum === 0 || lngNum === 0) {
      return null;
    }

    var latDiff = Math.abs(latNum - origin.lat);
    var lngDiff = Math.abs(lngNum - origin.lng);

    if (latDiff > 2.5 || lngDiff > 2.5) {
      return null;
    }

    return { lat: latNum, lng: lngNum };
  }

  function buildTripStops(trip, origin) {
    var items = trip.itinerary_items || [];
    var destinations = trip.destinations || [];
    var stops = [];
    var seen = {};

    // 1. Always Stop 1: Departure Origin Hub
    stops.push({
      number: 1,
      title: origin.city + " Departure Hub",
      address: origin.street + ", " + origin.district + ", " + origin.city + ", " + origin.country,
      sub: "Departure Hub · " + origin.hub,
      date: trip.start_date ? formatDate(trip.start_date) : "Jul 16",
      lat: origin.lat,
      lng: origin.lng,
      type: "destination",
      isStart: true
    });
    seen[origin.lat.toFixed(4) + "," + origin.lng.toFixed(4)] = true;

    // 2. Add each itinerary item as a unique stop
    (items || []).forEach(function (item) {
      var raw = item.itemable;
      var itemTitle = cleanTitle(item.title || (raw && raw.name) || "Itinerary Stop");
      var addressStr = (raw && raw.address) || (origin.city + ", " + origin.country);
      
      var sanitized = sanitizeCoordinates(raw && raw.latitude, raw && raw.longitude, origin);
      var lat, lng;

      if (sanitized) {
        lat = sanitized.lat;
        lng = sanitized.lng;
      } else {
        var offsetMultiplier = stops.length;
        lat = origin.lat + (offsetMultiplier * 0.012);
        lng = origin.lng + (offsetMultiplier * 0.012);
      }

      stops.push({
        number: stops.length + 1,
        title: itemTitle,
        address: addressStr,
        sub: item.itemable_type ? item.itemable_type.charAt(0).toUpperCase() + item.itemable_type.slice(1) : "Experience Stop",
        date: trip.start_date ? formatDate(trip.start_date) : null,
        lat: lat,
        lng: lng,
        type: item.itemable_type || "attraction",
        isStart: false
      });
    });

    // 3. If no itinerary items, add destination stops
    if (stops.length === 1 && destinations.length) {
      destinations.forEach(function (d) {
        var lat = Number(d.latitude);
        var lng = Number(d.longitude);
        if (!isFinite(lat) || !isFinite(lng) || lat === 0 || lng === 0) {
          var offsetMultiplier = stops.length;
          lat = origin.lat + (offsetMultiplier * 0.015);
          lng = origin.lng + (offsetMultiplier * 0.015);
        }
        stops.push({
          number: stops.length + 1,
          title: d.name || "Destination Stop",
          address: (d.name || origin.city) + ", " + origin.country,
          sub: "Destination",
          date: d.pivot && d.pivot.estimated_date ? formatDate(d.pivot.estimated_date) : null,
          lat: lat,
          lng: lng,
          type: "destination",
          isStart: false
        });
      });
    }

    // 4. Fallback 2nd stop if only 1 stop exists so there is always a connecting route line
    if (stops.length === 1) {
      var fallbackName = origin.city === "Cairo" ? "Grand Egyptian Museum & Pyramids" : origin.city + " Highlights Stop";
      stops.push({
        number: 2,
        title: fallbackName,
        address: "Giza Plateau, " + origin.city + ", " + origin.country,
        sub: "Attraction Stop",
        date: trip.start_date ? formatDate(trip.start_date) : null,
        lat: origin.city === "Cairo" ? 29.9792 : origin.lat + 0.02,
        lng: origin.city === "Cairo" ? 31.1342 : origin.lng + 0.02,
        type: "attraction",
        isStart: false
      });
    }

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

  function itineraryHtml(items) {
    if (!items || !items.length) {
      return '<div class="py-10 text-center text-white/40 text-xs bg-white/5 rounded-2xl border border-white/10 space-y-3">' +
        '<div class="w-12 h-12 rounded-full bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto text-lg">' +
          '<i class="fas fa-folder-open"></i>' +
        '</div>' +
        '<p class="font-semibold text-white/70">No experience items attached yet.</p>' +
        '<button type="button" class="open-add-item-btn px-4 py-2 rounded-full bg-amber-400 text-black font-bold text-xs hover:bg-amber-300 transition cursor-pointer">+ Add Experience Items</button>' +
      '</div>';
    }

    return '<div class="space-y-3 item-list">' + items.map(function (item) {
      var iconCls = TYPE_ICON[item.itemable_type] || "fa-bookmark";
      var urlPrefix = TYPE_URL[item.itemable_type];
      var itemTitle = cleanTitle(item.title || (item.itemable && item.itemable.name) || "Itinerary Stop");
      var titleHtml = urlPrefix ? '<a href="' + urlPrefix + (item.itemable_id || "") + '" class="hover:text-amber-400 transition font-bold">' + esc(itemTitle) + '</a>' : esc(itemTitle);

      return '<div class="item-row flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/30 transition">' +
        '<div class="flex items-center gap-3">' +
        '<div class="w-9 h-9 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center text-sm flex-shrink-0">' +
        '<i class="fas ' + iconCls + '"></i></div>' +
        '<div>' +
        '<h4 class="text-xs font-bold text-white leading-snug">' + titleHtml + '</h4>' +
        '<p class="text-[11px] text-white/40 mt-0.5">' +
        'Day ' + (item.day_number || 1) + (item.estimated_cost ? ' · $' + Number(item.estimated_cost).toLocaleString() : '') +
        '</p></div></div>' +
        '<button type="button" class="item-row__remove text-white/40 hover:text-rose-400 p-2 text-xs transition cursor-pointer" data-pivot="' + item.id + '" data-title="' + esc(itemTitle) + '" aria-label="Remove item"><i class="fas fa-trash-can"></i></button>' +
        '</div>';
    }).join("") + '</div>';
  }

  function stopsHtml(stops) {
    return '<div class="mt-6 p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">' +
      '<div class="flex items-center justify-between border-b border-white/10 pb-3">' +
        '<h3 class="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2"><i class="fas fa-route"></i> Interactive Stops (' + stops.length + ')</h3>' +
        '<span class="text-[10px] text-white/40 font-medium">Click Card to Focus Map</span>' +
      '</div>' +
      '<div class="space-y-3" id="interactive-stops-list">' + stops.map(function (s, idx) {
        var badgeClass = s.isStart
          ? "bg-amber-400 text-black font-extrabold shadow-amber-400/30"
          : "bg-white/10 text-amber-400 font-bold border border-amber-400/30";
        return '<div class="p-3.5 rounded-2xl bg-white/5 text-xs border border-white/5 hover:border-amber-400/50 hover:bg-white/10 transition cursor-pointer interactive-stop-card" data-stop-idx="' + idx + '" data-lat="' + s.lat + '" data-lng="' + s.lng + '">' +
          '<div class="flex items-center justify-between gap-2">' +
            '<div class="flex items-center gap-2.5">' +
              '<span class="w-6 h-6 rounded-full ' + badgeClass + ' flex items-center justify-center text-[11px] shadow-md flex-shrink-0">' + s.number + '</span>' +
              '<div>' +
                '<span class="font-extrabold text-white block leading-snug text-xs">' + esc(s.title) + '</span>' +
                '<span class="text-[10px] text-amber-400 font-semibold">' + esc(s.sub) + '</span>' +
              '</div>' +
            '</div>' +
            (s.date ? '<span class="text-[10px] font-semibold text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20 flex-shrink-0">' + esc(s.date) + '</span>' : '') +
          '</div>' +
          (s.address ? '<div class="text-[11px] text-white/60 pl-8 font-medium leading-relaxed flex items-center gap-1.5 pt-1"><i class="fas fa-map-pin text-[9px] text-amber-400/80"></i> ' + esc(s.address) + '</div>' : '') +
        '</div>';
      }).join("") + '</div></div>';
  }

  function renderTrip(trip) {
    if (!page) return;
    if (!trip) {
      page.innerHTML = '<div class="py-16 text-center max-w-md mx-auto bg-white/5 rounded-3xl border border-white/10 space-y-4">' +
        '<div class="w-16 h-16 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto text-2xl"><i class="fas fa-suitcase-rolling"></i></div>' +
        '<h2 class="text-xl font-bold text-white">Trip Not Found</h2>' +
        '<p class="text-xs text-white/60">The requested trip itinerary could not be loaded.</p>' +
        '<a href="trips.html" class="px-6 py-2.5 rounded-full bg-amber-400 text-black text-xs font-bold inline-block">Back to My Trips</a>' +
      '</div>';
      return;
    }

    CURRENT_TRIP_DATA = trip;

    var items = trip.itinerary_items || [];
    var cleanedTitle = cleanTitle(trip.title);
    var origin = resolveOriginAddress(trip);
    var stops = buildTripStops(trip, origin);

    var totalEstimated = items.reduce(function (sum, item) {
      return sum + (Number(item.estimated_cost) || 0);
    }, 0);
    var budgetPct = trip.budget > 0 ? Math.min(100, Math.round((totalEstimated / trip.budget) * 100)) : 0;
    var isOverBudget = trip.budget > 0 && totalEstimated > trip.budget;

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
        '<div class="flex items-center gap-3 flex-wrap">' +
          '<a href="../explore.html" class="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer">' +
            '<i class="fas fa-plus"></i> Add Items' +
          '</a>' +
          '<button type="button" id="ai-review-btn" class="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black text-xs font-bold transition shadow-lg shadow-amber-500/20 inline-flex items-center gap-2">' +
            '<i class="fas fa-brain"></i> AI Trip Review' +
          '</button>' +
        '</div>' +
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

      '<!-- Split Content Grid -->' +
      '<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">' +
        '<!-- Real Leaflet Map Column -->' +
        '<div class="lg:col-span-2">' +
          '<div class="flex items-center justify-between mb-4">' +
            '<h2 class="text-lg font-bold text-white flex items-center gap-2"><i class="fas fa-map-location-dot text-amber-400"></i> Route Trail Map</h2>' +
          '</div>' +
          '<div id="trip-map-container"></div>' +
        '</div>' +

        '<!-- Sidebar Itinerary Column -->' +
        '<div class="lg:col-span-1">' +
          '<div class="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">' +
            '<div class="flex items-center justify-between border-b border-white/10 pb-3">' +
              '<h3 class="text-xs font-bold uppercase tracking-wider text-amber-400"><i class="fas fa-list-check mr-1.5"></i> Itinerary Items (' + items.length + ')</h3>' +
              '<a href="../explore.html" class="text-xs text-white/40 hover:text-white transition font-semibold cursor-pointer">+ Add Items</a>' +
            '</div>' +
            itineraryHtml(items) +
          '</div>' +
          stopsHtml(stops) +
        '</div>' +
      '</div>';

    // Render Real Leaflet Map
    renderRealMap(stops, cleanedTitle);

    // Wire Open Add Modal buttons
    page.querySelectorAll(".open-add-item-btn").forEach(function (btn) {
      btn.addEventListener("click", openAddItemModal);
    });

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
    if (!id) {
      renderTrip(null);
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

    bootModalEvents();

    It.apiGet("/trips/" + id, { auth: true }).then(function (res) {
      var raw = res.data !== undefined ? res.data : (res.body ? (res.body.data || res.body) : res);
      renderTrip(raw);
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
