/**
 * chat.js — Real-Time Messaging, Reverb WebSocket & AI / Egyptian Support Agent Switcher
 * Handles live messaging via Laravel Reverb (Echo), AI Concierge interactions,
 * direct Egyptian Customer Support (خدمة العملاء المصرية), and stream syncing.
 *
 * @module modules/customer/chat
 */
(function (global) {
  'use strict';

  var currentConversationId = null;
  var conversations = [];
  var messages = [];
  var pollTimer = null;
  var isSending = false;
  var activeChannel = null;
  var echoInstance = null;

  var elements = {};

  var deepLink = { customerId: null, assignmentId: null, customerName: null };

  function parseDeepLink() {
    try {
      var qs = new global.URLSearchParams(global.location.search || '');
      var cid = qs.get('customer_id');
      var aid = qs.get('assignment_id');
      if (cid) deepLink.customerId = parseInt(cid, 10);
      if (aid) deepLink.assignmentId = parseInt(aid, 10);
      deepLink.customerName = qs.get('customer') || null;
    } catch (err) {}
  }

  function sessionUser() {
    try {
      var It = global.Itinari || {};
      return (It.session && It.session.user) || JSON.parse(global.localStorage.getItem('itinari_user') || 'null');
    } catch (err) {
      return null;
    }
  }

  function currentRole() {
    try {
      var user = sessionUser();
      return user ? (user.role || (user.roles && user.roles[0]) || '') : '';
    } catch (err) {
      return '';
    }
  }

  function agencyName() {
    var user = sessionUser();
    if (!user) return 'Agency Support';
    return user.name || 'Agency Support';
  }

  function isAgencyUser() {
    var role = currentRole();
    return role === 'agency' || role === 'agency_manager' || role === 'agent';
  }

  var PROMPTS_AI = [
    { label: '✨ Recommend top 3 cultural highlights', text: 'Recommend top 3 luxury cultural highlights for my next journey' },
    { label: '🍽️ Suggest Michelin fine dining', text: 'Suggest 5-star Michelin fine dining restaurants with reservation tips' },
    { label: '🏨 Find 5-star boutique hotels', text: 'Find top-rated 5-star boutique hotel suites' },
    { label: '☀️ Check seasonal weather', text: 'Check the best travel months and seasonal weather' }
  ];

  var PROMPTS_EGYPTIAN_SUPPORT = [
    { label: '🇪🇬 استفسار عن حجز الرحلة', text: 'أهلاً، أود الاستفسار عن تفاصيل وحالة حجز الرحلة الخاصة بي' },
    { label: '📞 طلب التواصل مع ممثل خدمة العملاء', text: 'برجاء تحويل الطلب لممثل خدمة العملاء لمساعدتي في تعديل الحجز' },
    { label: '🗓️ طلب تعديل موعد السفر', text: 'أرغب في الاستفسار عن إمكانية تعديل تاريخ السفر أو إلغاء الحجز' },
    { label: '🏨 أسعار الفنادق والطيران المتاحة', text: 'ما هي أفضل العروض والخصومات المتاحة حالياً على الفنادق والطيران؟' }
  ];

  var PROMPTS_AGENCY = [
    { label: '✈️ Send trip brief', text: 'Hi! Your trip assignment is confirmed. Here is what happens next: our team will prepare your personalized itinerary, and you can review and adjust it with me at any time.' },
    { label: '💰 Check budget', text: 'To tailor the best itinerary for you, could you share your preferred budget range and travel dates?' },
    { label: '🏨 Offer options', text: 'I can arrange your 5-star hotel, flights and private experiences. Let me know your top preferences and I will prepare the options.' },
    { label: '✅ Confirm details', text: 'Everything is set for your trip. I will confirm the final details shortly — feel free to ask me anything in the meantime.' }
  ];

  function init() {
    cacheElements();
    attachEvents();
    initEchoReverb();
    parseDeepLink();
    if (isAgencyUser()) {
      if (elements.chatInput) elements.chatInput.setAttribute('placeholder', 'Message this customer as the agency...');
      if (elements.switchAiModeBtn) elements.switchAiModeBtn.style.display = 'none';
      if (elements.switchAgencyModeBtn) elements.switchAgencyModeBtn.style.display = 'none';
      var reportBtn = document.getElementById('reportUserBtn');
      if (reportBtn) {
        reportBtn.href = 'report-user.html?assignment_id=' + (deepLink.assignmentId || '') + '&customer=' + encodeURIComponent(deepLink.customerName || '');
      }
      renderQuickPrompts('agency_inquiry');
    }
    loadConversations();
    startPolling();
  }

  function cacheElements() {
    elements.convList = document.getElementById('conversationList');
    elements.activeTitle = document.getElementById('chatActiveTitle');
    elements.activeSubtitle = document.getElementById('chatActiveSubtitle');
    elements.messagesStream = document.getElementById('messagesStream');
    elements.chatForm = document.getElementById('chatForm');
    elements.chatInput = document.getElementById('chatInput');
    elements.sendBtn = document.getElementById('sendBtn');
    elements.emptyState = document.getElementById('chatEmptyState');
    elements.chatActiveStage = document.getElementById('chatActiveStage');
    elements.newChatBtn = document.getElementById('newChatBtn');
    elements.newChatModal = document.getElementById('newChatModal');
    elements.closeNewChatModal = document.getElementById('closeNewChatModal');
    elements.createConvForm = document.getElementById('createConvForm');
    elements.switchAiModeBtn = document.getElementById('switchAiModeBtn');
    elements.switchAgencyModeBtn = document.getElementById('switchAgencyModeBtn');
    elements.wsStatusBadge = document.getElementById('wsStatusBadge');
    elements.quickPromptsContainer = document.getElementById('quickPromptsContainer');
  }

  function attachEvents() {
    // Input auto-expand & Enter to send
    if (elements.chatInput) {
      elements.chatInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
      });

      elements.chatInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (elements.chatForm) elements.chatForm.dispatchEvent(new Event('submit'));
        }
      });
    }

    if (elements.chatForm) {
      elements.chatForm.addEventListener('submit', function (e) {
        e.preventDefault();
        sendMessage();
      });
    }

    // Filter pills
    var filterPills = document.querySelectorAll('.filter-pill');
    filterPills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        filterPills.forEach(function (p) { p.classList.remove('active'); });
        this.classList.add('active');
        var filter = this.getAttribute('data-filter');
        renderConversations(filter);
      });
    });

    // Mode Switcher Buttons (AI ⇄ خدمة العملاء المصرية)
    if (elements.switchAiModeBtn) {
      elements.switchAiModeBtn.addEventListener('click', function () {
        switchToMode('ai_concierge');
      });
    }

    if (elements.switchAgencyModeBtn) {
      elements.switchAgencyModeBtn.addEventListener('click', function () {
        switchToMode('agency_inquiry');
      });
    }

    // New Chat Modal
    if (elements.newChatBtn && elements.newChatModal) {
      elements.newChatBtn.addEventListener('click', function () {
        elements.newChatModal.classList.remove('hidden');
      });
    }

    if (elements.closeNewChatModal && elements.newChatModal) {
      elements.closeNewChatModal.addEventListener('click', function () {
        elements.newChatModal.classList.add('hidden');
      });
    }

    if (elements.createConvForm) {
      elements.createConvForm.addEventListener('submit', function (e) {
        e.preventDefault();
        createConversation();
      });
    }
  }

  /* ── Reverb WebSocket Initialization ── */
  function initEchoReverb() {
    if (typeof window.Echo === 'undefined' || typeof window.Pusher === 'undefined') {
      console.warn('Reverb/Pusher JS client library not loaded. Falling back to HTTP heartbeat polling.');
      updateWsStatus(false, 'Polling Mode');
      return;
    }

    try {
      var appConfig = window.APP_CONFIG || {};
      var token = global.Itinari ? global.Itinari.readToken() : '';
      var host = window.location.hostname || '127.0.0.1';

      echoInstance = new window.Echo({
        broadcaster: 'reverb',
        key: appConfig.REVERB_APP_KEY || 'app-key',
        wsHost: host,
        wsPort: 8080,
        wssPort: 443,
        forceTLS: false,
        enabledTransports: ['ws', 'wss'],
        authEndpoint: (appConfig.API_BASE_URL || '/api') + '/broadcasting/auth',
        auth: {
          headers: {
            Authorization: 'Bearer ' + token
          }
        }
      });

      updateWsStatus(true, 'Reverb Live');
    } catch (err) {
      console.error('Failed to initialize Reverb Echo:', err);
      updateWsStatus(false, 'Offline Fallback');
    }
  }

  function subscribeToConversationChannel(convId) {
    if (!echoInstance) return;

    if (activeChannel) {
      echoInstance.leave('conversation.' + activeChannel);
      activeChannel = null;
    }

    activeChannel = convId;
    echoInstance.private('conversation.' + convId)
      .listen('.message.sent', function (e) {
        console.log('Real-Time Reverb Message Received:', e);
        if (e && e.conversation_id === currentConversationId) {
          // Prevent duplicates if already optimistically rendered
          var exists = messages.some(function (m) { return m.id === e.id || (m.body === e.body && m.sender_type === e.sender_type); });
          if (!exists) {
            messages.push(e);
            renderMessages();
          }
        }
      });
  }

  function updateWsStatus(online, text) {
    if (!elements.wsStatusBadge) return;
    if (online) {
      elements.wsStatusBadge.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      elements.wsStatusBadge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> ' + (text || 'Reverb Live');
    } else {
      elements.wsStatusBadge.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30';
      elements.wsStatusBadge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> ' + (text || 'Polling');
    }
  }

  /* ── Mode Switcher Logic (AI ⇄ خدمة العملاء المصرية) ── */
  async function switchToMode(modeType) {
    // Update Mode button visual styles
    if (modeType === 'ai_concierge') {
      if (elements.switchAiModeBtn) elements.switchAiModeBtn.className = 'px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 bg-amber-500 text-black shadow';
      if (elements.switchAgencyModeBtn) elements.switchAgencyModeBtn.className = 'px-3 py-1 rounded-lg text-xs font-semibold text-neutral-600 dark:text-white/70 hover:text-neutral-900 dark:hover:text-neutral-900 dark:text-white transition flex items-center gap-1.5';
    } else {
      if (elements.switchAgencyModeBtn) elements.switchAgencyModeBtn.className = 'px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 bg-emerald-500 text-black shadow';
      if (elements.switchAiModeBtn) elements.switchAiModeBtn.className = 'px-3 py-1 rounded-lg text-xs font-semibold text-neutral-600 dark:text-white/70 hover:text-neutral-900 dark:hover:text-neutral-900 dark:text-white transition flex items-center gap-1.5';
    }

    // Update Quick Prompts Bar
    renderQuickPrompts(modeType);

    // Find existing conversation of this type
    var targetConv = conversations.find(function (c) { return c.type === modeType; });
    if (targetConv) {
      selectConversation(targetConv.id);
    } else {
      // Create new conversation automatically for this mode
      var title = modeType === 'ai_concierge' ? 'Itinera AI Concierge' : 'خدمة العملاء المصرية · Travel Support';
      var initialMsg = modeType === 'ai_concierge' ? 'Hello AI Concierge, I need assistance planning my journey.' : 'مرحباً، أود الاستفسار والتواصل مع ممثل خدمة العملاء المصرية';
      
      try {
        var res = await global.It.apiPost('/conversations', {
          type: modeType,
          title: title,
          initial_message: initialMsg
        }, { auth: true });

        var newConv = res.body && res.body.data ? res.body.data : res.data;
        await loadConversations();
        if (newConv && newConv.id) {
          selectConversation(newConv.id);
        }
      } catch (err) {
        console.error('Failed to auto-switch conversation mode:', err);
      }
    }
  }

  function renderQuickPrompts(modeType) {
    if (!elements.quickPromptsContainer) return;
    var prompts = isAgencyUser()
      ? PROMPTS_AGENCY
      : (modeType === 'agency_inquiry' || modeType === 'direct_support' ? PROMPTS_EGYPTIAN_SUPPORT : PROMPTS_AI);

    var html = '';
    prompts.forEach(function (p) {
      html += '<button type="button" class="prompt-chip" data-text="' + escapeHtml(p.text) + '">' + p.label + '</button>';
    });

    elements.quickPromptsContainer.innerHTML = html;

    elements.quickPromptsContainer.querySelectorAll('.prompt-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        if (elements.chatInput) {
          elements.chatInput.value = this.getAttribute('data-text') || this.textContent.trim();
          elements.chatInput.focus();
        }
      });
    });
  }

  async function loadConversations() {
    try {
      var res = await global.It.apiGet('/conversations', { auth: true });
      var data = res.body && res.body.data ? res.body.data : (res.data || []);
      conversations = Array.isArray(data) ? data : [];
      renderConversations('all');

      // Auto-select: honor a customer deep-link first, otherwise pick the latest thread
      if (!currentConversationId) {
        if (deepLink.customerId) {
          var target = conversations.find(function (c) {
            return c.user && Number(c.user.id) === deepLink.customerId;
          });
          if (target) {
            selectConversation(target.id);
          } else {
            showDeepLinkEmpty();
          }
        } else if (conversations.length > 0) {
          selectConversation(conversations[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }

  async function startAgencyChat() {
    if (!deepLink.customerId) return;
    var btn = document.querySelector('[data-start-chat]');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Starting chat...';
    }
    try {
      var res = await global.It.apiPost('/conversations', {
        type: 'agency_inquiry',
        customer_id: deepLink.customerId,
        title: 'Agency Support' + (deepLink.customerName ? ' · ' + deepLink.customerName : ''),
        initial_message: 'Hello! Your Itinari agency partner is here to help plan your trip.'
      }, { auth: true });
    } catch (err) {
      console.error('Failed to start agency chat:', err);
    }
    if (elements.emptyState) elements.emptyState.classList.add('hidden');
    await loadConversations();
  }

  function showDeepLinkEmpty() {
    var stage = elements.emptyState;
    if (!stage) return;
    stage.classList.remove('hidden');
    if (elements.chatActiveStage) elements.chatActiveStage.classList.add('hidden');
    var ref = [];
    if (deepLink.assignmentId) ref.push('Assignment #' + deepLink.assignmentId);
    if (deepLink.customerId) ref.push('Customer #' + deepLink.customerId);
    stage.innerHTML =
      '<div class="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl mb-4">' +
      '<i class="fas fa-comments"></i></div>' +
      '<h3 class="text-xl font-bold text-neutral-900 dark:text-white mb-2">No active chat with this customer yet</h3>' +
      '<p class="text-sm text-neutral-500 dark:text-white/60 max-w-md mb-6 leading-relaxed">' +
      'You can open a new support thread now. The customer will see it in their AI Concierge / travel support chat and can reply from there.</p>' +
      (isAgencyUser()
        ? '<button type="button" data-start-chat class="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition flex items-center gap-1.5">' +
          '<i class="fas fa-plus"></i> Start a chat with this customer</button>'
        : '') +
      (ref.length ? '<p class="text-xs text-neutral-500 dark:text-white/40 max-w-md mt-4">' + ref.join(' · ') + '</p>' : '');
    var startBtn = stage.querySelector('[data-start-chat]');
    if (startBtn) startBtn.addEventListener('click', startAgencyChat);
  }

  function renderConversations(filter) {
    if (!elements.convList) return;

    var filtered = conversations;
    if (filter && filter !== 'all') {
      filtered = conversations.filter(function (c) { return c.type === filter; });
    }

    if (filtered.length === 0) {
      elements.convList.innerHTML = '<div class="text-center py-8 text-neutral-500 dark:text-white/40 text-xs">No conversations found. Start a new chat!</div>';
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
    });

    elements.convList.innerHTML = html;

    // Attach click handlers
    elements.convList.querySelectorAll('.conversation-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var id = parseInt(this.getAttribute('data-id'), 10);
        selectConversation(id);
      });
    });
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
      
      if (elements.activeTitle) {
        elements.activeTitle.textContent = isAgencyUser() && conv.user && conv.user.name
          ? conv.user.name
          : (conv.title || (isEgyptian ? 'خدمة العملاء المصرية' : 'Itinera AI Concierge'));
      }

      if (elements.activeSubtitle) {
        var sub = conv.type === 'ai_concierge'
          ? 'AI Travel Assistant · Always Active ⚡'
          : (isAgencyUser()
            ? 'Chatting with ' + ((conv.user && conv.user.name) || 'customer')
            : (isEgyptian ? '🇪🇬 خدمة العملاء المصرية · ممثل خدمة العملاء متصل الآن' : 'Dedicated Support Agent'));
        if (conv.trip) sub += ' · Trip: ' + conv.trip.title;
        elements.activeSubtitle.textContent = sub;
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
      var isUser = msg.sender_type === 'user';
      var isAgency = msg.sender_type === 'agency' || msg.sender_type === 'admin';
      var myMessage = isUser || (isAgencyUser() && isAgency);
      var avatarClass = msg.sender_type === 'ai' ? 'ai' : (isAgency ? 'agency' : '');
      var icon = msg.sender_type === 'ai' ? '<i class="fas fa-robot"></i>' : (isAgency ? '<span class="text-xs">🇪🇬</span>' : '<i class="fas fa-user"></i>');
      var time = msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      var senderLabel = isAgencyUser() && isAgency
        ? agencyName()
        : (msg.sender_name || (msg.sender_type === 'ai' ? 'Itinera AI' : (isAgency ? 'خدمة العملاء المصرية' : 'You')));

      html += '<div class="message-row ' + (myMessage ? 'user' : (msg.sender_type === 'ai' ? 'ai' : 'agency')) + '">';
      if (!myMessage) {
        html += '  <div class="chat-avatar ' + avatarClass + '">' + icon + '</div>';
      }
      html += '  <div class="message-bubble">';
      html += '    <div class="message-text">' + formatMessageBody(msg.body) + '</div>';
      html += '    <div class="message-meta"><span>' + escapeHtml(senderLabel) + '</span><span>•</span><span>' + time + '</span></div>';
      html += '  </div>';
      html += '</div>';
    });

    elements.messagesStream.innerHTML = html;
    elements.messagesStream.scrollTop = elements.messagesStream.scrollHeight;
  }

  async function sendMessage() {
    if (!currentConversationId || isSending) return;
    var text = elements.chatInput ? elements.chatInput.value.trim() : '';
    if (!text) return;

    isSending = true;
    if (elements.sendBtn) elements.sendBtn.disabled = true;
    if (elements.chatInput) {
      elements.chatInput.value = '';
      elements.chatInput.style.height = 'auto';
    }

    // Optimistic UI append (agency sends as agency, customer sends as user)
    var actingAsAgency = isAgencyUser();
    messages.push({
      sender_type: actingAsAgency ? 'agency' : 'user',
      sender_name: actingAsAgency ? agencyName() : 'You',
      body: text,
      created_at: new Date().toISOString()
    });
    renderMessages();

    // Show AI or Agent typing indicator (the *other* side is typing)
    var conv = conversations.find(function (c) { return c.id === currentConversationId; });
    var typingEl = null;
    if (conv && conv.type === 'ai_concierge') {
      typingEl = document.createElement('div');
      typingEl.className = 'message-row ai typing-indicator';
      typingEl.innerHTML = '<div class="chat-avatar ai"><i class="fas fa-robot"></i></div><div class="message-bubble text-amber-400 text-xs flex items-center gap-2"><i class="fas fa-spinner fa-spin"></i> Itinera AI Concierge is curating your response...</div>';
      elements.messagesStream.appendChild(typingEl);
      elements.messagesStream.scrollTop = elements.messagesStream.scrollHeight;
    } else if (conv && (conv.type === 'agency_inquiry' || conv.type === 'direct_support')) {
      if (actingAsAgency) {
        typingEl = document.createElement('div');
        typingEl.className = 'message-row user typing-indicator';
        typingEl.innerHTML = '<div class="message-bubble text-neutral-500 dark:text-white/60 text-xs flex items-center gap-2 justify-end"><i class="fas fa-spinner fa-spin"></i> Customer is typing...</div>';
      } else {
        typingEl = document.createElement('div');
        typingEl.className = 'message-row agency typing-indicator';
        typingEl.innerHTML = '<div class="chat-avatar agency"><span class="text-xs">🇪🇬</span></div><div class="message-bubble text-emerald-400 text-xs flex items-center gap-2"><i class="fas fa-spinner fa-spin"></i> ممثل خدمة العملاء المصرية يكتب الآن...</div>';
      }
      elements.messagesStream.appendChild(typingEl);
      elements.messagesStream.scrollTop = elements.messagesStream.scrollHeight;
    }

    try {
      var res = await global.It.apiPost('/conversations/' + currentConversationId + '/messages', { body: text }, { auth: true });
      if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);

      await loadMessages(currentConversationId);
      loadConversations();
    } catch (err) {
      if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
      console.error('Failed to send message:', err);
    } finally {
      isSending = false;
      if (elements.sendBtn) elements.sendBtn.disabled = false;
    }
  }

  async function createConversation() {
    var type = document.getElementById('newConvType').value;
    var title = document.getElementById('newConvTitle').value.trim();
    var msg = document.getElementById('newConvMsg').value.trim();

    try {
      var res = await global.It.apiPost('/conversations', {
        type: type,
        title: title || (type === 'ai_concierge' ? 'AI Concierge Session' : 'خدمة العملاء المصرية'),
        initial_message: msg || undefined
      }, { auth: true });

      var newConv = res.body && res.body.data ? res.body.data : res.data;
      if (elements.newChatModal) elements.newChatModal.classList.add('hidden');
      if (elements.createConvForm) elements.createConvForm.reset();

      await loadConversations();
      if (newConv && newConv.id) {
        selectConversation(newConv.id);
      }
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  }

  async function markAsRead(id) {
    try {
      await global.It.apiPatch('/conversations/' + id + '/read', {}, { auth: true });
      var conv = conversations.find(function (c) { return c.id === id; });
      if (conv) conv.unread_count = 0;
      renderConversations();
    } catch (e) {}
  }

  function startPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(function () {
      if (currentConversationId && !isSending) {
        loadMessages(currentConversationId);
      }
      loadConversations();
    }, 6000);
  }

  function formatMessageBody(text) {
    if (!text) return '';
    var safe = escapeHtml(text);
    safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/\*(.*?)\*/g, '<em>$1</em>');
    safe = safe.replace(/\n\n/g, '<br/><br/>');
    safe = safe.replace(/\n/g, '<br/>');
    return safe;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Self-init on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(typeof window !== 'undefined' ? window : this);
