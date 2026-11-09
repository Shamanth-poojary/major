<!-- Generated: 2026-11-04 · Commit: e6bb127 · Branch: db-fix-owner-documents · DB schema version: 004_listing_coordinates_check -->
# WanderLust Frontend Documentation

## 1. Views Inventory & Template Architecture

Every EJS template in `views/` is catalogued below:

| View Path | Rendering Route(s) | Expected Context Variables | Included Partials | Role-Dependent UI Branches |
|---|---|---|---|---|
| `views/landing.ejs` | `GET /` | `listings` | Extends `boilerplate.ejs` | Renders hero search bar, category chips, featured carousel, and trending grid. Hidden for logged-in users (redirected to `/listings`). |
| `views/listings/index.ejs` | `GET /listings` | `alllistings`, `wishlistListingIds`, `search`, `category`, `sort`, `minPrice`, `maxPrice` | Extends `boilerplate.ejs` | Displays accommodation catalog cards. Renders active heart icon if listing ID is in `wishlistListingIds`. |
| `views/listings/show.ejs` | `GET /listings/:id` | `listing`, `isWishlisted` | Extends `boilerplate.ejs`, embeds `views/listings/map.ejs` (inline) | Displays Edit/Delete buttons only if `currentUser.id === listing.owner.id`. Displays review submission form only if user is logged in. |
| `views/listings/new.ejs` | `GET /listings/new` | None | Extends `boilerplate.ejs` | Accessible only by approved owners. Form for title, description, price, location, country, and image. |
| `views/listings/edit.ejs` | `GET /listings/:id/edit` | `listing` | Extends `boilerplate.ejs` | Pre-fills existing property details and image preview. Restricts access to listing owner. |
| `views/owner/status.ejs` | `GET /owner/status` | `profile`, `status`, `BUSINESS_TYPES`, `OWNER_STATUS_LABELS` | Extends `boilerplate.ejs` | Switches dynamically based on `status`: `pending` (review notice), `approved` (success banner & link to new listing), `info_requested` (admin note & document resubmission form), `rejected` (rejection reason & re-apply form). |
| `views/admin/owners.ejs` | `GET /admin/owners` | `owners`, `filter`, `counts`, `BUSINESS_TYPES`, `OWNER_STATUS_LABELS` | Extends `boilerplate.ejs` | Standalone owner applications review table with status tabs and document inspection modal. |
| `views/dashboard/layout.ejs` | Internal layout | `sections`, `activeSection` | Extends `boilerplate.ejs`, embeds `sidebar.ejs` | Unified layout frame for all dashboard views. |
| `views/dashboard/sidebar.ejs` | Embedded in `dashboard/layout.ejs` | `sections`, `activeSection` | None | Renders role-specific navigation sidebar links. |
| `views/dashboard/approvals.ejs`| `GET /dashboard/approvals` | `owners`, `filter`, `counts`, `BUSINESS_TYPES`, `OWNER_STATUS_LABELS`, `sections`, `activeSection` | Extends `dashboard/layout.ejs` | Dashboard review console with filter tabs, counters, document review modal, and inline approve/reject/request-info action forms. |
| `views/dashboard/users.ejs` | `GET /dashboard/users` | `users`, `totalUsers`, `totalPages`, `currentPage`, `roleFilter`, `ownerStatusFilter`, `search`, `sort`, `mainAdminUsername`, `sections`, `activeSection` | Extends `dashboard/layout.ejs` | Admin user directory with live search, dropdown filters, pagination, and deletion modal. |
| `views/dashboard/user-detail.ejs` | `GET /dashboard/users/:id` | `targetUser`, `ownerProfile`, `listings`, `wishlistCount`, `mainAdminUsername`, `sections`, `activeSection` | Extends `dashboard/layout.ejs` | In-depth user record view showing business details, documents, and listings. |
| `views/dashboard/listings.ejs` | `GET /dashboard/listings` | `listings`, `sections`, `activeSection` | Extends `dashboard/layout.ejs` | Owner views own listings; Admin views all platform listings with deletion rights. |
| `views/dashboard/wishlist.ejs` | `GET /dashboard/wishlist` | `wishlist`, `sections`, `activeSection` | Extends `dashboard/layout.ejs` | Customer saved properties collection with AJAX removal buttons. |
| `views/dashboard/profile.ejs` | `GET /dashboard/profile` | `user`, `sections`, `activeSection` | Extends `dashboard/layout.ejs` | Profile edit form (username, phone, bio, avatar upload/removal). |
| `views/dashboard/bookings.ejs` | `GET /dashboard/bookings` | `sections`, `activeSection` | Extends `dashboard/layout.ejs` | Customer placeholder view for reservation management. |
| `views/users/signup.ejs` | `GET /signup`, `POST /signup` (on validation failure) | `selectedRole`, `BUSINESS_TYPES`, `values`, `errors` | Extends `boilerplate.ejs` | Dynamic role cards ("Customer" vs "Property Owner"). Conditionally displays business fields and legal document file input. |
| `views/users/login.ejs` | `GET /login` | None | Extends `boilerplate.ejs` | Username/password login card with show/hide password toggle. |
| `views/error.ejs` | Error Handler | `statusCode`, `message`, `err` | Extends `boilerplate.ejs` | Renders user-friendly error alert cards (404, 500, etc.). |
| `views/includes/navbar.ejs` | Layout Partial | `currentUser`, `canManageListings`, `pendingOwnerCount` | Included in `boilerplate.ejs` | Dynamic navigation links, role badges, owner status pills, pending approval counter, and user profile dropdown. |
| `views/includes/footer.ejs` | Layout Partial | None | Included in `boilerplate.ejs` | Social media links, copyright notice, privacy and terms links. |
| `views/includes/flash.ejs` | Layout Partial | `success`, `error`, `info` | Included in `boilerplate.ejs` | Dismissible Bootstrap alerts rendering flash notifications. |

