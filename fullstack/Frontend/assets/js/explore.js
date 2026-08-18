/**
 * explore.js — Modern luxury catalog explorer engine (explore.html).
 * Features catalog card attachment button, Select Trip Modal, Confirmation Window,
 * and 5-Second Undo Timer Toast with In-Toast Success/Failure status transition.
 */
(function (global) {
  "use strict";

  var It = global.Itinera || (global.Itinera = {});

  var TAB = "destinations";
  var SEARCH = "";
  var searchTimer = null;
  var USER_FAV_KEYS = {};

  var SELECTED_ITEM_FOR_ATTACH = null;

  var grid = document.getElementById("catalog-grid");
  var tabs = document.getElementById("catalog-tabs");
  var searchInput = document.getElementById("catalog-search");
  var countLabel = document.getElementById("catalog-count-label");

  function el(id) { return document.getElementById(id); }

  function esc(str) {
    if (str == null) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* =========================================================================
   * 1. 5-SECOND UNDO QUEUE & IN-TOAST STATUS TRANSITION ENGINE
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
          if (titleBox) titleBox.textContent = msg || "Successfully attached to trip!";
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
   * 2. SELECT TRIP MODAL ENGINE
   * ========================================================================= */

  global.openTripSelectModal = function (btn) {
    if (!It.session || !It.session.hasToken()) {
      if (typeof It.showGlobalToast === "function") {
        It.showGlobalToast("Please sign in to attach items to your trips.", false);
      }
      return;
    }

    var type = btn.getAttribute("data-type");
    var itemId = Number(btn.getAttribute("data-id"));
    var itemName = btn.getAttribute("data-name");

    SELECTED_ITEM_FOR_ATTACH = { type: type, id: itemId, name: itemName };

    var modal = el("select-trip-modal");
    var list = el("select-trip-list");
    if (!modal || !list) return;

    modal.classList.remove("hidden");
    list.innerHTML = '<div class="py-12 text-center text-white/50 text-xs"><i class="fas fa-spinner fa-spin text-amber-400 text-xl block mb-2"></i> Loading your open trips...</div>';

    It.apiGet("/dashboard/trips", { auth: true, skipNotification: true }).then(function (res) {
      var raw = res.data !== undefined ? res.data : (res.body ? (res.body.data || res.body) : res);
      var trips = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.data) ? raw.data : []);

      if (!trips.length) {
        list.innerHTML = '<div class="py-10 text-center space-y-3">' +
          '<div class="w-12 h-12 rounded-full bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto text-lg"><i class="fas fa-suitcase-rolling"></i></div>' +
          '<p class="text-xs text-white/70 font-semibold">You don\'t have any active trip itineraries yet.</p>' +
          '<a href="app/trip-form.html" class="px-5 py-2 rounded-full bg-amber-400 text-black font-bold text-xs inline-block">Create a New Trip</a>' +
        '</div>';
        return;
      }

      list.innerHTML = trips.map(function (t) {
        return '<div class="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/40 transition flex items-center justify-between gap-4 group">' +
          '<div class="space-y-1">' +
            '<h4 class="text-sm font-bold text-white group-hover:text-amber-400 transition">' + esc(t.title) + '</h4>' +
            '<div class="text-xs text-white/50 flex items-center gap-3">' +
              '<span><i class="fas fa-compass text-amber-400 text-[10px] mr-1"></i> ' + esc(t.travel_style || "Bespoke") + '</span>' +
              '<span><i class="fas fa-clock text-amber-400 text-[10px] mr-1"></i> ' + (t.no_of_days || "—") + ' Days</span>' +
            '</div>' +
          '</div>' +
          '<button type="button" class="select-trip-confirm-btn px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-extrabold text-xs shadow-md transition cursor-pointer flex-shrink-0" data-trip-id="' + t.id + '" data-trip-title="' + esc(t.title) + '">' +
            '<i class="fas fa-plus"></i> Select & Attach' +
          '</button>' +
        '</div>';
      }).join("");

      list.querySelectorAll(".select-trip-confirm-btn").forEach(function (tBtn) {
        tBtn.addEventListener("click", function () {
          var tripId = Number(tBtn.getAttribute("data-trip-id"));
          var tripTitle = tBtn.getAttribute("data-trip-title");

          var modal = el("select-trip-modal");
          if (modal) modal.classList.add("hidden");

          showConfirmationWindow(
            "Attach Item to Trip?",
            "Attach '" + SELECTED_ITEM_FOR_ATTACH.name + "' to '" + tripTitle + "'?",
            function () {
              pushUndoQueue({
                message: "Attaching '" + SELECTED_ITEM_FOR_ATTACH.name + "' to " + tripTitle + "...",
                executeFn: function (callback) {
                  var singularType = SELECTED_ITEM_FOR_ATTACH.type.replace(/s$/, "");
                  It.apiPost("/trips/" + tripId + "/attach/" + singularType, { item_id: SELECTED_ITEM_FOR_ATTACH.id, id: SELECTED_ITEM_FOR_ATTACH.id }, { auth: true, skipNotification: true }).then(function (res) {
                    if (res.ok) {
                      callback(true, (res.body && res.body.message) || "Attached to trip successfully!");
                    } else {
                      var msg = (res.body && res.body.message) || (res.body && res.body.error && res.body.error.message) || "Could not attach item to trip.";
                      callback(false, msg);
                    }
                  }).catch(function () {
                    callback(false, "Network error attaching item to trip.");
                  });
                },
                undoFn: function () {
                  if (typeof It.showGlobalToast === "function") {
                    It.showGlobalToast("Attachment cancelled.", true);
                  }
                }
              });
            }
          );
        });
      });
    }).catch(function () {
      list.innerHTML = '<div class="py-10 text-center text-white/50 text-xs">Could not load your trips.</div>';
    });
  };

  /* =========================================================================
   * 3. CATALOG GRID & CARD RENDERER
   * ========================================================================= */

  function fetchUserFavourites() {
    if (!It.session || !It.session.hasToken()) return Promise.resolve();
    return It.apiGet("/dashboard/favourites", { auth: true, skipNotification: true }).then(function (res) {
      var raw = res.data !== undefined ? res.data : (res.body ? (res.body.data || res.body) : res);
      var favs = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.data) ? raw.data : []);
      USER_FAV_KEYS = {};
      favs.forEach(function (f) {
        var t = (f.favorable_type || "").toLowerCase();
        var key = t + "_" + f.favorable_id;
        USER_FAV_KEYS[key] = true;
        USER_FAV_KEYS[(t + "s") + "_" + f.favorable_id] = true;
      });
    }).catch(function () {});
  }

  function cardFor(type, item) {
    var singularType = type.replace(/s$/, "");
    var href = type === "flights" ? "flight-details.html?id=" + item.id : "entity.html?type=" + type + "&id=" + item.id;
    
    var name = item.name || item.flight_number || (item.airline ? item.airline + " Flight" : "Experience");
    var country = (item.country && item.country.name) || item.country || "";
    var unsplashFallback = (global.Itinera && global.Itinera.getUnsplashImage) 
      ? global.Itinera.getUnsplashImage(name, type, country) 
      : "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80";
    var img = item.image_url || item.image || unsplashFallback;

    var favKey = singularType + "_" + item.id;
    var isFav = Boolean(USER_FAV_KEYS[favKey] || USER_FAV_KEYS[type + "_" + item.id]);

    var kicker, sub, badges = "";
    var ratingVal = Number(item.rating || item.stars || 4.9).toFixed(1);

    if (type === "destinations") {
      kicker = (item.country && item.country.region && item.country.region.name) || item.region_name || "Destination";
      sub = (item.city ? item.city + ", " : "") + (country || "");
      badges = '<span class="px-2.5 py-1 rounded-full bg-white/10 text-white/80 text-[11px] font-semibold flex items-center gap-1"><i class="fas fa-hotel text-amber-400 text-[10px]"></i> ' + (item.hotels_count || 12) + ' Hotels</span>';
    } else if (type === "hotels") {
      kicker = (item.stars ? "★".repeat(Math.min(5, Number(item.stars))) : "5-Star Resort");
      sub = (item.destination && item.destination.city) || (item.destination && item.destination.name) || (item.city_name || "Bespoke Resort");
      badges = '<span class="px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[11px] font-bold">' + kicker + '</span>' +
        '<span class="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[11px]">' + (item.price_per_night != null ? "$" + Number(item.price_per_night).toLocaleString() + "/night" : "$450/night") + '</span>';
    } else if (type === "restaurants") {
      kicker = item.cuisine || "Fine Dining";
      sub = (item.destination && item.destination.city) || (item.destination && item.destination.name) || (item.city_name || "Michelin Selection");
      badges = '<span class="px-2.5 py-1 rounded-full bg-white/10 text-white/80 text-[11px] font-semibold">' + esc(kicker) + '</span>' +
        '<span class="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[11px]">' + esc(item.price_range || "$$$$") + '</span>';
    } else if (type === "flights") {
      kicker = item.flight_number || "Commercial Flight";
      sub = (item.origin || "Origin") + " → " + (item.destination || "Destination");
      name = item.airline || "Commercial Airline";
      badges = '<span class="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-mono font-semibold">' + esc(kicker) + '</span>' +
        '<span class="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[11px]">' + (item.price != null ? "$" + Number(item.price).toLocaleString() : "$550") + '</span>';
    } else {
      kicker = (item.category && item.category.name) || "Cultural Landmark";
      sub = (item.destination && item.destination.name) || (item.city_name || "Must-Visit");
      badges = '<span class="px-2.5 py-1 rounded-full bg-white/10 text-white/80 text-[11px] font-semibold">' + esc(kicker) + '</span>';
    }

    return '<div class="group relative rounded-3xl bg-white/5 border border-white/10 overflow-hidden shadow-xl hover:border-amber-400/40 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 flex flex-col justify-between cursor-pointer" onclick="window.location.href=\'' + href + '\'">' +
      '<div>' +
        '<!-- Image & Overlay Container -->' +
        '<div class="relative h-48 overflow-hidden bg-black/40">' +
          '<img src="' + img + '" alt="' + esc(name) + '" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onerror="this.onerror=null;this.src=\'' + unsplashFallback + '\';" />' +
          '<div class="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-80"></div>' +

          '<span class="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-extrabold uppercase tracking-wider text-amber-400 shadow-md">' +
            esc(kicker) +
          '</span>' +

          '<button type="button" class="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white flex items-center justify-center hover:scale-110 transition shadow-md fav-card-btn" data-type="' + type + '" data-id="' + item.id + '" onclick="event.stopPropagation(); window.toggleCardFavourite(this);">' +
            '<i class="' + (isFav ? 'fas fa-heart text-rose-500' : 'far fa-heart text-white') + ' text-xs"></i>' +
          '</button>' +
        '</div>' +

        '<!-- Content Body -->' +
        '<div class="p-4 space-y-2.5">' +
          '<div class="flex items-center justify-between gap-2">' +
            '<h3 class="text-base font-bold text-white group-hover:text-amber-400 transition leading-snug truncate">' + esc(name) + '</h3>' +
            '<div class="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full text-[11px] font-bold text-amber-400 flex-shrink-0">' +
              '<i class="fas fa-star text-[9px]"></i> ' + ratingVal +
            '</div>' +
          '</div>' +

          (sub ? '<p class="text-xs text-white/60 flex items-center gap-1.5"><i class="fas fa-location-dot text-amber-400/80 text-[10px]"></i> ' + esc(sub) + '</p>' : '') +

          '<div class="flex items-center gap-2 flex-wrap pt-1">' + badges + '</div>' +
        '</div>' +
      '</div>' +

      '<!-- Dedicated Card Action: + Attach to Trip -->' +
      '<div class="p-4 pt-0 border-t border-white/5">' +
        '<button type="button" class="w-full py-2.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-400 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer group-hover:bg-amber-400 group-hover:text-black shadow-md" data-type="' + type + '" data-id="' + item.id + '" data-name="' + esc(name) + '" onclick="event.stopPropagation(); window.openTripSelectModal(this);">' +
          '<i class="fas fa-plus-circle"></i> Attach to Trip' +
        '</button>' +
      '</div>' +
    '</div>';
  }

  global.toggleCardFavourite = function (btn) {
    if (!It.session || !It.session.hasToken()) {
      if (typeof It.showGlobalToast === "function") {
        It.showGlobalToast("Please sign in to save favourites.", false);
      }
      return;
    }
    var type = btn.getAttribute("data-type");
    var itemId = btn.getAttribute("data-id");
    var singularType = type.replace(/s$/, "");

    btn.disabled = true;
    It.apiPost("/favourites/" + type + "/" + itemId, {}, { auth: true, skipNotification: true }).then(function (res) {
      var status = res.body && (res.body.status || (res.body.data && res.body.data.status));
      var isAdded = status !== "removed";

      var icon = btn.querySelector("i");
      if (icon) {
        icon.className = isAdded ? "fas fa-heart text-rose-500 text-xs" : "far fa-heart text-white text-xs";
      }

      var key = singularType + "_" + itemId;
      USER_FAV_KEYS[key] = isAdded;
      USER_FAV_KEYS[type + "_" + itemId] = isAdded;

      if (typeof It.showGlobalToast === "function") {
        It.showGlobalToast(isAdded ? "Saved to your favourites." : "Removed from favourites.", true);
      }
      btn.disabled = false;
    }).catch(function () {
      if (typeof It.showGlobalToast === "function") {
        It.showGlobalToast("Could not update favourites.", false);
      }
      btn.disabled = false;
    });
  };

  var CURRENT_PAGE = 1;
  var PER_PAGE = 20;
  var SELECTED_REGION = "";

  function renderPagination(totalPages) {
    var pagContainer = el("catalog-pagination");
    if (!pagContainer) {
      if (grid && grid.parentNode) {
        pagContainer = document.createElement("div");
        pagContainer.id = "catalog-pagination";
        pagContainer.className = "mt-12 flex items-center justify-center gap-2 flex-wrap";
        grid.parentNode.insertBefore(pagContainer, grid.nextSibling);
      } else {
        return;
      }
    }

    if (totalPages <= 1) {
      pagContainer.innerHTML = "";
      return;
    }

    var html = '<div class="flex items-center justify-center gap-2 flex-wrap text-xs font-semibold py-4">' +
      '<button type="button" id="pag-prev" class="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5" ' + (CURRENT_PAGE <= 1 ? 'disabled' : '') + '><i class="fas fa-chevron-left text-[10px]"></i> Prev</button>';

    for (var p = 1; p <= totalPages; p++) {
      var isCurrent = p === CURRENT_PAGE;
      html += '<button type="button" class="pag-num-btn w-9 h-9 rounded-full font-bold transition cursor-pointer flex items-center justify-center ' +
        (isCurrent ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' : 'bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10') +
        '" data-page="' + p + '">' + p + '</button>';
    }

    html += '<button type="button" id="pag-next" class="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5" ' + (CURRENT_PAGE >= totalPages ? 'disabled' : '') + '>Next <i class="fas fa-chevron-right text-[10px]"></i></button>' +
      '</div>';

    pagContainer.innerHTML = html;

    var prevBtn = el("pag-prev");
    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        if (CURRENT_PAGE > 1) {
          CURRENT_PAGE--;
          loadCatalog();
          scrollToGridTop();
        }
      });
    }

    var nextBtn = el("pag-next");
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        if (CURRENT_PAGE < totalPages) {
          CURRENT_PAGE++;
          loadCatalog();
          scrollToGridTop();
        }
      });
    }

    pagContainer.querySelectorAll(".pag-num-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        CURRENT_PAGE = Number(btn.getAttribute("data-page"));
        loadCatalog();
        scrollToGridTop();
      });
    });
  }

  function scrollToGridTop() {
    if (grid) {
      grid.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  var REGION_MAP = {
    europe: ["france", "paris", "italy", "rome", "venice", "uk", "united kingdom", "london", "spain", "barcelona", "germany", "berlin", "greece", "santorini", "europe"],
    asia: ["japan", "tokyo", "kyoto", "china", "thailand", "bangkok", "singapore", "indonesia", "bali", "asia"],
    "middle east": ["egypt", "cairo", "uae", "united arab emirates", "dubai", "abu dhabi", "saudi arabia", "qatar", "jordan", "middle east"],
    americas: ["usa", "united states", "new york", "los angeles", "canada", "brazil", "mexico", "americas", "america"],
    africa: ["south africa", "kenya", "tanzania", "morocco", "africa"]
  };

  function matchItemRegion(item, targetRegion) {
    if (!targetRegion || targetRegion.trim() === "" || targetRegion === "All Regions") return true;
    var target = targetRegion.toLowerCase();

    var regName = (
      (item.country && item.country.region && item.country.region.name) ||
      (item.destination && item.destination.country && item.destination.country.region && item.destination.country.region.name) ||
      (item.country && item.country.name) ||
      (item.destination && item.destination.country && item.destination.country.name) ||
      item.region_name ||
      item.region ||
      ""
    ).toLowerCase();

    if (regName.indexOf(target) !== -1) return true;

    var combinedText = (
      (item.name || "") + " " +
      (item.city_name || item.city || "") + " " +
      (item.country_name || (item.country && item.country.name) || "") + " " +
      (item.destination && (item.destination.name || item.destination.city || "")) + " " +
      (item.origin || "") + " " +
      (item.destination || "")
    ).toLowerCase();

    var keywords = REGION_MAP[target] || [target];
    for (var k = 0; k < keywords.length; k++) {
      if (combinedText.indexOf(keywords[k]) !== -1) {
        return true;
      }
    }

    return false;
  }

  function loadCatalog() {
    if (!grid) return;
    grid.innerHTML = '<div class="col-span-full py-16 text-center text-white/50 space-y-3"><i class="fas fa-circle-notch fa-spin text-2xl text-amber-400"></i><p class="text-sm font-semibold">Loading luxury experiences...</p></div>';

    fetchUserFavourites().then(function () {
      return It.apiGet("/" + TAB, { skipNotification: true });
    }).then(function (res) {
      var raw = res.data !== undefined ? res.data : (res.body ? (res.body.data || res.body) : res);
      var items = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.data) ? raw.data : []);

      if (SEARCH) {
        var q = SEARCH.toLowerCase();
        items = items.filter(function (i) {
          var name = (i.name || i.airline || "").toLowerCase();
          var city = (i.city_name || i.city || "").toLowerCase();
          var country = (i.country_name || (i.country && i.country.name) || "").toLowerCase();
          return name.indexOf(q) !== -1 || city.indexOf(q) !== -1 || country.indexOf(q) !== -1;
        });
      }

      if (SELECTED_REGION && SELECTED_REGION.trim() !== "" && SELECTED_REGION !== "All Regions") {
        items = items.filter(function (i) {
          return matchItemRegion(i, SELECTED_REGION);
        });
      }

      var totalItems = items.length;
      var totalPages = Math.ceil(totalItems / PER_PAGE) || 1;
      if (CURRENT_PAGE > totalPages) CURRENT_PAGE = totalPages;
      if (CURRENT_PAGE < 1) CURRENT_PAGE = 1;

      var startIndex = (CURRENT_PAGE - 1) * PER_PAGE;
      var pageItems = items.slice(startIndex, startIndex + PER_PAGE);

      if (countLabel) {
        if (totalItems > 0) {
          countLabel.textContent = "Showing " + (startIndex + 1) + "–" + Math.min(startIndex + PER_PAGE, totalItems) + " of " + totalItems + " " + TAB + " experience(s)";
        } else {
          countLabel.textContent = "0 experiences found";
        }
      }

      if (!pageItems.length) {
        grid.innerHTML = '<div class="col-span-full py-16 text-center text-white/50 bg-white/5 rounded-3xl border border-white/10"><p class="text-base font-bold text-white mb-1">No Experiences Found</p><p class="text-xs">Try clearing search keywords or switching category filters.</p></div>';
        renderPagination(0);
        return;
      }

      grid.innerHTML = pageItems.map(function (item) {
        return cardFor(TAB, item);
      }).join("");

      renderPagination(totalPages);
    }).catch(function () {
      grid.innerHTML = '<div class="col-span-full py-16 text-center text-white/50 bg-white/5 rounded-3xl border border-white/10"><p class="text-base font-bold text-white mb-2">Could Not Load Catalog</p><button type="button" class="px-5 py-2 rounded-full bg-amber-400 text-black text-xs font-bold" onclick="location.reload()">Retry Connection</button></div>';
      renderPagination(0);
    });
  }

  function loadRegionPills() {
    var pillsContainer = el("region-pills");
    if (!pillsContainer) return;

    var regions = ["All Regions", "Europe", "Asia", "Middle East", "Americas", "Africa"];
    pillsContainer.innerHTML = regions.map(function (r, i) {
      var isAll = i === 0;
      var active = (isAll && (!SELECTED_REGION || SELECTED_REGION === "All Regions")) || (SELECTED_REGION === r);
      return '<button type="button" class="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex-shrink-0 cursor-pointer ' +
        (active ? 'bg-amber-400 text-black shadow-md' : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white') +
        '" data-region="' + (isAll ? '' : esc(r)) + '">' + esc(r) + '</button>';
    }).join("");

    pillsContainer.querySelectorAll("[data-region]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        SELECTED_REGION = btn.getAttribute("data-region");
        CURRENT_PAGE = 1;
        loadRegionPills();
        loadCatalog();
      });
    });
  }

  function start() {
    var defaultTab = document.body.getAttribute("data-default-tab");
    if (defaultTab) {
      TAB = defaultTab;
    }

    if (tabs) {
      tabs.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-tab]");
        if (!btn) return;
        TAB = btn.getAttribute("data-tab");
        CURRENT_PAGE = 1;
        tabs.querySelectorAll("[data-tab]").forEach(function (b) {
          var active = b === btn;
          b.className = active
            ? "px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer text-nowrap"
            : "px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-bold text-xs transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer text-nowrap";
        });
        loadCatalog();
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
          SEARCH = searchInput.value.trim();
          CURRENT_PAGE = 1;
          loadCatalog();
        }, 300);
      });
    }

    var closeSelectModalBtn = el("close-select-trip-modal-btn");
    if (closeSelectModalBtn) {
      closeSelectModalBtn.addEventListener("click", function () {
        var modal = el("select-trip-modal");
        if (modal) modal.classList.add("hidden");
      });
    }

    loadRegionPills();
    loadCatalog();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})(window);
