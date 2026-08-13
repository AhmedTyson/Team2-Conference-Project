/* ============================================================
   ITINERA — Favourites page (real backend favourites)
   ============================================================ */

(() => {
  Ui.init();

  const resultsEl = document.getElementById('results');
  const groupsEl = document.getElementById('favGroups');
  const stateHost = document.getElementById('stateHost');

  function hydrate(root) {
    root.querySelectorAll('img[data-src]').forEach((img) => {
      img.src = Ui.imgSrc(img.dataset.src) || Ui.PLACEHOLDER_URL;
      Ui.bindImage(img);
    });
    root.querySelectorAll('[data-fav-type]').forEach((el) => {
      el.replaceWith(Ui.favButton(el.dataset.favType, Number(el.dataset.favId), {
        active: true,
      }));
    });
  }

  function cardHtml(f) {
    const type = Ui.normalizeType(f.favorable_type);
    const t = Ui.typeMeta(type);
    const item = f.item || {};
    const name = item.name || `Saved ${t.label}`;
    const href = Ui.detailLink(type, f.favorable_id);
    const sub = item.city_name || (type === 'hotel' && Ui.money(item.price_per_night) ? `${Ui.money(item.price_per_night)}/night` : '') ||
      (type === 'restaurant' ? `${item.cuisine || ''} ${item.price_range || ''}` : '') ||
      (item.address || '');
    return `
      <article class="card reveal">
        <a class="card-media" href="${href}">
          <img data-src="${Ui.esc(item.image)}" alt="${Ui.esc(name)}" loading="lazy">
          <span data-fav-type="${type}" data-fav-id="${f.favorable_id}"></span>
        </a>
        <div class="card-body">
          <div class="card-topline">
            <h3 class="card-title"><a href="${href}">${Ui.esc(Ui.truncate(name, 42))}</a></h3>
            <span class="tag">${Ui.esc(t.label)}</span>
          </div>
          ${sub ? `<p class="card-desc">${Ui.esc(sub)}</p>` : ''}
          <div class="card-meta">
            ${item.rating ? `<span class="rating">${Ui.esc(Number(item.rating).toFixed(1))} ${Ui.ICONS.star}</span>` : ''}
          </div>
        </div>
      </article>`;
  }

  function renderGroups(groups) {
    groupsEl.innerHTML = '';
    resultsEl.innerHTML = '';
    const total = groups.reduce((n, g) => n + g.items.length, 0);

    if (!total) {
      stateHost.appendChild(Ui.statePanel({
        type: 'empty',
        title: 'Nothing saved yet',
        message: 'Tap the heart on any destination, hotel, restaurant or attraction to keep it here.',
      }));
      return;
    }

    stateHost.innerHTML = '';
    groups.forEach((g) => {
      const title = document.createElement('h2');
      title.className = 'fav-group-title';
      const meta = Ui.typeMeta(g.type);
      title.innerHTML = `${Ui.icon(meta.icon, '')} <span>${Ui.esc(meta.label)}s</span> <span class="count">${g.items.length}</span>`;
      groupsEl.appendChild(title);

      const grid = document.createElement('div');
      grid.className = 'grid';
      grid.innerHTML = g.items.map(cardHtml).join('');
      hydrate(grid);
      groupsEl.appendChild(grid);
    });
  }

  async function load() {
    if (!Auth.isLoggedIn()) {
      groupsEl.innerHTML = '';
      resultsEl.innerHTML = '';
      stateHost.appendChild(Ui.statePanel({
        type: 'unauthorized',
        title: 'Log in to see your favourites',
        message: 'Your saved places are tied to your account.',
        retry: () => { window.location.href = 'login.html'; },
      }));
      return;
    }
    resultsEl.innerHTML = Ui.skeletonGrid(6);
    try {
      const body = await Api.get('/v1/dashboard/favourites', null, { auth: true });
      const favs = Array.isArray(body.data.data) ? body.data.data : [];
      Ui.Favourites.setList(favs);
      const order = ['destination', 'hotel', 'restaurant', 'attraction'];
      const groups = [];
      order.forEach((type) => {
        const items = favs.filter((f) => Ui.normalizeType(f.favorable_type) === type);
        if (items.length) groups.push({ type, items });
      });
      favs.forEach((f) => {
        const t = Ui.normalizeType(f.favorable_type);
        if (!order.includes(t)) {
          let g = groups.find((x) => x.type === t);
          if (!g) { g = { type: t, items: [] }; groups.push(g); }
          g.items.push(f);
        }
      });
      renderGroups(groups);
    } catch (err) {
      resultsEl.innerHTML = '';
      groupsEl.innerHTML = '';
      stateHost.innerHTML = '';
      stateHost.appendChild(Ui.statePanel({
        type: err.status === 0 ? 'network' : 'error',
        title: err.status === 0 ? 'No connection' : 'Could not load favourites',
        message: err.message,
        retry: load,
      }));
    }
  }

  window.addEventListener('itinera:favourites-changed', () => {
    if (Auth.isLoggedIn()) load();
  });

  document.addEventListener('DOMContentLoaded', load);
})();
