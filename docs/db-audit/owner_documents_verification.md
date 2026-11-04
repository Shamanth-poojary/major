# Phase 5: `owner_documents` Verification & Proof Report

**Database:** `wanderlust`  
**Execution Date:** 2026-11-04T02:18:33.784Z  

---

## 1. Data Preservation Proofs (Section 6.1)

### (a) Document Totals Check
- **JSON Documents Total:** `3`
- **`owner_documents` Rows Total:** `3`
- **Status:** **PASS (✔)** (Exactly equal)

### (b) Per-Owner Document Counts
- **Query:** Compare `JSON_LENGTH(op.documents)` with `COUNT(od.document_id)` grouped by `owner_id`.
- **Mismatched Owners Found:** `0`
- **Status:** **PASS (✔)** (Zero mismatches)

### (c) URL Completeness Check
- **Query:** `JSON_TABLE` URL left-joined to `owner_documents.file_url`.
- **Missing URLs Found:** `0`
- **Status:** **PASS (✔)** (Zero missing URLs; 100% losslessly migrated)

### (d) Referential Orphan Check
- **Query:** `owner_documents` left-joined to `owner_profile` on `owner_id`.
- **Orphan Rows Found:** `0`
- **Status:** **PASS (✔)** (Zero orphans)

---

## 2. Sample Data Verification (Spot-Check)

```json
[
  {
    "document_id": 1,
    "owner_id": 50,
    "file_url": "https://res.cloudinary.com/dkg3y5byr/image/upload/v1793724452/wanderlust/owner-documents/brwaqyepkbjto6dbrduk.png",
    "public_id": "wanderlust/owner-documents/brwaqyepkbjto6dbrduk",
    "original_name": "api_sentinel_solution_workflow.png",
    "mime_type": "image/png",
    "file_size": 784865,
    "resource_type": "image",
    "uploaded_at": "2026-11-03T11:17:33.000Z"
  },
  {
    "document_id": 2,
    "owner_id": 50,
    "file_url": "https://res.cloudinary.com/dkg3y5byr/image/upload/v1793724452/wanderlust/owner-documents/wixh2xs79cqhk8lnf47s.png",
    "public_id": "wanderlust/owner-documents/wixh2xs79cqhk8lnf47s",
    "original_name": "api_sentinel_system_architecture.png",
    "mime_type": "image/png",
    "file_size": 973430,
    "resource_type": "image",
    "uploaded_at": "2026-11-03T11:17:34.000Z"
  },
  {
    "document_id": 3,
    "owner_id": 50,
    "file_url": "https://res.cloudinary.com/dkg3y5byr/image/upload/v1793724451/wanderlust/owner-documents/myajdfzad2ud7ps06iyc.jpg",
    "public_id": "wanderlust/owner-documents/myajdfzad2ud7ps06iyc",
    "original_name": "s-10.jpg",
    "mime_type": "image/jpeg",
    "file_size": 100828,
    "resource_type": "image",
    "uploaded_at": "2026-11-03T11:17:32.000Z"
  }
]
```

---

## 3. Hygiene Fixes Verification

### F2: Redundant Index on `wishlists`
- **Remaining Indexes on `wishlists`:** `PRIMARY, uq_user_listing, idx_wishlists_listing`
- **Redundant `idx_wishlists_user`:** Dropped.
- **Index Used for `WHERE user_id = ?`:** `uq_user_listing` (`uq_user_listing` leftmost prefix used).
- **Status:** **PASS (✔)**

### F4: Coordinate Range Checks on `listings`
- **Constraint Added:** `chk_listing_lat` (`latitude BETWEEN -90 AND 90`)
- **Constraint Added:** `chk_listing_lng` (`longitude BETWEEN -180 AND 180`)
- **Status:** **PASS (✔)**
