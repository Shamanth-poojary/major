<!-- Generated: 2026-11-04 · Commit: e6bb127 · Branch: db-fix-owner-documents · DB schema version: 004_listing_coordinates_check -->
# WanderLust — Future Agent Orientation Guide

> **Read this document first before exploring the codebase or attempting any modifications.**

---

## 1. Quick Orientation: Where Things Are

| Component | Files & Directory | Key Responsibility |
|---|---|---|
| **Entry Point & Middleware** | `app.js`, `middleware.js` | Express app bootstrap, Passport setup, security middleware. |
| **Database Pool & Schema** | `db/pool.js`, `db/schema.sql`, `db/migrations/` | MySQL2 connection pool, canonical DDL, up/down migrations. |
| **Data-Access Models** | `models/*.js` (`user`, `ownerProfile`, `listing`, `review`, `wishlist`) | Pure parameterized SQL queries. Sole interface to database. |
| **Controllers & Business Logic** | `controller/*.js` (`dashboard`, `listings`, `user`, `owner`, `admin`, `reviews`, `wishlist`) | Request processing, transaction wrapping, cloud integration. |
| **Routing Layer** | `routes/*.js` | Thin Express routers mapping HTTP methods to middleware + controllers. |
| **Frontend UI Views** | `views/**/*.ejs` | EJS templates styled with Bootstrap 5.3 and `theme.css`. |
| **Static Assets** | `public/css/`, `public/js/`, `public/images/` | Client stylesheets, progressive JavaScript (`ui.js`), hero graphics. |
| **Cloud Config & Uploads** | `cloudConfig.js` | Cloudinary storage engine, Multer upload wrappers, asset destruction. |
| **Testing Suite** | `tests/*.test.js` | Automated test suite run with `npm test`. |

---

## 2. The Do / Don't Rules

### DO:
- ✅ **Run `npm test`** before and after every modification to confirm that all 185 tests continue to pass.
- ✅ **Wrap multi-table database mutations** (like owner registration or user deletion) in connection transactions (`conn.beginTransaction()`).
- ✅ **Purge Cloudinary assets** whenever associated listings, avatars, or owner legal documents are deleted or replaced.
- ✅ **Use positive comparisons** for access gating: `user.role === 'owner' && user.ownerStatus === 'approved'`.
- ✅ **Keep `decimalNumbers: true`** in MySQL pool configuration so listing prices arrive as numbers, not strings.
- ✅ **Read `docs/context/`** instead of re-exploring the repository from scratch.

### DO NOT:
- 🔴 **Never commit secrets** (passwords, session keys, Cloudinary/Mapbox tokens). Environment variable values belong exclusively in local `.env`.
- 🔴 **Never write raw SQL queries in controllers or routes.** All database access belongs inside `models/`.
- 🔴 **Never reintroduce an unnormalized JSON `documents` column** into `owner_profile`. Legal documents must be stored in the 1NF child table `owner_documents`.
- 🔴 **Never bypass the single-admin constraint** (`uq_single_admin`). The system is architected for exactly one administrator.
- 🔴 **Never attempt to delete the primary administrator** account (`user_id = 1` or username from `ADMIN_USERNAME`).
- 🔴 **Never remove `wrapAsync`** from asynchronous route handlers.

---

## 3. Which Document Answers Which Question?

| If you need to know... | Consult this document |
|---|---|
| General overview, stack, how to run, directory structure | [`PROJECT_CONTEXT.md`](file:///c:/a-warehouse/major_phase2/major/docs/context/PROJECT_CONTEXT.md) |
| Boot order, middleware order, auth flow, environment variables | [`ARCHITECTURE.md`](file:///c:/a-warehouse/major_phase2/major/docs/context/ARCHITECTURE.md) |
| Route inventory, middleware checks, permission matrix | [`ROUTES.md`](file:///c:/a-warehouse/major_phase2/major/docs/context/ROUTES.md) |
| Database schema, ER diagram, foreign keys, query inventory | [`DATABASE.md`](file:///c:/a-warehouse/major_phase2/major/docs/context/DATABASE.md) |
| What changed recently and any codebase/DB discrepancies | [`DRIFT_REPORT.md`](file:///c:/a-warehouse/major_phase2/major/docs/context/DRIFT_REPORT.md) |
| Step-by-step user/owner/admin operational flows & failure paths | [`WORKFLOWS.md`](file:///c:/a-warehouse/major_phase2/major/docs/context/WORKFLOWS.md) |
| Views list, form field names, client scripts, design tokens | [`FRONTEND.md`](file:///c:/a-warehouse/major_phase2/major/docs/context/FRONTEND.md) |
| Code style, naming rules, how to add a new feature | [`CONVENTIONS.md`](file:///c:/a-warehouse/major_phase2/major/docs/context/CONVENTIONS.md) |
| Known vulnerabilities, technical debt, performance notes | [`RISKS_AND_DEBT.md`](file:///c:/a-warehouse/major_phase2/major/docs/context/RISKS_AND_DEBT.md) |
| Unresolved questions needing owner confirmation | [`OPEN_QUESTIONS.md`](file:///c:/a-warehouse/major_phase2/major/docs/context/OPEN_QUESTIONS.md) |

---

## 4. Documentation Update Checklist

Whenever you modify application code, schema, or configuration, execute this checklist verbatim before completing your task:

```text
After any change, update:
- routes (ROUTES.md)
- schema + migrations (DATABASE.md, db/schema.sql)
- forms/views (FRONTEND.md)
- workflows (WORKFLOWS.md)
- drift report (DRIFT_REPORT.md - clear resolved items)
- header stamps (update commit and date in all modified docs)
```

