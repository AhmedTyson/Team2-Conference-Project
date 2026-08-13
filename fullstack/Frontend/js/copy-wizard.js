'use strict';

/* ============================================================
   Itinera – Copy Trip Wizard (copy-wizard.html)
   ============================================================ */
var trips = [];
var sourceTripId = null;
var currentStep = 0;
var totalSteps = 4;

var wizardPages = document.querySelectorAll('.wizard-page');
var wizardSteps = document.querySelectorAll('#wizardSteps .step');
var prevBtn = document.getElementById('wizardPrev');
var nextBtn = document.getElementById('wizardNext');

/* ----- Source selection ----- */
window.pickSourceTrip = function (id) {
    sourceTripId = parseInt(id, 10);
    hydrateCopyForm();
    hydrateWizard();
};

function renderWizardSources() {
    var list = document.getElementById('copySourceList');
    if (!trips.length) {
        list.innerHTML = '<div class="empty-state"><i class="fas fa-suitcase"></i> No trips to copy yet.</div>';
        sourceTripId = null;
        return;
    }
    list.innerHTML = trips.map(function (t) {
        var days = t.start_date
            ? TP.fmtShort(TP.parseDate(t.start_date)) + '–' + TP.fmtShort(TP.parseDate(t.end_date)) + ', ' + TP.parseDate(t.end_date).getFullYear()
            : 'no dates';
        return '<label class="choice-option">' +
            '<input type="radio" name="sourceTrip" value="' + t.id + '" onchange="pickSourceTrip(' + t.id + ')" /> ' +
            '<div class="info" style="flex:1;"><div class="name">✈ ' + TP.esc(t.title) + '</div><div class="sub">' + days + '</div></div>' +
        '</label>';
    }).join('');
    var first = list.querySelector('input[type=radio]');
    if (first) { first.checked = true; pickSourceTrip(first.value); }
}

function hydrateCopyForm() {
    var src = trips.find(function (t) { return t.id === sourceTripId; });
    if (!src) return;
    document.getElementById('cpyTitle').value = src.title + ' – Copy';
    document.getElementById('cpyStart').value = String(src.start_date).slice(0, 10);
    document.getElementById('cpyEnd').value = String(src.end_date).slice(0, 10);
}

/* ----- Confirmation ----- */
function copyWhatLabels() {
    return Array.from(document.querySelectorAll('input[name=cpy]:checked'))
        .map(function (cb) { return cb.value; }).join(', ') || 'Nothing selected';
}

function hydrateWizard() {
    var src = trips.find(function (t) { return t.id === sourceTripId; });
    document.getElementById('cpySrcName').textContent = src ? src.title : '—';
    document.getElementById('cpyWhat').textContent = copyWhatLabels();
    document.getElementById('cpyNewName').textContent =
        document.getElementById('cpyTitle').value + ' · ' +
        document.getElementById('cpyStart').value + ' → ' + document.getElementById('cpyEnd').value;
}

/* ----- Steps ----- */
function updateWizard(step) {
    wizardPages.forEach(function (p, i) { p.classList.toggle('active', i === step); });
    wizardSteps.forEach(function (s, i) { s.classList.toggle('active', i === step); });
    prevBtn.disabled = step === 0;
    if (step === 1 || step === 3) hydrateWizard();
    if (step === totalSteps - 1) {
        nextBtn.innerHTML = 'Copy Trip <i class="fas fa-check"></i>';
    } else {
        nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
    }
}

prevBtn.addEventListener('click', function () {
    if (currentStep > 0) { currentStep--; updateWizard(currentStep); }
});

nextBtn.addEventListener('click', async function () {
    if (currentStep === totalSteps - 1) {
        if (!sourceTripId) {
            TP.toast('Select a source trip first', true);
            currentStep = 0;
            updateWizard(0);
            return;
        }

        var title = document.getElementById('cpyTitle').value.trim();
        var start = document.getElementById('cpyStart').value;
        var end = document.getElementById('cpyEnd').value;

        document.querySelectorAll('.wizard-page .error').forEach(function (el) { el.classList.remove('show'); });
        if (!title) {
            document.getElementById('cpyTitleErr').classList.add('show');
            currentStep = 2;
            updateWizard(2);
            return;
        }
        if (start && end && new Date(end) < new Date(start)) {
            document.getElementById('cpyEndErr').classList.add('show');
            currentStep = 2;
            updateWizard(2);
            return;
        }

        nextBtn.disabled = true;
        nextBtn.innerHTML = '<span class="spinner"></span> Redirecting to Checkout…';
        try {
            // Forking a trip requires purchasing it via checkout.
            var res = await TP.api('/v1/checkout/initiate', { 
                method: 'POST', 
                body: JSON.stringify({ type: 'trip', trip_id: sourceTripId }) 
            });
            
            if (res && res.data && res.data.checkout_url) {
                TP.toast('Redirecting to secure checkout...', false);
                window.location.href = res.data.checkout_url;
            } else {
                throw new Error("Failed to get checkout URL");
            }
        } catch (err) {
            TP.toast(err.message || 'Checkout initiation failed.', true);
            nextBtn.disabled = false;
            nextBtn.innerHTML = 'Copy Trip <i class="fas fa-check"></i>';
        }
        return;
    }
    if (currentStep < totalSteps - 1) { currentStep++; updateWizard(currentStep); }
});

wizardSteps.forEach(function (stepEl, index) {
    stepEl.addEventListener('click', function () { currentStep = index; updateWizard(currentStep); });
});

/* ----- Init ----- */
window.addEventListener('tp:init', async function () {
    updateWizard(0);
    try {
        var res = await TP.api('/v1/trips');
        trips = res.data || [];
    } catch (err) {
        trips = [];
        TP.toast('Could not load trips: ' + err.message, true);
    }
    renderWizardSources();
});