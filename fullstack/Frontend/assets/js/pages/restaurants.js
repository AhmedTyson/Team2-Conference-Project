/* ============================================================
   ITINERA — Restaurants list page
   ============================================================ */

(() => {
  Ui.init();
  const favsReady = Ui.Favourites.load().catch(() => []);

  const resultsEl = document.getElementById('results');
  const stateHost = document.getElementById('stateHost');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const filterChips = document.getElementById('filterChips');
  const priceChips = document.getElementById('priceChips');
  const resultCount = document.getElementById('resultCount');

  let all = [];
  let destinations = [];
  let destFilter = '';
  let priceFilter = '';
  let page = 1;

  function matchesSearch(r) {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) return true;
    return [r.name, r.cuisine, r.address, r.destination && r.destination.name]
      .filter(Boolean)
      .some((v) => v.toLowerCase().includes(q));
  }

  function filtered() {
    return all.filter((r) => {
      if (!matchesSearch(r)) return false;
      if (destFilter && Number(r.destination_id) !== Number(destFilter)) return false;
      if (priceFilter && String(r.price_range) !== priceFilter) return false;
      return true;
    }).sort((a, b) => {
      if (sortSelect.value === 'rating') return Number(b.rating) - Number(a.rating);
      return String(a.name).localeCompare(String(b.name));
    });
  }

  function cardHtml(r) {
    return `
      <article class="card reveal">
        <a class="card-media" href="restaurant-details.html?id=${r.id}">
          <img data-src="${Ui.esc(r.image)}" alt="${Ui.esc(r.name)}" loading="lazy">
          <span data-fav-type="restaurant" data-fav-id="${r.id}"></span>
        </a>
        <div class="card-body">
          <div class="card-topline">
            <h3 class="card-title"><a href="restaurant-details.html?id=${r.id}">${Ui.esc(Ui.truncate(r.name, 42))}</a></h3>
            <span class="tag">${Ui.esc(r.price_range || '—')}</span>
          </div>
          <p class="card-desc">${Ui.esc(r.cuisine || (r.address || 'Address unavailable'))}</p>
          <div class="card-meta">
            <span class="tag">${Ui.esc(r.destination ? r.destination.name : '')}</span>
            <span class="rating">${Number(r.rating) ? Ui.esc(Number(r.rating).toFixed(1)) : '—'} ${Ui.ICONS.star}</span>
          </div>
        </div>
      </article>`;
  }

  function hydrate(root) {
    root.querySelectorAll('img[data-src]').forEach((img) => {
      img.src = Ui.imgSrc(img.dataset.src) || Ui.PLACEHOLDER_URL;
      Ui.bindImage(img, 'restaurant');
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

    const prices = [...new Set(all.map((r) => r.price_range).filter(Boolean))].sort();
    priceChips.innerHTML = [`<button class="chip${!priceFilter ? ' is-active' : ''}" data-filter="">Any price</button>`]
      .concat(prices.map((p) => `
        <button class="chip${priceFilter === p ? ' is-active' : ''}" data-filter="${Ui.esc(p)}">${Ui.esc(p)}</button>`))
      .join('');
    priceChips.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        priceFilter = chip.dataset.filter;
        page = 1;
        renderChips();
        render();
      });
    });
  }

  function renderPager(items) {
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
        totalItems: items.length,
        currentPage: page,
        itemsPerPage: APP_CONFIG.PAGINATION_PER_PAGE,
        onPageChange: (p) => { page = p; render(); if (resultsEl) resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
      });
    }
  }

  function render() {
    const items = filtered();
    resultCount.textContent = `${items.length} restaurant${items.length === 1 ? '' : 's'}`;
    if (!items.length) {
      resultsEl.innerHTML = '';
      stateHost.innerHTML = '';
      stateHost.appendChild(Ui.statePanel({
        type: 'empty',
        title: 'No restaurants match',
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
      const [rests, dests] = await Promise.allSettled([
        Api.fetchAll('/v1/restaurants', { per_page: 100 }),
        Api.get('/v1/destinations'),
      ]);
      if (rests.status === 'fulfilled') all = rests.value;
      if (dests.status === 'fulfilled') destinations = Ui.uniqueBy((dests.value.data && dests.value.data.data) || [], (d) => d.city_name || d.name);
      await favsReady;
      renderChips();
      render();
    } catch (err) {
      resultsEl.innerHTML = '';
      stateHost.innerHTML = '';
      stateHost.appendChild(Ui.statePanel({
        type: err.status === 0 ? 'network' : 'error',
        title: err.status === 0 ? 'No connection' : 'Could not load restaurants',
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
