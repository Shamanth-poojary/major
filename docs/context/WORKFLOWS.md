<!-- Generated: 2026-11-04 · Commit: e6bb127 · Branch: db-fix-owner-documents · DB schema version: 004_listing_coordinates_check -->
# WanderLust End-to-End Domain Workflows

This document outlines the 11 core functional workflows of the WanderLust platform, detailing request pipelines, middleware gates, database mutations, cloud calls, and error failure paths.

---

## 1. Customer Registration, Login & Logout

### Success Path:
1. **Actor:** Unauthenticated Visitor.
2. **UI:** `GET /signup` renders `views/users/signup.ejs`. Visitor selects "Customer (Traveler)" role card.
3. **Request:** `POST /signup` with `username`, `email`, `password`, `role="customer"`, and optional `profile_picture`.
4. **Middleware:** 
   - `signupUpload` (`cloudConfig.js:73`): Captures optional avatar in memory.
   - `validateUser` (`utils/validateUser.js:17`): Checks password strength (min 8 chars, uppercase, lowercase, digit, special char), email format, and unique constraints.
5. **Controller:** `controller/user.js:signupUser`.
6. **External Calls:** If avatar uploaded, calls `uploadBufferToCloudinary()` (`wanderlust/avatars`).
7. **Database Operations:** 
   - Hashes password using `bcrypt.hash(password, 10)`.
   - Inserts row into `users` (`models/user.js:46`): `(username, email, password_hash, role='customer', profile_picture_url, profile_picture_public_id)`.
8. **Session & Response:** Calls `req.login()` establishing Passport session. Flashes success `"Welcome to WanderLust!"` and redirects `302 -> /listings`.

### Failure Paths:
- **Validation Failure (e.g. Weak Password):** `validateUser` catches error, re-renders `views/users/signup.ejs` with HTTP 200, populating `errors` object and retaining input `values`. No database insert or Cloudinary upload occurs.
- **Duplicate Username / Email:** MySQL throws `ER_DUP_ENTRY`. Handled in catch block (`controller/user.js:132-158`), sets inline error message, and re-renders signup view with retained values.
- **Cloudinary Failure:** Catches upload error, logs warning, skips avatar, and proceeds with account creation.

### Login / Logout:
- **Login:** Visitor submits `POST /login` -> `saveRedirectUrl` captures target URL -> `passport.authenticate("local")` executes `bcrypt.compare` -> On success, redirects to stored `redirectUrl` or `/listings`.
- **Logout:** User requests `GET /logout` -> `req.logout()` destroys session -> Redirects `302 -> /listings` with success flash.

---

## 2. Owner Registration & Document Submission

### Success Path:
1. **Actor:** Prospective Property Owner.
2. **UI:** `GET /signup` -> Selects "Property / Business Owner" role card. The form dynamically reveals business details (`business_name`, `business_type`, `phone`) and legal document file input (`legalDocuments`).
3. **Request:** `POST /signup` (multipart/form-data) with account fields, business details, and 1 to 5 legal files (PDF/JPG/PNG, max 5MB each).
4. **Middleware:**
   - `signupUpload` (`cloudConfig.js:73`): Buffers up to 5 legal documents and 1 avatar. Enforces 5MB file size and MIME-type restrictions.
   - `validateUser` (`utils/validateUser.js:17`): Validates password strength, business fields, and ensures at least one legal document was provided (`req.files.legalDocuments.length >= 1`).
5. **Controller:** `controller/user.js:signupUser`.
6. **External Calls:** Uploads documents via `Promise.all` using `uploadBufferToCloudinary()` targeting folder `wanderlust/owner-documents` (`raw` resource type for PDFs, `image` for photos).
7. **Database Operations (Single Transaction):**
   - Connects to MySQL pool and executes `conn.beginTransaction()`.
   - Inserts row into `users` with `role='owner'`.
   - Calls `OwnerProfile.create()` (`models/ownerProfile.js:65`):
     - Inserts row into `owner_profile`: `(owner_id, business_name, business_type, phone, verification_status='pending')`.
     - Iterates through uploaded document metadata and inserts rows into `owner_documents` child table: `(owner_id, file_url, public_id, original_name, mime_type, file_size, resource_type, uploaded_at)`.
   - Executes `conn.commit()`.
