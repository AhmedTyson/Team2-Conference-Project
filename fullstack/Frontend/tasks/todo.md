# Todo — Light Mode Refinement (LM-01)

Spec + conventions + phase dependency graph: `tasks/plan.md`.
Goal: every page usable in light mode. One phase per page group. Default theme stays **dark**; light is opt-in (user preference) — no product-wide flip without sign-off.
Scans: ✅ = checklist item · 🔬 = verification run at end of each phase.

---

## Phase 0 — Light-mode foundation (tokens + shared CSS) [depends: none]

**Description:** Materialize light token layer in `assets/css/public.css`, add shared utility classes used by the page recipe, audit current hardcoded dark-first classes.

- [x] Define `:root` (light) token block: `--background`, `--foreground`, `--muted-foreground`, `--border`, `--card`, `--card-foreground` (hsl) aligned with existing `html.dark` overrides
      → ALREADY PRESENT in `assets/css/tokens.css` (`:root` = full warm-stone light set; `:root[data-theme="dark"]` = obsidian overrides). Home: tokens.css, imported by public.css + auth.css + admin.css.
- [x] Add shared recipe classes: `.lm-card`, `.lm-btn`, `.lm-input`, `.lm-muted`, `.lm-chip` (bg-white/slate-900 + `dark:` overrides), keep amber accent untouched
      → Done in tokens.css end (~line 1369): `.lm-card .lm-btn .lm-btn--ghost .lm-btn--accent .lm-input .lm-muted .lm-chip .lm-chip--gold`. Theme-agnostic (token-driven, works both modes). Recipe targets pages via phases 1–7.
- [x] Audit pass: `rg "bg-black/|text-white|border-white/" *.html …` → export per-page hit list (`tasks/lm-audit.txt`) as the phase scope source
      → 50/104 pages carry literal dark classes: root 17, public/ 11, app 22. auth 0, admin 0, agency 0 (token-driven). admin.css holds 74 hex hardcodes (Phase 6). Full per-file counts in `tasks/lm-audit.txt`.
- [x] Confirm no duplicate/competing theme layers (only `core/theme.js` + tailwind CDN)
      → Confirmed single engine. Note: index.html body hardcodes `bg-[#0a0a0a] text-white` (Phase 2 top item).
- [x] 🔬 `node --check` all touched CSS-adjacent JS (theme.js); build-less (static) — visual check on `index.html` light toggle (Phase 1 puppeteer)

**Files:** `assets/css/public.css`, `tasks/lm-audit.txt`
**Estimated scope:** M

---

## Phase 1 — Shared chrome (navbar, footer, theme engine) [depends: 0]

**Description:** Make persistent chrome light-safe so every phase inherits it: navbar, footer, mobile drawer, theme engine behavior on public pages.

- [ ] `components/navbar.html`: swap dark-first base classes to recipe (`bg-white/85 border-slate-200 dark:bg-black/80 dark:border-white/10`), light hamburger, light drawer (`bg-white text-slate-900 dark:bg-[#121212] dark:text-white`), light dropdown menus/user menu/bell
- [ ] `components/footer.html`: same recipe (currently `bg-black` footer → light `bg-white border-t`)
- [ ] `core/theme.js`: allow public pages (`data-layout="public"`) to keep user-chosen light (remove/soften "resist light shifts" path) — decision logged; default still dark
- [ ] GLOBAL audit fix: `#global-navbar`-adjacent rules in `public.css` (`.app-nav-*` legacy) light variants
- 🔬 Puppeteer: `index.html` + `explore.html` light mode 1440px — navbar/footer readable, drawer opens, toggle persists across reload; dark mode unchanged (byte-diff screenshots vs Phase 0 baseline)

**Files:** `components/navbar.html`, `components/footer.html`, `assets/js/core/theme.js`, `assets/css/public.css`
**Estimated scope:** M

## Checkpoint: after Phase 1
- [ ] Chrome light-safe on 3 representative pages (index, explore, app/dashboard.html)
- [ ] Dark mode regression-free on those pages
- [ ] Human review before mass page work

---

## Phase 2 — Root public marketing pages (28) [depends: 1]

**Description:** Brighten the top-level marketing/landing surfaces. Per page: hero-headline/body text, glass cards, stat strips, CTAs, search/weather pills → recipe. Hero overlays may stay dark-glass if text contrast holds (exemptions listed per page).

- [ ] index.html
- [ ] home.html
- [ ] explore.html
- [ ] search.html
- [ ] weather.html
- [ ] flights.html
- [ ] flight-details.html
- [ ] hotels.html
- [ ] hotel-details.html
- [ ] restaurants.html
- [ ] restaurant-details.html
- [ ] attractions.html
- [ ] attraction-details.html
- [ ] destinations.html
- [ ] destination-details.html
- [ ] entity.html
- [ ] overview.html
- [ ] plans.html
- [ ] plan-compare.html
- [ ] trip.html
- [ ] trip-form.html
- [ ] contact.html
- [ ] about.html
- [ ] help.html
- [ ] community.html
- [ ] countries.html
- [ ] 404.html / 403.html / 500.html / errors/404.html / errors/403.html / errors/500.html
- [ ] remaining root pages (diff against tm-audit.txt; check off all 28)
- 🔬 Puppeteer light screenshots 1440+390 every page; `rg` guard: zero remaining `text-white` base-class on non-hero content in these files; dark regression spot-check

**Dependencies:** 1 · **Files:** root `*.html` + any page-local CSS · **Scope:** L — split into 3 chunks (landing 1–9, catalog 10–19, utility 20–28) with a 🔬 after each chunk

