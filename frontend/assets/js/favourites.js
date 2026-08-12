/**
 * favourites.js — My Favourites page.
 * Lists the user's saved destinations/hotels/restaurants/attractions via
 * GET /v1/dashboard/favourites and removes them via POST /v1/favourites/{type}/{id}
 * (toggle endpoint — returns {status:"removed"} when unfavouriting).
 */
(function (global) {
  "use strict";

  const It = global.Itinari;
  const $ = function (id) { return document.getElementById(id); };

  const TYPE_LABELS = {
    destination: "Destination",
    hotel: "Hotel",
    restaurant: "Restaurant",
    attraction: "Attraction",
  };

  /** Resolve a relative storage image (e.g. "img/Paris.jpg") against the API origin. */
  function imgUrl(src) {
    if (!src) return null;
    if (/^https?:\/\//i.test(src)) return src;
    if (src.charAt(0) === "/") return It.CONFIG.apiBase.replace(/\/api$/, "") + src;
    return It.CONFIG.apiBase.replace(/\/api$/, "") + "/storage/" + src;
  }

  function itemName(item) {
    if (!item) return "";
    return item.name || item.title || item.city_name || "Saved place";
  }

  function typeOf(fav) {
    const raw = fav.favorable_type || "";
    const match = String(raw).match(/(destination|hotel|restaurant|attraction|trip)$/i);
    return match ? match[1].toLowerCase() : null;
  }

  function buildCard(fav) {
    const type = typeOf(fav);
    const item = fav.item || {};
    const name = itemName(item);
    const thumb = imgUrl(item.image);

    const card = document.createElement("article");
    card.className = "fav-card";
    card.dataset.favId = String(fav.id || "");
    card.dataset.type = type || "";
    card.dataset.entityId = String(item.id || fav.favorable_id || "");

    const thumbEl = document.createElement("div");
    thumbEl.className = "fav-thumb";
    if (thumb) {
      const img = document.createElement("img");
      img.src = thumb;
      img.alt = name;
      img.loading = "lazy";
      img.addEventListener("error", function () {
        thumbEl.innerHTML = '<i class="fas fa-image ph"></i>';
      });
      thumbEl.appendChild(img);
    } else {
      thumbEl.innerHTML = '<i class="fas fa-image ph"></i>';
    }

    const body = document.createElement("div");
    body.className = "fav-body";

    const chip = document.createElement("span");
    chip.className = "fav-type";
    chip.textContent = TYPE_LABELS[type] || "Saved";

    const h3 = document.createElement("h3");
    h3.textContent = name;

    const meta = document.createElement("p");
    meta.className = "fav-meta";
    meta.textContent = "Saved " + (fav.created_at ? new Date(fav.created_at).toLocaleDateString() : "");

    const actions = document.createElement("div");
    actions.className = "fav-actions";

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn-outline";
    removeBtn.innerHTML = '<i class="fas fa-heart-broken"></i> Remove';
    removeBtn.addEventListener("click", function () { removeFavourite(card); });

    actions.appendChild(removeBtn);

    body.appendChild(chip);
    body.appendChild(h3);
    body.appendChild(meta);
    body.appendChild(actions);

    card.appendChild(thumbEl);
    card.appendChild(body);
    return card;
  }

  function render(list) {
    const grid = $("fav-grid");
    const empty = $("fav-empty");
    const count = $("fav-count");
    grid.innerHTML = "";

    if (!list || !list.length) {
      if (empty) empty.hidden = false;
      if (count) count.textContent = "0 saved places";
      return;
    }
    if (empty) empty.hidden = true;
    if (count) count.textContent = list.length + " saved place" + (list.length === 1 ? "" : "s");
    list.forEach(function (fav) { grid.appendChild(buildCard(fav)); });
  }

  function loadFavourites() {
    It.apiGet("/v1/dashboard/favourites")
      .then(function (r) {
        if (!r.ok) {
          It.feedback.banner(r.body && (r.body.message || r.body.error) || "Could not load favourites.", "is-error");
          return;
        }
        render(r.body.data || []);
      })
      .catch(function () {
        It.feedback.banner("Could not reach the server. Please try again.", "is-error");
        $("fav-grid").innerHTML = "";
        const empty = $("fav-empty");
        if (empty) empty.hidden = false;
      });
  }

  function removeFavourite(card) {
    const type = card.dataset.type;
    const id = card.dataset.entityId;
    if (!type || !id) return;

    const btn = card.querySelector(".btn-outline");
    It.feedback.loading(btn, true);

    It.apiPost("/v1/favourites/" + encodeURIComponent(type) + "/" + encodeURIComponent(id), {}, {})
      .then(function (r) {
        It.feedback.loading(btn, false);
        const body = r.body || {};
        if (r.ok && (body.status === "removed" || !body.status)) {
          It.feedback.toast((body.message || "Removed from favourites"), "ok");
          card.remove();
          const remaining = document.querySelectorAll(".fav-card").length;
          if (remaining === 0) {
            const empty = $("fav-empty");
            if (empty) empty.hidden = false;
            const count = $("fav-count");
            if (count) count.textContent = "0 saved places";
          } else {
            const count = $("fav-count");
            if (count) count.textContent = remaining + " saved place" + (remaining === 1 ? "" : "s");
          }
        } else {
          It.feedback.banner(body.message || "Could not remove favourite.", "is-error");
        }
      })
      .catch(function () {
        It.feedback.loading(btn, false);
        It.feedback.banner("Could not reach the server. Please try again.", "is-error");
      });
  }

  // Sidebar user block
  It.session.currentUser().then(function (user) {
    if (!user) return;
    const nameEl = $("user-display-name");
    const roleEl = $("user-display-role");
    if (nameEl) nameEl.textContent = user.name || "Member";
    if (roleEl) {
      const role = It.session.roleOf(user);
      roleEl.textContent = role ? role.replace(/_/g, " ") : "Member";
    }
    const avatar = $("avatar-letters");
    if (avatar && user.name) avatar.textContent = user.name.charAt(0).toUpperCase();
  });

  const logoutBtn = $("logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", function () { It.session.logout(); });

  loadFavourites();
})(window);
