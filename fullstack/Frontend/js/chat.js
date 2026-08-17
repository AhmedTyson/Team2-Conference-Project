/**
 * chat.js — Chat AI (chat.html).
 *
 * Custom chat UI with three skills:
 *  1. Trip tips          — local curated content (offline by design, tagged).
 *  2. Build an itinerary — POST /api/review { destination_country_id,
 *     number_of_days, budget, interests[], number_of_travelers, travel_style }
 *     (auth + permission "generate ai itineraries") → AI JSON draft.
 *  3. Review my plans    — member-only; real trip context from
 *     GET /api/v1/dashboard/trips, then GET /api/review/{tripId}.
 *
 * Backend honesty rules (same as the rest of the app):
 *  - No tips endpoint exists → tips are local help content, clearly tagged.
 *  - AI service down / no GROQ key / 403 → offline fallback message + help link.
 *  - Nothing is faked as AI output.
 */
(function (global) {
  "use strict";

  const It = global.Itinari;
  if (!It) return;

  const apiBase = It.CONFIG.apiBase; // e.g. http://127.0.0.1:8000/api
  const ROUTES = {
    generate: "/ai/generate",
    enhance: "/ai/enhance",
    review: function (id) { return "/ai/review/" + encodeURIComponent(id); },
    trips: "/dashboard/trips",
    destinations: "/destinations",
  };

  const TRAVEL_STYLES = ["adventure", "cultural", "relaxation", "business", "family", "solo", "culinary", "nature"];
  const INTERESTS = [
    "food", "museums", "history", "nature", "beaches", "hiking", "shopping",
    "nightlife", "art", "culture", "adventure", "photography", "wellness",
    "family", "sports", "architecture",
  ];

  const TIPS = [
    { icon: "fa-passport", title: "Documents first", text: "Check passport validity (6+ months) and visa rules for every country you touch — including transit layovers." },
    { icon: "fa-suitcase-rolling", title: "Pack light, layer smart", text: "Stick to a carry-on when possible: 7–10 days is doable in one bag. Roll clothes, pack a light layer for planes and evenings." },
    { icon: "fa-sack-dollar", title: "Budget buffers", text: "Add 15–20% on top of your estimate for the things that always surprise: airport food, sim cards, tips, and transport hiccups." },
    { icon: "fa-plane-departure", title: "Book the odd times", text: "Red-eye departures and Tuesday–Thursday flights are cheaper and airports are calmer. Compare with return dates before paying." },
    { icon: "fa-umbrella-beach", title: "Weather-proof your plan", text: "Check the forecast at your destination before finalising outdoor days — swap museum days in for rainy ones." },
    { icon: "fa-shield-heart", title: "Insurance is not optional", text: "Medical coverage plus trip cancellation protection. It costs a few dollars a day and can save a whole trip." },
    { icon: "fa-map-location-dot", title: "One city, one base", text: "Stay in one neighbourhood per city and use day trips. Repacking every night wastes half a day each move." },
    { icon: "fa-mobile-screen", title: "Offline essentials", text: "Download maps, translations and your booking confirmations before you leave the airport wifi." },
  ];

  const scrollEl = document.getElementById("chatScroll");
  const inputEl = document.getElementById("chatInput");
  const sendBtn = document.getElementById("chatSend");
  const statusEl = document.getElementById("chatServiceStatus");

  let serviceReachable = null; // true | false | null(unknown)
  let destinations = [];       // live country options for the build form

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function isMember() {
    return !!(It.session && It.session.hasToken());
  }

  function scrollBottom() {
    if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
  }

  function bubble(role, html, cls) {
    const wrap = document.createElement("div");
    wrap.className = "chat-msg " + role;
    wrap.innerHTML =
      '<span class="chat-avatar" aria-hidden="true"><i class="fas ' +
      (role === "user" ? "fa-user" : "fa-robot") + '"></i></span>' +
      '<div class="chat-bubble' + (cls ? " " + cls : "") + '">' + html + "</div>";
    scrollEl.appendChild(wrap);
    scrollBottom();
    return wrap;
  }

  function say(html, cls) { return bubble("bot", html, cls); }
  function userSay(text) {
    return bubble("user", '<span class="plain">' + esc(text) + "</span>");
  }

  function typing(on) {
    let el = document.getElementById("chatTyping");
    if (on && !el) {
      el = bubble("bot", '<span class="chat-typing" id="chatTyping" aria-label="Assistant is typing"><i></i><i></i><i></i></span>');
    } else if (!on && el) {
      el.remove();
    }
    scrollBottom();
  }

  function offlineNote(msg) {
    say(
      '<i class="fas fa-wifi mr-1" aria-hidden="true"></i>' + esc(msg || "The AI service is offline right now.") +
      ' Showing offline help instead — <a href="help.html">open the help page</a> for docs and FAQs.',
      "offline-note"
    );
  }

  function fmtMoney(n) {
    const v = Number(n);
    if (isNaN(v)) return String(n == null ? "" : n);
    return "$" + v.toLocaleString("en");
  }

  /* ── AI response rendering ─────────────────────────────────── */

  function renderItinerary(data) {
    if (!data || typeof data !== "object") {
      say("The assistant replied, but the response could not be read. Try again or <a href='help.html'>read the help page</a>.");
      return;
    }
    const sec = function (icon, title, content) {
      if (!content) return "";
      const items = Array.isArray(content)
        ? content.map(function (x) { return "<li>" + esc(String(x)) + "</li>"; }).join("")
        : "<p>" + esc(String(content)).replace(/\n/g, "<br>") + "</p>";
      return (
        '<div class="ai-section"><h5><i class="fas ' + icon + '" aria-hidden="true"></i>' + esc(title) + "</h5>" +
        (Array.isArray(content) ? "<ul>" + items + "</ul>" : items) +
        "</div>"
      );
    };

    let html = "";
    html += sec("fa-route", "Itinerary", data.itinerary);
    html += sec("fa-bus-simple", "Transportation tips", data.transportation_tips);
    html += sec("fa-sack-dollar", "Estimated costs", data.estimated_costs);
    html += sec("fa-map-pin", "Recommended attractions", data.recommended_attractions);
    html += sec("fa-utensils", "Recommended restaurants", data.recommended_restaurants);
    html += sec("fa-bed", "Recommended hotels", data.recommended_hotels);
    if (!html) html = "<p>No readable sections came back from the assistant.</p>";
    say("<div class='ai-tag'><i class='fas fa-wand-magic-sparkles' aria-hidden='true'></i>AI draft</div>" + html);
  }

  function renderReview(data) {
    const d = data && typeof data === "object" ? data : {};
    const summary = d.review_summary || d.summary || "";
    const suggestions = d.suggestions || [];
    let html =
      '<div class="ai-tag"><i class="fas fa-clipboard-check" aria-hidden="true"></i>AI review</div>';
    if (summary) html += '<div class="ai-section"><h5><i class="fas fa-file-lines" aria-hidden="true"></i>Review summary</h5><p>' + esc(summary).replace(/\n/g, "<br>") + "</p></div>";
    if (Array.isArray(suggestions) && suggestions.length) {
      html += '<div class="ai-section"><h5><i class="fas fa-list-check" aria-hidden="true"></i>Suggestions</h5><ul>' +
        suggestions.map(function (s) { return "<li>" + esc(String(s)) + "</li>"; }).join("") + "</ul></div>";
    } else if (suggestions && typeof suggestions === "string") {
      html += '<div class="ai-section"><h5><i class="fas fa-list-check" aria-hidden="true"></i>Suggestions</h5><p>' + esc(suggestions).replace(/\n/g, "<br>") + "</p></div>";
    }
    if (!summary && !suggestions) html += "<p>No readable review came back from the assistant.</p>";
    say(html);
  }

  /* ── Skill: trip tips (offline content) ────────────────────── */

  function tipsSkill() {
    const rows = TIPS.map(function (t) {
      return '<div class="ai-section"><h5><i class="fas ' + t.icon + '" aria-hidden="true"></i>' + esc(t.title) + "</h5><p>" + esc(t.text) + "</p></div>";
    }).join("");
    say(
      '<div class="ai-tag"><i class="fas fa-book" aria-hidden="true"></i>Offline help</div>' +
      "<p>Here are my tried-and-true trip tips (bundled, no connection needed):</p>" + rows
    );
  }

  /* ── Skill: build an itinerary ─────────────────────────────── */

  function buildFormCard() {
    const countryOpts = destinations.length
      ? destinations.map(function (c) {
          return '<option value="' + c.id + '">' + esc(c.name) + "</option>";
        }).join("")
      : '<option value="">Loading countries…</option>';

    const styleOpts = TRAVEL_STYLES.map(function (s) {
      return '<option value="' + s + '">' + esc(s.charAt(0).toUpperCase() + s.slice(1)) + "</option>";
    }).join("");

    const interestChips = INTERESTS.map(function (i) {
      return '<button type="button" class="chip" data-interest="' + i + '">' + esc(i) + "</button>";
    }).join("");

    say(
      '<div class="ai-tag"><i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i>AI generator</div>' +
      '<p class="mb-3">Tell me where and how you travel and I will draft an itinerary.</p>' +
      '<div class="chat-card" id="buildCard">' +
      '<div class="chat-tool-row two">' +
      "<div><label for=\"bCountry\">Country</label><select class=\"field-input\" id=\"bCountry\">" + countryOpts + "</select></div>" +
      "<div><label for=\"bDays\">Days</label><input type=\"number\" class=\"field-input\" id=\"bDays\" min=\"1\" max=\"30\" value=\"5\" /></div>" +
      "</div>" +
      '<div class="chat-tool-row two">' +
      "<div><label for=\"bBudget\">Budget (USD)</label><input type=\"number\" class=\"field-input\" id=\"bBudget\" min=\"50\" value=\"1500\" /></div>" +
      "<div><label for=\"bTravelers\">Travelers</label><input type=\"number\" class=\"field-input\" id=\"bTravelers\" min=\"1\" max=\"20\" value=\"2\" /></div>" +
      "</div>" +
      '<div class="chat-tool-row">' +
      "<div><label for=\"bStyle\">Travel style</label><select class=\"field-input\" id=\"bStyle\">" + styleOpts + "</select></div>" +
      "</div>" +
      '<div class="mb-1"><label>Interests <span class="text-white/30 font-normal normal-case tracking-normal">(pick any)</span></label>' +
      '<div class="flex flex-wrap gap-2 mt-1.5" id="bInterests">' + interestChips + "</div></div>" +
      '<p class="text-red-400 text-xs mt-2 hidden" id="buildErr" role="alert"></p>' +
      '<div class="flex items-center justify-between gap-3 mt-4 flex-wrap">' +
      '<span class="text-xs text-white/35"><i class="fas fa-hourglass-half mr-1" aria-hidden="true"></i>One AI call per draft — results are cached.</span>' +
      '<button type="button" class="btn-primary" id="buildGo"><i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i>Generate</button>' +
      "</div></div>"
    );

    const card = document.getElementById("buildCard");
    var activeFilter = 'all';
    var searchQuery = '';

    function renderConversations(filter) {
      if (filter !== undefined) activeFilter = filter;
      if (!elements.convList) return;

      var filtered = conversations;

      // Apply Filter Pills
      if (activeFilter && activeFilter !== 'all') {
        filtered = conversations.filter(function (c) {
          if (activeFilter === 'agency_inquiry') {
            return c.type === 'agency_inquiry' || (c.title && (c.title.includes('خدمة العملاء') || c.title.includes('Agency')));
          }
          return c.type === activeFilter;
        });
      }

      // Apply Text Search Query
      if (searchQuery) {
        filtered = filtered.filter(function (c) {
          var title = (c.title || '').toLowerCase();
          var userName = (c.user && c.user.name ? c.user.name : '').toLowerCase();
          var msg = (c.latest_message && c.latest_message.body ? c.latest_message.body : '').toLowerCase();
          return title.indexOf(searchQuery) !== -1 || userName.indexOf(searchQuery) !== -1 || msg.indexOf(searchQuery) !== -1;
        });
      }

      if (filtered.length === 0) {
        elements.convList.innerHTML = '<div class="text-center py-8 text-neutral-500 dark:text-white/40 text-xs">No conversations found.</div>';
        return;
      }

      var html = '';
      filtered.forEach(function (conv) {
        var isActive = conv.id === currentConversationId;
        var isEgyptianSupport = conv.type === 'agency_inquiry' || (conv.title && conv.title.includes('خدمة العملاء'));
        var avatarClass = conv.type === 'ai_concierge' ? 'ai' : (isEgyptianSupport ? 'agency' : '');
        var icon = conv.type === 'ai_concierge' ? '<i class="fas fa-robot"></i>' : (isEgyptianSupport ? '<span class="text-xs">🇪🇬</span>' : '<i class="fas fa-headset"></i>');
        var displayTitle = isAgencyUser() && conv.user && conv.user.name ? conv.user.name : (conv.title || 'Itinera Support');
        var excerpt = conv.latest_message ? conv.latest_message.body : 'No messages yet';
        if (excerpt.length > 45) excerpt = excerpt.substring(0, 42) + '...';

        html += '<div class="conversation-item ' + (isActive ? 'active' : '') + '" data-id="' + conv.id + '">';
        html += '  <div class="chat-avatar ' + avatarClass + '">' + icon + '</div>';
        html += '  <div class="flex-1 min-w-0">';
        html += '    <div class="flex items-center justify-between gap-1">';
        html += '      <span class="font-semibold text-sm truncate text-neutral-900 dark:text-white">' + escapeHtml(displayTitle) + '</span>';
        if (conv.unread_count > 0) {
          html += '      <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black">' + conv.unread_count + '</span>';
        }
        html += '    </div>';
        html += '    <p class="text-xs text-neutral-500 dark:text-white/50 truncate mt-0.5">' + escapeHtml(excerpt) + '</p>';
        html += '  </div>';
        html += '</div>';
      elements.convList.innerHTML = html;

      // Attach click handlers
      elements.convList.querySelectorAll('.conversation-item').forEach(function (item) {
        item.addEventListener('click', function () {
          var id = parseInt(this.getAttribute('data-id'), 10);
          selectConversation(id);
        });
      });
    }

    function isAdminUser() {
      var role = currentRole();
      return role === 'admin' || role === 'super_admin';
    }

    function showMentorReadOnlyBanner(conv) {
      var composerWrap = document.querySelector('.chat-composer-wrap');
      if (!composerWrap) return;
      var existing = document.getElementById('adminMentorBanner');
      if (existing) existing.remove();

      var banner = document.createElement('div');
      banner.id = 'adminMentorBanner';
      banner.className = 'p-3.5 rounded-2xl bg-purple-950/80 border border-purple-500/35 text-purple-200 text-xs font-semibold flex items-center justify-between flex-wrap gap-3 shadow-xl mb-3';
      banner.innerHTML =
        '<div class="flex items-center gap-2.5">' +
        '<div class="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-sm border border-purple-500/40"><i class="fas fa-eye"></i></div>' +
        '<div><div class="font-bold text-white text-xs uppercase tracking-wider">Admin Mentoring Mode (Read-Only)</div>' +
        '<div class="text-[11px] text-purple-300/80">Monitoring live chat between Customer &amp; Agency. You cannot post in this thread directly.</div></div>' +
        '</div>' +
        '<button type="button" id="adminIndependentChatBtn" class="px-3.5 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-black font-extrabold text-xs transition flex items-center gap-1.5 shadow">' +
        '<i class="fas fa-comments"></i> Message Separately →</button>';

      composerWrap.insertBefore(banner, composerWrap.firstChild);

      var btn = document.getElementById('adminIndependentChatBtn');
      if (btn) {
        btn.addEventListener('click', function() {
          switchToMode('direct_support');
        });
      }
    }

    function hideMentorReadOnlyBanner() {
      var existing = document.getElementById('adminMentorBanner');
      if (existing) existing.remove();
    }

    async function selectConversation(id) {
      currentConversationId = id;
      renderConversations();
      subscribeToConversationChannel(id);

      var conv = conversations.find(function (c) { return c.id === id; });
      if (conv) {
        if (elements.emptyState) elements.emptyState.classList.add('hidden');
        if (elements.chatActiveStage) elements.chatActiveStage.classList.remove('hidden');
        
        var isEgyptian = conv.type === 'agency_inquiry' || (conv.title && conv.title.includes('خدمة العملاء'));
        var isMentorMode = isAdminUser() && (conv.type === 'agency_inquiry' || conv.type === 'trip_assignment');
        
        if (elements.activeTitle) {
          elements.activeTitle.textContent = isAgencyUser() && conv.user && conv.user.name
            ? conv.user.name
            : (conv.title || (isEgyptian ? 'خدمة العملاء المصرية' : 'Itinera AI Concierge'));
        }

        if (elements.activeSubtitle) {
          var sub = conv.type === 'ai_concierge'
            ? 'AI Travel Assistant · Always Active ⚡'
            : (isMentorMode
              ? '👁️ Admin Mentoring Mode · Monitoring Customer & Agency Chat'
              : (isAgencyUser()
                ? 'Chatting with ' + ((conv.user && conv.user.name) || 'customer')
                : (isEgyptian ? '🇪🇬 خدمة العملاء المصرية · ممثل خدمة العملاء متصل الآن' : 'Dedicated Support Agent')));
          if (conv.trip) sub += ' · Trip: ' + conv.trip.title;
          elements.activeSubtitle.textContent = sub;
        }

        // Mentoring vs Active Chat Composer controls
        if (isMentorMode) {
          if (elements.chatInput) { elements.chatInput.disabled = true; elements.chatInput.placeholder = 'Read-Only Mentoring Mode — Click "Message Separately" to initiate independent support.'; }
          if (elements.sendBtn) elements.sendBtn.disabled = true;
          showMentorReadOnlyBanner(conv);
        } else {
          if (elements.chatInput) { elements.chatInput.disabled = false; elements.chatInput.placeholder = isAgencyUser() ? 'Message customer as agency...' : 'Ask AI Concierge or Support...'; }
          if (elements.sendBtn) elements.sendBtn.disabled = false;
          hideMentorReadOnlyBanner();
        }

        // Update Mode button active styles
        if (conv.type === 'ai_concierge') {
          if (elements.switchAiModeBtn) elements.switchAiModeBtn.className = 'px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 bg-amber-500 text-black shadow';
          if (elements.switchAgencyModeBtn) elements.switchAgencyModeBtn.className = 'px-3 py-1 rounded-lg text-xs font-semibold text-neutral-600 dark:text-white/70 hover:text-neutral-900 dark:hover:text-neutral-900 dark:text-white transition flex items-center gap-1.5';
          renderQuickPrompts('ai_concierge');
        } else {
          if (elements.switchAgencyModeBtn) elements.switchAgencyModeBtn.className = 'px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 bg-emerald-500 text-black shadow';
          if (elements.switchAiModeBtn) elements.switchAiModeBtn.className = 'px-3 py-1 rounded-lg text-xs font-semibold text-neutral-600 dark:text-white/70 hover:text-neutral-900 dark:hover:text-neutral-900 dark:text-white transition flex items-center gap-1.5';
          renderQuickPrompts('agency_inquiry');
        }
      }

      await loadMessages(id);
      markAsRead(id);
    }

    async function loadMessages(id) {
      if (!elements.messagesStream) return;
      try {
        var res = await global.It.apiGet('/conversations/' + id + '/messages', { auth: true });
        var data = res.body && res.body.data ? res.body.data : (res.data || []);
        messages = Array.isArray(data) ? data : [];
        renderMessages();
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    }

    function renderMessages() {
      if (!elements.messagesStream) return;

      if (messages.length === 0) {
        elements.messagesStream.innerHTML = isAgencyUser()
          ? '<div class="text-center py-12 text-neutral-500 dark:text-white/40 text-sm"><i class="fas fa-paper-plane text-emerald-400 mb-2 text-xl block"></i>No messages yet — say hello to your customer to open the conversation.</div>'
          : '<div class="text-center py-12 text-neutral-500 dark:text-white/40 text-sm"><i class="fas fa-sparkles text-amber-400 mb-2 text-xl block"></i>Start the conversation with your AI Concierge or خدمة العملاء المصرية!</div>';
        return;
      }

      var html = '';
      messages.forEach(function (msg) {
        var isUser = msg.sender_type === 'user' || msg.sender_type === 'customer';
        var isAgency = msg.sender_type === 'agency' || msg.sender_type === 'admin' || msg.sender_type === 'agent';
        var isAdmin = msg.sender_type === 'admin' || msg.sender_type === 'super_admin';
        var isAi = msg.sender_type === 'ai' || msg.sender_type === 'bot';

        var rowClass = isAi ? 'ai' : (isAdmin ? 'admin' : (isAgency ? 'agency' : 'customer'));
        var avatarClass = isAi ? 'ai' : (isAdmin ? 'admin' : (isAgency ? 'agency' : ''));
        var icon = isAi ? '<i class="fas fa-robot"></i>' : (isAdmin ? '<i class="fas fa-shield-halved"></i>' : (isAgency ? '<span class="text-xs">🇪🇬</span>' : '<i class="fas fa-user"></i>'));
        var time = msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

        var roleBadge = isAi
          ? '<span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-sky-500/20 text-sky-300 border border-sky-500/40"><i class="fas fa-robot mr-1"></i>AI Concierge</span>'
          : (isAdmin
            ? '<span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40"><i class="fas fa-shield-halved mr-1"></i>Admin Supervisor</span>'
            : (isAgency
              ? '<span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"><i class="fas fa-briefcase mr-1"></i>Agency Partner</span>'
              : '<span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40"><i class="fas fa-user mr-1"></i>Customer Traveler</span>'));

        var senderLabel = isAdmin
          ? (msg.sender_name || 'Admin Support')
          : (isAgencyUser() && isAgency
            ? agencyName()
            : (msg.sender_name || (isAi ? 'Itinera AI' : (isAgency ? 'خدمة العملاء المصرية' : 'Customer Traveler'))));

        html += '<div class="message-row ' + rowClass + '">';
        if (rowClass !== 'customer') {
          html += '  <div class="chat-avatar ' + avatarClass + '">' + icon + '</div>';
        }
        html += '  <div class="message-bubble">';
        html += '    <div class="flex items-center gap-2 mb-1.5">' + roleBadge + '</div>';
        html += '    <div class="message-text font-medium leading-relaxed">' + formatMessageBody(msg.body) + '</div>';
        html += '    <div class="message-meta opacity-75 mt-1.5"><span class="font-bold">' + escapeHtml(senderLabel) + '</span><span>•</span><span>' + time + '</span></div>';
        html += '  </div>';
        html += '</div>';
      });

      elements.messagesStream.innerHTML = html;
      elements.messagesStream.scrollTop = elements.messagesStream.scrollHeight;
    }
    const goBtn = document.getElementById("buildGo");
    const selected = new Set();
    card.querySelectorAll("[data-interest]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const v = btn.dataset.interest;
        if (selected.has(v)) selected.delete(v); else selected.add(v);
        btn.classList.toggle("on", selected.has(v));
      });
    });

    if (!destinations.length) {
      // Country list failed to load — try once more live.
      It.apiGet(ROUTES.destinations).then(function (res) {
        if (res.ok && res.body) {
          destinations = countryOptions(res.body);
          const sel = document.getElementById("bCountry");
          if (sel && destinations.length) {
            sel.innerHTML = destinations.map(function (c) {
              return '<option value="' + c.id + '">' + esc(c.name) + "</option>";
            }).join("");
          }
        }
      }).catch(function () { /* stays on loading note */ });
    }

    goBtn.addEventListener("click", function () {
      errEl.classList.add("hidden");
      const countryId = document.getElementById("bCountry").value;
      const days = parseInt(document.getElementById("bDays").value, 10);
      const budget = parseFloat(document.getElementById("bBudget").value);
      const travelers = parseInt(document.getElementById("bTravelers").value, 10);
      const style = document.getElementById("bStyle").value;
      const interests = Array.from(selected);

      let firstErr = null;
      if (!countryId) firstErr = "Pick a country.";
      else if (!days || days < 1 || days > 30) firstErr = "Days must be between 1 and 30.";
      else if (!budget || budget < 50) firstErr = "Budget must be at least $50.";
      else if (!travelers || travelers < 1) firstErr = "Travelers must be at least 1.";
      else if (!style) firstErr = "Pick a travel style.";
      else if (!interests.length) firstErr = "Pick at least one interest.";
      if (firstErr) {
        errEl.textContent = firstErr;
        errEl.classList.remove("hidden");
        return;
      }

      goBtn.disabled = true;
      goBtn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Generating…';
      typing(true);

      It.apiPost(ROUTES.generate, {
        destination_country_id: countryId,
        number_of_days: days,
        budget: budget,
        interests: interests,
        number_of_travelers: travelers,
        travel_style: style,
      }, { auth: true }).then(function (res) {
        typing(false);
        goBtn.disabled = false;
        goBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i>Generate';
        if (res.ok) {
          renderItinerary(res.body && res.body.data);
          return;
        }
        const body = res.body || {};
        if (res.status === 403) {
          errEl.textContent = "Your account does not have permission to generate itineraries yet.";
          errEl.classList.remove("hidden");
          offlineNote("The AI generator is restricted to approved accounts — you can still read the offline help.");
          return;
        }
        let msg = null;
        if (body.error && Array.isArray(body.error.validation_errors)) {
          msg = body.error.validation_errors.map(function (v) { return v.message; }).join(" ");
        }
        if (!msg && body.error && body.error.message) msg = body.error.message;
        if (!msg && body.errors) msg = (Array.isArray(body.errors) ? body.errors : JSON.stringify(body.errors));
        errEl.textContent = msg || "The AI service could not generate a draft right now.";
        errEl.classList.remove("hidden");
        if (res.status === 402) {
          errEl.innerHTML = msg + ' <a href="plans.html" style="color:#fff;text-decoration:underline;font-weight:600;">View plans</a>';
        }
        offlineNote("The AI generator is unreachable — showing offline help instead.");
      }).catch(function () {
        typing(false);
        goBtn.disabled = false;
        goBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i>Generate';
        errEl.textContent = "Could not reach the AI service. Please try again.";
        errEl.classList.remove("hidden");
        offlineNote("The server is unreachable — showing offline help instead.");
      });
    });
  }

  /* ── Skill: review my plans ────────────────────────────────── */

  function reviewSkill() {
    if (!isMember()) {
      say("Your saved trips power this — sign in first and I will pull the real context.");
      if (typeof global.openAuthModal === "function") {
        global.openAuthModal("login", "Sign in to have your saved trips reviewed.");
      }
      return;
    }
    typing(true);
    It.apiGet(ROUTES.trips, { auth: true })
      .then(function (res) {
        typing(false);
        const trips = (res.ok && res.body && Array.isArray(res.body.data)) ? res.body.data : [];
        if (!trips.length) {
          say(
            '<div class="ai-tag"><i class="fas fa-clipboard-check" aria-hidden="true"></i>Review my plans</div>' +
            "<p>You have no saved trips yet, so there is nothing to review.</p>" +
            '<div class="mt-4"><a href="booking.html" class="btn-outline"><i class="fas fa-plane" aria-hidden="true"></i>Plan a trip</a></div>'
          );
          return;
        }
        const rows = trips.map(function (t) {
          const meta = [t.travel_style, t.no_of_days ? t.no_of_days + "d" : "", t.budget != null ? fmtMoney(t.budget) : ""].filter(Boolean).join(" · ");
          return '<button type="button" class="chat-trip-btn" data-trip="' + t.id + '">' +
            '<i class="fas fa-suitcase text-white/40" aria-hidden="true"></i>' +
            "<span>" + esc(t.title || "Untitled trip") + "</span>" +
            (meta ? '<span class="t-meta">' + esc(meta) + "</span>" : "") +
            "</button>";
        }).join("");
        say(
          '<div class="ai-tag"><i class="fas fa-clipboard-check" aria-hidden="true"></i>Review my plans</div>' +
          "<p>Pick a saved trip and I will review it against your real itinerary items:</p>" +
          '<div class="chat-card flex flex-col gap-2">' + rows + "</div>"
        );
        document.querySelectorAll(".chat-trip-btn").forEach(function (btn) {
          btn.addEventListener("click", function () {
            const tripId = btn.dataset.trip;
            const trip = trips.find(function (t) { return String(t.id) === String(tripId); });
            reviewTrip(trip);
          });
        });
      })
      .catch(function () {
        typing(false);
        offlineNote("Could not load your trips — the server is unreachable. Showing offline help instead.");
      });
  }

  function reviewTrip(trip) {
    userSay("Review: " + (trip && trip.title ? trip.title : "my trip"));
    typing(true);
    It.apiGet(ROUTES.review(trip.id), { auth: true })
      .then(function (res) {
        typing(false);
        if (res.ok) {
          renderReview(res.body && res.body.data);
          return;
        }
        const body = res.body || {};
        if (res.status === 404) {
          offlineNote((body.message || "That trip could not be found.") + " It may have been deleted, or it belongs to another account.");
          return;
        }
        if (res.status === 402 && body.error && body.error.message) {
          offlineNote(body.error.message + ' <a href="plans.html" style="text-decoration:underline;">View plans</a>');
          return;
        }
        offlineNote((body.message || "The AI review service is unavailable right now.") + " Showing offline help instead.");
      })
      .catch(function () {
        typing(false);
        offlineNote("The AI review service is unreachable — showing offline help instead.");
      });
  }

  /* ── Free-text input (offline keyword replies) ─────────────── */

  function freeText(text) {
    const t = text.toLowerCase();
    if (/(tip|advice|hint|suggest.*(pack|book|save|visit))/.test(t)) return tipsSkill();
    if (/(build|generate|make|create).*(itinerar|plan|trip)|itinerar/.test(t)) return buildFormCard();
    if (/(review|check|improve).*(plan|trip|itinerar)|review/.test(t)) return reviewSkill();
    if (/(budget|cost|price|money|expensive)/.test(t)) {
      say("Budget-wise, add a 15–20% buffer on top of your estimate and book early for the best rates. Want me to draft an itinerary with a budget cap? Use <b>Build an itinerary</b>.");
      return;
    }
    if (/(visa|passport|document)/.test(t)) {
      say("Check passport validity (6+ months) and visa rules for every country you touch — including transit layovers. The full list is on the <a href='help.html'>help page</a>.");
      return;
    }
    if (/(pack|luggage|bag)/.test(t)) {
      say("Pack light, layer smart: 7–10 days fits in a carry-on. Roll clothes and always pack a light layer for planes. See <b>Trip tips</b> for more.");
      return;
    }
    if (/(help|offline|faq|doc)/.test(t)) {
      say("I am running in offline-help mode right now. The full FAQ and docs live on the <a href='help.html'>help page</a>.");
      return;
    }
    say(
      "I can help with trip tips, building an itinerary, or reviewing your saved plans — try the suggestion buttons above." +
      (serviceReachable === false ? ' <a href="help.html">Offline help</a> is always available.' : "")
    );
  }

  /* ── Boot ──────────────────────────────────────────────────── */

  function countryOptions(body) {
    const list = (body && Array.isArray(body.data)) ? body.data : [];
    const map = {};
    list.forEach(function (d) {
      if (d.country && d.country.id) {
        map[d.country.id] = { id: d.country.id, name: d.country.name || "Country " + d.country.id };
      }
    });
    return Object.keys(map).map(function (k) { return map[k]; })
      .sort(function (a, b) { return a.name.localeCompare(b.name); });
  }

  function greet() {
    say(
      "Hi — I am the Itinera assistant. I can share <b>trip tips</b>, <b>build an itinerary draft</b>, or <b>review your saved plans</b> with real context from the Trip Planner." +
      (isMember() ? "" : " Sign in for itinerary building and plan review.")
    );
  }

  document.addEventListener("itinera:auth", function () { /* session changed — nothing pending to resume */ });

  document.querySelectorAll("#suggestionChips .chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      document.querySelectorAll("#suggestionChips .chip").forEach(function (c) { c.classList.remove("on"); });
      chip.classList.add("on");
      const mode = chip.dataset.suggest;
      if (mode === "tips") { userSay("Trip tips"); tipsSkill(); }
      else if (mode === "build") { userSay("Build an itinerary"); buildFormCard(); }
      else { userSay("Review my plans"); reviewSkill(); }
    });
  });

  function submitText() {
    const text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = "";
    userSay(text);
    typing(true);
    global.setTimeout(function () {
      typing(false);
      freeText(text);
    }, 450);
  }

  sendBtn.addEventListener("click", submitText);
  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); submitText(); }
  });

  // Service status probe (read-only; AI availability is only known per-call).
  It.apiGet(ROUTES.destinations)
    .then(function (res) {
      serviceReachable = res.ok;
      statusEl.innerHTML = res.ok
        ? '<i class="fas fa-circle-check text-green-400 mr-1" aria-hidden="true"></i>Backend reachable — AI replies depend on the Groq key and your permissions.'
        : '<i class="fas fa-triangle-exclamation text-amber-400 mr-1" aria-hidden="true"></i>Backend responding, but with errors — AI replies may fail.';
      if (res.ok && res.body) destinations = countryOptions(res.body);
    })
    .catch(function () {
      serviceReachable = false;
      statusEl.innerHTML = '<i class="fas fa-wifi text-amber-400 mr-1" aria-hidden="true"></i>Backend unreachable — showing offline help.';
    });

  greet();
})(window);
