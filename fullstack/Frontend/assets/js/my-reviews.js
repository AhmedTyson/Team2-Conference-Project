/**
 * my-reviews.js — review history (converted from React MyReviewsPage).
 * Rows from /v1/me/reviews with status badge, stars, comment, delete.
 * Depends on app-shell.js (It.app).
 */
(function (global) {
  "use strict";

  var It = global.Itinari;
  if (!It || !It.app) return;

  var list = document.getElementById("review-list");

  var TYPE_LABEL = {
    hotel: "Hotel",
    restaurant: "Restaurant",
    attraction: "Attraction",
    destination: "Destination",
    flight: "Flight"
  };

  It.app.boot(function () {
    It.apiGet("/me/reviews", { auth: true }).then(function (res) {
      var items = It.app.unwrapData(res);
      if (!Array.isArray(items)) items = [];
      if (!items.length) {
        list.innerHTML = '<div class="empty" style="grid-column:1/-1;">' +
          '<span class="empty__icon">★</span>' +
          '<p class="empty__title">No reviews yet.</p>' +
          '<p class="empty__text">Visit the Explore pages, rate a place, and it will show up here.</p>' +
          '<a href="/explore.html" class="btn btn--primary">Start reviewing</a></div>';
        return;
      }
      list.innerHTML = items.map(function (review, index) {
        var type = review.reviewable_type;
        return '<div class="review-row anim-rise" style="animation-delay:' + Math.min(index * 60, 400) + 'ms;">' +
          '<div class="review-row__head">' +
          '<span class="review-row__type">' + (TYPE_LABEL[type] || type) + "</span>" +
          '<span class="review-status review-status--' + It.app.esc(review.status) + '">' + It.app.esc(review.status) + "</span>" +
          '<span class="review-row__date">' + new Date(review.created_at).toLocaleDateString() + "</span></div>" +
          '<h3 class="review-row__title">' + It.app.esc((review.reviewable && review.reviewable.title) || "Item") + "</h3>" +
          It.app.starsHtml(review.rating) +
          (review.comment ? '<p class="review-row__comment">' + It.app.esc(review.comment) + "</p>" : "") +
          '<div class="review-row__actions">' +
          '<a href="/entity.html?type=' + It.app.esc(type) + "&id=" + review.reviewable_id + '" class="btn btn--ghost btn--small">View item</a>' +
          '<button type="button" class="btn btn--ghost btn--small btn--danger" data-id="' + review.id + '">Delete</button>' +
          "</div></div>";
      }).join("");

      Array.prototype.forEach.call(list.querySelectorAll("button[data-id]"), function (btn) {
        btn.addEventListener("click", function () {
          if (!global.confirm("Delete this review?")) return;
          btn.disabled = true;
          It.apiDelete("/reviews/" + btn.dataset.id, { auth: true }).then(function (res) {
            if (res.ok) {
              It.app.showToast("Review deleted.", "info");
              var row = btn.closest(".review-row");
              if (row) row.parentNode.removeChild(row);
              if (!list.querySelector(".review-row")) {
                list.innerHTML = '<div class="empty" style="grid-column:1/-1;">' +
                  '<span class="empty__icon">★</span>' +
                  '<p class="empty__title">No reviews yet.</p>' +
                  '<p class="empty__text">Visit the Explore pages, rate a place, and it will show up here.</p>' +
                  '<a href="/explore.html" class="btn btn--primary">Start reviewing</a></div>';
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
      list.innerHTML = '<div class="error-card" style="grid-column:1/-1;">' +
        '<p>Could not load your reviews.</p>' +
        '<button type="button" class="btn btn--primary" onclick="location.reload()">Retry</button></div>';
    });
  });
})(window);
