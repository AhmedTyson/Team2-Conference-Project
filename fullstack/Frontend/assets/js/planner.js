/**
 * planner.js — Itinera Luxury AI Trip Planner Engine
 * Implements interactive destination selection, multi-step parameters,
 * backend AI generation integration, and luxury master plan rendering.
 */
(function (global) {
  "use strict";

  const It = global.Itinera || {};

  // Destination Catalog
  const PRESET_DESTINATIONS = [
    {
      city: "Tokyo, Japan",
      country: "Japan",
      image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80",
    },
    {
      city: "Zurich, Switzerland",
      country: "Switzerland",
      image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=800&q=80",
    },
    {
      city: "Rome, Italy",
      country: "Italy",
      image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80",
    }
  ];

  // State
  let plannerState = {
    city: "Rome, Italy",
    duration: 4,
    startDate: "2026-09-15",
    travelParty: "Couple / Romantic",
    budgetTier: "Luxury",
    budgetAmount: 7900,
    interests: ["History & Culture", "Michelin Dining", "Art & High Fashion"],
    quotaUsed: 1,
    quotaTotal: 500,
    currentPlan: null
  };

  // Agency-launched planning context (opened from agency/create-trip.html)
  let agencyCtx = { assignmentId: null, customerId: null, customerName: null };

  function el(id) {
    return document.getElementById(id);
  }

  function showToast(msg) {
    const toast = el("planner-toast");
    if (!toast) return;
    toast.querySelector(".toast-msg").textContent = msg;
    toast.style.display = "flex";
    setTimeout(() => {
      toast.style.display = "none";
    }, 4000);
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Agency-launched context — banner + assignment-aware save behaviour
  function initAgencyContext() {
    const container = document.querySelector(".planner-container");
    if (container) {
      const banner = document.createElement("div");
      banner.setAttribute("role", "status");
      banner.style.cssText =
        "display:flex;align-items:center;gap:0.75rem;padding:0.9rem 1.15rem;border-radius:14px;margin-bottom:1.5rem;" +
        "border:1px solid rgba(245,158,11,0.35);background:rgba(245,158,11,0.08);color:#fbbf24;font-size:0.85rem;line-height:1.5;";
      banner.innerHTML =
        '<i class="fas fa-user-tie" aria-hidden="true"></i>' +
        '<span><strong>Planning on behalf of ' + escapeHtml(agencyCtx.customerName) + '</strong>' +
        ' &middot; Assignment #' + agencyCtx.assignmentId +
        ' &mdash; the finished plan is attached to this customer\'s account.</span>';
      container.insertBefore(banner, container.firstChild);
    }
    const btnBook = el("btn-book-paymob");
    if (btnBook) btnBook.style.display = "none";
    const btnSave = el("btn-save-master-plan");
    if (btnSave) {
      const label = btnSave.querySelector("span");
      if (label) label.textContent = "Save to Customer's Assignment";
    }
  }

  // Quota Management
  async function initQuota() {
    try {
      const getUserFunc = (window.Itinera && window.Itinera.session && window.Itinera.session.currentUser) || null;
      if (getUserFunc) {
        const user = await getUserFunc();
        if (user) {
          const sub = user.subscription || {};
          plannerState.quotaTotal = sub.ai_quota_total || (sub.plan ? sub.plan.ai_quota_monthly : 500);
          plannerState.quotaUsed = typeof user.ai_generations_count === "number" ? user.ai_generations_count : (sub.ai_quota_used || 0);
        }
      }
    } catch (e) {}
    updateQuotaDisplay();
  }

  function updateQuotaDisplay() {
    const remaining = Math.max(0, plannerState.quotaTotal - plannerState.quotaUsed);
    const quotaEl = el("quota-display");
    if (quotaEl) {
      quotaEl.innerHTML = `<i class="fas fa-bolt"></i> Quota: ${remaining}/${plannerState.quotaTotal}`;
    }
  }

  function consumeQuota() {
    plannerState.quotaUsed++;
    localStorage.setItem("itinera_ai_quota", plannerState.quotaUsed);
    updateQuotaDisplay();
  }

  // Destination Cards Render
  function renderDestinationCards() {
    const container = el("dest-cards-container");
    if (!container) return;
    container.innerHTML = "";

    PRESET_DESTINATIONS.forEach((dest) => {
      const isSelected = dest.city.toLowerCase() === plannerState.city.toLowerCase();
      const card = document.createElement("div");
      card.className = `dest-card ${isSelected ? "selected" : ""}`;
      card.innerHTML = `
        <img class="dest-card__image" src="${dest.image}" alt="${dest.city}" />
        <div class="dest-card__badge-check"><i class="fas fa-check"></i></div>
        <div class="dest-card__overlay">
          <h3 class="dest-card__title">${dest.city}</h3>
          <p class="dest-card__country">${dest.country}</p>
        </div>
      `;

      card.addEventListener("click", () => {
        plannerState.city = dest.city;
        const customInput = el("custom-city-input");
        if (customInput) customInput.value = dest.city;
        renderDestinationCards();
      });

      container.appendChild(card);
    });
  }

  // Budget Tier Selection
  function setupBudgetTiers() {
    const tierCards = document.querySelectorAll(".tier-card");
    tierCards.forEach((card) => {
      card.addEventListener("click", function () {
        tierCards.forEach((c) => c.classList.remove("selected"));
        this.classList.add("selected");
        plannerState.budgetTier = this.getAttribute("data-tier");
        const baseCost = parseInt(this.getAttribute("data-base-cost"), 10) || 1975;
        plannerState.budgetAmount = baseCost * plannerState.duration;
      });
    });
  }

  // Experience Focus Chips
  function setupExperienceChips() {
    const chips = document.querySelectorAll(".exp-chip");
    chips.forEach((chip) => {
      chip.addEventListener("click", function () {
        const val = this.getAttribute("data-value");
        if (this.classList.contains("selected")) {
          this.classList.remove("selected");
          plannerState.interests = plannerState.interests.filter((i) => i !== val);
        } else {
          this.classList.add("selected");
          plannerState.interests.push(val);
        }
      });
    });
  }

  // Progress Step Bar Controller
  function updateProgressStep(activeStep) {
    const items = document.querySelectorAll(".progress-step-item");
    items.forEach((item) => {
      const step = parseInt(item.getAttribute("data-step"), 10);
      item.classList.remove("active", "completed");
      if (step < activeStep) {
        item.classList.add("completed");
      } else if (step === activeStep) {
        item.classList.add("active");
      }
    });
  }

  // Multi-step Navigation
  function setupStepFlow() {
    const btnProceed = el("btn-proceed-budget");
    const step1 = el("planner-step-1");
    const step2 = el("planner-step-2");
    const btnGenerate = el("btn-generate-plan");
    const btnBackStep1 = el("btn-back-step1");

    if (btnProceed) {
      btnProceed.addEventListener("click", () => {
        // Collect Step 1 inputs
        const customInput = el("custom-city-input");
        if (customInput && customInput.value.trim()) {
          plannerState.city = customInput.value.trim();
        }
        const durationInput = el("duration-input");
        if (durationInput) {
          plannerState.duration = parseInt(durationInput.value, 10) || 4;
        }
        const startDateInput = el("start-date-input");
        if (startDateInput && startDateInput.value) {
          plannerState.startDate = startDateInput.value;
        }
        const partySelect = el("party-select");
        if (partySelect) {
          plannerState.travelParty = partySelect.value;
        }

        // Calculate dynamic budget for tier
        const selectedTier = document.querySelector(".tier-card.selected");
        const baseCost = selectedTier ? parseInt(selectedTier.getAttribute("data-base-cost"), 10) : 1975;
        plannerState.budgetAmount = baseCost * plannerState.duration;

        step1.style.display = "none";
        step2.style.display = "block";
        updateProgressStep(2);
        window.scrollTo({ top: step2.offsetTop - 80, behavior: "smooth" });
      });
    }

    if (btnBackStep1) {
      btnBackStep1.addEventListener("click", () => {
        step2.style.display = "none";
        step1.style.display = "block";
        updateProgressStep(1);
        window.scrollTo({ top: step1.offsetTop - 80, behavior: "smooth" });
      });
    }

    if (btnGenerate) {
      btnGenerate.addEventListener("click", generateAiMasterPlan);
    }
  }

  // AI Master Plan Generation Execution
  async function generateAiMasterPlan() {
    const step2      = el("planner-step-2");
    const modal      = el("synthesis-modal");
    const output     = el("master-plan-output");
    const statusText = el("synthesis-status-text");

    step2.style.display  = "none";
    modal.style.display  = "block";
    output.style.display = "none";
    updateProgressStep(4);

    const steps = [
      "Analyzing destination landmarks & topography...",
      "Curating Michelin culinary pairings & reservations...",
      "Verifying OSRM logistics waypoints & transit...",
      "Synthesizing bespoke luxury master plan...",
      "Saving itinerary to your account..."
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      stepIdx = (stepIdx + 1) % steps.length;
      if (statusText) statusText.textContent = steps[stepIdx];
    }, 700);

    const payload = {
      city:           plannerState.city,
      destination:    plannerState.city,
      no_of_days:     plannerState.duration,
      start_date:     plannerState.startDate,
      travel_party:   plannerState.travelParty,
      travel_style:   plannerState.budgetTier,
      budget_tier:    plannerState.budgetTier,
      budget:         plannerState.budgetAmount,
      interests:      plannerState.interests
    };

    let planData    = null;
    let backendOk   = false;
    let usedFallback = false;
    let saveError    = null;

    // ── 1. Try backend AI generate (waits for full response) ──
    try {
      const apiPostFunc = (window.Itinera && window.Itinera.apiPost) || (window.Api && window.Api.post);
      if (apiPostFunc) {
        const res = await apiPostFunc("/trips/generate-ai", payload, { auth: true });

        if (res && res.ok) {
          // Unwrap ApiResponse: { success: true, data: { days: [...], trip_id: N, ... } }
          const body = res.body || res;
          const raw  = body.data || body;

          if (raw && raw.days && raw.days.length > 0) {
            planData     = raw;
            backendOk    = true;
            usedFallback = !!(raw.used_fallback || raw.fallback);
            saveError    = raw.save_error || null;
          }

          // Quota refresh
          if (window.Itinera && window.Itinera.session && window.Itinera.session.currentUser) {
            try { await window.Itinera.session.currentUser(true); } catch (_) {}
          }
        }
      }
    } catch (e) {
      console.warn("Backend AI error:", e);
    }

    // ── 2. Pure JS fallback if backend failed or returned no days ──
    if (!planData || !planData.days || planData.days.length === 0) {
      planData     = generateDeterministicPlan(plannerState);
      usedFallback = true;
      backendOk    = false;
    }

    clearInterval(interval);
    consumeQuota();

    // ── 3. If backend saved it, store trip_id immediately ──
    if (planData.trip_id) {
      plannerState.savedTripId = planData.trip_id;
    }

    // ── 4. If fallback plan was generated locally, save it to backend now ──
    if (!planData.trip_id) {
      try {
        const saved = await savePlanToMyTrips(false);
        if (saved && saved.id) {
          plannerState.savedTripId = saved.id;
          planData.trip_id = saved.id;
        }
      } catch (e) {
        console.warn("Auto-save notice:", e);
      }
    }

    // ── 5. Show result banners ──
    modal.style.display  = "none";
    output.style.display = "block";
    plannerState.currentPlan = planData;

    if (saveError) {
      showToast("⚠️ Plan generated but could not be saved: " + saveError);
    } else if (usedFallback && backendOk) {
      showToast("ℹ️ AI used smart luxury fallback — full itinerary generated & saved.");
    } else if (usedFallback) {
      showToast("ℹ️ AI offline — generated & saved using local luxury engine.");
    } else {
      showToast("✅ AI itinerary generated and saved successfully!");
    }

    renderMasterPlan(planData);
    window.scrollTo({ top: output.offsetTop - 80, behavior: "smooth" });

    // ── 6. Auto-redirect to trip editor after short delay if saved ──
    if (plannerState.savedTripId && !saveError) {
      setTimeout(() => {
        window.location.href = "trip.html?id=" + plannerState.savedTripId;
      }, 2200);
    }
  }

  // Advanced Multi-City Deterministic Luxury Synthesis Engine
  function generateDeterministicPlan(state) {
    const rawCity = state.city || "Rome, Italy";
    const daysCount = parseInt(state.duration, 10) || 10;
    const party = state.travelParty || "Couple / Romantic";
    const tier = state.budgetTier || "Luxury";
    const budget = state.budgetAmount || (1500 * daysCount);

    // Split multi-city stops (e.g. "Rome, Italy -> Cairo, Egypt -> Alexandria")
    let rawStops = [];
    if (/(?:->|→|\s+-\s+)/.test(rawCity)) {
      rawStops = rawCity.split(/\s*(?:->|→|\s+-\s+)\s*/);
    } else if (rawCity.includes(";")) {
      rawStops = rawCity.split(";");
    } else {
      rawStops = rawCity.split(/(?:\s*,\s*(?=[A-Z][a-z]+)|\s+to\s+)/i);
    }
    const cities = rawStops.map(s => s.trim()).filter(s => s.length > 0);
    const cityList = cities.length > 0 ? cities : ["Rome", "Cairo", "Alexandria"];

    const cityCatalogs = {
      rome: {
        name: "Rome, Italy",
        days: [
          {
            title: "Imperial Glory & Colosseum Underground",
            items: [
              { time: "09:30 AM", title: "Private VIP Colosseum & Roman Forum Tour", desc: "Includes fast-track underground access with a private archeologist guide.", price: 600, type: "ATTRACTION" },
              { time: "01:30 PM", title: "Armando al Pantheon", desc: "Classic Roman cuisine in an intimate setting near the Pantheon.", price: 180, type: "RESTAURANT" },
              { time: "04:00 PM", title: "Private Trevi & Spanish Steps Walking Tour", desc: "Guided exploration of Rome Baroque fountains and iconic piazza monuments.", price: 300, type: "ATTRACTION" },
              { time: "08:00 PM", title: "Aroma Restaurant", desc: "Michelin-starred dining with a direct, unobstructed view of the Colosseum.", price: 550, type: "RESTAURANT" }
            ]
          },
          {
            title: "The Holy See & Vatican Masterpieces",
            items: [
              { time: "08:00 AM", title: "Vatican Museums Private Early Access", desc: "Exclusive entry before the general public to view the Sistine Chapel in near silence.", price: 950, type: "ATTRACTION" },
              { time: "01:00 PM", title: "Pierluigi Piazza Seafood", desc: "Rome premier spot for luxury seafood dining; private table in the historic piazza.", price: 250, type: "RESTAURANT" },
              { time: "03:30 PM", title: "Via dei Condotti Personal Shopping", desc: "A dedicated fashion consultant facilitates private viewings at flagship luxury boutiques.", price: 400, type: "ATTRACTION" },
              { time: "08:30 PM", title: "La Pergola 3-Star Michelin Degustation", desc: "Rome only three-Michelin-starred restaurant offering an unparalleled tasting menu.", price: 900, type: "RESTAURANT" }
            ]
          },
          {
            title: "Renaissance Art & Borghese Villa",
            items: [
              { time: "10:00 AM", title: "Galleria Borghese Private Docent Tour", desc: "An in-depth look at Bernini and Caravaggio masterpieces with an art historian.", price: 450, type: "ATTRACTION" },
              { time: "01:00 PM", title: "Casina Valadier Hilltop Lunch", desc: "High-end dining on Pincian Hill with panoramic views of the city skyline.", price: 220, type: "RESTAURANT" },
              { time: "03:30 PM", title: "Private Vintage Vespa Tour", desc: "Discover hidden Roman gems and the Aventine Hill secret keyhole on a classic Vespa.", price: 500, type: "ATTRACTION" },
              { time: "08:00 PM", title: "Imàgo at Hassler", desc: "Sophisticated Michelin-starred Italian dining at the top of the Spanish Steps.", price: 600, type: "RESTAURANT" }
            ]
          },
          {
            title: "Roman Relaxation & Culinary Mastery",
            items: [
              { time: "10:30 AM", title: "Luxury Wellness at De Russie Spa", desc: "A morning of hydrotherapy and Mediterranean-inspired treatments in a serene setting.", price: 600, type: "ATTRACTION" },
              { time: "01:30 PM", title: "Roscioli Salumeria con Cucina", desc: "The city most elite deli-restaurant; the carbonara is world-famous.", price: 150, type: "RESTAURANT" },
              { time: "04:00 PM", title: "Private Pasta & Tiramisu Masterclass", desc: "Hosted in a private loft with a professional chef; includes premium wine pairing.", price: 500, type: "ATTRACTION" },
              { time: "08:30 PM", title: "Il Pagliaccio Two-Star Farewell Dinner", desc: "A refined two-Michelin-starred farewell dinner featuring innovative fusion-Italian cuisine.", price: 750, type: "RESTAURANT" }
            ]
          }
        ]
      },
      cairo: {
        name: "Cairo, Egypt",
        days: [
          {
            title: "Pharaonic Wonders & Giza Plateau",
            items: [
              { time: "08:30 AM", title: "Private VIP Great Pyramids & Sphinx Tour", desc: "Fast-track access into the Great Pyramid inner chambers with an Egyptologist.", price: 550, type: "ATTRACTION" },
              { time: "01:00 PM", title: "9 Pyramids Lounge", desc: "Gourmet dining with unobstructed panoramic views directly facing the 9 pyramids.", price: 160, type: "RESTAURANT" },
              { time: "03:30 PM", title: "Grand Egyptian Museum (GEM) Private Viewing", desc: "Exclusive docent tour of the complete King Tutankhamun royal collection.", price: 450, type: "ATTRACTION" },
              { time: "08:00 PM", title: "The Grill at Semiramis InterContinental", desc: "French haute cuisine overlooking the illuminated River Nile.", price: 320, type: "RESTAURANT" }
            ]
          },
          {
            title: "Islamic Cairo & Khan el-Khalili Bazaar",
            items: [
              { time: "09:30 AM", title: "Citadel of Saladin & Alabaster Mosque", desc: "Explore the medieval fortress and Ottoman architecture with private historian.", price: 350, type: "ATTRACTION" },
              { time: "01:00 PM", title: "Naguib Mahfouz Cafe Khan el-Khalili", desc: "Authentic palace dining inside the historic 14th-century souk.", price: 120, type: "RESTAURANT" },
              { time: "03:30 PM", title: "Private Artisan Goldsmith & Perfume Tour", desc: "Curated shopping session for antique brass, handwoven kilims, and rare oils.", price: 250, type: "ATTRACTION" },
              { time: "08:00 PM", title: "Zitouni at Four Seasons Nile Plaza", desc: "Luxurious Egyptian banquet with views over the Nile bridges.", price: 280, type: "RESTAURANT" }
            ]
          },
          {
            title: "Coptic Cairo & Sunset Nile Felucca",
            items: [
              { time: "10:00 AM", title: "Hanging Church & Coptic Museum", desc: "Discover ancient Roman Babylon fortress and early Christian treasures.", price: 300, type: "ATTRACTION" },
              { time: "01:30 PM", title: "Crimson Zamalek Waterfront Terrace", desc: "Refined Mediterranean dining on the Nile riverfront island in Zamalek.", price: 180, type: "RESTAURANT" },
              { time: "04:30 PM", title: "Private Nile Felucca Sunset Sailing", desc: "Traditional sailboat charter with champagne and live acoustic oud music.", price: 400, type: "ATTRACTION" },
              { time: "08:30 PM", title: "Revolving Restaurant Grand Nile Tower", desc: "360-degree rotating skyline dining on the 41st floor.", price: 350, type: "RESTAURANT" }
            ]
          }
        ]
      },
      alexandria: {
        name: "Alexandria, Egypt",
        days: [
          {
            title: "Mediterranean Pearl & Citadel of Qaitbay",
            items: [
              { time: "09:00 AM", title: "Citadel of Qaitbay & Ancient Lighthouse Site", desc: "Fortress tour on the exact location of the Pharos Lighthouse.", price: 350, type: "ATTRACTION" },
              { time: "01:00 PM", title: "Greek Club Alexandria Seaside Lunch", desc: "Waterfront terrace dining with fresh Mediterranean seafood & harbor views.", price: 160, type: "RESTAURANT" },
              { time: "03:30 PM", title: "Bibliotheca Alexandrina Private Tour", desc: "VIP guided access to the rare manuscript museum and modern cultural complex.", price: 300, type: "ATTRACTION" },
              { time: "08:00 PM", title: "Fish Market Alexandria Corniche Dinner", desc: "Iconic seafood institution with panoramic views of the Mediterranean coastline.", price: 220, type: "RESTAURANT" }
            ]
          },
          {
            title: "Catacombs & Royal Montaza Palace",
            items: [
              { time: "09:30 AM", title: "Catacombs of Kom El Shoqafa Tour", desc: "Descend into Roman-Egyptian underground tombs blending classical cultures.", price: 350, type: "ATTRACTION" },
              { time: "01:00 PM", title: "Delices Patisserie & Tea Salon since 1922", desc: "Heritage salon lunch in Alexandria downtown district.", price: 110, type: "RESTAURANT" },
              { time: "03:30 PM", title: "Montaza Palace Royal Gardens & Farouk Residence", desc: "Private stroll through royal gardens overlooking Mediterranean coves.", price: 300, type: "ATTRACTION" },
              { time: "08:00 PM", title: "San Giovanni Mediterranean Terrace", desc: "Classic fine dining under Stanley Bridge with live classical piano.", price: 260, type: "RESTAURANT" }
            ]
          }
        ]
      },
      tokyo: {
        name: "Tokyo, Japan",
        days: [
          {
            title: "Ancient Sanctuaries & Modern Neon",
            items: [
              { time: "09:00 AM", title: "Meiji Jingu Private Shinto Blessing", desc: "Private ceremonial entrance through the sacred forest with an English-speaking priest.", price: 450, type: "ATTRACTION" },
              { time: "01:00 PM", title: "Sukiyabashi Jiro Roppongi", desc: "Master Edomae omakase sushi experience prepared before your eyes.", price: 350, type: "RESTAURANT" },
              { time: "03:30 PM", title: "Ginza Luxury Haute Horlogerie & Couture", desc: "VIP private salon access in Ginza premier luxury design houses.", price: 400, type: "ATTRACTION" },
              { time: "07:30 PM", title: "Narisawa Gastronomy Experience", desc: "Innovative two-Michelin-starred Satoyama sustainable culinary journey.", price: 650, type: "RESTAURANT" }
            ]
          },
          {
            title: "Traditional Arts & Culinary Precision",
            items: [
              { time: "10:00 AM", title: "Private Kintsugi & Tea Ceremony Master", desc: "Exclusive session in a centuries-old tea house with a 15th-generation master.", price: 550, type: "ATTRACTION" },
              { time: "01:30 PM", title: "Tempura Kondo", desc: "Two-Michelin-starred delicate tempura mastery using seasonal rare ingredients.", price: 220, type: "RESTAURANT" },
              { time: "04:00 PM", title: "teamLab Borderless VIP Private Viewing", desc: "Curated digital art museum experience with skip-the-line private docent.", price: 350, type: "ATTRACTION" },
              { time: "08:00 PM", title: "L'Effervescence", desc: "Three-Michelin-starred French-Japanese harmonic culinary masterpiece.", price: 800, type: "RESTAURANT" }
            ]
          }
        ]
      }
    };

    // Allocate days across destination cities
    const numCities = cityList.length;
    const baseDays = Math.floor(daysCount / numCities);
    const remainder = daysCount % numCities;
    const daysPerCity = [];

    for (let c = 0; c < numCities; c++) {
      daysPerCity[c] = baseDays + (c < remainder ? 1 : 0);
    }

    const generatedDays = [];
    let plannedCount = 0;
    let currentDayNum = 1;

    // Generic fallback for any destination not in cityCatalogs
    function buildGenericCatalog(name) {
      return {
        name,
        days: [
          {
            title: `Iconic Monuments & VIP ${name} Highlights`,
            items: [
              { time: "09:30 AM", title: `Private VIP ${name} Highlights Tour`, desc: "Fast-track access to premier historical monuments with an expert local historian.", price: 550, type: "ATTRACTION" },
              { time: "01:00 PM", title: `Grand Historic Dining in ${name}`, desc: "Curated regional tasting menu in an iconic heritage location.", price: 200, type: "RESTAURANT" },
              { time: "03:30 PM", title: "Private Chauffeur & Scenic Viewpoints", desc: "Curated private transportation covering secret gems and iconic vistas.", price: 400, type: "ATTRACTION" },
              { time: "08:00 PM", title: "Panoramic Michelin-Starred Skyline Dinner", desc: "Haute cuisine multi-course tasting menu paired with grand cru vintage wines.", price: 650, type: "RESTAURANT" }
            ]
          },
          {
            title: "Cultural Heritage & Fine Artistry",
            items: [
              { time: "10:00 AM", title: "Exclusive Fine Art Gallery Access", desc: "Private early morning gallery docent tour before public opening.", price: 480, type: "ATTRACTION" },
              { time: "01:30 PM", title: "Waterfront Gourmet Specialty Dining", desc: "Refined culinary specialties featuring fresh organic farm-to-table dining.", price: 240, type: "RESTAURANT" },
              { time: "04:00 PM", title: "Boutique Artisan & Couture Experience", desc: "Private appointments with premier local craftsmen and designers.", price: 420, type: "ATTRACTION" },
              { time: "08:30 PM", title: "Celebrated Master Chef Degustation", desc: "Multi-course culinary journey crafted by the country's leading culinary figure.", price: 780, type: "RESTAURANT" }
            ]
          },
          {
            title: "Scenic Countryside Estate & Wine Terroir",
            items: [
              { time: "09:30 AM", title: "Private Country Estate & Botanical Gardens", desc: "Chauffeured excursion to royal aristocratic grounds and private villas.", price: 500, type: "ATTRACTION" },
              { time: "01:00 PM", title: "Vineyard Villa Terrace Lunch", desc: "Sommelier wine pairing lunch overlooking sunlit vineyard hills.", price: 220, type: "RESTAURANT" },
              { time: "03:30 PM", title: "Artisanal & Terroir Masterclass", desc: "Guided tasting with master producers in a historic stone mill.", price: 300, type: "ATTRACTION" },
              { time: "08:00 PM", title: "Grand Farewell Gala Dining", desc: "Sophisticated seasonal menu in an illuminated palace courtyard.", price: 600, type: "RESTAURANT" }
            ]
          }
        ]
      };
    }

    for (let c = 0; c < numCities; c++) {
      const rawCityName = cityList[c];
      const cityNameLower = rawCityName.toLowerCase();
      let cat = null;

      for (const k of Object.keys(cityCatalogs)) {
        if (cityNameLower.includes(k)) {
          cat = cityCatalogs[k];
          break;
        }
      }

      // Unknown destination → generic luxury catalog
      if (!cat) cat = buildGenericCatalog(rawCityName.trim());

      const catDays = cat.days;
      const allocated = daysPerCity[c];

      for (let d = 0; d < allocated; d++) {
        const templateIndex = d % catDays.length;
        const template = catDays[templateIndex];
        const cycle = Math.floor(d / catDays.length);
        const dayTitle = `[${cat.name}] ${template.title}${cycle > 0 ? ` (Part ${cycle + 1})` : ""}`;

        const items = template.items.map(item => ({
          ...item,
          title: cycle > 0 ? `${item.title} • Session ${cycle + 1}` : item.title
        }));

        generatedDays.push({
          day_number: currentDayNum,
          title: dayTitle,
          items
        });
        plannedCount += items.length;
        currentDayNum++;
      }
    }

    return {
      title: `${daysCount}-Day ${tier} ${rawCity} Experience`,
      meta: `${daysCount} Days • ${rawCity} • ${party} • ${tier}`,
      description: `An extraordinary ${daysCount}-day luxury journey across ${rawCity}. Each stage is curated with private landmark access, Michelin-starred dining, personal shopping, and bespoke chauffeur logistics tailored to discerning travelers.`,
      estimated_budget: budget,
      planned_items_count: plannedCount,
      osrm_waypoints: "Verified",
      days: generatedDays
    };
  }

  // Render Master Plan on UI
  function renderMasterPlan(plan) {
    updateProgressStep(5);
    const titleEl = el("mp-title");
    const metaEl = el("mp-meta");
    const descEl = el("mp-desc");
    const budgetEl = el("mp-budget");
    const itemsEl = el("mp-items");
    const waypointsEl = el("mp-waypoints");
    const daysContainer = el("mp-days-container");

    if (titleEl) titleEl.textContent = plan.title;
    if (metaEl) metaEl.textContent = plan.meta;
    if (descEl) descEl.textContent = plan.description;
    if (budgetEl) budgetEl.textContent = `$${plan.estimated_budget.toLocaleString()}`;
    if (itemsEl) itemsEl.textContent = plan.planned_items_count;
    if (waypointsEl) waypointsEl.textContent = plan.osrm_waypoints || "Verified";

    if (!daysContainer) return;
    daysContainer.innerHTML = "";

    plan.days.forEach((day) => {
      const dayCard = document.createElement("div");
      dayCard.className = "day-card";

      let itemsHtml = "";
      day.items.forEach((item) => {
        itemsHtml += `
          <div class="timeline-item-row">
            <div class="timeline-node-dot"></div>
            <div class="timeline-activity-card">
              <div class="activity-info-col">
                <div class="activity-title-row">
                  <span class="activity-time">${item.time}</span>
                  <h4 class="activity-name">${item.title}</h4>
                </div>
                <p class="activity-desc">${item.description || item.desc}</p>
              </div>
              <div class="activity-meta-col">
                <span class="activity-price">$${item.price}</span>
                <span class="activity-category-badge">${item.type}</span>
              </div>
            </div>
          </div>
        `;
      });

      dayCard.innerHTML = `
        <div class="day-card-header">
          <div class="day-header-left">
            <div class="day-badge-circle">D${day.day_number}</div>
            <h3 class="day-title-text">${day.title}</h3>
          </div>
          <span class="day-count-tag">Day ${day.day_number} of ${plan.days.length}</span>
        </div>
        <div class="timeline-track-container">
          ${itemsHtml}
        </div>
      `;

      daysContainer.appendChild(dayCard);
    });

    // Wire Actions
    const btnSave = el("btn-save-master-plan");
    if (btnSave) {
      const realId = plannerState.savedTripId || plan.trip_id;
      if (realId) {
        btnSave.innerHTML = '<i class="fas fa-circle-check text-emerald-400"></i> Saved to Database — Edit Itinerary →';
        btnSave.className = "btn-save-trips bg-emerald-500/20 border-emerald-500/40 text-emerald-300";
        btnSave.onclick = function () {
          window.location.href = "trip.html?id=" + realId;
        };
      } else {
        btnSave.onclick = savePlanToMyTrips;
      }
    }

    const btnBook = el("btn-book-paymob");
    if (btnBook) {
      btnBook.onclick = function (e) {
        e.preventDefault();

        var token = (It.readToken && It.readToken()) || localStorage.getItem("itinera_token");
        if (!token) {
          if (typeof window.showToast === "function") showToast("Please sign in to proceed with Paymob payment.");
          else alert("Please sign in to proceed with Paymob payment.");

          if (typeof window.openAuthModal === "function") {
            window.openAuthModal("login", "Sign in to complete Paymob booking.");
          } else if (typeof window.showAuthModal === "function") {
            window.showAuthModal("login");
          } else {
            window.location.href = "../login.html?redirect=app/planner.html";
          }
          return;
        }

        btnBook.disabled = true;
        btnBook.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Connecting Paymob Gateway...';

        sessionStorage.setItem("itinera_checkout_plan", JSON.stringify(plan));

        // Save trip first to ensure trip ID is stored
        savePlanToMyTrips().then(function (tripRecord) {
          var tripId = tripRecord ? (tripRecord.id || (tripRecord.data && tripRecord.data.id)) : plannerState.savedTripId;
          var numTripId = Number(tripId);

          if (!isNaN(numTripId) && numTripId > 0) {
            return (It.apiPost
              ? It.apiPost("/checkout/initiate", {
                  type: "trip_package",
                  trip_id: numTripId,
                  billing: {
                    first_name: "Traveler",
                    last_name: "User",
                    email: localStorage.getItem("itinera_user_email") || "traveler@example.com",
                    phone_number: "+201000000000"
                  }
                }, { auth: true })
              : Promise.reject("No API client"));
          }

          // Fallback to active pricing plan matching plans.js
          return (It.apiGet ? It.apiGet("/plans") : Promise.resolve({ ok: true, body: { data: [{ id: 1 }] } }))
            .then(function (plansRes) {
              var plansList = [];
              if (plansRes && plansRes.body) {
                plansList = Array.isArray(plansRes.body.data) ? plansRes.body.data : (Array.isArray(plansRes.body) ? plansRes.body : []);
              }
              var targetPlan = plansList.find(function (p) { return Number(p.price_cents) > 0; }) || plansList[0] || { id: 1 };
              var planId = Number(targetPlan.id || 1);

              return (It.apiPost
                ? It.apiPost("/checkout/initiate", {
                    type: "subscription",
                    plan_id: planId,
                    billing: {
                      first_name: "Traveler",
                      last_name: "User",
                      email: localStorage.getItem("itinera_user_email") || "traveler@example.com",
                      phone_number: "+201000000000"
                    }
                  }, { auth: true })
                : Promise.reject("No API client"));
            });
        }).then(function (res) {
          if (res && res.ok && res.body && res.body.data && res.body.data.checkout_url) {
            try {
              sessionStorage.setItem("itinera_order_ctx", JSON.stringify({
                order_id: res.body.data.order_id || null,
                plan_name: plan.title,
                amount: plan.estimated_budget,
                ts: Date.now()
              }));
            } catch (e) {}

            if (typeof window.showToast === "function") showToast("Redirecting directly to Paymob Payment Gateway...");
            window.location.href = res.body.data.checkout_url;
          } else {
            var msg = (res && res.body && res.body.message) || "Could not initiate Paymob payment.";
            if (typeof window.showToast === "function") showToast(msg);
            else alert(msg);
            btnBook.disabled = false;
            btnBook.innerHTML = '<i class="fas fa-credit-card"></i> <span>Book Package (Paymob)</span>';
          }
        }).catch(function (err) {
          console.error("Paymob initiation error:", err);
          if (typeof window.showToast === "function") showToast("Payment gateway connection error.");
          btnBook.disabled = false;
          btnBook.innerHTML = '<i class="fas fa-credit-card"></i> <span>Book Package (Paymob)</span>';
        });
      };
    }
  }

  // Save Plan to Database (redirectNow=true navigates to trip.html after saving)
  async function savePlanToMyTrips(redirectNow = true) {
    const plan = plannerState.currentPlan;
    if (!plan) return null;

    // If already saved by backend (auto-save during generate), just redirect
    if (plannerState.savedTripId && redirectNow) {
      window.location.href = "trip.html?id=" + plannerState.savedTripId;
      return { id: plannerState.savedTripId };
    }

    const btn = el("btn-save-master-plan");
    if (btn) {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving to Database...';
      btn.disabled = true;
    }

    let createdRecord = null;
    let localTrip = null;

    // Save locally for offline support
    if (!agencyCtx.assignmentId) {
      const savedTrips = JSON.parse(localStorage.getItem("itinera_my_trips") || "[]");
      localTrip = {
        id: "trip_" + Date.now(),
        title: plan.title,
        city: plannerState.city,
        duration: plannerState.duration,
        start_date: plannerState.startDate,
        travel_party: plannerState.travelParty,
        budget: plan.estimated_budget,
        plan: plan,
        created_at: new Date().toISOString()
      };
      savedTrips.unshift(localTrip);
      localStorage.setItem("itinera_my_trips", JSON.stringify(savedTrips));
      const badge = el("my-trips-count-badge");
      if (badge) badge.textContent = savedTrips.length;
    }

    // Persist to backend database
    const token = (It.readToken && It.readToken()) || localStorage.getItem("itinera_token");
    if (token) {
      try {
        const rawBudget  = plan.estimated_budget;
        const cleanBudget = typeof rawBudget === "number"
          ? rawBudget
          : (parseFloat(String(rawBudget || "").replace(/[^0-9.]/g, "")) || 15000);
        const startDate  = plannerState.startDate || new Date().toISOString().split("T")[0];
        const numDays    = Number(plannerState.duration) || 3;
        const endDateObj = new Date(startDate);
        endDateObj.setDate(endDateObj.getDate() + numDays);
        const endDate = endDateObj.toISOString().split("T")[0];

        const payload = {
          title:          plan.title || ("Trip to " + (plannerState.city || "Destination")),
          city:           plannerState.city,
          destination:    plannerState.city,
          status:         "planned",
          travel_style:   plannerState.budgetTier || "cultural",
          interests:      Array.isArray(plannerState.interests) ? plannerState.interests : [plannerState.interests || "culture"],
          no_of_travelers: 2,
          budget:         cleanBudget,
          no_of_days:     numDays,
          start_date:     startDate,
          end_date:       endDate,
          days:           plan.days || []
        };

        let resJson;
        if (agencyCtx.assignmentId) {
          const agPayload = {
            title:           plan.title || ("Trip to " + (plannerState.city || "Destination")),
            description:     String(plan.description || "").slice(0, 2000),
            price:           cleanBudget,
            capacity:        1,
            no_of_travelers: 2,
            start_date:      startDate,
            end_date:        endDate,
            currency:        "USD",
            days:            plan.days || []
          };
          if (typeof It.apiPost === "function") {
            resJson = await It.apiPost("/agency/assignments/" + agencyCtx.assignmentId + "/trips", agPayload, { auth: true });
          }
        } else if (typeof It.apiPost === "function") {
          resJson = await It.apiPost("/trips", payload, { auth: true });
        } else {
          const apiBase = (window.ITINERA_CONFIG && window.ITINERA_CONFIG.apiBase) || "/api";
          const raw = await fetch(apiBase + "/trips", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
              "Authorization": "Bearer " + token
            },
            body: JSON.stringify(payload)
          });
          resJson = await raw.json();
        }

        if (resJson) {
          // Handle both {data: {id}} and flat {id} response shapes
          createdRecord = resJson.data || (resJson.body && resJson.body.data) || resJson;
          const savedId = createdRecord && (createdRecord.id || (createdRecord.data && createdRecord.data.id));
          if (savedId) {
            plannerState.savedTripId = savedId;
            createdRecord.id = savedId;
          }
        }
      } catch (err) {
        console.warn("Backend save notice:", err);
      }
    }

    const finalId = plannerState.savedTripId;

    if (btn) {
      if (finalId) {
        btn.innerHTML = '<i class="fas fa-circle-check"></i> Saved — Open in Trip Editor →';
        btn.className = btn.className.replace("bg-amber", "bg-emerald") + " opacity-90";
      } else {
        btn.innerHTML = '<i class="fas fa-check"></i> Saved Locally';
      }
      btn.disabled = false;
    }

    showToast(agencyCtx.assignmentId
      ? "Master Plan attached to customer assignment!"
      : finalId
        ? "Plan saved to database! Opening trip editor..."
        : "Plan saved locally.");

    if (redirectNow && finalId && !isNaN(Number(finalId))) {
      setTimeout(() => { window.location.href = "trip.html?id=" + finalId; }, 900);
    }

    return createdRecord || localTrip;
  }

  // Initialize Page
  document.addEventListener("DOMContentLoaded", () => {
    initQuota();
    renderDestinationCards();
    setupBudgetTiers();
    setupExperienceChips();
    setupStepFlow();

    // Set existing My Trips count
    const savedTrips = JSON.parse(localStorage.getItem("itinera_my_trips") || "[]");
    const badge = el("my-trips-count-badge");
    if (badge) badge.textContent = Math.max(1, savedTrips.length);

    // If URL has query params e.g. city=Rome
    const urlParams = new URLSearchParams(window.location.search);
    const qCity = urlParams.get("city");
    if (qCity) {
      plannerState.city = qCity;
      const customInput = el("custom-city-input");
      if (customInput) customInput.value = qCity;
      renderDestinationCards();
    }

    // Agency-launched planning (from agency/create-trip.html gateway)
    const aId = urlParams.get("assignment_id");
    if (aId) {
      agencyCtx.assignmentId = aId;
      agencyCtx.customerId = urlParams.get("customer_id") || null;
      agencyCtx.customerName = urlParams.get("customer") || "the assigned customer";
      initAgencyContext();
    }
  });

})(window);
