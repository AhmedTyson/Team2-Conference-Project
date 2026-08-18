/**
 * countries.js — Countries & Global Cities Explorer Engine
 * Date: 2026-08-17
 * Handles dynamic fetching, filtering, Leaflet map previewing, and search.
 */

(function (global) {
  "use strict";

  var It = global.Itinera || {};
  var activeView = "countries"; // 'countries' | 'cities'
  var activeRegion = "all";
  var searchQuery = "";
  var currentPage = 1;
  var cardsPerPage = 20;
  var allCountries = [];
  var allCities = [];

  var LEAFLET_CITY_MAP = null;

  function el(id) { return document.getElementById(id); }
  function esc(v) {
    if (v == null) return "";
    return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // Pre-configured global countries dataset fallback covering 20+ nations across 5 continents
  var FALLBACK_COUNTRIES = [
    {
      id: 1,
      name: "Egypt",
      iso_code: "EG",
      capital: "Cairo",
      continent: "Africa",
      flag_url: "https://flagcdn.com/w640/eg.png",
      destinations: [
        { id: 1, city: "Cairo", name: "Cairo Ancient Wonders", latitude: 30.0444, longitude: 31.2357 },
        { id: 5, city: "Alexandria", name: "Mediterranean Riviera", latitude: 31.2001, longitude: 29.9187 },
        { id: 6, city: "Luxor", name: "Pharaonic Valley of Kings", latitude: 25.6872, longitude: 32.6396 },
        { id: 17, city: "Sharm El Sheikh", name: "Red Sea Coral Reefs", latitude: 27.9158, longitude: 34.3299 }
      ]
    },
    {
      id: 2,
      name: "France",
      iso_code: "FR",
      capital: "Paris",
      continent: "Europe",
      flag_url: "https://flagcdn.com/w640/fr.png",
      destinations: [
        { id: 2, city: "Paris", name: "Paris Romance & Fashion", latitude: 48.8566, longitude: 2.3522 },
        { id: 7, city: "Nice", name: "French Riviera Luxury Coast", latitude: 43.7102, longitude: 7.2620 },
        { id: 18, city: "Lyon", name: "Gastronomy & Old Town", latitude: 45.7640, longitude: 4.8357 }
      ]
    },
    {
      id: 3,
      name: "Italy",
      iso_code: "IT",
      capital: "Rome",
      continent: "Europe",
      flag_url: "https://flagcdn.com/w640/it.png",
      destinations: [
        { id: 3, city: "Rome", name: "Eternal City Architecture", latitude: 41.9028, longitude: 12.4964 },
        { id: 8, city: "Venice", name: "Canal Grand Experience", latitude: 45.4408, longitude: 12.3155 },
        { id: 19, city: "Milan", name: "Duomo & High Fashion", latitude: 45.4642, longitude: 9.1900 },
        { id: 20, city: "Florence", name: "Renaissance Art & Uffizi", latitude: 43.7696, longitude: 11.2558 }
      ]
    },
    {
      id: 4,
      name: "United Arab Emirates",
      iso_code: "AE",
      capital: "Abu Dhabi",
      continent: "Asia",
      flag_url: "https://flagcdn.com/w640/ae.png",
      destinations: [
        { id: 4, city: "Dubai", name: "Emirates Luxury Skyline", latitude: 25.2048, longitude: 55.2708 },
        { id: 9, city: "Abu Dhabi", name: "Louvre & Grand Mosque", latitude: 24.4539, longitude: 54.3773 }
      ]
    },
    {
      id: 5,
      name: "Japan",
      iso_code: "JP",
      capital: "Tokyo",
      continent: "Asia",
      flag_url: "https://flagcdn.com/w640/jp.png",
      destinations: [
        { id: 10, city: "Tokyo", name: "Tokyo Metropolis & Shrines", latitude: 35.6762, longitude: 139.6503 },
        { id: 11, city: "Kyoto", name: "Ancient Imperial Temples", latitude: 35.0116, longitude: 135.7681 },
        { id: 21, city: "Osaka", name: "Street Food & Dotonbori", latitude: 34.6937, longitude: 135.5023 }
      ]
    },
    {
      id: 6,
      name: "United Kingdom",
      iso_code: "GB",
      capital: "London",
      continent: "Europe",
      flag_url: "https://flagcdn.com/w640/gb.png",
      destinations: [
        { id: 12, city: "London", name: "Royal Heritage & Dining", latitude: 51.5074, longitude: -0.1278 },
        { id: 22, city: "Edinburgh", name: "Royal Mile & Highlands", latitude: 55.9533, longitude: -3.1883 }
      ]
    },
    {
      id: 7,
      name: "Spain",
      iso_code: "ES",
      capital: "Madrid",
      continent: "Europe",
      flag_url: "https://flagcdn.com/w640/es.png",
      destinations: [
        { id: 13, city: "Barcelona", name: "Gaudi Architecture & Coast", latitude: 41.3879, longitude: 2.1699 },
        { id: 14, city: "Madrid", name: "Prado & Royal Palace", latitude: 40.4168, longitude: -3.7038 },
        { id: 23, city: "Seville", name: "Flamenco & Alcazar Palace", latitude: 37.3891, longitude: -5.9845 }
      ]
    },
    {
      id: 8,
      name: "United States",
      iso_code: "US",
      capital: "Washington D.C.",
      continent: "Americas",
      flag_url: "https://flagcdn.com/w640/us.png",
      destinations: [
        { id: 15, city: "New York", name: "Manhattan & Broadway", latitude: 40.7128, longitude: -74.0060 },
        { id: 16, city: "Los Angeles", name: "Hollywood & Beaches", latitude: 34.0522, longitude: -118.2437 },
        { id: 24, city: "Miami", name: "South Beach & Art Deco", latitude: 25.7617, longitude: -80.1918 }
      ]
    },
    {
      id: 9,
      name: "Greece",
      iso_code: "GR",
      capital: "Athens",
      continent: "Europe",
      flag_url: "https://flagcdn.com/w640/gr.png",
      destinations: [
        { id: 25, city: "Athens", name: "Acropolis & Parthenon", latitude: 37.9838, longitude: 23.7275 },
        { id: 26, city: "Santorini", name: "Caldera Sunset & Oia", latitude: 36.3932, longitude: 25.4615 }
      ]
    },
    {
      id: 10,
      name: "Turkey",
      iso_code: "TR",
      capital: "Ankara",
      continent: "Europe",
      flag_url: "https://flagcdn.com/w640/tr.png",
      destinations: [
        { id: 27, city: "Istanbul", name: "Bosphorus & Hagia Sophia", latitude: 41.0082, longitude: 28.9784 },
        { id: 28, city: "Cappadocia", name: "Hot Air Balloons & Caves", latitude: 38.6431, longitude: 34.8289 }
      ]
    },
    {
      id: 11,
      name: "Germany",
      iso_code: "DE",
      capital: "Berlin",
      continent: "Europe",
      flag_url: "https://flagcdn.com/w640/de.png",
      destinations: [
        { id: 29, city: "Berlin", name: "Brandenburg & Culture", latitude: 52.5200, longitude: 13.4050 },
        { id: 30, city: "Munich", name: "Bavaria & Neuschwanstein", latitude: 48.1351, longitude: 11.5820 }
      ]
    },
    {
      id: 12,
      name: "Switzerland",
      iso_code: "CH",
      capital: "Bern",
      continent: "Europe",
      flag_url: "https://flagcdn.com/w640/ch.png",
      destinations: [
        { id: 31, city: "Zurich", name: "Alpine Lakes & High Watchmaking", latitude: 47.3769, longitude: 8.5417 },
        { id: 32, city: "Geneva", name: "Jet d'Eau & Diplomatic Hub", latitude: 46.2044, longitude: 6.1432 }
      ]
    },
    {
      id: 13,
      name: "Netherlands",
      iso_code: "NL",
      capital: "Amsterdam",
      continent: "Europe",
      flag_url: "https://flagcdn.com/w640/nl.png",
      destinations: [
        { id: 33, city: "Amsterdam", name: "Heritage Canals & Rijksmuseum", latitude: 52.3676, longitude: 4.9041 }
      ]
    },
    {
      id: 14,
      name: "Saudi Arabia",
      iso_code: "SA",
      capital: "Riyadh",
      continent: "Asia",
      flag_url: "https://flagcdn.com/w640/sa.png",
      destinations: [
        { id: 34, city: "Riyadh", name: "Kingdom Tower & Diriyah", latitude: 24.7136, longitude: 46.6753 },
        { id: 35, city: "AlUla", name: "Hegra & Ancient Oases", latitude: 26.6174, longitude: 37.9221 }
      ]
    },
    {
      id: 15,
      name: "Morocco",
      iso_code: "MA",
      capital: "Rabat",
      continent: "Africa",
      flag_url: "https://flagcdn.com/w640/ma.png",
      destinations: [
        { id: 36, city: "Marrakech", name: "Medina & Majorelle Garden", latitude: 31.6295, longitude: -7.9811 },
        { id: 37, city: "Casablanca", name: "Hassan II Mosque & Coast", latitude: 33.5731, longitude: -7.5898 }
      ]
    },
    {
      id: 16,
      name: "South Africa",
      iso_code: "ZA",
      capital: "Pretoria",
      continent: "Africa",
      flag_url: "https://flagcdn.com/w640/za.png",
      destinations: [
        { id: 38, city: "Cape Town", name: "Table Mountain & Winelands", latitude: -33.9249, longitude: 18.4241 }
      ]
    },
    {
      id: 17,
      name: "Thailand",
      iso_code: "TH",
      capital: "Bangkok",
      continent: "Asia",
      flag_url: "https://flagcdn.com/w640/th.png",
      destinations: [
        { id: 39, city: "Bangkok", name: "Grand Palace & Floating Markets", latitude: 13.7563, longitude: 100.5018 },
        { id: 40, city: "Phuket", name: "Andaman Sea & Islands", latitude: 7.8804, longitude: 98.3923 }
      ]
    },
    {
      id: 18,
      name: "Singapore",
      iso_code: "SG",
      capital: "Singapore",
      continent: "Asia",
      flag_url: "https://flagcdn.com/w640/sg.png",
      destinations: [
        { id: 41, city: "Singapore", name: "Marina Bay Sands & Gardens", latitude: 1.3521, longitude: 103.8198 }
      ]
    },
    {
      id: 19,
      name: "Australia",
      iso_code: "AU",
      capital: "Canberra",
      continent: "Oceania",
      flag_url: "https://flagcdn.com/w640/au.png",
      destinations: [
        { id: 42, city: "Sydney", name: "Opera House & Harbor", latitude: -33.8688, longitude: 151.2093 },
        { id: 43, city: "Melbourne", name: "Laneways & Art Culture", latitude: -37.8136, longitude: 144.9631 }
      ]
    },
    {
      id: 20,
      name: "Brazil",
      iso_code: "BR",
      capital: "Brasília",
      continent: "Americas",
      flag_url: "https://flagcdn.com/w640/br.png",
      destinations: [
        { id: 44, city: "Rio de Janeiro", name: "Christ the Redeemer & Copacabana", latitude: -22.9068, longitude: -43.1729 }
      ]
    }
  ];

  function start() {
    var loading = el("countries-loading");
    if (loading) loading.classList.remove("hidden");

    Promise.all([
      It.apiGet ? It.apiGet("/countries") : Promise.resolve({ ok: false }),
      It.apiGet ? It.apiGet("/cities") : Promise.resolve({ ok: false }),
      It.apiGet ? It.apiGet("/destinations") : Promise.resolve({ ok: false })
    ]).then(function (results) {
      if (loading) loading.classList.add("hidden");

      var resCountries = results[0];
      var resCities = results[1];
      var resDests = results[2];

      if (resCountries.ok && resCountries.body) {
        var rawC = resCountries.body.data || resCountries.body;
        allCountries = Array.isArray(rawC) && rawC.length ? rawC : FALLBACK_COUNTRIES;
      } else {
        allCountries = FALLBACK_COUNTRIES;
      }

      if (resCities.ok && resCities.body) {
        var rawCi = resCities.body.data || resCities.body;
        allCities = Array.isArray(rawCi) && rawCi.length ? rawCi.map(function (d) {
          var cName = d.city || d.city_name || d.name;
          return {
            id: d.id,
            city: cName,
            name: d.name,
            country: d.country || (d.country_relation && d.country_relation.name) || "Global Destination",
            latitude: Number(d.latitude) || 30.0444,
            longitude: Number(d.longitude) || 31.2357,
            image: resolveCityImage(d.image, cName)
          };
        }) : extractCitiesFromCountries(allCountries);
      } else if (resDests.ok && resDests.body) {
        var rawD = resDests.body.data || resDests.body;
        allCities = Array.isArray(rawD) ? rawD.map(function (d) {
          var cName = d.city || d.city_name || d.name;
          return {
            id: d.id,
            city: cName,
            name: d.name,
            country: (d.country && d.country.name) || d.country_name || "Global Destination",
            latitude: Number(d.latitude) || 30.0444,
            longitude: Number(d.longitude) || 31.2357,
            image: resolveCityImage(d.image, cName)
          };
        }) : extractCitiesFromCountries(allCountries);
      } else {
        allCities = extractCitiesFromCountries(allCountries);
      }

      allCities = deduplicateCities(allCities);

      bindControls();
      render();
    }).catch(function () {
      if (loading) loading.classList.add("hidden");
      allCountries = FALLBACK_COUNTRIES;
      allCities = deduplicateCities(extractCitiesFromCountries(FALLBACK_COUNTRIES));
      bindControls();
      render();
    });
  }

  function deduplicateCities(list) {
    var seen = {};
    var unique = [];
    (list || []).forEach(function (ci) {
      var rawName = (ci.city || ci.name || "").trim();
      var key = rawName.toLowerCase();

      // Normalize common city titles (e.g. "Cairo Ancient Wonders" -> "cairo")
      if (key.indexOf("cairo") !== -1) key = "cairo";
      else if (key.indexOf("paris") !== -1) key = "paris";
      else if (key.indexOf("rome") !== -1) key = "rome";
      else if (key.indexOf("dubai") !== -1) key = "dubai";
      else if (key.indexOf("tokyo") !== -1) key = "tokyo";
      else if (key.indexOf("london") !== -1) key = "london";
      else if (key.indexOf("madrid") !== -1) key = "madrid";
      else if (key.indexOf("barcelona") !== -1) key = "barcelona";
      else if (key.indexOf("new york") !== -1) key = "new york";

      if (!seen[key]) {
        seen[key] = true;
        // Clean display city name
        if (key === "cairo") ci.city = "Cairo";
        else if (key === "paris") ci.city = "Paris";
        else if (key === "rome") ci.city = "Rome";
        else if (key === "dubai") ci.city = "Dubai";
        else if (key === "tokyo") ci.city = "Tokyo";
        else if (key === "london") ci.city = "London";
        else if (key === "madrid") ci.city = "Madrid";
        else if (key === "barcelona") ci.city = "Barcelona";
        else if (key === "new york") ci.city = "New York";

        unique.push(ci);
      }
    });
    return unique;
  }

  var CITY_IMAGES = {
    "Cairo": "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=800&q=80",
    "Alexandria": "https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=800&q=80",
    "Luxor": "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80",
    "Sharm El Sheikh": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80",
    "Paris": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80",
    "Nice": "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80",
    "Lyon": "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80",
    "Rome": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80",
    "Venice": "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=800&q=80",
    "Milan": "https://images.unsplash.com/photo-1513581166391-887a96ddeafd?auto=format&fit=crop&w=800&q=80",
    "Florence": "https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80",
    "Dubai": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80",
    "Abu Dhabi": "https://images.unsplash.com/photo-1512632578553-196a88798567?auto=format&fit=crop&w=800&q=80",
    "Tokyo": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80",
    "Kyoto": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
    "Osaka": "https://images.unsplash.com/photo-1590559899731-a382839e5549?auto=format&fit=crop&w=800&q=80",
    "London": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80",
    "Edinburgh": "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80",
    "Barcelona": "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80",
    "Madrid": "https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80",
    "Seville": "https://images.unsplash.com/photo-1561632669-6e0e567fbf70?auto=format&fit=crop&w=800&q=80",
    "New York": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80",
    "Los Angeles": "https://images.unsplash.com/photo-1580655653885-65763b2597d0?auto=format&fit=crop&w=800&q=80",
    "Miami": "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=800&q=80",
    "Athens": "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80",
    "Santorini": "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80",
    "Istanbul": "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80",
    "Cappadocia": "https://images.unsplash.com/photo-1609830537033-d8c9735d1f8f?auto=format&fit=crop&w=800&q=80",
    "Berlin": "https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=800&q=80",
    "Munich": "https://images.unsplash.com/photo-1595867818082-083862f3d630?auto=format&fit=crop&w=800&q=80",
    "Zurich": "https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&w=800&q=80",
    "Geneva": "https://images.unsplash.com/photo-1572978873099-b1d5d36e2f11?auto=format&fit=crop&w=800&q=80",
    "Amsterdam": "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=800&q=80",
    "Riyadh": "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?auto=format&fit=crop&w=800&q=80",
    "AlUla": "https://images.unsplash.com/photo-1616422285623-13ff0162193c?auto=format&fit=crop&w=800&q=80",
    "Marrakech": "https://images.unsplash.com/photo-1597212618440-806262de4f6b?auto=format&fit=crop&w=800&q=80",
    "Casablanca": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80",
    "Cape Town": "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80",
    "Bangkok": "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80",
    "Phuket": "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=800&q=80",
    "Singapore": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80",
    "Sydney": "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80",
    "Melbourne": "https://images.unsplash.com/photo-1514395462725-fb4566210144?auto=format&fit=crop&w=800&q=80",
    "Rio de Janeiro": "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=800&q=80"
  };

  function resolveCityImage(img, cityName) {
    if (img && (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("assets/"))) {
      return img;
    }
    var key = cityName || "";
    if (CITY_IMAGES[key]) return CITY_IMAGES[key];
    var lowerKey = key.toLowerCase();
    for (var k in CITY_IMAGES) {
      if (k.toLowerCase() === lowerKey) return CITY_IMAGES[k];
    }
    return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80";
  }

  function extractCitiesFromCountries(countries) {
    var cities = [];
    (countries || []).forEach(function (c) {
      (c.destinations || []).forEach(function (d) {
        var cName = d.city || d.name;
        cities.push({
          id: d.id,
          city: cName,
          name: d.name,
          country: c.name,
          latitude: Number(d.latitude) || 30.0444,
          longitude: Number(d.longitude) || 31.2357,
          image: resolveCityImage(d.image, cName)
        });
      });
    });
    return cities;
  }

  function bindControls() {
    var searchInput = el("global-country-search");
    if (searchInput) {
      searchInput.addEventListener("input", function (ev) {
        searchQuery = (ev.target.value || "").toLowerCase().trim();
        currentPage = 1;
        render();
      });
    }

    var tabCountries = el("tab-view-countries");
    var tabCities = el("tab-view-cities");

    if (tabCountries && tabCities) {
      tabCountries.addEventListener("click", function () {
        activeView = "countries";
        currentPage = 1;
        cardsPerPage = 20;
        tabCountries.className = "px-4 py-2 rounded-full text-xs font-bold transition bg-amber-400 text-black shadow-md";
        tabCities.className = "px-4 py-2 rounded-full text-xs font-semibold transition text-white/70 hover:text-white";
        render();
      });

      tabCities.addEventListener("click", function () {
        activeView = "cities";
        currentPage = 1;
        cardsPerPage = 20;
        tabCities.className = "px-4 py-2 rounded-full text-xs font-bold transition bg-amber-400 text-black shadow-md";
        tabCountries.className = "px-4 py-2 rounded-full text-xs font-semibold transition text-white/70 hover:text-white";
        render();
      });
    }

    document.querySelectorAll(".region-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        document.querySelectorAll(".region-chip").forEach(function (c) {
          c.className = "region-chip px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 font-bold text-xs transition shrink-0 cursor-pointer";
        });
        chip.className = "region-chip active px-4 py-2 rounded-full bg-amber-400 text-black font-extrabold text-xs transition shrink-0 cursor-pointer";
        activeRegion = chip.getAttribute("data-region") || "all";
        currentPage = 1;
        render();
      });
    });

    var resetBtn = el("reset-filters-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        searchQuery = "";
        activeRegion = "all";
        currentPage = 1;
        if (searchInput) searchInput.value = "";
        document.querySelectorAll(".region-chip").forEach(function (c, idx) {
          if (idx === 0) {
            c.className = "region-chip active px-4 py-2 rounded-full bg-amber-400 text-black font-extrabold text-xs transition shrink-0 cursor-pointer";
          } else {
            c.className = "region-chip px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 font-bold text-xs transition shrink-0 cursor-pointer";
          }
        });
        render();
      });
    }

    var modalClose = el("close-city-modal");
    if (modalClose) {
      modalClose.addEventListener("click", closeCityModal);
    }
  }

  function render() {
    var cContainer = el("countries-container");
    var ciContainer = el("cities-container");
    var emptyState = el("empty-state");
    var pagContainer = el("pagination-container");

    if (activeView === "countries") {
      if (ciContainer) ciContainer.classList.add("hidden");
      
      var filtered = allCountries.filter(function (c) {
        var matchSearch = !searchQuery || (c.name && c.name.toLowerCase().indexOf(searchQuery) !== -1) || (c.iso_code && c.iso_code.toLowerCase().indexOf(searchQuery) !== -1) || (c.capital && c.capital.toLowerCase().indexOf(searchQuery) !== -1);
        var matchRegion = true;
        if (activeRegion !== "all") {
          var cont = (c.continent || c.region || "").toLowerCase();
          if (activeRegion === "africa") matchRegion = cont.indexOf("africa") !== -1 || cont.indexOf("middle east") !== -1 || c.name === "Egypt" || c.name === "United Arab Emirates";
          else if (activeRegion === "europe") matchRegion = cont.indexOf("europe") !== -1 || c.name === "France" || c.name === "Italy" || c.name === "United Kingdom" || c.name === "Spain";
          else if (activeRegion === "asia") matchRegion = cont.indexOf("asia") !== -1 || c.name === "Japan";
          else if (activeRegion === "americas") matchRegion = cont.indexOf("america") !== -1 || c.name === "United States";
        }
        return matchSearch && matchRegion;
      });

      if (!filtered.length) {
        if (cContainer) cContainer.classList.add("hidden");
        if (pagContainer) pagContainer.classList.add("hidden");
        if (emptyState) emptyState.classList.remove("hidden");
        return;
      }

      if (emptyState) emptyState.classList.add("hidden");

      // Apply Pagination Slicing
      var totalItems = filtered.length;
      var totalPages = Math.ceil(totalItems / cardsPerPage);
      if (currentPage > totalPages) currentPage = totalPages;
      if (currentPage < 1) currentPage = 1;

      var startIndex = (currentPage - 1) * cardsPerPage;
      var paginated = filtered.slice(startIndex, startIndex + cardsPerPage);

      if (cContainer) {
        cContainer.classList.remove("hidden");
        cContainer.innerHTML = paginated.map(renderCountryCard).join("");
      }

      renderPagination(totalItems, totalPages);
    } else {
      if (cContainer) cContainer.classList.add("hidden");

      var filteredCities = allCities.filter(function (ci) {
        var matchSearch = !searchQuery || (ci.city && ci.city.toLowerCase().indexOf(searchQuery) !== -1) || (ci.name && ci.name.toLowerCase().indexOf(searchQuery) !== -1) || (ci.country && ci.country.toLowerCase().indexOf(searchQuery) !== -1);
        return matchSearch;
      });

      if (!filteredCities.length) {
        if (ciContainer) ciContainer.classList.add("hidden");
        if (pagContainer) pagContainer.classList.add("hidden");
        if (emptyState) emptyState.classList.remove("hidden");
        return;
      }

      if (emptyState) emptyState.classList.add("hidden");

      // Apply Pagination Slicing
      var totalItems = filteredCities.length;
      var totalPages = Math.ceil(totalItems / cardsPerPage);
      if (currentPage > totalPages) currentPage = totalPages;
      if (currentPage < 1) currentPage = 1;

      var startIndex = (currentPage - 1) * cardsPerPage;
      var paginatedCities = filteredCities.slice(startIndex, startIndex + cardsPerPage);

      if (ciContainer) {
        ciContainer.classList.remove("hidden");
        ciContainer.innerHTML = paginatedCities.map(renderCityCard).join("");
        
        ciContainer.querySelectorAll(".city-card").forEach(function (card) {
          card.addEventListener("click", function () {
            var cName = card.getAttribute("data-city");
            var coName = card.getAttribute("data-country");
            var lat = Number(card.getAttribute("data-lat"));
            var lng = Number(card.getAttribute("data-lng"));
            var destId = card.getAttribute("data-id");
            openCityModal(cName, coName, lat, lng, destId);
          });
        });
      }

      renderPagination(totalItems, totalPages);
    }
  }

  function renderPagination(totalItems, totalPages) {
    var pagContainer = el("pagination-container");
    var pagInfo = el("pagination-info");
    var pagBtns = el("pagination-buttons");

    if (!pagContainer || !pagInfo || !pagBtns) return;

    if (totalPages <= 1) {
      pagContainer.classList.add("hidden");
      return;
    }

    pagContainer.classList.remove("hidden");

    var startNum = (currentPage - 1) * cardsPerPage + 1;
    var endNum = Math.min(currentPage * cardsPerPage, totalItems);
    pagInfo.textContent = "Showing " + startNum + " to " + endNum + " of " + totalItems + " " + (activeView === "countries" ? "Nations" : "Cities");

    var btnsHtml = '';

    // Prev Button
    btnsHtml += '<button type="button" id="pag-prev" class="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 text-xs font-bold transition cursor-pointer ' + (currentPage === 1 ? 'opacity-40 pointer-events-none' : '') + '">' +
      '<i class="fas fa-chevron-left mr-1"></i> Prev' +
    '</button>';

    // Page Number Buttons
    for (var p = 1; p <= totalPages; p++) {
      if (p === currentPage) {
        btnsHtml += '<button type="button" class="w-8 h-8 rounded-full bg-amber-400 text-black font-black text-xs shadow-md cursor-default">' + p + '</button>';
      } else {
        btnsHtml += '<button type="button" class="pag-num-btn w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 font-bold text-xs transition cursor-pointer" data-page="' + p + '">' + p + '</button>';
      }
    }

    // Next Button
    btnsHtml += '<button type="button" id="pag-next" class="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 text-xs font-bold transition cursor-pointer ' + (currentPage === totalPages ? 'opacity-40 pointer-events-none' : '') + '">' +
      'Next <i class="fas fa-chevron-right ml-1"></i>' +
    '</button>';

    pagBtns.innerHTML = btnsHtml;

    // Wire events
    var prevBtn = el("pag-prev");
    if (prevBtn) {
      prevBtn.onclick = function () {
        if (currentPage > 1) {
          currentPage--;
          render();
          window.scrollTo({ top: 300, behavior: "smooth" });
        }
      };
    }

    var nextBtn = el("pag-next");
    if (nextBtn) {
      nextBtn.onclick = function () {
        if (currentPage < totalPages) {
          currentPage++;
          render();
          window.scrollTo({ top: 300, behavior: "smooth" });
        }
      };
    }

    pagBtns.querySelectorAll(".pag-num-btn").forEach(function (btn) {
      btn.onclick = function () {
        var pageNum = Number(btn.getAttribute("data-page"));
        if (pageNum && pageNum !== currentPage) {
          currentPage = pageNum;
          render();
          window.scrollTo({ top: 300, behavior: "smooth" });
        }
      };
    });
  }

  function renderCountryCard(c) {
    var flag = c.flag_url || ("https://flagcdn.com/w640/" + (c.iso_code ? c.iso_code.toLowerCase() : "un") + ".png");
    var dests = c.destinations || [];

    return '<div class="relative overflow-hidden rounded-3xl border border-white/15 hover:border-amber-400/60 shadow-2xl transition-all duration-500 group min-h-[340px] flex flex-col justify-between p-6 bg-[#0a0a0a] cursor-pointer">' +
      '<!-- Full Cover Flag Background with Dark Luxury Gradient Overlay -->' +
      '<div class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style="background-image: url(\'' + esc(flag) + '\');"></div>' +
      '<div class="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/85 to-[#0a0a0a]/50"></div>' +

      '<!-- Content Over Gradient Overlay -->' +
      '<div class="relative z-10 space-y-4">' +
        '<!-- Top Badges -->' +
        '<div class="flex items-center justify-between">' +
          '<span class="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-widest border border-amber-400/40 backdrop-blur-md shadow-md">' +
            esc(c.iso_code || "INT") +
          '</span>' +
          '<span class="px-3 py-1 rounded-full bg-black/60 text-white/90 text-[10px] font-extrabold uppercase tracking-wider border border-white/15 backdrop-blur-md">' +
            esc(c.continent || c.region || "Global Nation") +
          '</span>' +
        '</div>' +

        '<!-- Country Title & Capital -->' +
        '<div>' +
          '<h3 class="text-2xl font-black text-white group-hover:text-amber-400 transition-colors leading-tight drop-shadow-md">' +
            esc(c.name) +
          '</h3>' +
          '<p class="text-xs text-amber-300/90 font-bold mt-1.5 flex items-center gap-1.5">' +
            '<i class="fas fa-landmark text-amber-400 text-xs"></i> Capital: ' + esc(c.capital || "Primary Hub") +
          '</p>' +
        '</div>' +

        '<!-- Curated Cities Badges -->' +
        (dests.length ? '<div class="space-y-1.5 pt-2">' +
          '<span class="text-[10px] font-extrabold text-white/70 uppercase tracking-widest block">Top Curated Destinations</span>' +
          '<div class="flex items-center gap-1.5 flex-wrap">' +
            dests.slice(0, 3).map(function (d) {
              return '<span class="px-2.5 py-1 rounded-full bg-white/15 text-white font-bold text-[10px] backdrop-blur-md border border-white/20 shadow-sm"><i class="fas fa-location-dot mr-1 text-[9px] text-amber-400"></i>' + esc(d.city || d.name) + '</span>';
            }).join("") +
          '</div>' +
        '</div>' : '') +
      '</div>' +

      '<!-- Bottom Action Row -->' +
      '<div class="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between">' +
        '<span class="text-xs font-bold text-emerald-400 flex items-center gap-1.5"><i class="fas fa-earth-americas text-amber-400"></i> International Hub</span>' +
        '<a href="explore.html?search=' + encodeURIComponent(c.name) + '" class="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5">' +
          '<span>Explore</span> <i class="fas fa-arrow-right text-[10px]"></i>' +
        '</a>' +
      '</div>' +
    '</div>';
  }

  function renderCityCard(ci) {
    var cityImage = resolveCityImage(ci.image, ci.city || ci.name);

    return '<div class="relative overflow-hidden rounded-3xl border border-white/15 hover:border-amber-400/60 shadow-2xl transition-all duration-500 group min-h-[270px] flex flex-col justify-between p-5 bg-[#0a0a0a] cursor-pointer city-card space-y-4" data-id="' + ci.id + '" data-city="' + esc(ci.city) + '" data-country="' + esc(ci.country) + '" data-lat="' + ci.latitude + '" data-lng="' + ci.longitude + '">' +
      '<!-- Full Cover Image Background with Dark Luxury Gradient Overlay -->' +
      '<div class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style="background-image: url(\'' + esc(cityImage) + '\');"></div>' +
      '<div class="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/85 to-[#0a0a0a]/40"></div>' +

      '<!-- Content Over Dark Overlay -->' +
      '<div class="relative z-10 space-y-3">' +
        '<!-- Top Row: Country Badge & Rating -->' +
        '<div class="flex items-center justify-between">' +
          '<span class="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-widest border border-amber-400/40 backdrop-blur-md shadow-md">' +
            '<i class="fas fa-flag mr-1"></i>' + esc(ci.country) +
          '</span>' +
          '<span class="px-2.5 py-1 rounded-full bg-black/60 text-emerald-400 text-[10px] font-extrabold border border-white/15 backdrop-blur-md">' +
            '<i class="fas fa-star text-amber-400 mr-1 text-[9px]"></i>4.9' +
          '</span>' +
        '</div>' +

        '<!-- City Title & Details -->' +
        '<div>' +
          '<h4 class="text-xl font-black text-white group-hover:text-amber-400 transition-colors leading-tight drop-shadow-md">' +
            esc(ci.city) +
          '</h4>' +
          '<p class="text-xs text-white/70 font-semibold mt-1 truncate">' +
            esc(ci.name) +
          '</p>' +
        '</div>' +
      '</div>' +

      '<!-- Bottom Coordinates & Action Row -->' +
      '<div class="relative z-10 pt-3 border-t border-white/15 flex items-center justify-between">' +
        '<span class="text-[10px] font-bold text-emerald-400 flex items-center gap-1">' +
          '<i class="fas fa-satellite"></i> ' + (ci.latitude ? Number(ci.latitude).toFixed(2) + '° N, ' + Number(ci.longitude).toFixed(2) + '° E' : 'Live GPS') +
        '</span>' +
        '<span class="w-8 h-8 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center text-xs group-hover:bg-amber-400 group-hover:text-black transition shadow-lg">' +
          '<i class="fas fa-arrow-up-right-from-square"></i>' +
        '</span>' +
      '</div>' +
    '</div>';
  }

  function openCityModal(city, country, lat, lng, destId) {
    var modal = el("city-modal");
    if (!modal) return;

    el("modal-city-name").textContent = city || "Global City";
    el("modal-country-name").textContent = country || "Verified Destination";
    el("modal-city-lat").textContent = isFinite(lat) ? lat.toFixed(4) + "° N" : "—";
    el("modal-city-lng").textContent = isFinite(lng) ? lng.toFixed(4) + "° E" : "—";

    var expLink = el("modal-explore-link");
    if (expLink) {
      expLink.href = "explore.html?search=" + encodeURIComponent(city || country);
    }

    modal.classList.remove("hidden");

    // Render Leaflet City Map Preview
    setTimeout(function () {
      var mapContainer = el("city-map-container");
      if (!mapContainer) return;

      if (LEAFLET_CITY_MAP) {
        LEAFLET_CITY_MAP.remove();
        LEAFLET_CITY_MAP = null;
      }

      var defaultLat = isFinite(lat) ? lat : 30.0444;
      var defaultLng = isFinite(lng) ? lng : 31.2357;

      LEAFLET_CITY_MAP = L.map(mapContainer, {
        center: [defaultLat, defaultLng],
        zoom: 12,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19
      }).addTo(LEAFLET_CITY_MAP);

      L.circleMarker([defaultLat, defaultLng], {
        radius: 8,
        fillColor: "#fbbf24",
        color: "#ffffff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9
      }).addTo(LEAFLET_CITY_MAP);
    }, 100);
  }

  function closeCityModal() {
    var modal = el("city-modal");
    if (modal) modal.classList.add("hidden");
  }

  document.addEventListener("DOMContentLoaded", start);

})(typeof window !== "undefined" ? window : this);
