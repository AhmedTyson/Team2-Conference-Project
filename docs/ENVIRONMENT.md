# Environment Variables Reference

Full list of parameters consumed by the app. Values set via `.env`
(never committed — only `.env.example` is).

## App

| Key | Default | Purpose |
|---|---|---|
| `APP_NAME` | TravelMate | App display name |
| `APP_ENV` | `production` | Laravel env (CI sets `testing`-style config via phpunit.xml) |
| `APP_KEY` | — | cipher key (`php artisan key:generate`) |
| `APP_DEBUG` | `false` | Error verbosity |
| `APP_URL` | — | Base URL |
| `APP_LOCALE` | `en` | Default locale |
| `APP_TIMEZONE` | `Africa/Cairo` | Service timezone |
| `APP_MAINTENANCE_DRIVER` | `file` | Maintenance mode driver |
| `APP_MAINTENANCE_STORE` | `database` | Maintenance store |

## DB

| Key | Default | Purpose |
|---|---|---|
| `DB_CONNECTION` | `mysql` | SQLite in tests (`phpunit.xml`) |
| `DB_HOST` | `127.0.0.1` | Host |
| `DB_PORT` | `3306` | Port |
| `DB_DATABASE` | — | Schema |
| `DB_USERNAME` | — | User |
| `DB_PASSWORD` | — | Password |
| `DB_QUEUE_CONNECTION` / `DB_QUEUE` | — | Only if QUEUE uses DB |

## Cache / Session / Queue

| Key | Default | Purpose |
|---|---|---|
| `CACHE_STORE` | `database` | Distributed cache keys (see docs/DEPLOYMENT.md for redis switch) |
| `CACHE_PREFIX` | — | Key namespace |
| `SESSION_DRIVER` | `database` | Session store |
| `SESSION_LIFETIME` | `120` | Minutes |
| `QUEUE_CONNECTION` | `database` | Worker driver (`sync` in tests) |
| `BROADCAST_CONNECTION` | `log` | Broadcast driver |

## OAuth / Auth

| Key | Default | Purpose |
|---|---|---|
| `PASSPORT_CLIENT_ID` | — | Password-grant client for API auth |
| `PASSPORT_CLIENT_SECRET` | — | Client secret |
| `PASSPORT_CLIENT_ID2` | — | Secondary client (multi-tenant legacy) |
| `PASSPORT_CLIENT_SECRET2` | — | Secondary secret |
| `DATA_SOURCE_API_KEY` | — | External data source key |

## Payments (Paymob)

| Key | Default | Purpose |
|---|---|---|
| `PAYMOB_API_KEY` | — | Integration auth |
| `PAYMOB_INTEGRATION_ID` | — | Integration for card payment |
| `PAYMOB_CARD_NUMBER` | — | Integration card number |
| `PAYMOB_WALLET_NUMBER` | — | Integration wallet number |
| `PAYMOB_OTHER_NUMBER` | — | Other payment integration |
| `PAYMOB_HMAC_SECRET` | — | Webhook HMAC verify + order hash |

## External APIs

| Key | Default | Purpose |
|---|---|---|
| `GROQ_API_KEY` | — | AI itinerary generation |
| `OPENWEATHER_API_KEY` | — | Weather forecast |
| `OPENWEATHER_UNITS` | `metric` | Temperature units |
| `OSM_NOMINATIM_USER_AGENT` | TravelMate | Geocoding user-agent |
| `AI_ATTRACTIONS_HOST` | — | AI destination attractions source |
| `AI_ATTRACTIONS_KEY` | — | AI attractions API key |
| `MAIL_*` | — | SMTP transport (`MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`) |

## Phase 9 — Site Settings (env-driven seed)

| Key | Default | Purpose |
|---|---|---|
| `SITE_FORK_PRICE_CENTS` | `50000` | Trip fork price (EGP cents) — SettingsSeeder |
| `PLATFORM_COMMISSION_RATE` | `0.05` | Platform booking commission rate — SettingsSeeder |

> Sequencing: `cp .env.example .env && php artisan key:generate && php artisan
> migrate --seed`. Run `php artisan config:cache` after finalizing `.env` on deploy.