<!-- Generated: 2026-11-04 · Commit: e6bb127 · Branch: db-fix-owner-documents · DB schema version: 004_listing_coordinates_check -->
# WanderLust Open Questions for the Repository Owner

The following items are marked ❓ (unverified or ambiguous) and require clarification or confirmation from the project owner:

---

## 1. Project Identity & Academic Context
1. **Academic Institution & Department:** What is the official college and department name to cite in academic documentation?
2. **Project Team Members:** What are the official contributor/student names and roll/registration numbers for the project?
3. **Official Project Title:** Is the official report title **"WanderLust: Vacation-Listing and Accommodation Management System"**, or is there a specific designated title?
4. **Project Dates:** What are the designated start and submission dates for this project phase?

---

## 2. Architecture & Code Cleanup
5. **Duplicate Admin Route Deprecation:** Should the older standalone `/admin/owners` routes (`routes/admin.js`, `controller/admin.js`, `views/admin/owners.ejs`) be formally deprecated and removed in favor of `/dashboard/approvals`?
6. **Orphan Script Removal:** May the invalid script `public/css/js/script.js` be safely deleted from the repository?
7. **Production Session Store:** Is there a preferred persistent session store backend for deployment (e.g. `express-mysql-session` to utilize the existing MySQL instance, or Redis)?
8. **Document Access Policy:** Should uploaded owner legal documents continue using direct Cloudinary URLs, or should signed URLs / backend authenticated streaming be enforced for stricter privacy?