## Checkpoint: after Phase 2
- [ ] Public surfaces fully usable in light mode end-to-end (login→explore→details)
- [ ] Deploy frontend to Railway; verify served HTML/JS hash match; user preview

---

## Phase 3 — public/ catalog pages (23) [depends: 2]

**Description:** Same recipe for the `public/` route set (legacy catalog + community). Identity of `public/index.html`, `public/home.html` vs root versions confirmed (both tree; only `public/` in this phase).

- [ ] public/index.html · home.html · search.html · weather.html
- [ ] public/flights.html · flight-details.html · hotels.html · hotel-details.html
- [ ] public/restaurants.html · restaurant-details.html · attractions.html · attraction-details.html
- [ ] public/destinations.html · destination-details.html · entity.html · overview.html
- [ ] public/plans.html · plan-compare.html · trip-preview.html
- [ ] public/contact.html · about.html · help.html · community.html
- [ ] public/ (any remaining from lm-audit.txt)
- 🔬 Puppeteer light 1440 screenshots ×23; node --check inline scripts

**Dependencies:** 2 · **Files:** `public/*.html` · **Scope:** L (3 chunks + 🔬 each)

---

## Phase 4 — Auth pages (6) [depends: 1]

**Description:** Light-friendly auth shells: cards, inputs, links, OAuth buttons, verify/reset/forgot/email-notice states.

- [ ] auth/login.html
- [ ] auth/register.html
- [ ] auth/forgot.html
- [ ] auth/reset.html
- [ ] auth/verify.html
- [ ] auth/email-notice.html
- 🔬 Light screenshots; contrast on inputs/labels ≥ 4.5:1; login flow works in light (puppeteer fill+submit, admin creds)

**Dependencies:** 1 · **Files:** `auth/*.html` · **Scope:** S–M

---

## Phase 5 — App hub pages (28) [depends: 1; after 4: parallelizable]

**Description:** User-space (dashboard, trips, surveys, chat, planner, reports, receipts, maps). Recipe + any `app/`-specific shell classes.

- [ ] app/dashboard.html · trips.html · trip.html · trip-map.html · trip-form.html · itinerary.html
- [ ] app/surveys.html · survey.html · survey-form.html · survey-create.html · survey-answer.html
- [ ] app/chat.html · report-user.html · report-agency.html · receipt.html
- [ ] app/profile.html · notifications.html · favourites.html · planner.html · copy-wizard.html
- [ ] app/payments.html · payment-success.html · payment-history.html · booking.html · bookings.html · availability.html · flight-booking.html · my-reviews.html
- [ ] remaining app/* from lm-audit.txt (28 total; 22 dark-hit, 6 clean)
- 🔬 Light screenshots 1440+390; authenticated API calls still render (puppeteer with token)

**Dependencies:** 1 (parallel after 4) · **Files:** `app/*.html` · **Scope:** L (4 chunks)

## Checkpoint: after Phase 5
- [ ] User journey (login → dashboard → trip → survey → receipt) light-usable
- [ ] Dark regression preserved

---

## Phase 6 — Admin pages (19) [depends: 1; after 4: parallelizable]

**Description:** Departure Control shell: sidebar (minimized rail icon tooltips), topbar, tables, filters, details drawers, analytics charts.

- [ ] admin/index.html · users.html · user-details.html · trips.html · hotels.html · flights.html
- [ ] admin/restaurants.html · attractions.html · destinations.html · countries.html · categories.html
- [ ] admin/reviews.html · flags.html · contacts.html · reports.html · analytics.html
- [ ] admin/notifications.html · settings.html · agency-requests.html
- 🔬 Light screenshots 1440; table row contrast; sidebar + collapsed rail light styles

**Dependencies:** 1 (parallel after 4) · **Files:** `admin/*.html` + shell CSS · **Scope:** L (3 chunks)

---

## Phase 7 — Agency pages (7) [depends: 1; after 4: parallelizable]

**Description:** Agency portal light pass.

- [ ] agency/assignments.html · create-trip.html · proposals.html · inquiries.html · earnings.html · settings.html · index.html
- 🔬 Light screenshots; earnings/table contrast

**Dependencies:** 1 (parallel after 4) · **Files:** `agency/*.html` · **Scope:** S–M

---

## Phase 8 — Verification sweep + regression [depends: 2,4,5,6,7]

**Description:** Full-matrix regression: every page × light/dark × 1440/390, jwt flows, deploy, hash-check.

- [ ] Full page matrix: 104+ pages × {light, dark} × {1440, 390} puppeteer screenshots to `tasks/lm-regression/`
- [ ] `node --check` sweep across ALL assets/js (regression from earlier deploy pass — stays zero failures)
- [ ] Contrast audit: body/nav/button text ≥ 4.5:1 light mode (page scan, exemptions listed in plan.md)
- [ ] Auth flows in light: login, register, admin dashboard, agency app
- [ ] Theme persistence + default-dark preserved; public pages honor chosen mode
- [ ] Deploy frontend to Railway (`a7aef08b`-era cache policy already stale-proof); byte-hash served assets vs git
- [ ] Update `tasks/plan.md` with outcome notes; close any open exemptions

**Dependencies:** 2, 4, 5, 6, 7 · **Scope:** XL → split: sweep-a (public+auth), sweep-b (app+admin+agency), each its own 🔬

---

## Notes
- lm-audit.txt: generated in Phase 0; commit it — it doubles as the "every page contains a phase" checklist source of truth
- If a page is missing from this list, it must be added from lm-audit.txt before closing its phase — the audit is authoritative
- Exempt: hero overlays (dark glass both modes) where text contrast otherwise breaks — record per-page in lm-audit.txt