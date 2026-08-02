# Smart AI Travel Planner — Simplified ERD Description
**Project:** ThreeDOS — Backend Development Council
**Date:** July 31, 2026
**Format:** Chen Notation — Entities, Attributes, and Relationships only

---

## 1. Design Principles
Based on the simplified redesign document:
- 16 Core Entities logically grouped into 6 Domains.
- `SURVEY` is removed (input stored in `TRIP`).
- `TRIP_DESTINATION` pivot removed (replaced by flat `ITINERARY_ITEM` for simplicity).
- `CITY` entity introduced as parent to Places.
- Polymorphic relations used for `REVIEW` and `FAVOURITE`.

---

## 2. Entities

### AUTHENTICATION ZONE
**USER**
- <u>id</u>
- name
- email
- password
- email_verified_at

**ROLE**
- <u>id</u>
- name

### TRAVEL PLANNING ZONE
**TRIP**
- <u>id</u>
- destination_id
- budget
- duration
- travel_style
- number_of_travelers
- estimated_cost
- ai_summary
- status

**ITINERARY_ITEM**
- <u>id</u>
- day_number
- time_slot
- title
- notes

### DESTINATIONS ZONE
**COUNTRY**
- <u>id</u>
- name
- iso_code

**CITY**
- <u>id</u>
- name

**DESTINATION**
- <u>id</u>
- name
- description

### PLACES ZONE
**ATTRACTION**
- <u>id</u>
- name

**HOTEL**
- <u>id</u>
- name

**RESTAURANT**
- <u>id</u>
- name

**CATEGORY**
- <u>id</u>
- name
- type

### USER INTERACTION ZONE
**FAVOURITE**
- <u>id</u>
- favorite_type
- favorite_id

**REVIEW**
- <u>id</u>
- reviewable_type
- reviewable_id
- rating
- comment

**CONTACT_MESSAGE**
- <u>id</u>
- name
- message

### SYSTEM ZONE
**SETTING**
- <u>id</u>
- key
- value

**AI_RECOMMENDATION**
- <u>id</u>
- prompt
- response
- generated_at

---

## 3. Relationships

1. **USER — ROLE**
   `USER (M) ──── belongs_to ──── (1) ROLE`

2. **USER — TRIP**
   `USER (1) ──── creates ──── (M) TRIP`

3. **TRIP — ITINERARY_ITEM**
   `TRIP (1) ──── contains ──── (M) ITINERARY_ITEM`

4. **COUNTRY — CITY**
   `COUNTRY (1) ──── contains ──── (M) CITY`

5. **CITY — DESTINATION**
   `CITY (1) ──── has ──── (M) DESTINATION`

6. **CITY — HOTEL**
   `CITY (1) ──── has ──── (M) HOTEL`

7. **CITY — RESTAURANT**
   `CITY (1) ──── has ──── (M) RESTAURANT`

8. **CITY — ATTRACTION**
   `CITY (1) ──── has ──── (M) ATTRACTION`

9. **CATEGORY — ATTRACTION**
   `CATEGORY (1) ──── classifies ──── (M) ATTRACTION`

10. **USER — REVIEW**
    `USER (1) ──── writes ──── (M) REVIEW`

11. **REVIEW — (PLACES/DESTINATION)**
    `REVIEW (M) ──── reviewable ──── (1) HOTEL / RESTAURANT / ATTRACTION / DESTINATION` *(Polymorphic)*

12. **USER — FAVOURITE**
    `USER (1) ──── saves ──── (M) FAVOURITE`

13. **FAVOURITE — (PLACES/DESTINATION)**
    `FAVOURITE (M) ──── favorable ──── (1) HOTEL / RESTAURANT / ATTRACTION / DESTINATION` *(Polymorphic)*

14. **TRIP — AI_RECOMMENDATION**
    `TRIP (1) ──── generates ──── (M) AI_RECOMMENDATION`
