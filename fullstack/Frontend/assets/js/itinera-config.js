/* ============================================================
   ITINERA — Application configuration (single source of truth)
   ============================================================ */

const APP_CONFIG = {
  /* Base URL of the Laravel API (routes defined in routes/api.php).
     All requests are built from this constant — change it in ONE place.
     - php artisan serve:  http://127.0.0.1:8000/api  (or localhost:8000)
     - Apache (XAMPP):     http://localhost/threedos/tasks/Team2-Conference-Project/public/api
     Keep the frontend on the same origin when possible (CORS-friendly). */
  API_BASE_URL: 'http://127.0.0.1:8000/api',

  /* Origin used to resolve relative image paths returned by the API
     (e.g. "img/Paris.jpg" -> ASSET_BASE_URL + "/img/Paris.jpg").
     Points at the Laravel public directory. */
  ASSET_BASE_URL: 'http://127.0.0.1:8000',

  APP_NAME: 'Itinera',
  TOKEN_KEY: 'itinari_token',
  USER_KEY: 'itinari_user',

  /* Timeout (ms) applied to every API request. */
  REQUEST_TIMEOUT: 20000,

  /* Timeout (ms) for the live map enrichment endpoint. It calls
     external services and can be very slow. */
  MAP_ENRICH_TIMEOUT: 15000,

  PAGINATION_PER_PAGE: 9,
};
