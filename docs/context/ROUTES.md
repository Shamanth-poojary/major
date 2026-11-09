<!-- Generated: 2026-11-04 · Commit: e6bb127 · Branch: db-fix-owner-documents · DB schema version: 004_listing_coordinates_check -->
# WanderLust Route Inventory & Security Matrix

## 1. Complete Route Inventory

Every route registered in the Express application is documented below:

| Method | Path | Middleware Chain (in order) | Controller / Handler (File:Line) | View Rendered / Redirect Target | Roles Allowed | Reads / Writes (Tables) | Notes |
|---|---|---|---|---|---|---|---|
| `GET` | `/` | None | `routes/landing.js:14` | `views/landing.ejs` or `302 -> /listings` | All (Redirects if authenticated) | R: `listings`, `owner_profile`, `reviews` | Public landing page with featured carousel and search. |
| `GET` | `/listings` | None | `controller/listings.js:12` | `views/listings/index.ejs` | Public (All) | R: `listings`, `owner_profile`, `reviews`, `wishlists` | Main explore page with search, category filtering, and sorting. |
| `GET` | `/listings/new` | `isLoggedIn`, `isApprovedOwner` | `controller/listings.js:33` | `views/listings/new.ejs` | Owner (Approved) | None | New listing form. |
| `POST` | `/listings` | `isLoggedIn`, `isApprovedOwner`, `upload.single("image")`, `validateListing` | `controller/listings.js:61` | `302 -> /listings/:id` | Owner (Approved) | W: `listings` | Geocodes address via Mapbox, uploads photo to Cloudinary, creates listing. |
| `GET` | `/listings/:id` | None | `controller/listings.js:40` | `views/listings/show.ejs` | Public (All) | R: `listings`, `users`, `reviews`, `wishlists` | Full listing details, host info, reviews, and on-demand Mapbox map. |
| `GET` | `/listings/:id/edit` | `isLoggedIn`, `isApprovedOwner`, `isOwner` | `controller/listings.js:44` | `views/listings/edit.ejs` | Owner (Approved & Creator) | R: `listings`, `users` | Pre-filled edit form. |
| `PUT` | `/listings/:id` | `isLoggedIn`, `isApprovedOwner`, `isOwner`, `upload.single("image")`, `validateListing` | `controller/listings.js:101` | `302 -> /listings/:id` | Owner (Approved & Creator) | R/W: `listings` | Re-geocodes on location change; replaces Cloudinary image if new file attached. |
| `DELETE` | `/listings/:id` | `isLoggedIn`, `isApprovedOwner`, `isOwner` | `controller/listings.js:167` | `302 -> /listings` | Owner (Approved & Creator) | W: `listings`, `reviews` (cascade), `wishlists` (cascade) | Removes Cloudinary asset and deletes listing record. |
| `POST` | `/listings/:id/reviews` | `isLoggedIn`, `validateReview` | `controller/reviews.js:6` | `302 -> /listings/:id` | Customer, Owner, Admin | W: `reviews` | Adds rating and comment to accommodation. |
| `DELETE` | `/listings/:id/reviews/:reviewId` | `isLoggedIn`, `isReviewOwner` | `controller/reviews.js:21` | `302 -> /listings/:id` | Review Author | W: `reviews` | Deletes review feedback. |
| `GET` | `/owner/status` | `requireRole("owner")` | `controller/owner.js:17` | `views/owner/status.ejs` | Owner | R: `owner_profile`, `owner_documents` | Verification status tracker and document resubmission portal. |
| `POST` | `/owner/application` | `requireRole("owner")`, `ownerDocUpload`, `validateOwnerApplication` | `controller/owner.js:28` | `302 -> /owner/status` | Owner | W: `owner_profile`, `owner_documents` | Creates pending application or re-applies post rejection / info request. |
| `GET` | `/admin/owners` | `requireRole("admin")` | `controller/admin.js:22` | `views/admin/owners.ejs` | Admin | R: `owner_profile`, `users`, `owner_documents` | Standalone admin owner applications management page. |
| `POST` | `/admin/owners/:userId/approve` | `requireRole("admin")` | `controller/admin.js:33` | `302 -> /admin/owners` | Admin | W: `owner_profile` | Approves pending owner. |
| `POST` | `/admin/owners/:userId/reject` | `requireRole("admin")` | `controller/admin.js:60` | `302 -> /admin/owners` | Admin | W: `owner_profile` | Rejects owner with optional reason. |
| `POST` | `/admin/owners/:userId/request-info` | `requireRole("admin")` | `controller/admin.js:93` | `302 -> /admin/owners` | Admin | W: `owner_profile` | Requests additional documentation with custom message note. |
| `GET` | `/dashboard` | `isLoggedIn` | `controller/dashboard.js:23` | `302 -> role-specific dashboard` | Customer, Owner, Admin | None | Role router (Admin -> `/approvals`, Owner -> `/listings`, Customer -> `/wishlist`). |
| `GET` | `/dashboard/profile` | `isLoggedIn` | `controller/dashboard.js:39` | `views/dashboard/profile.ejs` | Customer, Owner, Admin | R: `users` | User profile overview and editor. |
| `PUT` | `/dashboard/profile` | `isLoggedIn`, `uploadAvatar.single("avatar")` | `controller/dashboard.js:53` | `302 -> /dashboard/profile` | Customer, Owner, Admin | R/W: `users` | Updates username, phone, bio; uploads or removes avatar. |
| `POST` | `/dashboard/profile` | `isLoggedIn`, `uploadAvatar.single("avatar")` | `controller/dashboard.js:53` | `302 -> /dashboard/profile` | Customer, Owner, Admin | R/W: `users` | Fallback for POST form submissions without method-override. |
| `GET` | `/dashboard/wishlist` | `isLoggedIn` | `controller/dashboard.js:111` | `views/dashboard/wishlist.ejs` | Customer, Owner, Admin | R: `wishlists`, `listings`, `owner_profile`, `reviews` | Saved listings collection. |
| `GET` | `/dashboard/bookings` | `isLoggedIn`, `requireRole("customer")` | `controller/dashboard.js:124` | `views/dashboard/bookings.ejs` | Customer | None | Designated placeholder view for upcoming reservations. |
| `GET` | `/dashboard/listings` | `isLoggedIn`, `requireRole("owner", "admin")` | `controller/dashboard.js:135` | `views/dashboard/listings.ejs` | Owner, Admin | R: `listings` | Owner views own listings; Admin views all platform listings. |
| `GET` | `/dashboard/approvals` | `isLoggedIn`, `requireRole("admin")` | `controller/dashboard.js:169` | `views/dashboard/approvals.ejs` | Admin | R: `owner_profile`, `users`, `owner_documents` | Dashboard owner verification console with document modal review. |
| `POST` | `/dashboard/approvals/:userId/approve` | `isLoggedIn`, `requireRole("admin")` | `controller/dashboard.js:190` | `302 -> /dashboard/approvals` | Admin | W: `owner_profile` | Sets verification status to 'approved'. |
| `POST` | `/dashboard/approvals/:userId/reject` | `isLoggedIn`, `requireRole("admin")` | `controller/dashboard.js:216` | `302 -> /dashboard/approvals` | Admin | W: `owner_profile` | Sets verification status to 'rejected' with reason. |
| `POST` | `/dashboard/approvals/:userId/request-info` | `isLoggedIn`, `requireRole("admin")` | `controller/dashboard.js:248` | `302 -> /dashboard/approvals` | Admin | W: `owner_profile` | Sets verification status to 'info_requested' with note. |
| `GET` | `/dashboard/users` | `isLoggedIn`, `requireRole("admin")` | `controller/dashboard.js:285` | `views/dashboard/users.ejs` | Admin | R: `users`, `owner_profile`, `listings` | Paginated user management table with search and role/status filtering. |
| `GET` | `/dashboard/users/:id` | `isLoggedIn`, `requireRole("admin")` | `controller/dashboard.js:317` | `views/dashboard/user-detail.ejs` | Admin | R: `users`, `owner_profile`, `listings`, `wishlists` | Detailed user inspection console. |
| `DELETE` | `/dashboard/users/:id` | `isLoggedIn`, `requireRole("admin")` | `controller/dashboard.js:357` | `302 -> /dashboard/users` | Admin | W: `users`, `listings`, `owner_profile`, `owner_documents`, `reviews`, `wishlists` | Cascading user deletion including Cloudinary assets. Self and main admin protected. |
| `DELETE` | `/dashboard/users/:userId/listings/:listingId` | `isLoggedIn`, `requireRole("admin")` | `controller/dashboard.js:390` | `302 -> /dashboard/users/:userId` | Admin | W: `listings`, `reviews`, `wishlists` | Administrative listing removal with Cloudinary asset destruction. |
| `POST` | `/wishlist/:listingId` | `isLoggedIn` | `controller/wishlist.js:15` | JSON `{ success: true }` or `302 -> /listings/:id` | Customer, Owner, Admin | W: `wishlists` | Bookmark listing (supports AJAX and traditional form POST). |
| `DELETE` | `/wishlist/:listingId` | `isLoggedIn` | `controller/wishlist.js:48` | JSON `{ success: true }` or `302 -> /dashboard/wishlist` | Customer, Owner, Admin | W: `wishlists` | Remove bookmark (supports AJAX and method-override DELETE). |
| `GET` | `/signup` | None | `controller/user.js:9` | `views/users/signup.ejs` | Public (Unauthenticated) | None | Registration page with dynamic role selector and document uploads. |
| `POST` | `/signup` | `signupUpload`, `validateUser` | `controller/user.js:17` | `302 -> /owner/status` or `302 -> /listings` | Public (Unauthenticated) | W: `users`, `owner_profile`, `owner_documents` | Registers user account, processes avatar/documents, logs user in. |
| `GET` | `/login` | None | `controller/user.js:108` | `views/users/login.ejs` | Public (Unauthenticated) | None | Login form. |
| `POST` | `/login` | `saveRedirectUrl`, `passport.authenticate("local")` | `controller/user.js:112` | `302 -> redirectUrl` or `302 -> /listings` | Public (Unauthenticated) | R: `users`, `owner_profile` | Authenticates credentials; restores requested protected URL. |
| `GET` | `/logout` | None | `controller/user.js:124` | `302 -> /listings` | Authenticated Users | None | Terminates session and clears Passport session cookie. |