8. **Session & Response:** Establishes session with `req.login()` setting `ownerStatus: "pending"`. Redirects `302 -> /owner/status` with flash success `"Account created. Your owner application has been sent to the admin for approval."`.

### Failure Paths:
- **Missing Legal Documents:** `validateUser` halts submission, populating `errors.legalDocuments = "Please upload at least one legal verification document."`. Re-renders form without Cloudinary uploads.
- **Invalid File Size / Format:** `signupUpload` catches Multer error (e.g. `LIMIT_FILE_SIZE`), populates `req.uploadError`. Handled gracefully in `validateUser` which displays inline error.
- **Database Error on Commit:** Rollback executed (`conn.rollback()`). All uploaded Cloudinary assets are destroyed asynchronously (`deleteCloudinaryAsset`) to prevent orphaned cloud files.

---

## 3. Administrative Owner Verification

### Success Path:
1. **Actor:** Administrator (`role === 'admin'`).
2. **UI:** Accesses `/dashboard/approvals` (or `/admin/owners`). Navbar badge reflects `pendingOwnerCount`.
3. **Filtering:** Supports `?status=pending` (default), `approved`, `rejected`, `info_requested`, or `all`.
4. **Review Console:**
   - Displays applicant business details, trading category, contact info, and submission timestamp.
   - Embeds interactive "View Documents" modal button listing all normalized child documents from `owner_documents`.
   - Modal renders direct secure links to Cloudinary documents with file type badges and original filenames.
5. **Decisions:**
   - **Approve:** `POST /dashboard/approvals/:userId/approve` -> Executes `OwnerProfile.setDecision(userId, 'approved', null)` -> Sets `verification_status='approved'`, `verified_at=NOW()`, clears notes/reasons -> Redirects with success flash.
   - **Reject:** `POST /dashboard/approvals/:userId/reject` with `reason` textarea -> Validates length <= 500 chars -> Executes `OwnerProfile.setDecision(userId, 'rejected', reason)` -> Sets `verification_status='rejected'`, `rejection_reason=reason` -> Redirects with success flash.
   - **Request Info:** `POST /dashboard/approvals/:userId/request-info` with `message` input -> Validates length between 10 and 500 chars -> Executes `OwnerProfile.requestInfo(userId, message)` -> Sets `verification_status='info_requested'`, `verification_note=message` -> Redirects with success flash.

### Failure Paths:
- **Non-Admin Access:** Middleware `requireRole('admin')` blocks request, flashes error, and redirects to `/listings`.
- **Short Message on Request Info (<10 chars):** Controller catches invalid message, flashes error `"Please provide a message between 10 and 500 characters."`, redirects to approvals dashboard without modifying database.
- **Invalid User ID:** Validates `userId > 0`; if profile not found, flashes error `"Owner application not found"` and redirects safely.

---

## 4. Owner Resubmission (Post Info Request or Rejection)

### Success Path:
1. **Actor:** Property Owner with `status === 'info_requested'` or `'rejected'`.
2. **UI:** Visits `/owner/status`. Page displays alert banner highlighting the administrator's review note (`verification_note`) or rejection reason (`rejection_reason`).
3. **Form:** Renders re-application form with pre-filled business details and file upload control allowing supplementary legal documents.
4. **Request:** `POST /owner/application` (multipart/form-data).
5. **Middleware:** `requireRole("owner")` -> `ownerDocUpload` -> `validateOwnerApplication`.
6. **External Calls:** Uploads new files to Cloudinary `wanderlust/owner-documents`.
7. **Database Operations (`models/ownerProfile.js:172`):**
   - Executes inside a transaction.
   - Updates `owner_profile`: sets `verification_status='pending'`, resets `rejection_reason=NULL`, `verification_note=NULL`, `verified_at=NULL`.
   - Inserts newly attached documents into `owner_documents` (deduplicating by `public_id` / `url`).
   - Commits transaction.
