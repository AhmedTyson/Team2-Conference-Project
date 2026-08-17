/**
 * availability.js — Schedule & Availability Controller
 * Date: 2026-08-17
 * Controls daily timeline agenda, mini calendar day grid, weekly pinned items,
 * time slots, interactive activity creation modal, and companion activity feed.
 */

(function (global) {
  "use strict";

  var It = global.Itinari || {};
  var activeTrip = null;
  var currentDayOffset = 0; // 0 = Thursday 11, -1 = Wednesday 10, +1 = Friday 12
  var baseDays = [
    { day: "Wednesday 10", date: "10 Mar 2026" },
    { day: "Thursday 11", date: "11 Mar 2026" },
    { day: "Friday 12", date: "12 Mar 2026" },
    { day: "Saturday 13", date: "13 Mar 2026" },
    { day: "Sunday 14", date: "14 Mar 2026" }
  ];
  var activeDayIdx = 1;

  function el(id) { return document.getElementById(id); }
  function esc(v) {
    if (v == null) return "";
    return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function start() {
    fetchActiveTrip();
    bindEvents();
  }

  function fetchActiveTrip() {
    var badge = el("schedTripBadge");

    if (It.apiGet) {
      It.apiGet("/trips").then(function (res) {
        var raw = res.data !== undefined ? res.data : (res.body ? (res.body.data || res.body) : res);
        var trips = Array.isArray(raw) ? raw : [];
        if (trips.length > 0) {
          activeTrip = trips[0];
          if (badge) badge.textContent = activeTrip.title || "Active Trip";
          var nameEl = el("addTripName");
          if (nameEl) nameEl.textContent = activeTrip.title;
        } else {
          if (badge) badge.textContent = "Kyoto & Tokyo Exploration";
        }
      }).catch(function () {
        if (badge) badge.textContent = "Tokyo Sakura Exploration";
      });
    } else {
      if (badge) badge.textContent = "Tokyo Sakura Exploration";
    }
  }

  function bindEvents() {
    // Prev / Next Day buttons
    var prevBtn = el("prev-day-btn");
    var nextBtn = el("next-day-btn");
    var dayLabel = el("currentDayLabel");

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        if (activeDayIdx > 0) {
          activeDayIdx--;
          if (dayLabel) dayLabel.textContent = baseDays[activeDayIdx].day;
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        if (activeDayIdx < baseDays.length - 1) {
          activeDayIdx++;
          if (dayLabel) dayLabel.textContent = baseDays[activeDayIdx].day;
        }
      });
    }

    // Modal Triggers
    var modal = el("add-activity-modal");
    var openBtn = el("open-add-modal-btn");
    var closeBtn = el("close-activity-modal-btn");
    var form = el("activity-form");

    if (openBtn && modal) {
      openBtn.addEventListener("click", function () {
        modal.classList.remove("hidden");
      });
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener("click", function () {
        modal.classList.add("hidden");
      });
    }

    if (form) {
      form.addEventListener("submit", function (ev) {
        ev.preventDefault();
        var title = el("act-title").value;
        var time = el("act-time").value || "4:00 PM";
        var category = el("act-category").value;
        var notes = el("act-notes").value;

        addActivityToTimeline(title, time, category, notes);
        form.reset();
        if (modal) modal.classList.add("hidden");
        if (global.ItinariToast) global.ItinariToast("✨ Activity added to schedule!", "success");
      });
    }

    // Mini Calendar Days Selection
    var calendarContainer = el("miniCalendarDays");
    if (calendarContainer) {
      calendarContainer.querySelectorAll("span").forEach(function (span) {
        span.addEventListener("click", function () {
          calendarContainer.querySelectorAll("span").forEach(function (s) {
            s.className = "p-1.5 text-gray-700 dark:text-white/80 cursor-pointer hover:bg-amber-500/20 rounded-full transition";
          });
          span.className = "p-1.5 rounded-full bg-amber-500 text-black font-black shadow-md cursor-pointer";
        });
      });
    }
  }

  function addActivityToTimeline(title, time, category, notes) {
    var timeline = el("scheduleTimeline");
    if (!timeline) return;

    var categoryIcons = {
      personal: "fa-user",
      sightseeing: "fa-camera",
      dining: "fa-utensils",
      flight: "fa-plane"
    };

    var iconCls = categoryIcons[category] || "fa-clock";

    var cardHtml = '<div class="p-5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-between gap-4 animate-fade-in">' +
      '<div class="flex items-center gap-3">' +
        '<span class="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center text-xs font-black"><i class="fas ' + iconCls + '"></i></span>' +
        '<div>' +
          '<strong class="font-black text-sm text-gray-900 dark:text-white block">' + esc(title) + '</strong>' +
          '<span class="text-[11px] text-gray-400">' + esc(notes || "Added activity") + '</span>' +
        '</div>' +
      '</div>' +
      '<span class="px-3 py-1 rounded-full bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white/80 font-bold text-[11px]">' + esc(time) + '</span>' +
    '</div>';

    timeline.insertAdjacentHTML("afterbegin", cardHtml);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

})(window);
