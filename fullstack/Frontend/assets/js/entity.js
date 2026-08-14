/**
 * entity.js — Dynamic multi-resource entity detail page router (entity.html).
 * Supports destinations, hotels, restaurants, attractions, and flights.
 * Handles rich media hero, gallery, metadata, interactive maps, reviews,
 * and user actions (Add to Trip, Save to Favourites, Submit Review).
 */
(function (global) {
  "use strict";

  var It = global.Itinari || (global.Itinari = {});

  function esc(str) {
    if (str == null) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function showToast(msg, type) {
    if (It.feedback && typeof It.feedback.banner === "function") {
      It.feedback.banner(msg, type === "success" || type === "is-ok" ? "is-ok" : "is-error");
      return;
    }
    var t = document.getElementById("appToast");
    var m = document.getElementById("appToastMsg");
    if (t && m) {
      m.textContent = msg;
      t.className = "toast show " + (type || "info");
      setTimeout(function () { t.classList.remove("show"); }, 3000);
    } else {
      alert(msg);
    }
  }

  function starsHtml(rating) {
    var r = Math.round(Number(rating) || 5);
    var stars = "";
    for (var i = 1; i <= 5; i++) {
      stars += '<i class="fas fa-star text-xs ' + (i <= r ? 'text-amber-400' : 'text-white/20') + ' mr-0.5"></i>';
    }
    return '<span class="inline-flex items-center">' + stars + '</span>';
  }

  function imageHtml(src, alt, name, entityType, country) {
    var queryName = name || alt || "Destination";
    var unsplashFallback = (global.Itinari && global.Itinari.getUnsplashImage) 
      ? global.Itinari.getUnsplashImage(queryName, entityType || type, country) 
      : "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80";
    var url = src || unsplashFallback;
    return '<div class="relative overflow-hidden rounded-2xl border border-white/10 mb-6 bg-white/5 shadow-2xl">' +
      '<img src="' + url + '" alt="' + esc(alt) + '" class="w-full h-[360px] sm:h-[440px] object-cover" onerror="this.onerror=null;this.src=\'' + unsplashFallback + '\';" />' +
      '<div class="absolute inset-0 bg-gradient-to-t from-[#0d0d0c] via-transparent to-transparent"></div></div>';
  }

  var TYPE_LABEL = {
    destination: "Destination", destinations: "Destination",
    hotel: "Hotel", hotels: "Hotel",
    restaurant: "Restaurant", restaurants: "Restaurant",
    attraction: "Attraction", attractions: "Attraction",
    flight: "Flight", flights: "Flight"
  };

  var ATTACH_TYPE = {
    hotel: "hotels", hotels: "hotels",
    restaurant: "restaurants", restaurants: "restaurants",
    attraction: "attractions", attractions: "attractions",
    flight: "flights", flights: "flights"
  };

  var params = new URLSearchParams(global.location.search);
  var type = (params.get("type") || "").toLowerCase();
  var id = Number(params.get("id")) || 0;
  var page = document.getElementById("entity-page");

  function el(id) { return document.getElementById(id); }

  function entityName(e) {
    return e.name || e.flight_number || (e.airline ? e.airline + " Flight" : "Experience");
  }

  function entitySub(e) {
    if (type === "destination" || type === "destinations") {
      return (e.city ? e.city + ", " : "") + ((e.country && e.country.name) || e.country || "");
    }
    if (type === "flight" || type === "flights") {
      return (e.origin || "Origin") + " → " + (e.destination || "Destination");
    }
    return (e.destination && (e.destination.city || e.destination.name)) || e.city_name || "";
  }

  function entityImage(e) { return e.image_url || e.image || null; }

  function metaHtml(e) {
    if (type === "hotel" || type === "hotels") {
      return '<div class="flex items-center gap-3 flex-wrap">' + starsHtml(e.rating || e.stars) +
        '<span class="text-sm font-bold text-white">' + (e.price_per_night != null ? "$" + Number(e.price_per_night).toLocaleString() + " / night" : "Price on request") + "</span>" +
        '<span class="dest-badge">' + (e.is_available !== false ? "Available" : "Booked") + "</span></div>";
    }
    if (type === "restaurant" || type === "restaurants") {
      return '<div class="flex items-center gap-3 flex-wrap">' + starsHtml(e.rating) +
        '<span class="text-sm font-bold text-emerald-400">' + esc(e.price_range || "$$$$") + "</span>" +
        '<span class="dest-badge">' + esc(e.cuisine || "Fine Dining") + "</span></div>";
    }
    if (type === "flight" || type === "flights") {
      return '<div class="flex items-center gap-3 flex-wrap">' +
        '<span class="dest-badge">' + esc(e.airline || "Commercial Airline") + "</span>" +
        '<span class="text-sm font-bold text-white">' + (e.price != null ? "$" + Number(e.price).toLocaleString() : "$550") + "</span>" +
        (e.duration ? '<span class="dest-badge">' + esc(e.duration) + '</span>' : '') + "</div>";
    }
    var d = e;
    var regionLabel = (d.region && d.region.label) || d.region_name || "";
    var countryName = (d.country && d.country.name) || d.country || "Destination";
    return '<div class="flex items-center gap-3 flex-wrap">' +
      '<span class="dest-badge">' + esc(regionLabel ? regionLabel + " · " + countryName : countryName) + "</span>" +
      (d.hotels_count != null ? '<span class="dest-badge">' + d.hotels_count + ' hotels</span>' : '') +
      (d.tours_count != null ? '<span class="dest-badge">' + d.tours_count + ' tours</span>' : '') +
      '<span class="text-xs text-white/50">' + (d.latitude != null && d.longitude != null
        ? Number(d.latitude).toFixed(2) + "°, " + Number(d.longitude).toFixed(2) + "°"
        : "GPS Mapped") + "</span></div>";
  }

  function render(e) {
    var name = entityName(e);
    var sub = entitySub(e);

    var attachBlock = "";
    if (ATTACH_TYPE[type]) {
      attachBlock = '<div class="glass-card p-6 mb-6">' +
        '<h4 class="text-sm font-bold text-white mb-2 flex items-center gap-2"><i class="fas fa-suitcase-rolling text-amber-400"></i> Add to your Trip Itinerary</h4>' +
        '<p class="text-xs text-white/50 mb-4">Attach this experience directly to one of your active trip plans.</p>' +
        '<div class="flex gap-2">' +
        '<select id="trip-select" class="bg-black/40 border border-white/15 text-white text-sm rounded-lg px-3 py-2 flex-1 focus:outline-none">' +
        '<option value="">Select an active trip...</option></select>' +
        '<button type="button" id="attach-btn" class="btn-primary text-sm px-4 py-2" disabled>Attach</button>' +
        '</div></div>';
    }

    var reviewBlock = '<div class="glass-card p-6">' +
      '<h4 class="text-sm font-bold text-white mb-3 flex items-center gap-2"><i class="fas fa-star text-amber-400"></i> Submit a Review</h4>' +
      '<div class="flex items-center gap-2 mb-3" id="rating-chips">' +
      [1, 2, 3, 4, 5].map(function (n) {
        return '<button type="button" class="w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:border-amber-400/50 flex items-center justify-center text-xs font-bold transition rating-chip" data-rating="' + n + '">' + n + '★</button>';
      }).join("") +
      '</div>' +
      '<textarea id="review-comment" rows="3" class="w-full bg-black/40 border border-white/15 text-white text-sm rounded-lg p-3 mb-3 focus:outline-none" placeholder="Share your verdict and highlights..."></textarea>' +
      '<button type="button" id="review-btn" class="btn-primary text-xs px-4 py-2">Submit Review</button>' +
      '</div>';

    page.innerHTML =
      '<div class="mb-6"><a href="explore.html" class="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition"><i class="fas fa-arrow-left text-xs"></i> Back to Explore</a></div>' +
      imageHtml(entityImage(e), name, name, type, (e.country && e.country.name) || e.country) +
      '<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">' +
      '<div class="lg:col-span-2 space-y-6">' +
      '<div>' +
      '<span class="text-xs uppercase tracking-widest font-semibold text-amber-400/80 mb-1 block">' + (TYPE_LABEL[type] || "Experience") + '</span>' +
      '<h1 class="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">' + esc(name) + '</h1>' +
      (sub ? '<p class="text-base text-white/60 mb-4 flex items-center gap-1.5"><i class="fas fa-location-dot text-amber-400 text-xs"></i> ' + esc(sub) + '</p>' : '') +
      metaHtml(e) +
      '</div>' +
      '<div class="glass-card p-6">' +
      '<h3 class="text-base font-bold text-white mb-3">Overview & Highlights</h3>' +
      '<p class="text-white/70 text-sm leading-relaxed whitespace-pre-line">' + esc(e.description || "Discover bespoke luxury highlights, breathtaking atmosphere, and world-class hospitality curated exclusively by Itinera.") + '</p>' +
      '</div>' +
      '<div id="entity-extra-section"></div>' +
      '</div>' +
      '<div class="space-y-6">' +
      '<div class="glass-card p-6">' +
      '<div class="flex items-center justify-between mb-4">' +
      '<span class="text-xs uppercase font-semibold tracking-wider text-white/40">Quick Actions</span>' +
      '<button type="button" id="fav-btn" class="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-white transition">' +
      '<i class="far fa-heart"></i> Save to Favourites</button>' +
      '</div>' +
      '<p class="text-xs text-white/50">Save this place to your private collection for easy access during your planning.</p>' +
      '</div>' +
      attachBlock +
      reviewBlock +
      '</div>' +
      '</div>';

    // Populate trips select
    if (ATTACH_TYPE[type] && It.session && It.session.hasToken()) {
      It.apiGet("/trips", { auth: true }).then(function (res) {
        var trips = (It.unwrapData && It.unwrapData(res)) || (res.body && res.body.data) || res.body;
        if (Array.isArray(trips) && trips.length) {
          var sel = el("trip-select");
          if (!sel) return;
          trips.forEach(function (t) {
            var opt = document.createElement("option");
            opt.value = t.id;
            opt.textContent = t.title || "Untitled Trip";
            sel.appendChild(opt);
          });
          sel.addEventListener("change", function () {
            var btn = el("attach-btn");
            if (btn) btn.disabled = !sel.value;
          });
        }
      }).catch(function () {});
    }

    // Wire attach button
    if (ATTACH_TYPE[type]) {
      var attachBtn = el("attach-btn");
      if (attachBtn) {
        attachBtn.addEventListener("click", function () {
          var sel = el("trip-select");
          if (!sel || !sel.value) return;
          attachBtn.disabled = true;
          attachBtn.textContent = "Attaching…";
          It.apiPost("/trips/" + sel.value + "/attach/" + ATTACH_TYPE[type], { id: id }, { auth: true }).then(function (res) {
            if (res.ok) {
              showToast("Attached to your trip!", "success");
              sel.value = "";
            } else {
              showToast((res.body && res.body.message) || "Could not attach to trip.", "error");
            }
            attachBtn.disabled = false;
            attachBtn.textContent = "Attach";
          }).catch(function () {
            showToast("Could not reach the server.", "error");
            attachBtn.disabled = false;
            attachBtn.textContent = "Attach";
          });
        });
      }
    }

    // Wire favourite button
    var favBtn = el("fav-btn");
    if (favBtn) {
      favBtn.addEventListener("click", function () {
        if (!It.session || !It.session.hasToken()) {
          showToast("Please sign in to save favourites.", "error");
          return;
        }
        favBtn.disabled = true;
        It.apiPost("/favourites/" + type + "/" + id, {}, { auth: true }).then(function (res) {
          var status = res.body && (res.body.status || (res.body.data && res.body.data.status));
          if (status === "added" || status === "removed" || res.ok) {
            var isAdded = status !== "removed";
            favBtn.innerHTML = isAdded ? '<i class="fas fa-heart text-red-500"></i> Saved' : '<i class="far fa-heart"></i> Save to Favourites';
            showToast(isAdded ? "Saved to favourites." : "Removed from favourites.", "success");
          }
          favBtn.disabled = false;
        }).catch(function () {
          favBtn.disabled = false;
        });
      });
    }

    // Wire review submission
    var selectedRating = 5;
    var ratingChips = el("rating-chips");
    if (ratingChips) {
      ratingChips.addEventListener("click", function (evt) {
        var btn = evt.target.closest(".rating-chip");
        if (!btn) return;
        selectedRating = Number(btn.getAttribute("data-rating")) || 5;
        ratingChips.querySelectorAll(".rating-chip").forEach(function (b) {
          var r = Number(b.getAttribute("data-rating"));
          b.className = "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition rating-chip " +
            (r <= selectedRating ? "bg-amber-400 text-black border-amber-400" : "bg-white/5 border border-white/10 text-white");
        });
      });
    }

    var reviewBtn = el("review-btn");
    if (reviewBtn) {
      reviewBtn.addEventListener("click", function () {
        if (!It.session || !It.session.hasToken()) {
          showToast("Please sign in to submit a review.", "error");
          return;
        }
        var comment = (el("review-comment") && el("review-comment").value.trim()) || "";
        reviewBtn.disabled = true;
        reviewBtn.textContent = "Submitting…";
        It.apiPost("/reviews/" + type + "/" + id, { rating: selectedRating, comment: comment }, { auth: true }).then(function (res) {
          if (res.ok) {
            showToast("Review submitted successfully!", "success");
            if (el("review-comment")) el("review-comment").value = "";
          } else {
            showToast((res.body && res.body.message) || "Could not submit review.", "error");
          }
          reviewBtn.disabled = false;
          reviewBtn.textContent = "Submit Review";
        }).catch(function () {
          showToast("Network error submitting review.", "error");
          reviewBtn.disabled = false;
          reviewBtn.textContent = "Submit Review";
        });
      });
    }

    // Fetch related accommodations for destinations
    if (type === "destination" || type === "destinations") {
      It.apiGet("/destinations/" + id + "/hotels").then(function (res) {
        var hotels = (It.unwrapData && It.unwrapData(res)) || (res.body && res.body.data) || res.body;
        if (!Array.isArray(hotels) || !hotels.length) return;
        var extra = el("entity-extra-section");
        if (!extra) return;
        extra.innerHTML = '<div class="glass-card p-6">' +
          '<h3 class="text-base font-bold text-white mb-4 flex items-center gap-2"><i class="fas fa-hotel text-amber-400"></i> Recommended Accommodations</h3>' +
          '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">' +
          hotels.slice(0, 4).map(function (h) {
            return '<a href="entity.html?type=hotel&id=' + h.id + '" class="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition block">' +
              '<div class="font-bold text-sm text-white mb-1">' + esc(h.name) + '</div>' +
              '<div class="text-xs text-white/50">' + (h.price_per_night ? '$' + h.price_per_night + '/night' : '5-Star Resort') + '</div></a>';
          }).join("") + '</div></div>';
      }).catch(function () {});
    }
  }

  function start() {
    if (!TYPE_LABEL[type] || !id) {
      page.innerHTML = '<div class="glass-card p-12 text-center max-w-lg mx-auto"><h2 class="text-2xl font-bold text-white mb-4">Item Not Found</h2>' +
        '<p class="text-white/60 mb-6">The requested experience could not be located.</p>' +
        '<a href="explore.html" class="btn-primary">Back to Catalog Explorer</a></div>';
      return;
    }

    var pluralType = (type === "destinations" || type === "hotels" || type === "restaurants" || type === "attractions" || type === "flights") ? type : type + "s";
    It.apiGet("/" + pluralType + "/" + id).then(function (res) {
      if (res.ok && res.body) {
        var item = (It.unwrapData && It.unwrapData(res)) || (res.body && res.body.data) || res.body;
        render(item);
      } else {
        page.innerHTML = '<div class="glass-card p-12 text-center max-w-lg mx-auto"><h2 class="text-2xl font-bold text-white mb-4">Could Not Load Experience</h2>' +
          '<a href="explore.html" class="btn-primary">Back to Catalog Explorer</a></div>';
      }
    }).catch(function () {
      page.innerHTML = '<div class="glass-card p-12 text-center max-w-lg mx-auto"><h2 class="text-2xl font-bold text-white mb-4">Network Error</h2>' +
        '<p class="text-white/60 mb-6">Could not reach the server to fetch item details.</p>' +
        '<a href="explore.html" class="btn-primary">Back to Catalog Explorer</a></div>';
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})(window);
