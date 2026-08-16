/* ============================================================
   ITINERA — Destinations list page
   ============================================================ */

(() => {
  Ui.init();
  const favsReady = Ui.Favourites.load().catch(() => []);

  const resultsEl = document.getElementById('results');
  const stateHost = document.getElementById('stateHost');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const countryChips = document.getElementById('countryChips');
  const resultCount = document.getElementById('resultCount');

  let all = [];
  let country = '';
  let page = 1;

  function countryName(d) {
    return (d.country && d.country.name) || '';
  }

  function matchesSearch(d) {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) return true;
    return [d.name, d.city_name, countryName(d), d.description]
      .filter(Boolean)
      .some((v) => v.toLowerCase().includes(q));
  }

  function sorted(list) {
    const s = sortSelect.value;
    const arr = [...list];
    arr.sort((a, b) => {
      if (s === 'city') return String(a.city_name).localeCompare(String(b.city_name));
      return String(a.name).localeCompare(String(b.name));
    });
    return arr;
  }

  function cardHtml(d) {
    return `
      <article class="card reveal">
        <a class="card-media" href="destination-details.html?id=${d.id}">
          <img data-src="${Ui.esc(d.image)}" alt="${Ui.esc(d.name)}" loading="lazy">
          <span data-fav-type="destination" data-fav-id="${d.id}"></span>
        </a>
        <div class="card-body">
          <div class="card-topline">
            <h3 class="card-title"><a href="destination-details.html?id=${d.id}">${Ui.esc(d.name)}</a></h3>
          </div>
          <p class="card-desc">${Ui.esc(Ui.truncate(d.description, 120))}</p>
          <div class="card-meta">
            <span class="tag">${Ui.esc(d.city_name || 'City')}</span>
            <span class="tag">${Ui.esc(countryName(d) || '—')}</span>
          </div>
        </div>
      </article>`;
  }

  function hydrate(root) {
    root.querySelectorAll('img[data-src]').forEach((img) => {
      img.src = Ui.imgSrc(img.dataset.src) || Ui.PLACEHOLDER_URL;
      Ui.bindImage(img, 'destination');
    });
    root.querySelectorAll('[data-fav-type]').forEach((el) => {
      el.replaceWith(Ui.favButton(el.dataset.favType, Number(el.dataset.favId), {
        active: Ui.Favourites.isFav(el.dataset.favType, el.dataset.favId),
      }));
    });
  }

  function renderChips() {
    const countries = [...new Set(all.map(countryName).filter(Boolean))].sort();
    countryChips.innerHTML = `
      <button class="chip${!country ? ' is-active' : ''}" data-country="">All</button>` +
      countries.map((c) => `<button class="chip${country === c ? ' is-active' : ''}" data-country="${Ui.esc(c)}">${Ui.esc(c)}</button>`).join('');
    countryChips.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        country = chip.dataset.country;
        page = 1;
        renderChips();
        render();
      });
    });
  }

  function renderPager() {
    let pager = resultsEl.parentElement.querySelector('#catalog-pagination');
    if (!pager) {
      pager = document.createElement('div');
      pager.id = 'catalog-pagination';
      pager.className = 'w-full mt-6 col-span-full';
      resultsEl.after(pager);
    }
    if (window.ItPaginate) {
      window.ItPaginate.render({
        container: pager,
        totalItems: filtered().length,
        currentPage: page,
        itemsPerPage: APP_CONFIG.PAGINATION_PER_PAGE,
        onPageChange: (p) => { page = p; render(); if (resultsEl) resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
      });
    }
  }

  function filtered() {
    const list = all.filter((d) => matchesSearch(d) && (!country || countryName(d) === country));
    return sorted(list);
  }

  function render() {
    const items = filtered();
    resultCount.textContent = `${items.length} destination${items.length === 1 ? '' : 's'}`;
    if (!items.length) {
      resultsEl.innerHTML = '';
      stateHost.innerHTML = '';
      stateHost.appendChild(Ui.statePanel({
        type: 'empty',
        title: 'No destinations match',
        message: 'Try a different search term or country filter.',
      }));
      renderPager();
      return;
    }
    const start = (page - 1) * APP_CONFIG.PAGINATION_PER_PAGE;
    const slice = items.slice(start, start + APP_CONFIG.PAGINATION_PER_PAGE);
    stateHost.innerHTML = '';
    resultsEl.innerHTML = slice.map(cardHtml).join('');
    hydrate(resultsEl);
    renderPager();
  }

  function renderStats(counts) {
    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(v);
    };
    set('statDestinations', counts.destinations);
    set('statHotels', counts.hotels);
    set('statRestaurants', counts.restaurants);
    set('statAttractions', counts.attractions);
  }

  async function loadStats() {
    const [d, h, r, a] = await Promise.allSettled([
      Api.get('/v1/destinations'),
      Api.get('/v1/hotels', { page: 1 }),
      Api.get('/v1/restaurants', { page: 1 }),
      Api.get('/v1/attractions'),
    ]);
    renderStats({
      destinations: d.status === 'fulfilled' ? Ui.uniqueBy((d.value.data && d.value.data.data ? d.value.data.data : []), (x) => x.city_name || x.name).length : '—',
      hotels: h.status === 'fulfilled' && h.value.data && h.value.data.meta ? h.value.data.meta.total : '—',
      restaurants: r.status === 'fulfilled' && r.value.data && r.value.data.meta ? r.value.data.meta.total : '—',
      attractions: a.status === 'fulfilled' ? (a.value.data && a.value.data.data ? a.value.data.data : []).length : '—',
    });
  }

  async function load() {
    resultsEl.innerHTML = Ui.skeletonGrid(9);
    try {
      const res = await Api.get('/v1/destinations');
      const body = res.data !== undefined ? res.data : res;
      const items = Array.isArray(body) ? body : (body && Array.isArray(body.data) ? body.data : (body && body.data && Array.isArray(body.data.data) ? body.data.data : []));
      all = Ui.uniqueBy(items, (d) => d.city_name || d.name);
      await favsReady;
      renderChips();
      render();
      loadStats();
    } catch (err) {
      resultsEl.innerHTML = '';
      stateHost.innerHTML = '';
      stateHost.appendChild(Ui.statePanel({
        type: err.status === 0 ? 'network' : 'error',
        title: err.status === 0 ? 'No connection' : 'Could not load destinations',
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
