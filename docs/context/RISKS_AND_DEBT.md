<!-- Generated: 2026-11-04 · Commit: e6bb127 · Branch: db-fix-owner-documents · DB schema version: 004_listing_coordinates_check -->
# WanderLust Risks, Technical Debt & Quality Assessment

This document provides a factual assessment of security, data integrity, performance, maintainability, and operational considerations across the WanderLust platform.

---

## 1. Security Observations

| Category | Observation / Finding | Evidence (File:Line) | Risk & Impact | Suggested Direction |
|---|---|---|---|---|
| **CSRF Protection** | ⚠️ No Cross-Site Request Forgery (CSRF) tokens implemented on mutation endpoints. | `app.js:20-43` | Malicious external sites could submit state-changing POST/PUT/DELETE requests if an authenticated user is tricked into visiting an untrusted link. | Introduce `csurf` or double-submit cookie token middleware on all non-GET routes. |
| **Session Storage** | ⚠️ Default `MemoryStore` utilized for `express-session`. | `app.js:32-41` | Sessions leak memory over time and do not persist across server restarts or multi-instance deployments. | Integrate persistent session store (e.g., `express-mysql-session` or `connect-redis`). |
| **Rate Limiting** | ⚠️ Absence of request rate limiting on authentication endpoints. | `routes/user.js:12-28` | `/login` and `/signup` routes are susceptible to brute-force credential stuffing and denial of service. | Implement `express-rate-limit` on `/login`, `/signup`, and password-sensitive routes. |
| **HTML Escaping** | ⚠️ EJS unescaped output tag `<%-` used in some layout blocks. | `views/layouts/boilerplate.ejs:32` (`<%- body %>`) | Safe for layout body inclusion, but unescaped `<%-` on user-generated inputs could introduce XSS vulnerabilities if misused. | Ensure user-generated variables (usernames, reviews, notes) strictly use `<%=` escaped tags (verified: `<%=` is used in show and user views). |
| **Document URL Exposure** | ⚠️ Direct Cloudinary URLs for legal documents exposed in admin HTML. | `views/dashboard/approvals.ejs:141` | Any user who obtains the URL could view the uploaded PDF without additional token authorization. | Implement Cloudinary signed URLs or proxy document downloads through an authenticated backend route. |

---

## 2. Data Integrity Observations

| Category | Finding | Evidence (File:Line) | Risk & Impact | Suggested Direction |
|---|---|---|---|---|
| **Role Subtype Invariant** | ⚠️ Owner profile constraint is app-enforced only. | `db/schema.sql:23-38`, `models/ownerProfile.js:65` | A customer or admin record could technically have an `owner_profile` row inserted if application logic is bypassed directly via raw SQL. | Retain current transaction verification in `controller/user.js:50-88`; consider a database trigger if strict DB isolation is mandated. |
| **Cascade Deletion of Cloud Assets** | ⚠️ Cloudinary assets must be purged sequentially before DB records. | `models/user.js:259-298` | If the server crashes mid-deletion between Cloudinary destruction and MySQL deletion, orphaned cloud files or inconsistent DB rows could occur. | Implement an asynchronous queue or dead-letter table for media cleanup jobs. |
| **Unbounded Text Fields** | ✅ Title, description, and comments strictly bounded. | `db/schema.sql:59, 83`, `schema.js:3-10` | Joi schemas and MySQL types prevent buffer overflow or database clipping. | Retain current validation. |

---

## 3. Maintainability & Dead Code

| Finding | Evidence (File:Line) | Impact | Suggested Direction |
|---|---|---|---|
| **Orphaned Client Script** | `public/css/js/script.js` | Dead code with parameter syntax error (`forms` parameter vs `form` variable). Never loaded by any template. | Delete `public/css/js/script.js`. |
| **Duplicate Admin Review Routes** | `routes/admin.js` vs `routes/dashboard.js:169-280` | Duplication of admin review controllers and routes (`/admin/owners` vs `/dashboard/approvals`). Navigation uses `/dashboard/approvals`. | Deprecate `/admin/owners` routes in favor of unified `/dashboard/approvals`. |
| **TODO/FIXME Comments** | Zero occurrences in application code (`tests/owner_approval.test.js:729` contains string "hacked" in test payload). | Excellent codebase cleanliness. | Maintain documentation integrity. |

---

## 4. Performance & Scalability

| Category | Observation | Evidence (File:Line) | Evaluation & Suggested Direction |
|---|---|---|---|
| **N+1 Query Avoidance** | ✅ Owner documents pre-fetched in single batch. | `models/ownerProfile.js:327-338` | `OwnerProfile.listByStatus` uses a single `WHERE owner_id IN (...)` query instead of querying documents per owner row. | Excellent pattern; maintain for future one-to-many child relationships. |
| **Search Indexing** | ⚠️ `Listing.findAll` executes `LIKE %term%` queries across 4 columns without FULLTEXT indexing. | `models/listing.js:82` | Acceptable for current data scale (54 rows), but will cause table scans as listing inventory grows beyond thousands of records. | Add a MySQL `FULLTEXT` index on `(title, description, location, country)` for high-scale catalog searches. |
| **Image Optimization** | ✅ Cloudinary CDN handles responsive delivery. | `cloudConfig.js:11-37` | Images are served from Cloudinary with auto-formatting. | Maintain current media architecture. |

---

## 5. Operational & Deployment Readiness

| Aspect | Status | Details |
|---|---|---|
| **Environment Variable Safety** | ✅ Strong | `app.js:9` fails fast with exit code 1 if `SECRET` is omitted. Secrets are loaded via `dotenv` and excluded from git (`.gitignore:1`). |
| **Port Collision Handling** | ✅ Strong | `app.js:139-145` listens for `EADDRINUSE` and automatically increments port (8080 -> 8081). |
| **Automated Testing** | ✅ 185/185 Tests Passing | Node native test runner (`tests/routes.test.js`, `tests/owner_approval.test.js`, `tests/owner_verification_docs.test.js`, `tests/dashboard_phase4.test.js`) provides comprehensive regression coverage. |
| **Database Migrations** | ✅ Tracked | Up/down SQL scripts exist in `db/migrations/` with executable runner `scripts/run_migration.js`. |