---

## 2. Middleware Catalogue

| Middleware Name | File:Line | Check / Assertion | Failure Behavior | Used By Routes | Status Gating Logic / Observations |
|---|---|---|---|---|---|
| `isLoggedIn` | `middleware.js:5` | `req.isAuthenticated()` is true | Stores `req.originalUrl` into `req.session.redirectUrl`, flashes error "You must be signed in first!", redirects `302 -> /login`. | All protected routes across `/listings/new`, `PUT/DELETE /listings`, `/dashboard/*`, `/wishlist/*`, reviews. | Basic authentication gate. |
| `saveRedirectUrl` | `middleware.js:15` | Checks if `req.session.redirectUrl` exists | Moves value to `res.locals.redirectUrl`, removes from session. | `POST /login` | Ensures redirect to originally requested URL upon login. |
| `isOwner` | `middleware.js:23` | Listing's `owner_id === req.user.id` | Flashes error "You don't have permission to alter this listing", redirects `302 -> /listings/:id`. | `GET /listings/:id/edit`, `PUT /listings/:id`, `DELETE /listings/:id` | Enforces ownership before mutation. |
| `isReviewOwner` | `middleware.js:42` | Review's `user_id === req.user.id` | Flashes error "You don't have permission to modify this review", redirects `302 -> /listings/:id`. | `DELETE /listings/:id/reviews/:reviewId` | Restricts review deletion to original author. |
| `isApprovedOwner` | `middleware.js:65` | `user.role === 'owner' && user.ownerStatus === 'approved'` | Redirects non-owners to `/listings`. Redirects pending, rejected, or info_requested owners to `/owner/status` with custom flash message. | `GET /listings/new`, `POST /listings`, `GET /listings/:id/edit`, `PUT /listings/:id`, `DELETE /listings/:id` | **Positive comparison:** Uses `user.ownerStatus === 'approved'`. Cannot leak unexpected statuses. |
| `requireRole(...roles)` | `middleware.js:97` | `roles.includes(req.user.role)` | If unauthenticated: redirects `302 -> /login`. If wrong role: flashes error "You don't have permission to do that.", redirects `302 -> /listings`. | `/admin/owners/*`, `/owner/*`, `/dashboard/approvals/*`, `/dashboard/users/*`, `/dashboard/bookings` | Multi-role authorization guard. |
| `validateListing` | `utils/validateListing.js:11` | Joi `listingSchema` validation | Renders 400 `ExpressError` with comma-delimited detail messages. | `POST /listings`, `PUT /listings/:id` | Server-side validation for accommodation listings. |
| `validateReview` | `utils/validateReview.js:11` | Joi `reviewSchema` validation | Renders 400 `ExpressError` with detail message. | `POST /listings/:id/reviews` | Validates rating (1-5) and comment presence. |
| `validateUser` | `utils/validateUser.js:17` | Role validation, password constraints (min 8, upper, lower, number, special), business details | Re-renders `views/users/signup.ejs` with field-level inline error messages and retained values. | `POST /signup` | Validates registration input without losing form state. |
| `validateOwnerApplication` | `utils/validateUser.js:82` | Business name, category (`hotel_owner`, `property_owner`, etc.), phone pattern | Flashes error message and redirects `302 -> /owner/status`. | `POST /owner/application` | Validates re-application and new owner business applications. |
| `signupUpload` | `cloudConfig.js:73` | Multer fields: avatar (max 1, 2MB), legalDocuments (max 5, 5MB each) | Captures upload errors in `req.uploadError` or `req.avatarUploadError`; passes control to next middleware without crashing. | `POST /signup` | File limit and MIME type validation. |
| `ownerDocUpload` | `cloudConfig.js:95` | Multer fields: legalDocuments (max 5, 5MB each) | Captures error in `req.uploadError`; passes to controller. | `POST /owner/application` | Validates document count, file sizes, and MIME types. |

