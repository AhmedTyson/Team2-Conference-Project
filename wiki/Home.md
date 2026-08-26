# Itinera — Project Wiki

> **Global Luxury Travel & Trip Planning Platform** · Laravel REST API + Vanilla JS frontend, one monorepo, two Railway services.
>
> This folder is the project's documentation home. The former `docs/` and `fullstack/Backend/docs/` folders were migrated here.

## Quick Facts

| | |
|---|---|
| **Backend** | Laravel 12 (PHP 8.2+) · JWT auth · MySQL · Redis · PayMob · Groq AI |
| **Frontend** | Vanilla HTML5/CSS3/JS · GSAP 3.12 · no build step |
| **API surface** | 213 `api/*` routes (222 total, 237 registrations) |
| **Database** | 44 migrations · 34 seeders |
| **Tests** | 52 test classes (Pint + PHPUnit CI) |
| **Frontend** | ~35 pages · 33 JS modules |

## Start Here

- [System Overview](./System%20Overview.md) — what Itinera is, monorepo layout, capability map
- [Getting Started Guide](./Getting%20Started%20Guide.md) — local setup, seeding, first run
- [Development Guidelines](./Development%20Guidelines.md) — conventions, workflows, quality gates

## Architecture

- [Architecture Overview](./Architecture.md) — how the layers fit together
- [Technology Stack & Architecture](./Technology%20Stack%20%26%20Architecture.md) — versions, choices, rationale
- [Backend Services](./Backend%20Services.md) — service/controller internals
- [Frontend Application](./Frontend%20Application.md) — UI structure and modules

## Operations & Reference

- [Infrastructure](./Infrastructure.md) — Docker dual-role image, Railway, CI
- [API Reference](./API%20Reference.md) — endpoint catalogue (narrative)
- [API Endpoints Reference](./API%20Endpoints%20Reference.md) — curated 120-endpoint markdown reference
- [Routes Appendix](./ROUTES-APPENDIX.md) — full 213 deployed `api/*` routes
- [Routes Registrations Appendix](./ROUTES-REGISTRATIONS-APPENDIX.md) — 237 raw `Route::` registrations
- [Deployment Guide](./DEPLOYMENT.md) — Railway deployment walkthrough
- [Environment Configuration](./ENVIRONMENT.md) — all env vars explained
- [Release Sign-off](./RELEASE_SIGN_OFF.md) — production readiness checklist

## Audits (historical record)

- [Frontend Audit Report](./Frontend%20Audit%20Report.md) — 10-phase audit + remediation roadmap
- [Fullstack Unification Audit](./Fullstack%20Unification%20Audit.md) — contract & consistency audit

## Knowledge Map

```text
System Overview
├── Getting Started Guide ──── Development Guidelines
├── Architecture ──┬── Technology Stack & Architecture ──── Infrastructure
│                  └── Backend Services ──────── API Reference
└── Frontend Application ──────── API Reference

API Reference ─── API Endpoints Reference ─── ROUTES appendices
```

## Migration Notes

| Removed from repo | Now lives here |
|---|---|
| `docs/frontend-audit/*` (10 phases) | Merged into [Frontend Audit Report](./Frontend%20Audit%20Report.md) |
| `docs/frontend-complete-audit-report.md` | [Frontend Audit Report](./Frontend%20Audit%20Report.md) |
| `docs/fullstack-unification-audit.md` | [Fullstack Unification Audit](./Fullstack%20Unification%20Audit.md) |
| `fullstack/Backend/docs/API-Reference.md` | [API Endpoints Reference](./API%20Endpoints%20Reference.md) |
| `fullstack/Backend/docs/ROUTES-*.md` | [Routes appendices](#operations--reference) |
| `fullstack/Backend/docs/DEPLOYMENT.md` | [Deployment Guide](./DEPLOYMENT.md) |
| `fullstack/Backend/docs/ENVIRONMENT.md` | [Environment Configuration](./ENVIRONMENT.md) |
| `fullstack/Backend/docs/RELEASE_SIGN_OFF.md` | [Release Sign-off](./RELEASE_SIGN_OFF.md) |

Phase-by-phase working notes, one-off plans, and scratch audits from `Backend/docs` (11-8 plan phases, payment plans, investigation notes) were working artifacts and were intentionally not migrated.

## Repository

- **Code:** <https://github.com/AhmedTyson/Team2-Conference-Project>
- **Branch:** `main`
