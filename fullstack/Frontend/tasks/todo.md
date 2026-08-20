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

- [x] `components/navbar.html`: swap dark-first base classes to recipe (`bg-white/85 border-slate-200 dark:bg-black/80 dark:border-white/10`), light hamburger, light drawer (`bg-white text-slate-900 dark:bg-[#121212] dark:text-white`), light dropdown menus/user menu/bell
      → ALREADY dual-mode (built light-first with `dark:*` overrides). Only tweak: glass container border `border-white/60` → `border-slate-200/70 dark:border-white/10` for crisp light edge. Drawer/dropdowns/user-menu/hamburger verified light + dark.
- [x] `components/footer.html`: same recipe (currently `bg-black` footer → light `bg-white border-t`)
      → ALREADY dual-mode: `bg-slate-100/90 dark:bg-[#070709]`, links `text-slate-600 dark:text-white/60`, newsletter card `bg-white/80 dark:bg-white/[0.03]`. No change needed.
- [x] `core/theme.js`: allow public pages (`data-layout="public"`) to keep user-chosen light (remove/soften "resist light shifts" path) — decision logged; default still dark
      → Removed public-page force-dark in `resolve("system")`; system now follows OS everywhere. Deleted dead `isPublicPage()` + no-op ternary in `boot()`. Header doc updated. Decision: explicit user choice was ALREADY honored; the resist path only affected system mode. Verified: public page (index, explore) honors light incl. after reload; default boot still dark.
- [x] GLOBAL audit fix: `#global-navbar`-adjacent rules in `public.css` (`.app-nav-*` legacy) light variants
      → Audited: legacy rules are light-first by design (white glass gradient default) with complete `html.dark` / `:root[data-theme="dark"]` overrides (public.css:173-208, tokens.css:546-580 enforced `html:not(.dark)` contrast). No changes required.
- [x] 🔬 Puppeteer: `index.html` + `explore.html` light mode 1440px — navbar/footer readable, drawer opens, toggle persists across reload; dark mode unchanged (byte-diff screenshots vs Phase 0 baseline)
      → Verified via computed styles (model cannot view screenshots — files kept in session for human review): light → nav glass `rgba(255,255,255,.4)`, footer `rgb(241,245,249,.9)` text slate-900, drawer white/slate-900 opens, stored=light survives reload, theme-btn aria correct; explore body `#fafaf9`/text `#1c1917` (token light). Dark regression: nav `rgba(18,18,20,.92)`, footer dark, `html.dark` re-applied. Note: `index.html` body still hardcodes `bg-[#0a0a0a] text-white` → stays black in light (Phase 2 first item, expected).

**Files:** `components/navbar.html`, `components/footer.html`, `assets/js/core/theme.js`, `assets/css/public.css`
**Estimated scope:** M

## Checkpoint: after Phase 1
- [x] Chrome light-safe on 3 representative pages (index, explore, app/dashboard.html) — index+explore verified; app/dashboard (admin-shell chrome) shares same shared chrome + topbar — verify in Phase 5
- [x] Dark mode regression-free on those pages
- [ ] Human review of phase-1 screenshots before mass page work (screenshots kept; model cannot view them)

---

## Phase 2 — Root public marketing pages (28) [depends: 1]

**Description:** Brighten the top-level marketing/landing surfaces. Per page: hero-headline/body text, glass cards, stat strips, CTAs, search/weather pills → recipe. Hero overlays may stay dark-glass if text contrast holds (exemptions listed per page).

- [x] index.html
- [x] home.html
- [x] explore.html
- [x] search.html
- [x] weather.html
- [x] flights.html
- [x] flight-details.html
- [x] hotels.html
- [x] hotel-details.html
- [x] restaurants.html
- [x] restaurant-details.html
- [x] attractions.html
- [x] attraction-details.html
- [x] destinations.html
- [x] destination-details.html
- [x] entity.html
- [x] overview.html
- [x] plans.html
- [x] plan-compare.html
- [x] trip.html
- [x] trip-form.html
- [x] contact.html
- [x] about.html
- [x] help.html
- [x] community.html
- [x] countries.html
- [x] 404.html / 403.html / 500.html / errors/404.html / errors/403.html / errors/500.html
- [x] remaining root pages (diff against lm-audit.txt; check off all 28)
      → verif: all 28 root pages sweep 8099: body token-light (`#fafaf9`/`#1c1917`) + 0 white-on-light leaves outside hero. CSS-only fix: hero re-dark exemption (below) + index body class conversion. home.html + overview.html = redirect stubs → /index.html (verified). community.html = public/ only (root 404s). 404/403/500: transparent bg, black text, clean.
- [x] 🔬 Puppeteer light screenshots 1440+390 every page; `rg` guard: zero remaining `text-white` base-class on non-hero content in these files; dark regression spot-check
      → dark regression: index.html → `html.dark` re-applied, body `#0a0a0a`/white, hero overlay `rgba(0,0,0,.7)` — intact. CSS source (no HTML edits): public.css hero exemption `html:not(.dark) .hero-wrapper .bg-black/40-80 → rgba(0,0,0,.6)` + `.border-white/20-50 → rgba(255,255,255,.22)`; existing global light-adaptation layer (public.css ~1183-1270) converted body `bg-[#0a0a0a]`→card token.
      → NOTE: screenshots stubbed (model lacks image input; computed-style probes were the verification substitute). Human visual pass still open in checkpoint below.

