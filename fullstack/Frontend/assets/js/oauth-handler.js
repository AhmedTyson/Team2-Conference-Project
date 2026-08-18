/* =====================================================================
   oauth-handler.js — Homepage OAuth landing handler.
   Consumes ?token= from the social login callback, stores it, and if
   ?oauth_pending=1 completes the first-time registration by collecting
   the phone number (required for new OAuth accounts) before showing the
   homepage. Load on homepage pages (index.html, public/index.html)
   after config.js / api.js / session.js.
   ===================================================================== */
(function (global) {
  "use strict";

  const It = global.Itinari || global.It;
  if (!It) return;

  const qs = new URLSearchParams(global.location.search);

  function apiBase() {
    return It.resolveApiBase ? It.resolveApiBase() : "/api";
  }

  function stripParams() {
    qs.delete("token");
    qs.delete("oauth_pending");
    qs.delete("provider");
    qs.delete("oauth_error");
    const clean = global.location.pathname + (qs.toString() ? "?" + qs.toString() : "");
    try { global.history.replaceState({}, "", clean); } catch (e) {}
  }

  function toast(message, kind) {
    if (It.toast) It.toast(message, kind);
    if (global.ItinariToast && global.ItinariToast.success) {
      var t = global.ItinariToast;
      if (kind === "error") t.error(message); else t.success(message);
    }
  }

  function openPhoneModal() {
    const overlay = document.createElement("div");
    overlay.id = "oauth-phone-modal";
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:999998;display:flex;align-items:center;justify-content:center;" +
      "background:rgba(5,8,14,0.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);";

    const card = document.createElement("div");
    card.style.cssText =
      "width:min(92%,420px);border-radius:1.5rem;padding:2.25rem 2rem;" +
      "background:linear-gradient(180deg,#101a2e 0%,#0b1220 100%);" +
      "border:1px solid rgba(217,119,6,0.30);box-shadow:0 30px 70px -20px rgba(0,0,0,0.7);" +
      "color:#f8fafc;font-family:Inter,system-ui,sans-serif;text-align:center;";

    card.innerHTML =
      '<div style="margin-bottom:1rem;">' +
      '  <div style="width:56px;height:56px;margin:0 auto 0.9rem;border-radius:50%;' +
      '       display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:#f59e0b;' +
      '       border:1px dashed rgba(245,158,11,0.45);">☎</div>' +
      '  <h3 style="margin:0 0 0.35rem;font-size:1.25rem;font-weight:600;">Almost there — one last step</h3>' +
      '  <p style="margin:0 0 1.4rem;font-size:0.85rem;color:rgba(203,213,225,0.75);">' +
      '    Enter your phone number to complete your Itinera registration.</p>' +
      '</div>' +
      '<form id="oauth-phone-form">' +
      '  <input id="oauth-phone-input" type="tel" required maxlength="20" autocomplete="tel" placeholder="+20 1XX XXX XXXX"' +
      '         style="width:100%;box-sizing:border-box;padding:0.8rem 1rem;border-radius:0.75rem;' +
      '                border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.06);color:#f8fafc;' +
      '                font-size:1rem;outline:none;text-align:center;" />' +
      '  <p id="oauth-phone-error" style="display:none;margin:0.6rem 0 0;font-size:0.78rem;color:#fca5a5;"></p>' +
      '  <button type="submit" id="oauth-phone-submit" style="width:100%;margin-top:1.1rem;padding:0.85rem 1rem;' +
      '         border:none;border-radius:0.75rem;background:linear-gradient(90deg,#d97706,#f59e0b);' +
      '         color:#0f172a;font-weight:700;font-size:0.95rem;cursor:pointer;">Confirm & finish sign up</button>' +
      '</form>';

    overlay.appendChild(card);
    document.body.appendChild(overlay);
    card.querySelector("#oauth-phone-form").addEventListener("submit", onPhoneSubmit);
    setTimeout(function () { card.querySelector("#oauth-phone-input").focus(); }, 60);
  }

  function onPhoneSubmit(e) {
    e.preventDefault();
    const input = document.getElementById("oauth-phone-input");
    const errorEl = document.getElementById("oauth-phone-error");
    const phone = (input.value || "").trim();

    if (!/^[0-9+\-\s()]{5,20}$/.test(phone)) {
      errorEl.textContent = "Please enter a valid phone number (5-20 digits, + - ( ) space allowed).";
      errorEl.style.display = "block";
      return;
    }
    errorEl.style.display = "none";

    const submit = document.getElementById("oauth-phone-submit");
    submit.disabled = true;
    submit.textContent = "Finishing…";

    fetch(apiBase() + "/auth/social/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": "Bearer " + (It.readToken ? It.readToken() : ""),
      },
      body: JSON.stringify({ phone: phone }),
    })
      .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
      .then(function (result) {
        if (!result.ok) {
          throw new Error((result.data && result.data.message) || "Could not complete registration.");
        }
        const body = result.data.data || {};
        if (body.token && It.storeToken) It.storeToken(body.token);
        if (body.user && It.storeUser) It.storeUser(body.user);

        const modal = document.getElementById("oauth-phone-modal");
        if (modal) modal.remove();
        toast("Welcome to Itinera — registration complete.", "success");

        setTimeout(function () {
          var dest = It.session && It.session.getRedirectPath
            ? It.session.getRedirectPath("customer")
            : (It.CONFIG && It.CONFIG.dashboardUrl) || "/app/dashboard.html";
          global.location.href = dest;
        }, 600);
      })
      .catch(function (err) {
        submit.disabled = false;
        submit.textContent = "Confirm & finish sign up";
        errorEl.textContent = err.message || "Something went wrong. Please try again.";
        errorEl.style.display = "block";
      });
  }

  function init() {
    const token = qs.get("token");
    const pending = qs.get("oauth_pending") === "1";

    if (token && It.storeToken) {
      It.storeToken(token);
    }

    if (qs.get("oauth_error")) {
      toast(decodeURIComponent(qs.get("oauth_error") || "Social login failed."), "error");
    }

    // Strip sensitive params from the URL (token must not linger).
    if (token || pending || qs.has("oauth_error")) {
      stripParams();
    }

    if (pending) {
      setTimeout(openPhoneModal, 350);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);