---

## 2. Forms Contract Table

| Form View | Action URL + Method | `enctype` | Form Field `name`s (* = Required) | Hidden Inputs / Method Override | Server Validation Triggered |
|---|---|---|---|---|---|
| `users/signup.ejs` | `POST /signup` | `multipart/form-data` | `username`*, `email`*, `password`*, `role`*, `profile_picture`, `business_name` (if owner)*, `business_type` (if owner)*, `phone` (if owner), `legalDocuments` (if owner, 1-5 files)* | None | `signupUpload` (`cloudConfig.js`), `validateUser` (`utils/validateUser.js`) |
| `users/login.ejs` | `POST /login` | `application/x-www-form-urlencoded` | `username`*, `password`* | None | Passport LocalStrategy (`app.js:52`) |
| `listings/new.ejs` | `POST /listings` | `multipart/form-data` | `listing[title]`*, `listing[description]`*, `listing[price]`*, `listing[location]`*, `listing[country]`*, `image`* | None | `upload.single("image")`, `validateListing` (`utils/validateListing.js`) |
| `listings/edit.ejs` | `POST /listings/:id?_method=PUT` | `multipart/form-data` | `listing[title]`*, `listing[description]`*, `listing[price]`*, `listing[location]`*, `listing[country]`*, `image` (optional) | `_method=PUT` | `upload.single("image")`, `validateListing` (`utils/validateListing.js`) |
| `listings/show.ejs` (Review) | `POST /listings/:id/reviews` | `application/x-www-form-urlencoded` | `review[rating]`*, `review[comment]`* | None | `validateReview` (`utils/validateReview.js`) |
| `listings/show.ejs` (Delete Listing) | `POST /listings/:id?_method=DELETE` | `application/x-www-form-urlencoded` | None | `_method=DELETE` | Middleware `isOwner` (`middleware.js:23`) |
| `listings/show.ejs` (Delete Review) | `POST /listings/:id/reviews/:reviewId?_method=DELETE` | `application/x-www-form-urlencoded` | None | `_method=DELETE` | Middleware `isReviewOwner` (`middleware.js:42`) |
| `owner/status.ejs` (Reapply) | `POST /owner/application` | `multipart/form-data` | `business_name`*, `business_type`*, `phone`, `legalDocuments` (1-5 files) | None | `ownerDocUpload` (`cloudConfig.js`), `validateOwnerApplication` (`utils/validateUser.js`) |
| `dashboard/approvals.ejs` (Approve) | `POST /dashboard/approvals/:userId/approve` | `application/x-www-form-urlencoded` | `filter` | None | Controller `approveOwner` |
| `dashboard/approvals.ejs` (Reject) | `POST /dashboard/approvals/:userId/reject` | `application/x-www-form-urlencoded` | `filter`, `reason` (max 500 chars) | None | Controller `rejectOwner` |
| `dashboard/approvals.ejs` (Request Info) | `POST /dashboard/approvals/:userId/request-info` | `application/x-www-form-urlencoded` | `filter`, `message`* (10-500 chars) | None | Controller `requestInfo` |
| `dashboard/profile.ejs` | `POST /dashboard/profile?_method=PUT` | `multipart/form-data` | `username`*, `phone`, `bio`, `avatar`, `removeAvatar` | `_method=PUT` | `uploadAvatar`, Joi `profileSchema` (`schema.js:25`) |
| `dashboard/users.ejs` (Delete User) | `POST /dashboard/users/:id?_method=DELETE` | `application/x-www-form-urlencoded` | None | `_method=DELETE` | Controller `deleteUser` |
| `dashboard/user-detail.ejs` (Delete Listing) | `POST /dashboard/users/:userId/listings/:listingId?_method=DELETE` | `application/x-www-form-urlencoded` | None | `_method=DELETE` | Controller `deleteUserListing` |
| `dashboard/wishlist.ejs` (Remove) | `POST /wishlist/:listingId?_method=DELETE` | `application/x-www-form-urlencoded` | None | `_method=DELETE` | Controller `removeWishlist` (supports AJAX) |

