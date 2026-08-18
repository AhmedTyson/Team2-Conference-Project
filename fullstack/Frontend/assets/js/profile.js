/**
 * profile.js — Dedicated User Profile, Address & Avatar Settings Manager.
 * Instant-renders from session storage, UI Avatars default fallback, photo upload & instant sync.
 */
(function (global) {
  "use strict";

  var It = global.Itinera;
  if (!It) return;

  var page = document.getElementById("profile-page");

  function esc(v) {
    if (v == null) return "";
    return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function getDefaultAvatar(name) {
    var n = encodeURIComponent(name && name.trim() ? name.trim() : "User");
    return "https://ui-avatars.com/api/?name=" + n + "&background=262626&color=fbbf24&bold=true&size=256";
  }

  function formatAvatarUrl(url, userName) {
    if (!url || typeof url !== "string") return getDefaultAvatar(userName);
    if (url.indexOf("http://") === 0 || url.indexOf("https://") === 0 || url.indexOf("data:image/") === 0) {
      return url;
    }
    // Relative path e.g. uploads/profile-images/xxx.png or storage/profile-images/xxx.png
    var base = (It.getApiBase ? It.getApiBase() : "http://localhost:8000/api").replace(/\/api\/?$/, "");
    return base + "/" + url.replace(/^\/+/, "");
  }

  function getStoredUser() {
    try {
      var raw = (It.readUser && It.readUser()) || localStorage.getItem("itinera_user");
      if (raw) {
        var obj = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (obj && obj.user && typeof obj.user === "object") return obj.user;
        return obj;
      }
    } catch (e) {}
    return null;
  }

  function hasStoredToken() {
    try {
      var tok = (It.readToken && It.readToken()) || localStorage.getItem("itinera_token");
      return !!tok;
    } catch (e) {
      return false;
    }
  }

  function renderLoginPrompt() {
    if (!page) return;
    page.innerHTML = '<div class="py-16 text-center text-white/50">' +
      '<h2 class="text-xl font-bold text-white mb-2">Please Log In</h2>' +
      '<p class="text-sm text-white/60 mb-4">You need an active session to manage your account details.</p>' +
      '<a href="../auth/login.html" class="px-5 py-2.5 rounded-full bg-amber-400 text-black text-xs font-bold hover:bg-amber-300 transition">Log In</a></div>';
  }

  function renderProfileForm(user) {
    if (!page || !user) return;

    var avatarSrc = formatAvatarUrl(user.profile_image, user.name);
    var fallbackAvatar = getDefaultAvatar(user.name);
    var roles = (user.roles && user.roles.length) ? (Array.isArray(user.roles) ? user.roles.join(", ") : String(user.roles)).toUpperCase() : "MEMBER";
    var isVerified = !!user.email_verified_at;

    page.innerHTML =
      '<!-- User Profile Header & Avatar Manager -->' +
      '<div class="p-6 sm:p-8 rounded-3xl bg-white/5 border border-white/10 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-amber-400/30 transition duration-300 group">' +
        '<div class="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">' +
          '<!-- Interactive Avatar Container with Hover Cue -->' +
          '<div class="relative group/avatar cursor-pointer" id="avatar-container" title="Click to update profile photo">' +
            '<img id="user-avatar-img" src="' + esc(avatarSrc) + '" alt="' + esc(user.name || "User") + '" class="w-24 h-24 rounded-full object-cover border-4 border-amber-400/40 shadow-2xl transition duration-300 group-hover/avatar:opacity-80 group-hover/avatar:scale-105" onerror="this.onerror=null; this.src=\'' + esc(fallbackAvatar) + '\';" />' +
            '<div class="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center text-white transition duration-300 shadow-inner">' +
              '<i class="fas fa-camera text-lg mb-1 text-amber-400 group-hover/avatar:scale-110 transition"></i>' +
              '<span class="text-[10px] font-bold uppercase tracking-wider">Change</span>' +
            '</div>' +
            '<input type="file" id="input-avatar-file" accept="image/*" class="hidden" />' +
          '</div>' +

          '<div>' +
            '<div class="flex items-center justify-center sm:justify-start gap-2 mb-1.5 flex-wrap">' +
              '<span class="px-3 py-0.5 rounded-full bg-amber-400/10 text-amber-400 text-xs font-semibold uppercase tracking-wider">' +
                '<i class="fas fa-user-shield mr-1"></i>' + esc(roles) +
              '</span>' +
              '<span class="px-3 py-0.5 rounded-full ' + (isVerified ? 'bg-emerald-400/10 text-emerald-400' : 'bg-amber-400/10 text-amber-400') + ' text-xs font-semibold uppercase tracking-wider">' +
                '<i class="fas ' + (isVerified ? 'fa-circle-check' : 'fa-clock') + ' mr-1"></i>' + (isVerified ? 'Verified Account' : 'Active Account') +
              '</span>' +
            '</div>' +
            '<h1 class="text-2xl sm:text-4xl font-black text-white tracking-tight" id="profile-display-name">' + esc(user.name || "Member Profile") + '</h1>' +
            '<p class="text-xs text-white/60 mt-1 flex items-center justify-center sm:justify-start gap-3 flex-wrap">' +
              '<span><i class="fas fa-envelope mr-1 text-white/30"></i>' + esc(user.email || "No email on record") + '</span>' +
              (user.phone ? '<span><i class="fas fa-phone mr-1 text-white/30"></i>' + esc(user.phone) + '</span>' : '') +
              (user.country ? '<span><i class="fas fa-location-dot mr-1 text-white/30"></i>' + esc(user.country) + '</span>' : '') +
            '</p>' +
          '</div>' +
        '</div>' +

        '<!-- Avatar Upload Action Buttons -->' +
        '<div id="avatar-actions" class="hidden flex flex-col gap-2">' +
          '<button type="button" id="upload-avatar-btn" class="px-5 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs transition shadow-lg flex items-center justify-center gap-1.5">' +
            '<i class="fas fa-cloud-arrow-up"></i> Save New Avatar' +
          '</button>' +
          '<button type="button" id="cancel-avatar-btn" class="px-5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition text-center">' +
            'Cancel' +
          '</button>' +
        '</div>' +
      '</div>' +

      '<!-- User Account Navigation Hub Bar -->' +
      '<div class="mb-8 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/30 transition duration-300 group">' +
        '<div class="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3 px-1 flex items-center justify-between">' +
          '<span><i class="fas fa-compass mr-1.5"></i> My Account Navigation Hub</span>' +
        '</div>' +
        '<div class="grid grid-cols-2 sm:grid-cols-5 gap-3">' +
          '<a href="trips.html" class="p-3 rounded-xl bg-white/5 hover:bg-amber-400/10 border border-white/10 hover:border-amber-400/30 text-center transition group/btn">' +
            '<i class="fas fa-route text-amber-400 text-lg mb-1 block group-hover/btn:scale-110 transition"></i>' +
            '<span class="text-xs font-semibold text-white block">My Trips</span>' +
          '</a>' +
          '<a href="bookings.html" class="p-3 rounded-xl bg-white/5 hover:bg-emerald-400/10 border border-white/10 hover:border-emerald-400/30 text-center transition group/btn">' +
            '<i class="fas fa-ticket text-emerald-400 text-lg mb-1 block group-hover/btn:scale-110 transition"></i>' +
            '<span class="text-xs font-semibold text-white block">Bookings</span>' +
          '</a>' +
          '<a href="favourites.html" class="p-3 rounded-xl bg-white/5 hover:bg-rose-400/10 border border-white/10 hover:border-rose-400/30 text-center transition group/btn">' +
            '<i class="fas fa-heart text-rose-400 text-lg mb-1 block group-hover/btn:scale-110 transition"></i>' +
            '<span class="text-xs font-semibold text-white block">Favourites</span>' +
          '</a>' +
          '<a href="surveys.html" class="p-3 rounded-xl bg-white/5 hover:bg-purple-400/10 border border-white/10 hover:border-purple-400/30 text-center transition group/btn">' +
            '<i class="fas fa-clipboard-check text-purple-400 text-lg mb-1 block group-hover/btn:scale-110 transition"></i>' +
            '<span class="text-xs font-semibold text-white block">My Surveys</span>' +
          '</a>' +
          '<a href="chat.html" class="p-3 rounded-xl bg-white/5 hover:bg-sky-400/10 border border-white/10 hover:border-sky-400/30 text-center transition group/btn col-span-2 sm:col-span-1">' +
            '<i class="fas fa-comments text-sky-400 text-lg mb-1 block group-hover/btn:scale-110 transition"></i>' +
            '<span class="text-xs font-semibold text-white block">Support Chat</span>' +
          '</a>' +
        '</div>' +
      '</div>' +

      '<!-- Profile & Address Settings Forms -->' +
      '<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">' +

        '<!-- Personal Information & Address Form with Hover Change Overlay -->' +
        '<div class="lg:col-span-2 space-y-6">' +
          '<form id="profile-info-form" class="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/40 hover:bg-white/[0.07] transition-all duration-300 space-y-5 group/personal relative shadow-lg hover:shadow-amber-500/10">' +
            '<!-- Header with Hover Edit Badge -->' +
            '<div class="flex items-center justify-between border-b border-white/10 pb-4 mb-2">' +
              '<h2 class="text-base font-bold text-white flex items-center gap-2">' +
                '<i class="fas fa-address-card text-amber-400 text-sm"></i> Personal & Address Details' +
              '</h2>' +
              '<span class="px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[11px] font-bold uppercase tracking-wider opacity-60 group-hover/personal:opacity-100 transition-all duration-300 flex items-center gap-1.5 shadow-sm">' +
                '<i class="fas fa-pen-to-square text-xs text-amber-400 group-hover/personal:rotate-12 transition transform"></i> Click to Edit' +
              '</span>' +
            '</div>' +

            '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">' +
              '<!-- Full Name Field -->' +
              '<div class="group/field relative">' +
                '<label class="block text-xs font-semibold text-white/70 group-hover/field:text-amber-400 transition uppercase tracking-wider mb-1.5 flex items-center justify-between" for="input-name">' +
                  '<span>Full Name</span>' +
                  '<i class="fas fa-pen opacity-0 group-hover/field:opacity-100 text-[10px] text-amber-400 transition"></i>' +
                '</label>' +
                '<input type="text" id="input-name" class="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/50 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-all duration-200" value="' + esc(user.name || "") + '" required />' +
              '</div>' +

              '<!-- Email Field -->' +
              '<div class="group/field relative">' +
                '<label class="block text-xs font-semibold text-white/70 group-hover/field:text-amber-400 transition uppercase tracking-wider mb-1.5 flex items-center justify-between" for="input-email">' +
                  '<span>Email Address</span>' +
                  '<i class="fas fa-pen opacity-0 group-hover/field:opacity-100 text-[10px] text-amber-400 transition"></i>' +
                '</label>' +
                '<input type="email" id="input-email" class="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/50 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-all duration-200" value="' + esc(user.email || "") + '" required />' +
              '</div>' +
            '</div>' +

            '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">' +
              '<!-- Phone Field -->' +
              '<div class="group/field relative">' +
                '<label class="block text-xs font-semibold text-white/70 group-hover/field:text-amber-400 transition uppercase tracking-wider mb-1.5 flex items-center justify-between" for="input-phone">' +
                  '<span>Phone Number</span>' +
                  '<i class="fas fa-pen opacity-0 group-hover/field:opacity-100 text-[10px] text-amber-400 transition"></i>' +
                '</label>' +
                '<input type="tel" id="input-phone" class="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/50 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-all duration-200" placeholder="+1 (555) 000-0000" value="' + esc(user.phone || "") + '" />' +
              '</div>' +

              '<!-- Address Field -->' +
              '<div class="group/field relative">' +
                '<label class="block text-xs font-semibold text-white/70 group-hover/field:text-amber-400 transition uppercase tracking-wider mb-1.5 flex items-center justify-between" for="input-address">' +
                  '<span>Street Address / City</span>' +
                  '<i class="fas fa-pen opacity-0 group-hover/field:opacity-100 text-[10px] text-amber-400 transition"></i>' +
                '</label>' +
                '<input type="text" id="input-address" class="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/50 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-all duration-200" placeholder="e.g. 124 El Tahrir St, Cairo" value="' + esc(user.address || (user.address_details && user.address_details.line1) || "") + '" />' +
              '</div>' +
            '</div>' +

            '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">' +
              '<!-- Country Field -->' +
              '<div class="group/field relative">' +
                '<label class="block text-xs font-semibold text-white/70 group-hover/field:text-amber-400 transition uppercase tracking-wider mb-1.5 flex items-center justify-between" for="input-country">' +
                  '<span>Country</span>' +
                  '<i class="fas fa-pen opacity-0 group-hover/field:opacity-100 text-[10px] text-amber-400 transition"></i>' +
                '</label>' +
                '<input type="text" id="input-country" class="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/50 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-all duration-200" placeholder="e.g. Egypt, France, USA" value="' + esc(user.country || "") + '" />' +
              '</div>' +

              '<!-- Currency Field -->' +
              '<div class="group/field relative">' +
                '<label class="block text-xs font-semibold text-white/70 group-hover/field:text-amber-400 transition uppercase tracking-wider mb-1.5 flex items-center justify-between" for="input-currency">' +
                  '<span>Preferred Currency</span>' +
                  '<i class="fas fa-pen opacity-0 group-hover/field:opacity-100 text-[10px] text-amber-400 transition"></i>' +
                '</label>' +
                '<select id="input-currency" class="w-full bg-[#161616] hover:bg-[#1f1f1f] border border-white/10 hover:border-amber-400/50 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-all duration-200">' +
                  '<option value="USD"' + (user.preferred_currency === "USD" ? " selected" : "") + '>USD ($)</option>' +
                  '<option value="EUR"' + (user.preferred_currency === "EUR" ? " selected" : "") + '>EUR (€)</option>' +
                  '<option value="EGP"' + (user.preferred_currency === "EGP" ? " selected" : "") + '>EGP (E£)</option>' +
                  '<option value="GBP"' + (user.preferred_currency === "GBP" ? " selected" : "") + '>GBP (£)</option>' +
                '</select>' +
              '</div>' +
            '</div>' +

            '<!-- Emergency Contact Field -->' +
            '<div class="group/field relative">' +
              '<label class="block text-xs font-semibold text-white/70 group-hover/field:text-amber-400 transition uppercase tracking-wider mb-1.5 flex items-center justify-between" for="input-emergency">' +
                '<span>Emergency Contact</span>' +
                '<i class="fas fa-pen opacity-0 group-hover/field:opacity-100 text-[10px] text-amber-400 transition"></i>' +
              '</label>' +
              '<input type="text" id="input-emergency" class="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/50 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-all duration-200" placeholder="Name / Phone Number" value="' + esc(user.emergency_contact || "") + '" />' +
            '</div>' +

            '<!-- Bio Field -->' +
            '<div class="group/field relative">' +
              '<label class="block text-xs font-semibold text-white/70 group-hover/field:text-amber-400 transition uppercase tracking-wider mb-1.5 flex items-center justify-between" for="input-bio">' +
                '<span>Bio / Travel Notes</span>' +
                '<i class="fas fa-pen opacity-0 group-hover/field:opacity-100 text-[10px] text-amber-400 transition"></i>' +
              '</label>' +
              '<textarea id="input-bio" rows="3" class="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/50 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-all duration-200" placeholder="Share your travel preferences or notes...">' + esc(user.bio || "") + '</textarea>' +
            '</div>' +

            '<div class="pt-2 flex justify-end">' +
              '<button type="submit" id="save-info-btn" class="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-xs transition shadow-lg shadow-amber-500/20 flex items-center gap-2 group-hover/personal:scale-[1.02] transition-transform">' +
                '<i class="fas fa-floppy-disk"></i> Save Profile & Address' +
              '</button>' +
            '</div>' +
          '</form>' +
        '</div>' +

        '<!-- Password & Security Sidebar -->' +
        '<div class="lg:col-span-1 space-y-6">' +
          '<form id="profile-password-form" class="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/40 hover:bg-white/[0.07] transition-all duration-300 space-y-4 group/security relative shadow-lg hover:shadow-amber-500/10">' +
            '<div class="border-b border-white/10 pb-4 mb-2 flex items-center justify-between">' +
              '<div>' +
                '<h3 class="text-sm font-bold text-white flex items-center gap-2"><i class="fas fa-lock text-amber-400"></i> Change Password</h3>' +
                '<p class="text-xs text-white/40 mt-0.5">Ensure your account stays secure.</p>' +
              '</div>' +
              '<span class="px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 text-[10px] font-bold uppercase opacity-60 group-hover/security:opacity-100 transition"><i class="fas fa-key"></i></span>' +
            '</div>' +

            '<div class="group/field relative">' +
              '<label class="block text-xs font-semibold text-white/70 group-hover/field:text-amber-400 transition uppercase tracking-wider mb-1.5 flex items-center justify-between" for="input-password">' +
                '<span>New Password</span>' +
                '<i class="fas fa-pen opacity-0 group-hover/field:opacity-100 text-[10px] text-amber-400 transition"></i>' +
              '</label>' +
              '<input type="password" id="input-password" class="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/50 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-all duration-200" placeholder="Min. 8 characters" required />' +
            '</div>' +

            '<div class="group/field relative">' +
              '<label class="block text-xs font-semibold text-white/70 group-hover/field:text-amber-400 transition uppercase tracking-wider mb-1.5 flex items-center justify-between" for="input-password-confirm">' +
                '<span>Confirm Password</span>' +
                '<i class="fas fa-pen opacity-0 group-hover/field:opacity-100 text-[10px] text-amber-400 transition"></i>' +
              '</label>' +
              '<input type="password" id="input-password-confirm" class="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/50 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-all duration-200" placeholder="Re-enter password" required />' +
            '</div>' +

            '<div class="pt-2">' +
              '<button type="submit" id="save-pass-btn" class="w-full py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition flex items-center justify-center gap-2 group-hover/security:border-amber-400/40">' +
                '<i class="fas fa-key"></i> Update Password' +
              '</button>' +
            '</div>' +
          '</form>' +
        '</div>' +

      '</div>';

    // Image Upload Handlers
    var avatarContainer = document.getElementById("avatar-container");
    var fileInput = document.getElementById("input-avatar-file");
    var avatarImg = document.getElementById("user-avatar-img");
    var avatarActions = document.getElementById("avatar-actions");
    var uploadAvatarBtn = document.getElementById("upload-avatar-btn");
    var cancelAvatarBtn = document.getElementById("cancel-avatar-btn");
    var selectedFile = null;

    if (avatarContainer && fileInput) {
      avatarContainer.addEventListener("click", function () {
        fileInput.click();
      });

      fileInput.addEventListener("change", function (e) {
        var files = e.target.files;
        if (files && files.length > 0) {
          selectedFile = files[0];
          var reader = new FileReader();
          reader.onload = function (event) {
            if (avatarImg) avatarImg.src = event.target.result;
            if (avatarActions) avatarActions.classList.remove("hidden");
          };
          reader.readAsDataURL(selectedFile);
        }
      });
    }

    if (cancelAvatarBtn) {
      cancelAvatarBtn.addEventListener("click", function () {
        selectedFile = null;
        if (fileInput) fileInput.value = "";
        if (avatarImg) avatarImg.src = avatarSrc;
        if (avatarActions) avatarActions.classList.add("hidden");
      });
    }

    if (uploadAvatarBtn) {
      uploadAvatarBtn.addEventListener("click", function () {
        if (!selectedFile) return;

        uploadAvatarBtn.disabled = true;
        uploadAvatarBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Saving Avatar…';

        var formData = new FormData();
        formData.append("profile_image", selectedFile);
        formData.append("_method", "PATCH");

        It.apiPost("/profile", formData, { auth: true }).then(function (res) {
          uploadAvatarBtn.disabled = false;
          uploadAvatarBtn.innerHTML = '<i class="fas fa-cloud-arrow-up"></i> Save New Avatar';
          if (res.ok) {
            It.app.showToast("Profile avatar saved & updated!", "success");
            if (avatarActions) avatarActions.classList.add("hidden");

            var resData = res.data !== undefined ? res.data : (res.body ? (res.body.data || res.body) : res);
            var updatedUser = (resData && resData.user) ? resData.user : resData;

            if (updatedUser && updatedUser.profile_image) {
              var newAvatarUrl = formatAvatarUrl(updatedUser.profile_image, updatedUser.name);
              if (avatarImg) avatarImg.src = newAvatarUrl;
              avatarSrc = newAvatarUrl;

              // Synchronize local session user
              var currentSessionUser = getStoredUser() || {};
              currentSessionUser.profile_image = updatedUser.profile_image;
              try { localStorage.setItem("itinera_user", JSON.stringify(currentSessionUser)); } catch (e) {}

              // Synchronize topbar header nav avatar
              var topNavAvatar = document.querySelector(".app-nav-header img");
              if (topNavAvatar) topNavAvatar.src = newAvatarUrl;
            }
          } else {
            var msg = (res.body && (res.body.message || (res.body.errors && Object.values(res.body.errors)[0]))) || "Could not upload image.";
            It.app.showToast(msg, "error");
          }
        }).catch(function (err) {
          uploadAvatarBtn.disabled = false;
          uploadAvatarBtn.innerHTML = '<i class="fas fa-cloud-arrow-up"></i> Save New Avatar';
          It.app.showToast(err.message || "Failed to save profile avatar.", "error");
        });
      });
    }

    // Submit Handler: Information & Address Update
    var infoForm = document.getElementById("profile-info-form");
    if (infoForm) {
      infoForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var saveBtn = document.getElementById("save-info-btn");
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Saving…';

        var addressVal = document.getElementById("input-address").value.trim();
        var payload = {
          name: document.getElementById("input-name").value.trim(),
          email: document.getElementById("input-email").value.trim(),
          phone: document.getElementById("input-phone").value.trim() || null,
          country: document.getElementById("input-country").value.trim() || null,
          preferred_currency: document.getElementById("input-currency").value,
          emergency_contact: document.getElementById("input-emergency").value.trim() || null,
          bio: document.getElementById("input-bio").value.trim() || null,
        };

        if (addressVal) {
          payload.address = addressVal;
          payload.line1 = addressVal;
        }

        It.apiPatch("/profile", payload, { auth: true }).then(function (res) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<i class="fas fa-floppy-disk"></i> Save Profile & Address';
          if (res.ok) {
            It.app.showToast("Profile & address details saved successfully!", "success");
            var updatedUser = res.data !== undefined ? res.data : (res.body ? (res.body.data || res.body) : res);
            if (updatedUser && updatedUser.user) updatedUser = updatedUser.user;
            if (addressVal && updatedUser) updatedUser.address = addressVal;
            if (updatedUser && updatedUser.name) {
              try { localStorage.setItem("itinera_user", JSON.stringify(updatedUser)); } catch (e) {}
              var displayTitle = document.getElementById("profile-display-name");
              if (displayTitle) displayTitle.textContent = updatedUser.name;
            }
          } else {
            var msg = (res.body && (res.body.message || (res.body.errors && Object.values(res.body.errors)[0]))) || "Could not update profile.";
            It.app.showToast(msg, "error");
          }
        }).catch(function (err) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<i class="fas fa-floppy-disk"></i> Save Profile & Address';
          It.app.showToast(err.message || "Failed to save profile details.", "error");
        });
      });
    }

    // Submit Handler: Password Update
    var passForm = document.getElementById("profile-password-form");
    if (passForm) {
      passForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var pass = document.getElementById("input-password").value;
        var passConfirm = document.getElementById("input-password-confirm").value;

        if (pass.length < 8) {
          It.app.showToast("Password must be at least 8 characters.", "warn");
          return;
        }
        if (pass !== passConfirm) {
          It.app.showToast("Passwords do not match.", "warn");
          return;
        }

        var savePassBtn = document.getElementById("save-pass-btn");
        savePassBtn.disabled = true;
        savePassBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Updating…';

        It.apiPatch("/profile", {
          password: pass,
          password_confirmation: passConfirm
        }, { auth: true }).then(function (res) {
          savePassBtn.disabled = false;
          savePassBtn.innerHTML = '<i class="fas fa-key"></i> Update Password';
          if (res.ok) {
            It.app.showToast("Password updated successfully!", "success");
            document.getElementById("input-password").value = "";
            document.getElementById("input-password-confirm").value = "";
          } else {
            var msg = (res.body && (res.body.message || (res.body.errors && Object.values(res.body.errors)[0]))) || "Could not update password.";
            It.app.showToast(msg, "error");
          }
        }).catch(function (err) {
          savePassBtn.disabled = false;
          savePassBtn.innerHTML = '<i class="fas fa-key"></i> Update Password';
          It.app.showToast(err.message || "Failed to update password.", "error");
        });
      });
    }
  }

  function loadProfile() {
    var cachedUser = getStoredUser();

    // Instant-render if user object is cached in session storage
    if (cachedUser && (cachedUser.id || cachedUser.name || cachedUser.email)) {
      renderProfileForm(cachedUser);
    }

    // Fetch fresh user data from backend API
    It.apiGet("/user", { auth: true }).then(function (userRes) {
      var raw = userRes.data !== undefined ? userRes.data : (userRes.body ? (userRes.body.data || userRes.body) : userRes);
      var user = (raw && raw.user) ? raw.user : raw;
      if (user && (user.id || user.name || user.email)) {
        try { localStorage.setItem("itinera_user", JSON.stringify(user)); } catch (e) {}
        renderProfileForm(user);
        return;
      }
      if (!cachedUser && !hasStoredToken()) {
        renderLoginPrompt();
      }
    }).catch(function () {
      if (!cachedUser && !hasStoredToken()) {
        renderLoginPrompt();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadProfile);
  } else {
    loadProfile();
  }
})(window);
