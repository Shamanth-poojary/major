# WanderLust — AI Agent & Developer Orientation

Welcome to **WanderLust**, a vacation-listing and accommodation management web platform built with Node.js, Express 5, MySQL 8, EJS, Bootstrap 5, Cloudinary, and Mapbox.

## Documentation Index
Comprehensive, verified documentation is maintained under `docs/context/`:

- **Master Document:** [`docs/context/PROJECT_CONTEXT.md`](file:///c:/a-warehouse/major_phase2/major/docs/context/PROJECT_CONTEXT.md)
- **Agent Guide & Rules:** [`docs/context/AGENT_GUIDE.md`](file:///c:/a-warehouse/major_phase2/major/docs/context/AGENT_GUIDE.md)
- **System Architecture:** [`docs/context/ARCHITECTURE.md`](file:///c:/a-warehouse/major_phase2/major/docs/context/ARCHITECTURE.md)
- **Database & ERD:** [`docs/context/DATABASE.md`](file:///c:/a-warehouse/major_phase2/major/docs/context/DATABASE.md)
- **Route Inventory & Security:** [`docs/context/ROUTES.md`](file:///c:/a-warehouse/major_phase2/major/docs/context/ROUTES.md)
- **Domain Workflows:** [`docs/context/WORKFLOWS.md`](file:///c:/a-warehouse/major_phase2/major/docs/context/WORKFLOWS.md)
- **Frontend & Forms:** [`docs/context/FRONTEND.md`](file:///c:/a-warehouse/major_phase2/major/docs/context/FRONTEND.md)
- **Conventions & Checklist:** [`docs/context/CONVENTIONS.md`](file:///c:/a-warehouse/major_phase2/major/docs/context/CONVENTIONS.md)
- **Drift Report:** [`docs/context/DRIFT_REPORT.md`](file:///c:/a-warehouse/major_phase2/major/docs/context/DRIFT_REPORT.md)
- **Risks & Technical Debt:** [`docs/context/RISKS_AND_DEBT.md`](file:///c:/a-warehouse/major_phase2/major/docs/context/RISKS_AND_DEBT.md)
- **Open Questions:** [`docs/context/OPEN_QUESTIONS.md`](file:///c:/a-warehouse/major_phase2/major/docs/context/OPEN_QUESTIONS.md)

## Core Non-Negotiable Invariants
1. **Server-Side Gating:** Listing creation/updates require `isApprovedOwner` (`role === 'owner' && ownerStatus === 'approved'`).
2. **Single Admin:** Enforced by unique constraint `uq_single_admin` on stored generated column `admin_flag`.
3. **Normalized Documents:** Owner legal files are stored in 1NF table `owner_documents`, never as a JSON column in `owner_profile`.
4. **Cloud Cleanup:** Remote Cloudinary assets must be destroyed whenever parent entities are deleted.
5. **Testing:** All 185 tests (`npm test`) must pass with 0 failures before merging any change.

