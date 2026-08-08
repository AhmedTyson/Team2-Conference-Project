# Deployment — Queue, Cache & Backup

## 1. Queue Worker (`GenerateReportJob` + notifications)

Report generation is async: `POST /v1/admin/reports/generate` returns `202` with a
`pending` report; the PDF is rendered by the queue worker. Poll progress via
`GET /me/reports`, then download when `status = completed`.

```bash
# Run one worker (dev)
php artisan queue:work --queue=default --tries=3 --timeout=300

# Production: supervisor keeps it alive
```

Supervisor config sample (`/etc/supervisor/conf.d/app-worker.conf`):

```ini
[program:app-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/app/artisan queue:work --sleep=3 --tries=3 --timeout=300
directory=/var/www/app
autostart=true
autorestart=true
numprocs=2
redirect_stderr=true
stdout_logfile=/var/log/app-worker.log
```

- `--timeout=300` must stay >= the job `$timeout` (dompdf uses >256M memory).
- Deploy flow: `php artisan config:cache` AFTER editing `.env`, then `php artisan
  queue:restart` so workers pick up new code.

## 2. Cache Driver: database → redis (scale-out)

Currently `CACHE_STORE=database` (shared table — correct for a single app
instance; survives multi-instance). To switch when you need faster reads:

1. `composer require predis/predis` (or enable php-redis).
2. `.env`:
   ```env
   CACHE_STORE=redis
   REDIS_CLIENT=predis
   REDIS_HOST=127.0.0.1
   REDIS_PORT=6379
   REDIS_PASSWORD=
   ```
3. `php artisan cache:clear` once (flush stale DB entries), then
   `php artisan config:cache`.

Key facts with `database` driver today: every `Cache::remember` key lives in the
`cache` table (`weather_*` 30 min, OSM place lookups 8–24 h, route 60 min,
AI-attractions 24 h). Failures are never cached. TTL-based expiry is fine at this
size; move to Redis when cache table exceeds ~100k rows.

## 3. Backup Policy

| Scope | What | Frequency | Retention |
|---|---|---|---|
| Database | `php artisan db:dump` (mysqldump via backup tool) | daily 03:00 | 14 days |
| Storage `public/reports/*` | generated PDFs | daily, after job queue drained | 14 days |
| Storage `public/uploads/*` (media) | user media | daily | 30 days |
| `.env` + config | secrets & params | on every change (commit via vault) | indefinite |

Sample cron (nightly 03:00):

```cron
0 3 * * * mysqldump --single-transaction -u $DB_USER -p$DB_PASS app > /backup/db_$(date +\%F).sql
0 4 * * * rsync -a /var/www/app/storage/app/public/reports/ /backup/reports_$(date +\%F)/
0 5 * * * find /backup -name "*.sql" -mtime +14 -delete -o -name "report*" -mtime +30 -delete
```

- Reports are immutable once written (`uniqid()` names) — offsite copy (S3/SFTP)
  is sufficient; no snapshotting needed.
- DR restore order: restore DB → restore `storage/app/public` → run
  `php artisan migrate` (playback any pending migrations after the dump time).

## 4. Env-driven site settings

`SettingsSeeder` reads from env instead of hardcoded values (Phase 9):

```env
SITE_FORK_PRICE_CENTS=50000      # trip fork price (EGP cents)
PLATFORM_COMMISSION_RATE=0.05    # platform booking commission rate
```

`php artisan db:seed --class=SettingsSeeder` re-syncs (idempotent
`updateOrCreate`).