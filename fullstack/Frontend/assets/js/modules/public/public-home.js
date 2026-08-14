/**
 * public-home.js — Production interactive engine for Itinera Public Landing Page.
 * Connects hero carousel, live metrics (/api/stats/summary), region pills (/api/regions),
 * destination cards (/api/destinations), live weather radar (/api/weather), and auth modal.
 */
(function (global) {
  "use strict";

  var It = global.Itinari || (global.Itinari = {});

  // ── Curated Hero Slides (with fallback high-res travel photography) ──
  var HERO_SLIDES = [
    {
      id: 1,
      name: "NEW YORK",
      location: "United States",
      bgImage: "https://images.pexels.com/photos/1486222/pexels-photo-1486222.jpeg?auto=compress&cs=tinysrgb&w=1920",
      cardImage: "https://images.pexels.com/photos/1486222/pexels-photo-1486222.jpeg?auto=compress&cs=tinysrgb&w=600",
      description: "The city that never sleeps — iconic skyline, endless energy, and world-class culture.",
      lat: 40.7128,
      lon: -74.0060
    },
    {
      id: 2,
      name: "SANTORINI",
      location: "Greece",
      bgImage: "https://images.pexels.com/photos/1586077/pexels-photo-1586077.jpeg?auto=compress&cs=tinysrgb&w=1920",
      cardImage: "https://images.pexels.com/photos/1586077/pexels-photo-1586077.jpeg?auto=compress&cs=tinysrgb&w=600",
      description: "White-washed cliffside villas, deep azure Aegean waters, and legendary golden sunsets.",
      lat: 36.3932,
      lon: 25.4615
    },
    {
      id: 3,
      name: "PARIS",
      location: "France",
      bgImage: "https://images.pexels.com/photos/699466/pexels-photo-699466.jpeg?auto=compress&cs=tinysrgb&w=1920",
      cardImage: "https://images.pexels.com/photos/699466/pexels-photo-699466.jpeg?auto=compress&cs=tinysrgb&w=600",
      description: "Romantic boulevards, world-renowned gastronomy, and timeless historic architecture.",
      lat: 48.8566,
      lon: 2.3522
    },
    {
      id: 4,
      name: "BARCELONA",
      location: "Spain",
      bgImage: "https://images.pexels.com/photos/2872373/pexels-photo-2872373.jpeg?auto=compress&cs=tinysrgb&w=1920",
      cardImage: "https://images.pexels.com/photos/2872373/pexels-photo-2872373.jpeg?auto=compress&cs=tinysrgb&w=600",
      description: "Gaudí masterpieces, vibrant Mediterranean shores, and exquisite tapas dining.",
      lat: 41.3879,
      lon: 2.1699
    },
    {
      id: 5,
      name: "TOKYO",
      location: "Japan",
      bgImage: "https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg?auto=compress&cs=tinysrgb&w=1920",
      cardImage: "https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg?auto=compress&cs=tinysrgb&w=600",
      description: "Ultramodern neon skylines blended with ancient shrines, serenity, and culinary mastery.",
      lat: 35.6762,
      lon: 139.6503
    }
  ];

  var WEATHER_DESCRIPTIONS = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snowfall",
    73: "Moderate snowfall",
    75: "Heavy snowfall",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm"
  };

  var currentSlide = 0;
  var slideTimer = null;
  var currentRegion = "all";

  function el(id) {
    return document.getElementById(id);
  }

  // ── Toast System ──
  var toastTimeout = null;
  function showToast(msg, isError) {
    var t = el("appToast");
    var m = el("appToastMsg");
    if (!t || !m) return;
    m.textContent = msg;
    t.className = "toast show" + (isError ? " err" : "");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(function () {
      t.className = "toast";
    }, 3500);
  }

  // ── Hero Carousel Engine ──
  function initHeroCarousel() {
    renderHeroDots();
    showHeroSlide(0);
    startCarouselAutoPlay();

    var prevBtn = el("carousel-prev");
    var nextBtn = el("carousel-next");
    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        showHeroSlide((currentSlide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
        resetCarouselAutoPlay();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        showHeroSlide((currentSlide + 1) % HERO_SLIDES.length);
        resetCarouselAutoPlay();
      });
    }
  }

  function renderHeroDots() {
    var container = el("carousel-dots");
    if (!container) return;
    container.innerHTML = "";
    HERO_SLIDES.forEach(function (_, i) {
      var d = document.createElement("button");
      d.className = "w-2 h-2 rounded-full transition-all duration-300 " + (i === 0 ? "bg-white w-6" : "bg-white/30 hover:bg-white/60");
      d.setAttribute("aria-label", "Slide " + (i + 1));
      d.addEventListener("click", function () {
        showHeroSlide(i);
        resetCarouselAutoPlay();
      });
      container.appendChild(d);
    });
  }

  function showHeroSlide(index) {
    currentSlide = index;
    var slide = HERO_SLIDES[index];
    if (!slide) return;

    var heroWrapper = el("heroWrapper");
    var heroTitle = el("hero-title");
    var cImg = el("carousel-img");
    var cName = el("carousel-name");
    var cLoc = el("carousel-location-text");
    var cDesc = el("carousel-desc");
    var cText = el("carousel-text");
    var cProg = el("carousel-progress");

    if (heroWrapper) {
      heroWrapper.style.backgroundImage = "url('" + slide.bgImage + "')";
    }
    if (heroTitle) {
      heroTitle.textContent = slide.name;
    }
    if (cImg) {
      cImg.src = slide.cardImage;
      cImg.alt = slide.name;
    }
    if (cName) cName.textContent = slide.name.charAt(0) + slide.name.slice(1).toLowerCase();
    if (cLoc) cLoc.textContent = slide.location;
    if (cDesc) cDesc.textContent = slide.description;
    if (cText) cText.textContent = "0" + (index + 1) + "/0" + HERO_SLIDES.length;
    if (cProg) {
      var pct = ((index + 1) / HERO_SLIDES.length) * 100;
      cProg.style.width = pct + "%";
    }

    // Update Dots
    var dots = el("carousel-dots");
    if (dots) {
      var dotBtns = dots.querySelectorAll("button");
      dotBtns.forEach(function (b, i) {
        b.className = "h-2 rounded-full transition-all duration-300 " + (i === index ? "bg-white w-6" : "bg-white/30 hover:bg-white/60 w-2");
      });
    }

    // Update Weather widget for current slide coords
    fetchCityWeather(slide.lat, slide.lon, slide.name);
  }

  function startCarouselAutoPlay() {
    clearInterval(slideTimer);
    slideTimer = setInterval(function () {
      showHeroSlide((currentSlide + 1) % HERO_SLIDES.length);
    }, 8000);
  }

  function resetCarouselAutoPlay() {
    clearInterval(slideTimer);
    startCarouselAutoPlay();
  }

  // ── Live Weather Station ──
  function fetchCityWeather(lat, lon, cityName) {
    if (!lat || !lon) return;
    It.apiGet("/weather?lat=" + lat + "&lon=" + lon).then(function (res) {
      if (!res.ok || !res.body) return;
      var cw = res.body.current_weather || res.body;
      var temp = cw.temperature != null ? Math.round(cw.temperature) : "—";
      var code = cw.weathercode != null ? cw.weathercode : (res.body.weathercode || 0);
      var desc = WEATHER_DESCRIPTIONS[code] || "Pleasant conditions";

      var tempEl = el("weatherHeroTemp");
      var descEl = el("weatherHeroDesc");
      var cityEl = el("weatherHeroCity");
      if (tempEl) tempEl.textContent = temp + "°C";
      if (descEl) descEl.textContent = desc;
      if (cityEl && cityName) cityEl.textContent = cityName;
    }).catch(function () { /* ignore network error */ });
  }

  // ── Platform Summary Metrics ──
  function loadPlatformStats() {
    It.apiGet("/stats/summary").then(function (res) {
      var stats = It.unwrapData(res);
      if (!stats) return;
      var sh = el("stat-hotels");
      var st = el("stat-tours");
      var sf = el("stat-flights");
      var sr = el("stat-reviews");
      if (sh && stats.hotels != null) sh.textContent = Number(stats.hotels).toLocaleString();
      if (st && stats.tours != null) st.textContent = Number(stats.tours).toLocaleString();
      if (sf && stats.flights != null) sf.textContent = Number(stats.flights).toLocaleString();
      if (sr && stats.reviews != null) sr.textContent = String(stats.reviews);
    }).catch(function () { /* fallback values remain */ });
  }

  // ── Continental Region Filter & Destination Grid ──
  function loadRegionsAndDestinations() {
    It.apiGet("/regions").then(function (res) {
      var regions = It.unwrapData(res);
      if (!Array.isArray(regions)) return;
      renderRegionPills(regions);
    }).catch(function () {});

    fetchDestinations("all");
  }

  function renderRegionPills(regions) {
    var container = el("regionPills");
    if (!container) return;
    container.innerHTML = "";

    // "All Destinations" Pill
    var allBtn = document.createElement("button");
    allBtn.className = "chip on";
    allBtn.textContent = "All Continents";
    allBtn.addEventListener("click", function () {
      setRegionFilter("all", allBtn);
    });
    container.appendChild(allBtn);

    regions.forEach(function (reg) {
      var btn = document.createElement("button");
      btn.className = "chip";
      btn.textContent = reg.name;
      btn.addEventListener("click", function () {
        setRegionFilter(reg.id, btn);
      });
      container.appendChild(btn);
    });
  }

  function setRegionFilter(regionId, targetBtn) {
    currentRegion = regionId;
    var container = el("regionPills");
    if (container) {
      var chips = container.querySelectorAll(".chip");
      chips.forEach(function (c) { c.classList.remove("on"); });
      if (targetBtn) targetBtn.classList.add("on");
    }
    fetchDestinations(regionId);
  }

  function fetchDestinations(regionId) {
    var grid = el("topDestGrid");
    if (!grid) return;
    grid.innerHTML = '<div class="col-span-full py-8 text-center text-white/50"><i class="fas fa-circle-notch fa-spin mr-2"></i> Loading curated destinations...</div>';

    var path = "/destinations" + (regionId && regionId !== "all" ? "?region=" + encodeURIComponent(regionId) : "");
    It.apiGet(path).then(function (res) {
      var items = It.unwrapData(res);
      if (!Array.isArray(items) || !items.length) {
        grid.innerHTML = '<div class="col-span-full py-10 text-center text-white/40">No destinations found in this region.</div>';
        return;
      }
      renderDestinationsGrid(items.slice(0, 8));
    }).catch(function () {
      grid.innerHTML = '<div class="col-span-full py-10 text-center text-white/40">Could not load destinations. Please try again.</div>';
    });
  }

  function renderDestinationsGrid(items) {
    var grid = el("topDestGrid");
    if (!grid) return;
    grid.innerHTML = "";

    items.forEach(function (item) {
      var card = document.createElement("div");
      card.className = "dest-card";
      var fallbackImg = HERO_SLIDES[item.id % HERO_SLIDES.length]?.cardImage || HERO_SLIDES[0].cardImage;
      var img = item.image_url || item.image || fallbackImg;
      var hotelsCount = item.hotels_count != null ? item.hotels_count : (item.hotel_count || "—");
      var toursCount = item.tours_count != null ? item.tours_count : (item.tour_count || "—");
      var regionName = (item.country && item.country.region && item.country.region.name) || item.region_name || "";

      card.innerHTML =
        '<img src="' + img + '" alt="' + (item.name || item.city) + '" loading="lazy" />' +
        '<div class="dest-name">' +
          '<span>' + (item.name || item.city) + '</span>' +
          '<span class="text-xs text-amber-400 font-semibold flex items-center gap-1"><i class="fas fa-star text-[10px]"></i> 4.9</span>' +
        '</div>' +
        '<div class="dest-location">' +
          '<i class="fas fa-location-dot text-white/40"></i>' +
          '<span>' + (item.city ? item.city + ', ' : '') + ((item.country && item.country.name) || item.country || '') + '</span>' +
        '</div>' +
        '<div class="dest-desc">' + (item.description || "Discover breathtaking cultural highlights, pristine views, and luxury accommodations.") + '</div>' +
        '<div class="dest-badges">' +
          (regionName ? '<span class="dest-badge">' + regionName + '</span>' : '') +
          '<span class="dest-badge"><i class="fas fa-hotel mr-1 opacity-60"></i>' + hotelsCount + ' Hotels</span>' +
          '<span class="dest-badge"><i class="fas fa-route mr-1 opacity-60"></i>' + toursCount + ' Tours</span>' +
        '</div>';

      card.addEventListener("click", function () {
        window.location.href = "entity.html?type=destinations&id=" + item.id;
      });
      grid.appendChild(card);
    });
  }

  // ── Auth Modal System ──
  function initAuthModal() {
    var modal = el("authModal");
    var closeBtn = el("authCloseBtn");
    var tabLogin = el("tabLogin");
    var tabReg = el("tabRegister");
    var loginForm = el("loginForm");
    var regForm = el("registerForm");

    if (!modal) return;

    window.openAuthModal = function (mode) {
      modal.classList.add("open");
      if (mode === "register") {
        switchToRegister();
      } else {
        switchToLogin();
      }
    };

    window.closeAuthModal = function () {
      modal.classList.remove("open");
    };

    if (closeBtn) closeBtn.addEventListener("click", window.closeAuthModal);
    modal.addEventListener("click", function (e) {
      if (e.target === modal) window.closeAuthModal();
    });

    function switchToLogin() {
      if (tabLogin) tabLogin.className = "on";
      if (tabReg) tabReg.className = "";
      if (loginForm) loginForm.style.display = "block";
      if (regForm) regForm.style.display = "none";
    }

    function switchToRegister() {
      if (tabReg) tabReg.className = "on";
      if (tabLogin) tabLogin.className = "";
      if (regForm) regForm.style.display = "block";
      if (loginForm) loginForm.style.display = "none";
    }

    if (tabLogin) tabLogin.addEventListener("click", switchToLogin);
    if (tabReg) tabReg.addEventListener("click", switchToRegister);

    // Form handlers
    if (loginForm) {
      loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        var email = el("loginEmail").value.trim();
        var password = el("loginPassword").value;
        var btn = loginForm.querySelector("button[type=submit]");
        if (btn) btn.disabled = true;

        try {
          var res = await It.apiPost("/login", { email: email, password: password });
          if (res.ok) {
            var tok = It.extractToken(res.body);
            if (tok) It.storeToken(tok);
            var user = It.session.extractUser(res.body);
            if (user) localStorage.setItem("itinari_user", JSON.stringify(user));
            showToast("Welcome back! Redirecting...", false);
            setTimeout(function () {
              var role = It.session.roleOf(user);
              window.location.href = It.session.getRedirectPath(role);
            }, 600);
          } else {
            showToast(res.body && res.body.message ? res.body.message : "Invalid credentials", true);
          }
        } catch (err) {
          showToast("Network error. Please try again.", true);
        } finally {
          if (btn) btn.disabled = false;
        }
      });
    }

    if (regForm) {
      regForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        var name = el("regName").value.trim();
        var email = el("regEmail").value.trim();
        var phone = el("regPhone") ? el("regPhone").value.trim() : "";
        var password = el("regPassword").value;
        var btn = regForm.querySelector("button[type=submit]");
        if (btn) btn.disabled = true;

        try {
          var res = await It.apiPost("/register", {
            name: name,
            email: email,
            phone: phone,
            password: password,
            password_confirmation: password
          });
          if (res.ok) {
            var tok = It.extractToken(res.body);
            if (tok) It.storeToken(tok);
            var user = It.session.extractUser(res.body);
            if (user) localStorage.setItem("itinari_user", JSON.stringify(user));
            showToast("Account created successfully!", false);
            setTimeout(function () {
              window.location.href = "/app/dashboard.html";
            }, 700);
          } else {
            var msg = (res.body && res.body.message) || "Registration failed";
            if (res.body && res.body.errors) {
              var firstKey = Object.keys(res.body.errors)[0];
              msg = res.body.errors[firstKey][0] || msg;
            }
            showToast(msg, true);
          }
        } catch (err) {
          showToast("Network error. Please try again.", true);
        } finally {
          if (btn) btn.disabled = false;
        }
      });
    }
  }

  // ── Synchronize Auth State in Top Navigation ──
  function syncAuthState() {
    It.session.bootAuth().then(function (auth) {
      if (global.ItTopbar && global.ItTopbar.render) {
        global.ItTopbar.render();
      }
    });
  }

  // ── Bootstrapping ──
  document.addEventListener("DOMContentLoaded", function () {
    initHeroCarousel();
    loadPlatformStats();
    loadRegionsAndDestinations();
    initAuthModal();
    syncAuthState();

    var year = el("footerYear");
    if (year) year.textContent = new Date().getFullYear();
  });

})(window);
