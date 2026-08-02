# 🏗️ Phase 1: Repository & Environment Setup

<callout icon="🚀" color="blue_bg">
**Phase 1 Goal:** Establish the base Laravel 12 architecture, install core dependencies, and configure the local development environment for the team.
</callout>

---

## 📋 Task Checklist

- [ ] **1. Initialize Framework**
  Create the Laravel 12 project and configure the initial Git repository.
  <span color="gray">`composer create-project laravel/laravel threedos-travel-planner`</span>

- [ ] **2. Environment Configuration (`.env`)**
  Ensure all team members duplicate `.env.example` and set up the following keys:
  ```env
  DB_CONNECTION=mysql
  DB_DATABASE=threedos
  OPENWEATHER_API_KEY=
  RAPIDAPI_KEY=
  OPENAI_API_KEY=
  ```

- [ ] **3. Install Code Quality Tools**
  Install Laravel Pint to ensure consistent styling across all PRs.
  <span color="gray">`composer require laravel/pint --dev`</span>

- [ ] **4. Scaffold Authentication (Breeze)**
  Install Laravel Breeze to provide the starting point for Module 1.
  <span color="gray">`composer require laravel/breeze --dev`</span>
  <span color="gray">`php artisan breeze:install blade`</span>

- [ ] **5. Install Spatie Permissions**
  Install the RBAC engine before any migrations are run.
  <span color="gray">`composer require spatie/laravel-permission`</span>
  <span color="gray">`php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"`</span>

---

## 🛑 Definition of Done
<callout icon="✅" color="green_bg">
* All team members can clone the repo and run `php artisan serve` successfully.
* The default Breeze login screen is accessible.
* Spatie config file (`config/permission.php`) is pushed to `main`.
</callout>