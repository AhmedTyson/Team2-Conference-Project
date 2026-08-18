# ✈️ Itinera — Global Luxury Travel & Trip Planning Platform
> **Conference Case Study 1 — Team 2 Fullstack Application Monorepo**

[![Laravel](https://img.shields.io/badge/Laravel-12.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![PHP](https://img.shields.io/badge/PHP-8.2%2B-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://php.net)
[![JWT Auth](https://img.shields.io/badge/Auth-JWT-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white)](https://jwt.io)
[![GSAP](https://img.shields.io/badge/Animations-GSAP_3.12-88CE02?style=for-the-badge&logo=greensock&logoColor=white)](https://greensock.com)
[![PayMob](https://img.shields.io/badge/Payments-PayMob-0052CC?style=for-the-badge)](https://paymob.com)
[![Groq AI](https://img.shields.io/badge/AI-Groq_Llama3-F34B21?style=for-the-badge)](https://groq.com)

Welcome to the **Conference Case Study 1 (Team 2)** project repository! **Itinera** is an end-to-end luxury travel orchestration platform featuring curated itineraries, verified 5-star accommodations, real-time global weather radar, automated executive telemetry PDF reporting, AI-powered itinerary reviews, PayMob payment checkout, and an operator admin suite.

---

## 📁 Monorepo Structure

```text
Team2-Conference-Project/
├── fullstack/
│   ├── Backend/      # Laravel 12 RESTful API (PHP 8.2+, JWT, MySQL, Redis, PayMob, Groq AI)
│   └── Frontend/     # Vanilla JS Luxury Boarding-Pass Web App (HTML5, GSAP 3.12, Tailwind, CSS3)
└── README.md         # Master Repository Documentation
```

---

## ✨ Key Features & Highlights

### 🎨 Frontend (`fullstack/Frontend`)
- **Luxury Boarding-Pass Aesthetic**: Custom onyx glassmorphism design system (`tokens.css`, `public.css`, `admin.css`).
- **GSAP 3.12 Animations**: Staggered hero entrance timelines, interactive 3D tilt micro-interactions on cards, and animated KPI counter roll-ups.
- **Carousel-Driven Live Weather Radar**: Real-time temperature (°C/°F), condition badges, and wind metrics for 17+ travel capitals powered by Open-Meteo integration.
- **4K Ultra-Res Media**: Visual photography for destinations including Maldives, Swiss Alps, Santorini, Paris, Tokyo, and Cairo.
- **Unified Global Branding**: Official `logo.png` mark integrated into favicon synchronizer, topbar navigation, email templates, and PDF exports.
- **Operator Admin Suite**: 10+ dedicated management dashboards (Users, Trips, Reviews, Analytics, CRUD catalog, Settings).

### ⚙️ Backend (`fullstack/Backend`)
- **Laravel 12 API Architecture**: REST API with 120+ endpoints, OpenAPI interactive documentation (`/docs/api`), and Postman collection.
- **JWT & Spatie RBAC**: Secure JWT Bearer authentication with refresh rotation and role permissions (`super_admin`, `admin`, `user`).
- **PayMob Payments**: Hosted checkout integration with HMAC SHA-512 webhook signature verification.
- **AI Concierge & Itinerary Review**: Groq LLM integration providing automated feedback on travel itineraries.
- **Executive Telemetry Reports**: Dynamic PDF generation (`DomPDF`) and spreadsheet exports (`OpenSpout`) with automatic "All Time" default filtering.
- **Seeded Datasets**: Pre-seeded telemetry data containing 60+ paid orders, 60 payments, mapped hotels, restaurants, destinations, and test users.

---

## 🚀 Quick Start Guide

### 1. Backend Setup (`fullstack/Backend/`)

```bash
# 1. Navigate to backend directory
cd fullstack/Backend

# 2. Install PHP dependencies
composer install

# 3. Environment configuration
copy .env.example .env    # On Windows (or 'cp .env.example .env' on Linux/macOS)

# 4. Generate keys & linked storage
php artisan key:generate
php artisan jwt:secret --force
php artisan storage:link

# 5. Run database migrations & telemetry seeders
php artisan migrate:fresh --seed

# 6. Install frontend asset builder (Vite)
npm install
npm run build

# 7. Start backend development server (http://127.0.0.1:8000)
php artisan serve
```

* **Backend Base API URL:** `http://127.0.0.1:8000/api`
* **Live Interactive OpenAPI Docs:** `http://127.0.0.1:8000/docs/api`

---

### 2. Frontend Setup (`fullstack/Frontend/`)

```bash
# 1. Navigate to frontend directory
cd fullstack/Frontend

# 2. Serve static application (Port 8080)
python -m http.server 8080
# or
php -S 127.0.0.1:8080
```

* **Landing Page:** Open `http://localhost:8080/index.html` in your browser.
* **Admin Suite:** Open `http://localhost:8080/admin/index.html`.
* **Login Creds (Default Admin):** `admin@threedos.com` / `password`.

---

## 🧪 Testing & Verification

Run the PHPUnit backend test suite to verify core functionality (reports, auth, checkout, catalog):

```bash
cd fullstack/Backend

# Run ReportTest suite
php artisan test --filter=ReportTest

# Run all feature & unit tests
php artisan test
```

---

## 📚 Technical Documentation Sitemap

- 📄 **API Endpoint Reference:** [`fullstack/Backend/docs/Conference-API-Documentation.md`](fullstack/Backend/docs/Conference-API-Documentation.md)
- 📄 **Branded PDF API Guide:** [`fullstack/Backend/docs/Conference-API-Documentation.pdf`](fullstack/Backend/docs/Conference-API-Documentation.pdf)
- 📄 **Permissions Audit Matrix:** [`fullstack/Backend/docs/ROUTES-PERMISSIONS-AUDIT.md`](fullstack/Backend/docs/ROUTES-PERMISSIONS-AUDIT.md)
- 📄 **Deployment Guide:** [`fullstack/Backend/docs/DEPLOYMENT.md`](fullstack/Backend/docs/DEPLOYMENT.md)
- 📄 **Environment Configuration:** [`fullstack/Backend/docs/ENVIRONMENT.md`](fullstack/Backend/docs/ENVIRONMENT.md)
- 📄 **Frontend Details:** [`fullstack/Frontend/README.md`](fullstack/Frontend/README.md)
- 📄 **Backend Details:** [`fullstack/Backend/README.md`](fullstack/Backend/README.md)

---

## 📄 License

MIT — Internal Case Study Deliverable, Team 2.
