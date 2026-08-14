# Phase 9 — Dead Code, Duplication & Maintainability Audit

> **Audit Type**: Code Quality, Dead Code Classification & Duplication Audit  
> **Date**: 2026-08-14  
> **Auditor**: Antigravity AI  
> **Status**: Verified

---

## 1. Dead Code & Duplication Classification Table

| Candidate Path | Type | Current Status | Classification | Evidence / Rational |
| :--- | :---: | :---: | :---: | :--- |
| `Frontend/Home Page final.html` | HTML | Unlinked | **SAFE TO REMOVE** | Experimental staging copy of the homepage; completely superseded by `index.html`. |
| `Frontend/app/report-agency.html` | HTML | Unlinked | **SAFE TO REMOVE** | Legacy complaint wireframe; reporting and tickets are handled via `admin/reports.html` and support contact channels. |
| `Frontend/app/copy-wizard.html` | HTML | Standalone | **REVIEW REQUIRED** | Wizard prototype; core itinerary workflow lives in canonical `app/trip-form.html`. |
| `Frontend/app/availability.html` | HTML | Standalone | **REVIEW REQUIRED** | Standalone hotel room booking mockup; booking actions route to partner URLs or `checkout.html`. |
| `Frontend/login.html`, `register.html`, etc. | HTML | Active Alias | **KEEP** | Root-level mirror aliases that prevent 404s on flat web hosting environments where `/auth/login.html` is accessed directly. |
| `Frontend/js/` (legacy directory) | JS Tree | Active / Duplicated | **REVIEW REQUIRED** | Legacy directory containing parallel implementations of `api.js` and `plans-core.js`. Canonical versions live in `assets/js/`. |
| `Frontend/css/` (legacy directory) | CSS Tree| Active / Duplicated | **REVIEW REQUIRED** | Legacy CSS classes (`app.css`, `catalog.css`) that duplicate tokens now unified in `assets/css/tokens.css`. |

---

## 2. Code Duplication & Overlap Analysis

### A. API Wrapper Duplication
- **`assets/js/core/api.js`** vs **`js/api.js`**:
  - `assets/js/core/api.js` is the canonical modern API wrapper featuring automatic 401 refresh queuing, multi-tab sync, and response unwrapping.
  - `js/api.js` is a legacy fallback wrapper.
  - *Recommendation*: Deprecate `js/api.js` in a future cleanup phase after verifying all legacy imports point to `assets/js/api.js`.

### B. Navigation & Header Duplication
- Prior to theme unification, each page maintained custom inline header markup.
- With the deployment of `assets/js/core/topbar.js`, topbar controls (theme toggle, notification bell, user chip, command palette trigger) are injected uniformly, making individual topbar-right HTML blocks redundant.

---

## 3. Maintainability Rating & Assessment

| Dimension | Rating | Observations |
| :--- | :---: | :--- |
| **Modularity** | **8.5 / 10** | Core platform services are cleanly decoupled into standalone, single-responsibility modules in `assets/js/core/`. |
| **Extensibility**| **9.0 / 10** | Adding a new catalog entity or admin workspace requires only standard HTML markup and binding to `Itinari.apiGet`. |
| **Token Discipline**| **9.5 / 10** | CSS custom properties in `tokens.css` govern all visual themes with zero arbitrary hardcoded colors in core components. |
| **Script Hygiene**| **8.5 / 10** | All scripts pass `node --check` syntax validation with zero errors. |
