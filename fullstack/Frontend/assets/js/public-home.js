/**
 * public-home.js — Production interactive engine for Itinera Public Landing Page.
 * Connects hero carousel, live metrics (/api/stats/summary), region pills (/api/regions),
 * destination cards (/api/destinations), live weather radar (/api/weather), and auth modal.
 */
(function (global) {
  "use strict";

  var It = global.Itinera || (global.Itinera = {});

  // ── Curated Hero Slides (with fallback high-res travel photography) ──
  var HERO_SLIDES = [
    {
      id: 1,
      name: "MALDIVES",
      location: "Indian Ocean",
      bgImage: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=80&w=2560&auto=format&fit=crop",
      cardImage: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=80&w=800&auto=format&fit=crop",
      description: "Crystal turquoise lagoons, private overwater sanctuaries, and pristine coral reefs.",
      lat: 3.2028,
      lon: 73.2207
    },
    {
      id: 2,
      name: "SWISS ALPS",
      location: "Switzerland",
      bgImage: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?q=80&w=2560&auto=format&fit=crop",
      cardImage: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?q=80&w=800&auto=format&fit=crop",
      description: "Majestic snow-capped alpine peaks, luxury ski chalets, and crisp mountain serenity.",
      lat: 46.0207,
      lon: 7.7491
    },
    {
      id: 3,
      name: "SANTORINI",
      location: "Greece",
      bgImage: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=2560&auto=format&fit=crop",
      cardImage: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=800&auto=format&fit=crop",
      description: "White-washed cliffside suites, deep azure Aegean waters, and legendary golden sunsets.",
      lat: 36.3932,
      lon: 25.4615
    },
    {
      id: 4,
      name: "PARIS",
      location: "France",
      bgImage: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2560&auto=format&fit=crop",
      cardImage: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop",
      description: "Romantic boulevards, Michelin haute cuisine, and iconic Eiffel Tower vistas.",
      lat: 48.8566,
      lon: 2.3522
    },
    {
      id: 5,
      name: "TOKYO",
      location: "Japan",
      bgImage: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=2560&auto=format&fit=crop",
      cardImage: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=800&auto=format&fit=crop",
      description: "Futuristic neon skylines, historic shrines, and world-renowned culinary perfection.",
      lat: 35.6762,
      lon: 139.6503
    },
    {
      id: 6,
      name: "CAIRO & GIZA",
      location: "Egypt",
      bgImage: "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?q=80&w=2560&auto=format&fit=crop",
      cardImage: "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?q=80&w=800&auto=format&fit=crop",
      description: "Ancient Pyramids of Giza, Nile River sunset cruises, and timeless Mediterranean heritage.",
      lat: 29.9792,
      lon: 31.1342
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
      cImg.onerror = function() {
        cImg.onerror = null;
        cImg.src = "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80";
      };
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

  // ── Live Weather Station Driven by Hero Carousel ──
  function fetchCityWeather(lat, lon, cityName) {
    if (!lat || !lon) return;
    It.apiGet("/weather?lat=" + lat + "&lon=" + lon).then(function (res) {
      if (!res.ok || !res.body) return;
      var cw = res.body.current_weather || res.body;
      var temp = cw.temperature != null ? Math.round(cw.temperature) : "—";
      var code = cw.weathercode != null ? cw.weathercode : (res.body.weathercode || 0);
      var desc = WEATHER_DESCRIPTIONS[code] || "Clear Sky";

      var iconClass = "fas fa-sun";
      if (code >= 1 && code <= 3) iconClass = "fas fa-cloud-sun";
      else if (code >= 45 && code <= 48) iconClass = "fas fa-smog";
      else if (code >= 51 && code <= 65) iconClass = "fas fa-cloud-rain";
      else if (code >= 71 && code <= 75) iconClass = "fas fa-snowflake";
      else if (code >= 80 && code <= 82) iconClass = "fas fa-cloud-showers-heavy";
      else if (code >= 95) iconClass = "fas fa-bolt";

      var tempEl = el("heroWTemp");
      var descEl = el("heroWDesc");
      var cityEl = el("heroWCity");
      var iconEl = el("heroWIcon");

      if (tempEl) tempEl.textContent = temp + "°C";
      if (descEl) descEl.textContent = desc;
      if (cityEl && cityName) cityEl.textContent = cityName;
      if (iconEl) iconEl.className = iconClass + " text-amber-400 text-xs";

      var pill = el("heroWeatherPill");
      if (pill && typeof gsap !== "undefined") {
        gsap.fromTo(pill, { opacity: 0.5, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" });
      }
    }).catch(function () {});
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

  var DEFAULT_DESTINATIONS = [
    { id: 101, name: "Paris", city: "Paris", country: { name: "France" }, image_url: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80", description: "Romantic boulevards, world-renowned gastronomy, and Eiffel Tower views.", hotels_count: 24, tours_count: 18, region_name: "Europe" },
    { id: 102, name: "New York", city: "New York", country: { name: "United States" }, image_url: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80", description: "The city that never sleeps — iconic skyline, endless energy, and Broadway.", hotels_count: 42, tours_count: 35, region_name: "North America" },
    { id: 103, name: "Tokyo", city: "Tokyo", country: { name: "Japan" }, image_url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80", description: "Ultramodern neon skylines blended with ancient shrines and Michelin dining.", hotels_count: 38, tours_count: 29, region_name: "Asia" },
    { id: 104, name: "Santorini", city: "Santorini", country: { name: "Greece" }, image_url: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80", description: "White-washed cliffside villas, azure Aegean waters, and golden sunsets.", hotels_count: 19, tours_count: 14, region_name: "Europe" },
    { id: 105, name: "Rome", city: "Rome", country: { name: "Italy" }, image_url: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80", description: "Ancient Colosseum grandeur, cobblestone piazzas, and authentic gelato.", hotels_count: 31, tours_count: 22, region_name: "Europe" },
    { id: 106, name: "Dubai", city: "Dubai", country: { name: "United Arab Emirates" }, image_url: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80", description: "Futuristic skyscrapers, luxury desert safaris, and 7-star hospitality.", hotels_count: 28, tours_count: 20, region_name: "Middle East" },
    { id: 107, name: "London", city: "London", country: { name: "United Kingdom" }, image_url: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80", description: "Royal palaces, historic Thames riverfront, and West End theater productions.", hotels_count: 36, tours_count: 30, region_name: "Europe" },
    { id: 108, name: "Cairo", city: "Cairo", country: { name: "Egypt" }, image_url: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=800&q=80", description: "The Giza Pyramids, Grand Egyptian Museum, and Nile river sunset cruises.", hotels_count: 22, tours_count: 18, region_name: "Africa & Middle East" },
  ];

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
        renderDestinationsGrid(DEFAULT_DESTINATIONS);
        return;
      }
      renderDestinationsGrid(items.slice(0, 8));
    }).catch(function () {
      renderDestinationsGrid(DEFAULT_DESTINATIONS);
    });
  }

  function renderDestinationsGrid(items) {
    var grid = el("topDestGrid");
    if (!grid) return;
    grid.innerHTML = "";

    items.forEach(function (item, idx) {
      var card = document.createElement("div");
      card.className = "dest-card";
      var fallbackImg = HERO_SLIDES[idx % HERO_SLIDES.length]?.cardImage || HERO_SLIDES[0].cardImage;
      var img = item.image_url || item.image || fallbackImg;
      var hotelsCount = item.hotels_count != null ? item.hotels_count : (item.hotel_count || "12");
      var toursCount = item.tours_count != null ? item.tours_count : (item.tour_count || "8");
      var regionName = (item.country && item.country.region && item.country.region.name) || item.region_name || "Worldwide";

      card.innerHTML =
        '<img src="' + img + '" alt="' + (item.name || item.city || "Destination") + '" loading="lazy" onerror="this.onerror=null;this.src=\'' + fallbackImg + '\';" />' +
        '<div class="dest-name">' +
          '<span>' + (item.name || item.city || "Curated Haven") + '</span>' +
          '<span class="text-xs text-amber-400 font-semibold flex items-center gap-1"><i class="fas fa-star text-[10px]"></i> 4.9</span>' +
        '</div>' +
        '<div class="dest-location">' +
          '<i class="fas fa-location-dot text-white/40"></i>' +
          '<span>' + (item.city ? item.city + ', ' : '') + ((item.country && item.country.name) || item.country || 'Global Landmark') + '</span>' +
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
            if (user) localStorage.setItem("itinera_user", JSON.stringify(user));
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
            if (user) localStorage.setItem("itinera_user", JSON.stringify(user));
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

  function initGSAPAnimations() {
    if (typeof gsap === "undefined") return;

    if (typeof ScrollTrigger !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
    }

    // 1. Hero Content Entrance (Staggered Timeline)
    var tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.from(".hero-badge", { opacity: 0, y: -30, scale: 0.9, duration: 1, delay: 0.2 })
      .from(".hero-headline", { opacity: 0, y: 40, duration: 1.2 }, "-=0.7")
      .from(".hero-subtext", { opacity: 0, y: 30, duration: 1 }, "-=0.8")
      .from(".hero-ctas", { opacity: 0, y: 20, duration: 0.9 }, "-=0.7")
      .from("#carousel-card", { opacity: 0, x: 60, scale: 0.9, duration: 1.3, ease: "back.out(1.5)" }, "-=1");

    // 2. Parallax background on scroll
    if (typeof ScrollTrigger !== "undefined" && el("heroWrapper")) {
      gsap.to("#heroWrapper", {
        backgroundPositionY: "45%",
        ease: "none",
        scrollTrigger: {
          trigger: "#heroWrapper",
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });
    }

    // 3. KPI Animated Counters
    if (typeof ScrollTrigger !== "undefined") {
      var statsConfig = [
        { id: "stat-hotels", target: 120, suffix: "+" },
        { id: "stat-tours", target: 45, suffix: "+" },
        { id: "stat-flights", target: 85, suffix: "+" },
        { id: "stat-reviews", target: 1.2, suffix: "K", isDecimal: true }
      ];

      statsConfig.forEach(function (stat) {
        var node = el(stat.id);
        if (!node) return;
        
        ScrollTrigger.create({
          trigger: node,
          start: "top 90%",
          onEnter: function () {
            var counter = { val: 0 };
            gsap.to(counter, {
              val: stat.target,
              duration: 2,
              ease: "power2.out",
              onUpdate: function () {
                if (stat.isDecimal) {
                  node.textContent = counter.val.toFixed(1) + stat.suffix;
                } else {
                  node.textContent = Math.floor(counter.val) + stat.suffix;
                }
              }
            });
          },
          once: true
        });
      });
    }

    // 4. Staggered ScrollTrigger animations for all glass cards & section headers
    if (typeof ScrollTrigger !== "undefined") {
      gsap.utils.toArray(".glass-card, .section-title, .section-sub").forEach(function(elem) {
        gsap.from(elem, {
          opacity: 0,
          y: 45,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: elem,
            start: "top 88%",
            toggleActions: "play none none none"
          }
        });
      });
    }

    // 5. 3D Tilt Micro-Interaction for Hero Carousel Card
    var card = el("carousel-card");
    if (card) {
      card.addEventListener("mousemove", function(e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        gsap.to(card, {
          rotateY: x * 0.04,
          rotateX: -y * 0.04,
          transformPerspective: 1000,
          duration: 0.4,
          ease: "power1.out"
        });
      });
      card.addEventListener("mouseleave", function() {
        gsap.to(card, {
          rotateY: 0,
          rotateX: 0,
          duration: 0.6,
          ease: "power2.out"
        });
      });
    }
  }

  // ── Bootstrapping ──
  document.addEventListener("DOMContentLoaded", function () {
    initHeroCarousel();
    loadPlatformStats();
    loadRegionsAndDestinations();
    initAuthModal();
    syncAuthState();
    initGSAPAnimations();

    var year = el("footerYear");
    if (year) year.textContent = new Date().getFullYear();
  });

})(window);
