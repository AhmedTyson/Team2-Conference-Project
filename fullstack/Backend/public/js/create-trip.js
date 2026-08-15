'use strict';

/* ============================================================
   Itinera – Create Trip (create-trip.html)
   ============================================================ */
var createDestinations = [];
var ctStyle = 'couple';

function syncDays() {
    var s = document.getElementById('ctStart').value;
    var e = document.getElementById('ctEnd').value;
    if (s && e && new Date(e) >= new Date(s)) {
        document.getElementById('ctDays').value = Math.round((new Date(e) - new Date(s)) / 86400000) + 1;
    }
}

document.getElementById('ctStart').addEventListener('change', syncDays);
document.getElementById('ctEnd').addEventListener('change', syncDays);

document.querySelectorAll('#ctStyles .month').forEach(function (tag) {
    tag.addEventListener('click', function () {
        var self = this;
        document.querySelectorAll('#ctStyles .month').forEach(function (t) { if (t !== self) t.classList.remove('active'); });
        self.classList.add('active');
        ctStyle = self.dataset.style;
        document.getElementById('ctStyleErr').classList.remove('show');
    });
});

document.getElementById('createTripForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    var ok = true;
    var title = document.getElementById('ctTitle').value.trim();
    var start = document.getElementById('ctStart').value;
    var end = document.getElementById('ctEnd').value;
    var travelers = parseInt(document.getElementById('ctTravelers').value, 10);
    var budget = parseFloat(document.getElementById('ctBudget').value);
    var destinationId = document.getElementById('ctDestination').value;
    var notes = document.getElementById('ctNotes').value.trim();

    this.querySelectorAll('.error').forEach(function (el) { el.classList.remove('show'); });
    if (!title) { document.getElementById('ctTitleErr').classList.add('show'); ok = false; }
    if (!start) { document.getElementById('ctStartErr').classList.add('show'); ok = false; }
    if (!end || new Date(end) < new Date(start)) { document.getElementById('ctEndErr').classList.add('show'); ok = false; }
    if (!travelers || travelers < 1) { document.getElementById('ctTravelersErr').classList.add('show'); ok = false; }
    if (isNaN(budget)) { document.getElementById('ctBudgetErr').classList.add('show'); ok = false; }
    if (!ok) return;

    var days = Math.round((new Date(end) - new Date(start)) / 86400000) + 1;
    var btn = document.getElementById('ctSubmit');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Creating…';

    try {
        var body = {
            title: title,
            travel_style: ctStyle,
            interests: notes ? [notes] : [],
            no_of_travelers: travelers,
            budget: budget,
            no_of_days: days,
            start_date: start,
            end_date: end
        };
        if (destinationId) body.destination_id = parseInt(destinationId, 10);

        var res = await TP.api('/v1/trips', { method: 'POST', body: JSON.stringify(body) });
        TP.setActiveTripId(res.data.id);
        TP.setFlash('Trip "' + res.data.title + '" created!');
        window.location.href = 'itinerary.html';
    } catch (err) {
        TP.toast(err.message, true);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check"></i> Create Trip';
    }
});

window.addEventListener('tp:init', async function () {
    try {
        var res = await TP.api('/v1/trips/create');
        createDestinations = res.data.destinations || [];
        var sel = document.getElementById('ctDestination');
        sel.innerHTML = '<option value="">Select a destination…</option>' + createDestinations.map(function (d) {
            return '<option value="' + d.id + '">' + TP.esc(d.name) +
                (d.city_name ? ' (' + TP.esc(d.city_name) + ')' : '') + '</option>';
        }).join('');
    } catch (e) { /* optional */ }
});