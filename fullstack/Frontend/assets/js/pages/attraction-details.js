/* ============================================================
   ITINERA — Attraction details page
   ============================================================ */

(() => {
  Ui.init();
  const favsReady = Ui.Favourites.load().catch(() => []);
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  const detailEl = document.getElementById('detail');
  const stateHost = document.getElementById('stateHost');

  function num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function heroHtml(a) {
    return `
      <section class="detail-hero">
        <img data-src="${Ui.esc(a.image)}" alt="${Ui.esc(a.name)}">
        <div class="container hero-content">
          <p class="eyebrow">${Ui.esc(a.category ? a.category.name : '')} ATTRACTION${a.destination ? ' · ' + Ui.esc(a.destination.name) : ''}</p>
          <h1>${Ui.esc(a.name)}</h1>
          <p class="hero-sub">${Ui.esc(Ui.truncate(a.description, 220))}</p>
          <div class="hero-meta">
            <span data-fav-type="attraction" data-fav-id="${a.id}"></span>
            <button class="btn btn-primary" data-action="review">Write a review</button>
          </div>
        </div>
      </section>`;
  }

  function facts(a) {
    const rows = [];
    rows.push(['Category', (a.category && a.category.name) || '—']);
    if (a.destination) rows.push(['Destination', a.destination.name]);
    if (num(a.latitude) !== null && num(a.longitude) !== null) {
      rows.push(['Coordinates', `${num(a.latitude).toFixed(4)}, ${num(a.longitude).toFixed(4)}`]);
    }
    return rows;
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
    root.querySelectorAll('[data-action="review"]').forEach((btn) => {
      btn.addEventListener('click', () => Review.openReviewModal('attraction', id, btn.closest('.detail-hero').querySelector('h1').textContent));
    });
  }

  async function loadMap(a) {
    const lat = num(a.latitude);
    const lng = num(a.longitude);
    const points = lat !== null && lng !== null
      ? [{ lat, lng, title: a.name, type: 'attraction', link: null }]
      : [];
    await MapModule.render('map', { lat, lng }, points);
  }

  async function loadRelated(a) {
    if (!a.destination) return;
    try {
      const body = await Api.get('/v1/attractions');
      const related = (Array.isArray(body.data.data) ? body.data.data : [])
        .filter((x) => Number(x.destination_id) === Number(a.destination_id) && Number(x.id) !== Number(a.id))
        .slice(0, 3);
      if (!related.length) return;
      const html = `
        <section class="section" aria-label="More attractions">
          <div class="container">
            <div class="related-head">
              <h2>More in ${Ui.esc(a.destination.name)}</h2>
              <a class="btn btn-ghost btn-sm" href="attractions.html">View all →</a>
            </div>
            <div class="grid">
              ${related.map((x) => `
                <article class="card reveal">
                  <a class="card-media" href="attraction-details.html?id=${x.id}">
                    <img data-src="${Ui.esc(x.image)}" alt="${Ui.esc(x.name)}" loading="lazy">
                    <span data-fav-type="attraction" data-fav-id="${x.id}"></span>
                  </a>
                  <div class="card-body">
                    <div class="card-topline">
                      <h3 class="card-title"><a href="attraction-details.html?id=${x.id}">${Ui.esc(Ui.truncate(x.name, 42))}</a></h3>
                    </div>
                    <div class="card-meta">
                      <span class="tag">${Ui.esc(x.category ? x.category.name : 'Attraction')}</span>
                    </div>
                  </div>
                </article>`).join('')}
            </div>
          </div>
        </section>`;
      const wrap = document.createElement('div');
      wrap.innerHTML = html;
      hydrate(wrap);
      detailEl.appendChild(wrap);
    } catch (e) { /* best-effort */ }
  }

  async function load() {
    if (!id) {
      stateHost.appendChild(Ui.statePanel({
        type: 'error', title: 'Missing attraction', message: 'No attraction id was provided.',
        retry: () => { window.location.href = 'attractions.html'; },
      }));
      return;
    }
    detailEl.innerHTML = Ui.skeletonGrid(1);
    try {
      const body = await Api.get(`/v1/attractions/${id}`);
      const a = body.data.data;
      await favsReady;
      const crumb = document.getElementById('crumbCurrent');
      if (crumb) crumb.textContent = a.name;
      document.title = `${a.name} — Itinera`;

      const layout = document.createElement('div');
      layout.innerHTML = heroHtml(a) + `
        <div class="container">
          <div class="detail-layout">
            <div>
              <section class="section">
                <div class="prose"><p>${Ui.esc(a.description)}</p></div>
              </section>
              <section class="section" aria-label="Map">
                <div class="map-wrap">
                  <div class="map" id="map"></div>
                </div>
              </section>
            </div>
            <aside class="detail-aside">
              <div class="fact-card">
                ${facts(a).map(([k, v]) => `<div class="fact-row"><span class="k">${k}</span><span class="v">${Ui.esc(v)}</span></div>`).join('')}
              </div>
              <div class="fact-card">
                <button class="btn btn-primary btn-block" data-action="review">Write a review</button>
                ${a.destination ? `<a class="btn btn-block" href="destination-details.html?id=${a.destination_id}">View destination →</a>` : ''}
              </div>
            </aside>
          </div>
        </div>`;
      hydrate(layout);
      detailEl.innerHTML = '';
      detailEl.appendChild(layout);

      if (num(a.latitude) !== null && num(a.longitude) !== null) {
        loadMap(a);
      } else {
        const mapWrap = layout.querySelector('.map-wrap');
        if (mapWrap) mapWrap.innerHTML = `<div class="map-placeholder">No map available — this attraction has no coordinates.</div>`;
      }
      loadRelated(a);
    } catch (err) {
      detailEl.innerHTML = '';
      stateHost.innerHTML = '';
      stateHost.appendChild(Ui.statePanel({
        type: err.status === 404 ? 'empty' : (err.status === 0 ? 'network' : 'error'),
        title: err.status === 404 ? 'Attraction not found' : 'Could not load attraction',
        message: err.message,
        retry: load,
      }));
    }
  }

  window.addEventListener('itinera:favourites-changed', () => {
    detailEl.querySelectorAll('[data-fav-type]').forEach((el) => {
      const active = Ui.Favourites.isFav(el.dataset.favType, el.dataset.favId);
      const btn = el.querySelector('.fav-btn');
      if (btn) {
        btn.classList.toggle('is-active', active);
        btn.innerHTML = active ? Ui.ICONS.heartFill : Ui.ICONS.heart;
      }
    });
  });

  document.addEventListener('DOMContentLoaded', load);
})();
