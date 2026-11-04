# Project Context

## Project Title
**WanderLust Vacation‑Listing Application** (MySQL edition)  
[PLACEHOLDER: official project title if different]

## Purpose & Scope
A web platform that enables vacation‑property owners to list their accommodations and customers to discover, review, and book listings. The system supports owner verification, admin moderation, and basic e‑commerce‑style interactions.

## Tech Stack
- **Backend**: Node.js (v20+), Express 5.x, Passport (local strategy), bcryptjs, method‑override
- **Frontend**: EJS templating, Bootstrap 5, client‑side scripts in `public/js`
- **Database**: MySQL 8.0.x (accessed via `mysql2` driver, normalized 1NF–5NF)
- **File & Media**: Cloudinary (image and document storage) via `cloudinary` & `multer-storage-cloudinary`
- **Validation**: Joi schemas (`schema.js`)
- **Testing**: Node `--test` runner, Supertest
- **Other utilities**: dotenv, connect‑flash, express‑session (httpOnly, sameSite lax, 1‑week maxAge)

## Key Modules / Features
| Module | Description |
|---|---|
| **Authentication** | Sign‑up / login using username/email, password hashed with bcrypt; session‑based auth via Passport. |
| **Roles** | `admin`, `owner`, `customer` (default). Role‑based access controlled by `middleware.isLoggedIn` and `middleware.requireRole`. |
| **Owner Application** | Owners submit a profile with business details and legal documents (uploaded to Cloudinary). Statuses: `pending`, `approved`, `rejected`, `info_requested`. |
| **Admin Dashboard** | Approve/reject owner applications, request more information, manage users, delete listings, view pending counts. |
| **Owner Dashboard** | Manage own listings (create, edit, delete), view status of verification, edit profile. |
| **Customer Dashboard** | Wishlist, bookings placeholder, profile editing. |
| **Listings** | CRUD for vacation listings, image upload, price, location, optional GeoJSON geometry, search / filter / sort on index page. |
| **Reviews** | Customers can leave rating & comment on listings; average rating displayed. |
| **Wishlist** | Customers can save listings for later. |
| **Error handling** | Centralised ExpressError class, flash messages for success/error/info. |

## Database Design (high‑level & normalized 1NF–5NF)
- `users` – primary key `user_id`; columns: `username`, `email`, `password_hash`, `role`, `profile_picture_url`, `profile_picture_public_id`, `phone`, `bio`, `created_at`.
- `owner_profile` – `owner_id` (PK, FK to users), `business_name`, `business_type`, `phone`, `verification_status` (`pending|approved|rejected|info_requested`), `rejection_reason`, `verification_note`, `verified_at`, `created_at`, `updated_at`.
- `owner_documents` – `document_id` (PK), `owner_id` (FK to owner_profile), `file_url`, `public_id`, `original_name`, `mime_type`, `file_size`, `resource_type`, `uploaded_at`. *(Normalized 1NF improvement: decomposed unnormalized JSON array in owner_profile into a dedicated child table).*
- `listings` – `listing_id` (PK), `owner_id` (FK), `title`, `description`, `price`, `location`, `country`, `image_url`, `image_filename`, `latitude`, `longitude`, `created_at`. CHECK constraints on price (`>= 0`), latitude (`-90 to 90`), and longitude (`-180 to 180`).
- `reviews` – `review_id` (PK), `listing_id` (FK), `user_id` (FK), `rating` (CHECK 1 to 5), `comment`, `created_at`.
- `wishlists` – `id` (PK), `user_id` (FK), `listing_id` (FK), `created_at`, `UNIQUE(user_id, listing_id)`.

> **1NF Normalization Note:** A JSON array of document objects in a single column violated 1NF (non-atomic values / repeating groups); it was decomposed into the `owner_documents` child table with zero data loss and identical application interfaces.

## Core Workflows
1. **User Registration** – Customer or Owner role selected; password stored hashed.
2. **Login** – Passport validates credentials, stores minimal user info in session.
3. **Owner Application** – Owner accesses `/owner/application`, uploads documents, submits business details. Status set to `pending`.
4. **Admin Review** – Admin views pending owners (`/dashboard/approvals`), can **Approve**, **Reject** (with reason), or **Request Info** (adds note).
5. **Owner Post‑Approval** – Approved owners can create/edit/delete listings; can add new listings via `/listings/new`.
6. **Browsing & Booking** – Customers browse listings on home page, filter/search, view details, add to wishlist, read/write reviews. Booking page stub exists (`/dashboard/bookings`).
7. **Profile Management** – Users update profile (username, phone, bio, avatar). Avatar stored in Cloudinary; removal clears Cloudinary asset.
8. **Deletion** – Admin can delete users and their associated listings and Cloudinary assets.

## Validation & Security
- Input validation via Joi schemas (`listingSchema`, `profileSchema`).
- Passwords hashed with bcryptjs; comparison done securely.
- Session cookie set `httpOnly`, `sameSite: 'lax'`, `maxAge` 1 week.
- All routes protected by `isLoggedIn` and `requireRole` middleware.
- Cloudinary assets are deleted when related records are removed.
- Parameterised queries (`pool.execute`) prevent SQL injection.

## Notable Files
- `app.js` – application entry point, session & Passport config, route mounting.
- `middleware.js` – authentication helpers.
- `cloudConfig.js` – Cloudinary configuration and upload helpers.
- `controller/` – business logic for dashboard, owner, admin, etc.
- `utils/permissions.js` – helper `isApprovedOwner` used in locals.
- `tests/` – full test suite (`npm test`) covering routes, migrations, owner workflow, admin actions (185 tests, 0 failures).

## Open Questions / Placeholders
- **Project Guide / Supervisor**: PALLAVI MA'AM
- **Institution / Department**: [PLACEHOLDER: college and department]
- **Team Members**: [PLACEHOLDER: names of contributors]
- **Project Start / End Dates**: [PLACEHOLDER: dates]
- **Exact Project Title (if different)**: [PLACEHOLDER]
