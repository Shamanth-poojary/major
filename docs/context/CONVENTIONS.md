<!-- Generated: 2026-11-04 · Commit: e6bb127 · Branch: db-fix-owner-documents · DB schema version: 004_listing_coordinates_check -->
# WanderLust Architectural Conventions & Developer Guide

## 1. Naming & Structural Conventions

| Entity | Convention | Examples from Codebase |
|---|---|---|
| **Route Files** | Singular nouns, lowercase | `routes/listing.js`, `routes/review.js`, `routes/user.js`, `routes/owner.js` |
| **Model Files** | CamelCase or singular noun | `models/user.js`, `models/listing.js`, `models/ownerProfile.js`, `models/wishlist.js` |
| **Controller Files** | Singular or plural noun matching route domain | `controller/user.js`, `controller/listings.js`, `controller/dashboard.js`, `controller/admin.js` |
| **Database Tables** | Plural or domain noun, snake_case | `users`, `listings`, `reviews`, `wishlists`, `owner_profile`, `owner_documents` |
| **Database Columns** | `snake_case`, primary keys named `<entity>_id` or `id` | `user_id`, `listing_id`, `owner_id`, `password_hash`, `verification_status` |
| **Foreign Keys** | Named `fk_<source_table>_<target_table>` | `fk_listing_owner`, `fk_review_listing`, `fk_owner_documents_owner` |
| **Indexes** | Named `idx_<table_name>_<column_name>` | `idx_listings_owner`, `idx_owner_profile_status`, `idx_reviews_listing` |
| **Unique Keys** | Named `uq_<table_name>_<column_name>` | `uq_users_username`, `uq_users_email`, `uq_single_admin`, `uq_user_listing` |
| **CSS Classes** | Kebab-case, prefixed with `wl-` for custom design tokens | `.wl-navbar`, `.wl-btn-primary`, `.wl-role-card`, `.wl-filter-pill` |
| **Git Commits** | Conventional Commits standard | `feat(owner): add documents`, `fix(signup): retain values`, `test(matrix): add suite` |
| **Git Branches** | Type-prefixed kebab-case | `feat/owner-verification-documents`, `fix/signup-retain-and-inline-errors`, `db-fix-owner-documents` |

---

## 2. Architectural Patterns & Responsibilities

### 2.1 Model-View-Controller (MVC) Pattern
- **Models (`models/`):** Sole owners of SQL queries and database communication. Export pure async functions taking primitives or plain objects and returning formatted canonical JavaScript objects. Never access `req`, `res`, or session data inside models.
- **Controllers (`controller/`):** Coordinate business logic, invoke models, manage file uploads, invoke cloud services (Cloudinary / Mapbox), and manage response rendering or redirects with flash messages.
- **Routes (`routes/`):** Thin mapping layer that binds HTTP methods and paths to middleware pipelines and controller handlers.
- **Views (`views/`):** EJS templates consuming data strictly from `res.render(view, context)` or `res.locals`. No direct business logic or DB calls in views.

### 2.2 Error Handling & Async Wrapping
- Every asynchronous route handler is wrapped with `wrapAsync` (`utils/wrapAsync.js:4`):
  ```js
  const wrapAsync = (fn) => (req, res, next) => {
    fn(req, res, next).catch(next);
  };
  ```
- Errors are instantiated using `ExpressError` (`utils/ExpressError.js`):
  ```js
  throw new ExpressError(404, "Listing not found");
  ```
- Unhandled errors flow into the global error handler (`app.js:125-128`), which renders `error.ejs`.

### 2.3 Flash Messaging Pattern
- All user-facing mutation operations (create, update, delete, approve, reject) end with a flash message and redirect (`302`), never rendering a template directly on POST/PUT/DELETE.
- Flash keys: `success` (green), `error` (red), `info` (blue).

---

## 3. "How to Add a Feature" Checklist

Follow this exact sequence when adding new platform features:

1. **Database Schema & Migration:**
   - Write UP and DOWN SQL migration files in `db/migrations/` (e.g. `NNN_feature_name.up.sql`).
   - Run migration script `node scripts/run_migration.js <name>`.
   - Update `db/schema.sql` to reflect the final table structure.
2. **Data-Access Layer (Model):**
   - Create or update the model in `models/` with parameterized queries (`pool.execute()`).
   - If multi-table mutation is involved, use a database connection transaction (`conn.beginTransaction()`).
   - Provide a row-to-object formatting helper to ensure a consistent return shape.
3. **Validation Schema:**
   - Define Joi schema in `schema.js` or create dedicated middleware under `utils/`.
4. **Controller Logic:**
   - Implement handler functions in `controller/`.
   - Handle cloud asset uploads and deletions if files are involved.
5. **Route Mounting & Authorization:**
   - Add routes in `routes/`.
   - Apply appropriate security middleware: `isLoggedIn`, `requireRole(...)`, `isApprovedOwner`, or `isOwner`.
6. **Frontend Templates & UI:**
   - Create or update EJS templates under `views/`.
   - Extend `boilerplate.ejs` or `views/dashboard/layout.ejs`.
   - Ensure form field names match controller expectations and add client validation classes (`.needs-validation`).
7. **Automated Testing:**
   - Add unit/integration scenarios in `tests/` using Node test runner (`node --test`) and Supertest.
   - Run `npm test` and verify zero regressions across existing test suites.

---

## 4. Non-Negotiable Invariants

The following invariants must **never** be broken or compromised:

1. **Owner-Approval Gating Server-Side:**
   - Middleware `isApprovedOwner` MUST gate every route creating, updating, or deleting listings.
   - Verification MUST be a positive comparison: `user.role === 'owner' && user.ownerStatus === 'approved'`. Never write negative checks like `user.ownerStatus !== 'pending'`.
2. **Single Administrator Guarantee:**
   - The stored generated column `users.admin_flag` and unique constraint `uq_single_admin` ensure that only one administrator can exist. Never drop or bypass this constraint.
   - The primary admin account (`user_id = 1` or username from `process.env.ADMIN_USERNAME`) cannot be deleted (`controller/dashboard.js:377`).
3. **Cloud Asset Cleanup:**
   - Whenever an entity holding a Cloudinary asset (listing image, user avatar, owner document) is deleted or updated, the underlying Cloudinary asset must be destroyed via `deleteCloudinaryAsset()`.
4. **Transaction Integrity on Multi-Step Onboarding:**
   - Owner signup must create the `users` record, `owner_profile`, and `owner_documents` rows inside a single ACID transaction. If an error occurs, the transaction must roll back and uploaded cloud assets must be purged.
5. **Referential Integrity on Listings:**
   - Foreign key `fk_listing_owner` on `listings.owner_id` is `ON DELETE RESTRICT`. A user with active listings cannot be deleted without first purging their listings and associated cloud assets.
6. **Decimal Price Integrity:**
   - The database connection pool MUST include `decimalNumbers: true` (`db/pool.js:14`). Listing prices must arrive as JavaScript numbers, not strings.

