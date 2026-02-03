# Reference Number System – Architecture Map

This document maps the **Reference Number System Architecture** to the Tellacity codebase. The system is modular, scalable, and supports configurable reference types (Order, Invoice, Booking, Customer, Generic, Custom).

---

## 1. Business Settings Layer

### UI Components

| Spec | Implementation |
|------|----------------|
| Toggle: Enable/disable reference number collection | `app/business/dashboard/settings/public/reference/page.tsx` – radio options "No thanks" / "Yes please" → `referenceEnabled` |
| Dropdown: Select type (Order, Invoice, Customer, Booking, Generic, Custom) | Same page – `<select id="reference-type">` with `REFERENCE_TYPES` (order, invoice, booking, customer, generic, custom) |
| Input field: Custom label if "Other" is selected | Same page – `<input id="reference-custom-label">` shown when `referenceType === "custom"` |
| Save button: Persists settings | Same page – `handleSave()` submits form |

### Backend Logic

| Spec | Implementation |
|------|----------------|
| Settings API stores preferences per business | Supabase `businesses` table; columns: `reference_number_enabled`, `reference_number_type`, `reference_number_label_custom` |
| Validation ensures correct reference type | DB: `businesses_reference_number_type_check` (order, invoice, booking, customer, generic, custom). UI: dropdown only allows these values. |
| Updates reviewer form rendering rules | Reviewer form reads these columns when loading business; see §2. |

**Files:**  
- Settings UI: `app/business/dashboard/settings/public/reference/page.tsx`  
- Migrations: `supabase/migrations/20260128_public_profile_settings.sql` (reference_number_enabled), `supabase/migrations/20260128_reference_number_system.sql` (type + custom label)

---

## 2. Reviewer Submission Layer

### UI Components

| Spec | Implementation |
|------|----------------|
| Star rating (1–5) | `src/components/reviews/WriteReviewForm.tsx` – `<RatingStars>` |
| Review title | Same – `title` state, optional input |
| Review text | Same – `body` state, required textarea |
| Optional reference number field (label from business) | Same – conditional block when `business?.reference_number_enabled && business?.reference_number_type`; label from `referenceFieldLabel(type, customLabel)` |
| Tooltip explaining purpose | Same – `<HelpCircle>` with title: "This helps the business respond to your review and link it to your experience." |

### Backend Logic

| Spec | Implementation |
|------|----------------|
| Review Submission API captures review + optional reference number | Logged-in: `supabase.from("reviews").insert({ ..., reference_number })`. Guest: `callEdgeFunction("create-review-draft", { ..., reference_number })`. |
| Reference number stored in review metadata | `reviews.reference_number` (text, nullable). |
| Privacy: field optional, not mandatory | Reference field is always optional; only sent if user enters a value and business has reference enabled. |

**Files:**  
- Form: `src/components/reviews/WriteReviewForm.tsx`  
- Public routes: `app/write-review/page.tsx`, `app/write-review/[business_slug]/page.tsx`  
- Schema: `supabase/migrations/20260128_reference_number_system.sql` (`reviews.reference_number`)

---

## 3. Business Dashboard Layer

### UI Components

| Spec | Implementation |
|------|----------------|
| Review list: reviewer name, date, rating, title, text | `app/business/dashboard/manage-reviews/page.tsx` – list from `reviews` with `guest_name`, `created_at`, `<RatingStars>`, `title`, `body` |
| Reference number tag if provided | Same – `review.reference_number` rendered as "Reference number: {value}" badge |
| Action buttons: Reply, Share, Flag | Same – buttons with `MessageCircle`, `Share2`, `Flag` (handlers can be wired later) |

### Backend Logic

| Spec | Implementation |
|------|----------------|
| Review Display Renderer fetches reviews + metadata | Same page – `supabase.from("reviews").select("id, guest_name, rating, title, body, created_at, reference_number").eq("business_id", businessId)` |
| Reference number shown only in business dashboard | Reference number is displayed only on Manage reviews; public review cards (e.g. `app/b/[slug]`) do not expose it. |
| Traceability for customer support | Reference tag in dashboard allows support to match review to order/booking/etc. |

**Files:**  
- Dashboard: `app/business/dashboard/manage-reviews/page.tsx`

---

## 4. Data Model (Actual Schema)

The spec suggests a separate `business_settings` table; Tellacity keeps reference settings on `businesses` for simplicity (one less join, same behaviour).

### Business settings (on `businesses`)

| Column | Type | Purpose |
|--------|------|---------|
| `reference_number_enabled` | boolean NOT NULL DEFAULT false | Toggle for reference collection |
| `reference_number_type` | text DEFAULT 'generic' | order, invoice, booking, customer, generic, custom (CHECK) |
| `reference_number_label_custom` | text NULL | Custom label when type = custom |

### Reviews

| Column | Purpose |
|--------|--------|
| `id` | Primary key (uuid) |
| `business_id` | FK to businesses |
| `guest_name` | Reviewer name (or from auth) |
| `rating` | 1–5 |
| `title` | Optional |
| `body` | Review content |
| `reference_number` | Optional; from reviewer when business has reference enabled |
| `created_at` | Timestamp |

Migrations:  
- `supabase/migrations/20260128_public_profile_settings.sql` – `reference_number_enabled`  
- `supabase/migrations/20260128_reference_number_system.sql` – `reference_number_type`, `reference_number_label_custom`, `reviews.reference_number`

---

## 5. Flow Summary

1. **Business** enables reference number in Settings → Public profile → Reference number; chooses type (or Custom + label); saves. Values stored in `businesses`.
2. **Reviewer** opens write-review form; business is resolved; form shows optional reference field with correct label and tooltip when enabled. On submit, `reference_number` is included in `reviews` (or in create-review-draft payload for guests).
3. **Business** opens Manage reviews; list shows name, date, rating, title, text, and "Reference number: …" when present; Reply / Share / Flag are available for future behaviour.

---

## 6. Localization / Reference Types

Reference type labels are defined in:

- **Settings page:** `REFERENCE_TYPES` in `app/business/dashboard/settings/public/reference/page.tsx`
- **Reviewer form:** `referenceFieldLabel()` in `src/components/reviews/WriteReviewForm.tsx`

To localize or add types: extend these and, if needed, the DB CHECK constraint in `20260128_reference_number_system.sql`.
