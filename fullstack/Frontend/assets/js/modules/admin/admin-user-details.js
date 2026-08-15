/**
 * admin-user-details.js v1 — View user specifics.
 * Route shape: GET /v1/admin/users/{id}
 */
(function (global) {
  "use strict";

  const It = global.Itinari;

  function el(id) { return document.getElementById(id); }

  function getQueryParam(param) {
    const params = new URLSearchParams(window.location.search);
    return params.get(param);
  }

  function renderProfile(user) {
    const chip = el("user-chip");
    if (!chip) return;
    el("chip-name").textContent = user.name || "";
    el("chip-role").textContent = It.session.roleOf(user) || "admin";
    chip.hidden = false;
  }

  function renderUserDetails(data) {
    el("user-subtitle").textContent = data.email || "";
    el("user-name-display").textContent = data.name || "Unknown";

    const host = el("user-details-content");
    host.innerHTML = `
      <div class="kit-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div><strong>ID:</strong> ${data.id}</div>
        <div><strong>Name:</strong> ${data.name || "–"}</div>
        <div><strong>Email:</strong> ${data.email || "–"}</div>
        <div><strong>Status:</strong> ${data.is_active ? "Active" : "Blocked"}</div>
        <div><strong>Registered:</strong> ${data.created_at ? new Date(data.created_at).toLocaleDateString() : "–"}</div>
      </div>
    `;
  }

  function renderUserTrips(data) {
    const host = el("user-trips-content");
    const trips = data.trips || [];
    
    if (!trips.length) {
      host.innerHTML = '<div class="kit-empty">No trips found.</div>';
      return;
    }

    let html = `<table class="kit-table"><thead><tr><th>Trip</th><th>Budget</th><th>Status</th></tr></thead><tbody>`;
    trips.forEach(t => {
      html += `<tr>
        <td>${t.title || "Untitled"}</td>
        <td>${t.budget || "0"}</td>
        <td>${t.status || "–"}</td>
      </tr>`;
    });
    html += `</tbody></table>`;
    host.innerHTML = html;
  }

  function load() {
    const id = getQueryParam("id");
    if (!id) {
      It.feedback.banner("No user ID provided.", "is-error");
      return;
    }

    if (id === "current") {
      It.session.currentUser().then(function(user) {
        if (!user) {
          el("user-details-content").innerHTML = '<div class="kit-error">Could not load details.</div>';
          return;
        }
        renderUserDetails(user);
        renderUserTrips(user);
        
        if (global.gsap && !global.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          global.gsap.fromTo(".ticket-panel", 
            { autoAlpha: 0, y: 10 }, 
            { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" }
          );
        }
      });
      return;
    }

    It.apiGet("/admin/users/" + encodeURIComponent(id), { auth: true }).then(function (res) {
      if (!res.ok) {
        el("user-details-content").innerHTML = '<div class="kit-error">Could not load details.</div>';
        It.feedback.banner("Failed to fetch user.", "is-error");
        return;
      }
      
      const data = res.body.data;
      renderUserDetails(data);
      renderUserTrips(data);
      
      if (global.gsap && !global.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        global.gsap.fromTo(".ticket-panel", 
          { autoAlpha: 0, y: 10 }, 
          { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" }
        );
      }
    });
  }

  function boot(user) {
    renderProfile(user);
    load();
  }

  function init() {
    const logoutBtn = el("logout-btn");
    if (logoutBtn) logoutBtn.addEventListener("click", function () { It.session.logout(); });

    if (!It.session.hasToken()) { It.session.redirectToLogin(); return; }
    It.session.currentUser().then(function (user) {
      if (!user) { It.session.redirectToLogin(); return; }
      const role = It.session.roleOf(user);
      if (!It.session.isAdminRole(role)) {
        global.location.replace(It.session.getRedirectPath(role));
        return;
      }
      boot(user);
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})(window);