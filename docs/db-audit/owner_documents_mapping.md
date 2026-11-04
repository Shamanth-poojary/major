# Phase 1: `owner_profile.documents` Key → Column Mapping Table

**Database:** `wanderlust_norm` (MySQL 8.0.43)  
**Live Collation:** `undefined`  
**Generated:** 2026-11-04T01:46:19.387Z  

---

## 1. JSON Structural Inspection

- **Total Owners in `owner_profile`:** 15
- **Owners with `documents IS NULL`:** 14
- **Owners with `documents` = empty array `[]`:** 0
- **Owners with `documents` not an array:** 0 (Must be 0)
- **Owners with populated documents:** 1 (Owner ID 50 with 3 documents)

---

## 2. Document Object Keys Discovered

Every key discovered in any document across the database:
- `url`
- `size`
- `mimeType`
- `publicId`
- `uploadedAt`
- `originalName`
- `resourceType`

---

## 3. Key → Column Mapping Table

| JSON Key | Target Column | Data Type | Nullable | Description / Semantics |
|---|---|---|:---:|---|
| *(synthetic PK)* | `document_id` | `INT UNSIGNED AUTO_INCREMENT` | NO | Surrogate primary key |
| *(owner link)* | `owner_id` | `INT UNSIGNED` | NO | Foreign Key references `owner_profile(owner_id)` ON DELETE CASCADE |
| `url` | `file_url` | `VARCHAR(500)` | NO | Cloudinary delivery URL |
| `publicId` | `public_id` | `VARCHAR(255)` | YES | Cloudinary asset public ID |
| `originalName` | `original_name` | `VARCHAR(255)` | YES | Original client-side filename |
| `mimeType` | `mime_type` | `VARCHAR(100)` | YES | MIME type (e.g. `image/png`, `image/jpeg`) |
| `size` | `file_size` | `INT UNSIGNED` | YES | File size in bytes |
| `resourceType` | `resource_type` | `VARCHAR(50)` | YES | Cloudinary resource type (e.g. `image`, `raw`) |
| `uploadedAt` | `uploaded_at` | `TIMESTAMP` | NO | Upload timestamp (defaults to CURRENT_TIMESTAMP) |

> **Lossless Preservation Guarantee:** All 6 discovered JSON keys (`url`, `publicId`, `originalName`, `mimeType`, `size`, `resourceType`, `uploadedAt`) are mapped to dedicated columns. No attribute is discarded.
