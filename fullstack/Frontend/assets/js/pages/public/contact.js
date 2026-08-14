/**
 * contact.js — contact form (converted from React ContactPage).
 * POST /v1/contacts (public route). Depends on app-shell.js (It.app).
 */
(function (global) {
  "use strict";

  var It = global.Itinari;
  if (!It || !It.app) return;

  var form = document.getElementById("contact-form");
  var nameInput = document.getElementById("contact-name");
  var emailInput = document.getElementById("contact-email");
  var subjectInput = document.getElementById("contact-subject");
  var messageInput = document.getElementById("contact-message");

  function el(id) { return document.getElementById(id); }
  function showError(id, message) {
    var node = el(id);
    node.textContent = message;
    node.hidden = !message;
  }

  It.app.boot(function () {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var errors = {};
      var name = nameInput.value.trim();
      var email = emailInput.value.trim();
      var subject = subjectInput.value.trim();
      var message = messageInput.value.trim();
      if (!name) errors.name = "Your name is required.";
      if (!email) errors.email = "Your email is required.";
      if (!subject) errors.subject = "A short subject helps us route it.";
      if (!message) errors.message = "Say something — even a hello.";
      showError("name-error", errors.name || "");
      showError("email-error", errors.email || "");
      showError("subject-error", errors.subject || "");
      showError("message-error", errors.message || "");
      if (Object.keys(errors).length) return;

      var submit = form.querySelector('button[type="submit"]');
      submit.disabled = true;
      submit.textContent = "Sending…";

      It.apiPost("/contacts", { name: name, email: email, subject: subject, message: message }).then(function (res) {
        if (res.ok) {
          nameInput.value = "";
          emailInput.value = "";
          subjectInput.value = "";
          messageInput.value = "";
          It.app.showToast("Message sent — we will get back to you soon.", "success");
        } else {
          var body = res.body || {};
          var anyField = false;
          if (body.errors) {
            Object.keys(body.errors).forEach(function (key) {
              var first = body.errors[key][0];
              if (key === "name") showError("name-error", first);
              if (key === "email") showError("email-error", first);
              if (key === "subject") showError("subject-error", first);
              if (key === "message") showError("message-error", first);
            });
            anyField = true;
          }
          if (!anyField && body.message) It.app.showToast(body.message, "error");
        }
        submit.disabled = false;
        submit.textContent = "Send message";
      }).catch(function () {
        It.app.showToast("Could not send the message.", "error");
        submit.disabled = false;
        submit.textContent = "Send message";
      });
    });
  });
})(window);
