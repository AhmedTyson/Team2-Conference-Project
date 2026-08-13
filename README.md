# Conference Platform — Team 2 (Fullstack Monorepo)

Welcome to the **Conference Case Study 1 (Team 2)** project repository! This repository contains the complete fullstack application, organized into isolated frontend and backend projects under the `fullstack/` directory.

---

## 📁 Repository Structure

```text
repository-root/
└── fullstack/
    ├── Backend/     # Laravel 12 API (PHP 8.2+, JWT Auth, MySQL, Redis, PayMob, Groq AI)
    └── Frontend/    # Vanilla JS Boarding-pass themed web UI (HTML, CSS, JS, Assets)
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup (`fullstack/Backend/`)

The backend is built with **Laravel 12** providing a RESTful API with OpenAPI documentation, JWT authentication, PayMob payments, and AI itinerary reviews.

```bash
# Navigate to backend folder
cd fullstack/Backend

# Install PHP dependencies
composer install

# Environment setup
copy .env.example .env     # On Windows (or 'cp .env.example .env' on Linux/macOS)

# Generate application key & JWT secret
php artisan key:generate
php artisan jwt:secret --force

# Link storage & run database migrations with seed data
php artisan storage:link
php artisan migrate:fresh --seed

# Install frontend build dependencies (Vite)
npm install
npm run build

# Start the Laravel backend server (runs at http://127.0.0.1:8000)
composer run dev
# or
php artisan serve
```

* Backend API Base URL: `http://127.0.0.1:8000/api`
* Live OpenAPI API Documentation: `http://127.0.0.1:8000/docs/api`

---

### 2. Frontend Setup (`fullstack/Frontend/`)

The frontend is a static Vanilla JS web application designed with a boarding-pass theme.

```bash
# Navigate to frontend folder
cd fullstack/Frontend

# Serve using Python http.server or PHP built-in web server
python -m http.server 8080
# or
php -S 127.0.0.1:8080
```

* Open `http://localhost:8080/login.html` in your web browser.
* Ensure the Backend server is running at `http://127.0.0.1:8000`.

---

## 🛠️ Tech Stack & Key Features

### Backend (`fullstack/Backend`)
* **Framework:** Laravel 12 (PHP 8.2+)
* **Authentication:** `tymon/jwt-auth` (JWT Bearer Tokens)
* **Authorization:** `spatie/laravel-permission` (Roles: `super_admin`, `admin`, `user`)
* **Payments:** PayMob Hosted Checkout & Webhook Integration
* **AI Reviews:** Groq / OpenAI LLM itinerary review & concierge assistant
* **Reports:** `barryvdh/laravel-dompdf` & `openspout`
* **API Documentation:** `dedoc/scramble` (Interactive OpenAPI at `/docs/api`)

### Frontend (`fullstack/Frontend`)
* **Core:** Vanilla HTML5, CSS3, JavaScript (ES6+)
* **Theme:** Boarding-pass design with custom dark mode
* **Components:** Custom modals, toasts, datatables, responsive navigation, GSAP animations
* **Features:** Member dashboard, trip planner, catalog search, agency panel, operator admin suite

---

## 📚 Documentation Links

* Full API Documentation: [`fullstack/Backend/docs/Conference-API-Documentation.md`](fullstack/Backend/docs/Conference-API-Documentation.md)
* Deployment Guide: [`fullstack/Backend/docs/DEPLOYMENT.md`](fullstack/Backend/docs/DEPLOYMENT.md)
* Environment Config: [`fullstack/Backend/docs/ENVIRONMENT.md`](fullstack/Backend/docs/ENVIRONMENT.md)
* Backend README: [`fullstack/Backend/README.md`](fullstack/Backend/README.md)
* Frontend README: [`fullstack/Frontend/README.md`](fullstack/Frontend/README.md)

---

## 📄 License

MIT — Internal Case Study Deliverable, Team 2.
