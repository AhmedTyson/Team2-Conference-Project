# Future Sprints & Missing Endpoints

<callout icon="📅" color="purple_bg">
This subpage outlines the modules deferred to future sprints and the endpoints identified as missing from the current scope.
</callout>

## 🚀 Module 6: AI & External API Proxies
*   **Generate Itinerary:** Trigger OpenAI API (`/trips/{trip}/generate-ai`)
*   **Weather:** Proxy OpenWeatherMap (`/api/weather/{city}`)
*   **Seeders:** RapidAPI fixtures.

## 🗺️ Module 7: Interactive Maps
*   **Destination Map:** Render Leaflet maps for attractions/hotels (`/api/maps/destination/{id}`).
*   **Trip Routes:** Polyline connections for trip itineraries.

## 📊 Module 8: User Dashboard
*   **Dashboard:** Trip statistics, user overview.
*   **Saved Lists:** Favourites, Booking history.

## ⚙️ Module 9: Admin Dashboard
*   **Moderation:** Review queue.
*   **CRM:** User blocking, contact messages.
*   **CRUD:** Destinations, Categories.

---

## 🚧 Missing / Planned Endpoints (To Be Added Later)

<callout icon="⚠️" color="yellow_bg">
We will add these endpoints later when the business logic is finalized. They are not in Sprint 1.
</callout>

| Feature | Notes |
|---|---|
| **Reports API** | Endpoints for PDF/CSV exports (Revenue, Growth). |
| **Payment Gateway** | Endpoints for Stripe/PayPal webhooks and checkout sessions. |
| **Transactions** | Endpoints to record payment history, refunds, and receipts. |