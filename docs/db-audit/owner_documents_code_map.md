# Phase 2: \`owner_documents\` Code Usage Map

**Scope:** Files reading, writing, or referencing \`owner_profile.documents\` or owner document uploads  
**Target:** Replace all references with the normalized \`owner_documents\` table while preserving public shapes.

---

## Code Usage Registry

| File | Function / Section | Action | Flow | Current Behavior & Required Update |
|---|---|:---:|---|---|
| `models/ownerProfile.js` | `_normalizeRow` | **Read** | All owner flows | Deserializes `row.documents` JSON. Update to take documents array directly from joined or batched `owner_documents` rows. |
| `models/ownerProfile.js` | `findById` | **Read** | Owner status, details | Selects from `owner_profile`. Update to also query `owner_documents WHERE owner_id = ? ORDER BY document_id` and attach `documents: [...]`. |
| `models/ownerProfile.js` | `create` | **Write** | Owner signup | Encodes `documents` to JSON and inserts into `owner_profile`. Update to run in a transaction: insert `owner_profile`, then insert rows into `owner_documents`. |
| `models/ownerProfile.js` | `reapply` | **Append** | Owner resubmission | Reads existing `documents` JSON, appends new files, updates `documents = ?`. Update to insert new rows directly into `owner_documents` inside a transaction. |
| `controller/user.js` | `signup` | **Write** | Owner signup | Receives uploaded files from Multer (`req.files.legalDocuments`), maps to document objects, passes `{ documents: uploadedDocs }` to `ownerProfile.create()`. **No signature change required.** |
| `controller/owner.js` | `submitApplication` | **Write / Append** | Owner resubmission | Passes `{ documents: uploadedDocs }` to `ownerProfile.reapply()` or `ownerProfile.create()`. **No signature change required.** |
| `controller/admin.js` | `renderApprovals` | **Read** | Admin review list | Calls `ownerProfile.findByStatus()` or joins `owner_profile`. EJS renders document links and counts. **Model handles data shape; EJS/Controller unchanged.** |
| `views/dashboard/approvals.ejs` | Document modal / link | **Read** | Admin review page | Renders `owner.documents` array (`d.url`, `d.originalName`, `d.size`, `d.publicId`). Works automatically when model provides same array of objects. |
| `views/owner/status.ejs` | Document list | **Read** | Owner status page | Renders submitted documents list. Works automatically when model provides same array of objects. |
| `db/seed.js` | Seed routines | **Write** | Seeding | Does not populate owner documents (owners seeded with no documents). Verified safe. |
| `db/schema.sql` | Fresh install schema | **Schema** | Fresh setup | Remove `documents JSON NULL` from `owner_profile`; add `CREATE TABLE owner_documents`; remove redundant `idx_wishlists_user`; set charset `utf8mb4_0900_ai_ci`. |
