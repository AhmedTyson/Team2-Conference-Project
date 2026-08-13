/**
 * admin-activity.js v1 — Recent activity feed for the dashboard.
 * Pulls from GET /v1/admin/reviews and GET /v1/admin/contacts,
 * merges, sorts by created_at descending, renders top 8 events.
 * Mounts into #activity-feed.
 */
(function (global) {
  "use strict";

  var It = global.Itinari;
  var HOST = document.getElementById("activity-feed");

  if (!HOST) return;

  // ── skeleton ──────────────────────────────────────────────────────────────
  function showSkeleton() {
    HOST.textContent = "";
    var ul = document.createElement("ul");
    ul.className = "activity-feed";
    for (var i = 0; i < 5; i++) {
      var li = document.createElement("li");
      li.className = "activity-item";
      li.innerHTML =
        '<span class="activity-dot"></span>' +
        '<div class="activity-body">' +
          '<div class="skeleton" style="height:0.8rem;width:70%;border-radius:4px;"></div>' +
          '<div class="skeleton" style="height:0.65rem;width:40%;border-radius:4px;margin-top:0.35rem;"></div>' +
        '</div>';
      ul.appendChild(li);
    }
    HOST.appendChild(ul);
  }

  // ── format relative time ──────────────────────────────────────────────────
  function reltime(dateStr) {
    if (!dateStr) return "";
    var d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    var diffMs = Date.now() - d.getTime();
    var diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return diffMin + "m ago";
    var diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return diffH + "h ago";
    var diffD = Math.floor(diffH / 24);
    return diffD + "d ago";
  }

  // ── render feed ───────────────────────────────────────────────────────────
  function renderFeed(events) {
    HOST.textContent = "";
    if (!events.length) {
      var empty = document.createElement("div");
      empty.className = "kit-empty";
      empty.style.padding = "var(--space-4) var(--space-5)";
      empty.textContent = "No recent activity.";
      HOST.appendChild(empty);
      return;
    }

    var ul = document.createElement("ul");
    ul.className = "activity-feed";

    events.slice(0, 8).forEach(function (ev) {
      var li = document.createElement("li");
      li.className = "activity-item";

      var dot = document.createElement("span");
      dot.className = "activity-dot" + (ev.type === "review" ? " is-review" : " is-contact");

      var body = document.createElement("div");
      body.className = "activity-body";

      var text = document.createElement("div");
      text.className = "activity-text";
      text.textContent = ev.label;
      text.title = ev.label;

      var meta = document.createElement("div");
      meta.className = "activity-meta";
      meta.textContent = ev.typeLabel + " · " + reltime(ev.created_at);

      body.appendChild(text);
      body.appendChild(meta);
      li.appendChild(dot);
      li.appendChild(body);
      ul.appendChild(li);
    });

    HOST.appendChild(ul);
  }

  // ── normalise API list responses (handles { data:[…] } and {data:{data:[…]}}) ─
  function extractList(body) {
    if (!body) return [];
    var d = body.data;
    if (Array.isArray(d)) return d;
    if (d && Array.isArray(d.data)) return d.data;
    return [];
  }

  // ── load ──────────────────────────────────────────────────────────────────
  function load() {
    showSkeleton();
    Promise.all([
      It.apiGet("/v1/admin/reviews?per_page=20", { auth: true }),
      It.apiGet("/v1/admin/contacts?per_page=20", { auth: true })
    ]).then(function (results) {
      var events = [];

      if (results[0].ok) {
        extractList(results[0].body).forEach(function (r) {
          var who = (r.user && r.user.name) ? r.user.name : "Someone";
          var target = r.reviewable_type
            ? r.reviewable_type.replace(/.*\\/, "")
            : "entity";
          events.push({
            type: "review",
            typeLabel: "Review",
            label: who + " left a " + (r.rating ? r.rating + "-star " : "") + "review on " + target,
            created_at: r.created_at
          });
        });
      }

      if (results[1].ok) {
        extractList(results[1].body).forEach(function (c) {
          var who = c.name || c.email || "Visitor";
          var sub = c.subject ? ": " + c.subject : "";
          events.push({
            type: "contact",
            typeLabel: "Contact",
            label: who + " sent a message" + sub,
            created_at: c.created_at
          });
        });
      }

      // Sort newest first
      events.sort(function (a, b) {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });

      renderFeed(events);
    }).catch(function () {
      HOST.textContent = "";
      var err = document.createElement("div");
      err.className = "kit-error";
      err.style.padding = "var(--space-4) var(--space-5)";
      err.textContent = "Could not load activity.";
      HOST.appendChild(err);
    });
  }

  // ── boot after DOMContentLoaded (dashboard.js already handles auth guard) ─
  // We wait for the 'itinari:ready' custom event that admin-dashboard fires,
  // or fall back to a short delay.
  function tryLoad() {
    if (It && It.session && It.session.hasToken && It.session.hasToken()) {
      load();
    } else {
      setTimeout(tryLoad, 400);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Small delay so admin-dashboard boots first and validates auth.
    setTimeout(tryLoad, 600);
  });
})(window);
