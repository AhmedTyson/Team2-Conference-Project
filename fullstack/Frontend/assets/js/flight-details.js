/**
 * flight-details.js — Modern luxury flight ticket viewer & review manager (flight-details.html).
 * Features physical Boarding Pass Ticket design tailored to the dark luxury glassmorphic theme system.
 */
(function (global) {
  "use strict";

  var It = global.Itinari || (global.Itinari = {});

  function esc(str) {
    if (str == null) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function showToast(msg, type) {
    if (typeof It.showGlobalToast === "function") {
      It.showGlobalToast(msg, type === "success" || type === "is-ok");
      return;
    }
    alert(msg);
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

  function el(id) { return document.getElementById(id); }

  var params = new URLSearchParams(global.location.search);
  var flightId = Number(params.get("id")) || 0;

  function generateBarcodeSvg(colorClass) {
    var fill = colorClass || "text-white/80";
    return '<svg class="w-full h-8 ' + fill + ' opacity-90" viewBox="0 0 160 30" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="0" y="0" width="3" height="30" fill="currentColor"/>' +
      '<rect x="5" y="0" width="1" height="30" fill="currentColor"/>' +
      '<rect x="8" y="0" width="4" height="30" fill="currentColor"/>' +
      '<rect x="14" y="0" width="2" height="30" fill="currentColor"/>' +
      '<rect x="18" y="0" width="1" height="30" fill="currentColor"/>' +
      '<rect x="21" y="0" width="5" height="30" fill="currentColor"/>' +
      '<rect x="28" y="0" width="2" height="30" fill="currentColor"/>' +
      '<rect x="32" y="0" width="1" height="30" fill="currentColor"/>' +
      '<rect x="35" y="0" width="3" height="30" fill="currentColor"/>' +
      '<rect x="40" y="0" width="6" height="30" fill="currentColor"/>' +
      '<rect x="48" y="0" width="2" height="30" fill="currentColor"/>' +
      '<rect x="52" y="0" width="1" height="30" fill="currentColor"/>' +
      '<rect x="55" y="0" width="4" height="30" fill="currentColor"/>' +
      '<rect x="61" y="0" width="2" height="30" fill="currentColor"/>' +
      '<rect x="65" y="0" width="5" height="30" fill="currentColor"/>' +
      '<rect x="72" y="0" width="1" height="30" fill="currentColor"/>' +
      '<rect x="75" y="0" width="3" height="30" fill="currentColor"/>' +
      '<rect x="80" y="0" width="2" height="30" fill="currentColor"/>' +
      '<rect x="84" y="0" width="4" height="30" fill="currentColor"/>' +
      '<rect x="90" y="0" width="1" height="30" fill="currentColor"/>' +
      '<rect x="93" y="0" width="5" height="30" fill="currentColor"/>' +
      '<rect x="100" y="0" width="2" height="30" fill="currentColor"/>' +
      '<rect x="104" y="0" width="3" height="30" fill="currentColor"/>' +
      '<rect x="109" y="0" width="1" height="30" fill="currentColor"/>' +
      '<rect x="112" y="0" width="4" height="30" fill="currentColor"/>' +
      '<rect x="118" y="0" width="2" height="30" fill="currentColor"/>' +
      '<rect x="122" y="0" width="5" height="30" fill="currentColor"/>' +
      '<rect x="129" y="0" width="1" height="30" fill="currentColor"/>' +
      '<rect x="132" y="0" width="3" height="30" fill="currentColor"/>' +
      '<rect x="137" y="0" width="2" height="30" fill="currentColor"/>' +
      '<rect x="141" y="0" width="4" height="30" fill="currentColor"/>' +
      '<rect x="147" y="0" width="1" height="30" fill="currentColor"/>' +
      '<rect x="150" y="0" width="3" height="30" fill="currentColor"/>' +
      '<rect x="155" y="0" width="5" height="30" fill="currentColor"/>' +
    '</svg>';
  }

  function resolveAirportCode(str) {
    if (!str) return "CAI";
    var s = String(str).toUpperCase();
    if (s.indexOf("CAIRO") !== -1 || s.indexOf("EGYPT") !== -1) return "CAI";
    if (s.indexOf("PARIS") !== -1 || s.indexOf("FRANCE") !== -1 || s.indexOf("CDG") !== -1) return "CDG";
    if (s.indexOf("LONDON") !== -1 || s.indexOf("HEATHROW") !== -1 || s.indexOf("LHR") !== -1) return "LHR";
    if (s.indexOf("NEW YORK") !== -1 || s.indexOf("JFK") !== -1) return "JFK";
    if (s.indexOf("DUBAI") !== -1 || s.indexOf("DXB") !== -1) return "DXB";
    if (s.indexOf("ROME") !== -1 || s.indexOf("FCO") !== -1) return "FCO";
    return s.replace(/[^A-Z]/g, "").slice(0, 3) || "CAI";
  }

  /** Render 100% Dynamic Reviews Section */
  function renderReviewsSection(flight, apiPayload) {
    var name = flight.airline ? flight.airline + " Flight " + (flight.flight_number || "") : "Commercial Flight";
    var summary = (apiPayload && apiPayload.summary) || {
      rating: 0,
      total_reviews: 0,
      distribution: { "5": { count: 0, percentage: 0 }, "4": { count: 0, percentage: 0 }, "3": { count: 0, percentage: 0 }, "2": { count: 0, percentage: 0 }, "1": { count: 0, percentage: 0 } },
      sub_scores: { cleanliness: 0, safety: 0, staff: 0, amenities: 0, location: 0 }
    };

    var dbReviews = (apiPayload && Array.isArray(apiPayload.reviews)) ? apiPayload.reviews : [];
    var userReview = (apiPayload && apiPayload.user_review) ? apiPayload.user_review : null;

    var totalDisplay = summary.total_reviews ? summary.total_reviews.toLocaleString() + " verified ratings" : "No verified ratings yet";

    var headerBtnText = userReview ? '<i class="fas fa-pen-to-square mr-1"></i> Edit Your Review' : '<i class="fas fa-pen-to-square mr-1"></i> Write a Review';
    var formTitle = userReview
      ? 'Edit Your Review for <span class="text-amber-400">' + esc(name) + '</span>'
      : 'We love to hear from you! How\'s your flight experience with <span class="text-amber-400">' + esc(name) + '</span>?';
    var submitBtnText = userReview ? '<i class="fas fa-floppy-disk mr-1"></i> Update Review' : 'Submit Review';
    var initialCommentText = userReview && userReview.comment ? esc(userReview.comment) : '';
    var initialRating = userReview && userReview.rating ? userReview.rating : 5;

    var reviewsFeedHtml = "";
    if (dbReviews.length === 0) {
      reviewsFeedHtml = '<div class="p-8 sm:p-12 text-center text-white/50 bg-white/5 rounded-3xl border border-white/10 my-4">' +
        '<div class="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto mb-4 text-2xl shadow-lg shadow-amber-500/10">' +
          '<i class="fas fa-plane-departure"></i>' +
        '</div>' +
        '<h3 class="text-xl font-bold text-white mb-2">No Approved Reviews Yet</h3>' +
        '<p class="text-sm text-white/60 mb-6 max-w-md mx-auto">' +
          'Be the first passenger to share your in-flight experience and service feedback!' +
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
      '<div class="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-4">' +
        '<div>' +
          '<h3 class="text-xl font-extrabold text-white flex items-center gap-2">' +
            '<i class="fas fa-star text-amber-400"></i> Passenger Reviews & Ratings' +
          '</h3>' +
          '<p class="text-xs text-white/60 mt-0.5">' + esc(totalDisplay) + '</p>' +
        '</div>' +
        '<button type="button" id="toggle-review-form-btn" class="px-5 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-extrabold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer">' +
          headerBtnText +
        '</button>' +
      '</div>' +

      '<div id="review-form-accordion" class="hidden p-6 rounded-2xl bg-white/5 border border-amber-400/30 space-y-4">' +
        '<h4 class="text-sm font-extrabold text-white">' + formTitle + '</h4>' +
        '<div class="space-y-2">' +
          '<label class="text-xs font-bold text-amber-400 uppercase tracking-wider block">Your Star Rating</label>' +
          '<div id="interactive-star-rating" class="flex items-center gap-2" data-selected="' + initialRating + '">' +
            '<i class="fas fa-star text-3xl text-amber-400 cursor-pointer star-icon" data-rating="1"></i>' +
            '<i class="fas fa-star text-3xl text-amber-400 cursor-pointer star-icon" data-rating="2"></i>' +
            '<i class="fas fa-star text-3xl text-amber-400 cursor-pointer star-icon" data-rating="3"></i>' +
            '<i class="fas fa-star text-3xl text-amber-400 cursor-pointer star-icon" data-rating="4"></i>' +
            '<i class="fas fa-star text-3xl text-amber-400 cursor-pointer star-icon" data-rating="5"></i>' +
          '</div>' +
          '<span id="rating-sentiment-label" class="text-xs text-amber-300 font-semibold block pt-1"></span>' +
        '</div>' +
        '<div class="space-y-1.5">' +
          '<label class="text-xs font-bold text-white/80 block">Your Feedback & In-Flight Experience</label>' +
          '<textarea id="review-comment" rows="3" placeholder="Share details about seat comfort, cabin staff, meal quality, or flight punctuality..." class="w-full bg-black/40 border border-white/15 rounded-2xl p-3 text-xs text-white placeholder-white/40 outline-none focus:border-amber-400 transition">' + initialCommentText + '</textarea>' +
        '</div>' +
        '<div class="flex items-center justify-end gap-3 pt-2">' +
          '<button type="button" id="cancel-review-btn" class="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition">Cancel</button>' +
          '<button type="button" id="review-btn" class="px-6 py-2 rounded-full bg-amber-400 text-black font-extrabold text-xs shadow-md hover:bg-amber-300 transition">' + submitBtnText + '</button>' +
        '</div>' +
      '</div>' +

      '<div class="space-y-6">' + reviewsFeedHtml + '</div>' +
    '</div>';
  }

  function fetchAndRenderReviews(flight) {
    var sectionContainer = el("reviews-section-container");
    if (!sectionContainer) return;

    sectionContainer.innerHTML = renderReviewsSection(flight, null);

    It.apiGet("/reviews/flights/" + flightId, { auth: true }).then(function (res) {
      if (res.ok && res.body) {
        var payload = res.body.data || res.body;
        sectionContainer.innerHTML = renderReviewsSection(flight, payload);
        bindReviewFormEvents(flight, payload);
      }
    }).catch(function () {
      bindReviewFormEvents(flight, null);
    });
  }

  function bindReviewFormEvents(flight, apiPayload) {
    var toggleBtn = el("toggle-review-form-btn");
    var accordion = el("review-form-accordion");
    var cancelBtn = el("cancel-review-btn");

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
      1: "Disappointing flight / Delayed",
      2: "Could be better",
      3: "Average / Decent flight",
      4: "Great service & flight!",
      5: "Amazing flight experience!"
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
            star.className = "fas fa-star text-3xl text-amber-400 cursor-pointer transition-all duration-200 star-icon";
          } else {
            star.className = "fas fa-star text-3xl text-white/20 cursor-pointer transition-all duration-200 star-icon";
          }
        });

        if (sentimentLabel) {
          var text = SENTIMENTS[val] || "Rate your flight";
          sentimentLabel.innerHTML = '<i class="fas fa-face-grin-stars text-amber-400"></i> ' + text;
        }
      }

      updateStarsDisplay(selectedRating);

      stars.forEach(function (star) {
        star.addEventListener("click", function () {
          selectedRating = Number(star.getAttribute("data-rating"));
          starWidget.setAttribute("data-selected", selectedRating);
          updateStarsDisplay(selectedRating);
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
        var comment = (el("review-comment") && el("review-comment").value.trim()) || null;

        reviewBtn.disabled = true;
        reviewBtn.textContent = "Saving…";
        It.apiPost("/reviews/flights/" + flightId, { rating: selectedRating, comment: comment }, { auth: true }).then(function (res) {
          if (res.ok) {
            showToast("Review submitted! Pending admin approval.", "success");
            if (accordion) accordion.classList.add("hidden");
            fetchAndRenderReviews(flight);
          } else {
            var msg = (res.body && res.body.message) || "Could not submit review.";
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

  function renderFlight(f) {
    var root = el("flight-details-root");
    var skeleton = el("flight-skeleton");
    if (skeleton) skeleton.classList.add("hidden");

    if (!root) return;
    root.classList.remove("hidden");

    if (!f) {
      root.innerHTML = '<div class="p-12 text-center max-w-lg mx-auto bg-white/5 rounded-3xl border border-white/10">' +
        '<div class="w-16 h-16 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4 text-2xl"><i class="fas fa-plane-slash"></i></div>' +
        '<h2 class="text-2xl font-bold text-white mb-2">Flight Ticket Not Found</h2>' +
        '<p class="text-white/60 mb-6 text-sm">The requested commercial flight details could not be loaded.</p>' +
        '<a href="explore.html?tab=flights" class="px-6 py-2.5 rounded-full bg-amber-400 text-black text-xs font-bold">Back to Flight Explorer</a>' +
      '</div>';
      return;
    }

    var airline = f.airline || "Commercial Airline";
    var flightNo = f.flight_number || "MS-777";
    var priceDisplay = f.price != null ? "$" + Number(f.price).toLocaleString() : "$550";
    var origin = f.departure_airport || f.origin || "Cairo International Airport";
    var destination = f.arrival_airport || f.destination || "London Heathrow Airport";

    var originCode = resolveAirportCode(origin);
    var destCode = resolveAirportCode(destination);
    
    var depDateStr = f.departure_date ? new Date(f.departure_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "JUL 16, 2026";
    var depTimeStr = f.departure_date ? new Date(f.departure_date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "10:30 AM";

    var arrDateStr = f.arrival_date ? new Date(f.arrival_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "JUL 16, 2026";
    var arrTimeStr = f.arrival_date ? new Date(f.arrival_date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "02:45 PM";

    root.innerHTML =
      '<!-- Top Back Link -->' +
      '<div class="mb-4 flex items-center justify-between">' +
        '<a href="explore.html?tab=flights" class="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition">' +
          '<i class="fas fa-arrow-left text-xs"></i> Back to Flight Explorer' +
        '</a>' +
        '<span class="text-xs font-bold text-amber-400 flex items-center gap-1.5"><i class="fas fa-ticket text-amber-400"></i> Boarding Pass Ticket</span>' +
      '</div>' +

      '<!-- Luxury Dark Glassmorphic Physical Boarding Pass Ticket Card Container -->' +
      '<div class="relative rounded-3xl bg-gradient-to-r from-[#12141c] via-[#1a1d2b] to-[#12141c] text-white shadow-2xl overflow-hidden border border-amber-400/30 mb-8">' +
        '<!-- Top Gold Barber-Pole / Candy Stripe Accent Banner -->' +
        '<div class="h-3 w-full bg-[linear-gradient(135deg,rgba(251,191,36,0.5)_25%,transparent_25%,transparent_50%,rgba(251,191,36,0.5)_50%,rgba(251,191,36,0.5)_75%,transparent_75%,transparent)] bg-[length:20px_20px]"></div>' +

        '<!-- Ticket Body Grid (Main Body + Perforated Stub) -->' +
        '<div class="relative flex flex-col lg:flex-row items-stretch">' +
          
          '<!-- LEFT MAIN TICKET BODY (70%) -->' +
          '<div class="flex-1 p-6 sm:p-8 relative flex flex-col justify-between space-y-6">' +
            '<!-- Background World Map Watermark -->' +
            '<div class="absolute inset-0 opacity-10 bg-[url(\'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80\')] bg-cover bg-center pointer-events-none"></div>' +

            '<!-- Ticket Header Bar -->' +
            '<div class="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">' +
              '<div class="flex items-center gap-3">' +
                '<div class="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center text-xl font-bold shadow-md">' +
                  '<i class="fas fa-plane-departure"></i>' +
                '</div>' +
                '<div>' +
                  '<h2 class="text-xl font-black tracking-tight text-white uppercase">' + esc(airline) + '</h2>' +
                  '<span class="text-[11px] text-amber-400/80 font-mono font-semibold">DIRECT COMMERCIAL FLIGHT · ' + esc(flightNo) + '</span>' +
                '</div>' +
              '</div>' +
              '<div class="text-right">' +
                '<span class="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 block mb-1">BOARDING PASS</span>' +
                '<span class="text-lg font-black text-amber-400 block">' + esc(priceDisplay) + '</span>' +
              '</div>' +
            '</div>' +

            '<!-- Route Trajectory Section -->' +
            '<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center relative z-10 py-2">' +
              '<!-- Origin -->' +
              '<div>' +
                '<span class="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-0.5">FROM:</span>' +
                '<div class="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">' + esc(originCode) + '</div>' +
                '<div class="text-xs font-bold text-white/90 truncate mt-0.5">' + esc(origin) + '</div>' +
                '<div class="text-[11px] text-white/50 mt-1"><i class="far fa-calendar mr-1 text-amber-400"></i>' + esc(depDateStr) + ' · ' + esc(depTimeStr) + '</div>' +
              '</div>' +

              '<!-- Trajectory Graphic -->' +
              '<div class="text-center space-y-1 py-2 sm:py-0">' +
                '<span class="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider block">Boarding Time</span>' +
                '<span class="text-base font-black text-amber-400 block font-mono">' + esc(depTimeStr) + '</span>' +
                '<div class="relative flex items-center justify-center my-2">' +
                  '<div class="w-full h-[2px] bg-gradient-to-r from-amber-500/20 via-amber-400 to-amber-500/20 rounded-full"></div>' +
                  '<div class="absolute w-8 h-8 rounded-full bg-amber-400 text-black flex items-center justify-center text-xs shadow-lg shadow-amber-400/30">' +
                    '<i class="fas fa-plane"></i>' +
                  '</div>' +
                '</div>' +
                '<span class="text-[10px] font-semibold text-emerald-400"><i class="fas fa-check-circle mr-1"></i> Direct Non-Stop Flight</span>' +
              '</div>' +

              '<!-- Destination -->' +
              '<div class="sm:text-right">' +
                '<span class="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-0.5">TO:</span>' +
                '<div class="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">' + esc(destCode) + '</div>' +
                '<div class="text-xs font-bold text-white/90 truncate mt-0.5">' + esc(destination) + '</div>' +
                '<div class="text-[11px] text-white/50 mt-1"><i class="far fa-clock mr-1 text-amber-400"></i>' + esc(arrDateStr) + ' · ' + esc(arrTimeStr) + '</div>' +
              '</div>' +
            '</div>' +

            '<!-- Bottom Specs Bar -->' +
            '<div class="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-white/10 text-xs relative z-10">' +
              '<div>' +
                '<span class="text-[9px] font-bold text-amber-400 uppercase block">Passenger</span>' +
                '<span class="font-extrabold text-white block truncate">CUSTOMER PASSENGER</span>' +
              '</div>' +
              '<div>' +
                '<span class="text-[9px] font-bold text-amber-400 uppercase block">Flight</span>' +
                '<span class="font-mono font-extrabold text-white block">' + esc(flightNo) + '</span>' +
              '</div>' +
              '<div>' +
                '<span class="text-[9px] font-bold text-amber-400 uppercase block">Seat</span>' +
                '<span class="font-mono font-extrabold text-amber-400 block">15F</span>' +
              '</div>' +
              '<div>' +
                '<span class="text-[9px] font-bold text-amber-400 uppercase block">Gate</span>' +
                '<span class="font-mono font-extrabold text-white block">12</span>' +
              '</div>' +
              '<div>' +
                '<span class="text-[9px] font-bold text-amber-400 uppercase block">Terminal</span>' +
                '<span class="font-mono font-extrabold text-white block">2B</span>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<!-- PERFORATED TICKET DIVIDER WITH NOTCHES -->' +
          '<div class="relative hidden lg:flex items-center justify-center w-px border-r-2 border-dashed border-white/20 my-4">' +
            '<div class="absolute -top-6 -left-3 w-6 h-6 rounded-full bg-[#0a0a0a] border-b border-white/20"></div>' +
            '<div class="absolute -bottom-6 -left-3 w-6 h-6 rounded-full bg-[#0a0a0a] border-t border-white/20"></div>' +
          '</div>' +

          '<!-- RIGHT PASSENGER TICKET STUB (30%) -->' +
          '<div class="w-full lg:w-80 bg-[#181b26] text-white p-6 flex flex-col justify-between space-y-4 border-l border-white/10">' +
            '<div class="flex items-center justify-between border-b border-white/10 pb-3">' +
              '<span class="text-xs font-black uppercase tracking-wider text-amber-400">BOARDING PASS</span>' +
              '<span class="text-[10px] font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 font-mono">' + esc(flightNo) + '</span>' +
            '</div>' +

            '<div class="grid grid-cols-2 gap-3 text-xs">' +
              '<div>' +
                '<span class="text-[9px] font-bold text-white/40 uppercase block">Passenger</span>' +
                '<span class="font-extrabold text-white block truncate">CUSTOMER PASSENGER</span>' +
              '</div>' +
              '<div>' +
                '<span class="text-[9px] font-bold text-white/40 uppercase block">Class</span>' +
                '<span class="font-bold text-amber-400 uppercase block">FIRST CLASS</span>' +
              '</div>' +

              '<div>' +
                '<span class="text-[9px] font-bold text-white/40 uppercase block">From</span>' +
                '<span class="font-mono font-extrabold text-white block">' + esc(originCode) + '</span>' +
              '</div>' +
              '<div>' +
                '<span class="text-[9px] font-bold text-white/40 uppercase block">To</span>' +
                '<span class="font-mono font-extrabold text-white block">' + esc(destCode) + '</span>' +
              '</div>' +

              '<div>' +
                '<span class="text-[9px] font-bold text-white/40 uppercase block">Date</span>' +
                '<span class="font-semibold text-white/80 block">' + esc(depDateStr) + '</span>' +
              '</div>' +
              '<div>' +
                '<span class="text-[9px] font-bold text-white/40 uppercase block">Time</span>' +
                '<span class="font-semibold text-white/80 block">' + esc(depTimeStr) + '</span>' +
              '</div>' +
            '</div>' +

            '<!-- Barcode SVG -->' +
            '<div class="pt-2 border-t border-white/10 text-center">' +
              generateBarcodeSvg("text-white/70") +
              '<span class="text-[9px] font-mono text-white/40 mt-1 block">ETKT 8820 9140 2814</span>' +
            '</div>' +
          '</div>' +

        '</div>' +
      '</div>' +

      '<!-- Specs & Sidebar Container -->' +
      '<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">' +
        '<div class="lg:col-span-2 space-y-6">' +
          '<div class="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">' +
            '<h3 class="text-base font-extrabold text-white border-b border-white/10 pb-3 flex items-center gap-2">' +
              '<i class="fas fa-list-check text-amber-400"></i> In-Flight Specs & Baggage Allowance' +
            '</h3>' +
            '<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">' +
              '<div class="p-3 bg-white/5 rounded-2xl border border-white/10">' +
                '<span class="text-[10px] font-bold text-amber-400 uppercase block">Baggage Allowance</span>' +
                '<span class="font-bold text-white block mt-0.5">2 × 23kg Checked</span>' +
              '</div>' +
              '<div class="p-3 bg-white/5 rounded-2xl border border-white/10">' +
                '<span class="text-[10px] font-bold text-amber-400 uppercase block">Cabin Hand Baggage</span>' +
                '<span class="font-bold text-white block mt-0.5">1 × 8kg Carry-on</span>' +
              '</div>' +
              '<div class="p-3 bg-white/5 rounded-2xl border border-white/10">' +
                '<span class="text-[10px] font-bold text-amber-400 uppercase block">Cabin Class</span>' +
                '<span class="font-bold text-white block mt-0.5">First / Executive</span>' +
              '</div>' +
              '<div class="p-3 bg-white/5 rounded-2xl border border-white/10">' +
                '<span class="text-[10px] font-bold text-amber-400 uppercase block">In-Flight Wi-Fi</span>' +
                '<span class="font-bold text-emerald-400 block mt-0.5">Complimentary</span>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<!-- Reviews Container -->' +
          '<div id="reviews-section-container"></div>' +
        '</div>' +

        '<!-- Quick Actions Sidebar -->' +
        '<div class="lg:col-span-1 space-y-6">' +
          '<div class="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">' +
            '<h3 class="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">' +
              '<i class="fas fa-bolt"></i> Quick Actions' +
            '</h3>' +
            '<button type="button" class="w-full py-3 rounded-2xl bg-amber-400 text-black font-extrabold text-xs shadow-lg hover:bg-amber-300 transition flex items-center justify-center gap-2 cursor-pointer" onclick="window.openTripSelectModal(this);" data-type="flight" data-id="' + f.id + '" data-name="' + esc(airline + " " + flightNo) + '">' +
              '<i class="fas fa-plus-circle"></i> Attach Flight to Trip' +
            '</button>' +
            '<a href="explore.html?tab=flights" class="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition flex items-center justify-center gap-2 inline-block text-center">' +
              '<i class="fas fa-magnifying-glass"></i> Explore More Flights' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</div>';

    fetchAndRenderReviews(f);
  }

  function start() {
    if (!flightId) {
      renderFlight(null);
      return;
    }

    It.apiGet("/flights/" + flightId).then(function (res) {
      var raw = res.data !== undefined ? res.data : (res.body ? (res.body.data || res.body) : res);
      renderFlight(raw);
    }).catch(function () {
      renderFlight(null);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})(window);