---

## 3. Client-Side JavaScript Inventory

| Script File | Target Views / Load Location | Functionality & Responsibilities | DOM IDs, Classes & Data Attributes Used | Endpoints Called (AJAX) |
|---|---|---|---|---|
| `public/js/script.js` | Loaded globally in `boilerplate.ejs:40` | Client-side form validation using Bootstrap `.was-validated` class. Enhanced field trimming. | `.needs-validation`, `[required]`, `.is-invalid`, `.is-valid` | None |
| `public/js/ui.js` | Loaded globally in `boilerplate.ejs:41` | Progressive UI enhancements: 1. Navbar sticky shadow on scroll (`.is-scrolled`). 2. Show/hide password toggles. 3. Interactive role selection cards on signup (`.wl-role-card`). 4. Live tax switch calculator on listings index (`#tax-toggle`). 5. Interactive wishlist AJAX toggle (`.wl-wishlist-btn`). 6. Sleek custom filter dropdowns and live search. 7. User deletion modal setup (`#deleteUserModal`). | `.wl-navbar`, `.wl-pwd-toggle`, `.wl-role-card`, `#tax-toggle`, `.wl-wishlist-btn`, `.wl-filter-dropdown`, `#deleteUserModal`, `data-listing-id` | `POST /wishlist/:id`, `DELETE /wishlist/:id` |
| `public/js/map.js` | Loaded in `listings/show.ejs:106` | Lazy-loads Mapbox GL map on user button click. Initializes container, zoom controls, and interactive pin marker. | `#map`, `#loadMapBtn`, `data-token`, `data-coordinates` | None (Mapbox GL API) |
| `public/css/js/script.js` | **Dead Code (Unreferenced)** | Incomplete validation snippet with parameter naming syntax error. | `.needs-validation` | None |

---

## 4. CSS, Design System & UI Redesign State

- **Framework:** Bootstrap v5.3.8 (loaded via CDN in `boilerplate.ejs:13`).
- **Typography:** Google Fonts — *Plus Jakarta Sans* (weights 400, 500, 600, 700, 800).
- **Icons:** FontAwesome v6.5.1 (loaded via CDN in `boilerplate.ejs:17`).
- **Color Palette & Design Tokens (`public/css/theme.css`):**
  - Primary Brand Coral: `--wl-primary: #FF385C`, `--wl-primary-hover: #E00B41`
  - Secondary Teal: `--wl-secondary: #00A699`
  - Dark Slate Neutral: `--wl-dark: #222222`, `--wl-gray: #717171`
  - Light Background: `--wl-bg: #F7F7F7`, `--wl-surface: #FFFFFF`
  - Border Radius: `--wl-radius-sm: 8px`, `--wl-radius-md: 12px`, `--wl-radius-lg: 16px`, `--wl-radius-pill: 9999px`
- **Redesign Implementation Status:**
  - **Landing Page (`views/landing.ejs`):** ✅ Fully Redesigned (hero search, category pills, slick carousels, responsive layout).
  - **Authentication Pages (`signup.ejs`, `login.ejs`):** ✅ Fully Redesigned (dual-column split, role cards, custom icon inputs, password toggles).
  - **Owner Status Portal (`owner/status.ejs`):** ✅ Fully Redesigned (status cards, review note callouts, legal document upload dropzone).
  - **Dashboard Suite (`dashboard/*.ejs`):** ✅ Fully Redesigned (sidebar navigation frame, tabular management, custom sleek dropdown filters, document inspection modals).
  - **Listings Catalog (`listings/index.ejs`):** ✅ Fully Redesigned (instant category chips, tax calculation switch, floating heart wishlist buttons).
  - **Listing Show Page (`listings/show.ejs`):** ✅ Partially Redesigned (modern card layout, on-demand Mapbox map; rating stars use `rating.css`).
  - **Listing New & Edit Forms (`listings/new.ejs`, `edit.ejs`):** ✅ Standardized with modern Bootstrap 5 styling and validation feedback.

---

## 5. Static Assets Inventory

- **Local Images (`public/images/`):**
  - `landing_hero.jpg`: High-resolution hero background for landing page.
  - `signup_hero.jpg`: Side-panel background graphic for registration view.
  - `login_hero.jpg`: Side-panel graphic for login view.
  - `customer_card.jpg`: Illustration card for customer role selector.
  - `owner_card.jpg`: Illustration card for property owner role selector.
- **Cloud Assets (Hosted on Cloudinary):**
  - All accommodation photos (`image_url`).
  - User avatars (`profile_picture_url`).
  - Owner legal verification documents (`file_url`).
- **Placeholders:** Unsplash and Picsum URLs utilized in seed data (`db/seed.js`, `seed/seed.sql`).

