/**
 * chat.js — Real-Time Messaging & AI Travel Concierge Client
 * Handles live messaging, AI interactions, agency inquiries, and active stream syncing.
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

  var elements = {};

  function init() {
    cacheElements();
    attachEvents();
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
  }

  function attachEvents() {
    // Message input auto-expand & submit
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

    // Quick prompt chips
    var promptChips = document.querySelectorAll('.prompt-chip');
    promptChips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        if (elements.chatInput) {
          elements.chatInput.value = this.textContent.trim();
          elements.chatInput.focus();
        }
      });
    });

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

  async function loadConversations() {
    try {
      var res = await global.It.apiGet('/conversations', { auth: true });
      var data = res.body && res.body.data ? res.body.data : (res.data || []);
      conversations = Array.isArray(data) ? data : [];
      renderConversations('all');

      // Auto-select first conversation if not already selected
      if (!currentConversationId && conversations.length > 0) {
        selectConversation(conversations[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }

  function renderConversations(filter) {
    if (!elements.convList) return;

    var filtered = conversations;
    if (filter && filter !== 'all') {
      filtered = conversations.filter(function (c) { return c.type === filter; });
    }

    if (filtered.length === 0) {
      elements.convList.innerHTML = '<div class="text-center py-8 text-white/40 text-xs">No conversations found. Start a new chat!</div>';
      return;
    }

    var html = '';
    filtered.forEach(function (conv) {
      var isActive = conv.id === currentConversationId;
      var avatarClass = conv.type === 'ai_concierge' ? 'ai' : (conv.type === 'agency_inquiry' ? 'agency' : '');
      var icon = conv.type === 'ai_concierge' ? '<i class="fas fa-robot"></i>' : (conv.type === 'agency_inquiry' ? '<i class="fas fa-briefcase"></i>' : '<i class="fas fa-headset"></i>');
      var excerpt = conv.latest_message ? conv.latest_message.body : 'No messages yet';
      if (excerpt.length > 45) excerpt = excerpt.substring(0, 42) + '...';

      html += '<div class="conversation-item ' + (isActive ? 'active' : '') + '" data-id="' + conv.id + '">';
      html += '  <div class="chat-avatar ' + avatarClass + '">' + icon + '</div>';
      html += '  <div class="flex-1 min-w-0">';
      html += '    <div class="flex items-center justify-between gap-1">';
      html += '      <span class="font-semibold text-sm truncate text-white">' + escapeHtml(conv.title || 'Itinera Concierge') + '</span>';
      if (conv.unread_count > 0) {
        html += '      <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black">' + conv.unread_count + '</span>';
      }
      html += '    </div>';
      html += '    <p class="text-xs text-white/50 truncate mt-0.5">' + escapeHtml(excerpt) + '</p>';
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

    var conv = conversations.find(function (c) { return c.id === id; });
    if (conv) {
      if (elements.emptyState) elements.emptyState.classList.add('hidden');
      if (elements.chatActiveStage) elements.chatActiveStage.classList.remove('hidden');
      if (elements.activeTitle) elements.activeTitle.textContent = conv.title || 'Itinera Concierge';
      if (elements.activeSubtitle) {
        var sub = conv.type === 'ai_concierge' ? 'AI Travel Assistant · Always Active' : (conv.type === 'agency_inquiry' ? 'Dedicated Agency Consultant' : 'Traveler Support');
        if (conv.trip) sub += ' · Trip: ' + conv.trip.title;
        elements.activeSubtitle.textContent = sub;
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
      elements.messagesStream.innerHTML = '<div class="text-center py-12 text-white/40 text-sm"><i class="fas fa-sparkles text-amber-400 mb-2 text-xl block"></i>Start the conversation with your AI Concierge or Agency!</div>';
      return;
    }

    var html = '';
    messages.forEach(function (msg) {
      var isUser = msg.sender_type === 'user';
      var avatarClass = msg.sender_type === 'ai' ? 'ai' : (msg.sender_type === 'agency' ? 'agency' : '');
      var icon = msg.sender_type === 'ai' ? '<i class="fas fa-robot"></i>' : (msg.sender_type === 'agency' ? '<i class="fas fa-briefcase"></i>' : '<i class="fas fa-user"></i>');
      var time = msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

      html += '<div class="message-row ' + msg.sender_type + '">';
      if (!isUser) {
        html += '  <div class="chat-avatar ' + avatarClass + '">' + icon + '</div>';
      }
      html += '  <div class="message-bubble">';
      html += '    <div class="message-text">' + formatMessageBody(msg.body) + '</div>';
      html += '    <div class="message-meta"><span>' + escapeHtml(msg.sender_name || 'User') + '</span><span>•</span><span>' + time + '</span></div>';
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

    // Optimistic UI append
    messages.push({
      sender_type: 'user',
      sender_name: 'You',
      body: text,
      created_at: new Date().toISOString()
    });
    renderMessages();

    // Show AI typing indicator if AI conversation
    var conv = conversations.find(function (c) { return c.id === currentConversationId; });
    var typingEl = null;
    if (conv && conv.type === 'ai_concierge') {
      typingEl = document.createElement('div');
      typingEl.className = 'message-row ai typing-indicator';
      typingEl.innerHTML = '<div class="chat-avatar ai"><i class="fas fa-robot"></i></div><div class="message-bubble text-amber-400 text-xs flex items-center gap-2"><i class="fas fa-spinner fa-spin"></i> Itinera AI Concierge is curating your response...</div>';
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
        title: title || (type === 'ai_concierge' ? 'AI Concierge Session' : 'Travel Inquiry'),
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
    // Simple markdown formatting (bold, lists, linebreaks)
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
