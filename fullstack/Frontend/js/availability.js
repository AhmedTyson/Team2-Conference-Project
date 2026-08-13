'use strict';

/* ============================================================
   Itinera – Availability / Schedule (availability.html)
   ============================================================ */
var state = {
    trip: null,
    tripItems: [],
    schedMonth: null,   /* Date: month currently shown */
    schedMonths: []      /* Date[]: month tabs */
};

/* ----- Gregorian helpers ----- */
function firstDayOffset(m) { return new Date(m.getFullYear(), m.getMonth(), 1).getDay(); }
function daysInMonth(m) { return new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate(); }
function daysInPrev(m) { return new Date(m.getFullYear(), m.getMonth(), 0).getDate(); }

/* ----- Month tabs ----- */
function buildMonthTabs() {
    var start = state.trip.start_date ? TP.parseDate(state.trip.start_date) : new Date();
    var months = [];
    for (var i = 0; i < 6; i++) {
        months.push(new Date(start.getFullYear(), start.getMonth() + i, 1));
    }
    state.schedMonths = months;

    var tabs = document.getElementById('monthTabs');
    tabs.innerHTML = months.map(function (m, idx) {
        var active = idx === 0 ? ' active' : '';
        return '<span class="month' + active + '" data-idx="' + idx + '" onclick="switchMonth(' + idx + ')">' +
            m.toLocaleString('en', { month: 'long' }) + '</span>';
    }).join('');
    state.schedMonth = months[0];
}

window.switchMonth = function (idx) {
    document.querySelectorAll('#monthTabs .month').forEach(function (t) { t.classList.remove('active'); });
    document.querySelector('#monthTabs .month[data-idx="' + idx + '"]').classList.add('active');
    state.schedMonth = state.schedMonths[idx];
    renderSchedule();
};

/* ----- Trip events mapped by date key ----- */
function tripEventsByDate() {
    var map = {};
    if (!state.tripItems.length) return map;
    var start = TP.parseDate(state.trip.start_date);
    state.tripItems.forEach(function (item) {
        var day = parseInt(item.day_number, 10) || 1;
        var d = new Date(start);
        d.setDate(d.getDate() + day - 1);
        var key = TP.dateKey(d);
        if (!map[key]) map[key] = [];
        map[key].push(item);
    });
    return map;
}

/* ----- Calendar ----- */
function renderSchedule() {
    var m = state.schedMonth;
    var events = tripEventsByDate();
    var today = new Date();
    var todayKey = TP.dateKey(today);

    document.getElementById('schedMonthLabel').textContent =
        m.toLocaleString('en', { month: 'long' }) + ' ' + m.getFullYear();
    document.getElementById('schedTripName').textContent = state.trip ? state.trip.title : 'Select a trip';

    var grid = document.getElementById('dayGrid');
    grid.innerHTML = '';

    var offset = firstDayOffset(m);
    var dim = daysInMonth(m);
    var dip = daysInPrev(m);

    /* prev month leading days */
    for (var p = dip - offset + 1; p <= dip; p++) {
        var pe = document.createElement('div');
        pe.className = 'day-item other-month';
        pe.textContent = p;
        grid.appendChild(pe);
    }

    /* current month */
    for (var i = 1; i <= dim; i++) {
        var cellDate = new Date(m.getFullYear(), m.getMonth(), i);
        var key = TP.dateKey(cellDate);
        var dayEvents = events[key] || [];

        var el = document.createElement('div');
        el.className = 'day-item';
        if (key === todayKey) el.classList.add('today');

        var num = document.createElement('span');
        num.textContent = i;
        el.appendChild(num);

        if (dayEvents.length) {
            var dot = document.createElement('span');
            dot.className = 'event-dot';
            dot.textContent = '● ' + dayEvents.length;
            el.appendChild(dot);
        }

        el.addEventListener('click', function () {
            document.querySelectorAll('#dayGrid .day-item').forEach(function (d) { d.classList.remove('active'); });
            this.classList.add('active');
        });
        grid.appendChild(el);
    }

    /* fill remaining to complete the week grid */
    var totalCells = Math.ceil((offset + dim) / 7) * 7;
    for (var r = 1; r <= totalCells - (offset + dim); r++) {
        var re = document.createElement('div');
        re.className = 'day-item other-month';
        re.textContent = r;
        grid.appendChild(re);
    }
}

