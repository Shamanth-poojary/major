# WanderLust Database Inventory (Phase 1 Audit)

**Database:** `wanderlust_norm`  
**Generated At:** 2026-11-09T04:07:09.573Z  

---

## 1. Tables, Storage Engines, Collations & Row Counts

| Table Name | Engine | Collation | Approx Row Count |
|---|---|---|---|
| `amenities` | InnoDB | utf8mb4_0900_ai_ci | 21 |
| `booking_rooms` | InnoDB | utf8mb4_0900_ai_ci | 4 |
| `booking_summary` | VIEW | N/A | 3 |
| `bookings` | InnoDB | utf8mb4_0900_ai_ci | 3 |
| `listing_payment_policy` | InnoDB | utf8mb4_0900_ai_ci | 55 |
| `listings` | InnoDB | utf8mb4_0900_ai_ci | 56 |
| `owner_documents` | InnoDB | utf8mb4_0900_ai_ci | 4 |
| `owner_profile` | InnoDB | utf8mb4_0900_ai_ci | 16 |
| `payments` | InnoDB | utf8mb4_0900_ai_ci | 2 |
| `reviews` | InnoDB | utf8mb4_0900_ai_ci | 3 |
| `room_type_amenities` | InnoDB | utf8mb4_0900_ai_ci | 807 |
| `room_type_images` | InnoDB | utf8mb4_0900_ai_ci | 134 |
| `room_types` | InnoDB | utf8mb4_0900_ai_ci | 134 |
| `users` | InnoDB | utf8mb4_0900_ai_ci | 25 |
| `wishlists` | InnoDB | utf8mb4_0900_ai_ci | 6 |

---

## 2. Columns Breakdown

### Table: `amenities`

| Pos | Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|---|
| 1 | `id` | `int unsigned` | NO | NULL | PRI | auto_increment |
| 2 | `name` | `varchar(100)` | NO | NULL | UNI | - |
| 3 | `icon` | `varchar(100)` | YES | NULL | - | - |
| 4 | `created_at` | `timestamp` | NO | `CURRENT_TIMESTAMP` | - | DEFAULT_GENERATED |

### Table: `booking_rooms`

| Pos | Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|---|
| 1 | `booking_id` | `int unsigned` | NO | NULL | PRI | - |
| 2 | `room_type_id` | `int unsigned` | NO | NULL | PRI | - |
| 3 | `quantity` | `int unsigned` | NO | `1` | - | - |
| 4 | `unit_price` | `decimal(10,2)` | NO | NULL | - | - |

### Table: `booking_summary`

| Pos | Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|---|
| 1 | `booking_id` | `int unsigned` | NO | `0` | - | - |
| 2 | `booking_ref` | `varchar(32)` | NO | NULL | - | - |
| 3 | `customer_id` | `int unsigned` | NO | NULL | - | - |
| 4 | `listing_id` | `int unsigned` | NO | NULL | - | - |
| 5 | `check_in` | `date` | NO | NULL | - | - |
| 6 | `check_out` | `date` | NO | NULL | - | - |
| 7 | `adults` | `int unsigned` | NO | `1` | - | - |
| 8 | `children` | `int unsigned` | NO | `0` | - | - |
| 9 | `contact_phone` | `varchar(20)` | NO | NULL | - | - |
| 10 | `special_requests` | `text` | YES | NULL | - | - |
| 11 | `total_amount` | `decimal(10,2)` | NO | NULL | - | - |
| 12 | `advance_required` | `decimal(10,2)` | NO | NULL | - | - |
| 13 | `booking_status` | `enum('pending_payment','confirmed','cancelled','expired','completed')` | NO | `pending_payment` | - | - |
| 14 | `hold_expires_at` | `datetime` | YES | NULL | - | - |
| 15 | `created_at` | `timestamp` | NO | `CURRENT_TIMESTAMP` | - | DEFAULT_GENERATED |
| 16 | `updated_at` | `timestamp` | NO | `CURRENT_TIMESTAMP` | - | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| 17 | `amount_paid` | `decimal(32,2)` | NO | `0.00` | - | - |
| 18 | `balance_due` | `decimal(33,2)` | NO | `0.00` | - | - |
| 19 | `payment_status` | `varchar(14)` | NO | `` | - | - |

### Table: `bookings`

| Pos | Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|---|
| 1 | `id` | `int unsigned` | NO | NULL | PRI | auto_increment |
| 2 | `booking_ref` | `varchar(32)` | NO | NULL | UNI | - |
| 3 | `customer_id` | `int unsigned` | NO | NULL | MUL | - |
| 4 | `listing_id` | `int unsigned` | NO | NULL | MUL | - |
| 5 | `check_in` | `date` | NO | NULL | - | - |
| 6 | `check_out` | `date` | NO | NULL | - | - |
| 7 | `adults` | `int unsigned` | NO | `1` | - | - |
| 8 | `children` | `int unsigned` | NO | `0` | - | - |
| 9 | `contact_phone` | `varchar(20)` | NO | NULL | - | - |
| 10 | `special_requests` | `text` | YES | NULL | - | - |
| 11 | `total_amount` | `decimal(10,2)` | NO | NULL | - | - |
| 12 | `advance_required` | `decimal(10,2)` | NO | NULL | - | - |
| 13 | `status` | `enum('pending_payment','confirmed','cancelled','expired','completed')` | NO | `pending_payment` | MUL | - |
| 14 | `hold_expires_at` | `datetime` | YES | NULL | - | - |
| 15 | `created_at` | `timestamp` | NO | `CURRENT_TIMESTAMP` | - | DEFAULT_GENERATED |
| 16 | `updated_at` | `timestamp` | NO | `CURRENT_TIMESTAMP` | - | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

### Table: `listing_payment_policy`

| Pos | Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|---|
| 1 | `listing_id` | `int unsigned` | NO | NULL | PRI | - |
| 2 | `allow_advance` | `tinyint(1)` | NO | `1` | - | - |
| 3 | `advance_type` | `enum('fixed','percent')` | NO | `percent` | - | - |
| 4 | `advance_value` | `decimal(10,2)` | NO | `25.00` | - | - |
| 5 | `created_at` | `timestamp` | NO | `CURRENT_TIMESTAMP` | - | DEFAULT_GENERATED |
| 6 | `updated_at` | `timestamp` | NO | `CURRENT_TIMESTAMP` | - | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

### Table: `listings`

| Pos | Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|---|
| 1 | `listing_id` | `int unsigned` | NO | NULL | PRI | auto_increment |
| 2 | `owner_id` | `int unsigned` | NO | NULL | MUL | - |
| 3 | `title` | `varchar(255)` | NO | NULL | - | - |
| 4 | `description` | `text` | NO | NULL | - | - |
| 5 | `price` | `decimal(10,2)` | NO | NULL | - | - |
| 6 | `location` | `varchar(255)` | NO | NULL | - | - |
| 7 | `country` | `varchar(100)` | NO | NULL | - | - |
| 8 | `latitude` | `decimal(9,6)` | YES | NULL | - | - |
| 9 | `longitude` | `decimal(9,6)` | YES | NULL | - | - |
| 10 | `image_url` | `varchar(500)` | NO | NULL | - | - |
| 11 | `image_filename` | `varchar(255)` | YES | NULL | - | - |
| 12 | `created_at` | `timestamp` | NO | `CURRENT_TIMESTAMP` | - | DEFAULT_GENERATED |

### Table: `owner_documents`

| Pos | Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|---|
| 1 | `document_id` | `int unsigned` | NO | NULL | PRI | auto_increment |
| 2 | `owner_id` | `int unsigned` | NO | NULL | MUL | - |
| 3 | `file_url` | `varchar(500)` | NO | NULL | - | - |
| 4 | `public_id` | `varchar(255)` | YES | NULL | - | - |
| 5 | `original_name` | `varchar(255)` | YES | NULL | - | - |
| 6 | `mime_type` | `varchar(100)` | YES | NULL | - | - |
| 7 | `file_size` | `int unsigned` | YES | NULL | - | - |
| 8 | `resource_type` | `varchar(50)` | YES | NULL | - | - |
| 9 | `uploaded_at` | `timestamp` | NO | `CURRENT_TIMESTAMP` | - | DEFAULT_GENERATED |

### Table: `owner_profile`

| Pos | Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|---|
| 1 | `owner_id` | `int unsigned` | NO | NULL | PRI | - |
| 2 | `business_name` | `varchar(100)` | NO | NULL | - | - |
| 3 | `business_type` | `enum('hotel_owner','property_owner','venue_owner','event_planner')` | NO | NULL | - | - |
| 4 | `phone` | `varchar(20)` | YES | NULL | - | - |
| 5 | `verification_status` | `enum('pending','approved','rejected','info_requested')` | NO | `pending` | MUL | - |
| 6 | `rejection_reason` | `varchar(500)` | YES | NULL | - | - |
| 7 | `verification_note` | `varchar(500)` | YES | NULL | - | - |
| 8 | `verified_at` | `timestamp` | YES | NULL | - | - |
| 9 | `created_at` | `timestamp` | NO | `CURRENT_TIMESTAMP` | - | DEFAULT_GENERATED |
| 10 | `updated_at` | `timestamp` | NO | `CURRENT_TIMESTAMP` | - | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

### Table: `payments`

| Pos | Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|---|
| 1 | `id` | `int unsigned` | NO | NULL | PRI | auto_increment |
| 2 | `booking_id` | `int unsigned` | NO | NULL | MUL | - |
| 3 | `gateway_order_id` | `varchar(64)` | NO | NULL | UNI | - |
| 4 | `gateway_payment_id` | `varchar(64)` | YES | NULL | - | - |
| 5 | `purpose` | `enum('advance','balance','full')` | NO | NULL | - | - |
| 6 | `amount` | `decimal(10,2)` | NO | NULL | - | - |
| 7 | `method` | `enum('card','upi','netbanking')` | NO | NULL | - | - |
| 8 | `card_network` | `varchar(30)` | YES | NULL | - | - |
| 9 | `card_last4` | `varchar(4)` | YES | NULL | - | - |
| 10 | `status` | `enum('created','processing','success','failed')` | NO | `created` | MUL | - |
| 11 | `failure_reason` | `varchar(255)` | YES | NULL | - | - |
| 12 | `idempotency_key` | `varchar(128)` | NO | NULL | UNI | - |
| 13 | `created_at` | `timestamp` | NO | `CURRENT_TIMESTAMP` | - | DEFAULT_GENERATED |
| 14 | `paid_at` | `timestamp` | YES | NULL | - | - |

### Table: `reviews`

