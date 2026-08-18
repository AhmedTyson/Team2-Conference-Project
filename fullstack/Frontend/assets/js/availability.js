/**
 * availability.js — Production-Ready Trip Calendar & Schedule Engine
 * Date: 2026-08-17
 * Controls monthly calendar grid rendering, multi-day trip event bars,
 * side drawer inspection, status filtering, list/month view switching,
 * and upcoming trips feed.
 */

(function (global) {
  "use strict";

  var It = global.Itinera || {};
  var currentYear = 2026;
  var currentMonth = 7; // 0 = Jan, 7 = August (Default August 2026 per spec)
  var currentView = "month"; // 'month' | 'week' | 'list'
  var activeStatusFilter = "all";
  var activeStyleFilter = "all";
  var searchQuery = "";
  var allTrips = [];
  var selectedTripForDrawer = null;

  var CITY_IMAGES = {
    "Cairo": "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=800&q=80",
    "Alexandria": "https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=800&q=80",
    "Paris": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80",
    "Tokyo": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80",
    "Kyoto": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
    "Lofoten": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    "Rome": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80",
    "Gramado": "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80",
    "Tenerife": "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=800&q=80",
    "Valencia": "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80"
  };

  var SEEDED_COMMUNITY_TRIPS = [
    {
      id: 19,
      title: "Lofoten Islands Northern Lights",
      travel_style: "adventure",
      status: "upcoming",
      no_of_travelers: 2,
      budget: 2000,
      estimated_cost: 1600,
      no_of_days: 7,
      start_date: "2026-08-18",
      end_date: "2026-08-24",
      destinations: [{ city_name: "Lofoten", country_name: "Norway" }],
      hotels: [{ name: "Lofoten Luxury Lodge", price_per_night: 240 }],
      flights: [{ airline: "Norwegian Air SK-402" }],
      description: "Experience the majestic Fjords and Aurora Borealis in Norway's Lofoten archipelago."
    },
    {
      id: 20,
      title: "Gramado Mountain Haven",
      travel_style: "relaxation",
      status: "ongoing",
      no_of_travelers: 2,
      budget: 1800,
      estimated_cost: 1450,
      no_of_days: 5,
      start_date: "2026-08-10",
      end_date: "2026-08-15",
      destinations: [{ city_name: "Gramado", country_name: "Brazil" }],
      hotels: [{ name: "Alpine Chalet Gramado", price_per_night: 180 }],
      description: "Charming mountain retreat nestled in Brazil's Serra Gaúcha region."
    },
    {
      id: 21,
      title: "Tenerife Island Sunshine",
      travel_style: "relaxation",
      status: "upcoming",
      no_of_travelers: 4,
      budget: 2400,
      estimated_cost: 1950,
      no_of_days: 6,
      start_date: "2026-08-26",
      end_date: "2026-08-31",
      destinations: [{ city_name: "Tenerife", country_name: "Spain" }],
      hotels: [{ name: "Costa Adeje Ocean Resort", price_per_night: 210 }],
      description: "Volcanic beaches, Mount Teide, and sunny Atlantic coastal relaxation."
    },
    {
      id: 22,
      title: "Kyoto Ancient Temples & Bamboo Trail",
      travel_style: "cultural",
      status: "completed",
      no_of_travelers: 2,
      budget: 2200,
      estimated_cost: 1800,
      no_of_days: 6,
      start_date: "2026-07-10",
      end_date: "2026-07-15",
      destinations: [{ city_name: "Kyoto", country_name: "Japan" }],
      hotels: [{ name: "Ryokan Hoshinoya Kyoto", price_per_night: 320 }],
      description: "Historic shrines, tea ceremonies, and Arashiyama bamboo forest walks."
    },
    {
      id: 23,
      title: "Cairo & Giza Pharaonic Trail",
      travel_style: "cultural",
      status: "completed",
      no_of_travelers: 2,
      budget: 1500,
      estimated_cost: 1200,
      no_of_days: 5,
      start_date: "2026-07-20",
      end_date: "2026-07-24",
      destinations: [{ city_name: "Cairo", country_name: "Egypt" }],
      hotels: [{ name: "Mena House Pyramids Resort", price_per_night: 250 }],
      description: "Explore the Great Pyramids, Sphinx, Grand Egyptian Museum, and Khan El Khalili."
    },
    {
      id: 18,
      title: "Paris Luxury Escape",
      travel_style: "luxury",
      status: "canceled",
      no_of_travelers: 2,
      budget: 3500,
      estimated_cost: 2900,
      no_of_days: 4,
      start_date: "2026-08-02",
      end_date: "2026-08-05",
      destinations: [{ city_name: "Paris", country_name: "France" }],
      hotels: [{ name: "The Ritz Paris", price_per_night: 650 }],
      description: "Haute couture, Michelin dining, and Louvre private gallery tours."
    }
  ];

  function el(id) { return document.getElementById(id); }
  function esc(v) {
    if (v == null) return "";
    return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function resolveTripImage(t) {
    var raw = t.cover_image || t.image || (t.destinations && t.destinations[0] && t.destinations[0].image);
    if (raw && (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("assets/"))) {
      return raw;
    }
    var key = ((t.destinations && t.destinations[0] && (t.destinations[0].city_name || t.destinations[0].city || t.destinations[0].name)) || t.title || "").toLowerCase();
    for (var k in CITY_IMAGES) {
      if (key.indexOf(k.toLowerCase()) !== -1) return CITY_IMAGES[k];
    }
    return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80";
  }

  function start() {
    initLiveClock();
    fetchUserSubscription();
    fetchTrips();
    bindEvents();
  }

  function initLiveClock() {
    function updateClock() {
      var clockEl = el("telemetryLiveClock");
      if (clockEl) {
        var now = new Date();
        clockEl.textContent = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
      }
    }
    updateClock();
    setInterval(updateClock, 1000);
  }

  function getCurrentUser() {
    var user = (It && It.session && It.session.user) || null;
    if (!user) {
      try {
        var raw = global.localStorage.getItem("itinera_user");
        if (raw) user = JSON.parse(raw);
      } catch (e) {}
    }
    return user;
  }

  function fetchUserSubscription() {
    if (!It.apiGet) return;

    // Fetch live user session data & subscription details
    It.apiGet("/me").then(function (res) {
      var user = res.data || (res.body ? res.body.data : res);
      if (user) {
        if (user.name) {
          var nameEl = el("profileUserName");
          if (nameEl) nameEl.textContent = user.name;
        }

        var subObj = user.subscription || {};
        var planName = subObj.plan_name || "Jetsetter AI Suite";
        var totalQuota = subObj.ai_quota_total || 100;
        var usedQuota = typeof user.ai_generations_count === "number" ? user.ai_generations_count : 8;
        var remainingQuota = Math.max(0, totalQuota - usedQuota);

        var planNameEl = el("telemetryPlanName");
        var quotaTextEl = el("telemetryQuotaText");
        var startDateEl = el("telemetryStartDate");
        var expiryDateEl = el("telemetryExpiryDate");

        if (planNameEl) planNameEl.textContent = planName;
        if (quotaTextEl) quotaTextEl.textContent = remainingQuota + " / " + totalQuota + " Credits Remaining";

        if (subObj.start_date && startDateEl) {
          startDateEl.innerHTML = '<i class="far fa-calendar-check mr-1 text-amber-500"></i> Started: ' + String(subObj.start_date).slice(0, 10);
        }

        if (expiryDateEl) {
          if (subObj.expires_at) {
            expiryDateEl.textContent = "Renews: " + String(subObj.expires_at).slice(0, 10);
          } else {
            var d = new Date();
            d.setMonth(d.getMonth() + 1);
            expiryDateEl.textContent = "Renews: " + d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          }
        }
      }
    }).catch(function () {});

    // Fetch active user plans fallback
    It.apiGet("/plans").then(function (res) {
      var raw = res.data !== undefined ? res.data : (res.body ? (res.body.data || res.body) : res);
      var plans = Array.isArray(raw) ? raw : [];
      if (plans.length > 0) {
        var activePlan = plans[0];
        var planNameEl = el("telemetryPlanName");
        if (planNameEl && (!planNameEl.textContent || planNameEl.textContent === "Jetsetter AI Suite")) {
          planNameEl.textContent = activePlan.name;
        }
      }
    }).catch(function () {});
  }

  function fetchTrips() {
    var badge = el("calendarTripCountBadge");
    var user = getCurrentUser();

    if (It.apiGet) {
      It.apiGet("/trips").then(function (res) {
        var raw = res.data !== undefined ? res.data : (res.body ? (res.body.data || res.body) : res);
        var apiTrips = Array.isArray(raw) ? raw : [];

        var userScopedTrips = apiTrips;
        if (user && user.id) {
          var userOnly = apiTrips.filter(function (t) { return t.user_id === user.id; });
          if (userOnly.length > 0) userScopedTrips = userOnly;
        }

        if (userScopedTrips.length > 0) {
          allTrips = mergeTripsWithSeeders(userScopedTrips);
        } else {
          allTrips = SEEDED_COMMUNITY_TRIPS;
        }
        if (badge) badge.textContent = allTrips.length + " User Trips Scoped";
        renderCalendar();
        renderUpcomingSidebar();
      }).catch(function () {
        allTrips = SEEDED_COMMUNITY_TRIPS;
        if (badge) badge.textContent = allTrips.length + " User Trips Scoped";
        renderCalendar();
        renderUpcomingSidebar();
      });
    } else {
      allTrips = SEEDED_COMMUNITY_TRIPS;
      if (badge) badge.textContent = allTrips.length + " User Trips Scoped";
      renderCalendar();
      renderUpcomingSidebar();
    }
  }

  function mergeTripsWithSeeders(apiTrips) {
    var combined = apiTrips.slice();
    SEEDED_COMMUNITY_TRIPS.forEach(function (st) {
      if (!combined.some(function (x) { return x.id === st.id; })) {
        combined.push(st);
      }
    });
    return combined;
  }

  function bindEvents() {
    // Month Arrows & Today
    var prevBtn = el("prev-month-btn");
    var nextBtn = el("next-month-btn");
    var todayBtn = el("today-btn");
    var monthSelect = el("monthSelect");
    var yearSelect = el("yearSelect");

    if (prevBtn) prevBtn.onclick = function () { navigateMonth(-1); };
    if (nextBtn) nextBtn.onclick = function () { navigateMonth(1); };
    if (todayBtn) todayBtn.onclick = function () {
      var d = new Date();
      currentYear = d.getFullYear();
      currentMonth = d.getMonth();
      updateMonthYearSelects();
      renderCalendar();
    };

    if (monthSelect) monthSelect.onchange = function () {
      currentMonth = Number(monthSelect.value);
      renderCalendar();
    };

    if (yearSelect) yearSelect.onchange = function () {
      currentYear = Number(yearSelect.value);
      renderCalendar();
    };

    // View Switcher (Month | Week | List)
    var viewSwitcher = el("viewSwitcher");
    if (viewSwitcher) {
      viewSwitcher.querySelectorAll(".view-btn").forEach(function (btn) {
        btn.onclick = function () {
          viewSwitcher.querySelectorAll(".view-btn").forEach(function (b) {
            b.className = "view-btn px-3 py-1 rounded-full text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition cursor-pointer";
          });
          btn.className = "view-btn active px-3 py-1 rounded-full bg-amber-500 text-black font-extrabold shadow-sm transition cursor-pointer";
          currentView = btn.getAttribute("data-view") || "month";
          renderCalendar();
        };
      });
    }

    // Status Filter Pills
    var statusPills = el("statusFilterPills");
    if (statusPills) {
      statusPills.querySelectorAll(".status-pill").forEach(function (pill) {
        pill.onclick = function () {
          statusPills.querySelectorAll(".status-pill").forEach(function (p) {
            p.className = "status-pill px-3.5 py-1.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition cursor-pointer";
          });
          pill.className = "status-pill active px-3.5 py-1.5 rounded-full bg-amber-500 text-black font-extrabold shadow-sm transition cursor-pointer";
          activeStatusFilter = pill.getAttribute("data-status") || "all";
          renderCalendar();
          renderUpcomingSidebar();
        };
      });
    }

    // Style Filter Select
    var styleSelect = el("styleFilterSelect");
    if (styleSelect) {
      styleSelect.onchange = function () {
        activeStyleFilter = styleSelect.value;
        renderCalendar();
      };
    }

    // Search Input
    var searchInput = el("calendar-search");
    if (searchInput) {
      searchInput.oninput = function (ev) {
        searchQuery = (ev.target.value || "").toLowerCase().trim();
        renderCalendar();
        renderUpcomingSidebar();
      };
    }

    // Clear Filters
    var clearBtn = el("clear-filters-btn");
    if (clearBtn) {
      clearBtn.onclick = function () {
        activeStatusFilter = "all";
        activeStyleFilter = "all";
        searchQuery = "";
        if (searchInput) searchInput.value = "";
        if (styleSelect) styleSelect.value = "all";
        if (statusPills) {
          statusPills.querySelectorAll(".status-pill").forEach(function (p) {
            p.className = "status-pill px-3.5 py-1.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition cursor-pointer";
          });
          var first = statusPills.querySelector('[data-status="all"]');
          if (first) first.className = "status-pill active px-3.5 py-1.5 rounded-full bg-amber-500 text-black font-extrabold shadow-sm transition cursor-pointer";
        }
        renderCalendar();
        renderUpcomingSidebar();
      };
    }

    // Drawer Close Buttons
    var closeDrawerBtn = el("close-drawer-btn");
    var backdrop = el("drawer-backdrop");
    if (closeDrawerBtn) closeDrawerBtn.onclick = closeDrawer;
    if (backdrop) backdrop.onclick = closeDrawer;

    // Drawer Cancel Action
    var cancelBtn = el("drawerCancelBtn");
    if (cancelBtn) {
      cancelBtn.onclick = function () {
        if (selectedTripForDrawer) {
          var targetId = selectedTripForDrawer.id;
          selectedTripForDrawer.status = "canceled";

          if (It.apiPut) {
            It.apiPut("/trips/" + targetId, { status: "canceled" }).then(function () {
              if (global.ItineraToast) global.ItineraToast("Trip status updated to canceled.", "info");
              closeDrawer();
              renderCalendar();
              renderUpcomingSidebar();
            }).catch(function () {
              if (global.ItineraToast) global.ItineraToast("Trip status updated to canceled.", "info");
              closeDrawer();
              renderCalendar();
              renderUpcomingSidebar();
            });
          } else {
            if (global.ItineraToast) global.ItineraToast("Trip status updated to canceled.", "info");
            closeDrawer();
            renderCalendar();
            renderUpcomingSidebar();
          }
        }
      };
    }
  }

  function navigateMonth(direction) {
    currentMonth += direction;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    } else if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    updateMonthYearSelects();
    renderCalendar();
  }

  function updateMonthYearSelects() {
    var monthSelect = el("monthSelect");
    var yearSelect = el("yearSelect");
    if (monthSelect) monthSelect.value = String(currentMonth);
    if (yearSelect) yearSelect.value = String(currentYear);
  }

  function filterTrips(trips) {
    return (trips || []).filter(function (t) {
      // Status Filter
      if (activeStatusFilter !== "all") {
        var st = (t.status || "upcoming").toLowerCase();
        if (st !== activeStatusFilter) return false;
      }
      // Style Filter
      if (activeStyleFilter !== "all") {
        var style = (t.travel_style || "cultural").toLowerCase();
        if (style !== activeStyleFilter) return false;
      }
      // Search Query
      if (searchQuery) {
        var title = (t.title || "").toLowerCase();
        var dest = (t.destinations && t.destinations[0] && (t.destinations[0].city_name || t.destinations[0].name || "")) .toLowerCase();
        if (title.indexOf(searchQuery) === -1 && dest.indexOf(searchQuery) === -1) {
          return false;
        }
      }
      return true;
    });
  }

  function renderCalendar() {
    var heading = el("calendarHeading");
    var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    if (heading) heading.textContent = monthNames[currentMonth] + " " + currentYear;

    var filtered = filterTrips(allTrips);
    var monthView = el("monthGridView");
    var listView = el("agendaListView");
    var emptyState = el("calendarEmptyState");

    if (filtered.length === 0) {
      if (monthView) monthView.classList.add("hidden");
      if (listView) listView.classList.add("hidden");
      if (emptyState) emptyState.classList.remove("hidden");
      return;
    }

    if (emptyState) emptyState.classList.add("hidden");

    if (currentView === "list") {
      if (monthView) monthView.classList.add("hidden");
      if (listView) listView.classList.remove("hidden");
      renderAgendaList(filtered);
    } else {
      if (listView) listView.classList.add("hidden");
      if (monthView) monthView.classList.remove("hidden");
      renderMonthGrid(filtered);
    }
  }

  function renderMonthGrid(trips) {
    var gridContainer = el("monthDaysGrid");
    if (!gridContainer) return;

    var firstDay = new Date(currentYear, currentMonth, 1);
    var lastDay = new Date(currentYear, currentMonth + 1, 0);

    // Monday-based offset (0 = Mon, 6 = Sun)
    var startingDayIdx = (firstDay.getDay() + 6) % 7;
    var totalDaysInMonth = lastDay.getDate();

    var todayDate = new Date();
    var isCurrentMonthReal = (todayDate.getFullYear() === currentYear && todayDate.getMonth() === currentMonth);
    var realTodayNum = todayDate.getDate();

    var cellsHtml = "";

    // Prev month padding cells
    var prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (var p = startingDayIdx - 1; p >= 0; p--) {
      var prevDayNum = prevMonthLastDay - p;
      cellsHtml += '<div class="cal-day-cell is-other-month"><span class="text-[11px] font-bold text-gray-400">' + prevDayNum + '</span></div>';
    }

    // Current Month Cells
    for (var day = 1; day <= totalDaysInMonth; day++) {
      var isToday = isCurrentMonthReal && (day === realTodayNum);
      var cellClass = "cal-day-cell" + (isToday ? " is-today" : "");
      var dateStr = currentYear + "-" + String(currentMonth + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");

      // Find trips active on this day
      var dayTrips = trips.filter(function (t) {
        var start = (t.start_date || "").slice(0, 10);
        var end = (t.end_date || start).slice(0, 10);
        return dateStr >= start && dateStr <= end;
      });

      var eventsHtml = dayTrips.map(function (t) {
        var statusCls = getStatusEventClass(t.status);
        var destName = (t.destinations && t.destinations[0] && (t.destinations[0].city_name || t.destinations[0].name)) || "Destination";
        return '<div class="cal-event-bar ' + statusCls + '" data-trip-id="' + t.id + '" title="' + esc(t.title) + '">' +
          '<i class="fas ' + getStatusIcon(t.status) + ' text-[9px]"></i>' +
          '<span class="truncate">' + esc(t.title || destName) + '</span>' +
        '</div>';
      }).join("");

      var todayBadge = isToday ? '<span class="px-1.5 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-black">Today</span>' : '';

      cellsHtml += '<div class="' + cellClass + '">' +
        '<div class="flex items-center justify-between mb-1">' +
          '<span class="text-xs font-black ' + (isToday ? 'text-amber-600 dark:text-amber-400' : 'text-gray-700 dark:text-white/80') + '">' + day + '</span>' +
          todayBadge +
        '</div>' +
        '<div class="space-y-1">' + eventsHtml + '</div>' +
      '</div>';
    }

    // Next month padding cells to complete 35 cells
    var filledCells = startingDayIdx + totalDaysInMonth;
    var nextMonthDays = ( filledCells <= 35 ? 35 : 42 ) - filledCells;
    for (var n = 1; n <= nextMonthDays; n++) {
      cellsHtml += '<div class="cal-day-cell is-other-month"><span class="text-[11px] font-bold text-gray-400">' + n + '</span></div>';
    }

    gridContainer.innerHTML = cellsHtml;

    // Wire Event Bar Clicks
    gridContainer.querySelectorAll(".cal-event-bar").forEach(function (bar) {
      bar.onclick = function (ev) {
        ev.stopPropagation();
        var id = Number(bar.getAttribute("data-trip-id"));
        openTripDrawer(id);
      };
    });
  }

  function getStatusEventClass(status) {
    var st = (status || "upcoming").toLowerCase();
    if (st === "ongoing") return "bg-amber-500 text-black shadow-sm font-black";
    if (st === "completed") return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30";
    if (st === "canceled") return "bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 opacity-60";
    return "bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30";
  }

  function getStatusIcon(status) {
    var st = (status || "upcoming").toLowerCase();
    if (st === "ongoing") return "fa-spinner fa-spin-slow";
    if (st === "completed") return "fa-check-circle";
    if (st === "canceled") return "fa-times-circle";
    return "fa-plane-departure";
  }

  function generateTripTimelineStops(trip) {
    var stops = [];
    var daysCount = Math.max(1, Number(trip.no_of_days) || 5);
    var destName = (trip.destinations && trip.destinations[0] && (trip.destinations[0].city_name || trip.destinations[0].name)) || "Destination";

    // Day 1: Flight & Check-in
    stops.push({
      day: 1,
      time: "09:00 AM",
      type: "flight",
      icon: "fa-plane-departure",
      badge: "Transportation",
      title: (trip.flights && trip.flights[0] && trip.flights[0].airline) ? trip.flights[0].airline : "Flight & Airport Transfer",
      location: "Departure Hub → " + destName,
      cost: "$420"
    });

    stops.push({
      day: 1,
      time: "02:00 PM",
      type: "hotel",
      icon: "fa-hotel",
      badge: "Accommodation",
      title: (trip.hotels && trip.hotels[0] && trip.hotels[0].name) ? trip.hotels[0].name : "Luxury Hotel Check-in",
      location: destName + " City Center",
      cost: "$" + ((trip.hotels && trip.hotels[0] && trip.hotels[0].price_per_night) || 240)
    });

    // Day 2: Cultural Exploration & Gastronomy
    if (daysCount >= 2) {
      stops.push({
        day: 2,
        time: "10:30 AM",
        type: "attraction",
        icon: "fa-camera-retro",
        badge: "Sightseeing",
        title: "Guided Cultural Landmark Tour",
        location: destName + " Historic District",
        cost: "$65"
      });
      stops.push({
        day: 2,
        time: "07:30 PM",
        type: "restaurant",
        icon: "fa-utensils",
        badge: "Culinary Dining",
        title: "Signature Gastronomy Tasting Experience",
        location: "Top Culinary Venue",
        cost: "$95"
      });
    }

    // Day 3: Scenic Panorama Trail
    if (daysCount >= 3) {
      stops.push({
        day: 3,
        time: "11:00 AM",
        type: "adventure",
        icon: "fa-compass",
        badge: "Excursion",
        title: "Scenic Coastal & Nature Reserve Trail",
        location: destName + " Panorama Spot",
        cost: "$85"
      });
    }

    return stops;
  }

  var currentPage = 1;
  var itemsPerPage = 4;
  var expandedTimelines = {};

  function toggleTripTimeline(tripId) {
    expandedTimelines[tripId] = !expandedTimelines[tripId];
    var body = el("timeline-body-" + tripId);
    var icon = el("timeline-icon-" + tripId);
    var label = el("timeline-label-" + tripId);

    if (body) {
      if (expandedTimelines[tripId]) {
        body.classList.remove("hidden");
        if (icon) icon.className = "fas fa-chevron-up text-[10px]";
        if (label) label.textContent = "Collapse Timeline";
      } else {
        body.classList.add("hidden");
        if (icon) icon.className = "fas fa-chevron-down text-[10px]";
        if (label) label.textContent = "Expand Timeline";
      }
    }
  }

  function setAgendaPage(page) {
    currentPage = page;
    renderCalendar();
  }

  global.toggleTripTimeline = toggleTripTimeline;
  global.setAgendaPage = setAgendaPage;

  function renderAgendaList(trips) {
    var container = el("agendaListView");
    if (!container) return;

    var totalPages = Math.ceil(trips.length / itemsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    var startIdx = (currentPage - 1) * itemsPerPage;
    var paginatedTrips = trips.slice(startIdx, startIdx + itemsPerPage);

    var cardsHtml = paginatedTrips.map(function (t) {
      var cover = resolveTripImage(t);
      var dest = (t.destinations && t.destinations[0]) || {};
      var destName = dest.city_name || dest.city || dest.name || "Global Destination";
      var countryName = dest.country_name || dest.country || "International";
      var statusBadgeCls = "status-badge-" + (t.status || "upcoming").toLowerCase();
      var timelineStops = generateTripTimelineStops(t);
      var isExpanded = !!expandedTimelines[t.id];

      var stopsHtml = timelineStops.map(function (st) {
        return '<div class="relative pl-6 pb-4 group/node">' +
          '<div class="absolute -left-[13px] top-1 w-6 h-6 rounded-full bg-amber-500 text-black font-black flex items-center justify-center text-[10px] shadow-md ring-4 ring-white dark:ring-[#121215] group-hover/node:scale-110 transition-transform">' +
            st.day +
          '</div>' +
          '<div class="p-3.5 rounded-2xl bg-white/90 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 hover:border-amber-500/50 transition-all duration-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">' +
            '<div class="space-y-1">' +
              '<div class="flex items-center gap-2">' +
                '<span class="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-extrabold text-[9px] uppercase border border-amber-500/25">' +
                  '<i class="fas ' + st.icon + ' mr-1"></i>' + st.time +
                '</span>' +
                '<span class="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 font-extrabold text-[9px] uppercase border border-sky-500/25">' +
                  st.badge +
                '</span>' +
              '</div>' +
              '<h5 class="font-black text-xs text-gray-900 dark:text-white group-hover/node:text-amber-500 transition">' + esc(st.title) + '</h5>' +
              '<span class="text-[11px] text-gray-500 dark:text-white/60 block"><i class="fas fa-location-dot text-amber-400 mr-1"></i>' + esc(st.location) + '</span>' +
            '</div>' +
            '<span class="text-xs font-black text-amber-500 shrink-0 self-start sm:self-center">' + st.cost + '</span>' +
          '</div>' +
        '</div>';
      }).join("");

      return '<div class="p-6 rounded-3xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-amber-500/40 transition-all duration-300 space-y-5 shadow-lg">' +
        '<!-- Header Bar -->' +
        '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-white/10 pb-4">' +
          '<div class="flex items-center gap-4">' +
            '<div class="w-16 h-16 rounded-2xl overflow-hidden bg-gray-200 shrink-0 shadow-md">' +
              '<img src="' + esc(cover) + '" alt="' + esc(t.title) + '" class="w-full h-full object-cover" />' +
            '</div>' +
            '<div>' +
              '<div class="flex items-center gap-2 mb-1">' +
                '<span class="px-3 py-0.5 rounded-full text-[10px] font-black uppercase ' + statusBadgeCls + '">' + esc(t.status || "Upcoming") + '</span>' +
                '<span class="text-xs font-extrabold text-amber-500"><i class="far fa-clock mr-1"></i>' + (t.no_of_days || 5) + ' Days Journey</span>' +
              '</div>' +
              '<h3 class="font-black text-base text-gray-900 dark:text-white">' + esc(t.title) + '</h3>' +
              '<span class="text-xs text-gray-500 dark:text-white/60"><i class="fas fa-location-dot text-amber-500 mr-1"></i>' + esc(destName) + ', ' + esc(countryName) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="flex items-center gap-2 justify-between sm:justify-end">' +
            '<!-- Real Route Direct Link Button -->' +
            '<a href="trip.html?id=' + t.id + '" class="w-10 h-10 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-black transition flex items-center justify-center border border-amber-500/30 shadow-sm" title="View Real User Trip Route (app/trip.html?id=' + t.id + ')">' +
              '<i class="fas fa-arrow-up-right-from-square text-xs"></i>' +
            '</a>' +

            '<!-- Toggle Timeline Icon Button -->' +
            '<button type="button" onclick="window.toggleTripTimeline(' + t.id + ')" class="h-10 px-3.5 rounded-full bg-gray-200 dark:bg-white/10 hover:bg-amber-500 hover:text-black font-black text-xs transition flex items-center gap-2 text-gray-900 dark:text-white border border-gray-300 dark:border-white/10" title="Toggle Animated Itinerary Timeline">' +
              '<i class="fas fa-route text-amber-500 group-hover:text-black" id="timeline-icon-' + t.id + '"></i>' +
              '<span class="text-[11px]" id="timeline-label-' + t.id + '">' + timelineStops.length + ' Stops</span>' +
            '</button>' +

            '<!-- Inspect Drawer Icon Button -->' +
            '<button type="button" onclick="window.openTripDrawer(' + t.id + ')" class="w-10 h-10 rounded-full bg-amber-500 text-black hover:bg-amber-400 font-black transition flex items-center justify-center shadow-md cursor-pointer" title="Inspect Side Drawer Details">' +
              '<i class="fas fa-eye text-xs"></i>' +
            '</button>' +
          '</div>' +
        '</div>' +

        '<!-- Collapsible Day-by-Day Animated Timeline -->' +
        '<div class="space-y-3 pt-2 ' + (isExpanded ? '' : 'hidden') + '" id="timeline-body-' + t.id + '">' +
          '<span class="text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider block"><i class="fas fa-route mr-1"></i> Timeline Itinerary Schedule</span>' +
          '<div class="relative pl-6 space-y-2 border-l-2 border-dashed border-amber-500/40 ml-3 pt-2">' +
            stopsHtml +
          '</div>' +
        '</div>' +
      '</div>';
    }).join("");

    // Render Pagination Bar
    var pagePills = "";
    for (var p = 1; p <= totalPages; p++) {
      var isCur = (p === currentPage);
      pagePills += '<button type="button" onclick="window.setAgendaPage(' + p + ')" class="w-8 h-8 rounded-full text-xs font-black transition ' + (isCur ? 'bg-amber-500 text-black shadow-md' : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/80 hover:bg-amber-500/20') + '">' + p + '</button>';
    }

    var paginationHtml = '<div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200 dark:border-white/10">' +
      '<span class="text-xs font-bold text-gray-500 dark:text-white/60">Showing Page ' + currentPage + ' of ' + totalPages + ' (' + trips.length + ' Total Trips)</span>' +
      '<div class="flex items-center gap-2">' +
        '<button type="button" onclick="window.setAgendaPage(' + (currentPage - 1) + ')" class="px-3.5 py-1.5 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-amber-500 hover:text-black font-extrabold text-xs transition cursor-pointer disabled:opacity-40" ' + (currentPage <= 1 ? 'disabled' : '') + '>← Prev</button>' +
        '<div class="flex items-center gap-1">' + pagePills + '</div>' +
        '<button type="button" onclick="window.setAgendaPage(' + (currentPage + 1) + ')" class="px-3.5 py-1.5 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-amber-500 hover:text-black font-extrabold text-xs transition cursor-pointer disabled:opacity-40" ' + (currentPage >= totalPages ? 'disabled' : '') + '>Next →</button>' +
      '</div>' +
    '</div>';

    container.innerHTML = cardsHtml + paginationHtml;
  }

  function renderUpcomingSidebar() {
    var container = el("upcomingFeedList");
    if (!container) return;

    var upcoming = allTrips.filter(function (t) {
      var st = (t.status || "upcoming").toLowerCase();
      return st === "upcoming" || st === "ongoing";
    }).slice(0, 4);

    if (upcoming.length === 0) {
      container.innerHTML = '<div class="py-6 text-center text-xs text-gray-400">No upcoming trips scheduled.</div>';
      return;
    }

    container.innerHTML = upcoming.map(function (t) {
      var cover = resolveTripImage(t);
      var destName = (t.destinations && t.destinations[0] && (t.destinations[0].city_name || t.destinations[0].name)) || "Destination";
      var statusBadgeCls = "status-badge-" + (t.status || "upcoming").toLowerCase();

      return '<div class="p-3.5 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-amber-500/40 transition flex items-center justify-between gap-3 cursor-pointer" onclick="window.openTripDrawer(' + t.id + ')">' +
        '<div class="flex items-center gap-3 min-w-0">' +
          '<img src="' + esc(cover) + '" alt="' + esc(t.title) + '" class="w-10 h-10 rounded-xl object-cover shrink-0 shadow-sm" />' +
          '<div class="min-w-0">' +
            '<strong class="font-black text-xs text-gray-900 dark:text-white truncate block">' + esc(t.title) + '</strong>' +
            '<span class="text-[10px] text-gray-400 font-medium block"><i class="far fa-calendar mr-1"></i>' + (t.start_date || "Aug 18").slice(0, 10) + '</span>' +
          '</div>' +
        '</div>' +
        '<span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase shrink-0 ' + statusBadgeCls + '">' + esc(t.status || "Upcoming") + '</span>' +
      '</div>';
    }).join("");
  }

  function openTripDrawer(tripId) {
    var drawer = el("trip-detail-drawer");
    if (!drawer) return;

    var trip = allTrips.find(function (t) { return t.id === tripId; });
    if (!trip) return;

    selectedTripForDrawer = trip;

    var imgEl = el("drawerImage");
    var titleEl = el("drawerTitle");
    var statusEl = el("drawerStatusBadge");
    var tagEl = el("drawerDestinationTag");
    var descEl = el("drawerDescription");
    var rangeEl = el("drawerDateRange");
    var durationEl = el("drawerDuration");
    var budgetEl = el("drawerBudget");
    var travelersEl = el("drawerTravelers");
    var hotelEl = el("drawerHotelInfo");
    var transitEl = el("drawerTransitInfo");
    var openBtn = el("drawerOpenBtn");
    var editBtn = el("drawerEditBtn");

    var dest = (trip.destinations && trip.destinations[0]) || {};
    var destName = dest.city_name || dest.city || dest.name || "Global Destination";
    var countryName = dest.country_name || dest.country || "International";

    if (imgEl) imgEl.src = resolveTripImage(trip);
    if (titleEl) titleEl.textContent = trip.title;
    if (statusEl) {
      statusEl.textContent = trip.status || "Upcoming";
      statusEl.className = "px-3 py-1 rounded-full text-xs font-black uppercase status-badge-" + (trip.status || "upcoming").toLowerCase();
    }
    if (tagEl) tagEl.innerHTML = '<i class="fas fa-location-dot text-amber-400 mr-1"></i>' + esc(destName) + ', ' + esc(countryName);
    if (descEl) descEl.textContent = trip.description || "Explore a custom curated travel itinerary for " + destName + ".";
    if (rangeEl) rangeEl.textContent = (trip.start_date || "Aug 18, 2026").slice(0, 10) + " → " + (trip.end_date || "Aug 24, 2026").slice(0, 10);
    if (durationEl) durationEl.textContent = (trip.no_of_days || 5) + " Days";
    if (budgetEl) budgetEl.textContent = "$" + Number(trip.estimated_cost || trip.budget || 1600).toLocaleString();
    if (travelersEl) travelersEl.textContent = (trip.no_of_travelers || 2) + " Traveler(s)";
    if (hotelEl) hotelEl.textContent = (trip.hotels && trip.hotels[0] ? trip.hotels[0].name + " · Attached Stay" : "Curated Boutique Accommodation");
    if (transitEl) transitEl.textContent = (trip.flights && trip.flights[0] ? trip.flights[0].airline : "Direct Flight & Airport Transfer");

    if (openBtn) openBtn.href = "trip.html?id=" + trip.id;
    if (editBtn) editBtn.href = "trip-form.html?id=" + trip.id;

    // Render Side Drawer Animated Timeline Nodes
    var timelineContainer = el("drawerTimelineContainer");
    if (timelineContainer) {
      var stops = generateTripTimelineStops(trip);
      timelineContainer.innerHTML = stops.map(function (st) {
        return '<div class="relative pl-6 pb-3 group/drawerNode">' +
          '<div class="absolute -left-[13px] top-1 w-6 h-6 rounded-full bg-amber-500 text-black font-black flex items-center justify-center text-[10px] shadow-md ring-4 ring-white dark:ring-[#121215] group-hover/drawerNode:scale-110 transition-transform">' +
            st.day +
          '</div>' +
          '<div class="p-3 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-amber-500/50 transition-all duration-300 space-y-1">' +
            '<div class="flex items-center justify-between">' +
              '<span class="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-extrabold text-[9px] uppercase border border-amber-500/25">' +
                '<i class="fas ' + st.icon + ' mr-1"></i>' + st.time +
              '</span>' +
              '<span class="text-amber-500 font-black text-[11px]">' + st.cost + '</span>' +
            '</div>' +
            '<strong class="font-extrabold text-xs text-gray-900 dark:text-white block group-hover/drawerNode:text-amber-500 transition">' + esc(st.title) + '</strong>' +
            '<span class="text-[10px] text-gray-500 dark:text-white/60 block"><i class="fas fa-location-dot text-amber-400 mr-1"></i>' + esc(st.location) + '</span>' +
          '</div>' +
        '</div>';
      }).join("");
    }

    drawer.classList.remove("hidden");
  }

  function closeDrawer() {
    var drawer = el("trip-detail-drawer");
    if (drawer) drawer.classList.add("hidden");
  }

  global.openTripDrawer = openTripDrawer;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

})(window);