8. **Response:** Redirects `302 -> /owner/status` with flash success `"Additional documents submitted. Your application is under review."`.

---

## 5. Owner Status Page & Navigation Status Pill Logic

The platform communicates verification status across the UI:
- **Status `pending`:** 
  - Navbar: Warning badge `"Under Review"`.
  - `/owner/status`: Informs owner their application is being reviewed. Listing creation is disabled.
- **Status `info_requested`:** 
  - Navbar: Info pill `"Action Required"`.
  - `/owner/status`: Prominently displays the administrator's request note and renders the document attachment form.
- **Status `approved`:** 
  - Navbar: Green pill `"Verified Owner"` and displays "Add New Listing" button.
  - `/owner/status`: Confirms approval with verification date and direct button to create accommodations.
- **Status `rejected`:** 
  - Navbar: Danger pill `"Application Rejected"`.
  - `/owner/status`: Displays administrative rejection reason and offers a re-application form.

---

## 6. Listing Lifecycle (Create, Edit, Delete, View)

### 6.1 View (Public)
- Request: `GET /listings/:id`.
- Fetches listing details, host username, and all attached reviews via `Listing.findByIdWithDetails(id)`.
- If user is logged in, checks if listing exists in their wishlist via `Wishlist.isWishlisted()`.
- Renders `views/listings/show.ejs` with lazy-loading Mapbox trigger.

### 6.2 Create (Approved Owner Only)
- Guard: `isLoggedIn`, `isApprovedOwner` (`middleware.js:65`).
- Request: `POST /listings` with `listing[title]`, `listing[description]`, `listing[price]`, `listing[location]`, `listing[country]`, and `image` file.
- Geocoding: Calls Mapbox SDK `forwardGeocode({ query: location, limit: 1 })`. Extracts `[longitude, latitude]`. Fails gracefully if no geocode match.
- Image Upload: Multer Cloudinary storage engine streams cover photo to `wanderlust/` folder.
- Database: Inserts into `listings` (`owner_id = req.user.id`). Redirects `302 -> /listings/:id`.

### 6.3 Edit & Update (Listing Owner Only)
- Guard: `isLoggedIn`, `isApprovedOwner`, `isOwner` (`middleware.js:23`).
- Request: `PUT /listings/:id`.
- If location changed, re-geocodes with Mapbox.
- If new cover photo uploaded, replaces Cloudinary asset and updates `image_url` and `image_filename`. Updates fields in `listings`. Redirects `302 -> /listings/:id`.

### 6.4 Delete (Listing Owner Only)
- Guard: `isLoggedIn`, `isApprovedOwner`, `isOwner`.
- Request: `DELETE /listings/:id`.
- Calls `Listing.deleteWithImage(id)`: deletes Cloudinary photo asset via `deleteCloudinaryAsset()`, then executes `DELETE FROM listings WHERE listing_id = ?`. Foreign key cascades delete all associated reviews and wishlist bookmarks automatically. Redirects `302 -> /listings`.

---

## 7. Listings Catalog & Dashboard Listings

- **Public Catalog (`GET /listings`):**
  - Renders all accommodations with multi-criteria search (`title`, `location`, `country`, `description`), business category filter, price boundary filters (`minPrice`, `maxPrice`), and sorting (`price_asc`, `price_desc`, `rating`, `newest`).
  - Pre-fetches customer's active wishlist IDs in a single `Set` to highlight bookmark icons instantly.
- **Dashboard Listings (`GET /dashboard/listings`):**
  - **Owner Scope:** Queries `Listing.findByOwnerId(req.user.id)`. Owner manages only their own inventory.
  - **Admin Scope:** Queries all listings across all platform owners, allowing moderation and direct deletion.

---

