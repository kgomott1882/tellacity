# Business Categories Feature – Architecture Map

This document maps the **Trustpilot-style Business Categories** system logic to the Tellacity codebase. Categories improve discoverability in search and on the platform (1 primary, up to 5 secondary; search + browse; SEO; relevance).

---

## 1. Category Selection Interface

### Spec vs implementation

| Spec | Implementation |
|------|----------------|
| Access during profile setup or editing | **Categories** under Public Profile Settings: `app/business/dashboard/settings/public/categories/page.tsx` |
| Select 1 primary category | `primaryCategory` state; stored as `businesses.category_slug` |
| Select up to 5 secondary categories | `secondaryCategories` state (max 5); stored as `businesses.secondary_category_slugs` (array) |
| Search bar: keywords to find categories | Search input filters `ALL_SUBCATEGORIES` by label/slug; results shown below; click to add as primary or secondary |
| Browse grid: all main categories | **See all categories** or **+ Add** opens full-page flow: Step 1 = main categories in 4 columns; Step 2 = subcategories in 3 columns for selected main |
| Selected list with labels | **“You’ve added your business to these categories”** (copy in UI): “Primary:” chip + “Secondary:” chips; remove via X |
| Update/change anytime | Load from `businesses`; Save updates `category_slug` and `secondary_category_slugs`; editable |

**File:** `app/business/dashboard/settings/public/categories/page.tsx`

---

## 2. Category “database” and hierarchy

| Spec | Implementation |
|------|----------------|
| Stores all available categories and hierarchy | **In-code:** `MAIN_CATEGORIES_COLUMNS` (4 columns), `SUBCATEGORIES_BY_MAIN`, `ALL_SUBCATEGORIES` (flat list for search). Not in DB; easy to move to a `categories` table later. |
| Localization / industry tagging | Not implemented. Labels are English; structure supports adding localized labels or slugs later. |

**Note:** Public category pages and business profile use a `categories` table (e.g. `categories.slug`, `categories.name`, `categories.group_slug`, `categories.group_name`) for breadcrumbs and similar businesses. The **settings UI** uses the hardcoded main/sub list; saved slugs can be resolved against that list or the DB.

---

## 3. Business profile mapper

| Spec | Implementation |
|------|----------------|
| Links selected categories to business profiles | `businesses.category_slug` (primary), `businesses.secondary_category_slugs` (text[] or array, up to 5) |
| Allows updates and edits | Categories page: load → edit primary/secondary → Save; updates same columns |

**Migration:** `supabase/migrations/20260128_public_profile_settings.sql` – `secondary_category_slugs` on `businesses`; `category_slug` typically exists from earlier schema.

---

## 4. Search engine enhancer

| Spec | Implementation |
|------|----------------|
| Structured data for SEO | Business profile page (`app/b/[slug]/page.tsx`) outputs JSON-LD `LocalBusiness` with `category` when `business.categoryName` is set (primary category name). |
| Category-based search results | **Category pages:** `app/categories/[category_slug]/page.tsx` – lists businesses where `category_slug` = route slug; filter/sort by relevance, review count, etc. Consumers can browse by category. |

**Files:**  
- Business JSON-LD: `app/b/[slug]/page.tsx` (script type="application/ld+json")  
- Category listing: `app/categories/[category_slug]/page.tsx`  
- Categories index: `app/categories/page.tsx` (if present)

---

## 5. Review relevance filter

| Spec | Implementation |
|------|----------------|
| Matches reviews to business type based on category | **Current:** Reviews are tied to `business_id` (and optionally `location_id`). Category is on the **business**; “relevance” is implied by showing similar businesses (same `category_slug`) and category breadcrumbs. No separate “review relevance score” by category. |
| Improves contextual accuracy | Similar businesses and category trail improve context; filtering or weighting reviews by category can be added later (e.g. “Reviews from [Category]” or relevance scoring). |

**Current behavior:** Category is used for: (1) business profile breadcrumbs and JSON-LD, (2) category listing pages, (3) similar businesses by `category_slug`. Review display is not yet filtered/weighted by category beyond business-level.

---

## 6. Verified logic summary

| Requirement | Status |
|-------------|--------|
| Businesses must choose at least one category to be discoverable | Supported: primary is optional in DB; UI encourages selection; category pages and similar businesses rely on `category_slug`. |
| Categories editable; search + browse | Yes: Categories page supports search and “see all” grid; primary and secondary editable; Save persists. |
| 1 primary + up to 5 secondary (6 total) | Yes: `maxSecondary = 5`; primary stored in `category_slug`, secondaries in `secondary_category_slugs`. |
| Visibility, relevance, trust | Category pages and JSON-LD improve visibility; similar businesses and breadcrumbs improve relevance; structure supports future review relevance features. |

---

## 7. Data flow summary

1. **Business** opens Settings → Public profile → **Categories**. Sees search + “see all categories” / “+ Add”.
2. **Search:** Type keyword → pick from results as primary or secondary (respecting 1 primary, 5 secondary).
3. **Browse:** See all → pick main category → pick subcategory → set as primary (or add as secondary from search).
4. **Save** updates `businesses.category_slug` and `businesses.secondary_category_slugs`.
5. **Public:** Business profile shows category breadcrumb and JSON-LD `category`; category pages list businesses by `category_slug`; similar businesses use same category.
6. **Review relevance:** Today = business-level category only; future = optional filter/weight by category.

---

## 8. Optional next steps

- **Category database:** Move main/sub list into a `categories` (or `category_hierarchy`) table for localization and admin edits.
- **Multilingual labels:** Add locale to category rows and use in UI and JSON-LD.
- **Review relevance filter:** Use `category_slug` (and secondary) to filter or rank reviews (e.g. “Reviews in [Category]” or relevance score).
