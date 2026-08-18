/**
 * surveys.js — Complete Customer Travel Surveys Controller
 * Drives app/surveys.html with live API integration (/surveys & /v1/surveys),
 * interactive interest pill checkboxes + custom interest additions,
 * strict backend BudgetLevel enum validation (low, medium, high, luxury),
 * budget filter pills, search bar, creation modal, and 5-second undo toast queue.
 */
(function (global) {
  "use strict";

  const It = global.Itinera;

  let allSurveys = [];
  let currentBudgetFilter = "all";
  let currentSearchQuery = "";
  let selectedInterestsSet = new Set();

  function el(id) {
    return document.getElementById(id);
  }

  function esc(s) {
    if (!s) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatBudgetLevel(b) {
    const s = String(b || "").toLowerCase();
    if (s === "low" || s === "budget") return "Low Budget";
    if (s === "medium" || s === "moderate") return "Medium";
    if (s === "high") return "High";
    if (s === "luxury") return "Luxury";
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : "Standard";
  }

  function getBudgetBadgeClass(b) {
    const s = String(b || "").toLowerCase();
    if (s === "luxury") return "bg-amber-400/15 border-amber-400/30 text-amber-400";
    if (s === "high") return "bg-purple-400/15 border-purple-400/30 text-purple-400";
    if (s === "low" || s === "budget") return "bg-emerald-400/15 border-emerald-400/30 text-emerald-400";
    return "bg-sky-400/15 border-sky-400/30 text-sky-400";
  }

  function renderSelectedInterestTags() {
    const container = el("selected-interests-tags");
    const hiddenInput = el("modal-interests");
    if (!container) return;

    const list = Array.from(selectedInterestsSet);
    if (hiddenInput) hiddenInput.value = list.join(",");

    if (!list.length) {
      container.innerHTML = '<span class="text-xs text-white/30 self-center italic px-1" id="no-interests-placeholder">No interests selected yet — pick chips above or add custom ones.</span>';
      return;
    }

    container.innerHTML = list.map(function (tag) {
      return '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-semibold">' +
        esc(tag) +
        '<button type="button" class="remove-tag-btn hover:text-white text-xs cursor-pointer ml-1" data-tag="' + esc(tag) + '">&times;</button>' +
        '</span>';
    }).join("");

    container.querySelectorAll(".remove-tag-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const tag = btn.dataset.tag;
        selectedInterestsSet.delete(tag);
        syncChipStyles();
        renderSelectedInterestTags();
      });
    });
  }

  function syncChipStyles() {
    document.querySelectorAll(".interest-chip").forEach(function (chip) {
      const val = chip.dataset.value;
      if (selectedInterestsSet.has(val)) {
        chip.classList.remove("bg-white/5", "border-white/10", "text-white/70");
        chip.classList.add("bg-amber-400", "border-amber-400", "text-black", "font-bold");
      } else {
        chip.classList.remove("bg-amber-400", "border-amber-400", "text-black", "font-bold");
        chip.classList.add("bg-white/5", "border-white/10", "text-white/70");
      }
    });
  }

  function setupInterestChips() {
    document.querySelectorAll(".interest-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        const val = chip.dataset.value;
        if (selectedInterestsSet.has(val)) {
          selectedInterestsSet.delete(val);
        } else {
          selectedInterestsSet.add(val);
        }
        syncChipStyles();
        renderSelectedInterestTags();
      });
    });

    const customInput = el("custom-interest-input");
    const addBtn = el("add-custom-interest-btn");

    function addCustom() {
      if (!customInput) return;
      const val = customInput.value.trim();
      if (val) {
        selectedInterestsSet.add(val);
        customInput.value = "";
        syncChipStyles();
        renderSelectedInterestTags();
      }
    }

    if (addBtn) addBtn.addEventListener("click", addCustom);
    if (customInput) {
      customInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          addCustom();
        }
      });
    }
  }

  function fetchSurveys() {
    const apiCall = (It.api && It.api.get)
      ? It.api.get("/surveys", { auth: true })
      : (It.apiGet ? It.apiGet("/surveys", { auth: true }) : Promise.reject("No API client"));

    apiCall.then(function (res) {
      let data = res.body ? (res.body.data || res.body) : res;
      if (data && data.data && Array.isArray(data.data)) {
        data = data.data;
      }
      allSurveys = Array.isArray(data) ? data : [];
      renderStats();
      renderGrid();
    }).catch(function (err) {
      console.warn("Retrying /v1/surveys fallback...", err);
      const fallbackCall = (It.api && It.api.get)
        ? It.api.get("/v1/surveys", { auth: true })
        : (It.apiGet ? It.apiGet("/v1/surveys", { auth: true }) : Promise.reject(err));

      fallbackCall.then(function (res) {
        let data = res.body ? (res.body.data || res.body) : res;
        if (data && data.data && Array.isArray(data.data)) {
          data = data.data;
        }
        allSurveys = Array.isArray(data) ? data : [];
        renderStats();
        renderGrid();
      }).catch(function (fatal) {
        console.error("Failed to load surveys:", fatal);
        const grid = el("survey-grid");
        if (grid) {
          grid.innerHTML =
            '<div class="col-span-full p-8 text-center bg-[#12141c] border border-red-500/20 rounded-3xl space-y-4">' +
            '<i class="fas fa-exclamation-circle text-3xl text-red-400"></i>' +
            '<p class="text-sm font-semibold text-white">Could not load your travel surveys.</p>' +
            '<button type="button" onclick="location.reload()" class="px-5 py-2 rounded-full bg-amber-400 text-black font-bold text-xs">Retry</button>' +
            '</div>';
        }
      });
    });
  }

  function renderStats() {
    const statsContainer = el("survey-stats");
    if (!statsContainer) return;

    if (!allSurveys.length) {
      statsContainer.classList.add("hidden");
      return;
    }

    statsContainer.classList.remove("hidden");
    const countEl = el("stat-count");
    const styleEl = el("stat-style");
    const budgetEl = el("stat-budget");

    if (countEl) countEl.textContent = allSurveys.length;

    const styleCounts = {};
    const budgetCounts = {};

    allSurveys.forEach(function (s) {
      if (s.travel_style) styleCounts[s.travel_style] = (styleCounts[s.travel_style] || 0) + 1;
      if (s.budget_level) budgetCounts[s.budget_level] = (budgetCounts[s.budget_level] || 0) + 1;
    });

    const topStyle = Object.keys(styleCounts).sort(function (a, b) { return styleCounts[b] - styleCounts[a]; })[0] || "—";
    const topBudgetRaw = Object.keys(budgetCounts).sort(function (a, b) { return budgetCounts[b] - budgetCounts[a]; })[0] || "—";

    if (styleEl) styleEl.textContent = topStyle;
    if (budgetEl) budgetEl.textContent = formatBudgetLevel(topBudgetRaw);
  }

  function renderGrid() {
    const grid = el("survey-grid");
    if (!grid) return;

    let filtered = allSurveys.filter(function (s) {
      if (currentBudgetFilter !== "all") {
        const b = String(s.budget_level).toLowerCase();
        if (currentBudgetFilter === "low" && (b !== "low" && b !== "budget")) return false;
        if (currentBudgetFilter === "medium" && (b !== "medium" && b !== "moderate")) return false;
        if (currentBudgetFilter === "high" && b !== "high") return false;
        if (currentBudgetFilter === "luxury" && b !== "luxury") return false;
      }
      if (currentSearchQuery) {
        const q = currentSearchQuery.toLowerCase();
        const styleMatch = String(s.travel_style || "").toLowerCase().indexOf(q) !== -1;
        const interestMatch = Array.isArray(s.interests) && s.interests.some(function (i) { return String(i).toLowerCase().indexOf(q) !== -1; });
        return styleMatch || interestMatch;
      }
      return true;
    });

    if (!filtered.length) {
      grid.innerHTML =
        '<div class="col-span-full p-12 text-center bg-[#12141c] border border-white/10 rounded-3xl space-y-4">' +
        '<div class="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 mx-auto flex items-center justify-center text-2xl">' +
        '<i class="fas fa-clipboard-check"></i>' +
        '</div>' +
        '<h3 class="text-xl font-bold text-white">' + (currentSearchQuery || currentBudgetFilter !== "all" ? "No Matching Surveys Found" : "No Surveys Recorded Yet") + '</h3>' +
        '<p class="text-xs text-white/50 max-w-md mx-auto">' + (currentSearchQuery || currentBudgetFilter !== "all" ? "Try clearing search filters or selecting a different budget tier." : "Complete your first travel survey to help us tailor your ideal trips.") + '</p>' +
        '<button type="button" id="empty-create-btn" class="px-6 py-2.5 rounded-full bg-amber-400 text-black font-bold text-xs shadow-lg hover:bg-amber-300 transition cursor-pointer">' +
        '<i class="fas fa-plus mr-1.5"></i> Complete New Survey' +
        '</button>' +
        '</div>';

      const emptyBtn = el("empty-create-btn");
      if (emptyBtn) emptyBtn.addEventListener("click", openModal);
      return;
    }

    grid.innerHTML = filtered.map(function (s) {
      const createdDate = s.created_at ? new Date(s.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "—";
      const budgetBadgeCls = getBudgetBadgeClass(s.budget_level);
      const budgetLabel = formatBudgetLevel(s.budget_level);

      const interestsList = Array.isArray(s.interests) ? s.interests : (typeof s.interests === "string" ? s.interests.split(",") : []);

      return '<div class="rounded-3xl bg-[#12141c] border border-white/10 p-6 flex flex-col justify-between hover:border-amber-400/40 transition-all duration-300 shadow-xl group relative overflow-hidden" data-id="' + s.id + '">' +
        '<div class="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-full blur-3xl group-hover:bg-amber-400/10 transition-all"></div>' +
        '<div>' +
        '<div class="flex items-center justify-between gap-2 mb-4">' +
        '<span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ' + budgetBadgeCls + '">' + esc(budgetLabel) + '</span>' +
        '<span class="text-[11px] text-white/40 font-medium"><i class="far fa-calendar-alt mr-1"></i>' + esc(createdDate) + '</span>' +
        '</div>' +
        '<h3 class="text-xl font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-2 mb-2">' +
        '<i class="fas fa-compass text-amber-400 text-sm"></i> ' + esc(s.travel_style || "Travel Survey") +
        '</h3>' +
        '<div class="flex flex-wrap gap-1.5 mt-4">' +
        interestsList.map(function (tag) {
          return '<span class="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-white/70 font-medium"><i class="fas fa-tag text-[9px] text-amber-400/70 mr-1"></i>' + esc(String(tag).trim()) + '</span>';
        }).join("") +
        '</div>' +
        '</div>' +
        '<div class="flex items-center justify-between gap-3 pt-6 mt-6 border-t border-white/10">' +
        '<span class="text-xs text-white/40 font-mono">Survey #' + s.id + '</span>' +
        '<div class="flex items-center gap-2">' +
        '<button type="button" class="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold transition cursor-pointer delete-survey-btn" data-id="' + s.id + '" title="Delete Survey">' +
        '<i class="fas fa-trash-alt"></i>' +
        '</button>' +
        '</div>' +
        '</div>' +
        '</div>';
    }).join("");

    grid.querySelectorAll(".delete-survey-btn").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        const id = Number(btn.dataset.id);
        deleteSurvey(id);
      });
    });
  }

  function deleteSurvey(id) {
    const surveyObj = allSurveys.find(function (s) { return Number(s.id) === id; });
    if (!surveyObj) return;

    allSurveys = allSurveys.filter(function (s) { return Number(s.id) !== id; });
    renderStats();
    renderGrid();

    pushUndoToast("Survey #" + id + " queued for deletion.", function () {
      allSurveys.push(surveyObj);
      renderStats();
      renderGrid();
    }, function () {
      const deleteApi = (It.api && It.api.delete)
        ? It.api.delete("/surveys/" + id, { auth: true })
        : (It.apiDelete ? It.apiDelete("/surveys/" + id, { auth: true }) : Promise.resolve());

      deleteApi.catch(function () {
        const fallbackDelete = (It.api && It.api.delete)
          ? It.api.delete("/v1/surveys/" + id, { auth: true })
          : Promise.resolve();
        fallbackDelete.catch(function (e) { console.error("Delete failed", e); });
      });
    });
  }

  function pushUndoToast(message, onUndo, onCommit) {
    let toast = document.createElement("div");
    toast.className = "fixed bottom-6 right-6 z-50 bg-[#12141c] border border-amber-400/40 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-4 text-xs font-medium animate-slide-up";

    let remaining = 5;
    toast.innerHTML =
      '<span>' + esc(message) + '</span>' +
      '<button type="button" class="undo-btn px-3 py-1 rounded-full bg-amber-400 text-black font-bold text-[11px] hover:bg-amber-300 transition cursor-pointer">Undo (' + remaining + 's)</button>';

    document.body.appendChild(toast);

    let undone = false;
    let timer = setInterval(function () {
      remaining--;
      if (remaining <= 0) {
        clearInterval(timer);
        if (!undone) {
          toast.remove();
          if (onCommit) onCommit();
        }
      } else {
        const btn = toast.querySelector(".undo-btn");
        if (btn) btn.textContent = "Undo (" + remaining + "s)";
      }
    }, 1000);

    toast.querySelector(".undo-btn").addEventListener("click", function () {
      undone = true;
      clearInterval(timer);
      toast.remove();
      if (onUndo) onUndo();
    });
  }

  function openModal() {
    const modal = el("survey-modal-backdrop");
    if (modal) modal.classList.remove("hidden");
  }

  function closeModal() {
    const modal = el("survey-modal-backdrop");
    if (modal) modal.classList.add("hidden");
    selectedInterestsSet.clear();
    syncChipStyles();
    renderSelectedInterestTags();
  }

  function setupEvents() {
    const openBtn = el("open-survey-modal-btn");
    const closeBtn = el("close-survey-modal-btn");
    const cancelBtn = el("cancel-survey-modal-btn");
    const modalBackdrop = el("survey-modal-backdrop");
    const createForm = el("create-survey-form");
    const searchInp = el("survey-search-input");
    const filterPills = document.querySelectorAll(".filter-pill");

    setupInterestChips();

    if (openBtn) openBtn.addEventListener("click", openModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

    if (modalBackdrop) {
      modalBackdrop.addEventListener("click", function (e) {
        if (e.target === modalBackdrop) closeModal();
      });
    }

    if (searchInp) {
      searchInp.addEventListener("input", function () {
        currentSearchQuery = searchInp.value.trim();
        renderGrid();
      });
    }

    filterPills.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterPills.forEach(function (p) {
          p.classList.remove("bg-amber-400", "text-black", "font-bold", "shadow-md");
          p.classList.add("bg-white/5", "hover:bg-white/10", "border", "border-white/10", "text-white/70", "font-semibold");
        });

        btn.classList.remove("bg-white/5", "hover:bg-white/10", "border", "border-white/10", "text-white/70", "font-semibold");
        btn.classList.add("bg-amber-400", "text-black", "font-bold", "shadow-md");

        currentBudgetFilter = btn.dataset.budget || "all";
        renderGrid();
      });
    });

    if (createForm) {
      createForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const style = el("modal-travel-style").value.trim();
        const budget = el("modal-budget-level").value;
        const hiddenInterests = el("modal-interests").value.trim();

        const interests = hiddenInterests ? hiddenInterests.split(",").map(function (s) { return s.trim(); }).filter(Boolean) : [];

        if (!interests.length) {
          alert("Please select at least one interest tag or add a custom one.");
          return;
        }

        const payload = {
          travel_style: style,
          budget_level: budget,
          interests: interests
        };

        const postApi = (It.api && It.api.post)
          ? It.api.post("/surveys", payload, { auth: true })
          : (It.apiPost ? It.apiPost("/surveys", payload, { auth: true }) : Promise.reject());

        postApi.then(function (res) {
          closeModal();
          createForm.reset();
          fetchSurveys();
        }).catch(function (err) {
          const fallbackPost = (It.api && It.api.post)
            ? It.api.post("/v1/surveys", payload, { auth: true })
            : Promise.reject(err);

          fallbackPost.then(function () {
            closeModal();
            createForm.reset();
            fetchSurveys();
          }).catch(function (fatal) {
            alert("Could not create survey. Please check field requirements.");
          });
        });
      });
    }
  }

  function init() {
    setupEvents();
    if (global.Itinera && global.Itinera.session && global.Itinera.session.hasToken()) {
      fetchSurveys();
    } else {
      document.addEventListener("itinera:ready", function () {
        fetchSurveys();
      });
      setTimeout(fetchSurveys, 100);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
