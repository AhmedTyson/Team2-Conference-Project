'use strict';

/* ============================================================
   Itinera – Trip Planning Engine · shared core
   Auth guard · API helper · sidebar · toasts · format helpers
   ============================================================ */
(function () {
    var TP_CONFIG = window.TP_CONFIG || {};

    /* API base:
       - served from /Frontend/ on a web server -> dev API (127.0.0.1:8000)
       - otherwise same-origin /api (e.g. placed inside Laravel public) */
    var API_BASE = TP_CONFIG.apiBase ||
        (window.location.pathname.indexOf('/Frontend/') !== -1
            ? 'http://127.0.0.1:8000/api'
            : 'http://127.0.0.1:8000/api');

    var NAV = [
        { key: 'overview', label: 'Overview', icon: 'fas fa-list-ul', href: 'overview.html' },
        { key: 'create-trip', label: 'Create Trip', icon: 'fas fa-plus-circle', href: 'create-trip.html' },
        { key: 'itinerary', label: 'Itinerary', icon: 'fas fa-map-marked-alt', href: 'itinerary.html' },
        { key: 'availability', label: 'Availability', icon: 'fas fa-calendar-check', href: 'availability.html' },
        { key: 'trip-map', label: 'Trip Map', icon: 'fas fa-map', href: 'trip-map.html' },
        { divider: true },
        { key: 'copy-wizard', label: 'Copy Wizard', icon: 'fas fa-copy', href: 'copy-wizard.html' }
    ];

    /* ================= SESSION ================= */
    /* Session delegates to the canonical Itinera stack (config.js/api.js/
       session.js → window.Itinera, key `itinera_token`) so the trip planner
       shares one login across the whole app. `tp_user` stays as a display
       cache; `tp_token` remains a read-only fallback for pre-migration logins. */
    function getToken() {
        if (window.Itinera && Itinera.readToken) return Itinera.readToken();
        return localStorage.getItem('tp_token');
    }

    function getUser() {
        try { return JSON.parse(localStorage.getItem('tp_user') || 'null'); } catch (e) { return null; }
    }

    function setSession(token, user) {
        if (window.Itinera && Itinera.storeToken) Itinera.storeToken(token);
        localStorage.setItem('tp_user', JSON.stringify(user || {}));
    }

    function clearSession() {
        if (window.Itinera && Itinera.clearToken) Itinera.clearToken();
        localStorage.removeItem('tp_token');
        localStorage.removeItem('tp_user');
        localStorage.removeItem('tp_active_trip');
    }

    function setActiveTripId(id) { localStorage.setItem('tp_active_trip', String(id)); }

    function getActiveTripId() {
        var v = parseInt(localStorage.getItem('tp_active_trip'), 10);
        return isNaN(v) ? null : v;
    }

    /* ================= API ================= */
    async function api(path, options) {
        var headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
        var token = getToken();
        if (token) headers['Authorization'] = 'Bearer ' + token;

        var res;
        try {
            res = await fetch(API_BASE + path, Object.assign({}, options, { headers: headers }));
        } catch (e) {
            throw new Error('Could not reach the API server.');
        }

        if (res.status === 401) {
            clearSession();
            setFlash('Session expired. Please sign in again.', true);
            window.location.replace('index.html');
            throw new Error('Unauthorized');
        }

        var body = await res.json().catch(function () { return {}; });
        if (!res.ok) {
            throw new Error(body && (body.message || body.error) ? body.message : 'Request failed');
        }
        return body;
    }

    /* ================= TOASTS & FLASH ================= */
    function ensureToast() {
        var t = document.getElementById('tpToast');
        if (t) return t;
        t = document.createElement('div');
        t.className = 'toast';
        t.id = 'tpToast';
        t.innerHTML = '<i class="fas fa-check-circle" id="tpToastIcon"></i><span id="tpToastMsg"></span>';
        document.body.appendChild(t);
        return t;
    }

    function toast(message, isError) {
        var t = ensureToast();
        document.getElementById('tpToastMsg').textContent = message;
        document.getElementById('tpToastIcon').className = isError ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
        t.classList.toggle('error', !!isError);
        t.classList.add('show');
        clearTimeout(t._timer);
        t._timer = setTimeout(function () { t.classList.remove('show'); }, 3200);
    }

    /* Cross-page message, shown on next page load */
    function setFlash(message, isError) {
        sessionStorage.setItem('tp_flash', JSON.stringify({ message: message || '', error: !!isError }));
    }

    function showFlash() {
        var raw = sessionStorage.getItem('tp_flash');
        if (!raw) return;
        sessionStorage.removeItem('tp_flash');
        try {
            var f = JSON.parse(raw);
            if (f && f.message) toast(f.message, f.error);
        } catch (e) { /* ignore */ }
    }

    /* ================= FORMAT HELPERS ================= */
    function pad(n) { return String(n).padStart(2, '0'); }

    function dateKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

    function parseDate(s) { return new Date(String(s).slice(0, 10) + 'T00:00:00'); }

    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function fmtShort(d) { return MONTHS[d.getMonth()] + ' ' + d.getDate(); }

    function fmtLong(d) { return MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear(); }

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function typeIcon(type) {
        switch (type) {
            case 'hotel': return 'fas fa-hotel';
            case 'restaurant': return 'fas fa-utensils';
            case 'attraction': return 'fas fa-hiking';
            case 'flight': return 'fas fa-plane';
            default: return 'fas fa-map-marker-alt';
        }
    }

    function typeLabel(type) {
        switch (type) {
            case 'hotel': return 'hotel';
            case 'restaurant': return 'restaurant';
            case 'attraction': return 'activity';
            case 'flight': return 'flight';
            default: return 'activity';
        }
    }

    function initials(name) {
        return String(name || '?').trim().split(/\s+/).map(function (w) { return w[0]; })
            .join('').slice(0, 2).toUpperCase() || '?';
    }

    function tripDestLabel(trip) {
        var ds = (trip.destinations || []).map(function (d) {
            return d.name + (d.city_name ? ', ' + d.city_name : '');
        });
        return ds.length ? ds.join(' · ') : 'No destination yet';
    }

    /* ================= SIDEBAR ================= */
    function renderSidebar() {
        var el = document.getElementById('sidebar');
        if (!el) return;

        var current = document.body.getAttribute('data-page') || '';
        var html = '<div class="logo"><span>✈</span> Itinera</div>';

        NAV.forEach(function (n) {
            if (n.divider) { html += '<div class="nav-divider"></div>'; return; }
            html += '<a class="nav-item' + (n.key === current ? ' active' : '') + '" href="' + n.href + '">' +
                '<i class="' + n.icon + '"></i> ' + n.label + '</a>';
        });

        var user = getUser();
        html += '<div class="nav-divider"></div>';
        html += '<div class="user-box">' +
            '<div class="user-avatar">' + esc((user && user.name ? user.name.charAt(0) : 'G').toUpperCase()) + '</div>' +
            '<span class="user-name">' + esc(user && user.name ? user.name : 'Guest') + '</span>' +
            '<button class="btn btn-sm" id="logoutBtn" title="Sign out" style="margin-left:auto;">' +
            '<i class="fas fa-sign-out-alt"></i></button>' +
            '</div>';

        el.innerHTML = html;

        var lb = document.getElementById('logoutBtn');
        if (lb) {
            lb.addEventListener('click', function () {
                clearSession();
                window.location.href = 'index.html';
            });
        }
    }

    /* ================= AUTH GUARD ================= */
    function guard() {
        var mode = document.body.getAttribute('data-auth') || 'protected';
        if (mode === 'public') {
            if (getToken()) window.location.replace('overview.html');
            return;
        }
        if (!getToken()) window.location.replace('index.html');
    }

    /* ================= EXPOSE ================= */
    window.TP = {
        API_BASE: API_BASE,
        api: api,
        getToken: getToken,
        getUser: getUser,
        setSession: setSession,
        clearSession: clearSession,
        setActiveTripId: setActiveTripId,
        getActiveTripId: getActiveTripId,
        toast: toast,
        setFlash: setFlash,
        pad: pad,
        dateKey: dateKey,
        parseDate: parseDate,
        fmtShort: fmtShort,
        fmtLong: fmtLong,
        esc: esc,
        typeIcon: typeIcon,
        typeLabel: typeLabel,
        initials: initials,
        tripDestLabel: tripDestLabel
    };

    /* ================= BOOT ================= */
    document.addEventListener('DOMContentLoaded', function () {
        guard();
        renderSidebar();
        showFlash();
        window.dispatchEvent(new CustomEvent('tp:init'));
    });
})();