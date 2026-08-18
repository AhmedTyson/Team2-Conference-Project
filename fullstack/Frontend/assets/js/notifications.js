/**
 * assets/js/notifications.js — In-App Notifications Engine & Luxury UI Renderer.
 * Ensures complete extraction of notification body, title, action URLs, and type metadata.
 */
(function (global) {
  "use strict";

  const It = global.Itinera;
  if (!It) return;

  let _allNotifications = [];
  let _activeFilter = "all";

  function el(id) { return document.getElementById(id); }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Robust resolution of notification body text across all Laravel database / array schemas
   */
  function extractNotificationBody(item) {
    if (!item) return "No details provided.";
    
    // Direct top-level fields
    if (item.body && typeof item.body === "string") return item.body;
    if (item.message && typeof item.message === "string") return item.message;
    if (item.content && typeof item.content === "string") return item.content;
    
    // Nested data payload fields (Laravel DatabaseNotification standard)
    if (item.data && typeof item.data === "object") {
      if (item.data.body && typeof item.data.body === "string") return item.data.body;
      if (item.data.message && typeof item.data.message === "string") return item.data.message;
      if (item.data.content && typeof item.data.content === "string") return item.data.content;
      if (item.data.details && typeof item.data.details === "string") return item.data.details;
      if (item.data.description && typeof item.data.description === "string") return item.data.description;
      if (item.data.text && typeof item.data.text === "string") return item.data.text;
    }

    return "No details provided.";
  }

  /**
   * Extract title or fallback cleanly
   */
  function extractNotificationTitle(item) {
    if (!item) return "System Notification";
    if (item.title && typeof item.title === "string") return item.title;
    if (item.data && typeof item.data === "object") {
      if (item.data.title && typeof item.data.title === "string") return item.data.title;
      if (item.data.subject && typeof item.data.subject === "string") return item.data.subject;
    }
    if (item.type) {
      const typeParts = String(item.type).split("\\");
      const shortType = typeParts[typeParts.length - 1]
        .replace(/Notification$/, "")
        .replace(/([A-Z])/g, " $1")
        .trim();
      if (shortType) return shortType;
    }
    return "Notification";
  }

  /**
   * Extract action URL if present
   */
  function extractActionUrl(item) {
    if (!item) return null;
    if (item.action_url) return item.action_url;
    if (item.url) return item.url;
    if (item.data && typeof item.data === "object") {
      return item.data.action_url || item.data.url || item.data.link || null;
    }
    return null;
  }

  /**
   * Determine icon category & visual styling
   */
  function resolveCategory(item, title, body) {
    const combined = (title + " " + body + " " + (item.type || "")).toLowerCase();
    if (combined.includes("payment") || combined.includes("order") || combined.includes("invoice") || combined.includes("price")) {
      return { class: "payment", icon: "fa-credit-card", label: "Payment" };
    }
    if (combined.includes("booking") || combined.includes("reservation") || combined.includes("trip") || combined.includes("flight") || combined.includes("hotel")) {
      return { class: "booking", icon: "fa-suitcase-rolling", label: "Booking" };
    }
    if (combined.includes("ai") || combined.includes("itinerary") || combined.includes("concierge") || combined.includes("enhanced")) {
      return { class: "ai", icon: "fa-wand-magic-sparkles", label: "AI Concierge" };
    }
    if (combined.includes("alert") || combined.includes("warning") || combined.includes("cancelled") || combined.includes("failed")) {
      return { class: "alert", icon: "fa-triangle-exclamation", label: "Alert" };
    }
    return { class: "system", icon: "fa-circle-info", label: "System" };
  }

  /**
   * Relative time formatting ("2m ago", "1h ago", "Yesterday")
   */
  function formatTimeAgo(isoStr) {
    if (!isoStr) return "";
    const date = new Date(isoStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return Math.floor(diffSec / 60) + "m ago";
    if (diffSec < 86400) return Math.floor(diffSec / 3600) + "h ago";
    if (diffSec < 172800) return "Yesterday";
    
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + 
           " at " + 
           date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function isItemRead(item) {
    if (item.read_at !== null && item.read_at !== undefined) return true;
    if (item.is_read === true || item.is_read === 1 || item.is_read === "1") return true;
    return false;
  }

  function updateCounters() {
    const total = _allNotifications.length;
    const unread = _allNotifications.filter(function (it) { return !isItemRead(it); }).length;
    const read = total - unread;

    const countAll = el("count-all");
    const countUnread = el("count-unread");
    const countRead = el("count-read");

    if (countAll) countAll.textContent = total;
    if (countUnread) countUnread.textContent = unread;
    if (countRead) countRead.textContent = read;
  }

  function renderList() {
    const container = el("notifications-list");
    if (!container) return;

    let filtered = _allNotifications;
    if (_activeFilter === "unread") {
      filtered = _allNotifications.filter(function (it) { return !isItemRead(it); });
    } else if (_activeFilter === "read") {
      filtered = _allNotifications.filter(function (it) { return isItemRead(it); });
    }

    updateCounters();

    if (!filtered || filtered.length === 0) {
      const filterLabel = _activeFilter === "all" ? "" : " " + _activeFilter;
      container.innerHTML = `
        <div class="glass-card p-12 text-center my-6 space-y-4 rounded-2xl border border-white/10 bg-white/[0.02]">
          <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-2xl text-white/40">
            <i class="fas fa-inbox"></i>
          </div>
          <h3 class="text-lg font-bold text-white">No${filterLabel} notifications</h3>
          <p class="text-xs text-white/50 max-w-sm mx-auto leading-relaxed">
            You're all caught up! When you receive trip updates, booking confirmations, or concierge notes, they will appear here.
          </p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(function (item) {
      const read = isItemRead(item);
      const title = extractNotificationTitle(item);
      const body = extractNotificationBody(item);
      const actionUrl = extractActionUrl(item);
      const cat = resolveCategory(item, title, body);
      const timeStr = formatTimeAgo(item.created_at || item.timestamp);

      const unreadClass = read ? "" : "unread";

      const markBtn = read ? "" : `
        <button class="mark-read-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-medium text-white/80 hover:text-white transition" data-id="${item.id}">
          <i class="fas fa-check text-[10px]"></i>
          <span>Mark as read</span>
        </button>
      `;

      const actionBtn = actionUrl ? `
        <a href="${escapeHtml(actionUrl)}" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-xs font-semibold text-amber-300 transition">
          <span>View Details</span>
          <i class="fas fa-arrow-right text-[10px]"></i>
        </a>
      ` : "";

      return `
        <div class="notif-card ${unreadClass}" id="notif-card-${item.id}">
          <div class="flex items-start gap-4">
            <div class="notif-icon-box ${cat.class}">
              <i class="fas ${cat.icon}"></i>
            </div>
            
            <div class="flex-1 min-w-0 pr-4">
              <div class="flex items-center justify-between gap-2 flex-wrap mb-1">
                <div class="flex items-center gap-2">
                  <h4 class="text-base font-bold text-white tracking-tight">${escapeHtml(title)}</h4>
                  <span class="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] uppercase font-semibold text-white/50">${cat.label}</span>
                </div>
                <span class="text-xs text-white/40 font-medium">${escapeHtml(timeStr)}</span>
              </div>
              
              <!-- Notification Body Content -->
              <div class="notif-body-text">${escapeHtml(body)}</div>

              <!-- Action Bar -->
              ${(markBtn || actionBtn) ? `
                <div class="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                  ${actionBtn}
                  ${markBtn}
                </div>
              ` : ""}
            </div>
          </div>
        </div>
      `;
    }).join("");

    // Wire individual "Mark as read" click handlers
    container.querySelectorAll(".mark-read-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const id = this.getAttribute("data-id");
        markSingleAsRead(id);
      });
    });
  }

  function fetchNotifications() {
    It.apiGet("/notifications", { auth: true })
      .then(function (res) {
        let items = [];
        if (res && res.ok && res.body) {
          if (Array.isArray(res.body)) items = res.body;
          else if (res.body.data && Array.isArray(res.body.data)) items = res.body.data;
          else if (res.body.data && res.body.data.data && Array.isArray(res.body.data.data)) items = res.body.data.data;
        }
        _allNotifications = items;
        renderList();
      })
      .catch(function (err) {
        const container = el("notifications-list");
        if (container) {
          container.innerHTML = `
            <div class="glass-card p-8 text-center border border-red-500/20 bg-red-500/5 rounded-2xl space-y-2">
              <p class="text-sm font-semibold text-red-400">Failed to load notifications</p>
              <p class="text-xs text-white/50">${escapeHtml(err.message || "Network error. Please try again.")}</p>
            </div>
          `;
        }
      });
  }

  function markSingleAsRead(id) {
    if (!id) return;

    // Optimistic UI update
    const item = _allNotifications.find(function (it) { return String(it.id) === String(id); });
    if (item) {
      item.read_at = new Date().toISOString();
      item.is_read = true;
      renderList();
    }

    It.apiPatch("/notifications/" + id + "/read", null, { auth: true })
      .then(function () {
        // Updated on server
      })
      .catch(function () {
        fetchNotifications(); // Revert on failure
      });
  }

  function markAllAsRead() {
    if (!_allNotifications.length) return;

    // Optimistic UI update
    const nowIso = new Date().toISOString();
    _allNotifications.forEach(function (it) {
      it.read_at = nowIso;
      it.is_read = true;
    });
    renderList();

    It.apiPatch("/notifications/read-all", null, { auth: true })
      .then(function () {
        if (It.feedback && It.feedback.banner) {
          It.feedback.banner("All notifications marked as read", "is-ok");
        }
      })
      .catch(function () {
        fetchNotifications();
      });
  }

  function initFilters() {
    const chips = document.querySelectorAll(".filter-chip");
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("active"); });
        this.classList.add("active");
        _activeFilter = this.getAttribute("data-filter") || "all";
        renderList();
      });
    });
  }

  // Boot on page load
  document.addEventListener("DOMContentLoaded", function () {
    const markAllBtn = el("mark-all-read");
    if (markAllBtn) {
      markAllBtn.addEventListener("click", markAllAsRead);
    }
    initFilters();
    fetchNotifications();
  });

  // Expose helpers globally
  It.notifications = {
    fetch: fetchNotifications,
    extractBody: extractNotificationBody,
    extractTitle: extractNotificationTitle,
  };

})(window);
