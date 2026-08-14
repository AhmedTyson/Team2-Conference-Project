/* ============================================================
   ITINERA — Destination details page
   Hero, facts, map (with live enrichment), weather, related items.
   ============================================================ */

(() => {
  Ui.init();
  const favsReady = Ui.Favourites.load().catch(() => []);
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  const detailEl = document.getElementById('detail');
  const stateHost = document.getElementById('stateHost');

  const esc = Ui.esc;
  function num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function facts(d) {
    const country = d.country;
    const rows = [];
    rows.push(['Country', country ? `${country.name}${country.flag_url ? ' ' : ''}` : '—']);
    rows.push(['City', d.city_name || '—']);
    rows.push(['Region', country && country.capital ? `Capital: ${country.capital}` : '—']);
    if (num(d.latitude) !== null && num(d.longitude) !== null) {
      rows.push(['Coordinates', `${num(d.latitude).toFixed(4)}, ${num(d.longitude).toFixed(4)}`]);
    }
    return rows;
  }

  function heroHtml(d) {
    const country = d.country ? d.country.name : '';
    return `
      <section class="detail-hero">
        <img data-src="${Ui.esc(d.image)}" alt="${Ui.esc(d.name)}">
        <div class="container hero-content">
          <p class="eyebrow">${Ui.esc(country || 'Destination')}</p>
          <h1>${Ui.esc(d.name)}</h1>
          <p class="hero-sub">${Ui.esc(Ui.truncate(d.description, 220))}</p>
          <div class="hero-meta">
            <span data-fav-type="destination" data-fav-id="${d.id}"></span>
            <button class="btn btn-primary" data-action="review">Write a review</button>
          </div>
        </div>
      </section>`;
  }

  function weatherHtml(place) {
    return `
      <section class="section" aria-label="Current weather">
        <div class="container">
          <div class="weather-strip">
            <span class="weather-place">${Ui.esc(place)}</span>
            <span class="weather-temp" id="weatherTemp">—°</span>
            <span class="weather-desc" id="weatherDesc">Loading forecast…</span>
          </div>
        </div>
      </section>`;
  }

  function mapHtml() {
    return `
      <section class="section" aria-label="Map">
        <div class="container">
          <div class="map-wrap">
            <div class="map" id="map"></div>
            <div class="map-legend">
              <span><i class="dot-dest"></i>Destination</span>
              <span><i class="dot-att"></i>Attraction</span>
              <span><i class="dot-hotel"></i>Hotel</span>
              <span><i class="dot-rest"></i>Restaurant</span>
            </div>
          </div>
        </div>
      </section>`;
  }

  function relatedHtml(title, list, type) {
    const t = Ui.typeMeta(type);
    return `
      <section class="section" aria-label="${Ui.esc(title)}">
        <div class="container">
          <div class="related-head">
            <h2>${Ui.esc(title)}</h2>
            <a class="btn btn-ghost btn-sm" href="${Ui.detailLink(type, 1).split('?')[0]}">View all →</a>
          </div>
          <div class="grid" data-related="${type}">
            ${list.map((item) => {
              const name = item.name || '';
              const sub = type === 'hotel' ? `$${Number(item.price_per_night) || '—'}/night`
                : type === 'restaurant' ? `${item.cuisine || ''} · ${item.price_range || ''}`
                : item.category ? item.category.name : '';
              return `
                <article class="card reveal">
                  <a class="card-media" href="${Ui.detailLink(type, item.id)}">
                    <img data-src="${Ui.esc(item.image)}" alt="${Ui.esc(name)}" loading="lazy">
                    <span data-fav-type="${type}" data-fav-id="${item.id}"></span>
                  </a>
                  <div class="card-body">
                    <div class="card-topline">
                      <h3 class="card-title"><a href="${Ui.detailLink(type, item.id)}">${Ui.esc(Ui.truncate(name, 40))}</a></h3>
                    </div>
                    <div class="card-meta">
                      <span class="tag">${Ui.esc(t.label)}</span>
                      ${item.rating ? `<span class="rating">${Ui.esc(Number(item.rating).toFixed(1))} ${Ui.ICONS.star}</span>` : ''}
                      <span class="price">${Ui.esc(sub)}</span>
                    </div>
                  </div>
                </article>`;
            }).join('')}
          </div>
        </div>
      </section>`;
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
    root.querySelectorAll('[data-action="review"]').forEach((btn) => {
      btn.addEventListener('click', () => Review.openReviewModal('destination', id, btn.closest('.detail-hero').querySelector('h1').textContent));
    });
    root.querySelectorAll('[data-action="save"]').forEach((btn) => {
      const update = () => {
        const on = Ui.Favourites.isFav('destination', id);
        btn.textContent = on ? 'Saved ✓' : 'Save to favourites';
        btn.classList.toggle('btn-primary', !on);
      };
      update();
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          const added = await Ui.Favourites.toggle('destination', id);
          if (added !== null) update();
        } catch (err) {
          Ui.toast(err.message || 'Could not update favourites.', 'error');
        } finally {
          btn.disabled = false;
        }
      });
    });
  }

  async function loadWeather(lat, lng, place) {
    try {
      const { data } = await Api.get('/weather', { lat, lon: lng });
      const w = data && data.current_weather;
      const tempEl = document.getElementById('weatherTemp');
      const descEl = document.getElementById('weatherDesc');
      if (tempEl) tempEl.textContent = `${Math.round(Number(w.temperature))}°C`;
      if (descEl) descEl.textContent = `${Review.weatherLabel(Number(w.weathercode))} · Wind ${Math.round(Number(w.windspeed))} km/h`;
    } catch (e) {
      const tempEl = document.getElementById('weatherTemp');
      const descEl = document.getElementById('weatherDesc');
      if (tempEl) tempEl.textContent = '—';
      if (descEl) descEl.textContent = 'Weather unavailable right now.';
    }
  }

  async function loadMap(d) {
    const lat = num(d.latitude);
    const lng = num(d.longitude);
    const points = lat !== null && lng !== null
      ? [{ lat, lng, title: d.name, type: 'destination', link: null }]
      : [];
    const map = await MapModule.render('map', { lat, lng }, points);
    if (!map) return;
    const enriched = await MapModule.enrichDestination(d.id);
    if (!enriched) return;
    const added = [];
    (enriched.attractions || []).forEach((a) => {
      if (num(a.latitude) !== null && num(a.longitude) !== null) {
        added.push({ lat: num(a.latitude), lng: num(a.longitude), title: a.name, type: 'attraction', link: Ui.detailLink('attraction', a.id) });
      }
    });
    (enriched.hotels || []).forEach((h) => {
      if (num(h.latitude) !== null && num(h.longitude) !== null) {
        added.push({ lat: num(h.latitude), lng: num(h.longitude), title: h.name, type: 'hotel', link: Ui.detailLink('hotel', h.id) });
      }
    });
    (enriched.restaurants || []).forEach((r) => {
      if (num(r.latitude) !== null && num(r.longitude) !== null) {
        added.push({ lat: num(r.latitude), lng: num(r.longitude), title: r.name, type: 'restaurant', link: Ui.detailLink('restaurant', r.id) });
      }
    });
    added.forEach((p) => MapModule.addMarker(map, p));
    if (added.length) MapModule.fitTo(map, [...points, ...added]);
  }

  async function loadRelated(d) {
    try {
      const [hotels, restaurants, attractions] = await Promise.allSettled([
        Api.fetchAll('/v1/hotels'),
        Api.fetchAll('/v1/restaurants'),
        Api.get('/v1/attractions'),
      ]);
      const h = hotels.status === 'fulfilled' ? hotels.value.filter((x) => Number(x.destination_id) === Number(d.id)).slice(0, 3) : [];
      const r = restaurants.status === 'fulfilled' ? restaurants.value.filter((x) => Number(x.destination_id) === Number(d.id)).slice(0, 3) : [];
      const a = attractions.status === 'fulfilled' ? ((attractions.value.data && attractions.value.data.data) || []).filter((x) => Number(x.destination_id) === Number(d.id)).slice(0, 3) : [];
      let html = '';
      if (h.length) html += relatedHtml('Hotels in ' + d.name, h, 'hotel');
      if (r.length) html += relatedHtml('Restaurants in ' + d.name, r, 'restaurant');
      if (a.length) html += relatedHtml('Attractions in ' + d.name, a, 'attraction');
      if (html) {
        const wrap = document.createElement('div');
        wrap.innerHTML = html;
        wrap.querySelectorAll('[data-related]').forEach((grid) => hydrate(grid));
        detailEl.appendChild(wrap);
      }
    } catch (e) { /* related items are best-effort */ }
  }

  async function load() {
    if (!id) {
      stateHost.appendChild(Ui.statePanel({
        type: 'error', title: 'Missing destination', message: 'No destination id was provided.',
        retry: () => { window.location.href = 'destinations.html'; },
      }));
      return;
    }
    detailEl.innerHTML = Ui.skeletonGrid(1);
    try {
      const body = await Api.get(`/v1/destinations/${id}`);
      const d = body.data.data;
      await favsReady;
      const crumb = document.getElementById('crumbCurrent');
      if (crumb) crumb.textContent = d.name;
      document.title = `${d.name} — Itinera`;

      const layout = document.createElement('div');
      layout.innerHTML = heroHtml(d) + `
        <div class="container">
          <div class="detail-layout">
            <div>
              <section class="section">
                <div class="prose"><p>${Ui.esc(d.description)}</p></div>
              </section>
              ${mapHtml()}
              ${weatherHtml(d.city_name || d.name)}
            </div>
            <aside class="detail-aside">
              <div class="fact-card">
                ${facts(d).map(([k, v]) => `<div class="fact-row"><span class="k">${k}</span><span class="v">${Ui.esc(v)}</span></div>`).join('')}
              </div>
              <div class="fact-card">
                <button class="btn btn-primary btn-block" data-action="review">Write a review</button>
                <button class="btn btn-block" data-action="save">Save to favourites</button>
              </div>
            </aside>
          </div>
        </div>`;
      hydrate(layout);
      detailEl.innerHTML = '';
      detailEl.appendChild(layout);

      if (num(d.latitude) !== null && num(d.longitude) !== null) {
        loadMap(d);
        loadWeather(num(d.latitude), num(d.longitude), d.city_name || d.name);
      } else {
        const mapWrap = layout.querySelector('.map-wrap');
        if (mapWrap) mapWrap.innerHTML = `<div class="map-placeholder">No map available — this destination has no coordinates.</div>`;
      }
      loadRelated(d);
    } catch (err) {
      detailEl.innerHTML = '';
      stateHost.innerHTML = '';
      stateHost.appendChild(Ui.statePanel({
        type: err.status === 404 ? 'empty' : (err.status === 0 ? 'network' : 'error'),
        title: err.status === 404 ? 'Destination not found' : 'Could not load destination',
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
    detailEl.querySelectorAll('[data-action="save"]').forEach((btn) => {
      const on = Ui.Favourites.isFav('destination', id);
      btn.textContent = on ? 'Saved ✓' : 'Save to favourites';
      btn.classList.toggle('btn-primary', !on);
    });
  });

  document.addEventListener('DOMContentLoaded', load);
})();
