# Location Management Feature – Architecture Map

This document maps the **Location Management System Architecture** to the Tellacity codebase. The system allows businesses to manage multiple physical or service locations, import via CSV (max 2000 per batch), add manually with full profile fields, and publish a public location profile page with TrustScore and reviews.

---

## 1. Location Management Interface

### Components

| Spec | Implementation |
|------|----------------|
| Tab for managing locations | **Locations** under Public Profile Settings: `app/business/dashboard/settings/public/locations/page.tsx` |
| Import multiple locations via CSV (max 2000) | Link to **Import locations** → `app/business/dashboard/settings/public/locations/import/page.tsx`; `MAX_LOCATIONS = 2000` |
| Manually add a single location | **Add locations manually** opens `AddLocationModal` (same page) |
| List view of all added locations | `filteredLocations` list with search; each row shows name, address, city, postcode; **Edit**, **Delete**, **View** (public page) |

**Files:**  
- Main: `app/business/dashboard/settings/public/locations/page.tsx`  
- Import: `app/business/dashboard/settings/public/locations/import/page.tsx`

---

## 2. CSV Import Tool

### Field Requirements (10 columns)

| Column | Required | Stored As | Description |
|--------|----------|-----------|-------------|
| Location name | ✓ | `name` | Location display name |
| ID | ✓ | `external_id` | External/location ID |
| Street address | ✓ | `address` (+ optional street_address_2) | Primary street |
| Street address 2 | Optional | `street_address_2` | Suite, floor, etc. |
| ZIP code | ✓ | `postcode` | Postcode / ZIP |
| City | ✓ | `city` | City |
| State/Province/Region | Optional | `state_region` | Region |
| Country code | ✓ | `country_code` | e.g. ZA, US |
| Phone | Optional | `phone` | Phone number |
| Website | Optional | `website` | URL |

### Logic

| Spec | Implementation |
|------|----------------|
| Validates required fields and format | `validateRows()` in import page; required: name, id, street_address, zip_code, city, country_code |
| Confirmation step before import | Step 2: preview table + "Confirm import" button |
| Max 2000 per batch | `MAX_LOCATIONS = 2000`; validation error if exceeded |

**File:** `app/business/dashboard/settings/public/locations/import/page.tsx`

---

## 3. Manual Add Form

### Field Groups

| Spec | Implementation |
|------|----------------|
| **Identity** | Location name *, Location ID, Website |
| **Profile content** | Headline, Description (match main profile or customize) |
| **Contact** | Street address *, Street address 2, City *, ZIP/Postcode *, State/Province/Region, Country code *, Phone |
| **Confirmation checkbox** | "I confirm this location is valid and I am authorized to add it (e.g. as franchisor/franchisee)" – required when adding (not when editing) |

Edit mode: same form, pre-filled from `existing`; no confirmation checkbox.

**File:** `app/business/dashboard/settings/public/locations/page.tsx` – `AddLocationModal`

---

## 4. Location Profile Page (Public)

### Features

| Spec | Implementation |
|------|----------------|
| Public-facing page per location | Route: `/b/[business_slug]/l/[location_id]` → `app/b/[slug]/l/[location_id]/page.tsx` |
| Rich snippets for SEO | JSON-LD `LocalBusiness` with name, description, address, telephone, url, aggregateRating |
| TrustScore | Computed from reviews for this location (average rating); displayed with star rating and review count |
| Review feed | Reviews where `location_id` = this location; reviewer name, date, rating, title, body |
| Contact details | Address (full), phone (clickable tel:), website (link) |

**File:** `app/b/[slug]/l/[location_id]/page.tsx`

**View link:** From Locations list, icon link opens `/b/{business_slug}/l/{location_id}` in a new tab.

---

## 5. Backend Logic & Data Model

### Locations Table (`business_locations`)

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid PK | Location ID |
| business_id | uuid FK → businesses | Owner business |
| name | text | Location name |
| external_id | text | Location ID (e.g. for CSV) |
| address | text | Street address |
| street_address_2 | text | Optional |
| city | text | City |
| postcode | text | ZIP / Postcode |
| state_region | text | State/Province/Region |
| country_code | text | Country code |
| phone | text | Phone |
| website | text | Website URL |
| headline | text | Profile headline |
| description | text | Profile description |
| created_at | timestamptz | Created |

Migrations:  
- `supabase/migrations/20260128_public_profile_settings.sql` – base table  
- `supabase/migrations/20260128_business_locations_import_columns.sql` – external_id, street_address_2, state_region, phone, website  
- `supabase/migrations/20260128_location_profile_and_review_router.sql` – headline, description  

### Review Router (`reviews.location_id`)

| Spec | Implementation |
|------|----------------|
| Reviews tied to correct location | `reviews.location_id` (uuid FK → business_locations, nullable). Null = business-level review; set = review for that location. |
| Location profile page | Fetches reviews where `location_id` = location id. TrustScore and feed use only those reviews. |

Migration: `supabase/migrations/20260128_location_profile_and_review_router.sql` – `reviews.location_id`

### Franchise Table

Not implemented. Franchisor/franchisee relationships can be added later (e.g. separate table or flags on `businesses` / `business_locations`).

### Address Validator

Not implemented. Validation is format/required-fields only; no external address verification service.

---

## 6. Flow Summary

1. **Business** goes to Settings → Public profile settings → **Locations**. Sees list (or empty state with Import / Add manually).
2. **Import:** Upload CSV (10 columns, max 2000 rows) → validation → confirm → rows inserted into `business_locations` with all mapped columns.
3. **Add manually:** Open modal → fill identity, profile content, contact → confirm checkbox → save. **Edit:** Open same modal with existing location → save changes. **Delete:** Confirm → delete row.
4. **Public:** Each location has a profile at `/b/{business_slug}/l/{location_id}`: name, headline, description, TrustScore (from location reviews), contact details, review feed. JSON-LD LocalBusiness for rich snippets.
5. **Review router:** When a review is submitted for a specific location, set `reviews.location_id` to that location so the location profile shows only its reviews and TrustScore.
