/**
 * help.js — Offline Help (help.html).
 * Static doc/FAQ content — fully offline by design, no API calls.
 */
(function (global) {
  "use strict";

  var topics = [
    { icon: "fa-magnifying-glass", title: "Find destinations & places", text: "Open Explore and browse destinations, hotels, restaurants and attractions. Each card links to a detail page with facts, weather shortcuts and maps." },
    { icon: "fa-book", title: "Plan a trip", text: "On the Booking page, search a flight request and save it as a trip. Members can then attach hotels, restaurants and attractions, and review the plan in Chat AI." },
    { icon: "fa-sack-dollar", title: "Pricing & subscriptions", text: "Plans page: Starter is free, paid plans unlock extra seats and agency features. Choose a plan and complete checkout through the Paymob demo flow." },
    { icon: "fa-cloud-sun", title: "Weather at a glance", text: "From any destination page, tap the weather button — it prefills the Weather page with your city and searches automatically." },
    { icon: "fa-clipboard-list", title: "Travel surveys", text: "Create a survey to describe your travel style, budget and interests. Your answers stay on your account and shape how we tune recommendations." },
    { icon: "fa-star", title: "Reviews & favourites", text: "Members can favourite places and write one review per item. Reviews are moderated before they appear. Sign in from any page to get started." },
    { icon: "fa-robot", title: "Chat AI", text: "The assistant gives trip tips offline, builds itinerary drafts via the AI service, and reviews your saved trips with real plan context." },
  ];

  var faqs = [
    { q: "Do I need an account to browse?", a: "No — Explore, weather, plans and the help pages are public. You need an account to save trips, favourite places, write reviews, create surveys and use the AI generator." },
    { q: "Are flight prices real?", a: "No. There are no live flight routes in the demo — the flight booking page shows sample prices and is clearly marked as a demo." },
    { q: "How long until my review appears?", a: "Reviews are moderated: they are saved as pending and appear after an admin approves them. You can only review each item once." },
    { q: "What happens if the AI service is down?", a: "The Chat AI falls back to built-in offline replies — trip tips and this help page always work. Itinerary generation and plan review need the live Groq service and your account permissions." },
    { q: "How do I change my survey answers?", a: "Go to Surveys, open your survey, and choose \u201cChange answers\u201d. Only the survey owner can view or edit it." },
    { q: "How do I cancel or change a booking?", a: "This is a demo: checkout uses a Paymob test flow. Contact support below and we reply within 2 hours." },
  ];

  var topicsEl = document.getElementById("helpTopics");
  var faqEl = document.getElementById("faqList");
  if (!topicsEl || !faqEl) return;

  topicsEl.innerHTML = topics.map(function (t) {
    return (
      '<div class="help-topic">' +
      '<span class="ht-icon"><i class="fas ' + t.icon + '" aria-hidden="true"></i></span>' +
      "<div><h4>" + t.title + "</h4><p>" + t.text + "</p></div>" +
      "</div>"
    );
  }).join("");

  faqEl.innerHTML = faqs.map(function (f) {
    return (
      '<div class="faq-item">' +
      '<button type="button" class="faq-q" aria-expanded="false">' + f.q +
      '<i class="fas fa-chevron-down flex-shrink-0" aria-hidden="true"></i></button>' +
      '<div class="faq-a"><p>' + f.a + "</p></div>" +
      "</div>"
    );
  }).join("");

  faqEl.querySelectorAll(".faq-item").forEach(function (item) {
    var q = item.querySelector(".faq-q");
    q.addEventListener("click", function () {
      var open = item.classList.toggle("open");
      q.setAttribute("aria-expanded", String(open));
    });
  });
})(window);
