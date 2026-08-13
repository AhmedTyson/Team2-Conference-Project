/* ============================================================
   ITINERA — Hotels list page
   ============================================================ */

(() => {
  Ui.init();
  const favsReady = Ui.Favourites.load().catch(() => []);

  const resultsEl = document.getElementById('results');
  const stateHost = document.getElementById('stateHost');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const filterChips = document.getElementById('filterChips');
  const starChips = document.getElementById('starChips');
  const resultCount = document.getElementById('resultCount');

  let all = [];
  let destinations = [];
  let destFilter = '';
  let starFilter = '';
  let page = 1;

  function matchesSearch(h) {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) return true;
    return [h.name, h.address, h.destination && h.destination.name]
      .filter(Boolean)
      .some((v) => v.toLowerCase().includes(q));
  }

  function filtered() {
    return all.filter((h) => {
      if (!matchesSearch(h)) return false;
      if (destFilter && Number(h.destination_id) !== Number(destFilter)) return false;
      if (starFilter && Number(h.stars) !== Number(starFilter)) return false;
      return true;
    }).sort((a, b) => {
      if (sortSelect.value === 'price-desc') return Number(b.price_per_night) - Number(a.price_per_night);
      if (sortSelect.value === 'price-asc') return Number(a.price_per_night) - Number(b.price_per_night);
      if (sortSelect.value === 'rating') return Number(b.rating) - Number(a.rating);
      return String(a.name).localeCompare(String(b.name));
    });
  }

  function cardHtml(h) {
    const price = Ui.money(h.price_per_night);
    return `
      <article class="card reveal">
        <a class="card-media" href="hotel-details.html?id=${h.id}">
          <img data-src="${Ui.esc(h.image)}" alt="${Ui.esc(h.name)}" loading="lazy">
          <span data-fav-type="hotel" data-fav-id="${h.id}"></span>
        </a>
        <div class="card-body">
          <div class="card-topline">
            <h3 class="card-title"><a href="hotel-details.html?id=${h.id}">${Ui.esc(Ui.truncate(h.name, 42))}</a></h3>
            <span class="tag">${Number(h.stars) || 0}★</span>
          </div>
          <p class="card-desc">${Ui.esc(h.address || (h.destination ? h.destination.name : '') || 'Address unavailable')}</p>
          <div class="card-meta">
            <span class="tag">${Ui.esc(h.destination ? h.destination.name : '')}</span>
            <span class="rating">${Number(h.rating) ? Ui.esc(Number(h.rating).toFixed(1)) : '—'} ${Ui.ICONS.star}</span>
            ${price ? `<span class="price">${Ui.esc(price)}<small> / night</small></span>` : ''}
          </div>
        </div>
      </article>`;
  }

  function hydrate(root) {
    root.querySelectorAll('img[data-src]').forEach((img) => {
      img.src = Ui.imgSrc(img.dataset.src) || Ui.PLACEHOLDER_URL;
      Ui.bindImage(img);
    });
    root.querySelectorAll('[data-fav-type]').forEach((el) => {
      el.replaceWith(Ui.favButton(el.dataset.favType, Number(el.dataset.favId), {
        active: Ui.Favourites.isFav(el.dataset.favType, el.dataset.favId),
      }));
    });
  }

  function renderChips() {
    const destChips = [`<button class="chip${!destFilter ? ' is-active' : ''}" data-filter="">All destinations</button>`]
      .concat(destinations.map((d) => `
        <button class="chip${Number(destFilter) === d.id ? ' is-active' : ''}" data-filter="${d.id}">${Ui.esc(d.name)}</button>`))
      .join('');
    filterChips.innerHTML = destChips;
    filterChips.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        destFilter = chip.dataset.filter;
        page = 1;
        renderChips();
        render();
      });
    });

    const stars = [5, 4, 3];
    starChips.innerHTML = [`<button class="chip${!starFilter ? ' is-active' : ''}" data-filter="">Any stars</button>`]
      .concat(stars.map((s) => `
        <button class="chip${starFilter === String(s) ? ' is-active' : ''}" data-filter="${s}">${s}★</button>`))
      .join('');
    starChips.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        starFilter = chip.dataset.filter;
        page = 1;
        renderChips();
        render();
      });
    });
  }

  function renderPager(items) {
    let pager = resultsEl.parentElement.querySelector('.pagination');
    if (!pager) {
      pager = document.createElement('div');
      resultsEl.after(pager);
    }
    const total = Math.ceil(items.length / APP_CONFIG.PAGINATION_PER_PAGE);
    if (total <= 1) { pager.innerHTML = ''; return; }
    pager.innerHTML = '';
    pager.appendChild(Ui.pagination(
      { current_page: page, last_page: total, total: items.length },
      (p) => { page = p; render(); },
    ));
  }

  function render() {
    const items = filtered();
    resultCount.textContent = `${items.length} hotel${items.length === 1 ? '' : 's'}`;
    if (!items.length) {
      resultsEl.innerHTML = '';
      stateHost.innerHTML = '';
      stateHost.appendChild(Ui.statePanel({
        type: 'empty',
        title: 'No hotels match',
        message: 'Try different filters or a new search term.',
      }));
      renderPager(items);
      return;
    }
    const start = (page - 1) * APP_CONFIG.PAGINATION_PER_PAGE;
    const slice = items.slice(start, start + APP_CONFIG.PAGINATION_PER_PAGE);
    stateHost.innerHTML = '';
    resultsEl.innerHTML = slice.map(cardHtml).join('');
    hydrate(resultsEl);
    renderPager(items);
  }

  async function load() {
    resultsEl.innerHTML = Ui.skeletonGrid(9);
    try {
      const [hotels, dests] = await Promise.allSettled([
        Api.fetchAll('/v1/hotels', { per_page: 100 }),
        Api.get('/v1/destinations'),
      ]);
      if (hotels.status === 'fulfilled') all = hotels.value;
      if (dests.status === 'fulfilled') destinations = Ui.uniqueBy((dests.value.data && dests.value.data.data) || [], (d) => d.city_name || d.name);
      await favsReady;
      renderChips();
      render();
    } catch (err) {
      resultsEl.innerHTML = '';
      stateHost.innerHTML = '';
      stateHost.appendChild(Ui.statePanel({
        type: err.status === 0 ? 'network' : 'error',
        title: err.status === 0 ? 'No connection' : 'Could not load hotels',
        message: err.message,
        retry: load,
      }));
    }
  }

  searchInput.addEventListener('input', () => { page = 1; render(); });
  sortSelect.addEventListener('change', () => { page = 1; render(); });
  window.addEventListener('itinera:favourites-changed', render);
  document.addEventListener('DOMContentLoaded', load);
})();
