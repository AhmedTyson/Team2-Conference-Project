'use strict';

/* ============================================================
   Itinera – Trip Map (trip-map.html)
   ============================================================ */
var state = { trip: null, tripItems: [] };

function renderMapPage() {
    var list = document.getElementById('mpPointsList');
    var pins = document.getElementById('mpPins');
    var tags = document.getElementById('mpTags');

    if (!state.trip || !state.tripItems.length) {
        list.innerHTML = '<li><i class="fas fa-circle-info" style="width:16px;"></i> No itinerary items yet.</li>';
        pins.textContent = '0';
        tags.innerHTML = '<span class="pill"><i class="fas fa-circle" style="color:#ffffff;"></i> 0 locations</span>';
        return;
    }

    list.innerHTML = state.tripItems.map(function (it) {
        var name = it.itemable && it.itemable.name ? it.itemable.name : (it.title || 'Point');
        return '<li><i class="' + TP.typeIcon(it.type) + '" style="width:16px;"></i> ' + TP.esc(name) + '</li>';
    }).join('');
    pins.textContent = state.tripItems.length;

    var counts = { hotel: 0, restaurant: 0, attraction: 0, flight: 0 };
    state.tripItems.forEach(function (it) { if (counts[it.type] != null) counts[it.type]++; });
    tags.innerHTML = Object.keys(counts).map(function (k) {
        return '<span class="pill"><i class="fas fa-circle" style="color:#ffffff;"></i> ' + counts[k] + ' ' +
            TP.typeLabel(k) + (counts[k] === 1 ? '' : 's') + '</span>';
    }).join('');
}

window.addEventListener('tp:init', async function () {
    var id = TP.getActiveTripId();
    if (!id) { renderMapPage(); return; }
    try {
        var res = await TP.api('/trips/' + id);
        state.trip = res.data;
        state.tripItems = state.trip.itinerary_items || [];
        document.getElementById('mpTitle').textContent = '📍 ' + state.trip.title;
        renderMapPage();
    } catch (err) {
        TP.toast('Could not load trip: ' + err.message, true);
        renderMapPage();
    }
});