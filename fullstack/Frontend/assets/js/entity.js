/**
 * entity.js — Dynamic multi-resource entity detail page router (entity.html).
 * Supports destinations, hotels, restaurants, attractions, and flights.
 * Features luxury hero image, metadata badges, state-of-the-art Quick Actions sidebar,
 * initial favourite pre-checking, and 100% dynamic Reviews Section with PENDING admin approval cycle.
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

  function starsHtml(rating, starClass) {
    var r = Math.round(Number(rating) || 5);
    var stars = "";
    var color = starClass || "text-amber-400";
    for (var i = 1; i <= 5; i++) {
      stars += '<i class="fas fa-star text-xs ' + (i <= r ? color : 'text-white/20') + ' mr-0.5"></i>';
    }
    return '<span class="inline-flex items-center">' + stars + '</span>';
  }

  function imageHtml(src, alt, name, entityType, country) {
    var queryName = name || alt || "Destination";
    var unsplashFallback = (global.Itinari && global.Itinari.getUnsplashImage) 
      ? global.Itinari.getUnsplashImage(queryName, entityType || type, country) 
      : "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80";
    var url = src || unsplashFallback;
    return '<div class="relative overflow-hidden rounded-3xl border border-white/10 mb-8 bg-white/5 shadow-2xl">' +
      '<img src="' + url + '" alt="' + esc(alt) + '" class="w-full h-[360px] sm:h-[460px] object-cover" onerror="this.onerror=null;this.src=\'' + unsplashFallback + '\';" />' +
      '<div class="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-90"></div></div>';
  }

  var TYPE_LABEL = {
    destination: "Destination", destinations: "Destination",
    hotel: "Hotel", hotels: "Hotel",
    restaurant: "Restaurant", restaurants: "Restaurant",
    attraction: "Attraction", attractions: "Attraction",
    flight: "Flight", flights: "Flight",
    airport: "Airport / Flight", airports: "Airport / Flight"
  };

  var ATTACH_TYPE = {
    hotel: "hotel", hotels: "hotel",
    restaurant: "restaurant", restaurants: "restaurant",
    attraction: "attraction", attractions: "attraction",
    flight: "flight", flights: "flight",
    destination: "destination", destinations: "destination",
    airport: "flight", airports: "flight"
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
        '<span class="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">' + (e.is_available !== false ? "Available" : "Booked") + "</span></div>";
    }
    if (type === "restaurant" || type === "restaurants") {
      return '<div class="flex items-center gap-3 flex-wrap">' + starsHtml(e.rating) +
        '<span class="text-sm font-bold text-emerald-400">' + esc(e.price_range || "$$$$") + "</span>" +
        '<span class="px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-semibold">' + esc(e.cuisine || "Fine Dining") + "</span></div>";
    }
    if (type === "flight" || type === "flights") {
      return '<div class="flex items-center gap-3 flex-wrap">' +
        '<span class="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">' + esc(e.airline || "Commercial Airline") + "</span>" +
        '<span class="text-sm font-bold text-white">' + (e.price != null ? "$" + Number(e.price).toLocaleString() : "$550") + "</span>" +
        (e.duration ? '<span class="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">' + esc(e.duration) + '</span>' : '') + "</div>";
    }
    var d = e;
    var regionLabel = (d.region && d.region.label) || d.region_name || "";
    var countryName = (d.country && d.country.name) || d.country || "Destination";
    return '<div class="flex items-center gap-3 flex-wrap">' +
      '<span class="px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-semibold">' + esc(regionLabel ? regionLabel + " · " + countryName : countryName) + "</span>" +
      (d.hotels_count != null ? '<span class="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">' + d.hotels_count + ' hotels</span>' : '') +
      (d.tours_count != null ? '<span class="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">' + d.tours_count + ' tours</span>' : '') +
      '<span class="text-xs text-white/50">' + (d.latitude != null && d.longitude != null
        ? Number(d.latitude).toFixed(2) + "°, " + Number(d.longitude).toFixed(2) + "°"
        : "GPS Mapped") + "</span></div>";
  }

  /** Skeleton loading state for reviews container */
  function renderReviewsSkeleton() {
    return '<div class="p-6 sm:p-8 rounded-3xl bg-white/5 border border-white/10 animate-pulse space-y-6 mt-10">' +
      '<div class="flex justify-between items-center">' +
        '<div class="h-8 w-40 bg-white/10 rounded-full"></div>' +
        '<div class="h-10 w-32 bg-white/10 rounded-full"></div>' +
      '</div>' +
      '<div class="h-36 bg-white/10 rounded-2xl"></div>' +
      '<div class="space-y-4 pt-4">' +
        '<div class="h-20 bg-white/10 rounded-2xl"></div>' +
        '<div class="h-20 bg-white/10 rounded-2xl"></div>' +
      '</div>' +
    '</div>';
  }

  /** Render 100% Dynamic Reviews Section matching site luxury design system & PENDING approval status cycle */
  function renderReviewsSection(entity, apiPayload) {
    var name = entityName(entity);
    var summary = (apiPayload && apiPayload.summary) || {
      rating: 0,
      total_reviews: 0,
      distribution: {
        "5": { count: 0, percentage: 0 },
        "4": { count: 0, percentage: 0 },
        "3": { count: 0, percentage: 0 },
        "2": { count: 0, percentage: 0 },
        "1": { count: 0, percentage: 0 }
      },
      sub_scores: { cleanliness: 0, safety: 0, staff: 0, amenities: 0, location: 0 }
    };

    var dbReviews = (apiPayload && Array.isArray(apiPayload.reviews)) ? apiPayload.reviews : [];
    var userReview = (apiPayload && apiPayload.user_review) ? apiPayload.user_review : null;

    var ratingDisplay = summary.rating ? Number(summary.rating).toFixed(1) : "0.0";
    var totalDisplay = summary.total_reviews ? summary.total_reviews.toLocaleString() + " verified ratings" : "No verified ratings yet";
    var dist = summary.distribution || {};
    var sub = summary.sub_scores || {};

    var headerBtnText = userReview ? '<i class="fas fa-pen-to-square mr-1"></i> Edit Your Review' : '<i class="fas fa-pen-to-square mr-1"></i> Write a Review';
    var formTitle = userReview
      ? 'Edit Your Review for <span class="text-amber-400">' + esc(name) + '</span>'
      : 'We love to hear from you! How\'s your experience with <span class="text-amber-400">' + esc(name) + '</span>?';
    var submitBtnText = userReview ? '<i class="fas fa-floppy-disk mr-1"></i> Update Review' : 'Submit Review';
    var initialCommentText = userReview && userReview.comment ? esc(userReview.comment) : '';
    var initialRating = userReview && userReview.rating ? userReview.rating : 5;

    var reviewsFeedHtml = "";
    if (dbReviews.length === 0) {
      reviewsFeedHtml = '<div class="p-8 sm:p-12 text-center text-white/50 bg-white/5 rounded-3xl border border-white/10 my-4">' +
        '<div class="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto mb-4 text-2xl shadow-lg shadow-amber-500/10">' +
          '<i class="fas fa-comments"></i>' +
        '</div>' +
        '<h3 class="text-xl font-bold text-white mb-2">No Approved Reviews Yet</h3>' +
        '<p class="text-sm text-white/60 mb-6 max-w-md mx-auto">' +
          'Be the first traveler to share your verdict and experience about this experience!' +
        '</p>' +
      '</div>';
    } else {
      reviewsFeedHtml = dbReviews.map(function(rev) {
        var userAvatar = rev.user_avatar || ("https://ui-avatars.com/api/?name=" + encodeURIComponent(rev.user_name || "User") + "&background=262626&color=fbbf24&bold=true");

        var statusBadgeHtml = "";
        if (rev.is_pending || rev.status === "pending") {
          statusBadgeHtml = '<div class="flex items-center gap-2 flex-wrap">' +
            '<span class="px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-bold flex items-center gap-1.5 shadow-sm">' +
              '<i class="fas fa-clock text-amber-400"></i> Pending Admin Approval' +
            '</span>' +
            '<div class="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs font-bold">' +
              '<span class="text-white font-extrabold">' + Number(rev.rating).toFixed(1) + '</span>' +
              starsHtml(rev.rating, "text-amber-400") +
            '</div>' +
          '</div>';
        } else {
          statusBadgeHtml = '<div class="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs font-bold">' +
            '<span class="text-white font-extrabold">' + Number(rev.rating).toFixed(1) + '</span>' +
            starsHtml(rev.rating, "text-amber-400") +
          '</div>';
        }

        var commentHtml = (rev.comment && rev.comment.trim())
          ? '<p class="text-xs sm:text-sm text-white/80 leading-relaxed pt-1">' + esc(rev.comment) + '</p>'
          : '';

        return '<div class="border-t border-white/10 pt-6 first:border-0 first:pt-0 space-y-2.5">' +
          '<div class="flex items-center justify-between flex-wrap gap-2">' +
            '<div class="flex items-center gap-3">' +
              '<img src="' + esc(userAvatar) + '" alt="' + esc(rev.user_name) + '" class="w-10 h-10 rounded-full object-cover border border-amber-400/30 shadow-md" onerror="this.src=\'https://ui-avatars.com/api/?name=User&background=262626&color=fbbf24&bold=true\';" />' +
              '<div>' +
                '<h4 class="text-sm font-bold text-white leading-tight flex items-center gap-2">' + esc(rev.user_name) + '</h4>' +
                '<span class="text-[11px] text-white/40">' + esc(rev.time_ago || "Recently") + '</span>' +
              '</div>' +
            '</div>' +
            statusBadgeHtml +
          '</div>' +
          commentHtml +
        '</div>';
      }).join("");
    }

    return '<div class="p-6 sm:p-8 rounded-3xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-md space-y-8 mt-10" id="reviews-card-section">' +
      '<!-- Reviews Header -->' +
      '<div class="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-4">' +
        '<div>' +
          '<span class="text-xs uppercase font-semibold tracking-wider text-amber-400 mb-1 block"><i class="fas fa-comments mr-1"></i> Guest Feedback</span>' +
          '<h2 class="text-2xl sm:text-3xl font-black text-white tracking-tight">Verified Reviews</h2>' +
        '</div>' +
        '<button type="button" id="toggle-review-form-btn" class="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-xs transition shadow-lg shadow-amber-500/20 flex items-center gap-1.5">' +
          headerBtnText +
        '</button>' +
      '</div>' +

      '<!-- Interactive Review Submission Accordion with Pre-populated Review Data -->' +
      '<div id="write-review-accordion" class="hidden p-6 sm:p-8 rounded-2xl bg-white/5 border border-amber-400/30 space-y-5 shadow-xl">' +
        '<div>' +
          '<h3 class="text-base sm:text-lg font-bold text-white mb-1">' + formTitle + '</h3>' +
          '<p class="text-xs text-white/50">Hover over stars to adjust rating. Editing your review will resubmit it for admin approval.</p>' +
        '</div>' +

        '<!-- Interactive 5 Gold Stars Widget with Hover Fill -->' +
        '<div class="space-y-2 py-1">' +
          '<div class="flex items-center gap-3.5" id="interactive-star-rating" data-selected="' + initialRating + '">' +
            [1, 2, 3, 4, 5].map(function (n) {
              var isFilled = n <= initialRating;
              var starClass = isFilled
                ? 'fas fa-star text-4xl sm:text-5xl text-amber-400 cursor-pointer transition-all duration-200 hover:scale-110 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)] star-icon'
                : 'fas fa-star text-4xl sm:text-5xl text-white/20 cursor-pointer transition-all duration-200 hover:scale-110 drop-shadow-none star-icon';
              return '<i class="' + starClass + '" data-rating="' + n + '"></i>';
            }).join("") +
          '</div>' +

          '<!-- Dynamic Sentiment Subtitle Text -->' +
          '<p class="text-sm font-semibold text-amber-300/90 transition-all duration-200 flex items-center gap-2" id="rating-sentiment-label">' +
            '<i class="fas fa-face-grin-stars text-amber-400"></i> Amazing experience! Love it!' +
          '</p>' +
        '</div>' +

        '<!-- Review Comment Input (Optional, Pre-filled on edit) -->' +
        '<textarea id="review-comment" rows="3" class="w-full bg-black/40 border border-white/15 text-white text-sm rounded-xl p-3.5 focus:border-amber-400 focus:outline-none transition" placeholder="Share more details about your stay, food, or adventure (optional)...">' + initialCommentText + '</textarea>' +

        '<div class="flex justify-end gap-3">' +
          '<button type="button" id="cancel-review-form-btn" class="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition">Cancel</button>' +
          '<button type="button" id="review-btn" class="px-6 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-xs transition shadow-lg shadow-amber-500/20">' + submitBtnText + '</button>' +
        '</div>' +
      '</div>' +

      '<!-- Dynamic Rating Overview & Breakdown Grid -->' +
      '<div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-center bg-white/5 p-6 rounded-2xl border border-white/10">' +
        '<!-- Left Big Score Box -->' +
        '<div class="md:col-span-1 border-b md:border-b-0 md:border-r border-white/10 pb-6 md:pb-0 md:pr-6 text-center md:text-left">' +
          '<div class="text-5xl font-black text-white tracking-tight mb-1" id="dyn-overall-rating">' + esc(ratingDisplay) + '</div>' +
          '<div class="flex items-center justify-center md:justify-start gap-1 mb-1">' +
            starsHtml(summary.rating, "text-amber-400") +
          '</div>' +
          '<p class="text-xs text-white/50 font-semibold" id="dyn-total-count">' + esc(totalDisplay) + '</p>' +
        '</div>' +

        '<!-- Right Star Rating Distribution Bars -->' +
        '<div class="md:col-span-2 space-y-2.5 text-xs font-semibold text-white/70">' +
          [5, 4, 3, 2, 1].map(function(lvl) {
            var levelData = (dist && dist[lvl]) || { count: 0, percentage: 0 };
            var pct = levelData.percentage || 0;
            var cnt = levelData.count || 0;
            return '<div class="flex items-center gap-3">' +
              '<span class="w-6 text-right font-bold text-white">' + lvl.toFixed(1) + '</span>' +
              '<div class="h-2 rounded-full bg-white/10 overflow-hidden flex-1">' +
                '<div class="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500" style="width: ' + pct + '%"></div>' +
              '</div>' +
              '<span class="w-24 text-right text-white/40 font-medium">' + cnt.toLocaleString() + ' reviews</span>' +
            '</div>';
          }).join("") +
        '</div>' +
      '</div>' +

      '<!-- Dynamic Sub-Category Score Badges Row -->' +
      '<div class="flex items-center gap-3 flex-wrap pt-2">' +
        '<div class="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2 text-xs font-semibold shadow-sm">' +
          '<span class="text-emerald-400 font-black text-sm">' + (sub.cleanliness || 0).toFixed(1) + '</span>' +
          '<span class="text-white/80">Cleanliness</span>' +
        '</div>' +
        '<div class="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2 text-xs font-semibold shadow-sm">' +
          '<span class="text-emerald-400 font-black text-sm">' + (sub.safety || 0).toFixed(1) + '</span>' +
          '<span class="text-white/80">Safety & Security</span>' +
        '</div>' +
        '<div class="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2 text-xs font-semibold shadow-sm">' +
          '<span class="text-emerald-400 font-black text-sm">' + (sub.staff || 0).toFixed(1) + '</span>' +
          '<span class="text-white/80">Staff</span>' +
        '</div>' +
        '<div class="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2 text-xs font-semibold shadow-sm">' +
          '<span class="text-amber-400 font-black text-sm">' + (sub.amenities || 0).toFixed(1) + '</span>' +
          '<span class="text-white/80">Amenities</span>' +
        '</div>' +
        '<div class="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2 text-xs font-semibold shadow-sm">' +
          '<span class="text-amber-400 font-black text-sm">' + (sub.location || 0).toFixed(1) + '</span>' +
          '<span class="text-white/80">Location</span>' +
        '</div>' +
      '</div>' +

      '<!-- Individual Reviews Feed -->' +
      '<div class="space-y-6 pt-4" id="reviews-feed-container">' +
        reviewsFeedHtml +
      '</div>' +
    '</div>';
  }

  function fetchAndRenderReviews(entity) {
    var reviewsCont = el("entity-reviews-container");
    if (reviewsCont) {
      reviewsCont.innerHTML = renderReviewsSkeleton();
    }

    It.apiGet("/reviews/" + type + "/" + id, { auth: true }).then(function (res) {
      var raw = res.data !== undefined ? res.data : (res.body ? (res.body.data || res.body) : res);
      if (reviewsCont) {
        reviewsCont.innerHTML = renderReviewsSection(entity, raw);
        wireReviewEvents(entity, raw);
      }
    }).catch(function () {
      if (reviewsCont) {
        reviewsCont.innerHTML = renderReviewsSection(entity, null);
        wireReviewEvents(entity, null);
      }
    });
  }

  function wireReviewEvents(entity, apiPayload) {
    var toggleBtn = el("toggle-review-form-btn");
    var cancelBtn = el("cancel-review-form-btn");
    var accordion = el("write-review-accordion");

    if (toggleBtn && accordion) {
      toggleBtn.addEventListener("click", function () {
        accordion.classList.toggle("hidden");
      });
    }
    if (cancelBtn && accordion) {
      cancelBtn.addEventListener("click", function () {
        accordion.classList.add("hidden");
      });
    }

    var SENTIMENTS = {
      1: "Disappointing / Below expectations",
      2: "Could be better",
      3: "Average / Decent experience",
      4: "Great experience / Very good!",
      5: "Amazing experience! Love it!"
    };

    var SENTIMENT_ICONS = {
      1: "fa-face-frown text-rose-400",
      2: "fa-face-meh text-amber-400",
      3: "fa-face-smile text-amber-400",
      4: "fa-face-laugh text-amber-400",
      5: "fa-face-grin-stars text-amber-400"
    };

    var userReview = (apiPayload && apiPayload.user_review) ? apiPayload.user_review : null;
    var selectedRating = (userReview && userReview.rating) ? Number(userReview.rating) : 5;

    var starWidget = el("interactive-star-rating");
    var sentimentLabel = el("rating-sentiment-label");

    if (starWidget) {
      var stars = starWidget.querySelectorAll(".star-icon");

      function updateStarsDisplay(val) {
        stars.forEach(function (star) {
          var r = Number(star.getAttribute("data-rating"));
          if (r <= val) {
            star.className = "fas fa-star text-4xl sm:text-5xl text-amber-400 cursor-pointer transition-all duration-200 hover:scale-110 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)] star-icon";
          } else {
            star.className = "fas fa-star text-4xl sm:text-5xl text-white/20 cursor-pointer transition-all duration-200 hover:scale-110 drop-shadow-none star-icon";
          }
        });

        if (sentimentLabel) {
          var text = SENTIMENTS[val] || "Rate your experience";
          var icon = SENTIMENT_ICONS[val] || "fa-face-smile text-amber-400";
          sentimentLabel.innerHTML = '<i class="fas ' + icon + '"></i> ' + text;
        }
      }

      updateStarsDisplay(selectedRating);

      stars.forEach(function (star) {
        star.addEventListener("mouseenter", function () {
          var hoverVal = Number(star.getAttribute("data-rating"));
          updateStarsDisplay(hoverVal);
        });

        star.addEventListener("click", function () {
          selectedRating = Number(star.getAttribute("data-rating"));
          starWidget.setAttribute("data-selected", selectedRating);
          updateStarsDisplay(selectedRating);
        });
      });

      starWidget.addEventListener("mouseleave", function () {
        updateStarsDisplay(selectedRating);
      });
    }

    var reviewBtn = el("review-btn");
    if (reviewBtn) {
      reviewBtn.addEventListener("click", function () {
        if (!It.session || !It.session.hasToken()) {
          showToast("Please sign in to submit a review.", "error");
          return;
        }
        if (selectedRating < 1 || selectedRating > 5) {
          showToast("Please select a star rating between 1 and 5.", "warn");
          return;
        }

        var comment = (el("review-comment") && el("review-comment").value.trim()) || null;

        reviewBtn.disabled = true;
        reviewBtn.textContent = "Saving…";
        It.apiPost("/reviews/" + type + "/" + id, { rating: selectedRating, comment: comment }, { auth: true }).then(function (res) {
          if (res.ok) {
            var msg = userReview ? "Review updated! It is now pending admin approval." : "Review submitted! It is now pending admin approval.";
            showToast(msg, "success");
            if (accordion) accordion.classList.add("hidden");
            // Re-fetch dynamic reviews from API to update overall rating & feed in real time
            fetchAndRenderReviews(entity);
          } else {
            var msg = (res.body && (res.body.message || (res.body.errors && Object.values(res.body.errors)[0]))) || "Could not submit review.";
            showToast(msg, "error");
            reviewBtn.disabled = false;
            reviewBtn.textContent = userReview ? "Update Review" : "Submit Review";
          }
        }).catch(function () {
          showToast("Network error submitting review.", "error");
          reviewBtn.disabled = false;
          reviewBtn.textContent = userReview ? "Update Review" : "Submit Review";
        });
      });
    }
  }

  function render(e) {
    var name = entityName(e);
    var sub = entitySub(e);

    var attachBlock = "";
    if (ATTACH_TYPE[type]) {
      attachBlock = '<div class="border-t border-white/10 pt-4 space-y-3">' +
        '<label class="text-xs font-bold text-white uppercase tracking-wider block flex items-center gap-1.5">' +
          '<i class="fas fa-suitcase-rolling text-amber-400 text-xs"></i> Add to Trip Itinerary' +
        '</label>' +
        '<p class="text-[11px] text-white/50 leading-relaxed px-1">' +
          'Attach this experience directly to one of your active travel itineraries.' +
        '</p>' +
        '<div class="space-y-2">' +
          '<select id="trip-select" class="w-full bg-black/50 border border-white/15 hover:border-amber-400/50 text-white text-xs rounded-xl px-3.5 py-2.5 outline-none transition">' +
            '<option value="">Select an active trip...</option>' +
          '</select>' +
          '<select id="day-select" class="w-full bg-black/50 border border-white/15 hover:border-amber-400/50 text-white text-xs rounded-xl px-3.5 py-2.5 outline-none transition hidden">' +
            '<option value="1">Day 1</option>' +
          '</select>' +
          '<button type="button" id="attach-btn" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-xs transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed" disabled>' +
            '<i class="fas fa-plus-circle"></i> Attach to Trip' +
          '</button>' +
        '</div>' +
        '<a href="app/trip-form.html" class="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition pt-1 px-1">' +
          '<span>Create a new trip plan</span> <i class="fas fa-plus text-[9px]"></i>' +
        '</a>' +
      '</div>';
    }

    page.innerHTML =
      '<div class="mb-6"><a href="explore.html" class="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition"><i class="fas fa-arrow-left text-xs"></i> Back to Explore</a></div>' +
      imageHtml(entityImage(e), name, name, type, (e.country && e.country.name) || e.country) +
      '<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">' +
        '<!-- Main Entity Details Column -->' +
        '<div class="lg:col-span-2 space-y-6">' +
          '<div>' +
            '<span class="text-xs uppercase tracking-widest font-semibold text-amber-400/80 mb-1 block">' + (TYPE_LABEL[type] || "Experience") + '</span>' +
            '<h1 class="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">' + esc(name) + '</h1>' +
            (sub ? '<p class="text-base text-white/60 mb-4 flex items-center gap-1.5"><i class="fas fa-location-dot text-amber-400 text-xs"></i> ' + esc(sub) + '</p>' : '') +
            metaHtml(e) +
          '</div>' +

          '<div class="p-6 rounded-2xl bg-white/5 border border-white/10">' +
            '<h3 class="text-base font-bold text-white mb-3">Overview & Highlights</h3>' +
            '<p class="text-white/70 text-sm leading-relaxed whitespace-pre-line">' + esc(e.description || "Discover bespoke luxury highlights, breathtaking atmosphere, and world-class hospitality curated exclusively by Itinera.") + '</p>' +
          '</div>' +

          '<div id="entity-reviews-container">' + renderReviewsSkeleton() + '</div>' +
          '<div id="entity-extra-section"></div>' +
        '</div>' +

        '<!-- Redesigned Luxury Quick Actions Sidebar -->' +
        '<div class="space-y-6">' +
          '<div class="p-6 rounded-3xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-md space-y-5">' +
            '<!-- Sidebar Header -->' +
            '<div class="flex items-center justify-between border-b border-white/10 pb-3">' +
              '<span class="px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">' +
                '<i class="fas fa-bolt mr-1"></i> Quick Actions' +
              '</span>' +
              '<span class="text-xs text-white/40 font-medium">Traveler Tools</span>' +
            '</div>' +

            '<!-- Save to Favourites Block -->' +
            '<div class="space-y-2.5">' +
              '<label class="text-xs font-bold text-white uppercase tracking-wider block flex items-center gap-1.5">' +
                '<i class="fas fa-heart text-rose-400 text-xs"></i> Saved Collection' +
              '</label>' +
              '<button type="button" id="fav-btn" class="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold text-xs transition-all duration-300 flex items-center justify-center gap-2.5 shadow-md group">' +
                '<i class="far fa-heart text-amber-400 text-sm group-hover:scale-110 transition"></i>' +
                '<span id="fav-btn-label">Save to Favourites</span>' +
              '</button>' +
              '<p class="text-[11px] text-white/50 leading-relaxed px-1">' +
                'Save this ' + (TYPE_LABEL[type] || 'experience') + ' to your private collection for instant access anytime.' +
              '</p>' +
              '<a href="app/favourites.html" class="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition pt-1 px-1">' +
                '<span>View all saved favourites</span> <i class="fas fa-arrow-right text-[9px]"></i>' +
              '</a>' +
            '</div>' +

            attachBlock +
          '</div>' +
        '</div>' +
      '</div>';

    // Check initial favourite state from user session
    var favBtn = el("fav-btn");
    if (favBtn && It.session && It.session.hasToken()) {
      It.apiGet("/dashboard/favourites", { auth: true }).then(function (res) {
        var raw = res.data !== undefined ? res.data : (res.body ? (res.body.data || res.body) : res);
        var favs = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.data) ? raw.data : []);
        var isFav = favs.some(function (f) {
          var fType = (f.favorable_type || "").toLowerCase();
          return (fType === type || fType === type.replace(/s$/, '')) && Number(f.favorable_id) === id;
        });

        if (isFav) {
          favBtn.className = "w-full py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg shadow-rose-500/10 group";
          favBtn.innerHTML = '<i class="fas fa-heart text-rose-500 text-sm group-hover:scale-110 transition"></i><span id="fav-btn-label">Saved in Favourites</span>';
        }
      }).catch(function () {});
    }

    // Wire favourite button toggle
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
            if (isAdded) {
              favBtn.className = "w-full py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg shadow-rose-500/10 group";
              favBtn.innerHTML = '<i class="fas fa-heart text-rose-500 text-sm group-hover:scale-110 transition"></i><span id="fav-btn-label">Saved in Favourites</span>';
            } else {
              favBtn.className = "w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold text-xs transition-all duration-300 flex items-center justify-center gap-2.5 shadow-md group";
              favBtn.innerHTML = '<i class="far fa-heart text-amber-400 text-sm group-hover:scale-110 transition"></i><span id="fav-btn-label">Save to Favourites</span>';
            }
            showToast(isAdded ? "Saved to favourites." : "Removed from favourites.", "success");
          }
          favBtn.disabled = false;
        }).catch(function () {
          showToast("Could not update favourites.", "error");
          favBtn.disabled = false;
        });
      });
    }

    // Fetch dynamic reviews and summary metrics from API
    fetchAndRenderReviews(e);

    // Populate trips select
    if (ATTACH_TYPE[type] && It.session && It.session.hasToken()) {
      It.apiGet("/trips", { auth: true }).then(function (res) {
        var trips = (It.unwrapData && It.unwrapData(res)) || (res.body && res.body.data) || res.body;
        if (Array.isArray(trips) && trips.length) {
          var sel = el("trip-select");
          var daySel = el("day-select");
          if (!sel) return;

          var tripMap = {};
          trips.forEach(function (t) {
            tripMap[t.id] = t;
            var opt = document.createElement("option");
            opt.value = t.id;
            opt.textContent = (t.title || "Untitled Trip") + " (" + (t.no_of_days || 1) + " Days)";
            sel.appendChild(opt);
          });

          sel.addEventListener("change", function () {
            var btn = el("attach-btn");
            var selectedTripId = sel.value;
            if (btn) btn.disabled = !selectedTripId;

            if (daySel) {
              daySel.innerHTML = "";
              if (selectedTripId && tripMap[selectedTripId]) {
                var numDays = Number(tripMap[selectedTripId].no_of_days) || 1;
                for (var d = 1; d <= numDays; d++) {
                  var dOpt = document.createElement("option");
                  dOpt.value = String(d);
                  dOpt.textContent = "Day " + d;
                  daySel.appendChild(dOpt);
                }
                daySel.classList.remove("hidden");
              } else {
                daySel.classList.add("hidden");
              }
            }
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
          var daySel = el("day-select");
          if (!sel || !sel.value) return;
          var selectedDay = daySel ? (Number(daySel.value) || 1) : 1;
          attachBtn.disabled = true;
          attachBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Attaching…';
          It.apiPost("/trips/" + sel.value + "/attach/" + ATTACH_TYPE[type], { item_id: id, id: id, day_number: selectedDay }, { auth: true, skipNotification: true }).then(function (res) {
            if (res.ok) {
              showToast("Attached to your trip on Day " + selectedDay + "!", "success");
              sel.value = "";
              if (daySel) daySel.classList.add("hidden");
            } else {
              showToast((res.body && res.body.message) || "Could not attach to trip.", "error");
            }
            attachBtn.disabled = false;
            attachBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Attach to Trip';
          }).catch(function () {
            showToast("Could not reach the server.", "error");
            attachBtn.disabled = false;
            attachBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Attach to Trip';
          });
        });
      }
    }

    // Fetch related accommodations for destinations
    if (type === "destination" || type === "destinations") {
      It.apiGet("/destinations/" + id + "/hotels").then(function (res) {
        var hotels = (It.unwrapData && It.unwrapData(res)) || (res.body && res.body.data) || res.body;
        if (!Array.isArray(hotels) || !hotels.length) return;
        var extra = el("entity-extra-section");
        if (!extra) return;
        extra.innerHTML = '<div class="p-6 rounded-2xl bg-white/5 border border-white/10">' +
          '<h3 class="text-base font-bold text-white mb-4 flex items-center gap-2"><i class="fas fa-hotel text-amber-400"></i> Recommended Accommodations</h3>' +
          '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">' +
          hotels.slice(0, 4).map(function (h) {
            return '<a href="entity.html?type=hotel&id=' + h.id + '" class="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition block group">' +
              '<div class="font-bold text-sm text-white group-hover:text-amber-400 transition mb-1">' + esc(h.name) + '</div>' +
              '<div class="text-xs text-white/50">' + (h.price_per_night ? '$' + h.price_per_night + '/night' : '5-Star Resort') + '</div></a>';
          }).join("") + '</div></div>';
      }).catch(function () {});
    }
  }

  function start() {
    if (!TYPE_LABEL[type] || !id) {
      page.innerHTML = '<div class="p-12 text-center max-w-lg mx-auto bg-white/5 rounded-3xl border border-white/10"><h2 class="text-2xl font-bold text-white mb-4">Item Not Found</h2>' +
        '<p class="text-white/60 mb-6">The requested experience could not be located.</p>' +
        '<a href="explore.html" class="px-5 py-2.5 rounded-full bg-amber-400 text-black text-xs font-bold">Back to Catalog Explorer</a></div>';
      return;
    }

    var pluralType = (type === "destinations" || type === "hotels" || type === "restaurants" || type === "attractions" || type === "flights") ? type : type + "s";
    It.apiGet("/" + pluralType + "/" + id).then(function (res) {
      if (res.ok && res.body) {
        var item = (It.unwrapData && It.unwrapData(res)) || (res.body && res.body.data) || res.body;
        render(item);
      } else {
        page.innerHTML = '<div class="p-12 text-center max-w-lg mx-auto bg-white/5 rounded-3xl border border-white/10"><h2 class="text-2xl font-bold text-white mb-4">Could Not Load Experience</h2>' +
          '<a href="explore.html" class="px-5 py-2.5 rounded-full bg-amber-400 text-black text-xs font-bold">Back to Catalog Explorer</a></div>';
      }
    }).catch(function () {
      page.innerHTML = '<div class="p-12 text-center max-w-lg mx-auto bg-white/5 rounded-3xl border border-white/10"><h2 class="text-2xl font-bold text-white mb-4">Network Error</h2>' +
        '<p class="text-white/60 mb-6">Could not reach the server to fetch item details.</p>' +
        '<a href="explore.html" class="px-5 py-2.5 rounded-full bg-amber-400 text-black text-xs font-bold">Back to Catalog Explorer</a></div>';
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})(window);
