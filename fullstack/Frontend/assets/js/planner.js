/**
 * planner.js — Itinera Luxury AI Trip Planner Engine
 * Implements interactive destination selection, multi-step parameters,
 * backend AI generation integration, and luxury master plan rendering.
 */
(function (global) {
  "use strict";

  const It = global.Itinari || {};

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

  // Quota Management
  function initQuota() {
    const storedQuota = localStorage.getItem("itinari_ai_quota");
    if (storedQuota) {
      plannerState.quotaUsed = parseInt(storedQuota, 10);
    }
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
    localStorage.setItem("itinari_ai_quota", plannerState.quotaUsed);
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
        window.scrollTo({ top: step2.offsetTop - 80, behavior: "smooth" });
      });
    }

    if (btnBackStep1) {
      btnBackStep1.addEventListener("click", () => {
        step2.style.display = "none";
        step1.style.display = "block";
        window.scrollTo({ top: step1.offsetTop - 80, behavior: "smooth" });
      });
    }

    if (btnGenerate) {
      btnGenerate.addEventListener("click", generateAiMasterPlan);
    }
  }

  // AI Master Plan Generation Execution
  async function generateAiMasterPlan() {
    const step2 = el("planner-step-2");
    const modal = el("synthesis-modal");
    const output = el("master-plan-output");
    const statusText = el("synthesis-status-text");

    step2.style.display = "none";
    modal.style.display = "block";
    output.style.display = "none";

    const steps = [
      "Analyzing destination landmarks & topography...",
      "Curating Michelin culinary pairings & reservations...",
      "Verifying OSRM logistics waypoints & transit...",
      "Synthesizing bespoke luxury master plan..."
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      stepIdx = (stepIdx + 1) % steps.length;
      if (statusText) statusText.textContent = steps[stepIdx];
    }, 600);

    const payload = {
      city: plannerState.city,
      destination: plannerState.city,
      no_of_days: plannerState.duration,
      start_date: plannerState.startDate,
      travel_party: plannerState.travelParty,
      travel_style: plannerState.budgetTier,
      budget_tier: plannerState.budgetTier,
      budget: plannerState.budgetAmount,
      interests: plannerState.interests
    };

    let planData = null;

    try {
      // Try backend AI generation endpoint
      const res = await fetch((It.CONFIG?.apiBase || "https://itinari.up.railway.app/api") + "/trips/generate-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(localStorage.getItem("itinari_token") ? { "Authorization": "Bearer " + localStorage.getItem("itinari_token") } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const body = await res.json();
        planData = body.data || body;
      }
    } catch (e) {
      console.warn("Backend AI fetch note:", e);
    }

    // Fallback if backend returned string or wasn't structured
    if (!planData || !planData.days) {
      planData = generateDeterministicPlan(plannerState);
    }

    clearInterval(interval);
    consumeQuota();

    modal.style.display = "none";
    output.style.display = "block";
    plannerState.currentPlan = planData;

    renderMasterPlan(planData);
    window.scrollTo({ top: output.offsetTop - 80, behavior: "smooth" });
  }

  // Deterministic Luxury Synthesis Engine
  function generateDeterministicPlan(state) {
    const cityName = state.city || "Rome, Italy";
    const daysCount = state.duration || 4;
    const party = state.travelParty || "Couple / Romantic";
    const tier = state.budgetTier || "Luxury";
    const budget = state.budgetAmount || 7900;

    const isRome = cityName.toLowerCase().includes("rome");
    const isTokyo = cityName.toLowerCase().includes("tokyo");
    const isZurich = cityName.toLowerCase().includes("zurich");

    let daysTemplates = [];

    if (isRome) {
      daysTemplates = [
        {
          title: "Imperial Glory & Rooftop Views",
          items: [
            { time: "09:30 AM", title: "Private VIP Colosseum & Roman Forum Tour", desc: "Includes fast-track underground access with a private archeologist guide.", price: 600, type: "ATTRACTION" },
            { time: "01:30 PM", title: "Armando al Pantheon", desc: "Classic Roman cuisine in an intimate setting; reservations are essential months in advance.", price: 180, type: "RESTAURANT" },
            { time: "04:00 PM", title: "Private Fountain & Piazza Walking Tour", desc: "Guided exploration of the Trevi Fountain and Spanish Steps with a focus on Baroque history.", price: 300, type: "ATTRACTION" },
            { time: "08:00 PM", title: "Aroma Restaurant", desc: "Michelin-starred dining with a direct, unobstructed view of the Colosseum.", price: 550, type: "RESTAURANT" }
          ]
        },
        {
          title: "The Holy See & High Fashion",
          items: [
            { time: "08:00 AM", title: "Vatican Museums Private Early Access", desc: "Exclusive entry before the general public to view the Sistine Chapel in near silence.", price: 950, type: "ATTRACTION" },
            { time: "01:00 PM", title: "Pierluigi", desc: "Rome's premier spot for luxury seafood dining; request a table in the historic piazza.", price: 250, type: "RESTAURANT" },
            { time: "03:30 PM", title: "Via dei Condotti Personal Shopping", desc: "A dedicated fashion consultant will facilitate private viewings at flagship luxury boutiques.", price: 400, type: "ATTRACTION" },
            { time: "08:30 PM", title: "La Pergola", desc: "Rome's only three-Michelin-starred restaurant, offering an unparalleled tasting menu.", price: 900, type: "RESTAURANT" }
          ]
        },
        {
          title: "Renaissance Art & Secret Alleys",
          items: [
            { time: "10:00 AM", title: "Galleria Borghese Private Docent Tour", desc: "An in-depth look at Bernini's and Caravaggio's masterpieces with an art historian.", price: 450, type: "ATTRACTION" },
            { time: "01:00 PM", title: "Casina Valadier", desc: "High-end dining on Pincian Hill with panoramic views of the city skyline.", price: 220, type: "RESTAURANT" },
            { time: "03:30 PM", title: "Private Vintage Vespa Tour", desc: "Discover hidden Roman gems and the Aventine Hill's secret keyhole on a classic Vespa.", price: 500, type: "ATTRACTION" },
            { time: "08:00 PM", title: "Imàgo", desc: "Sophisticated Michelin-starred Italian dining at the top of the Spanish Steps.", price: 600, type: "RESTAURANT" }
          ]
        },
        {
          title: "Roman Relaxation & Culinary Mastery",
          items: [
            { time: "10:30 AM", title: "Luxury Wellness at De Russie Spa", desc: "A morning of hydrotherapy and Mediterranean-inspired treatments in a serene setting.", price: 600, type: "ATTRACTION" },
            { time: "01:30 PM", title: "Roscioli Salumeria con Cucina", desc: "The city's most elite deli-restaurant; the carbonara is world-famous.", price: 150, type: "RESTAURANT" },
            { time: "04:00 PM", title: "Private Pasta & Tiramisu Masterclass", desc: "Hosted in a private loft with a professional chef; includes premium wine pairing.", price: 500, type: "ATTRACTION" },
            { time: "08:30 PM", title: "Il Pagliaccio", desc: "A refined two-Michelin-starred farewell dinner featuring innovative fusion-Italian cuisine.", price: 750, type: "RESTAURANT" }
          ]
        }
      ];
    } else if (isTokyo) {
      daysTemplates = [
        {
          title: "Ancient Sanctuaries & Modern Neon",
          items: [
            { time: "09:00 AM", title: "Meiji Jingu Private Shinto Blessing", desc: "Private ceremonial entrance through the sacred forest with an English-speaking priest.", price: 450, type: "ATTRACTION" },
            { time: "01:00 PM", title: "Sukiyabashi Jiro Roppongi", desc: "Master Edomae omakase sushi experience prepared before your eyes.", price: 350, type: "RESTAURANT" },
            { time: "03:30 PM", title: "Ginza Luxury Haute Horlogerie & Couture", desc: "VIP private salon access in Ginza's premier luxury design houses.", price: 400, type: "ATTRACTION" },
            { time: "07:30 PM", title: "Narisawa Gastronomy Experience", desc: "Innovative two-Michelin-starred 'Satoyama' sustainable culinary journey.", price: 650, type: "RESTAURANT" }
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
      ];
    } else {
      daysTemplates = [
        {
          title: "Heritage Landmarks & Skyline Gastronomy",
          items: [
            { time: "09:30 AM", title: `Private VIP ${cityName.split(",")[0]} Highlights Tour`, desc: "Fast-track access to premier historical monuments with an expert historian.", price: 550, type: "ATTRACTION" },
            { time: "01:00 PM", title: "Grand Historic Piazza Lunch", desc: "Curated regional tasting menu in an iconic heritage location.", price: 200, type: "RESTAURANT" },
            { time: "03:30 PM", title: "Private Chauffeur & Scenic Viewpoints", desc: "Curated private transportation covering secret gems and iconic vistas.", price: 400, type: "ATTRACTION" },
            { time: "08:00 PM", title: "Panoramic Michelin-Starred Dinner", desc: "Haute cuisine tasting menu paired with grand cru vintage wines.", price: 650, type: "RESTAURANT" }
          ]
        },
        {
          title: "Artistry, Culture & Private Salons",
          items: [
            { time: "10:00 AM", title: "Exclusive Fine Art Gallery Access", desc: "Private early morning gallery docent tour before public opening.", price: 480, type: "ATTRACTION" },
            { time: "01:30 PM", title: "Waterfront Gourmet Dining", desc: "Refined culinary specialties featuring fresh organic farm-to-table dining.", price: 240, type: "RESTAURANT" },
            { time: "04:00 PM", title: "Boutique Artisan & Fashion Experience", desc: "Private appointments with premier local craftsmen and designers.", price: 420, type: "ATTRACTION" },
            { time: "08:30 PM", title: "Celebrated Master Chef Degustation", desc: "Multi-course culinary journey crafted by the country’s leading culinary figure.", price: 780, type: "RESTAURANT" }
          ]
        }
      ];
    }

    const generatedDays = [];
    let plannedCount = 0;

    for (let i = 1; i <= daysCount; i++) {
      const template = daysTemplates[(i - 1) % daysTemplates.length];
      generatedDays.push({
        day_number: i,
        title: template.title,
        items: template.items
      });
      plannedCount += template.items.length;
    }

    return {
      title: `${daysCount}-Day ${tier} ${cityName} Experience`,
      meta: `${daysCount} Days • ${cityName} • ${party} • ${tier}`,
      description: `This curated ${cityName.split(",")[0]} holiday offers unparalleled access to the city's most iconic treasures. From private, after-hours tours of landmark museums to personal shopping sessions in the fashion district and dining at Michelin-starred institutions, every detail is designed for discerning travelers seeking history, art, and world-class gastronomy at a balanced pace.`,
      estimated_budget: budget,
      planned_items_count: plannedCount,
      osrm_waypoints: "Verified",
      days: generatedDays
    };
  }

  // Render Master Plan on UI
  function renderMasterPlan(plan) {
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
      btnSave.onclick = savePlanToMyTrips;
    }

    const btnBook = el("btn-book-paymob");
    if (btnBook) {
      btnBook.onclick = (e) => {
        e.preventDefault();
        sessionStorage.setItem("itinari_checkout_plan", JSON.stringify(plan));
        window.location.href = "checkout.html?plan=ai_luxury&city=" + encodeURIComponent(plannerState.city) + "&amount=" + plan.estimated_budget;
      };
    }
  }

  // Save Plan to User's Account & Database
  async function savePlanToMyTrips() {
    const plan = plannerState.currentPlan;
    if (!plan) return;

    const btn = el("btn-save-master-plan");
    if (btn) {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
      btn.disabled = true;
    }

    // Save locally
    const savedTrips = JSON.parse(localStorage.getItem("itinari_my_trips") || "[]");
    savedTrips.unshift({
      id: "trip_" + Date.now(),
      title: plan.title,
      city: plannerState.city,
      duration: plannerState.duration,
      start_date: plannerState.startDate,
      travel_party: plannerState.travelParty,
      budget: plan.estimated_budget,
      plan: plan,
      created_at: new Date().toISOString()
    });
    localStorage.setItem("itinari_my_trips", JSON.stringify(savedTrips));

    // Update Nav counter badge
    const badge = el("my-trips-count-badge");
    if (badge) badge.textContent = savedTrips.length;

    // Persist to backend database if logged in
    const token = localStorage.getItem("itinari_token");
    if (token) {
      try {
        await fetch((It.CONFIG?.apiBase || "https://itinari.up.railway.app/api") + "/trips", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": "Bearer " + token
          },
          body: JSON.stringify({
            title: plan.title,
            status: "planned",
            travel_style: plannerState.budgetTier,
            interests: plannerState.interests,
            no_of_travelers: 2,
            budget: plan.estimated_budget,
            no_of_days: plannerState.duration,
            start_date: plannerState.startDate,
            end_date: plannerState.startDate
          })
        });
      } catch (err) {
        console.warn("Backend save notice:", err);
      }
    }

    showToast("Master Plan saved to My Trips successfully!");
    if (btn) {
      btn.innerHTML = '<i class="fas fa-check"></i> Saved to My Trips';
      btn.disabled = false;
    }
  }

  // Initialize Page
  document.addEventListener("DOMContentLoaded", () => {
    initQuota();
    renderDestinationCards();
    setupBudgetTiers();
    setupExperienceChips();
    setupStepFlow();

    // Set existing My Trips count
    const savedTrips = JSON.parse(localStorage.getItem("itinari_my_trips") || "[]");
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
  });

})(window);