## 8. Wishlist Management (Bookmark Curation)

- **Add Bookmark (`POST /wishlist/:listingId`):**
  - Guard: `isLoggedIn`.
  - Supports AJAX (returns JSON `{ success: true, wishlisted: true }`) and standard HTTP form POST.
  - Executes `INSERT INTO wishlists (user_id, listing_id) ... ON DUPLICATE KEY UPDATE`.
- **Remove Bookmark (`DELETE /wishlist/:listingId`):**
  - Guard: `isLoggedIn`.
  - Supports AJAX (returns JSON `{ success: true, wishlisted: false }`) and method-override DELETE.
  - Executes `DELETE FROM wishlists WHERE user_id = ? AND listing_id = ?`.
- **View Wishlist (`GET /dashboard/wishlist`):**
  - Displays user's saved accommodations with direct links to view or remove.

---

## 9. Customer Reviews

- **Add Review (`POST /listings/:id/reviews`):**
  - Guard: `isLoggedIn`, `validateReview` (Joi checks `rating` is integer between 1 and 5, `comment` is non-empty string).
  - Verifies target listing exists; throws 404 if missing.
  - Inserts row into `reviews`: `(listing_id, user_id, rating, comment)`.
  - Redirects `302 -> /listings/:id` with success flash.
- **Delete Review (`DELETE /listings/:id/reviews/:reviewId`):**
  - Guard: `isLoggedIn`, `isReviewOwner` (`middleware.js:42` verifies `review.userId === req.user.id`).
  - Deletes row from `reviews`. Redirects `302 -> /listings/:id`.
- **Aggregation:** `Listing.findAll` calculates live average ratings via `COALESCE(AVG(r.rating), 4.9)` and total review counts per listing.

---

## 10. Profile View & Management

- **View Profile (`GET /dashboard/profile`):**
  - Guard: `isLoggedIn`.
  - Fetches fresh user record via `User.findById(req.user.id)`. Displays avatar, account role, email, phone, bio, and joined date.
- **Update Profile (`PUT /dashboard/profile`):**
  - Guard: `isLoggedIn`, `uploadAvatar.single("avatar")`.
  - Validates `username` (min 3, max 50), `phone` (regex format), `bio` (max 300) via Joi `profileSchema`.
  - Checks username uniqueness against other accounts.
  - If `removeAvatar === "true"`, invokes `User.removeProfilePicture()` (destroys Cloudinary asset, clears DB columns).
  - If new avatar file uploaded, destroys previous Cloudinary avatar and updates profile with new asset URL and public ID.
  - Updates `users` table and redirects to `/dashboard/profile` with success flash.

---

## 11. Administrative User Management

- **Users Directory (`GET /dashboard/users`):**
  - Guard: `requireRole("admin")`.
  - Features role filtering (`all`, `customer`, `owner`, `admin`), owner status filtering (`all`, `pending`, `approved`, etc.), search query (`username` or `email`), and pagination (10 users per page).
  - Computes total matching records and page counts.
- **User Detail Inspection (`GET /dashboard/users/:id`):**
  - Displays complete account data, associated owner profile, uploaded documents, published listings count, and wishlist activity.
- **Account Deletion (`DELETE /dashboard/users/:id`):**
  - Safety Guards:
    - Self-deletion blocked: Admin cannot delete their own account (`controller/dashboard.js:371`).
    - Primary admin protected: `admin` username and `user_id = 1` cannot be deleted (`controller/dashboard.js:377`).
  - Coordinated Cascading Cleanup (`models/user.js:259`):
    1. Fetches and destroys user's profile avatar on Cloudinary.
    2. Fetches all listings owned by user and destroys all associated cover images on Cloudinary.
    3. Deletes listings owned by user from `listings` (satisfying `ON DELETE RESTRICT`).
    4. Deletes user row from `users` (MySQL cascades automatically purge `owner_profile`, `owner_documents`, `reviews`, and `wishlists`).
  - Redirects to `/dashboard/users` with success flash.

