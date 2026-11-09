# WanderLust — Booking & Payment Schema Inventory

**Database:** `wanderlust_norm`  
**MySQL Version:** `8.0.43` (MySQL >= 8.0.16 confirms CHECK constraints are actively enforced)  
**Generated:** 2026-11-09T04:43:56.373Z  

## 1. Tables Metadata

| Table Name | Engine | Collation | Table Rows (approx) |
|---|---|---|---|
| `amenities` | InnoDB | utf8mb4_0900_ai_ci | 21 |
| `booking_rooms` | InnoDB | utf8mb4_0900_ai_ci | 4 |
| `booking_summary` | null | null | null |
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

## 2. DDL for Booking & Payment Objects

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

### View: `booking_summary`

```sql
CREATE ALGORITHM=UNDEFINED DEFINER=`wanderlust_user`@`localhost` SQL SECURITY DEFINER VIEW `booking_summary` AS select `b`.`id` AS `booking_id`,`b`.`booking_ref` AS `booking_ref`,`b`.`customer_id` AS `customer_id`,`b`.`listing_id` AS `listing_id`,`b`.`check_in` AS `check_in`,`b`.`check_out` AS `check_out`,`b`.`adults` AS `adults`,`b`.`children` AS `children`,`b`.`contact_phone` AS `contact_phone`,`b`.`special_requests` AS `special_requests`,`b`.`total_amount` AS `total_amount`,`b`.`advance_required` AS `advance_required`,`b`.`status` AS `booking_status`,`b`.`hold_expires_at` AS `hold_expires_at`,`b`.`created_at` AS `created_at`,`b`.`updated_at` AS `updated_at`,coalesce(sum((case when (`p`.`status` = 'success') then `p`.`amount` else 0 end)),0.00) AS `amount_paid`,greatest(0.00,(`b`.`total_amount` - coalesce(sum((case when (`p`.`status` = 'success') then `p`.`amount` else 0 end)),0.00))) AS `balance_due`,(case when (coalesce(sum((case when (`p`.`status` = 'success') then `p`.`amount` else 0 end)),0.00) = 0) then 'unpaid' when (coalesce(sum((case when (`p`.`status` = 'success') then `p`.`amount` else 0 end)),0.00) >= `b`.`total_amount`) then 'paid' else 'partially_paid' end) AS `payment_status` from (`bookings` `b` left join `payments` `p` on((`p`.`booking_id` = `b`.`id`))) group by `b`.`id`
```

## 3. ENUM Columns & Allowed Values

| Table Name | Column Name | Allowed ENUM Values |
|---|---|---|
| `booking_summary` | `booking_status` | `enum('pending_payment','confirmed','cancelled','expired','completed')` |
| `bookings` | `status` | `enum('pending_payment','confirmed','cancelled','expired','completed')` |
| `listing_payment_policy` | `advance_type` | `enum('fixed','percent')` |
| `owner_profile` | `business_type` | `enum('hotel_owner','property_owner','venue_owner','event_planner')` |
| `owner_profile` | `verification_status` | `enum('pending','approved','rejected','info_requested')` |
| `payments` | `method` | `enum('card','upi','netbanking')` |
| `payments` | `purpose` | `enum('advance','balance','full')` |
| `payments` | `status` | `enum('created','processing','success','failed')` |
| `room_types` | `category` | `enum('standard','deluxe','suite','family','dormitory','entire_property','hall','other')` |
| `users` | `role` | `enum('customer','owner','admin')` |

## 4. Foreign Key Constraints & Referential Actions

| Table | Constraint Name | Column | Referenced Table | Referenced Column | ON UPDATE | ON DELETE |
|---|---|---|---|---|---|---|
| `booking_rooms` | `fk_br_booking` | `booking_id` | `bookings` | `id` | `NO ACTION` | `CASCADE` |
| `booking_rooms` | `fk_br_room_type` | `room_type_id` | `room_types` | `id` | `NO ACTION` | `RESTRICT` |
| `bookings` | `fk_bookings_customer` | `customer_id` | `users` | `user_id` | `NO ACTION` | `RESTRICT` |
| `bookings` | `fk_bookings_listing` | `listing_id` | `listings` | `listing_id` | `NO ACTION` | `RESTRICT` |
| `listing_payment_policy` | `fk_lpp_listing` | `listing_id` | `listings` | `listing_id` | `NO ACTION` | `CASCADE` |
| `listings` | `fk_listing_owner` | `owner_id` | `users` | `user_id` | `NO ACTION` | `RESTRICT` |
| `owner_documents` | `fk_owner_documents_owner` | `owner_id` | `owner_profile` | `owner_id` | `NO ACTION` | `CASCADE` |
| `owner_profile` | `fk_owner_profile_user` | `owner_id` | `users` | `user_id` | `NO ACTION` | `CASCADE` |
| `payments` | `fk_payments_booking` | `booking_id` | `bookings` | `id` | `NO ACTION` | `CASCADE` |
| `reviews` | `fk_review_listing` | `listing_id` | `listings` | `listing_id` | `NO ACTION` | `CASCADE` |
| `reviews` | `fk_review_user` | `user_id` | `users` | `user_id` | `NO ACTION` | `CASCADE` |
| `room_type_amenities` | `fk_rta_amenity` | `amenity_id` | `amenities` | `id` | `NO ACTION` | `CASCADE` |
| `room_type_amenities` | `fk_rta_room_type` | `room_type_id` | `room_types` | `id` | `NO ACTION` | `CASCADE` |
| `room_type_images` | `fk_rti_room_type` | `room_type_id` | `room_types` | `id` | `NO ACTION` | `CASCADE` |
| `room_types` | `fk_room_types_listing` | `listing_id` | `listings` | `listing_id` | `NO ACTION` | `CASCADE` |
| `wishlists` | `fk_wishlist_listing` | `listing_id` | `listings` | `listing_id` | `NO ACTION` | `CASCADE` |
| `wishlists` | `fk_wishlist_user` | `user_id` | `users` | `user_id` | `NO ACTION` | `CASCADE` |

