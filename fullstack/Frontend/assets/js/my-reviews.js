/**
 * my-reviews.js — Modern traveler review history engine.
 * Fetches user reviews from /me/reviews or /reviews/my with live status badges.
 */
(function (global) {
  "use strict";

  var It = global.Itinera;
  if (!It || !It.app) return;

  var list = document.getElementById("review-list");

  var TYPE_LABEL = {
    hotel: "Hotel",
    restaurant: "Restaurant",
    attraction: "Attraction",
    destination: "Destination",
    flight: "Flight"
  };

  function renderStars(rating) {
    var num = Math.min(Math.max(Number(rating) || 0, 1), 5);
    var html = '<div class="flex items-center gap-1 text-amber-400 text-sm mb-2" aria-label="' + num + ' out of 5 stars">';
    for (var i = 1; i <= 5; i++) {
      if (i <= num) {
        html += '<i class="fas fa-star"></i>';
      } else {
        html += '<i class="far fa-star opacity-40"></i>';
      }
    }
    html += '<span class="ml-1 text-xs text-white/60 font-semibold">' + num + '.0</span></div>';
    return html;
  }

  function renderBadge(status) {
    var st = String(status || 'pending').toLowerCase();
    if (st === 'approved' || st === 'published') {
      return '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold badge-approved"><i class="fas fa-check-circle text-[10px]"></i>Approved</span>';
    }
    if (st === 'rejected' || st === 'declined') {
      return '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold badge-rejected"><i class="fas fa-times-circle text-[10px]"></i>Declined</span>';
    }
    return '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold badge-pending"><i class="fas fa-clock text-[10px]"></i>Pending Review</span>';
  }

  It.app.boot(function () {
    It.apiGet("/me/reviews", { auth: true }).then(function (res) {
      var items = It.app.unwrapData(res);
      if (!Array.isArray(items)) items = [];
      
      if (!items.length) {
        list.innerHTML = 
          '<div class="col-span-full text-center py-16 px-6 review-card">' +
            '<div class="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-2xl mx-auto mb-4">' +
              '<i class="fas fa-star"></i>' +
            '</div>' +
            '<h3 class="text-xl font-bold text-white mb-1">No reviews submitted yet</h3>' +
            '<p class="text-sm text-white/50 max-w-md mx-auto mb-6">Explore destinations, hotels, and attractions to rate your travel experiences.</p>' +
            '<a href="../explore.html" class="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-2.5 rounded-full text-sm transition">' +
              '<i class="fas fa-compass"></i><span>Explore Places</span>' +
            '</a>' +
          '</div>';
        return;
      }

      list.innerHTML = items.map(function (review) {
        var rawType = String(review.reviewable_type || 'hotel').toLowerCase();
        var typeKey = rawType.indexOf('hotel') !== -1 ? 'hotel' : (rawType.indexOf('restaurant') !== -1 ? 'restaurant' : (rawType.indexOf('attraction') !== -1 ? 'attraction' : 'destination'));
        var title = (review.reviewable && (review.reviewable.name || review.reviewable.title)) || "Travel Location";
        var dateStr = review.created_at ? new Date(review.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';

        return '<div class="review-card p-6 flex flex-col justify-between space-y-4">' +
          '<div>' +
            '<div class="flex items-center justify-between gap-2 mb-3">' +
              '<span class="text-xs uppercase tracking-wider font-semibold text-white/40 bg-white/5 border border-white/10 px-2.5 py-1 rounded-md">' + (TYPE_LABEL[typeKey] || typeKey) + '</span>' +
              renderBadge(review.status) +
            '</div>' +
            '<h3 class="text-lg font-bold text-white mb-2 leading-snug">' + It.app.esc(title) + '</h3>' +
            renderStars(review.rating) +
            (review.comment ? '<p class="text-sm text-white/80 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5 mt-2">' + It.app.esc(review.comment) + '</p>' : '') +
          '</div>' +
          '<div class="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-white/40">' +
            '<span>Submitted ' + dateStr + '</span>' +
            '<button type="button" class="text-red-400 hover:text-red-300 font-semibold px-2 py-1 rounded hover:bg-red-500/10 transition" data-id="' + review.id + '">' +
              '<i class="fas fa-trash-alt mr-1"></i>Delete' +
            '</button>' +
          '</div>' +
        '</div>';
      }).join("");

      // Bind delete handlers
      list.querySelectorAll("button[data-id]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (!global.confirm("Are you sure you want to delete this review?")) return;
          btn.disabled = true;
          It.apiDelete("/reviews/" + btn.dataset.id, { auth: true }).then(function (res) {
            if (res.ok) {
              It.app.showToast("Review deleted.", "info");
              var card = btn.closest(".review-card");
              if (card) card.remove();
              if (!list.querySelector(".review-card")) {
                list.innerHTML = 
                  '<div class="col-span-full text-center py-16 px-6 review-card">' +
                    '<div class="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-2xl mx-auto mb-4"><i class="fas fa-star"></i></div>' +
                    '<h3 class="text-xl font-bold text-white mb-1">No reviews submitted yet</h3>' +
                    '<p class="text-sm text-white/50 max-w-md mx-auto mb-6">Explore destinations, hotels, and attractions to rate your travel experiences.</p>' +
                    '<a href="../explore.html" class="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-2.5 rounded-full text-sm transition"><i class="fas fa-compass"></i><span>Explore Places</span></a>' +
                  '</div>';
              }
            } else {
              It.app.showToast((res.body && res.body.message) || "Could not delete the review.", "error");
              btn.disabled = false;
            }
          }).catch(function () {
            It.app.showToast("Could not delete the review.", "error");
            btn.disabled = false;
          });
        });
      });
    }).catch(function () {
      list.innerHTML = 
        '<div class="col-span-full text-center py-12 px-6 review-card">' +
          '<p class="text-red-400 text-sm mb-4">Could not load your reviews.</p>' +
          '<button type="button" class="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-full" onclick="location.reload()">Retry</button>' +
        '</div>';
    });
  });
})(window);
