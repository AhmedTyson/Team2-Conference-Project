# SPEC: Itinera Public Platform Refinement & Architecture Modernization

**Version**: 3.0  
**Design Reference**: `Home Page final.html` (Luxury Dark Travel Concierge aesthetic + GSAP micro-interactions + Tailwind CSS / Vanilla CSS tokens)  
**Target Surfaces**:
1. **Public Web Surface** (`fullstack/Frontend/*.html`, `assets/css/`, `assets/js/`)
2. **Directory Architecture Restructuring** (Moving private customer/agency/admin pages into dedicated domain directories: `/admin/`, `/agency/`, `/app/`)

---

## 1. Architectural Vision & Directory Structure

To maintain a clean, maintainable separation of concerns across user roles and public visitors, the frontend is organized into clear domain spaces:

```
fullstack/Frontend/
├── index.html                  # Official Public Landing Page (based on Home Page final.html + home.html sections)
├── about.html                  # Public About Us, Mission, Global Team & Partners
├── explore.html                # Public Catalog Explorer (Destinations, Hotels, Restaurants, Attractions)
├── entity.html                 # Public Item Detail (Destination, Hotel, Restaurant, Attraction)
├── weather.html                # Public Live Global Weather & Forecasts
├── contact.html                # Public Contact Us & Inquiry System
├── plans.html                  # Public Subscription & Pricing Plans
├── plan-compare.html           # Public Plan Feature Comparison Matrix
├── help.html                   # Public Help Center & FAQ
├── login.html                  # Authentication: Sign In
├── register.html               # Authentication: Sign Up
├── forgot.html                 # Authentication: Password Recovery
├── reset.html                  # Authentication: Password Reset
├── verify.html                 # Authentication: Email Verification
├── email-notice.html           # Authentication: Verification Pending Notice
│
├── app/                        # ── Customer Workspace (Authenticated Traveler Portal) ──
│   ├── dashboard.html          # Customer Hub & Analytics Overview
│   ├── trips.html              # My Trips Catalog
│   ├── trip.html               # Trip Detail & Itinerary Timeline
│   ├── trip-form.html          # Create / Edit Trip Wizard
│   ├── trip-map.html           # Trip Route Visualizer
│   ├── planner.html            # AI Trip Planner & Generator
│   ├── itinerary.html          # Printable / Exportable Schedule
│   ├── surveys.html            # Travel Style Survey
│   ├── survey-create.html      # Create Travel Preferences
│   ├── survey-answer.html      # Answer Travel Survey
│   ├── bookings.html           # My Bookings & Reservations
│   ├── booking.html            # Booking Details & Vouchers
│   ├── flight-booking.html     # Flight Reservation Flow
│   ├── checkout.html           # Order Checkout & Payment Gateway
│   ├── receipt.html            # Payment Receipt & Invoice
│   ├── favourites.html         # Saved Destinations & Items
│   ├── my-reviews.html         # My Submitted Reviews
│   ├── notifications.html      # User Notification Center
│   ├── profile.html            # User Profile Overview
│   ├── profile-settings.html   # Account & Security Settings
│   ├── chat.html               # Concierge & Support Chat
│   ├── copy-wizard.html        # Public Trip Fork Wizard
│   └── report-agency.html      # Agency Flag & Report Form
│
├── agency/                     # ── Agency Portal (Verified Travel Agencies) ──
│   ├── index.html              # Agency Dashboard & Performance
│   ├── assignments.html        # Customer Trip Assignments
│   ├── create-trip.html        # Custom Itinerary Builder
│   └── reports.html            # Agency Financial & Performance Reports
│
├── admin/                      # ── Admin Suite (Departure Control & Operations) ──
│   ├── index.html              # Platform Executive Overview & KPIs
│   ├── users.html              # User Management & RBAC
│   ├── user-details.html       # User Deep Dive & Activity Log
│   ├── destinations.html       # Destination Catalog CRUD & Geocoding
│   ├── hotels.html             # Hotel Catalog CRUD
│   ├── restaurants.html        # Restaurant Catalog CRUD
│   ├── attractions.html        # Attraction Catalog CRUD
│   ├── categories.html         # Category Taxonomy CRUD
│   ├── countries.html          # Country & Region ISO CRUD
│   ├── flights.html            # Flight Routes CRUD
│   ├── trips.html              # All Trips Moderation
│   ├── reviews.html            # Review Moderation & Approvals
│   ├── agency-requests.html    # Agency Proposals & Approvals
│   ├── flags.html              # Content Flags & Dispute Resolution
│   ├── contacts.html           # Support Inbox
│   ├── notifications.html      # Notification Broadcaster
│   ├── analytics.html          # Revenue & Growth Analytics
│   ├── reports.html            # PDF Report Generator
│   └── settings.html           # Platform Settings & Maintenance
│
└── assets/
    ├── css/
    │   ├── tokens.css          # Semantic design tokens (Dark/Light HSL variables)
    │   ├── app.css             # Customer & Public Shared Components
    │   ├── public.css          # Public Landing & Luxury Experience styles
    │   └── admin.css           # Departure Control & Basecoat UI styles
    └── js/
        ├── config.js           # Environment & Route Config
        ├── api.js              # Fetch transport layer & JWT interceptor
        ├── session.js          # Authentication state management
        ├── public-home.js      # Public Landing Page interactive engine
        ├── explore.js          # Public Catalog & Region filtering
        ├── entity.js           # Public Item Detail & Booking
        └── admin-*.js          # Admin Suite operational scripts
```

