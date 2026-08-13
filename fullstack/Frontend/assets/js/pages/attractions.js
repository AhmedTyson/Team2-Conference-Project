/* ============================================================
   ITINERA — Attractions list page
   ============================================================ */

(() => {
  Ui.init();
  const favsReady = Ui.Favourites.load().catch(() => []);

  const resultsEl = document.getElementById('results');
  const stateHost = document.getElementById('stateHost');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const categoryChips = document.getElementById('categoryChips');
  const resultCount = document.getElementById('resultCount');

  let all = [];
  let category = '';
  let page = 1;

  function matchesSearch(a) {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) return true;
    return [a.name, a.description, a.destination && a.destination.name, a.category && a.category.name]
      .filter(Boolean)
      .some((v) => v.toLowerCase().includes(q));
  }

  function filtered() {
    return all.filter((a) => {
      if (!matchesSearch(a)) return false;
      if (category && !(a.category && a.category.name === category)) return false;
      return true;
    }).sort((a, b) => {
      if (sortSelect.value === 'destination') {
        return String(a.destination && a.destination.name).localeCompare(String(b.destination && b.destination.name));
      }
      return String(a.name).localeCompare(String(b.name));
    });
  }

  function cardHtml(a) {
    return `
      <article class="card reveal">
        <a class="card-media" href="attraction-details.html?id=${a.id}">
          <img data-src="${Ui.esc(a.image)}" alt="${Ui.esc(a.name)}" loading="lazy">
          <span data-fav-type="attraction" data-fav-id="${a.id}"></span>
        </a>
        <div class="card-body">
          <div class="card-topline">
            <h3 class="card-title"><a href="attraction-details.html?id=${a.id}">${Ui.esc(Ui.truncate(a.name, 42))}</a></h3>
          </div>
          <p class="card-desc">${Ui.esc(Ui.truncate(a.description, 120))}</p>
          <div class="card-meta">
            <span class="tag">${Ui.esc(a.category ? a.category.name : 'Attraction')}</span>
            <span class="tag">${Ui.esc(a.destination ? a.destination.name : '')}</span>
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
    const cats = [...new Set(all.map((a) => a.category && a.category.name).filter(Boolean))].sort();
    categoryChips.innerHTML = `
      <button class="chip${!category ? ' is-active' : ''}" data-category="">All categories</button>` +
      cats.map((c) => `<button class="chip${category === c ? ' is-active' : ''}" data-category="${Ui.esc(c)}">${Ui.esc(c)}</button>`).join('');
    categoryChips.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        category = chip.dataset.category;
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
    resultCount.textContent = `${items.length} attraction${items.length === 1 ? '' : 's'}`;
    if (!items.length) {
      resultsEl.innerHTML = '';
      stateHost.innerHTML = '';
      stateHost.appendChild(Ui.statePanel({
        type: 'empty',
        title: 'No attractions match',
        message: 'Try a different search term or category.',
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
      const body = await Api.get('/v1/attractions');
      all = Array.isArray(body.data.data) ? body.data.data : [];
      await favsReady;
      renderChips();
      render();
    } catch (err) {
      resultsEl.innerHTML = '';
      stateHost.innerHTML = '';
      stateHost.appendChild(Ui.statePanel({
        type: err.status === 0 ? 'network' : 'error',
        title: err.status === 0 ? 'No connection' : 'Could not load attractions',
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