| Pos | Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|---|
| 1 | `review_id` | `int unsigned` | NO | NULL | PRI | auto_increment |
| 2 | `listing_id` | `int unsigned` | NO | NULL | MUL | - |
| 3 | `user_id` | `int unsigned` | NO | NULL | MUL | - |
| 4 | `rating` | `tinyint` | NO | NULL | - | - |
| 5 | `comment` | `text` | NO | NULL | - | - |
| 6 | `created_at` | `timestamp` | NO | `CURRENT_TIMESTAMP` | - | DEFAULT_GENERATED |

### Table: `room_type_amenities`

| Pos | Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|---|
| 1 | `room_type_id` | `int unsigned` | NO | NULL | PRI | - |
| 2 | `amenity_id` | `int unsigned` | NO | NULL | PRI | - |

### Table: `room_type_images`

| Pos | Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|---|
| 1 | `id` | `int unsigned` | NO | NULL | PRI | auto_increment |
| 2 | `room_type_id` | `int unsigned` | NO | NULL | MUL | - |
| 3 | `url` | `varchar(500)` | NO | NULL | - | - |
| 4 | `public_id` | `varchar(255)` | YES | NULL | - | - |
| 5 | `sort_order` | `int` | NO | `0` | - | - |
| 6 | `created_at` | `timestamp` | NO | `CURRENT_TIMESTAMP` | - | DEFAULT_GENERATED |

### Table: `room_types`

| Pos | Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|---|
| 1 | `id` | `int unsigned` | NO | NULL | PRI | auto_increment |
| 2 | `listing_id` | `int unsigned` | NO | NULL | MUL | - |
| 3 | `name` | `varchar(150)` | NO | NULL | - | - |
| 4 | `description` | `text` | YES | NULL | - | - |
| 5 | `category` | `enum('standard','deluxe','suite','family','dormitory','entire_property','hall','other')` | NO | `standard` | - | - |
| 6 | `bed_config` | `varchar(100)` | YES | NULL | - | - |
| 7 | `size_sqft` | `int unsigned` | YES | NULL | - | - |
| 8 | `max_guests` | `int unsigned` | NO | `2` | - | - |
| 9 | `price_per_night` | `decimal(10,2)` | NO | NULL | - | - |
| 10 | `total_units` | `int unsigned` | NO | `1` | - | - |
| 11 | `is_active` | `tinyint(1)` | NO | `1` | MUL | - |
| 12 | `is_auto_generated` | `tinyint(1)` | NO | `0` | - | - |
| 13 | `created_at` | `timestamp` | NO | `CURRENT_TIMESTAMP` | - | DEFAULT_GENERATED |
| 14 | `updated_at` | `timestamp` | NO | `CURRENT_TIMESTAMP` | - | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

### Table: `users`

| Pos | Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|---|
| 1 | `user_id` | `int unsigned` | NO | NULL | PRI | auto_increment |
| 2 | `username` | `varchar(50)` | NO | NULL | UNI | - |
| 3 | `email` | `varchar(255)` | NO | NULL | UNI | - |
| 4 | `password_hash` | `varchar(255)` | NO | NULL | - | - |
| 5 | `role` | `enum('customer','owner','admin')` | NO | `customer` | - | - |
| 6 | `created_at` | `timestamp` | NO | `CURRENT_TIMESTAMP` | - | DEFAULT_GENERATED |
| 7 | `admin_flag` | `tinyint` | YES | NULL | UNI | STORED GENERATED |
| 8 | `profile_picture_url` | `varchar(500)` | YES | NULL | - | - |
| 9 | `profile_picture_public_id` | `varchar(255)` | YES | NULL | - | - |
| 10 | `phone` | `varchar(20)` | YES | NULL | - | - |
| 11 | `bio` | `varchar(300)` | YES | NULL | - | - |

### Table: `wishlists`

| Pos | Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|---|
| 1 | `id` | `int unsigned` | NO | NULL | PRI | auto_increment |
| 2 | `user_id` | `int unsigned` | NO | NULL | MUL | - |
| 3 | `listing_id` | `int unsigned` | NO | NULL | MUL | - |
| 4 | `created_at` | `timestamp` | NO | `CURRENT_TIMESTAMP` | - | DEFAULT_GENERATED |

---

## 3. Keys & Foreign Keys

| Table | Constraint Name | Column | Referenced Table | Referenced Column | On Update | On Delete |
|---|---|---|---|---|---|---|
| `booking_rooms` | `fk_br_booking` | `booking_id` | `bookings` | `id` | - | - |
| `booking_rooms` | `fk_br_room_type` | `room_type_id` | `room_types` | `id` | - | - |
| `bookings` | `fk_bookings_customer` | `customer_id` | `users` | `user_id` | - | - |
| `bookings` | `fk_bookings_listing` | `listing_id` | `listings` | `listing_id` | - | - |
| `listing_payment_policy` | `fk_lpp_listing` | `listing_id` | `listings` | `listing_id` | - | - |
| `listings` | `fk_listing_owner` | `owner_id` | `users` | `user_id` | - | - |
| `owner_documents` | `fk_owner_documents_owner` | `owner_id` | `owner_profile` | `owner_id` | - | - |
| `owner_profile` | `fk_owner_profile_user` | `owner_id` | `users` | `user_id` | - | - |
| `payments` | `fk_payments_booking` | `booking_id` | `bookings` | `id` | - | - |
| `reviews` | `fk_review_listing` | `listing_id` | `listings` | `listing_id` | - | - |
| `reviews` | `fk_review_user` | `user_id` | `users` | `user_id` | - | - |
| `room_type_amenities` | `fk_rta_amenity` | `amenity_id` | `amenities` | `id` | - | - |
| `room_type_amenities` | `fk_rta_room_type` | `room_type_id` | `room_types` | `id` | - | - |
| `room_type_images` | `fk_rti_room_type` | `room_type_id` | `room_types` | `id` | - | - |
| `room_types` | `fk_room_types_listing` | `listing_id` | `listings` | `listing_id` | - | - |
| `wishlists` | `fk_wishlist_listing` | `listing_id` | `listings` | `listing_id` | - | - |
| `wishlists` | `fk_wishlist_user` | `user_id` | `users` | `user_id` | - | - |

---

## 4. Constraints (Primary Key, Unique, Check)

| Table | Constraint Name | Type |
|---|---|---|
| `amenities` | `PRIMARY` | PRIMARY KEY |
| `amenities` | `uq_amenities_name` | UNIQUE |
| `booking_rooms` | `chk_booking_rooms_price` | CHECK |
| `booking_rooms` | `chk_booking_rooms_qty` | CHECK |
| `booking_rooms` | `fk_br_booking` | FOREIGN KEY |
| `booking_rooms` | `fk_br_room_type` | FOREIGN KEY |
| `booking_rooms` | `PRIMARY` | PRIMARY KEY |
| `bookings` | `chk_bookings_amounts` | CHECK |
| `bookings` | `chk_bookings_dates` | CHECK |
| `bookings` | `fk_bookings_customer` | FOREIGN KEY |
| `bookings` | `fk_bookings_listing` | FOREIGN KEY |
| `bookings` | `PRIMARY` | PRIMARY KEY |
| `bookings` | `uq_bookings_ref` | UNIQUE |
| `listing_payment_policy` | `chk_lpp_advance_val` | CHECK |
| `listing_payment_policy` | `fk_lpp_listing` | FOREIGN KEY |
| `listing_payment_policy` | `PRIMARY` | PRIMARY KEY |
| `listings` | `chk_listing_lat` | CHECK |
| `listings` | `chk_listing_lng` | CHECK |
| `listings` | `chk_listing_price` | CHECK |
| `listings` | `fk_listing_owner` | FOREIGN KEY |
| `listings` | `PRIMARY` | PRIMARY KEY |
| `owner_documents` | `fk_owner_documents_owner` | FOREIGN KEY |
| `owner_documents` | `PRIMARY` | PRIMARY KEY |
| `owner_profile` | `fk_owner_profile_user` | FOREIGN KEY |
| `owner_profile` | `PRIMARY` | PRIMARY KEY |
| `payments` | `chk_payments_amount` | CHECK |
| `payments` | `fk_payments_booking` | FOREIGN KEY |
| `payments` | `PRIMARY` | PRIMARY KEY |
| `payments` | `uq_payments_idempotency` | UNIQUE |
| `payments` | `uq_payments_order` | UNIQUE |
| `reviews` | `chk_review_rating` | CHECK |
| `reviews` | `fk_review_listing` | FOREIGN KEY |
| `reviews` | `fk_review_user` | FOREIGN KEY |
| `reviews` | `PRIMARY` | PRIMARY KEY |
| `room_type_amenities` | `fk_rta_amenity` | FOREIGN KEY |
| `room_type_amenities` | `fk_rta_room_type` | FOREIGN KEY |
| `room_type_amenities` | `PRIMARY` | PRIMARY KEY |
| `room_type_images` | `fk_rti_room_type` | FOREIGN KEY |
| `room_type_images` | `PRIMARY` | PRIMARY KEY |
| `room_types` | `chk_room_types_guests` | CHECK |
| `room_types` | `chk_room_types_price` | CHECK |
| `room_types` | `chk_room_types_units` | CHECK |
| `room_types` | `fk_room_types_listing` | FOREIGN KEY |
| `room_types` | `PRIMARY` | PRIMARY KEY |
| `users` | `PRIMARY` | PRIMARY KEY |
| `users` | `uq_single_admin` | UNIQUE |
| `users` | `uq_users_email` | UNIQUE |
| `users` | `uq_users_username` | UNIQUE |
| `wishlists` | `fk_wishlist_listing` | FOREIGN KEY |
| `wishlists` | `fk_wishlist_user` | FOREIGN KEY |
| `wishlists` | `PRIMARY` | PRIMARY KEY |
| `wishlists` | `uq_user_listing` | UNIQUE |

### Check Constraints Detail

| Constraint Name | Check Clause |
|---|---|
| `chk_booking_rooms_price` | `(`unit_price` >= 0)` |
| `chk_booking_rooms_qty` | `(`quantity` > 0)` |
| `chk_bookings_amounts` | `((`total_amount` >= 0) and (`advance_required` >= 0))` |
| `chk_bookings_dates` | `(`check_out` > `check_in`)` |
| `chk_lpp_advance_val` | `(`advance_value` >= 0)` |
| `chk_listing_lat` | `((`latitude` is null) or (`latitude` between -(90) and 90))` |
| `chk_listing_lng` | `((`longitude` is null) or (`longitude` between -(180) and 180))` |
| `chk_listing_price` | `(`price` >= 0)` |
| `chk_payments_amount` | `(`amount` >= 0)` |
| `chk_review_rating` | `(`rating` between 1 and 5)` |
| `chk_room_types_guests` | `(`max_guests` > 0)` |
| `chk_room_types_price` | `(`price_per_night` >= 0)` |
| `chk_room_types_units` | `(`total_units` >= 0)` |

