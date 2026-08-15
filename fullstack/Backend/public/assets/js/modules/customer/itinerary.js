'use strict';

/* ============================================================
   Itinera – Trip Itinerary (itinerary.html)
   ============================================================ */
var state = {
    trip: null,
    tripItems: [],
    attachCatalog: { hotels: [], restaurants: [], attractions: [] }
};

var attachEndpoints = { hotels: '/v1/hotels', restaurants: '/v1/restaurants', attractions: '/v1/attractions' };

/* ----- Tabs ----- */
function showTab(tabId) {
    document.querySelectorAll('#detailTabs .tab').forEach(function (t) { t.classList.remove('active'); });
    var h = document.querySelector('#detailTabs .tab[data-tab="' + tabId + '"]');
    if (h) h.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });
    var content = document.getElementById(tabId);
    if (content) content.classList.add('active');
}

document.querySelectorAll('#detailTabs .tab').forEach(function (tab) {
    tab.addEventListener('click', function () { showTab(this.dataset.tab); });
});

/* ----- Rendering ----- */
function renderEmpty() {
    document.getElementById('dtTitle').textContent = 'No trip selected';
    document.getElementById('dtDest').textContent = '—';
    document.getElementById('dtDates').textContent = '—';
    document.getElementById('timelineList').innerHTML =
        '<div class="empty-state"><i class="fas fa-suitcase"></i> Open a trip from ' +
        '<a href="overview.html" style="text-decoration:underline;">Overview</a> first.</div>';
    document.getElementById('dtMapTags').innerHTML = '';
    document.getElementById('dtAttachCount').textContent = '0';
    document.getElementById('attachList').innerHTML =
        '<div class="empty-state"><i class="fas fa-paperclip"></i> Nothing attached yet.</div>';
}

function renderHeader() {
    document.getElementById('dtTitle').textContent = '✈ ' + state.trip.title;
    document.getElementById('dtDest').textContent = TP.tripDestLabel(state.trip);
    document.getElementById('dtDates').textContent = state.trip.start_date
        ? TP.fmtLong(TP.parseDate(state.trip.start_date)) + ' – ' + TP.fmtLong(TP.parseDate(state.trip.end_date))
        : '—';
}

function renderTimeline() {
    var box = document.getElementById('timelineList');
    if (!state.tripItems.length) {
        box.innerHTML = '<div class="empty-state"><i class="fas fa-list"></i> No itinerary items yet — use the Attachments tab.</div>';
        return;
    }
    box.innerHTML = state.tripItems.map(function (item) {
        var day = parseInt(item.day_number, 10) || 1;
        var d = state.trip.start_date ? TP.parseDate(state.trip.start_date) : new Date();
        d.setDate(d.getDate() + day - 1);
        var timeLabel = item.time_slot ? item.time_slot : TP.fmtShort(d) + ' · Day ' + day;
        var title = item.itemable && item.itemable.name ? item.itemable.name : (item.title || 'Activity');
        var notes = item.notes ? ' <span style="color:rgba(255,255,255,0.45);">— ' + TP.esc(item.notes) + '</span>' : '';
        return '<div class="row-item">' +
            '<div class="avatar sm"><i class="' + TP.typeIcon(item.type) + '"></i></div>' +
            '<div class="info">' +
                '<div class="name">' + TP.esc(title) + '</div>' +
                '<div class="sub">' + TP.esc(timeLabel) + notes + '</div>' +
            '</div>' +
        '</div>';
    }).join('');
}

function renderMapTags() {
    var tags = document.getElementById('dtMapTags');
    var counts = { hotel: 0, restaurant: 0, attraction: 0, flight: 0 };
    state.tripItems.forEach(function (it) { if (counts[it.type] != null) counts[it.type]++; });
    var icons = { hotel: 'fas fa-hotel', restaurant: 'fas fa-utensils', attraction: 'fas fa-hiking', flight: 'fas fa-plane' };
    tags.innerHTML = Object.keys(counts).map(function (k) {
        return '<span class="pill"><i class="' + icons[k] + '"></i> ' + counts[k] + ' ' + TP.typeLabel(k) +
            (counts[k] === 1 ? '' : 's') + '</span>';
    }).join('');
}

function renderAttachList() {
    var list = document.getElementById('attachList');
    var items = state.trip.attached_items || [];
    document.getElementById('dtAttachCount').textContent = items.length;

    if (!items.length) {
        list.innerHTML = '<div class="empty-state"><i class="fas fa-paperclip"></i> Nothing attached yet.</div>';
        return;
    }
    list.innerHTML = items.map(function (a) {
        return '<div class="row-item">' +
            '<div class="avatar sm"><i class="' + TP.typeIcon(a.type) + '"></i></div>' +
            '<div class="info"><div class="name">' + TP.esc(a.name) + '</div><div class="sub">' + TP.typeLabel(a.type) + '</div></div>' +
            '<button class="btn btn-sm" onclick="detachItem(' + a.attach_id + ')">Detach</button>' +
        '</div>';
    }).join('');
}

/* ----- Attach / Detach ----- */
async function loadAttachOptions() {
    var type = document.getElementById('attachType').value;
    var select = document.getElementById('attachItem');
    select.innerHTML = '<option>Loading options…</option>';
    try {
        var items = state.attachCatalog[type];
        if (!items.length) {
            var res = await TP.api(attachEndpoints[type]);
            items = (res.data && Array.isArray(res.data.data)) ? res.data.data : (res.data || []);
            state.attachCatalog[type] = items;
        }
        select.innerHTML = '<option value="">— select —</option>' + items.map(function (i) {
            return '<option value="' + i.id + '">' + TP.esc(i.name) + '</option>';
        }).join('');
    } catch (e) {
        select.innerHTML = '<option value="">No items available</option>';
    }
}

document.getElementById('attachType').addEventListener('change', loadAttachOptions);

document.getElementById('attachBtn').addEventListener('click', async function () {
    var type = document.getElementById('attachType').value;
    var id = document.getElementById('attachItem').value;
    if (!id) { TP.toast('Pick an item to attach', true); return; }
    if (!state.trip) { TP.toast('No trip selected', true); return; }
    try {
        await TP.api('/trips/' + state.trip.id + '/attach/' + type, {
            method: 'POST',
            body: JSON.stringify({ id: parseInt(id, 10) })
        });
        await loadTripData(state.trip.id);
        TP.toast('Item attached to trip.');
    } catch (err) { TP.toast(err.message, true); }
});

window.detachItem = async function (attachId) {
    if (!state.trip) return;
    try {
        await TP.api('/trips/' + state.trip.id + '/detach/' + attachId, { method: 'DELETE' });
        await loadTripData(state.trip.id);
        TP.toast('Item detached from trip.');
    } catch (err) { TP.toast(err.message, true); }
};

/* ----- Load trip ----- */
async function loadTripData(id) {
    var res = await TP.api('/trips/' + id);
    state.trip = res.data;
    state.tripItems = state.trip.itinerary_items || [];
    renderHeader();
    renderTimeline();
    renderMapTags();
    renderAttachList();
    loadAttachOptions();
}

window.addEventListener('tp:init', async function () {
    var id = TP.getActiveTripId();
    if (!id) { renderEmpty(); return; }
    try {
        await loadTripData(id);
        if (window.location.hash === '#attach') showTab('tab-attach');
    } catch (err) {
        TP.toast('Could not load trip: ' + err.message, true);
        renderEmpty();
    }
});