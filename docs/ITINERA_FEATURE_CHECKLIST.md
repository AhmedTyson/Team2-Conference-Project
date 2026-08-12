# Itinera Feature - Backend Implementation Plan

## 1. Scope

- Backend implementation only.
- Frontend is completely out of scope.
- Do not modify anything under `front/`, `frontend/`, or `Frontend/`.
- Follow the existing Team2 N-tier architecture.
- The existing Team2 project architecture is the source of truth.
- The `itinera-backend.zip` package is a reference/specification only.
- Do not blindly copy its architecture, models, migrations, controllers, routes, or services.
- Do not modify unrelated modules.
- Do not add fake/mock production data.
- Do not hardcode secrets.

---

## 2. Approved Feature Decisions

### Regions
- Implement Regions.
- Integrate Regions into the existing Team2 architecture.
- Reuse the existing Country/Destination structure where appropriate.
- Do not create duplicate Destination or Country entities.
- Use real project data.

### Destination Merchandising Fields
Do NOT implement these fields:

- price
- days
- discount
- best_time
- visa

They are out of scope.

### User Count
- The feature requires a user count.
- It should NOT be limited to friends.
- Do not fabricate visitor data.
- Use existing Team2 data where it semantically supports the requirement.

### Trips / Tours
- "Tours" in the feature means the existing Team2 `Trips`.
- Do NOT create a Tour model.
- Do NOT create a tours table.
- Reuse the existing Trip model and relationships.

### Hotel Reviews
- Use the existing real approved hotel reviews.
- Do not keep the reference package's empty review stub.
- Reuse the existing Review model, relationships, approval logic, services, repositories, and resources where appropriate.

### Booking
- Do NOT create a new booking system.
- Do NOT create a second confirmation-code generator.
- Integrate the feature with the existing booking/confirmation implementation created by the team lead.
- Reuse the existing booking and confirmation-code flow.
- Inspect the existing implementation before making changes.

### External APIs
- No new external API is required.
- Reuse existing Team2 integrations where applicable.
- Do not introduce a new external API unless explicitly required.

---

## 3. Existing Team2 Architecture

The project uses an existing N-tier architecture.

Expected flow:

Controller
→ Service
→ Repository Interface
→ Repository
→ Model

Rules:

- Controllers should remain thin.
- Business logic belongs in Services.
- Database access follows existing Repository conventions.
- Reuse existing Repository Interfaces.
- Team2 currently uses concrete Services directly.
- Do NOT introduce Service Interfaces unless explicitly required.
- Follow existing domain-based namespaces.
- Follow existing Form Request conventions.
- Follow existing API Resource conventions.
- Preserve backward compatibility.

---

## 4. Reference Package

Reference package:

`itinera-backend.zip`

Use it to understand:

- feature requirements
- expected functionality
- API behavior
- required flows
- frontend/API contract as reference only

Do NOT copy its architecture blindly.

---

## 5. Pre-Implementation Checklist

Before implementing anything:

- [ ] Inspect existing Destination implementation.
- [ ] Inspect existing Hotel implementation.
- [ ] Inspect existing Trip implementation.
- [ ] Inspect existing Country implementation.
- [ ] Inspect existing User implementation.
- [ ] Inspect existing Review implementation.
- [ ] Inspect the existing booking/confirmation implementation created by the team lead.
- [ ] Inspect related Controllers.
- [ ] Inspect related Services.
- [ ] Inspect related Repositories.
- [ ] Inspect related Repository Interfaces.
- [ ] Inspect related Form Requests.
- [ ] Inspect related API Resources.
- [ ] Inspect `routes/api.php`.
- [ ] Identify existing endpoints that can be reused.
- [ ] Identify only genuinely necessary new endpoints.
- [ ] Identify all required database changes.
- [ ] Confirm no duplicate entities/tables are being introduced.

---

## 6. Regions Checklist

- [ ] Determine the appropriate Region representation based on existing Team2 architecture.
- [ ] Inspect Country/Destination relationships.
- [ ] Avoid duplicate geographic entities.
- [ ] Determine how existing destinations will map to Regions.
- [ ] Use real project data.
- [ ] Do not hardcode fake destination records.

---

## 7. User Count Checklist

- [ ] Determine the existing Team2 data that supports the required user count.
- [ ] Do not fabricate visitor data.
- [ ] Do not interpret favourites as visits unless explicitly supported by the existing domain.

---

## 8. Trips / Tours Checklist

- [ ] Reuse existing Trips.
- [ ] Inspect Trip → Destination relationships.
- [ ] Use existing Trip data for the feature's tours count.
- [ ] Do NOT create Tour entities or tables.

---

## 9. Hotel Reviews Checklist

- [ ] Reuse existing Hotel → Review relationship.
- [ ] Reuse existing approved/published review logic.
- [ ] Return real existing reviews.
- [ ] Do not return hardcoded or permanently empty review data.

---

## 10. Booking Integration Checklist

- [ ] Locate the existing booking implementation.
- [ ] Locate the existing confirmation-code implementation.
- [ ] Understand the current booking flow.
- [ ] Reuse the existing booking flow.
- [ ] Do not create duplicate booking tables.
- [ ] Do not create another confirmation-code generator.
- [ ] Integrate the feature into the existing flow with minimal changes.

---

## 11. Database Rules

- [ ] Do not create duplicate tables.
- [ ] Do not add migrations unless genuinely required.
- [ ] Do not modify existing schema without a clear feature requirement.
- [ ] Reuse existing relationships where possible.
- [ ] Review every migration before running it.

---

## 12. API Rules

- [ ] Reuse existing endpoints where possible.
- [ ] Add only genuinely required endpoints.
- [ ] Follow existing route/versioning conventions for the relevant domain.
- [ ] Preserve existing endpoint behavior.
- [ ] Follow existing response/resource conventions.
- [ ] Validate new input using existing Form Request patterns.

---

## 13. Frontend Rule

The frontend is completely OUT OF SCOPE.

Do NOT:

- modify frontend files
- modify React files
- modify TypeScript files
- modify Vite configuration
- modify frontend assets
- modify frontend package files
- create frontend components
- change frontend routes

---

## 14. Testing Checklist

Before considering the feature complete:

- [ ] Run relevant backend tests.
- [ ] Run the existing test suite.
- [ ] Verify new routes.
- [ ] Verify new endpoints.
- [ ] Verify reused endpoints.
- [ ] Verify validation.
- [ ] Verify database changes.
- [ ] Verify booking integration.
- [ ] Verify Regions.
- [ ] Verify Trip-based counts.
- [ ] Verify real hotel reviews.
- [ ] Verify user count.
- [ ] Verify no frontend files were modified.
- [ ] Verify no unrelated files were modified.
- [ ] Review `git diff --name-only`.
- [ ] Review `git diff --stat`.

---

## 15. Git Rules

OpenCode must NOT:

- commit
- push
- reset
- revert
- stash
- discard local changes
- perform destructive Git operations

Git commits and pushes will be handled manually after implementation is reviewed.

---

## 16. Final Verification

Before reporting the feature as complete:

- [ ] All approved requirements implemented.
- [ ] No out-of-scope merchandising fields added.
- [ ] Tours use existing Trips.
- [ ] Hotel Reviews use existing real reviews.
- [ ] User Count follows the approved requirement.
- [ ] Booking uses the existing team booking/confirmation flow.
- [ ] Regions implemented according to the agreed design.
- [ ] No new external API introduced.
- [ ] Frontend untouched.
- [ ] No unrelated files modified.
- [ ] Tests pass.
- [ ] Final diff reviewed.