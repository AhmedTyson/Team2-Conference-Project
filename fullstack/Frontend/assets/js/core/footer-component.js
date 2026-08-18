/**
 * footer-component.js — Global unified footer loader.
 * Mounts Frontend/components/footer.html across every non-auth page,
 * adjusts relative links, fills the copyright year and wires the
 * newsletter form. Mirrors core/navbar-component.js behaviour.
 */
(function (global) {
  "use strict";

  const doc = global.document;

  function getBasePrefix() {
    var p = (global.location.pathname || "").toLowerCase();
    if (p.indexOf("/app/") !== -1 || p.indexOf("/auth/") !== -1 || p.indexOf("/admin/") !== -1 || p.indexOf("/agency/") !== -1 || p.indexOf("/public/") !== -1 || p.indexOf("/errors/") !== -1) {
      return "../";
    }
    return "./";
  }

  function adjustRelativeHref(href, prefix) {
    if (!href) return href;
    if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("#") || href.startsWith("javascript:")) {
      return href;
    }
    var cleanPath = href.replace(/^(\.\/|\.\.\/)/, "");
    return prefix + cleanPath;
  }

  function mountFooter(htmlText) {
    var prefix = getBasePrefix();

    var temp = doc.createElement("div");
    temp.innerHTML = htmlText.trim();
    var footerEl = temp.firstElementChild;
    if (!footerEl || footerEl.tagName.toLowerCase() !== "footer") return;

    // Make hrefs / image srcs relative to the current directory
    footerEl.querySelectorAll("a[href]").forEach(function (a) {
      var rawHref = a.getAttribute("href");
      a.setAttribute("href", adjustRelativeHref(rawHref, prefix));
    });
    footerEl.querySelectorAll("img[src]").forEach(function (img) {
      var rawSrc = img.getAttribute("src");
      img.setAttribute("src", adjustRelativeHref(rawSrc, prefix));
    });

    // Mount in place of a <footer class="app-footer"> placeholder, otherwise append
    var placeholder = doc.querySelector("footer.app-footer");
    if (placeholder && placeholder.parentNode) {
      placeholder.parentNode.replaceChild(footerEl, placeholder);
    } else if (!doc.querySelector("footer.app-footer[data-mounted]")) {
      footerEl.setAttribute("data-mounted", "true");
      if (doc.body) doc.body.appendChild(footerEl);
    } else {
      return;
    }

    // Copyright year
    var yearEl = footerEl.querySelector("#footerYear");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    // Newsletter form affordance
    var form = footerEl.querySelector("#footerNewsletterForm");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var input = form.querySelector('input[type="email"]');
        var email = input ? input.value.trim() : "";
        if (!email) return;
        var done = function () {
          if (global.Itinera && global.Itinera.toast) {
            global.Itinera.toast("Welcome to the Executive Travel Club!", "success");
          } else if (global.ItineraToast && global.ItineraToast.success) {
            global.ItineraToast.success("Welcome to the Executive Travel Club!");
          } else {
            global.alert("Thanks for subscribing!");
          }
        };
        var showError = function () {
          if (global.Itinera && global.Itinera.toast) {
            global.Itinera.toast("Couldn't subscribe right now. Please try again later.", "error");
          } else if (global.ItineraToast && global.ItineraToast.error) {
            global.ItineraToast.error("Couldn't subscribe right now. Please try again later.");
          } else {
            global.alert("Subscription failed. Please try again later.");
          }
        };
        var showAlready = function () {
          if (global.Itinera && global.Itinera.toast) {
            global.Itinera.toast("You're already subscribed to our newsletter!", "info");
          } else if (global.ItineraToast && global.ItineraToast.success) {
            global.ItineraToast.success("You're already subscribed to our newsletter!");
          } else {
            global.alert("You're already subscribed to our newsletter!");
          }
        };
        if (global.Itinera && typeof global.Itinera.apiPost === "function") {
          global.Itinera.apiPost("/newsletter/subscribe", { email: email })
            .then(function (res) {
              if (res && res.ok) {
                done();
                if (input) input.value = "";
              } else if (res && res.status === 409) {
                showAlready();
              } else {
                showError();
              }
            })
            .catch(showError);
        } else {
          done();
        }
      });
    }
  }

  function initGlobalFooter() {
    // Auth pages keep their own minimal chrome — no site footer there.
    var path = (global.location.pathname || "").toLowerCase();
    if (path.indexOf("/auth/") !== -1) return;

    var prefix = getBasePrefix();
    fetch(prefix + "components/footer.html")
      .then(function (res) {
        if (!res.ok) throw new Error("Footer component not found");
        return res.text();
      })
      .then(mountFooter)
      .catch(function () {});
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", initGlobalFooter);
  } else {
    initGlobalFooter();
  }

  global.ItineraGlobalFooter = { init: initGlobalFooter };

})(window);