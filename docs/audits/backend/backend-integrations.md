# Backend — External API / Integration Inventory

All integrations verified from actual call sites.

| Integration | Purpose | Provider | Files | Routes Using It | Timeout | Retry | Caching | Failure Handling |
|---|---|---|---|---|---|---|---|---|
| OpenStreetMap (Nominatim) | Geocode destination → lat/lng | nominatim.openstreetmap.org | OpenStreetService@getCoordinates | maps destination, GeocodeDestinationJob | explicit timeout (tested) | none | `osm:coords` cache | null → no coords / backfill job |
| OpenStreetMap (Overpass) | Nearby places (restaurant/lodging/attraction) | overpass-api | OpenStreetService@getNearbyPlaces | maps destination | — | none | `osm:places` (type+coords key) | [] on failure (destination without coords returns empty lists) |
| OSRM | Trip route directions w/ waypoints | router.project-osrm.org | OpenStreetService@getDirections | maps trip | — | none | none | 422 `not_enough_points` if <2 points; OSM outage → 500 surface risk |
| OpenStreetMap (Overpass + AI) | Attraction suggestions augmented by AI | Overpass + Groq | OpenStreetService@getAttractionsWithAI | maps destination | — | none | per-city cache | MapCacheTest: called once per city |
| Groq | AI chat completions (itinerary/enhance/review/concierge) | groq.com (groq-laravel SDK) | GroqService, ConciergeService | POST api/review (AI), concierge | — | none | 60-min Cache::remember (itinerary, key incl. params) | quota consume/restore; cache-hit no quota use |
| Open-Meteo | Current weather | open-meteo.com | OpenMeteoService@getWeather | GET api/weather | 5s | none | per-coord key, failures not cached | WeatherCacheTest: failure not cached |
| Paymob | Payment intentions + webhook verify | paymob (paymob/php-library + custom client) | PaymobGateway, PaymobClient (cURL) | checkout, POST api/v1/paymob/webhook, GET api/v1/paymob/callback | 30s/connect 5s | none | — | WebhookService lock + 24h grace; gateway error → fail envelope |
| Wikidata | Dynamic city fetch (SyncCities command) | wikidata.org | SyncCities command | CLI | — | none | — | — |
| RapidAPI | Hotels/flights (case-study requirement) | config/services.php hosts | **no verified call site** | — | — | — | — | NOT VERIFIABLE — keys only |
| OpenAI | Case-study AI | config OPENAI_API_KEY | **no verified call site** (Groq used instead) | — | — | — | — | UNUSED |
| Stripe | Payment gateway alternative | stripe | StripeGateway (stub) | not wired | — | — | — | Stub: fake secrets, verifyWebhook=true (LEGACY/UNUSED) |

## Config knock-on

- `config/services.php`: rapidapi (3 hosts), openai, open-meteo, osrm timeouts.
- `config/paymob.php`: public/secret/hmac/integration_ids + timeouts (30/5).
- `config/ai.php`: GROQ 500/day quota default.
- `.env.example`: PAYMOB_*, GROQ_API_KEY, OPENAI_API_KEY, SITE_FORK_PRICE_CENTS=50000, PLATFORM_COMMISSION_RATE=0.05.

## Findings

1. `getAttractionsWithAI` triggers 2 external calls (Overpass + AI) — no timeout/error guard on AI leg → 500 risk on Groq outage (covered partially by quota, not by try/catch).
2. OSRM/Overpass timeouts not explicit in all methods (only Nominatim tested).
3. No HTTP retry policy anywhere (`Http::retry` unused); failures degrade to empty results or error envelopes.