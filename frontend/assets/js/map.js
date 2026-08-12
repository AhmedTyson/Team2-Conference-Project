/* ============================================================
   ITINERA — Map module (Leaflet + OSM tiles, monochrome theme)
   Renders from reliable local lat/lng data first; live backend
   enrichment is best-effort with a strict timeout + fallback.
   ============================================================ */

const MapModule = (() => {
  const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';

  let leaflet = null;
  let loadPromise = null;

  function loadLeaflet() {
    if (leaflet) return Promise.resolve(leaflet);
    if (loadPromise) return loadPromise;
    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      script.onload = () => {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        css.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        css.crossOrigin = '';
        document.head.appendChild(css);
        leaflet = window.L;
        resolve(leaflet);
      };
      script.onerror = () => reject(new Error('Map library failed to load'));
      document.head.appendChild(script);
    });
    return loadPromise;
  }

  function markerColor(type) {
    return {
      destination: '#ffffff',
      attraction: '#d9d9d9',
      hotel: '#8f8f8f',
      restaurant: '#5c5c5c',
    }[type] || '#ffffff';
  }

  function createMap(container, { lat, lng, zoom = 13 }) {
    const map = leaflet.map(container, { zoomControl: true, scrollWheelZoom: true });
    leaflet.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 18 }).addTo(map);
    map.setView([lat, lng], zoom);
    return map;
  }

  function addMarker(map, { lat, lng, title, type = 'attraction', link = null }) {
    const div = leaflet.divIcon({
      className: '',
      html: `<span class="itinera-marker m-${type}"></span>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
    const popupContent = link
      ? `<strong>${Ui.esc(title)}</strong><br><a href="${link}">View details →</a>`
      : `<strong>${Ui.esc(title)}</strong>`;
    return leaflet.marker([lat, lng], { icon: div, title }).addTo(map).bindPopup(popupContent);
  }

  function fitTo(map, points) {
    if (!points.length) return;
    map.fitBounds(leaflet.latLngBounds(points.map((p) => [p.lat, p.lng])));
  }

  /* Renders the map inside `containerId` using local data (lat/lng).
     Returns the map instance (or null if it failed). */
  async function render(containerId, center, points = []) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    if (!center || typeof center.lat !== 'number' || typeof center.lng !== 'number') {
      container.innerHTML = `
        <div class="map-placeholder" role="status">
          ${Ui.icon('pin', 'state-icon')}
          <p>Map unavailable — no coordinates provided for this location.</p>
        </div>`;
      return null;
    }

    try {
      await loadLeaflet();
    } catch (e) {
      container.innerHTML = `
        <div class="map-placeholder" role="status">
          ${Ui.icon('wifiOff', 'state-icon')}
          <p>Map could not be loaded (map library or network unavailable).</p>
        </div>`;
      return null;
    }

    const map = createMap(container, center);
    points.forEach((p) => addMarker(map, p));
    if (points.length) fitTo(map, points);
    return map;
  }

  /* Best-effort enrichment from the real backend map endpoint.
     Never throws; on failure just resolves with null. */
  async function enrichDestination(destinationId) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), APP_CONFIG.MAP_ENRICH_TIMEOUT);
    try {
      const res = await fetch(`${APP_CONFIG.API_BASE_URL.replace(/\/+$/, '')}/v1/maps/destination/${destinationId}`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const body = await res.json();
      if (!body || body.success !== true) return null;
      return {
        destination: body.destination || null,
        attractions: Array.isArray(body.attractions) ? body.attractions : [],
        hotels: Array.isArray(body.hotels) ? body.hotels : [],
        restaurants: Array.isArray(body.restaurants) ? body.restaurants : [],
      };
    } catch (e) {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  return { render, addMarker, fitTo, enrichDestination };
})();
