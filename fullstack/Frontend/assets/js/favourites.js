/**
 * favourites.js — saved places (converted from React FavouritesPage).
 * Grid from /v1/dashboard/favourites; heart button toggles off via
 * POST /v1/favourites/{type}/{id}. Depends on app-shell.js (It.app).
 */
(function (global) {
  "use strict";

  var It = global.Itinari;
  if (!It || !It.app) return;

  var grid = document.getElementById("fav-grid");

  var TYPE_LABEL = {
    hotel: "Hotel",
    restaurant: "Restaurant",
    attraction: "Attraction",
    destination: "Destination",
    flight: "Flight"
  };

  function itemName(item) {
    return (item && (item.name || item.flight_number)) || "Item";
  }

  It.app.boot(function () {
    It.apiGet("/dashboard/favourites", { auth: true }).then(function (res) {
      var items = It.app.unwrapData(res);
      if (!Array.isArray(items)) items = [];
      if (!items.length) {
        grid.innerHTML = '<div class="empty" style="grid-column:1/-1;">' +
          '<span class="empty__icon">♥</span>' +
          '<p class="empty__title">Nothing saved yet.</p>' +
          '<p class="empty__text">Tap the heart on any destination, hotel, restaurant or attraction to keep it here.</p>' +
          '<a href="/explore.html" class="btn btn--primary">Browse the catalog</a></div>';
        return;
      }
      grid.innerHTML = items.map(function (f, index) {
        var item = f.item || null;
        var name = itemName(item);
        var sub = (item && item.destination && item.destination.city_name) ||
          "Saved " + new Date(f.created_at).toLocaleDateString();
        var type = f.favorable_type;
        return '<div class="card card--tile anim-rise" style="animation-delay:' + Math.min(index * 60, 400) + 'ms;">' +
          '<a href="/entity.html?type=' + It.app.esc(type) + "&id=" + f.favorable_id + '" class="fav-card__link" aria-label="Open ' + It.app.esc(name) + '">' +
          '<div class="card__body">' +
          '<div class="card__topline"><span class="card__kicker">' + (TYPE_LABEL[type] || type) + "</span></div>" +
          '<h3 class="card__title">' + It.app.esc(name) + "</h3>" +
          '<p class="card__sub">' + It.app.esc(sub) + "</p></div></a>" +
          '<button type="button" class="fav-card__remove" data-id="' + f.id + '" data-type="' + It.app.esc(type) +
          '" data-fid="' + f.favorable_id + '" aria-label="Remove ' + It.app.esc(name) + ' from favourites" title="Remove from favourites">' +
          '<span class="favourite-heart" aria-hidden="true">♥</span></button></div>';
      }).join("");

      Array.prototype.forEach.call(grid.querySelectorAll(".fav-card__remove"), function (btn) {
        btn.addEventListener("click", function () {
          var type = btn.dataset.type;
          var fid = btn.dataset.fid;
          btn.disabled = true;
          It.apiPost("/favourites/" + type + "/" + fid, {}, { auth: true }).then(function (res) {
            var status = res.body && res.body.status;
            if (status === "removed") {
              It.app.showToast("Removed from favourites.", "success");
              var card = btn.closest(".card");
              if (card) card.parentNode.removeChild(card);
              if (!grid.querySelector(".card")) {
                grid.innerHTML = '<div class="empty" style="grid-column:1/-1;">' +
                  '<span class="empty__icon">♥</span>' +
                  '<p class="empty__title">Nothing saved yet.</p>' +
                  '<p class="empty__text">Tap the heart on any destination, hotel, restaurant or attraction to keep it here.</p>' +
                  '<a href="/explore.html" class="btn btn--primary">Browse the catalog</a></div>';
              }
            } else {
              It.app.showToast((res.body && res.body.message) || "Could not update favourites.", "error");
              btn.disabled = false;
            }
          }).catch(function () {
            It.app.showToast("Could not update favourites.", "error");
            btn.disabled = false;
          });
        });
      });
    }).catch(function () {
      grid.innerHTML = '<div class="error-card" style="grid-column:1/-1;">' +
        '<p>Could not load your favourites.</p>' +
        '<button type="button" class="btn btn--primary" onclick="location.reload()">Retry</button></div>';
    });
  });
})(window);