## 5. Check Constraints

| Table | Constraint Name | Check Clause |
|---|---|---|
| `booking_rooms` | `chk_booking_rooms_price` | `(`unit_price` >= 0)` |
| `booking_rooms` | `chk_booking_rooms_qty` | `(`quantity` > 0)` |
| `bookings` | `chk_bookings_amounts` | `((`total_amount` >= 0) and (`advance_required` >= 0))` |
| `bookings` | `chk_bookings_dates` | `(`check_out` > `check_in`)` |
| `listing_payment_policy` | `chk_lpp_advance_val` | `(`advance_value` >= 0)` |
| `listings` | `chk_listing_lat` | `((`latitude` is null) or (`latitude` between -(90) and 90))` |
| `listings` | `chk_listing_lng` | `((`longitude` is null) or (`longitude` between -(180) and 180))` |
| `listings` | `chk_listing_price` | `(`price` >= 0)` |
| `payments` | `chk_payments_amount` | `(`amount` >= 0)` |
| `reviews` | `chk_review_rating` | `(`rating` between 1 and 5)` |
| `room_types` | `chk_room_types_guests` | `(`max_guests` > 0)` |
| `room_types` | `chk_room_types_price` | `(`price_per_night` >= 0)` |
| `room_types` | `chk_room_types_units` | `(`total_units` >= 0)` |

## 6. Triggers

*No triggers currently defined in schema.*

## 7. Indexes & Statistics

| Table | Index Name | Unique? | Seq | Column |
|---|---|---|---|---|
| `amenities` | `PRIMARY` | YES | 1 | `id` |
| `amenities` | `uq_amenities_name` | YES | 1 | `name` |
| `booking_rooms` | `fk_br_room_type` | NO | 1 | `room_type_id` |
| `booking_rooms` | `PRIMARY` | YES | 1 | `booking_id` |
| `booking_rooms` | `PRIMARY` | YES | 2 | `room_type_id` |
| `bookings` | `idx_bookings_customer` | NO | 1 | `customer_id` |
| `bookings` | `idx_bookings_dates` | NO | 1 | `listing_id` |
| `bookings` | `idx_bookings_dates` | NO | 2 | `check_in` |
| `bookings` | `idx_bookings_dates` | NO | 3 | `check_out` |
| `bookings` | `idx_bookings_status` | NO | 1 | `status` |
| `bookings` | `PRIMARY` | YES | 1 | `id` |
| `bookings` | `uq_bookings_ref` | YES | 1 | `booking_ref` |
| `listing_payment_policy` | `PRIMARY` | YES | 1 | `listing_id` |
| `listings` | `idx_listings_owner` | NO | 1 | `owner_id` |
| `listings` | `PRIMARY` | YES | 1 | `listing_id` |
| `owner_documents` | `idx_owner_documents_owner` | NO | 1 | `owner_id` |
| `owner_documents` | `PRIMARY` | YES | 1 | `document_id` |
| `owner_profile` | `idx_owner_profile_status` | NO | 1 | `verification_status` |
| `owner_profile` | `PRIMARY` | YES | 1 | `owner_id` |
| `payments` | `idx_payments_booking` | NO | 1 | `booking_id` |
| `payments` | `idx_payments_status` | NO | 1 | `status` |
| `payments` | `PRIMARY` | YES | 1 | `id` |
| `payments` | `uq_payments_idempotency` | YES | 1 | `idempotency_key` |
| `payments` | `uq_payments_order` | YES | 1 | `gateway_order_id` |
| `reviews` | `fk_review_user` | NO | 1 | `user_id` |
| `reviews` | `idx_reviews_listing` | NO | 1 | `listing_id` |
| `reviews` | `PRIMARY` | YES | 1 | `review_id` |
| `room_type_amenities` | `fk_rta_amenity` | NO | 1 | `amenity_id` |
| `room_type_amenities` | `PRIMARY` | YES | 1 | `room_type_id` |
| `room_type_amenities` | `PRIMARY` | YES | 2 | `amenity_id` |
| `room_type_images` | `idx_rti_room_type` | NO | 1 | `room_type_id` |
| `room_type_images` | `PRIMARY` | YES | 1 | `id` |
| `room_types` | `idx_room_types_active` | NO | 1 | `is_active` |
| `room_types` | `idx_room_types_listing` | NO | 1 | `listing_id` |
| `room_types` | `PRIMARY` | YES | 1 | `id` |
| `users` | `PRIMARY` | YES | 1 | `user_id` |
| `users` | `uq_single_admin` | YES | 1 | `admin_flag` |
| `users` | `uq_users_email` | YES | 1 | `email` |
| `users` | `uq_users_username` | YES | 1 | `username` |
| `wishlists` | `idx_wishlists_listing` | NO | 1 | `listing_id` |
| `wishlists` | `PRIMARY` | YES | 1 | `id` |
| `wishlists` | `uq_user_listing` | YES | 1 | `user_id` |
| `wishlists` | `uq_user_listing` | YES | 2 | `listing_id` |

