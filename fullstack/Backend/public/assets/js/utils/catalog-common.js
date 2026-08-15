/**
 * catalog-common.js — shared helpers for the Discovery catalog pages
 * (destinations, hotels, restaurants, attractions, categories, search).
 * Depends on config.js, api.js, session.js, app.js (toast + auth modal).
 *
 * Covers the doc's decision table:
 *  - Offline image → deterministic seed-based fallback (picsum with seed)
 *  - Guest favourite → auth modal; user returns to the same page after login
 *  - Review button → review form modal (POST /v1/reviews/{type}/{id});
 *  - Empty category/search → empty-state card with reset CTA
 *  - Weather shortcut → prefill weather.html city input & auto-search
 */
(function (global) {
  "use strict";

  const It = global.Itinari;
  if (!It) return;

  const ROUTES = {
    destinations: "/destinations",
    hotels: "/hotels",
    restaurants: "/restaurants",
    attractions: "/attractions",
    flights: "/flights",
    categories: "/categories",
    favsList: "/dashboard/favourites",
  };

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /** Extract the items array from wrapped / bare / paginated API bodies. */
  function dataOf(body) {
    if (!body || typeof body !== "object") return [];
    if (Array.isArray(body)) return body;
    if (Array.isArray(body.data)) return body.data;
    if (body.data && Array.isArray(body.data.data)) return body.data.data;
    return [];
  }

  /** Resolve a relative storage image (e.g. "img/Paris.jpg") against the API origin. */
  function imgUrl(src) {
    if (!src) return null;
    if (/^https?:\/\//i.test(src)) return src;
    if (src.charAt(0) === "/") return It.CONFIG.apiBase.replace(/\/api$/, "") + src;
    return It.CONFIG.apiBase.replace(/\/api$/, "") + "/storage/" + src;
  }

  /** Context-aware fallback image matching the exact destination/hotel/attraction name */
  function seedImg(item, w, h, category) {
    if (!item) return "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80";
    var name = item.name || item.city_name || item.city || "travel destination";
    var country = (item.country && item.country.name) || item.country || "";
    var cat = category || (item.category && item.category.name) || "";
    if (global.Itinari && global.Itinari.getUnsplashImage) {
      return global.Itinari.getUnsplashImage(name, cat, country);
    }
    var query = name + (cat ? " " + cat : "") + " luxury travel photography";
    return "https://image.pollinations.ai/prompt/" + encodeURIComponent(query) + "?width=" + (w || 800) + "&height=" + (h || 600) + "&nologo=true";
  }

  /** Attach a live image to an <img> with contextual fallback on failure. */
  function bindImg(img, item, category) {
    if (!img) return;
    const src = imgUrl(item && (item.image_url || item.image));
    const fallback = seedImg(item, img.dataset.w || 800, img.dataset.h || 600, category);
    img.onerror = function () {
      img.onerror = null;
      img.src = fallback;
    };
    img.src = src || fallback;
  }


  function placeholderIcon() {
    const div = document.createElement("div");
    div.className = "img-ph";
    div.innerHTML = '<i class="fas fa-image" aria-hidden="true"></i>';
    return div;
  }

  /** Star rating markup for a 0–5 value. */
  function stars(rating) {
    const r = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
    let html = '<span class="stars" aria-label="' + r + ' out of 5 stars">';
    for (let i = 1; i <= 5; i++) {
      html += i <= r
        ? '<i class="fas fa-star" aria-hidden="true"></i>'
        : '<i class="far fa-star" aria-hidden="true" style="color:rgba(255,255,255,0.25);"></i>';
    }
    if (rating != null) html += '<span class="stars-num">' + Number(rating).toFixed(1) + "</span>";
    return html + "</span>";
  }

  function fmtPrice(price) {
    if (price == null) return null;
    const n = Number(price);
    if (!isFinite(n)) return null;
    return new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n);
  }

  function toast(msg, isError) {
    if (typeof global.toast === "function") global.toast(msg, isError);
  }

  function isMember() {
    return !!(It.session && It.session.hasToken());
  }

  /* ═══════════════════════════════════════════════════════════
     Favourites
     ═══════════════════════════════════════════════════════════ */

  function favKey(type, id) {
    return type + ":" + id;
  }

  /** Load the member's favourites once and mark matching .heart-btn elements. */
  function loadFavState() {
    if (!isMember()) return;
    It.apiGet(ROUTES.favsList).then(function (res) {
      if (!res.ok) return;
      const list = dataOf(res.body);
      const keys = {};
      list.forEach(function (f) {
        const raw = String(f.favorable_type || "");
        const m = raw.match(/(destination|hotel|restaurant|attraction)$/i);
        if (m) keys[favKey(m[1].toLowerCase(), String(f.favorable_id))] = true;
      });
      document.querySelectorAll(".heart-btn").forEach(function (btn) {
        if (keys[favKey(btn.dataset.type, btn.dataset.id)]) btn.classList.add("on");
      });
    }).catch(function () { /* silent — favourites are progressive enhancement */ });
  }

  /** Toggle favourite. Guests get the auth modal (they stay on the page). */
  function toggleFav(btn, type, id, name) {
    if (!isMember()) {
      if (typeof global.openAuthModal === "function") {
        global.openAuthModal("login", "Sign in to favourite " + (name || "this place") + ".");
      }
      return;
    }
    const on = btn.classList.contains("on");
    btn.disabled = true;
    It.apiPost("/favourites/" + encodeURIComponent(type) + "/" + encodeURIComponent(id), {}, {})
      .then(function (res) {
        btn.disabled = false;
        if (!res.ok) {
          toast((res.body && (res.body.message || res.body.error)) || "Could not update favourites.", true);
          return;
        }
        const status = res.body && res.body.status;
        if (status === "added" || (status !== "removed" && !on)) {
          btn.classList.add("on");
          toast("Added to favourites");
        } else {
          btn.classList.remove("on");
          toast("Removed from favourites");
        }
      })
      .catch(function () {
        btn.disabled = false;
        toast("Could not reach the server. Please try again.", true);
      });
  }

  /** Wire every .heart-btn[data-type][data-id] on the page. */
  function initFavs() {
    document.querySelectorAll(".heart-btn").forEach(function (btn) {
      if (btn.dataset.wired) return;
      btn.dataset.wired = "1";
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggleFav(btn, btn.dataset.type, btn.dataset.id, btn.dataset.name);
      });
    });
    loadFavState();
  }

  /* ═══════════════════════════════════════════════════════════
     Review form modal (Phase 3 step 3 — real form)
     POST /v1/reviews/{type}/{id} { rating, comment }
     - Guest → auth modal; after login the review modal reopens
     - One review per user per item: a 422 is shown inline
     - Reviews start as "pending" until admin approval
     ═══════════════════════════════════════════════════════════ */

  let pendingReview = null; // {type, id, name} — reopened after login

  function openReviewModal(type, id, name) {
    if (!isMember()) {
      pendingReview = { type: type, id: id, name: name };
      if (typeof global.openAuthModal === "function") {
        global.openAuthModal("login", "Sign in to review " + (name || "this place") + ".");
      }
      return;
    }
    pendingReview = null;

    let overlay = document.getElementById("reviewModal");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "modal-overlay";
      overlay.id = "reviewModal";
      overlay.innerHTML =
        '<div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="reviewTitle">' +
        '<div class="flex justify-between items-center mb-4">' +
        '<h3 class="text-xl font-bold" id="reviewTitle">Write a review</h3>' +
        '<button type="button" class="text-white/50 hover:text-white text-xl cursor-pointer" id="reviewCloseBtn" aria-label="Close">' +
        '<i class="fas fa-times" aria-hidden="true"></i></button>' +
        "</div>" +
        '<div id="reviewBody"></div>' +
        "</div>";
      document.body.appendChild(overlay);
      overlay.addEventListener("click", function (e) { if (e.target === overlay) closeReview(); });
      document.getElementById("reviewCloseBtn").addEventListener("click", closeReview);
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeReview(); });
    }

    function closeReview() {
      overlay.classList.remove("open");
      pendingReview = null;
    }

    document.getElementById("reviewBody").innerHTML =
      '<p class="text-white/60 text-sm mb-4">You are reviewing <span class="text-white font-semibold">' + escapeHtml(name || "this place") + "</span>.</p>" +
      '<label class="block text-sm text-white/70 mb-2 font-semibold">Your rating <span class="text-red-400">*</span></label>' +
      '<div class="review-stars" id="reviewStars" role="radiogroup" aria-label="Rating">' +
      [1, 2, 3, 4, 5].map(function (n) {
        return '<button type="button" class="review-star" data-v="' + n + '" role="radio" aria-checked="false" aria-label="' + n + ' star' + (n > 1 ? "s" : "") + '">' +
          '<i class="fas fa-star" aria-hidden="true"></i></button>';
      }).join("") +
      "</div>" +
      '<p class="text-red-400 text-xs mt-1 hidden" id="reviewStarErr">Please choose a rating between 1 and 5 stars.</p>' +
      '<label class="block text-sm text-white/70 mt-4 mb-2 font-semibold" for="reviewComment">Comment</label>' +
      '<textarea id="reviewComment" rows="4" maxlength="1000" placeholder="Share your experience…" ' +
      'class="field-input w-full"></textarea>' +
      '<p class="text-right text-xs text-white/35 mt-1"><span id="reviewCount">0</span>/1000</p>' +
      '<p class="text-red-400 text-sm mt-2 hidden" id="reviewFormErr" role="alert"></p>' +
      '<div class="flex items-center justify-between gap-3 mt-5">' +
      '<p class="text-xs text-white/35"><i class="fas fa-hourglass-half mr-1" aria-hidden="true"></i>Reviews are moderated before publishing.</p>' +
      '<button type="button" class="btn-primary" id="reviewSubmit"><i class="fas fa-paper-plane" aria-hidden="true"></i>Submit review</button>' +
      "</div>";

    let selected = 0;
    const starsEl = document.getElementById("reviewStars");
    const starErr = document.getElementById("reviewStarErr");
    const formErr = document.getElementById("reviewFormErr");
    const countEl = document.getElementById("reviewCount");
    const commentEl = document.getElementById("reviewComment");
    const submitBtn = document.getElementById("reviewSubmit");

    function paint() {
      starsEl.querySelectorAll(".review-star").forEach(function (btn) {
        const on = Number(btn.dataset.v) <= selected;
        btn.classList.toggle("on", on);
        btn.setAttribute("aria-checked", String(on));
      });
      if (selected > 0) starErr.classList.add("hidden");
    }

    starsEl.querySelectorAll(".review-star").forEach(function (btn) {
      btn.addEventListener("click", function () {
        selected = Number(btn.dataset.v);
        paint();
      });
    });

    commentEl.addEventListener("input", function () {
      countEl.textContent = String(commentEl.value.length);
    });

    submitBtn.addEventListener("click", function () {
      if (selected < 1) {
        starErr.classList.remove("hidden");
        starsEl.focus();
        return;
      }
      formErr.classList.add("hidden");
      const payload = { rating: selected };
      const comment = commentEl.value.trim();
      if (comment) payload.comment = comment;

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Submitting…';

      It.apiPost("/reviews/" + encodeURIComponent(type) + "/" + encodeURIComponent(id), payload, {})
        .then(function (res) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fas fa-paper-plane" aria-hidden="true"></i>Submit review';
          if (res.ok) {
            closeReview();
            toast("Review submitted — it will appear once approved.");
            return;
          }
          // Inline errors (validation / duplicate "already reviewed").
          // Backend 422 shape: { error: { message, validation_errors: [{field, message}] } }.
          const body = res.body || {};
          let msg = null;
          if (body.error && Array.isArray(body.error.validation_errors)) {
            msg = body.error.validation_errors
              .map(function (ve) { return ve.message; })
              .filter(Boolean)
              .join(" ");
          }
          if (!msg && body.errors && typeof body.errors === "object") msg = firstError(body.errors);
          if (!msg && body.message) msg = body.message;
          formErr.textContent = msg || "Could not submit your review. Please try again.";
          formErr.classList.remove("hidden");
        })
        .catch(function () {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fas fa-paper-plane" aria-hidden="true"></i>Submit review';
          formErr.textContent = "Could not reach the server. Please try again.";
          formErr.classList.remove("hidden");
        });
    });

    overlay.classList.add("open");
    paint();
  }

  function firstError(errors) {
    if (!errors || typeof errors !== "object") return null;
    const key = Object.keys(errors)[0];
    if (!key) return null;
    const v = errors[key];
    return Array.isArray(v) ? v[0] : String(v);
  }

  /** Wire every .review-btn[data-type][data-id][data-name] on the page. */
  function initReviewBtns() {
    document.querySelectorAll(".review-btn").forEach(function (btn) {
      if (btn.dataset.wired) return;
      btn.dataset.wired = "1";
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        openReviewModal(btn.dataset.type, btn.dataset.id, btn.dataset.name);
      });
    });
    // Guest logged in via the auth modal → reopen the review they tapped.
    document.addEventListener("itinera:auth", function () {
      if (pendingReview) {
        const p = pendingReview;
        pendingReview = null;
        openReviewModal(p.type, p.id, p.name);
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════
     Weather shortcut (destination detail → weather.html)
     ═══════════════════════════════════════════════════════════ */

  function gotoWeather(city) {
    try { sessionStorage.setItem("itinera_weather_city", city); } catch (e) { /* private mode */ }
    global.location.href = "weather.html?city=" + encodeURIComponent(city);
  }

  /* ═══════════════════════════════════════════════════════════
     Empty state (decision table: empty category/search)
     ═══════════════════════════════════════════════════════════ */

  function emptyState(icon, title, sub, resetHref) {
    return (
      '<div class="empty-state">' +
      '<i class="fas ' + icon + '" aria-hidden="true"></i>' +
      '<h3 class="mt-4 text-lg font-bold">' + escapeHtml(title) + "</h3>" +
      (sub ? '<p class="mt-2 text-white/45 text-sm max-w-sm mx-auto">' + escapeHtml(sub) + "</p>" : "") +
      (resetHref
        ? '<a href="' + escapeHtml(resetHref) + '" class="btn-outline mt-5"><i class="fas fa-rotate-left" aria-hidden="true"></i>Reset</a>'
        : "") +
      "</div>"
    );
  }

  It.catalog = {
    ROUTES: ROUTES,
    escapeHtml: escapeHtml,
    dataOf: dataOf,
    imgUrl: imgUrl,
    seedImg: seedImg,
    bindImg: bindImg,
    stars: stars,
    fmtPrice: fmtPrice,
    toast: toast,
    isMember: isMember,
    initFavs: initFavs,
    initReviewBtns: initReviewBtns,
    gotoWeather: gotoWeather,
    emptyState: emptyState,
    openReviewModal: openReviewModal,
  };
})(window);