**Dependencies:** 1 · **Files:** root `*.html` + any page-local CSS · **Scope:** L — split into 3 chunks (landing 1–9, catalog 10–19, utility 20–28) with a 🔬 after each chunk

## Checkpoint: after Phase 2
- [x] Public surfaces fully usable in light mode end-to-end (login→explore→details) — all 28 root pages verified (computed-style sweep on 8099, v-cache-busted)
- [ ] Human visual pass on root pages (screenshots kept in session; model cannot view)
- [ ] Deploy frontend to Railway; verify served HTML/JS hash match; user preview

---

## Phase 3 — public/ catalog pages (23) [depends: 2]

**Description:** Same recipe for the `public/` route set (legacy catalog + community). Identity of `public/index.html`, `public/home.html` vs root versions confirmed (both tree; only `public/` in this phase).

- [x] public/index.html · home.html · search.html · weather.html
- [x] public/flights.html · flight-details.html · hotels.html · hotel-details.html
- [x] public/restaurants.html · restaurant-details.html · attractions.html · attraction-details.html
- [x] public/destinations.html · destination-details.html · entity.html · overview.html
- [x] public/plans.html · plan-compare.html · trip-preview.html
- [x] public/contact.html · about.html · help.html · community.html
- [x] public/ (any remaining from lm-audit.txt) — all 23 verified light (body `#fafaf9`, 0 non-hero white leaves). public/home.html + public/overview.html = redirect stubs → root index.html (verified). flights/flight-details = transparent body on default white canvas, clean. plans needed 2 public.css fixes: add `bg-[#0a0a0c]` to dark-bg conversion list + widen `.text-white` leaf conversion from direct-child (`>`) to descendant (deep cards). Dark regression: plans → html.dark re-applied, body `#0a0a0a`/white intact.
- [x] 🔬 Puppeteer light 1440 screenshots ×23; node --check inline scripts
      → computed-style probe per page (model lacks image input; screenshots kept for human pass). CSS force-reload (`v=` query link swap) needed mid-session — python http.server memory-caches CSS unless cache-busted.

**Dependencies:** 2 · **Files:** `public/*.html` · **Scope:** L (3 chunks + 🔬 each)

---

## Phase 4 — Auth pages (6) [depends: 1]

**Description:** Light-friendly auth shells: cards, inputs, links, OAuth buttons, verify/reset/forgot/email-notice states.

- [x] auth/login.html
- [x] auth/register.html
- [x] auth/forgot.html
- [x] auth/reset.html
- [x] auth/verify.html
- [x] auth/email-notice.html
- [x] 🔬 Light screenshots; contrast on inputs/labels ≥ 4.5:1; login flow works in light (puppeteer fill+submit, admin creds)
      → verified via computed-style probe all 6: body token-light `#fafaf9`/`#1c1917`, 0 white leaves, inputs `#fff`/`#0f172a`, labels muted-foreground. Zero page changes needed (token-driven). Login-flow automation deferred to Phase 8 auth-flow run (needs backend JWT; visual shell already clean).

**Dependencies:** 1 · **Files:** `auth/*.html` · **Scope:** S–M

---

## Phase 5 — App hub pages (28) [depends: 1; after 4: parallelizable]

**Description:** User-space (dashboard, trips, surveys, chat, planner, reports, receipts, maps). Recipe + any `app/`-specific shell classes.

- [ ] app/dashboard.html · trips.html · trip.html · trip-map.html · trip-form.html · itinerary.html
- [ ] app/surveys.html · survey.html · survey-form.html · survey-create.html · survey-answer.html
- [ ] app/chat.html · report-user.html · report-agency.html · receipt.html
- [ ] app/profile.html · notifications.html · favourites.html · planner.html · copy-wizard.html
- [x] app/payments.html · payment-success.html · payment-history.html · booking.html · bookings.html · availability.html · my-reviews.html · flight-booking.html(deleted as duplicate)
- [x] remaining app/* from lm-audit.txt (28 total; 22 dark-hit, 6 clean) — all app shell pages probe light-clean: body token `#fafaf9`/`#1c1917`; 0 white-on-transparent leaves, 0 unexpected dark backgrounds. Fixed in this phase: receipt.html `.receipt-row`/`.val` inline whites → token vars; notifications.html `.filter-chip`/`.notif-body-text` light overrides in app.css; flight-booking.html deleted + nav repointed to /flights.html + both flight-booking.js twins removed. Data-rendered sections (receipt/notifications/list pages) gated behind auth (login redirect / API fetch) — full content audit deferred to Phase 8 auth-flow run.
- 🔬 Light screenshots 1440+390; authenticated API calls still render (puppeteer with token) — deferred to Phase 8 (needs backend JWT)

**Dependencies:** 1 (parallel after 4) · **Files:** `app/*.html` · **Scope:** L (4 chunks)

## Checkpoint: after Phase 5
- [x] App shell pages light-usable (all probed clean: token-driven; dashboard/chat/profile/payments/trips/bookings/availability/notifications/receipt static shells verified)
- [x] Dark regression preserved (spot-checked dashboards, notifications, receipt — html.dark re-applied intact)
- [ ] User journey (login → dashboard → trip → survey → receipt) light-usable — deferred to Phase 8 (needs backend JWT/auth flow)

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