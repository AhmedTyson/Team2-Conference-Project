/* ============================================================
   ITINERA — Restaurant details page
   ============================================================ */

(() => {
  Ui.init();
  const favsReady = Ui.Favourites.load().catch(() => []);
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  const detailEl = document.getElementById('detail');
  const stateHost = document.getElementById('stateHost');

  function heroHtml(r) {
    return `
      <section class="detail-hero">
        <img data-src="${Ui.esc(r.image)}" alt="${Ui.esc(r.name)}">
        <div class="container hero-content">
          <p class="eyebrow">${Ui.esc(r.price_range || '')} RESTAURANT${r.destination ? ' · ' + Ui.esc(r.destination.name) : ''}</p>
          <h1>${Ui.esc(r.name)}</h1>
          <p class="hero-sub">${Ui.esc(r.cuisine || (r.address || 'Address not available'))}</p>
          <div class="hero-meta">
            <span data-fav-type="restaurant" data-fav-id="${r.id}"></span>
            <button class="btn btn-primary" data-action="review">Write a review</button>
          </div>
        </div>
      </section>`;
  }

  function facts(r) {
    const rows = [];
    rows.push(['Cuisine', r.cuisine || '—']);
    rows.push(['Price range', r.price_range || '—']);
    rows.push(['Rating', r.rating ? `${Number(r.rating).toFixed(1)} / 5` : '—']);
    rows.push(['Address', r.address || '—']);
    if (r.category) rows.push(['Category', r.category.name]);
    if (r.destination) rows.push(['Destination', r.destination.name]);
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
      btn.addEventListener('click', () => Review.openReviewModal('restaurant', id, btn.closest('.detail-hero').querySelector('h1').textContent));
    });
  }

  async function loadMap(r) {
    const el = document.getElementById('restaurantMap');
    if (!el) return;
    const num = (v) => (v === null || v === undefined || v === '') ? null : Number(v);
    const lat = num(r.latitude);
    const lng = num(r.longitude);
    const dLat = r.destination ? num(r.destination.latitude) : null;
    const dLng = r.destination ? num(r.destination.longitude) : null;
    const center = (lat !== null && lng !== null)
      ? { lat, lng }
      : ((dLat !== null && dLng !== null) ? { lat: dLat, lng: dLng } : null);
    if (!center) {
      el.innerHTML = '<div class="map-placeholder"><p>Location unavailable for this restaurant.</p></div>';
      return;
    }
    const points = [];
    if (lat !== null && lng !== null) {
      points.push({ lat, lng, title: r.name, type: 'restaurant', link: Ui.detailLink('restaurant', r.id) });
    } else if (r.destination) {
      points.push({ lat: dLat, lng: dLng, title: r.destination.name, type: 'destination', link: null });
    }
    const map = await MapModule.render('restaurantMap', center, points);
    if (!map) return;
    try {
      const enriched = await MapModule.enrichDestination(r.destination_id);
      if (!enriched) return;
      const added = [];
      const add = (list, type) => (list || []).forEach((x) => {
        if (num(x.latitude) !== null && num(x.longitude) !== null) {
          added.push({ lat: num(x.latitude), lng: num(x.longitude), title: x.name, type, link: Ui.detailLink(type, x.id) });
        }
      });
      add(enriched.attractions, 'attraction');
      add(enriched.hotels, 'hotel');
      add(enriched.restaurants, 'restaurant');
      added.forEach((p) => MapModule.addMarker(map, p));
      if (added.length) MapModule.fitTo(map, [...points, ...added]);
    } catch (e) { /* best-effort */ }
  }

  async function loadRelated(r) {
    if (!r.destination) return;
    try {
      const rests = await Api.fetchAll('/v1/restaurants');
      const related = rests
        .filter((x) => Number(x.destination_id) === Number(r.destination_id) && Number(x.id) !== Number(r.id))
        .slice(0, 3);
      if (!related.length) return;
      const html = `
        <section class="section" aria-label="More restaurants">
          <div class="container">
            <div class="related-head">
              <h2>More in ${Ui.esc(r.destination.name)}</h2>
              <a class="btn btn-ghost btn-sm" href="restaurants.html">View all →</a>
            </div>
            <div class="grid">
              ${related.map((x) => `
                <article class="card reveal">
                  <a class="card-media" href="restaurant-details.html?id=${x.id}">
                    <img data-src="${Ui.esc(x.image)}" alt="${Ui.esc(x.name)}" loading="lazy">
                    <span data-fav-type="restaurant" data-fav-id="${x.id}"></span>
                  </a>
                  <div class="card-body">
                    <div class="card-topline">
                      <h3 class="card-title"><a href="restaurant-details.html?id=${x.id}">${Ui.esc(Ui.truncate(x.name, 42))}</a></h3>
                    </div>
                    <div class="card-meta">
                      <span class="tag">${Ui.esc(x.price_range || '—')}</span>
                      <span class="rating">${Number(x.rating) ? Ui.esc(Number(x.rating).toFixed(1)) : '—'} ${Ui.ICONS.star}</span>
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
        type: 'error', title: 'Missing restaurant', message: 'No restaurant id was provided.',
        retry: () => { window.location.href = 'restaurants.html'; },
      }));
      return;
    }
    detailEl.innerHTML = Ui.skeletonGrid(1);
    try {
      const body = await Api.get(`/v1/restaurants/${id}`);
      const r = body.data.data;
      await favsReady;
      const crumb = document.getElementById('crumbCurrent');
      if (crumb) crumb.textContent = r.name;
      document.title = `${r.name} — Itinera`;

      const layout = document.createElement('div');
      layout.innerHTML = heroHtml(r) + `
        <div class="container">
          <div class="detail-layout">
            <div class="section">
              <div class="fact-card">
                ${facts(r).map(([k, v]) => `<div class="fact-row"><span class="k">${k}</span><span class="v">${Ui.esc(v)}</span></div>`).join('')}
              </div>
              <div class="map-wrap hotel-map">
                <div class="map" id="restaurantMap"></div>
                <div class="map-legend">
                  <span><i class="dot-dest"></i>Destination</span>
                  <span><i class="dot-att"></i>Attraction</span>
                  <span><i class="dot-hotel"></i>Hotel</span>
                  <span><i class="dot-rest"></i>Restaurant</span>
                </div>
              </div>
            </div>
            <aside class="detail-aside">
              <div class="fact-card">
                <button class="btn btn-primary btn-block" data-action="review">Write a review</button>
                ${r.destination ? `<a class="btn btn-block" href="destination-details.html?id=${r.destination_id}">View destination →</a>` : ''}
              </div>
            </aside>
          </div>
        </div>`;
      hydrate(layout);
      detailEl.innerHTML = '';
      detailEl.appendChild(layout);
      loadMap(r);
      loadRelated(r);
    } catch (err) {
      detailEl.innerHTML = '';
      stateHost.innerHTML = '';
      stateHost.appendChild(Ui.statePanel({
        type: err.status === 404 ? 'empty' : (err.status === 0 ? 'network' : 'error'),
        title: err.status === 404 ? 'Restaurant not found' : 'Could not load restaurant',
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