---

## 5. Indexes

| Table | Index Name | Non-Unique | Seq | Column |
|---|---|---|---|---|
| `amenities` | `PRIMARY` | UNIQUE (0) | 1 | `id` |
| `amenities` | `uq_amenities_name` | UNIQUE (0) | 1 | `name` |
| `booking_rooms` | `fk_br_room_type` | NON-UNIQUE (1) | 1 | `room_type_id` |
| `booking_rooms` | `PRIMARY` | UNIQUE (0) | 1 | `booking_id` |
| `booking_rooms` | `PRIMARY` | UNIQUE (0) | 2 | `room_type_id` |
| `bookings` | `idx_bookings_customer` | NON-UNIQUE (1) | 1 | `customer_id` |
| `bookings` | `idx_bookings_dates` | NON-UNIQUE (1) | 1 | `listing_id` |
| `bookings` | `idx_bookings_dates` | NON-UNIQUE (1) | 2 | `check_in` |
| `bookings` | `idx_bookings_dates` | NON-UNIQUE (1) | 3 | `check_out` |
| `bookings` | `idx_bookings_status` | NON-UNIQUE (1) | 1 | `status` |
| `bookings` | `PRIMARY` | UNIQUE (0) | 1 | `id` |
| `bookings` | `uq_bookings_ref` | UNIQUE (0) | 1 | `booking_ref` |
| `listing_payment_policy` | `PRIMARY` | UNIQUE (0) | 1 | `listing_id` |
| `listings` | `idx_listings_owner` | NON-UNIQUE (1) | 1 | `owner_id` |
| `listings` | `PRIMARY` | UNIQUE (0) | 1 | `listing_id` |
| `owner_documents` | `idx_owner_documents_owner` | NON-UNIQUE (1) | 1 | `owner_id` |
| `owner_documents` | `PRIMARY` | UNIQUE (0) | 1 | `document_id` |
| `owner_profile` | `idx_owner_profile_status` | NON-UNIQUE (1) | 1 | `verification_status` |
| `owner_profile` | `PRIMARY` | UNIQUE (0) | 1 | `owner_id` |
| `payments` | `idx_payments_booking` | NON-UNIQUE (1) | 1 | `booking_id` |
| `payments` | `idx_payments_status` | NON-UNIQUE (1) | 1 | `status` |
| `payments` | `PRIMARY` | UNIQUE (0) | 1 | `id` |
| `payments` | `uq_payments_idempotency` | UNIQUE (0) | 1 | `idempotency_key` |
| `payments` | `uq_payments_order` | UNIQUE (0) | 1 | `gateway_order_id` |
| `reviews` | `fk_review_user` | NON-UNIQUE (1) | 1 | `user_id` |
| `reviews` | `idx_reviews_listing` | NON-UNIQUE (1) | 1 | `listing_id` |
| `reviews` | `PRIMARY` | UNIQUE (0) | 1 | `review_id` |
| `room_type_amenities` | `fk_rta_amenity` | NON-UNIQUE (1) | 1 | `amenity_id` |
| `room_type_amenities` | `PRIMARY` | UNIQUE (0) | 1 | `room_type_id` |
| `room_type_amenities` | `PRIMARY` | UNIQUE (0) | 2 | `amenity_id` |
| `room_type_images` | `idx_rti_room_type` | NON-UNIQUE (1) | 1 | `room_type_id` |
| `room_type_images` | `PRIMARY` | UNIQUE (0) | 1 | `id` |
| `room_types` | `idx_room_types_active` | NON-UNIQUE (1) | 1 | `is_active` |
| `room_types` | `idx_room_types_listing` | NON-UNIQUE (1) | 1 | `listing_id` |
| `room_types` | `PRIMARY` | UNIQUE (0) | 1 | `id` |
| `users` | `PRIMARY` | UNIQUE (0) | 1 | `user_id` |
| `users` | `uq_single_admin` | UNIQUE (0) | 1 | `admin_flag` |
| `users` | `uq_users_email` | UNIQUE (0) | 1 | `email` |
| `users` | `uq_users_username` | UNIQUE (0) | 1 | `username` |
| `wishlists` | `idx_wishlists_listing` | NON-UNIQUE (1) | 1 | `listing_id` |
| `wishlists` | `PRIMARY` | UNIQUE (0) | 1 | `id` |
| `wishlists` | `uq_user_listing` | UNIQUE (0) | 1 | `user_id` |
| `wishlists` | `uq_user_listing` | UNIQUE (0) | 2 | `listing_id` |

---

## 6. DDL Definitions (SHOW CREATE TABLE)

### Table: `amenities`

