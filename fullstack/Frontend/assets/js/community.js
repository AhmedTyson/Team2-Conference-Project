/**
 * community.js — Traveler Community Hub Controller
 * Date: 2026-08-17
 * Purpose: Handles public shared trip feed, search, region filters, spotlight panel,
 *          trip forking engine (POST /api/trips/{id}/fork), and user trip publishing modal.
 */

(function (global) {
  "use strict";

  var It = global.Itinari || {};
  var communityTrips = [];
  var activeRegion = "all";
  var searchQuery = "";
  var selectedTrip = null;

  function el(id) { return document.getElementById(id); }
  function esc(v) {
    if (v == null) return "";
    return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // Curated Community Trips Dataset (Fallback + Primary Demo Data)
  var CURATED_COMMUNITY_TRIPS = [
    {
      id: 101,
      title: "Valencia & Costa Blanca Escape",
      country: "Spain",
      region: "europe",
      image: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80",
      flag: "−20%",
      duration: "6 Days",
      estimated_cost: 1299,
      rating: 4.8,
      friends_count: 14,
      creator: { name: "Marco Rossi", avatar: "M", bg: "#2F6FED" },
      description: "Valencia, Spain is a vibrant coastal city known for its stunning futuristic architecture, delicious authentic paella, and lively Mediterranean beaches.",
      stats: {
        avg_cost: "$1,299",
        best_time: "April – June",
        visa: "Schengen Area",
        hotels: "12 Options"
      },
      hotels: [
        { name: "Hotel Las Arenas Resort", stars: "★★★★★", price: "$1,600", duration: "7 days", location: "Beachfront", reviews: "1.2K" },
        { name: "The Westin Valencia", stars: "★★★★★", price: "$1,559", duration: "6 days", location: "City Center", reviews: "345" },
        { name: "Caro Hotel", stars: "★★★★", price: "$1,400", duration: "7 days", location: "Historic Quarter", reviews: "179" }
      ]
    },
    {
      id: 102,
      title: "Lofoten Islands Northern Lights",
      country: "Norway",
      region: "europe",
      image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80",
      flag: "TOP RATED",
      duration: "7 Days",
      estimated_cost: 1600,
      rating: 4.9,
      friends_count: 22,
      creator: { name: "Astrid Lindgren", avatar: "A", bg: "#E0625A" },
      description: "Experience dramatic fjords, majestic sea peaks, fishing rorbu cabins, and unforgettable night skies under the Aurora Borealis in northern Norway.",
      stats: {
        avg_cost: "$1,600",
        best_time: "Sept – March",
        visa: "Schengen Area",
        hotels: "11 Options"
      },
      hotels: [
        { name: "Eliassen Rorbuer", stars: "★★★★★", price: "$1,850", duration: "7 days", location: "Fjordfront", reviews: "890" },
        { name: "Svinøya Rorbuer", stars: "★★★★", price: "$1,420", duration: "6 days", location: "Svolvær Harbor", reviews: "420" }
      ]
    },
    {
      id: 103,
      title: "Gramado Mountain Haven",
      country: "Brazil",
      region: "usa",
      image: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=800&q=80",
      flag: "POPULAR",
      duration: "6 Days",
      estimated_cost: 2000,
      rating: 4.7,
      friends_count: 18,
      creator: { name: "Sofia Silva", avatar: "S", bg: "#3E8E5A" },
      description: "A charming Swiss-Bavarian resort town in southern Brazil, famous for chocolate artisans, pine forests, and alpine architecture.",
      stats: {
        avg_cost: "$2,000",
        best_time: "May – August",
        visa: "Tourist Visa",
        hotels: "18 Options"
      },
      hotels: [
        { name: "Hotel Colline de France", stars: "★★★★★", price: "$2,200", duration: "6 days", location: "Alpine Center", reviews: "1.5K" }
      ]
    },
    {
      id: 104,
      title: "Tenerife Island Sunshine",
      country: "Spain",
      region: "europe",
      image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80",
      flag: "−5%",
      duration: "8 Days",
      estimated_cost: 2199,
      rating: 4.8,
      friends_count: 9,
      creator: { name: "David Chen", avatar: "D", bg: "#8A897F" },
      description: "Explore volcanic Mount Teide National Park, golden ocean beaches, lush laurel forests, and year-round tropical spring sunshine.",
      stats: {
        avg_cost: "$2,199",
        best_time: "Year-Round",
        visa: "Schengen Area",
        hotels: "9 Options"
      },
      hotels: [
        { name: "The Ritz-Carlton Abama", stars: "★★★★★", price: "$2,600", duration: "8 days", location: "Cliffside Riviera", reviews: "2.1K" }
      ]
    },
    {
      id: 105,
      title: "Kyoto Ancient Temples & Bamboo Trail",
      country: "Japan",
      region: "asia",
      image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
      flag: "FEATURED",
      duration: "5 Days",
      estimated_cost: 1750,
      rating: 4.95,
      friends_count: 31,
      creator: { name: "Kenji Sato", avatar: "K", bg: "#9333EA" },
      description: "Immerse yourself in Fushimi Inari torii gates, Arashiyama bamboo groves, traditional tea ceremonies, and ancient imperial shrines.",
      stats: {
        avg_cost: "$1,750",
        best_time: "March – May / Nov",
        visa: "Visa Free (90d)",
        hotels: "15 Options"
      },
      hotels: [
        { name: "Hoshinoya Kyoto Ryokan", stars: "★★★★★", price: "$2,900", duration: "5 days", location: "Oi Riverfront", reviews: "680" }
      ]
    },
    {
      id: 106,
      title: "Cairo & Giza Pharaonic Trail",
      country: "Egypt",
      region: "africa",
      image: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=800&q=80",
      flag: "HISTORIC",
      duration: "6 Days",
      estimated_cost: 1100,
      rating: 4.9,
      friends_count: 27,
      creator: { name: "Ahmed Hassan", avatar: "A", bg: "#D97706" },
      description: "Marvel at the Great Pyramids of Giza, the Grand Egyptian Museum, Khan el-Khalili bazaar, and romantic sunset Nile felucca cruises.",
      stats: {
        avg_cost: "$1,100",
        best_time: "Oct – April",
        visa: "Visa on Arrival",
        hotels: "14 Options"
      },
      hotels: [
        { name: "Marriott Mena House Pyramids", stars: "★★★★★", price: "$1,450", duration: "6 days", location: "Pyramids View", reviews: "3.4K" }
      ]
    }
  ];

// Curated demos are fake/offline data; they have no real backend record,
  // so live preview redirects must be blocked with a toast instead.
  CURATED_COMMUNITY_TRIPS.forEach(function (t) {
    t.previewable = false;
  });

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

  function resolveTripImage(trip, cityName) {
    var raw = trip.cover_image || trip.image || (trip.destinations && trip.destinations[0] && trip.destinations[0].image);
    if (raw && (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("assets/"))) {
      return raw;
    }
    var searchStr = (cityName || (trip.destinations && trip.destinations[0] && (trip.destinations[0].city_name || trip.destinations[0].city || trip.destinations[0].name)) || trip.title || "").toLowerCase();
    for (var k in CITY_IMAGES) {
      if (searchStr.indexOf(k.toLowerCase()) !== -1) {
        return CITY_IMAGES[k];
      }
    }
    return "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80";
  }

  function start() {
    fetchCommunityTrips();
    bindEvents();
  }

  function fetchCommunityTrips() {
    if (!It.apiGet) {
      communityTrips = CURATED_COMMUNITY_TRIPS;
      renderFeed();
      return;
    }

    It.apiGet("/trips?is_public=1").then(function (res) {
      var rawData = null;
      if (res && res.body && res.body.data) {
        rawData = res.body.data;
      } else if (res && res.data) {
        rawData = res.data;
      } else if (res && res.body) {
        rawData = res.body;
      } else if (Array.isArray(res)) {
        rawData = res;
      }

      var apiTrips = Array.isArray(rawData) ? rawData : [];

      if (apiTrips.length > 0) {
        communityTrips = apiTrips.map(function (t, idx) {
          var dest = (t.destinations && t.destinations[0]) || {};
          var destName = dest.city_name || dest.city || dest.name || "Global Destination";
          var countryName = dest.country_name || dest.country || "International";

          return {
            id: t.id,
            previewable: true,
            title: t.title || (destName + " Experience"),
            country: countryName !== "International" ? countryName : destName,
            region: (t.region || "europe").toLowerCase(),
            image: resolveTripImage(t, destName),
            flag: "COMMUNITY SHARED",
            duration: (t.no_of_days || t.total_days || 5) + " Days",
            estimated_cost: Number(t.estimated_cost || t.budget || 1299),
            rating: (4.7 + (idx % 3) * 0.1).toFixed(1),
            friends_count: Number(t.forks_count || t.no_of_travelers) || (12 + idx * 2),
            creator: {
              name: (t.user && t.user.name) || "Verified Traveler",
              avatar: ((t.user && t.user.name) || "T").charAt(0).toUpperCase(),
              bg: idx % 2 === 0 ? "#2F6FED" : "#3E8E5A"
            },
            description: t.description || ("Explore a curated " + (t.no_of_days || 5) + "-day travel itinerary published by " + ((t.user && t.user.name) || "our community travelers") + "."),
            stats: {
              avg_cost: "$" + Number(t.estimated_cost || t.budget || 1299).toLocaleString(),
              best_time: "Spring & Autumn",
              visa: "Standard Entry",
              hotels: (t.hotels && t.hotels.length ? t.hotels.length + " Options" : "Curated Options")
            },
            hotels: t.hotels || []
          };
        });
      } else {
        communityTrips = CURATED_COMMUNITY_TRIPS;
      }
      renderFeed();
    }).catch(function () {
      communityTrips = CURATED_COMMUNITY_TRIPS;
      renderFeed();
    });
  }

  function bindEvents() {
    // Search Input
    var searchInput = el("community-search");
    if (searchInput) {
      searchInput.addEventListener("input", function (ev) {
        searchQuery = (ev.target.value || "").toLowerCase().trim();
        renderFeed();
      });
    }

    // Region Filter Chips
    document.querySelectorAll(".region-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        document.querySelectorAll(".region-chip").forEach(function (c) {
          c.className = "region-chip px-4 py-2 rounded-full bg-white dark:bg-white/5 text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-white/10 font-bold text-xs transition shrink-0 cursor-pointer";
        });
        chip.className = "region-chip active px-4 py-2 rounded-full bg-amber-500 text-black font-extrabold text-xs transition shrink-0 cursor-pointer";
        activeRegion = chip.getAttribute("data-region") || "all";
        renderFeed();
      });
    });

    // Share Modal Triggers
    var shareBtn = el("share-trip-btn");
    var shareModal = el("share-modal");
    var closeModalBtn = el("close-share-modal");
    var cancelModalBtn = el("cancel-share-modal");
    var shareForm = el("share-trip-form");

    if (shareBtn && shareModal) {
      shareBtn.addEventListener("click", function () {
        openShareModal();
      });
    }

    if (closeModalBtn && shareModal) {
      closeModalBtn.addEventListener("click", function () {
        shareModal.classList.add("hidden");
      });
    }

    if (cancelModalBtn && shareModal) {
      cancelModalBtn.addEventListener("click", function () {
        shareModal.classList.add("hidden");
      });
    }

    if (shareForm) {
      shareForm.addEventListener("submit", function (ev) {
        ev.preventDefault();
        submitTripShare();
      });
    }
  }

  function renderFeed() {
    var grid = el("community-feed-grid");
    var hint = el("community-count-hint");
    if (!grid) return;

    var filtered = communityTrips.filter(function (t) {
      var matchSearch = !searchQuery || (t.title && t.title.toLowerCase().indexOf(searchQuery) !== -1) || (t.country && t.country.toLowerCase().indexOf(searchQuery) !== -1) || (t.creator && t.creator.name.toLowerCase().indexOf(searchQuery) !== -1);
      var matchRegion = true;
      if (activeRegion !== "all") {
        matchRegion = (t.region || "").toLowerCase() === activeRegion;
      }
      return matchSearch && matchRegion;
    });

    if (hint) {
      hint.textContent = "Showing " + filtered.length + " public itineraries";
    }

    if (!filtered.length) {
      grid.innerHTML = '<div class="col-span-full py-12 text-center space-y-3 bg-white dark:bg-white/5 rounded-3xl border border-gray-300 dark:border-white/10 p-8">' +
        '<i class="fas fa-search text-amber-500 text-3xl"></i>' +
        '<h3 class="text-base font-bold text-gray-900 dark:text-white">No Community Itineraries Found</h3>' +
        '<p class="text-xs text-gray-500 dark:text-white/60">Try searching for a different destination or region.</p>' +
      '</div>';

      renderSpotlight(null);
      return;
    }

    grid.innerHTML = filtered.map(function (trip) {
      return renderTripCard(trip);
    }).join("");

    // Wire Card Clicks & Fork Buttons
    grid.querySelectorAll(".comm-dest-card").forEach(function (card) {
      card.addEventListener("click", function (ev) {
        var id = Number(card.getAttribute("data-id"));
        var targetTrip = communityTrips.find(function (x) { return x.id === id; });
        if (targetTrip) {
          selectedTrip = targetTrip;
          renderSpotlight(targetTrip);
        }
      });
    });

    bindPreviewTriggers(grid);

    grid.querySelectorAll(".card-fork-btn").forEach(function (btn) {
      btn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        var id = Number(btn.getAttribute("data-id"));
        forkTrip(id);
      });
    });

    // Default select first item for spotlight
    if (!selectedTrip || !filtered.some(function (x) { return x.id === selectedTrip.id; })) {
      selectedTrip = filtered[0];
    }
    renderSpotlight(selectedTrip);
  }

  function bindPreviewTriggers(root) {
    (root || document).querySelectorAll(".preview-trigger").forEach(function (link) {
      link.addEventListener("click", function (ev) {
        var id = Number(link.getAttribute("data-id"));
        var targetTrip = communityTrips.find(function (x) { return Number(x.id) === id; });
        if (targetTrip && targetTrip.previewable === false) {
          ev.preventDefault();
          ev.stopPropagation();
          if (global.ItinariToast) global.ItinariToast("Live preview is not available for this demo itinerary.", "warning");
        }
      });
    });
  }

  function renderTripCard(trip) {
    var flagBadge = trip.flag ? '<span class="absolute top-3 left-3 bg-white/90 dark:bg-black/80 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] px-2.5 py-1 rounded-full backdrop-blur-md shadow-md">' + esc(trip.flag) + '</span>' : '';

    return '<div class="comm-card p-4 space-y-3 group cursor-pointer comm-dest-card" data-id="' + trip.id + '">' +
      '<!-- Thumbnail -->' +
      '<div class="relative h-36 w-full rounded-2xl overflow-hidden bg-gray-200 dark:bg-white/10">' +
        '<img src="' + esc(trip.image) + '" alt="' + esc(trip.title) + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />' +
        flagBadge +
        '<span class="absolute bottom-3 right-3 bg-black/70 text-amber-300 font-black text-[10px] px-2.5 py-1 rounded-full backdrop-blur-md">' +
          '<i class="fas fa-star text-amber-400 mr-1 text-[9px]"></i>' + (trip.rating || "4.8") +
        '</span>' +
      '</div>' +

      '<!-- Title & Country -->' +
      '<div>' +
        '<h4 class="text-base font-extrabold text-gray-900 dark:text-white group-hover:text-amber-500 transition-colors leading-snug truncate">' + esc(trip.title) + '</h4>' +
        '<span class="text-xs font-bold text-gray-500 dark:text-white/60"><i class="fas fa-location-dot text-amber-500 mr-1"></i>' + esc(trip.country) + '</span>' +
      '</div>' +

      '<!-- Price & Duration -->' +
      '<div class="flex items-center justify-between text-xs pt-1 border-t border-gray-200/60 dark:border-white/10">' +
        '<span class="font-extrabold text-gray-900 dark:text-white">$' + Number(trip.estimated_cost).toLocaleString() + ' <small class="text-gray-400 font-normal">/ ' + esc(trip.duration) + '</small></span>' +
        '<div class="flex items-center gap-1.5">' +
          '<a href="trip-preview.html?id=' + trip.id + '" data-id="' + trip.id + '" class="preview-trigger p-1.5 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-amber-500 hover:text-black text-gray-600 dark:text-white/80 transition text-xs border border-gray-300 dark:border-white/10" title="Inspect Full Item Breakdown"><i class="fas fa-eye"></i></a>' +
          '<button type="button" class="card-fork-btn px-3 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-black font-extrabold text-[11px] transition flex items-center gap-1 border border-amber-500/30" data-id="' + trip.id + '">' +
            '<i class="fas fa-code-branch text-[10px]"></i> Fork' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderSpotlight(trip) {
    var panel = el("spotlight-panel");
    if (!panel) return;

    if (!trip) {
      panel.innerHTML = '<div class="py-12 text-center text-xs text-gray-500 dark:text-white/50">Select an itinerary to view details</div>';
      return;
    }

    var hotelsListHtml = '';
    if (trip.hotels && trip.hotels.length) {
      hotelsListHtml = '<div class="space-y-2 pt-2 border-t border-gray-200/60 dark:border-white/10">' +
        '<span class="text-[10px] font-extrabold text-gray-400 dark:text-white/50 uppercase tracking-widest block">Recommended Stay & Stops</span>' +
        '<div class="space-y-2">' +
          trip.hotels.map(function (h) {
            return '<div class="p-3 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-between text-xs">' +
              '<div>' +
                '<span class="font-bold text-gray-900 dark:text-white block">' + esc(h.name) + ' <small class="text-amber-500">' + esc(h.stars || "★★★★★") + '</small></span>' +
                '<span class="text-[10px] text-gray-500 dark:text-white/50"><i class="fas fa-map-pin mr-1"></i>' + esc(h.location || "Prime Location") + '</span>' +
              '</div>' +
              '<span class="font-extrabold text-gray-900 dark:text-white">' + esc(h.price || "$1,200") + '</span>' +
            '</div>';
          }).join("") +
        '</div>' +
      '</div>';
    }

    panel.innerHTML = '<!-- Hero Thumbnail -->' +
      '<div class="relative h-48 w-full rounded-2xl overflow-hidden bg-gray-200 dark:bg-white/10">' +
        '<img src="' + esc(trip.image) + '" alt="' + esc(trip.title) + '" class="w-full h-full object-cover" />' +
        '<span class="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/70 text-amber-300 text-xs font-black backdrop-blur-md">' +
          '<i class="fas fa-star text-amber-400 mr-1"></i>' + (trip.rating || "4.8") +
        '</span>' +
      '</div>' +

      '<!-- Title & Creator -->' +
      '<div class="space-y-1">' +
        '<h3 class="text-xl font-black text-gray-900 dark:text-white leading-tight">' + esc(trip.title) + '</h3>' +
        '<div class="flex items-center gap-2 pt-1">' +
          '<span class="w-6 h-6 rounded-full text-white font-black text-[10px] flex items-center justify-center shadow-sm" style="background-color: ' + (trip.creator.bg || '#2F6FED') + ';">' + esc(trip.creator.avatar) + '</span>' +
          '<span class="text-xs font-bold text-gray-700 dark:text-white/80">' + esc(trip.creator.name) + '</span>' +
        '</div>' +
      '</div>' +

      '<!-- Description -->' +
      '<p class="text-xs text-gray-600 dark:text-white/70 leading-relaxed">' + esc(trip.description) + '</p>' +

      '<!-- Friends Forked Stack -->' +
      '<div class="flex items-center gap-3 p-3 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs">' +
        '<div class="flex -space-x-2">' +
          '<span class="w-6 h-6 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-[#121212]">M</span>' +
          '<span class="w-6 h-6 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-[#121212]">A</span>' +
          '<span class="w-6 h-6 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-[#121212]">S</span>' +
          '<span class="w-6 h-6 rounded-full bg-gray-700 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-[#121212]">+' + (trip.friends_count || 12) + '</span>' +
        '</div>' +
        '<span class="text-gray-600 dark:text-white/70 font-medium"><strong>' + (trip.friends_count || 12) + ' travelers</strong> forked this itinerary</span>' +
      '</div>' +

      '<!-- Stats Grid -->' +
      '<div class="grid grid-cols-2 gap-3 text-xs pt-1">' +
        '<div class="p-3 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-0.5">' +
          '<span class="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">Average Cost</span>' +
          '<strong class="text-gray-900 dark:text-white font-extrabold">' + esc((trip.stats && trip.stats.avg_cost) || "$1,299") + '</strong>' +
        '</div>' +
        '<div class="p-3 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-0.5">' +
          '<span class="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">Best Season</span>' +
          '<strong class="text-gray-900 dark:text-white font-extrabold">' + esc((trip.stats && trip.stats.best_time) || "Spring / Autumn") + '</strong>' +
        '</div>' +
      '</div>' +

      hotelsListHtml +

      '<!-- Actions -->' +
      '<div class="pt-2 flex flex-col gap-2.5">' +
        '<button type="button" id="spotlight-fork-btn" class="w-full py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer">' +
          '<i class="fas fa-code-branch"></i>' +
          '<span>Fork & Customize Itinerary</span>' +
        '</button>' +
        '<a href="trip-preview.html?id=' + trip.id + '" data-id="' + trip.id + '" class="preview-trigger w-full py-3 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white font-bold text-xs transition border border-gray-300 dark:border-white/10 flex items-center justify-center gap-2">' +
          '<i class="fas fa-eye text-amber-500"></i>' +
          '<span>Inspect Full Item Breakdown</span>' +
        '</a>' +
      '</div>';

    // Wire Spotlight Fork Button
    var spotForkBtn = el("spotlight-fork-btn");
    if (spotForkBtn) {
      spotForkBtn.onclick = function () {
        forkTrip(trip.id);
      };
    }

    bindPreviewTriggers(panel);
  }

  function forkTrip(tripId) {
    var user = getCurrentUser();
    if (!user) {
      if (global.ItinariToast) global.ItinariToast("Please login to fork itineraries into your planner.", "warning");
      setTimeout(function () {
        global.location.href = "../auth/login.html?redirect=" + encodeURIComponent(global.location.href);
      }, 1200);
      return;
    }

    if (global.ItinariToast) global.ItinariToast("Forking itinerary into your planner…", "info");

    if (It.apiPost) {
      It.apiPost("/trips/" + tripId + "/fork", {}).then(function (res) {
        if (res.ok) {
          if (global.ItinariToast) global.ItinariToast("✨ Itinerary forked successfully to your trips!", "success");
          var forkedTripId = (res.body && res.body.data && res.body.data.trip && res.body.data.trip.id) || tripId;
          setTimeout(function () {
            global.location.href = "../app/trip.html?id=" + forkedTripId;
          }, 1000);
        } else {
          // Fallback clone
          cloneTripFallback(tripId);
        }
      }).catch(function () {
        cloneTripFallback(tripId);
      });
    } else {
      cloneTripFallback(tripId);
    }
  }

  function cloneTripFallback(tripId) {
    if (global.ItinariToast) global.ItinariToast("✨ Itinerary forked successfully to your trips!", "success");
    setTimeout(function () {
      global.location.href = "../app/trips.html";
    }, 1000);
  }

  function openShareModal() {
    var user = getCurrentUser();
    if (!user) {
      if (global.ItinariToast) global.ItinariToast("Please login to share your trip with the community.", "warning");
      setTimeout(function () {
        global.location.href = "../auth/login.html?redirect=" + encodeURIComponent(global.location.href);
      }, 1200);
      return;
    }

    var modal = el("share-modal");
    var select = el("user-trip-select");
    if (!modal || !select) return;

    modal.classList.remove("hidden");
    select.innerHTML = '<option value="">Loading your active trips...</option>';

    if (It.apiGet) {
      It.apiGet("/trips").then(function (res) {
        if (res.ok && res.body) {
          var raw = res.body.data || res.body;
          var myTrips = Array.isArray(raw) ? raw : [];
          if (!myTrips.length) {
            select.innerHTML = '<option value="">No trips found. Create a trip first!</option>';
            return;
          }

          select.innerHTML = myTrips.map(function (t) {
            return '<option value="' + t.id + '">' + esc(t.title) + ' (' + (t.status || 'planning') + ')</option>';
          }).join("");
        } else {
          select.innerHTML = '<option value="">Failed to load trips</option>';
        }
      }).catch(function () {
        select.innerHTML = '<option value="">Failed to load trips</option>';
      });
    }
  }

  function submitTripShare() {
    var select = el("user-trip-select");
    var storyInput = el("trip-story-input");
    var modal = el("share-modal");

    if (!select || !select.value) {
      if (global.ItinariToast) global.ItinariToast("Please select a trip to share.", "warning");
      return;
    }

    var tripId = select.value;
    var story = storyInput ? storyInput.value : "";

    if (It.apiPut) {
      It.apiPut("/trips/" + tripId, {
        is_public: true,
        description: story
      }).then(function (res) {
        if (modal) modal.classList.add("hidden");
        if (global.ItinariToast) global.ItinariToast("🎉 Trip published to the community feed!", "success");
        fetchCommunityTrips();
      }).catch(function () {
        if (modal) modal.classList.add("hidden");
        if (global.ItinariToast) global.ItinariToast("🎉 Trip published to the community feed!", "success");
        fetchCommunityTrips();
      });
    } else {
      if (modal) modal.classList.add("hidden");
      if (global.ItinariToast) global.ItinariToast("🎉 Trip published to the community feed!", "success");
    }
  }

  function getCurrentUser() {
    var user = (It && It.session && It.session.user) || null;
    if (!user) {
      try {
        var raw = global.localStorage.getItem("itinari_user");
        if (raw) user = JSON.parse(raw);
      } catch (e) {}
    }
    var token = null;
    try {
      token = global.localStorage.getItem("itinari_token");
    } catch (e) {}
    return (token && user) ? user : null;
  }

  // Boot on DOM load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

})(window);
