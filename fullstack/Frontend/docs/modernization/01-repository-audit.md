# 01 — Repository Audit

Audit date: 2026-08-19. Scope: `fullstack/Frontend` (116 static pages, zero build tooling). Read-only — no files modified.

## 1. Page inventory

| Area | Pages | Notes |
|---|---|---|
| `app/` (customer) | 28 | dashboard, trips, booking, chat, profile, planner, surveys… |
| Root (public static) | 28 | index, home, hotels, flights, search, destination… |
| `public/` | 23 | second copy of root pages + community, trip-preview |
| `admin/` | 19 | index, reports, users, flags, notifications… |
| `agency/` | 7 | index, earnings, inquiries, proposals, settings… |
| `auth/` | 6 | login, register, forgot, reset, verify, email-notice |
| `errors/` | 3 | 403, 404, 500 |
| `components/` | 2 | footer.html, navbar.html — **orphaned** (0 external references) |
| **Total** | **116** | |

Assessment claimed 118; repo now has 116. Two near-duplicate trees exist: root pages vs `public/` (same filenames: index, home, hotels, …). Drift risk flagged.

## 2. CSS inventory

**32 files / 13,942 lines across two parallel trees** (assessment said 17 files / ~12k — grew since):

| Tree | Files | Lines | Role |
|---|---|---|---|
| `assets/css/` | 20 | ~12,525 | current architecture: tokens.css (1,213) is the hub; app.css (1,468), admin.css (2,891), public.css (1,105), dashboard.css (905), planner.css (894), components.css (1,109), auth.css (716), base.css, layout.css, glass.css, loader.css, luxury-theme.css, pages.css, chat.css, common.css, overview.css |
| `css/` (legacy) | 11 | ~1,417 | app.css (748), catalog.css (377), chat.css (153), availability.css, index.css… duplicate namespaces with assets/css (e.g. `css/app.css` vs `assets/css/app.css`, 748 vs 1,468 lines) |
| top-level | 1 | — | 1-line `common.css` that only re-imports assets/css/common.css via @import — dead shim |

@import graph (CSS-side composition already exists):
- `tokens.css` ← admin, auth, app, common, dashboard, public
- `app.css` ← tokens + glass + loader
- `dashboard.css` ← tokens + planner + Google Fonts (direct @import — inconsistent)
- `tokens.css` itself imports Google Fonts (Plus Jakarta Sans / Inter / IBM Plex Mono)
- `admin.css` ← tokens + auth + loader

## 3. JS inventory

| Tree | Files | Lines | HTML references |
|---|---|---|---|
| `assets/js/` | 146 | 35,918 | 1,123 |
| `js/` (legacy flat) | 30+ | — | 293 |

Both trees are live and referenced — pages load a mix. Namespace architecture in `assets/js`: `core/` (session, config, navbar-component, footer-component, pagination…), `modules/`, `pages/`, `services/`, `utils/`, `components/` (ui.js).

Ledger/system facts (from prior audits, re-verified):
- Auth/session: `itinera_token` / `itinera_user` localStorage + legacy `tp_token` / `tp_user` keys — dual-state, legacy keys used by old pages.
- `config.js` API base is **injected at boot** by `entrypoint.sh` (`$PORT`), i.e. runtime env substitution — no build-time env.
- Footer: `core/footer-component.js` on 109 pages; navbar: `core/navbar-component.js` on root-level pages. All 66 inline `<footer` pages also load footer-component.js (JS fills `.app-footer`; inline markup is fallback/replaced).

## 4. Build & deployment

- **No package.json, no tailwind config, no bundler, no CI frontend build** in the frontend.
- Deployment: repo-root `Dockerfile` (`nginx:1.27-alpine`) → copies `fullstack/Frontend` → `nginx.conf` listens `$PORT` → Railway. Dockerfile comment: Railpack v0.22+ ignores subdirectory Dockerfiles.
- Cache busting: hand-written `?v=2` / `?v=3` query strings on CSS/JS links. No manifest.

## 5. External dependencies (CDN)

| Dependency | Source | Occurrences |
|---|---|---|
| Tailwind Play CDN (`cdn.tailwindcss.com`) | Cloudflare | **91 of 116 pages** |
| Font Awesome | cdnjs | 99 links, **three versions**: 6.0.0-beta3, 6.4.0, 6.5.1 |
| Google Fonts | fonts.googleapis | 114 link refs (preconnects + css2) |
| GSAP 3.12.5 | cdnjs **and** jsdelivr | 32 (dual-source, same version) |
| Leaflet 1.9.4 | unpkg | 6 (css+js) |
| Laravel Echo 1.16.1 + Pusher 8.3.0 | jsdelivr | chat pages |
| open-meteo API | runtime API | weather |
| **Alpine.js** | — | **not present** |

## 6. Dynamic Tailwind classes

- Template-literal HTML in JS uses **full literal Tailwind classes** (e.g. `bg-amber-500/20` in notifications.js) — statically scannable.
- One runtime-composed value: `notif-icon-box ${cat.class}` where `cat.class ∈ {payment, booking, ai, alert, system}` — **semantic CSS hook, not a Tailwind class**; no built rule exists for `.notif-icon-box*` in any CSS file (dead coupling today, harmless for scanning).
- No `bg-${var}` / `text-${color}` composition patterns found in `assets/js`. Legacy `js/` tree not yet scanned (Phase 2 task).

## 7. Known dead/orphan code (for later phases, not action now)

- `components/footer.html`, `components/navbar.html`: 0 references.
- `css/common.css` (1-line import shim).
- `.notif-card` / `.notif-icon-box`: no CSS rules exist.
- Root-vs-public page duplication: 23 public/ pages mirror root pages.
- `branc-assets/`, `scratch/`: excluded from inventory above (non-shipping dirs — verify exclusion before Phase 2 scan).