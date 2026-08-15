'use strict';

/* ============================================================
   Itinera – My Trips (overview.html)
   ============================================================ */
var trips = [];

function renderTrips() {
    var list = document.getElementById('tripsList');
    var countText = document.getElementById('tripsCountText');

    if (!trips.length) {
        list.innerHTML = '<div class="empty-state"><i class="fas fa-suitcase"></i> No trips yet. Click <strong>Create Trip</strong> to plan your first adventure!</div>';
        countText.textContent = 'No trips';
        return;
    }

    list.innerHTML = trips.map(function (t) {
        var days = t.start_date && t.end_date
            ? TP.fmtShort(TP.parseDate(t.start_date)) + ' – ' + TP.fmtShort(TP.parseDate(t.end_date)) + ', ' + TP.parseDate(t.end_date).getFullYear()
            : 'dates not set';
        var count = t.activity_count != null ? t.activity_count : (t.itinerary_items || []).length;
        var status = TP.esc(String(t.status || '').replace(/^\w/, function (c) { return c.toUpperCase(); }));
        return '<div class="row-item">' +
            '<div class="avatar">' + TP.esc(TP.initials(t.title)) + '</div>' +
            '<div class="info">' +
                '<div class="name clickable" onclick="openTrip(' + t.id + ')">✈ ' + TP.esc(t.title) + '</div>' +
                '<div class="sub">' + TP.esc(TP.tripDestLabel(t)) + ' &middot; ' + days + '</div>' +
            '</div>' +
            '<span class="pill" style="min-width:86px; text-align:center;">' + status + '</span>' +
            '<span class="pill pill-dark" style="min-width:92px; text-align:center;">' + count + ' activities</span>' +
            '<a class="btn btn-sm" href="itinerary.html" onclick="openTrip(' + t.id + '); return false;">View</a>' +
        '</div>';
    }).join('');

    countText.textContent = trips.length + (trips.length === 1 ? ' trip' : ' trips');
}

window.openTrip = async function (id) {
    try {
        var res = await TP.api('/trips/' + id);
        TP.setActiveTripId(res.data.id);
        TP.setFlash('Now viewing "✈ ' + res.data.title + '"');
        window.location.href = 'itinerary.html';
    } catch (err) {
        TP.toast('Could not load trip: ' + err.message, true);
    }
};

window.addEventListener('tp:init', async function () {
    try {
        var res = await TP.api('/trips');
        trips = res.data || [];
    } catch (err) {
        trips = [];
        TP.toast('Could not load trips: ' + err.message, true);
    }
    renderTrips();
});