---

## 3. Permission Matrix

| Page / Action | Guest (Unauthenticated) | Customer | Owner (Pending) | Owner (Info Requested) | Owner (Approved) | Owner (Rejected) | Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **GET /** (Landing) | 200 (Landing) | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` |
| **GET /listings** (Catalog) | 200 | 200 | 200 | 200 | 200 | 200 | 200 |
| **GET /listings/:id** (Show) | 200 | 200 | 200 | 200 | 200 | 200 | 200 |
| **GET /signup**, **GET /login** | 200 | 200 | 200 | 200 | 200 | 200 | 200 |
| **POST /signup**, **POST /login** | Executes | Executes | Executes | Executes | Executes | Executes | Executes |
| **GET /logout** | 302 -> `/listings` | Terminates | Terminates | Terminates | Terminates | Terminates | Terminates |
| **POST /wishlist/:id** | 302 -> `/login` | 200 / 302 | 200 / 302 | 200 / 302 | 200 / 302 | 200 / 302 | 200 / 302 |
| **POST /listings/:id/reviews** | 302 -> `/login` | Allowed | Allowed | Allowed | Allowed | Allowed | Allowed |
| **DELETE /reviews/:id** | 302 -> `/login` | Own only | Own only | Own only | Own only | Own only | Own only ⚠️ |
| **GET /listings/new** | 302 -> `/login` | 302 -> `/listings` | 302 -> `/owner/status` | 302 -> `/owner/status` | **200 (Form)** | 302 -> `/owner/status` | 302 -> `/listings` |
| **POST /listings** | 302 -> `/login` | 302 -> `/listings` | 302 -> `/owner/status` | 302 -> `/owner/status` | **Allowed** | 302 -> `/owner/status` | 302 -> `/listings` |
| **GET /listings/:id/edit** | 302 -> `/login` | 302 -> `/listings` | 302 -> `/owner/status` | 302 -> `/owner/status` | **Own only** | 302 -> `/owner/status` | 302 -> `/listings` |
| **PUT /listings/:id** | 302 -> `/login` | 302 -> `/listings` | 302 -> `/owner/status` | 302 -> `/owner/status` | **Own only** | 302 -> `/owner/status` | 302 -> `/listings` |
| **DELETE /listings/:id** | 302 -> `/login` | 302 -> `/listings` | 302 -> `/owner/status` | 302 -> `/owner/status` | **Own only** | 302 -> `/owner/status` | 302 -> `/listings` |
| **GET /owner/status** | 302 -> `/login` | 302 -> `/listings` | **200** | **200** | **200** | **200** | 302 -> `/listings` |
| **POST /owner/application** | 302 -> `/login` | 302 -> `/listings` | 302 (Flash Info) | **Allowed (Resubmit)** | 302 (Flash Info) | **Allowed (Re-apply)**| 302 -> `/listings` |
| **GET /dashboard** | 302 -> `/login` | 302 -> `/wishlist` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/approvals`|
| **GET /dashboard/profile** | 302 -> `/login` | 200 | 200 | 200 | 200 | 200 | 200 |
| **PUT /dashboard/profile** | 302 -> `/login` | Allowed | Allowed | Allowed | Allowed | Allowed | Allowed |
| **GET /dashboard/wishlist** | 302 -> `/login` | 200 | 200 | 200 | 200 | 200 | 200 |
| **GET /dashboard/bookings** | 302 -> `/login` | **200 (Placeholder)** | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` |
| **GET /dashboard/listings** | 302 -> `/login` | 302 -> `/listings` | **200 (Own)** | **200 (Own)** | **200 (Own)** | **200 (Own)** | **200 (All)** |
| **GET /dashboard/approvals**| 302 -> `/login` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` | **200 (Full Console)**|
| **POST /dashboard/approvals/:id/approve** | 302 -> `/login` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` | **Allowed** |
| **POST /dashboard/approvals/:id/reject** | 302 -> `/login` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` | **Allowed** |
| **POST /dashboard/approvals/:id/request-info**| 302 -> `/login` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` | **Allowed** |
| **GET /dashboard/users** | 302 -> `/login` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` | **200 (Users Table)**|
| **GET /dashboard/users/:id**| 302 -> `/login` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` | **200 (User Detail)** |
| **DELETE /dashboard/users/:id** | 302 -> `/login` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` | **Allowed (Protected)**|
| **DELETE /dashboard/users/:u/listings/:l** | 302 -> `/login` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` | 302 -> `/listings` | **Allowed** |

*Note on Review Deletion:* `isReviewOwner` strictly restricts deletion to the user who wrote the review (`middleware.js:52`). An admin cannot delete another user's review through the standard review route unless implemented in moderation.

