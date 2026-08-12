/* ============================================================
   ITINERA — Review module (shared by all detail pages)
   Posts a rating + comment to the real reviews API.
   ============================================================ */

const Review = (() => {
  const WMO = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Rime fog',
    51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
    61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
    71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
    80: 'Light showers', 81: 'Showers', 82: 'Violent showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Severe thunderstorm',
  };

  function weatherLabel(code) {
    return WMO[code] || 'Unknown conditions';
  }

  /* Opens the review dialog. `entityName` is used in the heading. */
  function openReviewModal(type, id, entityName) {
    if (!Auth.isLoggedIn()) {
      const target = window.location.pathname.split('/').pop() + window.location.search;
      sessionStorage.setItem('itinera_redirect', target);
      Ui.toast('Log in to write a review.', 'error');
      window.location.href = 'login.html';
      return;
    }

    let rating = 5;
    const stars = Array.from({ length: 5 }, (_, i) => `
      <button type="button" data-value="${i + 1}" aria-label="Rate ${i + 1} of 5 stars"
        class="${i + 1 === rating ? 'is-selected' : ''}">${Ui.ICONS.star}</button>`).join('');

    const body = `
      <p class="auth-lead">How was your experience with <b>${Ui.esc(entityName)}</b>?</p>
      <div class="form-group">
        <span class="form-label">Your rating</span>
        <div class="rating-input" role="radiogroup" aria-label="Rating">${stars}</div>
      </div>
      <div class="form-group">
        <label class="form-label" for="rv-comment">Comment (optional)</label>
        <textarea class="form-input" id="rv-comment" placeholder="What stood out?"></textarea>
      </div>
      <p class="form-error" id="rv-error" role="alert" hidden></p>`;

    const modal = Ui.openModal({
      title: `Write a review`,
      body,
      foot: `
        <button class="btn btn-ghost" data-action="rv-cancel">Cancel</button>
        <button class="btn btn-primary" data-action="rv-submit">Submit review</button>`,
    });

    const ratingWrap = modal.querySelector('.rating-input');
    ratingWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-value]');
      if (!btn) return;
      rating = Number(btn.dataset.value);
      ratingWrap.querySelectorAll('button').forEach((b) => {
        b.classList.toggle('is-selected', Number(b.dataset.value) <= rating);
      });
    });

    modal.querySelector('[data-action="rv-cancel"]').addEventListener('click', () => modal.remove());
    modal.querySelector('[data-action="rv-submit"]').addEventListener('click', async () => {
      const comment = modal.querySelector('#rv-comment').value.trim();
      const errEl = modal.querySelector('#rv-error');
      const btn = modal.querySelector('[data-action="rv-submit"]');
      btn.disabled = true;
      try {
        await Api.post(`/v1/reviews/${Ui.normalizeType(type)}/${id}`, { rating, comment }, { auth: true });
        modal.remove();
        Ui.toast('Review submitted. Thank you!', 'success');
      } catch (err) {
        errEl.hidden = false;
        errEl.textContent = err.message || 'Could not submit your review.';
        btn.disabled = false;
      }
    });
  }

  return { openReviewModal, weatherLabel };
})();