---

## 2. Public Experience Design System (Luxury Dark Aesthetic)

### 2.1 Design Tokens & Palette (derived from `Home Page final.html`)
- **Canvas / Background**: `#0a0a0a` (Deep Obsidian Dark)
- **Surface Elevation**: `rgba(255, 255, 255, 0.04)` with `backdrop-filter: blur(16px)`
- **Border Subtlety**: `rgba(255, 255, 255, 0.08)`
- **Accent Primary**: `#38bdf8` (Vibrant Cyan / Cerulean) & `#ffffff` (Pure White)
- **Display Typography**: `Inter`, `font-weight: 800/900`, `letter-spacing: -0.04em`
- **Giant Text Overlay**: 26vw backdrop title with `opacity: 0.12` and blend-mode overlay

### 2.2 Core Public Landing Sections (Composite of `Home Page final.html` + `home.html`)
1. **Glassmorphic Top Navigation (`.nav-pill`)**:
   - Brand logo with subtle glow.
   - Interactive icon $\rightarrow$ text hover transitions for `Home`, `Explore`, `Weather`, `About`, `Contact`.
   - Dynamic user avatar / Sign In button with modal trigger.
2. **Hero Destination Experience**:
   - Giant city name backdrop (`NEW YORK`, `PARIS`, `TOKYO`, `SANTORINI`, `BARCELONA`).
   - Dynamic background image carousel with smooth crossfade.
   - Interactive slide card with active progress bar (`01/05`), destination description, and manual arrows/dots.
   - Quick CTA row: "Start Exploring" $\rightarrow$ `/explore.html`, "Plan a Trip" $\rightarrow$ Auth/Planner.
3. **Platform Statistics Marquee & KPI Counters**:
   - Infinite marquee ticker (`DESTINATIONS ✦ HOTELS ✦ TOURS ✦ RESTAURANTS ✦ REVIEWS ✦ WEATHER`).
   - 4-card live metrics grid wired to `GET /api/stats/summary`:
     - Hotels Listed (`hotels`)
     - Curated Tours (`tours`)
     - Flight Routes (`flights`)
     - Verified Reviews (`reviews` formatted e.g. `1.2K`)
4. **Top Curated Destinations & Region Explorer**:
   - Dynamic continent pills (`All`, `Africa`, `Asia`, `Europe`, `North America`, `South America`, `Oceania`).
   - 4-column destination cards with hotel count, tour count, star rating, and direct booking trigger.
5. **Interactive Booking / Itinerary Wizard**:
   - 4-step interactive flow: (1) Destination $\rightarrow$ (2) Flights $\rightarrow$ (3) Hotels $\rightarrow$ (4) Summary.
6. **Live Weather Radar**:
   - City weather station powered by `GET /api/weather` with temperature, condition badge, and humidity/wind stats.
7. **Curated Tour Packages Section**:
   - Highlighted packages with inclusions, pricing, and instant booking modal.
8. **Why Choose Itinera (Value Proposition)**:
   - Curated experiences, certified local guides, verified reviews, transparent pricing.
9. **Guest Reviews & Testimonials Carousel**:
   - Real approved traveler feedback with star ratings and verified badges.
10. **Modern Footer**:
    - Newsletter signup, legal & social links, copyright, and platform status.

---

## 3. Implementation Plan in 6 Phases

| Phase | Title | Key Actions |
|---|---|---|
| **Phase 1** | Directory Restructuring | Move customer app pages into `fullstack/Frontend/app/`, update navigation links across `nav-config.js` and HTML anchors. |
| **Phase 2** | Design Tokens & Shared CSS | Refine `tokens.css` and create `public.css` extracting the clean, modular styles from `Home Page final.html`. |
| **Phase 3** | Official Public Landing Page | Build unified `index.html` combining `Home Page final.html` and `home.html` sections with live API endpoints. |
| **Phase 4** | Public Explore & Entity Pages | Refactor `explore.html` and `entity.html` to adopt the luxury dark aesthetic with live region filters and booking actions. |
| **Phase 5** | Public About, Contact & Weather Pages | Refactor `about.html`, `contact.html`, and `weather.html` to match the design language and API endpoints. |
| **Phase 6** | Auth Modals & End-to-End Verification | Integrate seamless auth drawer/modal, verify responsive breakpoints, and validate against test suite. |