/* ----- Sidebar ----- */
function renderTripCard() {
    if (!state.trip) return;
    document.getElementById('addTripName').textContent = state.trip.title;
    document.getElementById('tripAvatar').textContent = TP.initials(state.trip.title);
    document.getElementById('addTripMeta').textContent = TP.tripDestLabel(state.trip);
    document.getElementById('addTripActivities').textContent = state.tripItems.length;
    var days = state.trip.start_date
        ? Math.round((TP.parseDate(state.trip.end_date) - TP.parseDate(state.trip.start_date)) / 86400000) + 1
        : '—';
    document.getElementById('addTripDays').textContent = days;
    document.getElementById('addTripTravelers').textContent =
        state.trip.no_of_travelers != null ? state.trip.no_of_travelers : '—';
}

function renderFeed() {
    var list = document.getElementById('feedList');
    if (!state.tripItems.length) {
        list.innerHTML = '<div class="empty-state" style="padding:16px;"><i class="fas fa-inbox"></i> No activities yet.</div>';
        return;
    }
    list.innerHTML = state.tripItems.map(function (item) {
        var day = parseInt(item.day_number, 10) || 1;
        var name = item.itemable && item.itemable.name ? item.itemable.name : (item.title || 'Activity');
        var text = 'Day ' + day + (item.time_slot && item.time_slot !== 'null' ? ' · ' + item.time_slot : '');
        return '<div class="feed-item">' +
            '<div class="feed-avatar"><i class="' + TP.typeIcon(item.type) + '"></i></div>' +
            '<div class="feed-content">' +
                '<div class="feed-name">' + TP.esc(name) + '</div>' +
                '<div class="feed-text">' + TP.esc(text) + '</div>' +
            '</div>' +
        '</div>';
    }).join('');
}

function renderSlots() {
    var wrap = document.getElementById('slotList');
    if (!state.tripItems.length) {
        wrap.innerHTML = '<span class="placeholder"><i class="fas fa-info-circle"></i> No time slots yet.</span>';
        return;
    }
    var slots = {};
    state.tripItems.forEach(function (item) {
        var slot = item.time_slot && item.time_slot !== 'null' ? item.time_slot : 'Flexible';
        if (!slots[slot]) slots[slot] = { count: 0, days: [] };
        slots[slot].count++;
        slots[slot].days.push(parseInt(item.day_number, 10) || 1);
    });

    var today = new Date();
    wrap.innerHTML = Object.keys(slots).map(function (slot) {
        var s = slots[slot];
        var maxDay = Math.max.apply(null, s.days);
        var inPast = state.trip.start_date &&
            TP.parseDate(state.trip.start_date).getTime() + (maxDay - 1) * 86400000 < today.getTime();
        var cls = inPast ? 'time-slot occupied' : 'time-slot active';
        return '<span class="' + cls + '" title="' + s.count + ' activity(ies)">' +
            '<i class="far fa-clock"></i> ' + TP.esc(slot) + '</span>';
    }).join('');
}

/* ----- Empty state (no trip selected) ----- */
function renderEmpty() {
    document.getElementById('schedMonthLabel').textContent = '—';
    document.getElementById('schedTripName').textContent = 'Select a trip';
    document.getElementById('dayGrid').innerHTML = '';
    document.getElementById('monthTabs').innerHTML = '';
    document.getElementById('addTripName').textContent = 'No trip selected';
    document.getElementById('tripAvatar').textContent = '—';
    document.getElementById('addTripMeta').textContent = 'Open a trip from Overview';
    document.getElementById('addTripActivities').textContent = '0';
    document.getElementById('addTripDays').textContent = '—';
    document.getElementById('addTripTravelers').textContent = '—';
    document.getElementById('feedList').innerHTML =
        '<div class="empty-state" style="padding:16px;"><i class="fas fa-inbox"></i> No activities yet.</div>';
    document.getElementById('slotList').innerHTML =
        '<span class="placeholder"><i class="fas fa-info-circle"></i> No time slots yet.</span>';
}

/* ----- Init ----- */
window.addEventListener('tp:init', async function () {
    var id = TP.getActiveTripId();
    if (!id) { renderEmpty(); return; }
    try {
        var res = await TP.api('/v1/trips/' + id);
        state.trip = res.data;
        state.tripItems = state.trip.itinerary_items || [];

        var start = state.trip.start_date ? TP.parseDate(state.trip.start_date) : new Date();
        state.schedMonth = new Date(start.getFullYear(), start.getMonth(), 1);
        buildMonthTabs();
        renderTripCard();
        renderFeed();
        renderSlots();
        renderSchedule();
    } catch (err) {
        TP.toast('Could not load trip: ' + err.message, true);
        renderEmpty();
    }
});