# Plan — Light Mode Refinement (All Pages, Phase per Page Group)

## Spec

Refine light mode across every page. Implementation is phased; each page group is its own phase. Pages must be navigable and usable in light mode, not just "not invisible".

## Current state (audit findings)

- Theme engine: `assets/js/core/theme.js` — canonical. `html.dark` class + `data-theme` attr + `localStorage["itinera_theme"]`. **Default = dark.** Public pages carry `data-layout="public"` and "resist light shifts".
- Tailwind CDN with `darkMode: 'class'` → all `dark:*` variants keyed off `html.dark`. **Light styles must be written as base classes (no prefix), dark as `dark:*` overrides.**
- Pages are dark-first: `bg-black/60`, `bg-white/30`, `text-white`, `border-white/20` used as base classes. In light mode these render white-on-white / near-invisible text and washed-out glass cards.
- `assets/css/public.css` holds legacy nav/brand rules (`.app-nav-link` etc.) plus token usage `hsl(var(--background))`. **Phase 0 finding:** the light token layer ALREADY EXISTS fully-formed in `assets/css/tokens.css` — `:root` = warm-stone/alabaster light set, `:root[data-theme="dark"]` = obsidian overrides. tokens.css is imported by public.css + auth.css + admin.css → token layer is global. No new token work needed.
- **Phase 0 finding:** `assets/css/tokens.css` now carries the shared recipe classes `.lm-card .lm-btn .lm-btn--ghost .lm-btn--accent .lm-input .lm-muted .lm-chip .lm-chip--gold` (theme-agnostic). Pages swap dark-first base classes for these during phases 1–7.
- **Phase 0 audit (lm-audit.txt):** 50/104 pages carry literal dark-first classes (`bg-black|text-white|bg-zinc-950|bg-gray-950|bg-[#0a0a0a]`): root 17, `public/` 11, `app/` 22. auth/admin/agency = 0 literals (token-driven). `admin.css` = 74 hex hardcodes → Phase 6 target. `index.html` body hardcodes `bg-[#0a0a0a] text-white` → Phase 2 first item.
- Live deployment: `itiner3a` — verify against `https://itinera.up.railway.app` after each phase.

## Architecture / dependency graph

```
Phase 0 tokens+CSS foundation (tokens.css light layer CONFIRMED; .lm-* recipe classes added; audit written)
  └── Phase 1 shared chrome (theme.js public-page light path, navbar, footer)
        └── Phase 2 root public pages (28)
              └── Phase 3 public/ catalog pages (23)
                    └── Phase 4 auth pages (6)
                          ├── Phase 5 app hub pages (28)
                          ├── Phase 6 admin pages (19)
                          └── Phase 7 agency pages (7)
                                └── Phase 8 verification sweep + regression
```

- Phases 5–7 depend only on 0–1 chrome (parallelizable after Phase 4).
- Verification checkpoint after Phase 2 (public surfaces) and after Phase 8 (full).

## Conventions to apply (the "light-mode recipe")

Per element, normalize to:
`bg-white dark:bg-...` | `text-slate-900 dark:text-white` (or slate-800/95)
`bg-white/70 backdrop-blur dark:bg-black/60` for glass cards
`border-slate-200 dark:border-white/15`
`text-slate-500 dark:text-white/60` for muted text
`bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15` for buttons/pills
Keep accent (amber) as-is; it works in both modes.
Sticky/hero overlays may keep dark glass in both modes ONLY if text stays readable (hero cards exempt; document exemptions in todo).

## Verification

- `node --check` each touched page-inline script (pages are vanilla; also re-run full JS sweep from the deploy pass)
- Puppeteer: light mode screenshot pass at 1440×900 and 390×844 for every page of every phase (toggle via `ItTheme.set("light")`, reload, shot)
- Contrast: key text (body, nav labels, buttons) ≥ 4.5:1 in light mode
- Theme persistence: toggle → reload → mode held; public pages follow user choice after this pass (see Phase 1 decision)
- Deploy to Railway frontend service after Phase 2 and Phase 8; hash-check served assets (cache policy now `max-age=3600, must-revalidate` + html no-cache — stale-proof)

## Risks

- 104+ pages, hand-editing scope creep → keep per-page edits to the recipe only; no layout refactors in this pass
- `public.min.css`-style duplicate sheets (none found; `css/components/navbar.css` was dead and already removed)
- Overscope: changing default theme to light for everyone → NO. Default stays dark; light is opt-in per user until client signs off