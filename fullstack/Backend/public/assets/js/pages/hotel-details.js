/* ============================================================
   ITINERA — Hotel details page
   ============================================================ */

(() => {
  Ui.init();
  const favsReady = Ui.Favourites.load().catch(() => []);
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  const detailEl = document.getElementById('detail');
  const stateHost = document.getElementById('stateHost');

  function availabilityLabel(h) {
    if (h.availability === true || h.availability === 1 || h.availability === '1') return 'Available now';
    if (h.availability === false || h.availability === 0 || h.availability === '0') return 'Currently unavailable';
    if (h.availability) return `Available: ${String(h.availability)}`;
    return '—';
  }

  function heroHtml(h) {
    return `
      <section class="detail-hero">
        <img data-src="${Ui.esc(h.image)}" alt="${Ui.esc(h.name)}">
        <div class="container hero-content">
          <p class="eyebrow">${Number(h.stars) || 0}★ HOTEL${h.destination ? ' · ' + Ui.esc(h.destination.name) : ''}</p>
          <h1>${Ui.esc(h.name)}</h1>
          <p class="hero-sub">${Ui.esc(h.address || 'Address not available')}</p>
          <div class="hero-meta">
            <span data-fav-type="hotel" data-fav-id="${h.id}"></span>
            <button class="btn btn-primary" data-action="review">Write a review</button>
          </div>
        </div>
      </section>`;
  }

  function facts(h) {
    const rows = [];
    if (Ui.money(h.price_per_night)) rows.push(['Price / night', Ui.money(h.price_per_night)]);
    rows.push(['Rating', h.rating ? `${Number(h.rating).toFixed(1)} / 5` : '—']);
    rows.push(['Stars', `${Number(h.stars) || 0}★`]);
    rows.push(['Availability', availabilityLabel(h)]);
    if (h.destination) rows.push(['Destination', h.destination.name]);
    return rows;
  }

  function hydrate(root) {
    root.querySelectorAll('img[data-src]').forEach((img) => {
      img.src = Ui.imgSrc(img.dataset.src) || Ui.PLACEHOLDER_URL;
      Ui.bindImage(img, 'hotel');
    });
    root.querySelectorAll('[data-fav-type]').forEach((el) => {
      el.replaceWith(Ui.favButton(el.dataset.favType, Number(el.dataset.favId), {
        active: Ui.Favourites.isFav(el.dataset.favType, el.dataset.favId),
      }));
    });
    root.querySelectorAll('[data-action="review"]').forEach((btn) => {
      btn.addEventListener('click', () => Review.openReviewModal('hotel', id, btn.closest('.detail-hero').querySelector('h1').textContent));
    });
  }

  async function loadMap(h) {
    const el = document.getElementById('hotelMap');
    if (!el) return;
    const num = (v) => (v === null || v === undefined || v === '') ? null : Number(v);
    const lat = num(h.latitude);
    const lng = num(h.longitude);
    const dLat = h.destination ? num(h.destination.latitude) : null;
    const dLng = h.destination ? num(h.destination.longitude) : null;
    const center = (lat !== null && lng !== null)
      ? { lat, lng }
      : ((dLat !== null && dLng !== null) ? { lat: dLat, lng: dLng } : null);
    if (!center) {
      el.innerHTML = '<div class="map-placeholder"><p>Location unavailable for this hotel.</p></div>';
      return;
    }
    const points = [];
    if (lat !== null && lng !== null) {
      points.push({ lat, lng, title: h.name, type: 'hotel', link: Ui.detailLink('hotel', h.id) });
    }
    const map = await MapModule.render('hotelMap', center, points);
    if (!map) return;
    try {
      const enriched = await MapModule.enrichDestination(h.destination_id);
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

  async function loadRelated(h) {
    if (!h.destination) return;
    try {
      const hotels = await Api.fetchAll('/v1/hotels', { per_page: 100 });
      const related = hotels
        .filter((x) => Number(x.destination_id) === Number(h.destination_id) && Number(x.id) !== Number(h.id))
        .slice(0, 3);
      if (!related.length) return;
      const html = `
        <section class="section" aria-label="More hotels">
          <div class="container">
            <div class="related-head">
              <h2>More in ${Ui.esc(h.destination.name)}</h2>
              <a class="btn btn-ghost btn-sm" href="hotels.html">View all →</a>
            </div>
            <div class="grid">
              ${related.map((x) => `
                <article class="card reveal">
                  <a class="card-media" href="hotel-details.html?id=${x.id}">
                    <img data-src="${Ui.esc(x.image)}" alt="${Ui.esc(x.name)}" loading="lazy">
                    <span data-fav-type="hotel" data-fav-id="${x.id}"></span>
                  </a>
                  <div class="card-body">
                    <div class="card-topline">
                      <h3 class="card-title"><a href="hotel-details.html?id=${x.id}">${Ui.esc(Ui.truncate(x.name, 42))}</a></h3>
                    </div>
                    <div class="card-meta">
                      <span class="tag">${Number(x.stars) || 0}★</span>
                      ${Ui.money(x.price_per_night) ? `<span class="price">${Ui.esc(Ui.money(x.price_per_night))}<small> / night</small></span>` : ''}
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
        type: 'error', title: 'Missing hotel', message: 'No hotel id was provided.',
        retry: () => { window.location.href = 'hotels.html'; },
      }));
      return;
    }
    detailEl.innerHTML = Ui.skeletonGrid(1);
    try {
      const body = await Api.get(`/v1/hotels/${id}`);
      const h = body.data.data;
      await favsReady;
      const crumb = document.getElementById('crumbCurrent');
      if (crumb) crumb.textContent = h.name;
      document.title = `${h.name} — Itinera`;

      const layout = document.createElement('div');
      layout.innerHTML = heroHtml(h) + `
        <div class="container">
          <div class="detail-layout">
            <div class="section">
              <div class="fact-card">
                ${facts(h).map(([k, v]) => `<div class="fact-row"><span class="k">${k}</span><span class="v">${Ui.esc(v)}</span></div>`).join('')}
              </div>
              <div class="map-wrap hotel-map">
                <div class="map" id="hotelMap"></div>
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
                ${h.destination ? `<a class="btn btn-block" href="destination-details.html?id=${h.destination_id}">View destination →</a>` : ''}
              </div>
            </aside>
          </div>
        </div>`;
      hydrate(layout);
      detailEl.innerHTML = '';
      detailEl.appendChild(layout);
      loadMap(h);
      loadRelated(h);
    } catch (err) {
      detailEl.innerHTML = '';
      stateHost.innerHTML = '';
      stateHost.appendChild(Ui.statePanel({
        type: err.status === 404 ? 'empty' : (err.status === 0 ? 'network' : 'error'),
        title: err.status === 404 ? 'Hotel not found' : 'Could not load hotel',
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
