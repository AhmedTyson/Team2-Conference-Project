/**
 * trip.js — Luxury Trip Detail View.
 * Handles stats, AI Review, interactive SVG route, itinerary detach, & stops.
 */
(function (global) {
  "use strict";

  var It = global.Itinari;
  if (!It) return;

  var id = Number(new URLSearchParams(global.location.search).get("id")) || 0;
  var page = document.getElementById("trip-page");

  var TYPE_ICON = {
    hotel: "fa-hotel",
    restaurant: "fa-utensils",
    attraction: "fa-landmark",
    flight: "fa-plane",
    destination: "fa-location-dot"
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

  function formatDate(value) {
    if (!value) return "—";
    var d = new Date(String(value).slice(0, 10) + "T00:00:00");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function pointsFromItems(items) {
    var points = [];
    var seen = {};
    (items || []).forEach(function (item) {
      var raw = item.itemable;
      var lat = Number(raw && raw.latitude);
      var lng = Number(raw && raw.longitude);
      if (raw && isFinite(lat) && isFinite(lng) && lat !== 0 && lng !== 0) {
        var key = lat + "," + lng;
        if (!seen[key]) { seen[key] = true; points.push({ name: item.title, lat: lat, lng: lng }); }
      }
    });
    return points;
  }

  function mapSvg(points, title) {
    if (!points || !points.length) {
      return '<div class="py-12 text-center text-white/40 text-sm bg-white/5 rounded-2xl border border-white/10">' +
        '<i class="fas fa-map-location-dot text-2xl mb-2 block text-white/30"></i>' +
        '<p>No coordinates attached to route stops yet.</p></div>';
    }
    var SIZE = 600;
    var lats = points.map(function (p) { return p.lat; });
    var lngs = points.map(function (p) { return p.lng; });
    var minLat = Math.min.apply(null, lats), maxLat = Math.max.apply(null, lats);
    var minLng = Math.min.apply(null, lngs), maxLng = Math.max.apply(null, lngs);
    var pad = 90;
    var spanLat = Math.max(maxLat - minLat, 0.01);
    var spanLng = Math.max(maxLng - minLng, 0.01);

    var grid = "";
    for (var i = 1; i < 7; i++) {
      var x = (SIZE / 7) * i;
      var y = (SIZE / 7) * i;
      grid += '<line x1="' + x + '" y1="0" x2="' + x + '" y2="' + SIZE + '" stroke="rgba(255,255,255,0.05)" stroke-dasharray="4" />' +
        '<line x1="0" y1="' + y + '" x2="' + SIZE + '" y2="' + y + '" stroke="rgba(255,255,255,0.05)" stroke-dasharray="4" />';
    }

    var pathD = "";
    var pins = points.map(function (p, idx) {
      var px = pad + ((p.lng - minLng) / spanLng) * (SIZE - pad * 2);
      var py = SIZE - pad - ((p.lat - minLat) / spanLat) * (SIZE - pad * 2);
      if (idx === 0) pathD += "M " + px.toFixed(1) + " " + py.toFixed(1);
      else pathD += " L " + px.toFixed(1) + " " + py.toFixed(1);

      return '<g class="group cursor-pointer">' +
        '<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="' + (idx === 0 ? 20 : 14) + '" fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.5)" stroke-width="2" />' +
        '<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="6" fill="#f59e0b" />' +
        '<text x="' + px.toFixed(1) + '" y="' + (py - 16).toFixed(1) + '" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="600">' +
        esc(p.name) + "</text></g>";
    }).join("");

    var trail = pathD ? '<path d="' + pathD + '" fill="none" stroke="rgba(245,158,11,0.6)" stroke-width="3" stroke-dasharray="6 4" />' : '';

    return '<div class="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-white/5 p-4">' +
      '<svg viewBox="0 0 ' + SIZE + " " + SIZE + '" class="w-full h-auto rounded-xl bg-[#111]">' +
      grid + trail + pins + "</svg>" +
      '<div class="mt-3 text-xs text-white/40 flex items-center justify-between px-2">' +
      '<span><i class="fas fa-route mr-1 text-amber-400"></i> ' + points.length + ' Location Stop(s)</span>' +
      '<span>OSRM Trail Mode</span></div></div>';
  }

  function itineraryHtml(items) {
    if (!items || !items.length) {
      return '<div class="py-8 text-center text-white/40 text-xs bg-white/5 rounded-xl border border-white/10">' +
        '<i class="fas fa-folder-open text-xl mb-1 block opacity-30"></i>' +
        '<p>No items attached yet.</p>' +
        '<a href="../explore.html" class="inline-block mt-2 text-amber-400 hover:underline font-medium">Explore Catalog →</a></div>';
    }

    return '<div class="space-y-3 item-list">' + items.map(function (item) {
      var iconCls = TYPE_ICON[item.itemable_type] || "fa-bookmark";
      var urlPrefix = TYPE_URL[item.itemable_type];
      var itemTitle = esc(item.title || "Itinerary Item");
      var titleHtml = urlPrefix ? '<a href="' + urlPrefix + (item.itemable_id || "") + '" class="hover:text-amber-400 transition">' + itemTitle + '</a>' : itemTitle;

      return '<div class="item-row flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition">' +
        '<div class="flex items-center gap-3">' +
        '<div class="w-9 h-9 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center text-sm">' +
        '<i class="fas ' + iconCls + '"></i></div>' +
        '<div>' +
        '<h4 class="text-sm font-semibold text-white">' + titleHtml + '</h4>' +
        '<p class="text-xs text-white/40 mt-0.5">' +
        'Day ' + (item.day_number || 1) + (item.estimated_cost ? ' · $' + Number(item.estimated_cost).toLocaleString() : '') +
        '</p></div></div>' +
        '<button type="button" class="item-row__remove text-white/40 hover:text-red-400 p-2 text-xs transition" data-pivot="' + item.id + '" data-title="' + itemTitle + '" aria-label="Remove item"><i class="fas fa-trash-can"></i></button>' +
        '</div>';
    }).join("") + '</div>';
  }

  function stopsHtml(destinations) {
    if (!destinations || !destinations.length) return "";
    return '<div class="mt-6 p-5 rounded-2xl bg-white/5 border border-white/10">' +
      '<h3 class="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3"><i class="fas fa-map-pin mr-1.5"></i> Destination Stops</h3>' +
      '<div class="space-y-2">' + destinations.map(function (d, idx) {
        return '<div class="flex items-center justify-between p-2.5 rounded-lg bg-white/5 text-xs">' +
          '<div class="flex items-center gap-2.5">' +
          '<span class="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 font-mono font-bold flex items-center justify-center text-[10px]">' + (idx + 1) + '</span>' +
          '<span class="font-medium text-white">' + esc(d.name) + '</span></div>' +
          (d.pivot && d.pivot.estimated_date ? '<span class="text-white/40 text-[11px]">' + formatDate(d.pivot.estimated_date) + '</span>' : '') +
          '</div>';
      }).join("") + '</div></div>';
  }

  function renderTrip(trip) {
    var items = trip.itinerary_items || [];
    var destinations = trip.destinations || [];
    var points = pointsFromItems(items);

    var totalEstimated = items.reduce(function (sum, item) {
      return sum + (Number(item.estimated_cost) || 0);
    }, 0);
    var budgetPct = trip.budget > 0 ? Math.min(100, Math.round((totalEstimated / trip.budget) * 100)) : 0;
    var isOverBudget = trip.budget > 0 && totalEstimated > trip.budget;

    page.innerHTML =
      '<!-- Header Hero -->' +
      '<div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-white/10 pb-8">' +
        '<div>' +
          '<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">' +
            '<i class="fas fa-compass"></i> Trip #' + trip.id + ' · ' + esc(trip.travel_style || "Custom") + ' Style' +
          '</div>' +
          '<h1 class="text-3xl sm:text-5xl font-black tracking-tight text-white">' + esc(trip.title) + '</h1>' +
          '<p class="text-white/60 text-sm mt-2 flex items-center gap-4">' +
            '<span><i class="far fa-calendar mr-1.5 text-white/40"></i>' + (trip.no_of_days || "—") + ' Days</span>' +
            '<span><i class="fas fa-users mr-1.5 text-white/40"></i>' + (trip.no_of_travelers || 1) + ' Traveler(s)</span>' +
          '</p>' +
        '</div>' +
        '<div class="flex items-center gap-3 flex-wrap">' +
          '<a href="trip-form.html" class="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition inline-flex items-center gap-2"><i class="fas fa-plus"></i> New Trip</a>' +
          '<button type="button" id="ai-review-btn" class="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black text-xs font-bold transition shadow-lg shadow-amber-500/20 inline-flex items-center gap-2">' +
            '<i class="fas fa-robot"></i> AI Review' +
          '</button>' +
        '</div>' +
      '</div>' +

      '<!-- Stats Band -->' +
      '<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">' +
        '<div class="p-4 rounded-2xl bg-white/5 border border-white/10">' +
          '<span class="text-xs text-white/40 uppercase tracking-wider font-semibold block mb-1">Dates</span>' +
          '<span class="text-sm font-bold text-white block">' + formatDate(trip.start_date) + ' → ' + formatDate(trip.end_date) + '</span>' +
        '</div>' +
        '<div class="p-4 rounded-2xl bg-white/5 border border-white/10">' +
          '<span class="text-xs text-white/40 uppercase tracking-wider font-semibold block mb-1">Budget</span>' +
          '<span class="text-sm font-bold text-amber-400 block">' + (trip.budget != null ? '$' + Number(trip.budget).toLocaleString() : '—') + '</span>' +
        '</div>' +
        '<div class="p-4 rounded-2xl bg-white/5 border border-white/10">' +
          '<span class="text-xs text-white/40 uppercase tracking-wider font-semibold block mb-1">Est. Cost (' + budgetPct + '%)</span>' +
          '<span class="text-sm font-bold block ' + (isOverBudget ? 'text-red-400' : 'text-emerald-400') + '">$' + totalEstimated.toLocaleString() + '</span>' +
        '</div>' +
        '<div class="p-4 rounded-2xl bg-white/5 border border-white/10">' +
          '<span class="text-xs text-white/40 uppercase tracking-wider font-semibold block mb-1">Attached Items</span>' +
          '<span class="text-sm font-bold text-white block">' + items.length + ' Items</span>' +
        '</div>' +
      '</div>' +

      '<!-- AI Diagnostic Container -->' +
      '<div id="ai-review-result" class="mb-8" hidden></div>' +

      '<!-- Split Content Grid -->' +
      '<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">' +
        '<!-- Map / Trail -->' +
        '<div class="lg:col-span-2">' +
          '<div class="flex items-center justify-between mb-4">' +
            '<h2 class="text-lg font-bold text-white flex items-center gap-2"><i class="fas fa-map-location-dot text-amber-400 text-sm"></i> Route Trail Map</h2>' +
          '</div>' +
          '<div id="trip-map">' + mapSvg(points, trip.title) + '</div>' +
        '</div>' +

        '<!-- Sidebar Itinerary -->' +
        '<div class="lg:col-span-1">' +
          '<div class="p-5 rounded-2xl bg-white/5 border border-white/10">' +
            '<div class="flex items-center justify-between mb-4">' +
              '<h3 class="text-xs font-semibold uppercase tracking-wider text-amber-400"><i class="fas fa-list-check mr-1.5"></i> Itinerary (' + items.length + ')</h3>' +
              '<a href="../explore.html" class="text-xs text-white/40 hover:text-white transition">+ Add Items</a>' +
            '</div>' +
            itineraryHtml(items) +
          '</div>' +
          stopsHtml(destinations) +
        '</div>' +
      '</div>';

    // AI Review Event Handler
    var aiReviewBtn = el("ai-review-btn");
    if (aiReviewBtn) {
      aiReviewBtn.addEventListener("click", function () {
        var resBox = el("ai-review-result");
        aiReviewBtn.disabled = true;
        aiReviewBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Analyzing…';
        It.apiGet("/ai/review/" + trip.id, { auth: true }).then(function (res) {
          aiReviewBtn.disabled = false;
          aiReviewBtn.innerHTML = '<i class="fas fa-robot mr-1"></i> Re-run AI Review';
          if (res.ok && res.body) {
            var reviewData = res.body.data || res.body;
            var summary = reviewData.review_summary || reviewData.review || reviewData.content || (typeof reviewData === "string" ? reviewData : JSON.stringify(reviewData));
            var suggestions = Array.isArray(reviewData.suggestions) ? reviewData.suggestions : [];

            resBox.hidden = false;
            resBox.innerHTML = '<div class="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-white shadow-xl">' +
              '<div class="flex items-center justify-between mb-3">' +
              '<h3 class="text-sm font-bold text-amber-400 flex items-center gap-2"><i class="fas fa-sparkles"></i> AI Itinerary Diagnostic</h3>' +
              '<button type="button" class="text-xs text-white/40 hover:text-white" onclick="document.getElementById(\'ai-review-result\').hidden=true"><i class="fas fa-xmark"></i> Close</button>' +
              '</div>' +
              '<p class="text-xs text-white/80 leading-relaxed mb-3">' + esc(summary) + '</p>' +
              (suggestions.length ? '<div class="space-y-1.5 border-t border-amber-500/20 pt-3">' +
                suggestions.map(function (s) { return '<div class="text-[11px] text-amber-200/90 flex items-start gap-2"><i class="fas fa-angle-right text-amber-400 mt-0.5"></i><span>' + esc(s) + '</span></div>'; }).join("") +
                '</div>' : '') +
              '</div>';
          } else {
            It.app.showToast((res.body && res.body.message) || "Could not generate AI review.", "error");
          }
        }).catch(function () {
          aiReviewBtn.disabled = false;
          aiReviewBtn.innerHTML = '<i class="fas fa-robot mr-1"></i> AI Review';
          It.app.showToast("Could not reach AI service.", "error");
        });
      });
    }

    // Detach Handler
    Array.prototype.forEach.call(page.querySelectorAll(".item-row__remove"), function (btn) {
      btn.addEventListener("click", function () {
        var pivotId = btn.dataset.pivot;
        if (!global.confirm('Remove "' + btn.dataset.title + '" from this trip?')) return;
        btn.disabled = true;
        It.apiDelete("/trips/" + id + "/detach/" + pivotId, { auth: true }).then(function (res) {
          if (res.ok) {
            It.app.showToast("Item removed from the trip.", "info");
            var row = btn.closest(".item-row");
            if (row) row.parentNode.removeChild(row);
          } else {
            It.app.showToast((res.body && res.body.message) || "Could not remove the item.", "error");
            btn.disabled = false;
          }
        }).catch(function () {
          It.app.showToast("Could not remove the item.", "error");
          btn.disabled = false;
        });
      });
    });
  }

  function loadTrip() {
    if (!id) {
      page.innerHTML = '<div class="py-16 text-center text-white/50">' +
        '<h2 class="text-xl font-bold text-white mb-2">Trip Not Found</h2>' +
        '<p class="text-sm text-white/60 mb-4">Please provide a valid trip ID.</p>' +
        '<a href="trip-form.html" class="px-4 py-2 rounded-full bg-amber-400 text-black text-xs font-bold">Create New Trip</a></div>';
      return;
    }

    It.apiGet("/trips/" + id, { auth: true }).then(function (res) {
      var trip = res.data !== undefined ? res.data : (res.body ? (res.body.data || res.body) : res);
      if (!trip || !trip.id) {
        page.innerHTML = '<div class="py-16 text-center text-white/50">' +
          '<h2 class="text-xl font-bold text-white mb-2">Trip Not Found</h2>' +
          '<p class="text-sm text-white/60 mb-4">This trip may belong to another user or was deleted.</p>' +
          '<a href="trip-form.html" class="px-4 py-2 rounded-full bg-amber-400 text-black text-xs font-bold">Create New Trip</a></div>';
        return;
      }
      renderTrip(trip);
    }).catch(function (err) {
      page.innerHTML = '<div class="py-16 text-center text-white/50">' +
        '<h2 class="text-xl font-bold text-white mb-2">Could Not Load Trip</h2>' +
        '<p class="text-sm text-white/60 mb-4">' + esc(err.message || "Failed to communicate with backend service.") + '</p>' +
        '<a href="trip-form.html" class="px-4 py-2 rounded-full bg-amber-400 text-black text-xs font-bold">Create New Trip</a></div>';
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadTrip);
  } else {
    loadTrip();
  }
})(window);