```sql
CREATE TABLE `amenities` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `icon` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_amenities_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

### Table: `booking_rooms`

```sql
CREATE TABLE `booking_rooms` (
  `booking_id` int unsigned NOT NULL,
  `room_type_id` int unsigned NOT NULL,
  `quantity` int unsigned NOT NULL DEFAULT '1',
  `unit_price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`booking_id`,`room_type_id`),
  KEY `fk_br_room_type` (`room_type_id`),
  CONSTRAINT `fk_br_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_br_room_type` FOREIGN KEY (`room_type_id`) REFERENCES `room_types` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_booking_rooms_price` CHECK ((`unit_price` >= 0)),
  CONSTRAINT `chk_booking_rooms_qty` CHECK ((`quantity` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

### View: `booking_summary`

```sql
CREATE ALGORITHM=UNDEFINED DEFINER=`wanderlust_user`@`localhost` SQL SECURITY DEFINER VIEW `booking_summary` AS select `b`.`id` AS `booking_id`,`b`.`booking_ref` AS `booking_ref`,`b`.`customer_id` AS `customer_id`,`b`.`listing_id` AS `listing_id`,`b`.`check_in` AS `check_in`,`b`.`check_out` AS `check_out`,`b`.`adults` AS `adults`,`b`.`children` AS `children`,`b`.`contact_phone` AS `contact_phone`,`b`.`special_requests` AS `special_requests`,`b`.`total_amount` AS `total_amount`,`b`.`advance_required` AS `advance_required`,`b`.`status` AS `booking_status`,`b`.`hold_expires_at` AS `hold_expires_at`,`b`.`created_at` AS `created_at`,`b`.`updated_at` AS `updated_at`,coalesce(sum((case when (`p`.`status` = 'success') then `p`.`amount` else 0 end)),0.00) AS `amount_paid`,greatest(0.00,(`b`.`total_amount` - coalesce(sum((case when (`p`.`status` = 'success') then `p`.`amount` else 0 end)),0.00))) AS `balance_due`,(case when (coalesce(sum((case when (`p`.`status` = 'success') then `p`.`amount` else 0 end)),0.00) = 0) then 'unpaid' when (coalesce(sum((case when (`p`.`status` = 'success') then `p`.`amount` else 0 end)),0.00) >= `b`.`total_amount`) then 'paid' else 'partially_paid' end) AS `payment_status` from (`bookings` `b` left join `payments` `p` on((`p`.`booking_id` = `b`.`id`))) group by `b`.`id`
```

### Table: `bookings`

```sql
CREATE TABLE `bookings` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `booking_ref` varchar(32) NOT NULL,
  `customer_id` int unsigned NOT NULL,
  `listing_id` int unsigned NOT NULL,
  `check_in` date NOT NULL,
  `check_out` date NOT NULL,
  `adults` int unsigned NOT NULL DEFAULT '1',
  `children` int unsigned NOT NULL DEFAULT '0',
  `contact_phone` varchar(20) NOT NULL,
  `special_requests` text,
  `total_amount` decimal(10,2) NOT NULL,
  `advance_required` decimal(10,2) NOT NULL,
  `status` enum('pending_payment','confirmed','cancelled','expired','completed') NOT NULL DEFAULT 'pending_payment',
  `hold_expires_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_bookings_ref` (`booking_ref`),
  KEY `idx_bookings_dates` (`listing_id`,`check_in`,`check_out`),
  KEY `idx_bookings_customer` (`customer_id`),
  KEY `idx_bookings_status` (`status`),
  CONSTRAINT `fk_bookings_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_bookings_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`listing_id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_bookings_amounts` CHECK (((`total_amount` >= 0) and (`advance_required` >= 0))),
  CONSTRAINT `chk_bookings_dates` CHECK ((`check_out` > `check_in`))
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

### Table: `listing_payment_policy`

```sql
CREATE TABLE `listing_payment_policy` (
  `listing_id` int unsigned NOT NULL,
  `allow_advance` tinyint(1) NOT NULL DEFAULT '1',
  `advance_type` enum('fixed','percent') NOT NULL DEFAULT 'percent',
  `advance_value` decimal(10,2) NOT NULL DEFAULT '25.00',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`listing_id`),
  CONSTRAINT `fk_lpp_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`listing_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_lpp_advance_val` CHECK ((`advance_value` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

### Table: `listings`

```sql
CREATE TABLE `listings` (
  `listing_id` int unsigned NOT NULL AUTO_INCREMENT,
  `owner_id` int unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `location` varchar(255) NOT NULL,
  `country` varchar(100) NOT NULL,
  `latitude` decimal(9,6) DEFAULT NULL,
  `longitude` decimal(9,6) DEFAULT NULL,
  `image_url` varchar(500) NOT NULL,
  `image_filename` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`listing_id`),
  KEY `idx_listings_owner` (`owner_id`),
  CONSTRAINT `fk_listing_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_listing_lat` CHECK (((`latitude` is null) or (`latitude` between -(90) and 90))),
  CONSTRAINT `chk_listing_lng` CHECK (((`longitude` is null) or (`longitude` between -(180) and 180))),
  CONSTRAINT `chk_listing_price` CHECK ((`price` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=144 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

### Table: `owner_documents`

```sql
CREATE TABLE `owner_documents` (
  `document_id` int unsigned NOT NULL AUTO_INCREMENT,
  `owner_id` int unsigned NOT NULL,
  `file_url` varchar(500) NOT NULL,
  `public_id` varchar(255) DEFAULT NULL,
  `original_name` varchar(255) DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `file_size` int unsigned DEFAULT NULL,
  `resource_type` varchar(50) DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`document_id`),
  KEY `idx_owner_documents_owner` (`owner_id`),
  CONSTRAINT `fk_owner_documents_owner` FOREIGN KEY (`owner_id`) REFERENCES `owner_profile` (`owner_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

### Table: `owner_profile`

```sql
CREATE TABLE `owner_profile` (
  `owner_id` int unsigned NOT NULL,
  `business_name` varchar(100) NOT NULL,
  `business_type` enum('hotel_owner','property_owner','venue_owner','event_planner') NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `verification_status` enum('pending','approved','rejected','info_requested') NOT NULL DEFAULT 'pending',
  `rejection_reason` varchar(500) DEFAULT NULL,
  `verification_note` varchar(500) DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`owner_id`),
  KEY `idx_owner_profile_status` (`verification_status`),
  CONSTRAINT `fk_owner_profile_user` FOREIGN KEY (`owner_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

### Table: `payments`

```sql
CREATE TABLE `payments` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `booking_id` int unsigned NOT NULL,
  `gateway_order_id` varchar(64) NOT NULL,
  `gateway_payment_id` varchar(64) DEFAULT NULL,
  `purpose` enum('advance','balance','full') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `method` enum('card','upi','netbanking') NOT NULL,
  `card_network` varchar(30) DEFAULT NULL,
  `card_last4` varchar(4) DEFAULT NULL,
  `status` enum('created','processing','success','failed') NOT NULL DEFAULT 'created',
  `failure_reason` varchar(255) DEFAULT NULL,
  `idempotency_key` varchar(128) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `paid_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payments_order` (`gateway_order_id`),
  UNIQUE KEY `uq_payments_idempotency` (`idempotency_key`),
  KEY `idx_payments_booking` (`booking_id`),
  KEY `idx_payments_status` (`status`),
  CONSTRAINT `fk_payments_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_payments_amount` CHECK ((`amount` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

### Table: `reviews`

```sql
CREATE TABLE `reviews` (
  `review_id` int unsigned NOT NULL AUTO_INCREMENT,
  `listing_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `rating` tinyint NOT NULL,
  `comment` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`review_id`),
  KEY `fk_review_user` (`user_id`),
  KEY `idx_reviews_listing` (`listing_id`),
  CONSTRAINT `fk_review_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`listing_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_review_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_review_rating` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

### Table: `room_type_amenities`

```sql
CREATE TABLE `room_type_amenities` (
  `room_type_id` int unsigned NOT NULL,
  `amenity_id` int unsigned NOT NULL,
  PRIMARY KEY (`room_type_id`,`amenity_id`),
  KEY `fk_rta_amenity` (`amenity_id`),
  CONSTRAINT `fk_rta_amenity` FOREIGN KEY (`amenity_id`) REFERENCES `amenities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rta_room_type` FOREIGN KEY (`room_type_id`) REFERENCES `room_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

### Table: `room_type_images`

```sql
CREATE TABLE `room_type_images` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `room_type_id` int unsigned NOT NULL,
  `url` varchar(500) NOT NULL,
  `public_id` varchar(255) DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rti_room_type` (`room_type_id`),
  CONSTRAINT `fk_rti_room_type` FOREIGN KEY (`room_type_id`) REFERENCES `room_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=135 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

### Table: `room_types`

```sql
CREATE TABLE `room_types` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `listing_id` int unsigned NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text,
  `category` enum('standard','deluxe','suite','family','dormitory','entire_property','hall','other') NOT NULL DEFAULT 'standard',
  `bed_config` varchar(100) DEFAULT NULL,
  `size_sqft` int unsigned DEFAULT NULL,
  `max_guests` int unsigned NOT NULL DEFAULT '2',
  `price_per_night` decimal(10,2) NOT NULL,
  `total_units` int unsigned NOT NULL DEFAULT '1',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_auto_generated` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_room_types_listing` (`listing_id`),
  KEY `idx_room_types_active` (`is_active`),
  CONSTRAINT `fk_room_types_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`listing_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_room_types_guests` CHECK ((`max_guests` > 0)),
  CONSTRAINT `chk_room_types_price` CHECK ((`price_per_night` >= 0)),
  CONSTRAINT `chk_room_types_units` CHECK ((`total_units` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=148 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

### Table: `users`

```sql
CREATE TABLE `users` (
  `user_id` int unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('customer','owner','admin') NOT NULL DEFAULT 'customer',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `admin_flag` tinyint GENERATED ALWAYS AS (if((`role` = _utf8mb4'admin'),1,NULL)) STORED,
  `profile_picture_url` varchar(500) DEFAULT NULL,
  `profile_picture_public_id` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `bio` varchar(300) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_users_username` (`username`),
  UNIQUE KEY `uq_users_email` (`email`),
  UNIQUE KEY `uq_single_admin` (`admin_flag`)
) ENGINE=InnoDB AUTO_INCREMENT=79 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

### Table: `wishlists`

```sql
CREATE TABLE `wishlists` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `listing_id` int unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_listing` (`user_id`,`listing_id`),
  KEY `idx_wishlists_listing` (`listing_id`),
  CONSTRAINT `fk_wishlist_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`listing_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wishlist_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```


---

## 7. Sample Data (LIMIT 20, masked passwords & emails)

### Table `amenities` (20 rows preview)

| id | name | icon | created_at |
| --- | --- | --- | --- |
| 1 | Free High-Speed WiFi | fa-solid fa-wifi | Mon Nov 09 2026 00:06:10 GMT+0530 (India Standard  |
| 2 | Air Conditioning | fa-solid fa-snowflake | Mon Nov 09 2026 00:06:10 GMT+0530 (India Standard  |
| 3 | Smart TV with Streaming | fa-solid fa-tv | Mon Nov 09 2026 00:06:10 GMT+0530 (India Standard  |
| 4 | Dedicated Workspace | fa-solid fa-laptop | Mon Nov 09 2026 00:06:10 GMT+0530 (India Standard  |
| 5 | Hot Water & Shower | fa-solid fa-shower | Mon Nov 09 2026 00:06:10 GMT+0530 (India Standard  |
| 6 | Free Parking on Premises | fa-solid fa-square-parking | Mon Nov 09 2026 00:06:10 GMT+0530 (India Standard  |
| 7 | Complimentary Breakfast | fa-solid fa-utensils | Mon Nov 09 2026 00:06:10 GMT+0530 (India Standard  |
| 8 | Balcony / Terrace | fa-solid fa-mountain-sun | Mon Nov 09 2026 00:06:10 GMT+0530 (India Standard  |
| 9 | Swimming Pool Access | fa-solid fa-person-swimming | Mon Nov 09 2026 00:06:10 GMT+0530 (India Standard  |
| 10 | Equipped Kitchenette | fa-solid fa-kitchen-set | Mon Nov 09 2026 00:06:10 GMT+0530 (India Standard  |
| 11 | Electric Generator / Power Backup | fa-solid fa-bolt | Mon Nov 09 2026 00:06:10 GMT+0530 (India Standard  |
| 12 | 24/7 Room Service & Concierge | fa-solid fa-bell-concierge | Mon Nov 09 2026 00:06:10 GMT+0530 (India Standard  |
| 13 | Conference Projector & AV Screen | fa-solid fa-video | Mon Nov 09 2026 00:06:10 GMT+0530 (India Standard  |
| 14 | Pro PA Sound & Stage Lighting | fa-solid fa-volume-high | Mon Nov 09 2026 00:06:10 GMT+0530 (India Standard  |
| 15 | Raised Speaker Stage & Podium | fa-solid fa-chalkboard-user | Mon Nov 09 2026 00:06:10 GMT+0530 (India Standard  |
| 16 | Banquet Catering Kitchen & Dining | fa-solid fa-champagne-glasses | Mon Nov 09 2026 00:06:10 GMT+0530 (India Standard  |
| 17 | Hot Water | NULL | Mon Nov 09 2026 09:09:43 GMT+0530 (India Standard  |
| 18 | Smart TV | NULL | Mon Nov 09 2026 09:09:43 GMT+0530 (India Standard  |
| 19 | Balcony | NULL | Mon Nov 09 2026 09:09:43 GMT+0530 (India Standard  |
| 20 | Living Lounge | NULL | Mon Nov 09 2026 09:09:43 GMT+0530 (India Standard  |

### Table `booking_rooms` (4 rows preview)

| booking_id | room_type_id | quantity | unit_price |
| --- | --- | --- | --- |
| 17 | 129 | 1 | 16000.00 |
| 22 | 129 | 1 | 16000.00 |
| 29 | 145 | 1 | 2500.00 |
| 29 | 146 | 1 | 3250.00 |

### Table `bookings` (3 rows preview)

| id | booking_ref | customer_id | listing_id | check_in | check_out | adults | children | contact_phone | special_requests | total_amount | advance_required | status | hold_expires_at | created_at | updated_at |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 17 | WL-2026-867331 | 63 | 128 | Tue Nov 10 2026 00:00:00 GMT+0530 (India Standard  | Wed Nov 11 2026 00:00:00 GMT+0530 (India Standard  | 1 | 0 | +91 98765 43210 | NULL | 16000.00 | 4000.00 | expired | Mon Nov 09 2026 07:54:06 GMT+0530 (India Standard  | Mon Nov 09 2026 07:44:05 GMT+0530 (India Standard  | Mon Nov 09 2026 07:54:14 GMT+0530 (India Standard  |
| 22 | WL-2026-924444 | 63 | 128 | Tue Nov 10 2026 00:00:00 GMT+0530 (India Standard  | Wed Nov 11 2026 00:00:00 GMT+0530 (India Standard  | 1 | 0 | +91 98765 43210 | NULL | 16000.00 | 4000.00 | confirmed | NULL | Mon Nov 09 2026 08:01:29 GMT+0530 (India Standard  | Mon Nov 09 2026 08:01:48 GMT+0530 (India Standard  |
| 29 | WL-2026-41EB57 | 63 | 143 | Tue Nov 10 2026 00:00:00 GMT+0530 (India Standard  | Wed Nov 11 2026 00:00:00 GMT+0530 (India Standard  | 1 | 0 | +91 98765 43210 | NULL | 5750.00 | 1437.50 | confirmed | NULL | Mon Nov 09 2026 09:16:26 GMT+0530 (India Standard  | Mon Nov 09 2026 09:16:34 GMT+0530 (India Standard  |

### Table `listing_payment_policy` (20 rows preview)

| listing_id | allow_advance | advance_type | advance_value | created_at | updated_at |
| --- | --- | --- | --- | --- | --- |
| 22 | 1 | percent | 25.00 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 24 | 1 | percent | 25.00 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 25 | 1 | percent | 25.00 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 78 | 1 | percent | 25.00 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 79 | 1 | percent | 25.00 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 80 | 1 | percent | 25.00 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 81 | 1 | percent | 25.00 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 82 | 1 | percent | 25.00 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 83 | 1 | percent | 25.00 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 84 | 1 | percent | 25.00 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 85 | 1 | percent | 25.00 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 86 | 1 | percent | 25.00 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 87 | 1 | percent | 25.00 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 88 | 1 | percent | 25.00 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 89 | 1 | percent | 25.00 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 90 | 1 | percent | 25.00 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 91 | 1 | percent | 25.00 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 92 | 1 | percent | 25.00 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 93 | 1 | percent | 25.00 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 94 | 1 | percent | 25.00 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |

### Table `listings` (20 rows preview)

| listing_id | owner_id | title | description | price | location | country | latitude | longitude | image_url | image_filename | created_at |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 22 | 11 | vintage japanese hotel | old styled vintage japanese hotel | 5000.00 | shibuya | japan | 35.664455 | 139.698780 | https://res.cloudinary.com/dkg3y5byr/image/upload/ | wanderlust/wmffnao6oubsu1p5szi7 | Sun Oct 04 2026 22:33:40 GMT+0530 (India Standard  |
| 24 | 16 | shashank | hii | 150.00 | bengaluru | India | 12.979101 | 77.591301 | https://res.cloudinary.com/dkg3y5byr/image/upload/ | wanderlust/a05fosizozitsydp8nwq | Wed Oct 07 2026 10:17:36 GMT+0530 (India Standard  |
| 25 | 11 | grief of the fallen warrior | testtt | 15000.00 | sheshadripuram,bengaluru,560020 | india | 12.979101 | 77.591301 | https://res.cloudinary.com/dkg3y5byr/image/upload/ | wanderlust/frvler3b8iglqggg4hkj | Tue Oct 13 2026 20:42:49 GMT+0530 (India Standard  |
| 78 | 30 | Serene Boutique Suite in Jaipur | Serene Boutique Suite in Jaipur. A comfortable sta | 3500.00 | Jaipur, Rajasthan | India | 26.912400 | 75.787300 | https://picsum.photos/seed/wanderlust-aarav_herita | NULL | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  |
| 79 | 30 | Charming Heritage Room in Udaipur | Charming Heritage Room in Udaipur. A comfortable s | 5650.00 | Udaipur, Rajasthan | India | 24.585400 | 73.712500 | https://picsum.photos/seed/wanderlust-aarav_herita | NULL | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  |
| 80 | 30 | Elegant Deluxe Suite in Jodhpur | Elegant Deluxe Suite in Jodhpur. A comfortable sta | 7750.00 | Jodhpur, Rajasthan | India | 26.238900 | 73.024300 | https://picsum.photos/seed/wanderlust-aarav_herita | NULL | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  |
| 81 | 30 | Sunlit Courtyard Room in Pushkar | Sunlit Courtyard Room in Pushkar. A comfortable st | 9900.00 | Pushkar, Rajasthan | India | 26.489700 | 74.551100 | https://picsum.photos/seed/wanderlust-aarav_herita | NULL | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  |
| 82 | 30 | Secluded Skyline Penthouse in Jaisalmer | Secluded Skyline Penthouse in Jaisalmer. A comfort | 12000.00 | Jaisalmer, Rajasthan | India | 26.915700 | 70.908300 | https://picsum.photos/seed/wanderlust-aarav_herita | NULL | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  |
| 83 | 31 | Charming Private Villa in Madikeri | Charming Private Villa in Madikeri. An entire prop | 2500.00 | Madikeri, Karnataka | India | 12.424400 | 75.738200 | https://picsum.photos/seed/wanderlust-coorg_escape | NULL | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  |
| 84 | 31 | Elegant Cozy Cottage in Sakleshpur | Elegant Cozy Cottage in Sakleshpur. An entire prop | 4150.00 | Sakleshpur, Karnataka | India | 12.941900 | 75.784500 | https://picsum.photos/seed/wanderlust-coorg_escape | NULL | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  |
| 85 | 31 | Sunlit Garden Bungalow in Chikmagalur | Sunlit Garden Bungalow in Chikmagalur. An entire p | 5750.00 | Chikmagalur, Karnataka | India | 13.316100 | 75.772000 | https://picsum.photos/seed/wanderlust-coorg_escape | NULL | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  |
| 86 | 31 | Secluded Family Homestay in Kalpetta | Secluded Family Homestay in Kalpetta. An entire pr | 7400.00 | Kalpetta, Kerala | India | 11.610300 | 76.083000 | https://picsum.photos/seed/wanderlust-coorg_escape | NULL | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  |
| 87 | 31 | Lively Hillside Retreat in Ooty | Lively Hillside Retreat in Ooty. An entire propert | 9000.00 | Ooty, Tamil Nadu | India | 11.410200 | 76.695000 | https://picsum.photos/seed/wanderlust-coorg_escape | NULL | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  |
| 88 | 32 | Elegant Private Villa in Anjuna | Elegant Private Villa in Anjuna. An entire propert | 4000.00 | Anjuna, Goa | India | 15.573600 | 73.741300 | https://picsum.photos/seed/wanderlust-goa_getaways | NULL | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  |
| 89 | 32 | Sunlit Cozy Cottage in Palolem | Sunlit Cozy Cottage in Palolem. An entire property | 6750.00 | Palolem, Goa | India | 15.010000 | 74.023200 | https://picsum.photos/seed/wanderlust-goa_getaways | NULL | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  |
| 90 | 32 | Secluded Garden Bungalow in Candolim | Secluded Garden Bungalow in Candolim. An entire pr | 9500.00 | Candolim, Goa | India | 15.518000 | 73.762000 | https://picsum.photos/seed/wanderlust-goa_getaways | NULL | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  |
| 91 | 32 | Lively Family Homestay in Panaji | Lively Family Homestay in Panaji. An entire proper | 12250.00 | Panaji, Goa | India | 15.490900 | 73.827800 | https://picsum.photos/seed/wanderlust-goa_getaways | NULL | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  |
| 92 | 32 | Modern Hillside Retreat in Morjim | Modern Hillside Retreat in Morjim. An entire prope | 15000.00 | Morjim, Goa | India | 15.631000 | 73.739000 | https://picsum.photos/seed/wanderlust-goa_getaways | NULL | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  |
| 93 | 33 | Sunlit Private Villa in Florence | Sunlit Private Villa in Florence. An entire proper | 150.00 | Florence, Tuscany | Italy | 43.769600 | 11.255800 | https://picsum.photos/seed/wanderlust-tuscany_vill | NULL | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  |
| 94 | 33 | Secluded Cozy Cottage in Siena | Secluded Cozy Cottage in Siena. An entire property | 265.00 | Siena, Tuscany | Italy | 43.318800 | 11.330800 | https://picsum.photos/seed/wanderlust-tuscany_vill | NULL | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  |

### Table `owner_documents` (4 rows preview)

| document_id | owner_id | file_url | public_id | original_name | mime_type | file_size | resource_type | uploaded_at |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 50 | https://res.cloudinary.com/dkg3y5byr/image/upload/ | wanderlust/owner-documents/brwaqyepkbjto6dbrduk | api_sentinel_solution_workflow.png | image/png | 784865 | image | Tue Nov 03 2026 16:47:33 GMT+0530 (India Standard  |
| 2 | 50 | https://res.cloudinary.com/dkg3y5byr/image/upload/ | wanderlust/owner-documents/wixh2xs79cqhk8lnf47s | api_sentinel_system_architecture.png | image/png | 973430 | image | Tue Nov 03 2026 16:47:34 GMT+0530 (India Standard  |
| 3 | 50 | https://res.cloudinary.com/dkg3y5byr/image/upload/ | wanderlust/owner-documents/myajdfzad2ud7ps06iyc | s-10.jpg | image/jpeg | 100828 | image | Tue Nov 03 2026 16:47:32 GMT+0530 (India Standard  |
| 4 | 72 | https://res.cloudinary.com/dkg3y5byr/image/upload/ | wanderlust/owner-documents/gdlqs7b7qtzzzizveyls | Screenshot 2026-11-09 074412.png | image/png | 67065 | image | Mon Nov 09 2026 08:03:22 GMT+0530 (India Standard  |

### Table `owner_profile` (16 rows preview)

| owner_id | business_name | business_type | phone | verification_status | rejection_reason | verification_note | verified_at | created_at | updated_at |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 11 | ramesh | hotel_owner | 8198775645 | approved | NULL | NULL | Wed Oct 14 2026 00:17:58 GMT+0530 (India Standard  | Sun Oct 04 2026 18:21:06 GMT+0530 (India Standard  | Wed Oct 14 2026 00:17:58 GMT+0530 (India Standard  |
| 16 | sachin | hotel_owner | 9483888322 | approved | NULL | NULL | Wed Oct 07 2026 10:16:08 GMT+0530 (India Standard  | Wed Oct 07 2026 10:15:39 GMT+0530 (India Standard  | Wed Oct 07 2026 10:16:08 GMT+0530 (India Standard  |
| 30 | Aarav Heritage Stays | hotel_owner | +91 98450 10001 | approved | NULL | NULL | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  |
| 31 | Coorg Escapes | property_owner | +91 98450 10002 | approved | NULL | NULL | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  |
| 32 | Goa Getaways | property_owner | +91 98450 10003 | approved | NULL | NULL | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  |
| 33 | Tuscany Villas Co. | property_owner | +39 055 555 0104 | approved | NULL | NULL | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  |
| 34 | Bali Retreats | hotel_owner | +62 361 555 0105 | approved | NULL | NULL | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  |
| 35 | Alpine Lodges | hotel_owner | +41 27 555 0106 | approved | NULL | NULL | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  |
| 36 | Paris Venues & Salons | venue_owner | +33 1 55 50 0107 | approved | NULL | NULL | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  |
| 37 | Dubai Event Co. | event_planner | +971 4 555 0108 | approved | NULL | NULL | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  |
| 38 | Kerala Backwater Homes | property_owner | +91 98450 10009 | approved | NULL | NULL | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  |
| 39 | NYC Loft Venues | venue_owner | +1 212 555 0110 | approved | NULL | NULL | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  |
| 42 | bharath | hotel_owner | 8795594849 | approved | NULL | NULL | Wed Oct 14 2026 09:56:02 GMT+0530 (India Standard  | Wed Oct 14 2026 09:09:30 GMT+0530 (India Standard  | Wed Oct 14 2026 09:56:02 GMT+0530 (India Standard  |
| 43 | sujay | hotel_owner | 7688585484 | approved | NULL | NULL | Wed Oct 14 2026 09:56:03 GMT+0530 (India Standard  | Wed Oct 14 2026 09:53:52 GMT+0530 (India Standard  | Wed Oct 14 2026 09:56:03 GMT+0530 (India Standard  |
| 50 | satwik | hotel_owner | 9896678959 | pending | NULL | NULL | NULL | Tue Nov 03 2026 22:17:33 GMT+0530 (India Standard  | Tue Nov 03 2026 22:17:33 GMT+0530 (India Standard  |
| 72 | shravya | hotel_owner | 7483380914 | approved | NULL | NULL | Mon Nov 09 2026 08:05:05 GMT+0530 (India Standard  | Mon Nov 09 2026 08:03:22 GMT+0530 (India Standard  | Mon Nov 09 2026 08:05:05 GMT+0530 (India Standard  |

### Table `payments` (2 rows preview)

| id | booking_id | gateway_order_id | gateway_payment_id | purpose | amount | method | card_network | card_last4 | status | failure_reason | idempotency_key | created_at | paid_at |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 21 | 22 | order_1794191499329_fce31ded | pay_1794191510217_74fa23f0 | full | 16000.00 | card | Visa | 1111 | success | NULL | a6418ff19fd1f65564ec975972d87540c6016e913aa1b79e50 | Mon Nov 09 2026 08:01:38 GMT+0530 (India Standard  | Mon Nov 09 2026 08:01:48 GMT+0530 (India Standard  |
| 28 | 29 | order_1794195991364_a3a5edc1 | pay_1794195994171_8990e2ce | full | 5750.00 | card | Visa | 1111 | success | NULL | 5dfb062a6966f01c2464c516ff5455b9b29f73d34f852bda94 | Mon Nov 09 2026 09:16:31 GMT+0530 (India Standard  | Mon Nov 09 2026 09:16:34 GMT+0530 (India Standard  |

### Table `reviews` (3 rows preview)

| review_id | listing_id | user_id | rating | comment | created_at |
| --- | --- | --- | --- | --- | --- |
| 4 | 22 | 11 | 1 | nice one | Wed Oct 07 2026 09:44:18 GMT+0530 (India Standard  |
| 5 | 24 | 16 | 1 | not worth it | Wed Oct 07 2026 10:18:03 GMT+0530 (India Standard  |
| 6 | 86 | 4 | 5 | nice experience | Wed Oct 14 2026 09:00:31 GMT+0530 (India Standard  |

### Table `room_type_amenities` (20 rows preview)

| room_type_id | amenity_id |
| --- | --- |
| 1 | 1 |
| 2 | 1 |
| 3 | 1 |
| 4 | 1 |
| 5 | 1 |
| 6 | 1 |
| 7 | 1 |
| 8 | 1 |
| 9 | 1 |
| 10 | 1 |
| 11 | 1 |
| 12 | 1 |
| 13 | 1 |
| 14 | 1 |
| 15 | 1 |
| 16 | 1 |
| 17 | 1 |
| 18 | 1 |
| 19 | 1 |
| 20 | 1 |

### Table `room_type_images` (20 rows preview)

| id | room_type_id | url | public_id | sort_order | created_at |
| --- | --- | --- | --- | --- | --- |
| 1 | 1 | https://res.cloudinary.com/dkg3y5byr/image/upload/ | wanderlust/wmffnao6oubsu1p5szi7 | 0 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 2 | 2 | https://res.cloudinary.com/dkg3y5byr/image/upload/ | wanderlust/wmffnao6oubsu1p5szi7 | 0 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 3 | 3 | https://res.cloudinary.com/dkg3y5byr/image/upload/ | wanderlust/wmffnao6oubsu1p5szi7 | 0 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 4 | 4 | https://res.cloudinary.com/dkg3y5byr/image/upload/ | wanderlust/a05fosizozitsydp8nwq | 0 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 5 | 5 | https://res.cloudinary.com/dkg3y5byr/image/upload/ | wanderlust/a05fosizozitsydp8nwq | 0 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 6 | 6 | https://res.cloudinary.com/dkg3y5byr/image/upload/ | wanderlust/a05fosizozitsydp8nwq | 0 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 7 | 7 | https://res.cloudinary.com/dkg3y5byr/image/upload/ | wanderlust/frvler3b8iglqggg4hkj | 0 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 8 | 8 | https://res.cloudinary.com/dkg3y5byr/image/upload/ | wanderlust/frvler3b8iglqggg4hkj | 0 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 9 | 9 | https://res.cloudinary.com/dkg3y5byr/image/upload/ | wanderlust/frvler3b8iglqggg4hkj | 0 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 10 | 10 | https://picsum.photos/seed/wanderlust-aarav_herita | NULL | 0 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 11 | 11 | https://picsum.photos/seed/wanderlust-aarav_herita | NULL | 0 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 12 | 12 | https://picsum.photos/seed/wanderlust-aarav_herita | NULL | 0 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 13 | 13 | https://picsum.photos/seed/wanderlust-aarav_herita | NULL | 0 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 14 | 14 | https://picsum.photos/seed/wanderlust-aarav_herita | NULL | 0 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 15 | 15 | https://picsum.photos/seed/wanderlust-aarav_herita | NULL | 0 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 16 | 16 | https://picsum.photos/seed/wanderlust-aarav_herita | NULL | 0 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 17 | 17 | https://picsum.photos/seed/wanderlust-aarav_herita | NULL | 0 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 18 | 18 | https://picsum.photos/seed/wanderlust-aarav_herita | NULL | 0 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 19 | 19 | https://picsum.photos/seed/wanderlust-aarav_herita | NULL | 0 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 20 | 20 | https://picsum.photos/seed/wanderlust-aarav_herita | NULL | 0 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |

### Table `room_types` (20 rows preview)

| id | listing_id | name | description | category | bed_config | size_sqft | max_guests | price_per_night | total_units | is_active | is_auto_generated | created_at | updated_at |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 22 | Standard Classic Room | Comfortable and functional room at vintage japanes | standard | 1 Queen Bed | 260 | 2 | 5000.00 | 10 | 1 | 1 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 2 | 22 | Deluxe City / Nature View Room | Upgraded room at vintage japanese hotel featuring  | deluxe | 1 King Bed | 360 | 2 | 6500.00 | 6 | 1 | 1 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 3 | 22 | Executive Luxury Suite | Premier accommodation at vintage japanese hotel wi | suite | 1 King Bed + 1 Sofa Bed | 580 | 3 | 8750.00 | 3 | 1 | 1 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 4 | 24 | Standard Classic Room | Comfortable and functional room at shashank with e | standard | 1 Queen Bed | 260 | 2 | 500.00 | 10 | 1 | 1 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 5 | 24 | Deluxe City / Nature View Room | Upgraded room at shashank featuring enhanced views | deluxe | 1 King Bed | 360 | 2 | 650.00 | 6 | 1 | 1 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 6 | 24 | Executive Luxury Suite | Premier accommodation at shashank with separate si | suite | 1 King Bed + 1 Sofa Bed | 580 | 3 | 900.00 | 3 | 1 | 1 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 7 | 25 | Standard Classic Room | Comfortable and functional room at grief of the fa | standard | 1 Queen Bed | 260 | 2 | 15000.00 | 10 | 1 | 1 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 8 | 25 | Deluxe City / Nature View Room | Upgraded room at grief of the fallen warrior featu | deluxe | 1 King Bed | 360 | 2 | 19500.00 | 6 | 1 | 1 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 9 | 25 | Executive Luxury Suite | Premier accommodation at grief of the fallen warri | suite | 1 King Bed + 1 Sofa Bed | 580 | 3 | 26250.00 | 3 | 1 | 1 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 10 | 78 | Standard Classic Room | Comfortable and functional room at Serene Boutique | standard | 1 Queen Bed | 260 | 2 | 3500.00 | 10 | 1 | 1 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 11 | 78 | Deluxe City / Nature View Room | Upgraded room at Serene Boutique Suite in Jaipur f | deluxe | 1 King Bed | 360 | 2 | 4550.00 | 6 | 1 | 1 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 12 | 78 | Executive Luxury Suite | Premier accommodation at Serene Boutique Suite in  | suite | 1 King Bed + 1 Sofa Bed | 580 | 3 | 6150.00 | 3 | 1 | 1 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 13 | 79 | Standard Classic Room | Comfortable and functional room at Charming Herita | standard | 1 Queen Bed | 260 | 2 | 5650.00 | 10 | 1 | 1 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 14 | 79 | Deluxe City / Nature View Room | Upgraded room at Charming Heritage Room in Udaipur | deluxe | 1 King Bed | 360 | 2 | 7350.00 | 6 | 1 | 1 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 15 | 79 | Executive Luxury Suite | Premier accommodation at Charming Heritage Room in | suite | 1 King Bed + 1 Sofa Bed | 580 | 3 | 9900.00 | 3 | 1 | 1 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 16 | 80 | Standard Classic Room | Comfortable and functional room at Elegant Deluxe  | standard | 1 Queen Bed | 260 | 2 | 7750.00 | 10 | 1 | 1 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 17 | 80 | Deluxe City / Nature View Room | Upgraded room at Elegant Deluxe Suite in Jodhpur f | deluxe | 1 King Bed | 360 | 2 | 10100.00 | 6 | 1 | 1 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 18 | 80 | Executive Luxury Suite | Premier accommodation at Elegant Deluxe Suite in J | suite | 1 King Bed + 1 Sofa Bed | 580 | 3 | 13550.00 | 3 | 1 | 1 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 19 | 81 | Standard Classic Room | Comfortable and functional room at Sunlit Courtyar | standard | 1 Queen Bed | 260 | 2 | 9900.00 | 10 | 1 | 1 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |
| 20 | 81 | Deluxe City / Nature View Room | Upgraded room at Sunlit Courtyard Room in Pushkar  | deluxe | 1 King Bed | 360 | 2 | 12850.00 | 6 | 1 | 1 | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  | Mon Nov 09 2026 00:09:03 GMT+0530 (India Standard  |

### Table `users` (20 rows preview)

| user_id | username | email | password_hash | role | created_at | admin_flag | profile_picture_url | profile_picture_public_id | phone | bio |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 4 | Shamanth P | sh***@gmail.com | [MASKED_HASH] | admin | Sat Oct 03 2026 18:48:06 GMT+0530 (India Standard  | 1 | NULL | NULL | NULL | NULL |
| 5 | shashank | sh***@gmail.com | [MASKED_HASH] | customer | Sat Oct 03 2026 18:50:29 GMT+0530 (India Standard  | NULL | NULL | NULL | NULL | NULL |
| 11 | ramesha | ra***@gmail.com | [MASKED_HASH] | owner | Sun Oct 04 2026 18:21:06 GMT+0530 (India Standard  | NULL | https://res.cloudinary.com/dkg3y5byr/image/upload/ | wanderlust/avatars/qy4zjqdokt3asdepjh47 | NULL | NULL |
| 13 | subramanya | su***@gmail.com | [MASKED_HASH] | customer | Wed Oct 07 2026 09:33:23 GMT+0530 (India Standard  | NULL | NULL | NULL | NULL | NULL |
| 16 | sachin | sa***@gmail.com | [MASKED_HASH] | owner | Wed Oct 07 2026 10:15:39 GMT+0530 (India Standard  | NULL | NULL | NULL | NULL | NULL |
| 18 | sumeet | su***@gmail.com | [MASKED_HASH] | customer | Tue Oct 13 2026 14:06:04 GMT+0530 (India Standard  | NULL | NULL | NULL | NULL | NULL |
| 30 | aarav_heritage | aa***@seed.wanderlust.test | [MASKED_HASH] | owner | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  | NULL | NULL | NULL | +91 98450 10001 | Family-run heritage hotels across Rajasthan. |
| 31 | coorg_escapes | co***@seed.wanderlust.test | [MASKED_HASH] | owner | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  | NULL | NULL | NULL | +91 98450 10002 | Plantation homestays and hill cottages in the West |
| 32 | goa_getaways | go***@seed.wanderlust.test | [MASKED_HASH] | owner | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  | NULL | NULL | NULL | +91 98450 10003 | Beach villas and private pool houses in Goa. |
| 33 | tuscany_villas | tu***@seed.wanderlust.test | [MASKED_HASH] | owner | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  | NULL | NULL | NULL | +39 055 555 0104 | Countryside villas and farmhouses in Tuscany. |
| 34 | bali_retreats | ba***@seed.wanderlust.test | [MASKED_HASH] | owner | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  | NULL | NULL | NULL | +62 361 555 0105 | Boutique resorts and yoga retreats across Bali. |
| 35 | alpine_lodges | al***@seed.wanderlust.test | [MASKED_HASH] | owner | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  | NULL | NULL | NULL | +41 27 555 0106 | Mountain lodges and ski chalets in the Swiss Alps. |
| 36 | paris_venues | pa***@seed.wanderlust.test | [MASKED_HASH] | owner | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  | NULL | NULL | NULL | +33 1 55 50 0107 | Historic salons, courtyards and rooftop venues in  |
| 37 | dubai_events | du***@seed.wanderlust.test | [MASKED_HASH] | owner | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  | NULL | NULL | NULL | +971 4 555 0108 | End-to-end planners for weddings and corporate eve |
| 38 | kerala_backwaters | ke***@seed.wanderlust.test | [MASKED_HASH] | owner | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  | NULL | NULL | NULL | +91 98450 10009 | Houseboats, heritage homes and tea-estate bungalow |
| 39 | nyc_loft_venues | ny***@seed.wanderlust.test | [MASKED_HASH] | owner | Tue Oct 13 2026 22:47:55 GMT+0530 (India Standard  | NULL | NULL | NULL | +1 212 555 0110 | Lofts, studios and event spaces across New York. |
| 40 | subramanya hs | su***@gmail.com | [MASKED_HASH] | customer | Wed Oct 14 2026 09:03:53 GMT+0530 (India Standard  | NULL | https://res.cloudinary.com/dkg3y5byr/image/upload/ | wanderlust/avatars/p4udsg98zed85lebqaio | NULL | NULL |
| 42 | bharath | bh***@gmail.com | [MASKED_HASH] | owner | Wed Oct 14 2026 09:09:30 GMT+0530 (India Standard  | NULL | NULL | NULL | 8795594849 | NULL |
| 43 | sujay | su***@gmail.com | [MASKED_HASH] | owner | Wed Oct 14 2026 09:53:52 GMT+0530 (India Standard  | NULL | NULL | NULL | 7688585484 | NULL |
| 44 | shubha | un***@gmail.com | [MASKED_HASH] | customer | Mon Nov 02 2026 14:58:30 GMT+0530 (India Standard  | NULL | NULL | NULL | NULL | NULL |

### Table `wishlists` (6 rows preview)

| id | user_id | listing_id | created_at |
| --- | --- | --- | --- |
| 3 | 11 | 22 | Wed Oct 07 2026 12:22:53 GMT+0530 (India Standard  |
| 7 | 4 | 78 | Tue Oct 13 2026 23:38:15 GMT+0530 (India Standard  |
| 8 | 4 | 86 | Wed Oct 14 2026 09:00:40 GMT+0530 (India Standard  |
| 9 | 4 | 82 | Wed Oct 14 2026 09:02:14 GMT+0530 (India Standard  |
| 11 | 44 | 78 | Mon Nov 02 2026 14:58:38 GMT+0530 (India Standard  |
| 12 | 45 | 81 | Mon Nov 02 2026 15:32:28 GMT+0530 (India Standard  |


---

## 8. Application Code Usage Map (Table → Files)

### `amenities`

- [`controller/bookings.js`](file:///C:/a-warehouse/major_phase2/major/controller/bookings.js)
- [`controller/listings.js`](file:///C:/a-warehouse/major_phase2/major/controller/listings.js)
- [`db/seed/backfillRoomTypes.js`](file:///C:/a-warehouse/major_phase2/major/db/seed/backfillRoomTypes.js)
- [`routes/ownerRooms.js`](file:///C:/a-warehouse/major_phase2/major/routes/ownerRooms.js)
- [`services/availabilityService.js`](file:///C:/a-warehouse/major_phase2/major/services/availabilityService.js)
- [`services/roomGenerator.js`](file:///C:/a-warehouse/major_phase2/major/services/roomGenerator.js)
- [`services/roomService.js`](file:///C:/a-warehouse/major_phase2/major/services/roomService.js)
- [`tests/routes.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/routes.test.js)

### `booking_rooms`

- [`services/availabilityService.js`](file:///C:/a-warehouse/major_phase2/major/services/availabilityService.js)
- [`services/bookingService.js`](file:///C:/a-warehouse/major_phase2/major/services/bookingService.js)
- [`services/roomService.js`](file:///C:/a-warehouse/major_phase2/major/services/roomService.js)
- [`tests/routes.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/routes.test.js)

### `booking_summary`

- [`services/bookingService.js`](file:///C:/a-warehouse/major_phase2/major/services/bookingService.js)
- [`tests/routes.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/routes.test.js)

### `bookings`

- [`app.js`](file:///C:/a-warehouse/major_phase2/major/app.js)
- [`config/dashboardSections.js`](file:///C:/a-warehouse/major_phase2/major/config/dashboardSections.js)
- [`controller/bookings.js`](file:///C:/a-warehouse/major_phase2/major/controller/bookings.js)
- [`controller/dashboard.js`](file:///C:/a-warehouse/major_phase2/major/controller/dashboard.js)
- [`routes/booking.js`](file:///C:/a-warehouse/major_phase2/major/routes/booking.js)
- [`routes/dashboard.js`](file:///C:/a-warehouse/major_phase2/major/routes/dashboard.js)
- [`routes/listing.js`](file:///C:/a-warehouse/major_phase2/major/routes/listing.js)
- [`routes/mockGateway.js`](file:///C:/a-warehouse/major_phase2/major/routes/mockGateway.js)
- [`services/availabilityService.js`](file:///C:/a-warehouse/major_phase2/major/services/availabilityService.js)
- [`services/bookingService.js`](file:///C:/a-warehouse/major_phase2/major/services/bookingService.js)
- [`services/paymentService.js`](file:///C:/a-warehouse/major_phase2/major/services/paymentService.js)
- [`services/roomService.js`](file:///C:/a-warehouse/major_phase2/major/services/roomService.js)
- [`tests/booking_flow.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/booking_flow.test.js)
- [`tests/dashboard_phase4.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/dashboard_phase4.test.js)
- [`tests/routes.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/routes.test.js)

### `listing_payment_policy`

- [`db/seed/backfillRoomTypes.js`](file:///C:/a-warehouse/major_phase2/major/db/seed/backfillRoomTypes.js)
- [`routes/ownerRooms.js`](file:///C:/a-warehouse/major_phase2/major/routes/ownerRooms.js)
- [`services/pricingService.js`](file:///C:/a-warehouse/major_phase2/major/services/pricingService.js)
- [`services/roomService.js`](file:///C:/a-warehouse/major_phase2/major/services/roomService.js)
- [`tests/booking_flow.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/booking_flow.test.js)
- [`tests/routes.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/routes.test.js)

### `listings`

- [`app.js`](file:///C:/a-warehouse/major_phase2/major/app.js)
- [`config/dashboardSections.js`](file:///C:/a-warehouse/major_phase2/major/config/dashboardSections.js)
- [`controller/bookings.js`](file:///C:/a-warehouse/major_phase2/major/controller/bookings.js)
- [`controller/dashboard.js`](file:///C:/a-warehouse/major_phase2/major/controller/dashboard.js)
- [`controller/listings.js`](file:///C:/a-warehouse/major_phase2/major/controller/listings.js)
- [`controller/reviews.js`](file:///C:/a-warehouse/major_phase2/major/controller/reviews.js)
- [`controller/user.js`](file:///C:/a-warehouse/major_phase2/major/controller/user.js)
- [`controller/wishlist.js`](file:///C:/a-warehouse/major_phase2/major/controller/wishlist.js)
- [`db/migrate.js`](file:///C:/a-warehouse/major_phase2/major/db/migrate.js)
- [`db/seed.js`](file:///C:/a-warehouse/major_phase2/major/db/seed.js)
- [`db/seed/backfillRoomTypes.js`](file:///C:/a-warehouse/major_phase2/major/db/seed/backfillRoomTypes.js)
- [`middleware.js`](file:///C:/a-warehouse/major_phase2/major/middleware.js)
- [`models/listing.js`](file:///C:/a-warehouse/major_phase2/major/models/listing.js)
- [`models/user.js`](file:///C:/a-warehouse/major_phase2/major/models/user.js)
- [`models/wishlist.js`](file:///C:/a-warehouse/major_phase2/major/models/wishlist.js)
- [`routes/dashboard.js`](file:///C:/a-warehouse/major_phase2/major/routes/dashboard.js)
- [`routes/landing.js`](file:///C:/a-warehouse/major_phase2/major/routes/landing.js)
- [`routes/listing.js`](file:///C:/a-warehouse/major_phase2/major/routes/listing.js)
- [`routes/ownerRooms.js`](file:///C:/a-warehouse/major_phase2/major/routes/ownerRooms.js)
- [`schema.js`](file:///C:/a-warehouse/major_phase2/major/schema.js)
- [`scripts/audit_data_tests.js`](file:///C:/a-warehouse/major_phase2/major/scripts/audit_data_tests.js)
- [`scripts/inspect_json.js`](file:///C:/a-warehouse/major_phase2/major/scripts/inspect_json.js)
- [`scripts/update_test_setup.js`](file:///C:/a-warehouse/major_phase2/major/scripts/update_test_setup.js)
- [`scripts/verify_migration.js`](file:///C:/a-warehouse/major_phase2/major/scripts/verify_migration.js)
- [`seed/apply-seed.js`](file:///C:/a-warehouse/major_phase2/major/seed/apply-seed.js)
- [`seed/generate-seed.js`](file:///C:/a-warehouse/major_phase2/major/seed/generate-seed.js)
- [`services/bookingService.js`](file:///C:/a-warehouse/major_phase2/major/services/bookingService.js)
- [`services/roomService.js`](file:///C:/a-warehouse/major_phase2/major/services/roomService.js)
- [`tests/booking_flow.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/booking_flow.test.js)
- [`tests/dashboard_phase4.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/dashboard_phase4.test.js)
- [`tests/owner_approval.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/owner_approval.test.js)
- [`tests/owner_verification_docs.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/owner_verification_docs.test.js)
- [`tests/routes.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/routes.test.js)
- [`utils/validateListing.js`](file:///C:/a-warehouse/major_phase2/major/utils/validateListing.js)
- [`utils/validateReview.js`](file:///C:/a-warehouse/major_phase2/major/utils/validateReview.js)

### `owner_documents`

- [`models/ownerProfile.js`](file:///C:/a-warehouse/major_phase2/major/models/ownerProfile.js)
- [`scripts/inspect_json.js`](file:///C:/a-warehouse/major_phase2/major/scripts/inspect_json.js)
- [`scripts/run_migration.js`](file:///C:/a-warehouse/major_phase2/major/scripts/run_migration.js)
- [`scripts/safety_backup_scoped.js`](file:///C:/a-warehouse/major_phase2/major/scripts/safety_backup_scoped.js)
- [`scripts/update_test_setup.js`](file:///C:/a-warehouse/major_phase2/major/scripts/update_test_setup.js)
- [`scripts/verify_migration.js`](file:///C:/a-warehouse/major_phase2/major/scripts/verify_migration.js)
- [`tests/owner_verification_docs.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/owner_verification_docs.test.js)
- [`tests/routes.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/routes.test.js)

### `owner_profile`

- [`db/migrate.js`](file:///C:/a-warehouse/major_phase2/major/db/migrate.js)
- [`db/seed.js`](file:///C:/a-warehouse/major_phase2/major/db/seed.js)
- [`db/seed/backfillRoomTypes.js`](file:///C:/a-warehouse/major_phase2/major/db/seed/backfillRoomTypes.js)
- [`models/listing.js`](file:///C:/a-warehouse/major_phase2/major/models/listing.js)
- [`models/ownerProfile.js`](file:///C:/a-warehouse/major_phase2/major/models/ownerProfile.js)
- [`models/user.js`](file:///C:/a-warehouse/major_phase2/major/models/user.js)
- [`scripts/audit_data_tests.js`](file:///C:/a-warehouse/major_phase2/major/scripts/audit_data_tests.js)
- [`scripts/inspect_json.js`](file:///C:/a-warehouse/major_phase2/major/scripts/inspect_json.js)
- [`scripts/update_test_setup.js`](file:///C:/a-warehouse/major_phase2/major/scripts/update_test_setup.js)
- [`scripts/verify_migration.js`](file:///C:/a-warehouse/major_phase2/major/scripts/verify_migration.js)
- [`seed/generate-seed.js`](file:///C:/a-warehouse/major_phase2/major/seed/generate-seed.js)
- [`tests/dashboard_phase4.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/dashboard_phase4.test.js)
- [`tests/owner_approval.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/owner_approval.test.js)
- [`tests/owner_verification_docs.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/owner_verification_docs.test.js)
- [`tests/routes.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/routes.test.js)

### `payments`

- [`controller/bookings.js`](file:///C:/a-warehouse/major_phase2/major/controller/bookings.js)
- [`routes/mockGateway.js`](file:///C:/a-warehouse/major_phase2/major/routes/mockGateway.js)
- [`services/bookingService.js`](file:///C:/a-warehouse/major_phase2/major/services/bookingService.js)
- [`services/paymentService.js`](file:///C:/a-warehouse/major_phase2/major/services/paymentService.js)
- [`tests/booking_flow.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/booking_flow.test.js)
- [`tests/routes.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/routes.test.js)

### `reviews`

- [`app.js`](file:///C:/a-warehouse/major_phase2/major/app.js)
- [`db/seed.js`](file:///C:/a-warehouse/major_phase2/major/db/seed.js)
- [`models/listing.js`](file:///C:/a-warehouse/major_phase2/major/models/listing.js)
- [`models/review.js`](file:///C:/a-warehouse/major_phase2/major/models/review.js)
- [`models/user.js`](file:///C:/a-warehouse/major_phase2/major/models/user.js)
- [`routes/review.js`](file:///C:/a-warehouse/major_phase2/major/routes/review.js)
- [`schema.js`](file:///C:/a-warehouse/major_phase2/major/schema.js)
- [`scripts/audit_data_tests.js`](file:///C:/a-warehouse/major_phase2/major/scripts/audit_data_tests.js)
- [`scripts/inspect_json.js`](file:///C:/a-warehouse/major_phase2/major/scripts/inspect_json.js)
- [`tests/owner_approval.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/owner_approval.test.js)
- [`tests/routes.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/routes.test.js)
- [`utils/validateReview.js`](file:///C:/a-warehouse/major_phase2/major/utils/validateReview.js)

### `room_type_amenities`

- [`controller/bookings.js`](file:///C:/a-warehouse/major_phase2/major/controller/bookings.js)
- [`db/seed/backfillRoomTypes.js`](file:///C:/a-warehouse/major_phase2/major/db/seed/backfillRoomTypes.js)
- [`services/availabilityService.js`](file:///C:/a-warehouse/major_phase2/major/services/availabilityService.js)
- [`services/roomService.js`](file:///C:/a-warehouse/major_phase2/major/services/roomService.js)
- [`tests/routes.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/routes.test.js)

### `room_type_images`

- [`controller/bookings.js`](file:///C:/a-warehouse/major_phase2/major/controller/bookings.js)
- [`db/seed/backfillRoomTypes.js`](file:///C:/a-warehouse/major_phase2/major/db/seed/backfillRoomTypes.js)
- [`services/availabilityService.js`](file:///C:/a-warehouse/major_phase2/major/services/availabilityService.js)
- [`services/roomService.js`](file:///C:/a-warehouse/major_phase2/major/services/roomService.js)
- [`tests/routes.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/routes.test.js)

### `room_types`

- [`controller/bookings.js`](file:///C:/a-warehouse/major_phase2/major/controller/bookings.js)
- [`db/seed/backfillRoomTypes.js`](file:///C:/a-warehouse/major_phase2/major/db/seed/backfillRoomTypes.js)
- [`services/availabilityService.js`](file:///C:/a-warehouse/major_phase2/major/services/availabilityService.js)
- [`services/bookingService.js`](file:///C:/a-warehouse/major_phase2/major/services/bookingService.js)
- [`services/pricingService.js`](file:///C:/a-warehouse/major_phase2/major/services/pricingService.js)
- [`services/roomService.js`](file:///C:/a-warehouse/major_phase2/major/services/roomService.js)
- [`tests/booking_flow.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/booking_flow.test.js)
- [`tests/routes.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/routes.test.js)

### `users`

- [`config/dashboardSections.js`](file:///C:/a-warehouse/major_phase2/major/config/dashboardSections.js)
- [`controller/dashboard.js`](file:///C:/a-warehouse/major_phase2/major/controller/dashboard.js)
- [`controller/user.js`](file:///C:/a-warehouse/major_phase2/major/controller/user.js)
- [`db/ensureAdmin.js`](file:///C:/a-warehouse/major_phase2/major/db/ensureAdmin.js)
- [`db/migrate.js`](file:///C:/a-warehouse/major_phase2/major/db/migrate.js)
- [`db/seed.js`](file:///C:/a-warehouse/major_phase2/major/db/seed.js)
- [`middleware.js`](file:///C:/a-warehouse/major_phase2/major/middleware.js)
- [`models/listing.js`](file:///C:/a-warehouse/major_phase2/major/models/listing.js)
- [`models/ownerProfile.js`](file:///C:/a-warehouse/major_phase2/major/models/ownerProfile.js)
- [`models/user.js`](file:///C:/a-warehouse/major_phase2/major/models/user.js)
- [`routes/dashboard.js`](file:///C:/a-warehouse/major_phase2/major/routes/dashboard.js)
- [`scripts/audit_data_tests.js`](file:///C:/a-warehouse/major_phase2/major/scripts/audit_data_tests.js)
- [`scripts/update_test_setup.js`](file:///C:/a-warehouse/major_phase2/major/scripts/update_test_setup.js)
- [`seed/apply-seed.js`](file:///C:/a-warehouse/major_phase2/major/seed/apply-seed.js)
- [`seed/generate-seed.js`](file:///C:/a-warehouse/major_phase2/major/seed/generate-seed.js)
- [`services/bookingService.js`](file:///C:/a-warehouse/major_phase2/major/services/bookingService.js)
- [`tests/booking_flow.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/booking_flow.test.js)
- [`tests/dashboard_phase4.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/dashboard_phase4.test.js)
- [`tests/owner_approval.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/owner_approval.test.js)
- [`tests/owner_verification_docs.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/owner_verification_docs.test.js)
- [`tests/routes.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/routes.test.js)
- [`utils/roles.js`](file:///C:/a-warehouse/major_phase2/major/utils/roles.js)
- [`utils/validateUser.js`](file:///C:/a-warehouse/major_phase2/major/utils/validateUser.js)

### `wishlists`

- [`db/migrate.js`](file:///C:/a-warehouse/major_phase2/major/db/migrate.js)
- [`models/user.js`](file:///C:/a-warehouse/major_phase2/major/models/user.js)
- [`models/wishlist.js`](file:///C:/a-warehouse/major_phase2/major/models/wishlist.js)
- [`scripts/audit_data_tests.js`](file:///C:/a-warehouse/major_phase2/major/scripts/audit_data_tests.js)
- [`scripts/verify_migration.js`](file:///C:/a-warehouse/major_phase2/major/scripts/verify_migration.js)
- [`tests/dashboard_phase4.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/dashboard_phase4.test.js)
- [`tests/routes.test.js`](file:///C:/a-warehouse/major_phase2/major/tests/routes.test.js)

