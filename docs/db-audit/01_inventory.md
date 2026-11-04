# Database Audit — Phase 1: Schema & Data Inventory

Generated: 2026-11-04T01:24:39.551Z
Target Database: `wanderlust_norm` (working copy)

## 1. Server & Database Settings

- **MySQL Version:** `8.0.43` (CHECK constraints ENFORCED, supported since 8.0.16)
- **Default Storage Engine:** `InnoDB`
- **Database Default Charset / Collation:** `utf8mb4` / `utf8mb4_0900_ai_ci`

## 2. Tables Overview

| Table Name | Engine | Collation | Approx Row Count | Data Size (bytes) | Index Size (bytes) |
|---|---|---|---|---|---|
| `listings` | InnoDB | utf8mb4_0900_ai_ci | 54 | 65536 | 16384 |
| `owner_profile` | InnoDB | utf8mb4_0900_ai_ci | 15 | 16384 | 16384 |
| `reviews` | InnoDB | utf8mb4_0900_ai_ci | 3 | 16384 | 32768 |
| `users` | InnoDB | utf8mb4_0900_ai_ci | 23 | 16384 | 49152 |
| `wishlists` | InnoDB | utf8mb4_0900_ai_ci | 6 | 16384 | 49152 |


## 3. Columns Detail

| Table | # | Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|---|---|
| `listings` | 1 | `listing_id` | `int unsigned` | NO | NULL | PRI | auto_increment |
| `listings` | 2 | `owner_id` | `int unsigned` | NO | NULL | MUL |  |
| `listings` | 3 | `title` | `varchar(255)` | NO | NULL |  |  |
| `listings` | 4 | `description` | `text` | NO | NULL |  |  |
| `listings` | 5 | `price` | `decimal(10,2)` | NO | NULL |  |  |
| `listings` | 6 | `location` | `varchar(255)` | NO | NULL |  |  |
| `listings` | 7 | `country` | `varchar(100)` | NO | NULL |  |  |
| `listings` | 8 | `latitude` | `decimal(9,6)` | YES | NULL |  |  |
| `listings` | 9 | `longitude` | `decimal(9,6)` | YES | NULL |  |  |
| `listings` | 10 | `image_url` | `varchar(500)` | NO | NULL |  |  |
| `listings` | 11 | `image_filename` | `varchar(255)` | YES | NULL |  |  |
| `listings` | 12 | `created_at` | `timestamp` | NO | `CURRENT_TIMESTAMP` |  | DEFAULT_GENERATED |
| `owner_profile` | 1 | `owner_id` | `int unsigned` | NO | NULL | PRI |  |
| `owner_profile` | 2 | `business_name` | `varchar(100)` | NO | NULL |  |  |
| `owner_profile` | 3 | `business_type` | `enum('hotel_owner','property_owner','venue_owner','event_planner')` | NO | NULL |  |  |
| `owner_profile` | 4 | `phone` | `varchar(20)` | YES | NULL |  |  |
| `owner_profile` | 5 | `verification_status` | `enum('pending','approved','rejected','info_requested')` | NO | `pending` | MUL |  |
| `owner_profile` | 6 | `rejection_reason` | `varchar(500)` | YES | NULL |  |  |
| `owner_profile` | 7 | `verification_note` | `varchar(500)` | YES | NULL |  |  |
| `owner_profile` | 8 | `documents` | `json` | YES | NULL |  |  |
| `owner_profile` | 9 | `verified_at` | `timestamp` | YES | NULL |  |  |
| `owner_profile` | 10 | `created_at` | `timestamp` | NO | `CURRENT_TIMESTAMP` |  | DEFAULT_GENERATED |
| `owner_profile` | 11 | `updated_at` | `timestamp` | NO | `CURRENT_TIMESTAMP` |  | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| `reviews` | 1 | `review_id` | `int unsigned` | NO | NULL | PRI | auto_increment |
| `reviews` | 2 | `listing_id` | `int unsigned` | NO | NULL | MUL |  |
| `reviews` | 3 | `user_id` | `int unsigned` | NO | NULL | MUL |  |
| `reviews` | 4 | `rating` | `tinyint` | NO | NULL |  |  |
| `reviews` | 5 | `comment` | `text` | NO | NULL |  |  |
| `reviews` | 6 | `created_at` | `timestamp` | NO | `CURRENT_TIMESTAMP` |  | DEFAULT_GENERATED |
| `users` | 1 | `user_id` | `int unsigned` | NO | NULL | PRI | auto_increment |
| `users` | 2 | `username` | `varchar(50)` | NO | NULL | UNI |  |
| `users` | 3 | `email` | `varchar(255)` | NO | NULL | UNI |  |
| `users` | 4 | `password_hash` | `varchar(255)` | NO | NULL |  |  |
| `users` | 5 | `role` | `enum('customer','owner','admin')` | NO | `customer` |  |  |
| `users` | 6 | `created_at` | `timestamp` | NO | `CURRENT_TIMESTAMP` |  | DEFAULT_GENERATED |
| `users` | 7 | `admin_flag` | `tinyint` | YES | NULL | UNI | STORED GENERATED |
| `users` | 8 | `profile_picture_url` | `varchar(500)` | YES | NULL |  |  |
| `users` | 9 | `profile_picture_public_id` | `varchar(255)` | YES | NULL |  |  |
| `users` | 10 | `phone` | `varchar(20)` | YES | NULL |  |  |
| `users` | 11 | `bio` | `varchar(300)` | YES | NULL |  |  |
| `wishlists` | 1 | `id` | `int unsigned` | NO | NULL | PRI | auto_increment |
| `wishlists` | 2 | `user_id` | `int unsigned` | NO | NULL | MUL |  |
| `wishlists` | 3 | `listing_id` | `int unsigned` | NO | NULL | MUL |  |
| `wishlists` | 4 | `created_at` | `timestamp` | NO | `CURRENT_TIMESTAMP` |  | DEFAULT_GENERATED |


## 4. Keys & Referential Constraints

| Table | Constraint Name | Column | References | ON UPDATE | ON DELETE |
|---|---|---|---|---|---|
| `listings` | `fk_listing_owner` | `owner_id` | `users(user_id)` | NONE | NONE |
| `owner_profile` | `fk_owner_profile_user` | `owner_id` | `users(user_id)` | NONE | NONE |
| `reviews` | `fk_review_listing` | `listing_id` | `listings(listing_id)` | NONE | NONE |
| `reviews` | `fk_review_user` | `user_id` | `users(user_id)` | NONE | NONE |
| `wishlists` | `fk_wishlist_listing` | `listing_id` | `listings(listing_id)` | NONE | NONE |
| `wishlists` | `fk_wishlist_user` | `user_id` | `users(user_id)` | NONE | NONE |


## 5. Constraints

| Table | Constraint Name | Constraint Type |
|---|---|---|
| `listings` | `chk_listing_price` | CHECK |
| `listings` | `fk_listing_owner` | FOREIGN KEY |
| `listings` | `PRIMARY` | PRIMARY KEY |
| `owner_profile` | `fk_owner_profile_user` | FOREIGN KEY |
| `owner_profile` | `PRIMARY` | PRIMARY KEY |
| `reviews` | `chk_review_rating` | CHECK |
| `reviews` | `fk_review_listing` | FOREIGN KEY |
| `reviews` | `fk_review_user` | FOREIGN KEY |
| `reviews` | `PRIMARY` | PRIMARY KEY |
| `users` | `PRIMARY` | PRIMARY KEY |
| `users` | `uq_single_admin` | UNIQUE |
| `users` | `uq_users_email` | UNIQUE |
| `users` | `uq_users_username` | UNIQUE |
| `wishlists` | `fk_wishlist_listing` | FOREIGN KEY |
| `wishlists` | `fk_wishlist_user` | FOREIGN KEY |
| `wishlists` | `PRIMARY` | PRIMARY KEY |
| `wishlists` | `uq_user_listing` | UNIQUE |


### Check Constraints

| Constraint Name | Expression |
|---|---|
| `chk_listing_price` | `(`price` >= 0)` |
| `chk_review_rating` | `(`rating` between 1 and 5)` |


## 6. Indexes & Statistics

| Table | Index Name | Unique? | Seq | Column | Cardinality |
|---|---|---|---|---|---|
| `listings` | `idx_listings_owner` | NO | 1 | `owner_id` | 13 |
| `listings` | `PRIMARY` | YES | 1 | `listing_id` | 54 |
| `owner_profile` | `idx_owner_profile_status` | NO | 1 | `verification_status` | 2 |
| `owner_profile` | `PRIMARY` | YES | 1 | `owner_id` | 15 |
| `reviews` | `fk_review_user` | NO | 1 | `user_id` | 3 |
| `reviews` | `idx_reviews_listing` | NO | 1 | `listing_id` | 3 |
| `reviews` | `PRIMARY` | YES | 1 | `review_id` | 3 |
| `users` | `PRIMARY` | YES | 1 | `user_id` | 23 |
| `users` | `uq_single_admin` | YES | 1 | `admin_flag` | 2 |
| `users` | `uq_users_email` | YES | 1 | `email` | 23 |
| `users` | `uq_users_username` | YES | 1 | `username` | 23 |
| `wishlists` | `idx_wishlists_listing` | NO | 1 | `listing_id` | 5 |
| `wishlists` | `idx_wishlists_user` | NO | 1 | `user_id` | 4 |
| `wishlists` | `PRIMARY` | YES | 1 | `id` | 6 |
| `wishlists` | `uq_user_listing` | YES | 1 | `user_id` | 4 |
| `wishlists` | `uq_user_listing` | YES | 2 | `listing_id` | 6 |


## 7. Table Definitions & Sample Data (Masked)

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
  CONSTRAINT `chk_listing_price` CHECK ((`price` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=129 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

**Actual Row Count in sample:** 20

```json
[
  {
    "listing_id": 22,
    "owner_id": 11,
    "title": "vintage japanese hotel",
    "description": "old styled vintage japanese hotel",
    "price": "5000.00",
    "location": "shibuya",
    "country": "japan",
    "latitude": "35.664455",
    "longitude": "139.698780",
    "image_url": "https://res.cloudinary.com/dkg3y5byr/image/upload/v1791133417/wanderlust/wmffnao6oubsu1p5szi7.jpg",
    "image_filename": "wanderlust/wmffnao6oubsu1p5szi7",
    "created_at": "2026-10-04T17:03:40.000Z"
  },
  {
    "listing_id": 24,
    "owner_id": 16,
    "title": "shashank",
    "description": "hii",
    "price": "150.00",
    "location": "bengaluru",
    "country": "India",
    "latitude": "12.979101",
    "longitude": "77.591301",
    "image_url": "https://res.cloudinary.com/dkg3y5byr/image/upload/v1791348455/wanderlust/a05fosizozitsydp8nwq.jpg",
    "image_filename": "wanderlust/a05fosizozitsydp8nwq",
    "created_at": "2026-10-07T04:47:36.000Z"
  },
  {
    "listing_id": 25,
    "owner_id": 11,
    "title": "grief of the fallen warrior",
    "description": "testtt",
    "price": "15000.00",
    "location": "sheshadripuram,bengaluru,560020",
    "country": "india",
    "latitude": "12.979101",
    "longitude": "77.591301",
    "image_url": "https://res.cloudinary.com/dkg3y5byr/image/upload/v1791904368/wanderlust/frvler3b8iglqggg4hkj.jpg",
    "image_filename": "wanderlust/frvler3b8iglqggg4hkj",
    "created_at": "2026-10-13T15:12:49.000Z"
  },
  {
    "listing_id": 78,
    "owner_id": 30,
    "title": "Serene Boutique Suite in Jaipur",
    "description": "Serene Boutique Suite in Jaipur. A comfortable stay with daily breakfast, fast Wi-Fi, air conditioning and a 24/7 front desk. Located in Jaipur, Rajasthan, India, close to local attractions, dining and transport. Hosted by Aarav Heritage Stays.",
    "price": "3500.00",
    "location": "Jaipur, Rajasthan",
    "country": "India",
    "latitude": "26.912400",
    "longitude": "75.787300",
    "image_url": "https://picsum.photos/seed/wanderlust-aarav_heritage-1/1200/800",
    "image_filename": null,
    "created_at": "2026-10-13T17:17:55.000Z"
  },
  {
    "listing_id": 79,
    "owner_id": 30,
    "title": "Charming Heritage Room in Udaipur",
    "description": "Charming Heritage Room in Udaipur. A comfortable stay with daily breakfast, fast Wi-Fi, air conditioning and a 24/7 front desk. Located in Udaipur, Rajasthan, India, close to local attractions, dining and transport. Hosted by Aarav Heritage Stays.",
    "price": "5650.00",
    "location": "Udaipur, Rajasthan",
    "country": "India",
    "latitude": "24.585400",
    "longitude": "73.712500",
    "image_url": "https://picsum.photos/seed/wanderlust-aarav_heritage-2/1200/800",
    "image_filename": null,
    "created_at": "2026-10-13T17:17:55.000Z"
  },
  {
    "listing_id": 80,
    "owner_id": 30,
    "title": "Elegant Deluxe Suite in Jodhpur",
    "description": "Elegant Deluxe Suite in Jodhpur. A comfortable stay with daily breakfast, fast Wi-Fi, air conditioning and a 24/7 front desk. Located in Jodhpur, Rajasthan, India, close to local attractions, dining and transport. Hosted by Aarav Heritage Stays.",
    "price": "7750.00",
    "location": "Jodhpur, Rajasthan",
    "country": "India",
    "latitude": "26.238900",
    "longitude": "73.024300",
    "image_url": "https://picsum.photos/seed/wanderlust-aarav_heritage-3/1200/800",
    "image_filename": null,
    "created_at": "2026-10-13T17:17:55.000Z"
  },
  {
    "listing_id": 81,
    "owner_id": 30,
    "title": "Sunlit Courtyard Room in Pushkar",
    "description": "Sunlit Courtyard Room in Pushkar. A comfortable stay with daily breakfast, fast Wi-Fi, air conditioning and a 24/7 front desk. Located in Pushkar, Rajasthan, India, close to local attractions, dining and transport. Hosted by Aarav Heritage Stays.",
    "price": "9900.00",
    "location": "Pushkar, Rajasthan",
    "country": "India",
    "latitude": "26.489700",
    "longitude": "74.551100",
    "image_url": "https://picsum.photos/seed/wanderlust-aarav_heritage-4/1200/800",
    "image_filename": null,
    "created_at": "2026-10-13T17:17:55.000Z"
  },
  {
    "listing_id": 82,
    "owner_id": 30,
    "title": "Secluded Skyline Penthouse in Jaisalmer",
    "description": "Secluded Skyline Penthouse in Jaisalmer. A comfortable stay with daily breakfast, fast Wi-Fi, air conditioning and a 24/7 front desk. Located in Jaisalmer, Rajasthan, India, close to local attractions, dining and transport. Hosted by Aarav Heritage Stays.",
    "price": "12000.00",
    "location": "Jaisalmer, Rajasthan",
    "country": "India",
    "latitude": "26.915700",
    "longitude": "70.908300",
    "image_url": "https://picsum.photos/seed/wanderlust-aarav_heritage-5/1200/800",
    "image_filename": null,
    "created_at": "2026-10-13T17:17:55.000Z"
  },
  {
    "listing_id": 83,
    "owner_id": 31,
    "title": "Charming Private Villa in Madikeri",
    "description": "Charming Private Villa in Madikeri. An entire property for your group with a fully equipped kitchen, parking and a private outdoor area. Located in Madikeri, Karnataka, India, close to local attractions, dining and transport. Hosted by Coorg Escapes.",
    "price": "2500.00",
    "location": "Madikeri, Karnataka",
    "country": "India",
    "latitude": "12.424400",
    "longitude": "75.738200",
    "image_url": "https://picsum.photos/seed/wanderlust-coorg_escapes-1/1200/800",
    "image_filename": null,
    "created_at": "2026-10-13T17:17:55.000Z"
  },
  {
    "listing_id": 84,
    "owner_id": 31,
    "title": "Elegant Cozy Cottage in Sakleshpur",
    "description": "Elegant Cozy Cottage in Sakleshpur. An entire property for your group with a fully equipped kitchen, parking and a private outdoor area. Located in Sakleshpur, Karnataka, India, close to local attractions, dining and transport. Hosted by Coorg Escapes.",
    "price": "4150.00",
    "location": "Sakleshpur, Karnataka",
    "country": "India",
    "latitude": "12.941900",
    "longitude": "75.784500",
    "image_url": "https://picsum.photos/seed/wanderlust-coorg_escapes-2/1200/800",
    "image_filename": null,
    "created_at": "2026-10-13T17:17:55.000Z"
  },
  {
    "listing_id": 85,
    "owner_id": 31,
    "title": "Sunlit Garden Bungalow in Chikmagalur",
    "description": "Sunlit Garden Bungalow in Chikmagalur. An entire property for your group with a fully equipped kitchen, parking and a private outdoor area. Located in Chikmagalur, Karnataka, India, close to local attractions, dining and transport. Hosted by Coorg Escapes.",
    "price": "5750.00",
    "location": "Chikmagalur, Karnataka",
    "country": "India",
    "latitude": "13.316100",
    "longitude": "75.772000",
    "image_url": "https://picsum.photos/seed/wanderlust-coorg_escapes-3/1200/800",
    "image_filename": null,
    "created_at": "2026-10-13T17:17:55.000Z"
  },
  {
    "listing_id": 86,
    "owner_id": 31,
    "title": "Secluded Family Homestay in Kalpetta",
    "description": "Secluded Family Homestay in Kalpetta. An entire property for your group with a fully equipped kitchen, parking and a private outdoor area. Located in Kalpetta, Kerala, India, close to local attractions, dining and transport. Hosted by Coorg Escapes.",
    "price": "7400.00",
    "location": "Kalpetta, Kerala",
    "country": "India",
    "latitude": "11.610300",
    "longitude": "76.083000",
    "image_url": "https://picsum.photos/seed/wanderlust-coorg_escapes-4/1200/800",
    "image_filename": null,
    "created_at": "2026-10-13T17:17:55.000Z"
  },
  {
    "listing_id": 87,
    "owner_id": 31,
    "title": "Lively Hillside Retreat in Ooty",
    "description": "Lively Hillside Retreat in Ooty. An entire property for your group with a fully equipped kitchen, parking and a private outdoor area. Located in Ooty, Tamil Nadu, India, close to local attractions, dining and transport. Hosted by Coorg Escapes.",
    "price": "9000.00",
    "location": "Ooty, Tamil Nadu",
    "country": "India",
    "latitude": "11.410200",
    "longitude": "76.695000",
    "image_url": "https://picsum.photos/seed/wanderlust-coorg_escapes-5/1200/800",
    "image_filename": null,
    "created_at": "2026-10-13T17:17:55.000Z"
  },
  {
    "listing_id": 88,
    "owner_id": 32,
    "title": "Elegant Private Villa in Anjuna",
    "description": "Elegant Private Villa in Anjuna. An entire property for your group with a fully equipped kitchen, parking and a private outdoor area. Located in Anjuna, Goa, India, close to local attractions, dining and transport. Hosted by Goa Getaways.",
    "price": "4000.00",
    "location": "Anjuna, Goa",
    "country": "India",
    "latitude": "15.573600",
    "longitude": "73.741300",
    "image_url": "https://picsum.photos/seed/wanderlust-goa_getaways-1/1200/800",
    "image_filename": null,
    "created_at": "2026-10-13T17:17:55.000Z"
  },
  {
    "listing_id": 89,
    "owner_id": 32,
    "title": "Sunlit Cozy Cottage in Palolem",
    "description": "Sunlit Cozy Cottage in Palolem. An entire property for your group with a fully equipped kitchen, parking and a private outdoor area. Located in Palolem, Goa, India, close to local attractions, dining and transport. Hosted by Goa Getaways.",
    "price": "6750.00",
    "location": "Palolem, Goa",
    "country": "India",
    "latitude": "15.010000",
    "longitude": "74.023200",
    "image_url": "https://picsum.photos/seed/wanderlust-goa_getaways-2/1200/800",
    "image_filename": null,
    "created_at": "2026-10-13T17:17:55.000Z"
  },
  {
    "listing_id": 90,
    "owner_id": 32,
    "title": "Secluded Garden Bungalow in Candolim",
    "description": "Secluded Garden Bungalow in Candolim. An entire property for your group with a fully equipped kitchen, parking and a private outdoor area. Located in Candolim, Goa, India, close to local attractions, dining and transport. Hosted by Goa Getaways.",
    "price": "9500.00",
    "location": "Candolim, Goa",
    "country": "India",
    "latitude": "15.518000",
    "longitude": "73.762000",
    "image_url": "https://picsum.photos/seed/wanderlust-goa_getaways-3/1200/800",
    "image_filename": null,
    "created_at": "2026-10-13T17:17:55.000Z"
  },
  {
    "listing_id": 91,
    "owner_id": 32,
    "title": "Lively Family Homestay in Panaji",
    "description": "Lively Family Homestay in Panaji. An entire property for your group with a fully equipped kitchen, parking and a private outdoor area. Located in Panaji, Goa, India, close to local attractions, dining and transport. Hosted by Goa Getaways.",
    "price": "12250.00",
    "location": "Panaji, Goa",
    "country": "India",
    "latitude": "15.490900",
    "longitude": "73.827800",
    "image_url": "https://picsum.photos/seed/wanderlust-goa_getaways-4/1200/800",
    "image_filename": null,
    "created_at": "2026-10-13T17:17:55.000Z"
  },
  {
    "listing_id": 92,
    "owner_id": 32,
    "title": "Modern Hillside Retreat in Morjim",
    "description": "Modern Hillside Retreat in Morjim. An entire property for your group with a fully equipped kitchen, parking and a private outdoor area. Located in Morjim, Goa, India, close to local attractions, dining and transport. Hosted by Goa Getaways.",
    "price": "15000.00",
    "location": "Morjim, Goa",
    "country": "India",
    "latitude": "15.631000",
    "longitude": "73.739000",
    "image_url": "https://picsum.photos/seed/wanderlust-goa_getaways-5/1200/800",
    "image_filename": null,
    "created_at": "2026-10-13T17:17:55.000Z"
  },
  {
    "listing_id": 93,
    "owner_id": 33,
    "title": "Sunlit Private Villa in Florence",
    "description": "Sunlit Private Villa in Florence. An entire property for your group with a fully equipped kitchen, parking and a private outdoor area. Located in Florence, Tuscany, Italy, close to local attractions, dining and transport. Hosted by Tuscany Villas Co..",
    "price": "150.00",
    "location": "Florence, Tuscany",
    "country": "Italy",
    "latitude": "43.769600",
    "longitude": "11.255800",
    "image_url": "https://picsum.photos/seed/wanderlust-tuscany_villas-1/1200/800",
    "image_filename": null,
    "created_at": "2026-10-13T17:17:55.000Z"
  },
  {
    "listing_id": 94,
    "owner_id": 33,
    "title": "Secluded Cozy Cottage in Siena",
    "description": "Secluded Cozy Cottage in Siena. An entire property for your group with a fully equipped kitchen, parking and a private outdoor area. Located in Siena, Tuscany, Italy, close to local attractions, dining and transport. Hosted by Tuscany Villas Co..",
    "price": "265.00",
    "location": "Siena, Tuscany",
    "country": "Italy",
    "latitude": "43.318800",
    "longitude": "11.330800",
    "image_url": "https://picsum.photos/seed/wanderlust-tuscany_villas-2/1200/800",
    "image_filename": null,
    "created_at": "2026-10-13T17:17:55.000Z"
  }
]
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
  `documents` json DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`owner_id`),
  KEY `idx_owner_profile_status` (`verification_status`),
  CONSTRAINT `fk_owner_profile_user` FOREIGN KEY (`owner_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

**Actual Row Count in sample:** 15

```json
[
  {
    "owner_id": 11,
    "business_name": "ramesh",
    "business_type": "hotel_owner",
    "phone": "8198775645",
    "verification_status": "approved",
    "rejection_reason": null,
    "verification_note": null,
    "documents": null,
    "verified_at": "2026-10-13T18:47:58.000Z",
    "created_at": "2026-10-04T12:51:06.000Z",
    "updated_at": "2026-10-13T18:47:58.000Z"
  },
  {
    "owner_id": 16,
    "business_name": "sachin",
    "business_type": "hotel_owner",
    "phone": "9483888322",
    "verification_status": "approved",
    "rejection_reason": null,
    "verification_note": null,
    "documents": null,
    "verified_at": "2026-10-07T04:46:08.000Z",
    "created_at": "2026-10-07T04:45:39.000Z",
    "updated_at": "2026-10-07T04:46:08.000Z"
  },
  {
    "owner_id": 30,
    "business_name": "Aarav Heritage Stays",
    "business_type": "hotel_owner",
    "phone": "+91 98450 10001",
    "verification_status": "approved",
    "rejection_reason": null,
    "verification_note": null,
    "documents": null,
    "verified_at": "2026-10-13T17:17:55.000Z",
    "created_at": "2026-10-13T17:17:55.000Z",
    "updated_at": "2026-10-13T17:17:55.000Z"
  },
  {
    "owner_id": 31,
    "business_name": "Coorg Escapes",
    "business_type": "property_owner",
    "phone": "+91 98450 10002",
    "verification_status": "approved",
    "rejection_reason": null,
    "verification_note": null,
    "documents": null,
    "verified_at": "2026-10-13T17:17:55.000Z",
    "created_at": "2026-10-13T17:17:55.000Z",
    "updated_at": "2026-10-13T17:17:55.000Z"
  },
  {
    "owner_id": 32,
    "business_name": "Goa Getaways",
    "business_type": "property_owner",
    "phone": "+91 98450 10003",
    "verification_status": "approved",
    "rejection_reason": null,
    "verification_note": null,
    "documents": null,
    "verified_at": "2026-10-13T17:17:55.000Z",
    "created_at": "2026-10-13T17:17:55.000Z",
    "updated_at": "2026-10-13T17:17:55.000Z"
  },
  {
    "owner_id": 33,
    "business_name": "Tuscany Villas Co.",
    "business_type": "property_owner",
    "phone": "+39 055 555 0104",
    "verification_status": "approved",
    "rejection_reason": null,
    "verification_note": null,
    "documents": null,
    "verified_at": "2026-10-13T17:17:55.000Z",
    "created_at": "2026-10-13T17:17:55.000Z",
    "updated_at": "2026-10-13T17:17:55.000Z"
  },
  {
    "owner_id": 34,
    "business_name": "Bali Retreats",
    "business_type": "hotel_owner",
    "phone": "+62 361 555 0105",
    "verification_status": "approved",
    "rejection_reason": null,
    "verification_note": null,
    "documents": null,
    "verified_at": "2026-10-13T17:17:55.000Z",
    "created_at": "2026-10-13T17:17:55.000Z",
    "updated_at": "2026-10-13T17:17:55.000Z"
  },
  {
    "owner_id": 35,
    "business_name": "Alpine Lodges",
    "business_type": "hotel_owner",
    "phone": "+41 27 555 0106",
    "verification_status": "approved",
    "rejection_reason": null,
    "verification_note": null,
    "documents": null,
    "verified_at": "2026-10-13T17:17:55.000Z",
    "created_at": "2026-10-13T17:17:55.000Z",
    "updated_at": "2026-10-13T17:17:55.000Z"
  },
  {
    "owner_id": 36,
    "business_name": "Paris Venues & Salons",
    "business_type": "venue_owner",
    "phone": "+33 1 55 50 0107",
    "verification_status": "approved",
    "rejection_reason": null,
    "verification_note": null,
    "documents": null,
    "verified_at": "2026-10-13T17:17:55.000Z",
    "created_at": "2026-10-13T17:17:55.000Z",
    "updated_at": "2026-10-13T17:17:55.000Z"
  },
  {
    "owner_id": 37,
    "business_name": "Dubai Event Co.",
    "business_type": "event_planner",
    "phone": "+971 4 555 0108",
    "verification_status": "approved",
    "rejection_reason": null,
    "verification_note": null,
    "documents": null,
    "verified_at": "2026-10-13T17:17:55.000Z",
    "created_at": "2026-10-13T17:17:55.000Z",
    "updated_at": "2026-10-13T17:17:55.000Z"
  },
  {
    "owner_id": 38,
    "business_name": "Kerala Backwater Homes",
    "business_type": "property_owner",
    "phone": "+91 98450 10009",
    "verification_status": "approved",
    "rejection_reason": null,
    "verification_note": null,
    "documents": null,
    "verified_at": "2026-10-13T17:17:55.000Z",
    "created_at": "2026-10-13T17:17:55.000Z",
    "updated_at": "2026-10-13T17:17:55.000Z"
  },
  {
    "owner_id": 39,
    "business_name": "NYC Loft Venues",
    "business_type": "venue_owner",
    "phone": "+1 212 555 0110",
    "verification_status": "approved",
    "rejection_reason": null,
    "verification_note": null,
    "documents": null,
    "verified_at": "2026-10-13T17:17:55.000Z",
    "created_at": "2026-10-13T17:17:55.000Z",
    "updated_at": "2026-10-13T17:17:55.000Z"
  },
  {
    "owner_id": 42,
    "business_name": "bharath",
    "business_type": "hotel_owner",
    "phone": "8795594849",
    "verification_status": "approved",
    "rejection_reason": null,
    "verification_note": null,
    "documents": null,
    "verified_at": "2026-10-14T04:26:02.000Z",
    "created_at": "2026-10-14T03:39:30.000Z",
    "updated_at": "2026-10-14T04:26:02.000Z"
  },
  {
    "owner_id": 43,
    "business_name": "sujay",
    "business_type": "hotel_owner",
    "phone": "7688585484",
    "verification_status": "approved",
    "rejection_reason": null,
    "verification_note": null,
    "documents": null,
    "verified_at": "2026-10-14T04:26:03.000Z",
    "created_at": "2026-10-14T04:23:52.000Z",
    "updated_at": "2026-10-14T04:26:03.000Z"
  },
  {
    "owner_id": 50,
    "business_name": "satwik",
    "business_type": "hotel_owner",
    "phone": "9896678959",
    "verification_status": "pending",
    "rejection_reason": null,
    "verification_note": null,
    "documents": [
      {
        "url": "https://res.cloudinary.com/dkg3y5byr/image/upload/v1793724452/wanderlust/owner-documents/brwaqyepkbjto6dbrduk.png",
        "size": 784865,
        "mimeType": "image/png",
        "publicId": "wanderlust/owner-documents/brwaqyepkbjto6dbrduk",
        "uploadedAt": "2026-11-03T16:47:33.483Z",
        "originalName": "api_sentinel_solution_workflow.png",
        "resourceType": "image"
      },
      {
        "url": "https://res.cloudinary.com/dkg3y5byr/image/upload/v1793724452/wanderlust/owner-documents/wixh2xs79cqhk8lnf47s.png",
        "size": 973430,
        "mimeType": "image/png",
        "publicId": "wanderlust/owner-documents/wixh2xs79cqhk8lnf47s",
        "uploadedAt": "2026-11-03T16:47:33.503Z",
        "originalName": "api_sentinel_system_architecture.png",
        "resourceType": "image"
      },
      {
        "url": "https://res.cloudinary.com/dkg3y5byr/image/upload/v1793724451/wanderlust/owner-documents/myajdfzad2ud7ps06iyc.jpg",
        "size": 100828,
        "mimeType": "image/jpeg",
        "publicId": "wanderlust/owner-documents/myajdfzad2ud7ps06iyc",
        "uploadedAt": "2026-11-03T16:47:32.461Z",
        "originalName": "s-10.jpg",
        "resourceType": "image"
      }
    ],
    "verified_at": null,
    "created_at": "2026-11-03T16:47:33.000Z",
    "updated_at": "2026-11-03T16:47:33.000Z"
  }
]
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

**Actual Row Count in sample:** 3

```json
[
  {
    "review_id": 4,
    "listing_id": 22,
    "user_id": 11,
    "rating": 1,
    "comment": "nice one",
    "created_at": "2026-10-07T04:14:18.000Z"
  },
  {
    "review_id": 5,
    "listing_id": 24,
    "user_id": 16,
    "rating": 1,
    "comment": "not worth it",
    "created_at": "2026-10-07T04:48:03.000Z"
  },
  {
    "review_id": 6,
    "listing_id": 86,
    "user_id": 4,
    "rating": 5,
    "comment": "nice experience",
    "created_at": "2026-10-14T03:30:31.000Z"
  }
]
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
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

**Actual Row Count in sample:** 20

```json
[
  {
    "user_id": 4,
    "username": "Shamanth P",
    "email": "sh***@gmail.com",
    "password_hash": "[MASKED_HASH]",
    "role": "admin",
    "created_at": "2026-10-03T13:18:06.000Z",
    "admin_flag": 1,
    "profile_picture_url": null,
    "profile_picture_public_id": null,
    "phone": null,
    "bio": null
  },
  {
    "user_id": 5,
    "username": "shashank",
    "email": "sh***@gmail.com",
    "password_hash": "[MASKED_HASH]",
    "role": "customer",
    "created_at": "2026-10-03T13:20:29.000Z",
    "admin_flag": null,
    "profile_picture_url": null,
    "profile_picture_public_id": null,
    "phone": null,
    "bio": null
  },
  {
    "user_id": 11,
    "username": "ramesha",
    "email": "ra***@gmail.com",
    "password_hash": "[MASKED_HASH]",
    "role": "owner",
    "created_at": "2026-10-04T12:51:06.000Z",
    "admin_flag": null,
    "profile_picture_url": "https://res.cloudinary.com/dkg3y5byr/image/upload/v1791355839/wanderlust/avatars/qy4zjqdokt3asdepjh47.jpg",
    "profile_picture_public_id": "wanderlust/avatars/qy4zjqdokt3asdepjh47",
    "phone": null,
    "bio": null
  },
  {
    "user_id": 13,
    "username": "subramanya",
    "email": "su***@gmail.com",
    "password_hash": "[MASKED_HASH]",
    "role": "customer",
    "created_at": "2026-10-07T04:03:23.000Z",
    "admin_flag": null,
    "profile_picture_url": null,
    "profile_picture_public_id": null,
    "phone": null,
    "bio": null
  },
  {
    "user_id": 16,
    "username": "sachin",
    "email": "sa***@gmail.com",
    "password_hash": "[MASKED_HASH]",
    "role": "owner",
    "created_at": "2026-10-07T04:45:39.000Z",
    "admin_flag": null,
    "profile_picture_url": null,
    "profile_picture_public_id": null,
    "phone": null,
    "bio": null
  },
  {
    "user_id": 18,
    "username": "sumeet",
    "email": "su***@gmail.com",
    "password_hash": "[MASKED_HASH]",
    "role": "customer",
    "created_at": "2026-10-13T08:36:04.000Z",
    "admin_flag": null,
    "profile_picture_url": null,
    "profile_picture_public_id": null,
    "phone": null,
    "bio": null
  },
  {
    "user_id": 30,
    "username": "aarav_heritage",
    "email": "aa***@seed.wanderlust.test",
    "password_hash": "[MASKED_HASH]",
    "role": "owner",
    "created_at": "2026-10-13T17:17:55.000Z",
    "admin_flag": null,
    "profile_picture_url": null,
    "profile_picture_public_id": null,
    "phone": "+91 98450 10001",
    "bio": "Family-run heritage hotels across Rajasthan."
  },
  {
    "user_id": 31,
    "username": "coorg_escapes",
    "email": "co***@seed.wanderlust.test",
    "password_hash": "[MASKED_HASH]",
    "role": "owner",
    "created_at": "2026-10-13T17:17:55.000Z",
    "admin_flag": null,
    "profile_picture_url": null,
    "profile_picture_public_id": null,
    "phone": "+91 98450 10002",
    "bio": "Plantation homestays and hill cottages in the Western Ghats."
  },
  {
    "user_id": 32,
    "username": "goa_getaways",
    "email": "go***@seed.wanderlust.test",
    "password_hash": "[MASKED_HASH]",
    "role": "owner",
    "created_at": "2026-10-13T17:17:55.000Z",
    "admin_flag": null,
    "profile_picture_url": null,
    "profile_picture_public_id": null,
    "phone": "+91 98450 10003",
    "bio": "Beach villas and private pool houses in Goa."
  },
  {
    "user_id": 33,
    "username": "tuscany_villas",
    "email": "tu***@seed.wanderlust.test",
    "password_hash": "[MASKED_HASH]",
    "role": "owner",
    "created_at": "2026-10-13T17:17:55.000Z",
    "admin_flag": null,
    "profile_picture_url": null,
    "profile_picture_public_id": null,
    "phone": "+39 055 555 0104",
    "bio": "Countryside villas and farmhouses in Tuscany."
  },
  {
    "user_id": 34,
    "username": "bali_retreats",
    "email": "ba***@seed.wanderlust.test",
    "password_hash": "[MASKED_HASH]",
    "role": "owner",
    "created_at": "2026-10-13T17:17:55.000Z",
    "admin_flag": null,
    "profile_picture_url": null,
    "profile_picture_public_id": null,
    "phone": "+62 361 555 0105",
    "bio": "Boutique resorts and yoga retreats across Bali."
  },
  {
    "user_id": 35,
    "username": "alpine_lodges",
    "email": "al***@seed.wanderlust.test",
    "password_hash": "[MASKED_HASH]",
    "role": "owner",
    "created_at": "2026-10-13T17:17:55.000Z",
    "admin_flag": null,
    "profile_picture_url": null,
    "profile_picture_public_id": null,
    "phone": "+41 27 555 0106",
    "bio": "Mountain lodges and ski chalets in the Swiss Alps."
  },
  {
    "user_id": 36,
    "username": "paris_venues",
    "email": "pa***@seed.wanderlust.test",
    "password_hash": "[MASKED_HASH]",
    "role": "owner",
    "created_at": "2026-10-13T17:17:55.000Z",
    "admin_flag": null,
    "profile_picture_url": null,
    "profile_picture_public_id": null,
    "phone": "+33 1 55 50 0107",
    "bio": "Historic salons, courtyards and rooftop venues in France."
  },
  {
    "user_id": 37,
    "username": "dubai_events",
    "email": "du***@seed.wanderlust.test",
    "password_hash": "[MASKED_HASH]",
    "role": "owner",
    "created_at": "2026-10-13T17:17:55.000Z",
    "admin_flag": null,
    "profile_picture_url": null,
    "profile_picture_public_id": null,
    "phone": "+971 4 555 0108",
    "bio": "End-to-end planners for weddings and corporate events in the UAE."
  },
  {
    "user_id": 38,
    "username": "kerala_backwaters",
    "email": "ke***@seed.wanderlust.test",
    "password_hash": "[MASKED_HASH]",
    "role": "owner",
    "created_at": "2026-10-13T17:17:55.000Z",
    "admin_flag": null,
    "profile_picture_url": null,
    "profile_picture_public_id": null,
    "phone": "+91 98450 10009",
    "bio": "Houseboats, heritage homes and tea-estate bungalows in Kerala."
  },
  {
    "user_id": 39,
    "username": "nyc_loft_venues",
    "email": "ny***@seed.wanderlust.test",
    "password_hash": "[MASKED_HASH]",
    "role": "owner",
    "created_at": "2026-10-13T17:17:55.000Z",
    "admin_flag": null,
    "profile_picture_url": null,
    "profile_picture_public_id": null,
    "phone": "+1 212 555 0110",
    "bio": "Lofts, studios and event spaces across New York."
  },
  {
    "user_id": 40,
    "username": "subramanya hs",
    "email": "su***@gmail.com",
    "password_hash": "[MASKED_HASH]",
    "role": "customer",
    "created_at": "2026-10-14T03:33:53.000Z",
    "admin_flag": null,
    "profile_picture_url": "https://res.cloudinary.com/dkg3y5byr/image/upload/v1791948831/wanderlust/avatars/p4udsg98zed85lebqaio.jpg",
    "profile_picture_public_id": "wanderlust/avatars/p4udsg98zed85lebqaio",
    "phone": null,
    "bio": null
  },
  {
    "user_id": 42,
    "username": "bharath",
    "email": "bh***@gmail.com",
    "password_hash": "[MASKED_HASH]",
    "role": "owner",
    "created_at": "2026-10-14T03:39:30.000Z",
    "admin_flag": null,
    "profile_picture_url": null,
    "profile_picture_public_id": null,
    "phone": "8795594849",
    "bio": null
  },
  {
    "user_id": 43,
    "username": "sujay",
    "email": "su***@gmail.com",
    "password_hash": "[MASKED_HASH]",
    "role": "owner",
    "created_at": "2026-10-14T04:23:52.000Z",
    "admin_flag": null,
    "profile_picture_url": null,
    "profile_picture_public_id": null,
    "phone": "7688585484",
    "bio": null
  },
  {
    "user_id": 44,
    "username": "shubha",
    "email": "un***@gmail.com",
    "password_hash": "[MASKED_HASH]",
    "role": "customer",
    "created_at": "2026-11-02T09:28:30.000Z",
    "admin_flag": null,
    "profile_picture_url": null,
    "profile_picture_public_id": null,
    "phone": null,
    "bio": null
  }
]
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
  KEY `idx_wishlists_user` (`user_id`),
  KEY `idx_wishlists_listing` (`listing_id`),
  CONSTRAINT `fk_wishlist_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`listing_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wishlist_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

**Actual Row Count in sample:** 6

```json
[
  {
    "id": 3,
    "user_id": 11,
    "listing_id": 22,
    "created_at": "2026-10-07T06:52:53.000Z"
  },
  {
    "id": 7,
    "user_id": 4,
    "listing_id": 78,
    "created_at": "2026-10-13T18:08:15.000Z"
  },
  {
    "id": 8,
    "user_id": 4,
    "listing_id": 86,
    "created_at": "2026-10-14T03:30:40.000Z"
  },
  {
    "id": 9,
    "user_id": 4,
    "listing_id": 82,
    "created_at": "2026-10-14T03:32:14.000Z"
  },
  {
    "id": 11,
    "user_id": 44,
    "listing_id": 78,
    "created_at": "2026-11-02T09:28:38.000Z"
  },
  {
    "id": 12,
    "user_id": 45,
    "listing_id": 81,
    "created_at": "2026-11-02T10:02:28.000Z"
  }
]
```

## 8. Table → Code Usage Map

### Usage of `listings`

| File | Line | Snippet |
|---|---|---|
| `app.js` | 107 | `app.use("/listings", listingRoutes);` |
| `app.js` | 110 | `app.use("/listings/:id/reviews", reviewRoutes);` |
| `config/dashboardSections.js` | 17 | `{ key: "listings", label: "My Listings", icon: "fa-solid fa-list", path: "/dashboard/listings" },` |
| `config/dashboardSections.js` | 20 | `{ key: "listings", label: "Manage Listings", icon: "fa-solid fa-hotel", path: "/dashboard/listings" },` |
| `controller/dashboard.js` | 29 | `return res.redirect("/dashboard/listings");` |
| `controller/dashboard.js` | 133 | `* GET /dashboard/listings (Owner & Admin)` |
| `controller/dashboard.js` | 136 | `let listings;` |
| `controller/dashboard.js` | 142 | `FROM listings` |
| `controller/dashboard.js` | 145 | `listings = rows.map((r) => ({` |
| `controller/dashboard.js` | 156 | `listings = await Listing.findByOwnerId(req.user.id);` |
| `controller/dashboard.js` | 159 | `res.render("dashboard/listings.ejs", {` |
| `controller/dashboard.js` | 160 | `listings,` |
| `controller/dashboard.js` | 162 | `activeSection: "listings",` |
| `controller/dashboard.js` | 331 | `let listings = [];` |
| `controller/dashboard.js` | 336 | `listings = await Listing.findByOwnerId(userId);` |
| `controller/dashboard.js` | 346 | `listings,` |
| `controller/dashboard.js` | 388 | `* DELETE /dashboard/users/:userId/listings/:listingId (Admin delete listing)` |
| `controller/listings.js` | 19 | `res.render("listings/index.ejs", {` |
| `controller/listings.js` | 34 | `res.render("listings/new.ejs");` |
| `controller/listings.js` | 47 | `return res.redirect("/listings");` |
| `controller/listings.js` | 55 | `res.render("listings/show.ejs", { listing, isWishlisted });` |
| `controller/listings.js` | 65 | `return res.redirect("/listings/new");` |
| `controller/listings.js` | 76 | `return res.redirect("/listings/new");` |
| `controller/listings.js` | 82 | `return res.redirect("/listings/new");` |
| `controller/listings.js` | 102 | `res.redirect("/listings");` |
| `controller/listings.js` | 114 | `return res.redirect("/listings");` |
| `controller/listings.js` | 117 | `res.render("listings/edit.ejs", { listing });` |
| `controller/listings.js` | 130 | `return res.redirect("/listings");` |
| `controller/listings.js` | 148 | `return res.redirect('/listings/${id}/edit');` |
| `controller/listings.js` | 153 | `return res.redirect('/listings/${id}/edit');` |
| `controller/listings.js` | 168 | `res.redirect('/listings/${id}');` |
| `controller/listings.js` | 180 | `res.redirect("/listings");` |
| `controller/reviews.js` | 17 | `res.redirect('/listings/${id}');` |
| `controller/reviews.js` | 25 | `res.redirect('/listings/${id}');` |
| `controller/user.js` | 117 | `res.redirect("/listings");` |
| `controller/user.js` | 153 | `res.redirect("/listings");` |
| `controller/wishlist.js` | 3 | `* Handles adding and removing listings from a customer's wishlist.` |
| `controller/wishlist.js` | 22 | `return res.redirect("/listings");` |
| `controller/wishlist.js` | 31 | `return res.redirect("/listings");` |
| `controller/wishlist.js` | 41 | `res.redirect('/listings/${listingId}');` |
| `controller/wishlist.js` | 67 | `: '/listings/${listingId}';` |
| `db/migrate.js` | 56 | `WHERE user_id IN (SELECT DISTINCT owner_id FROM listings)'` |
| `db/migrate.js` | 126 | `// Step 6: grandfather existing owners with listings (approved profile)` |
| `db/migrate.js` | 133 | `AND EXISTS (SELECT 1 FROM listings l WHERE l.owner_id = u.user_id)` |
| `db/migrate.js` | 140 | `'Step 6: Grandfathered owners with listings (approved profiles: ${countRows[0].c} total).'` |
| `db/migrate.js` | 188 | `REFERENCES listings (listing_id) ON DELETE CASCADE,` |
| `db/seed.js` | 6 | `* 2. Clears reviews and listings (RESTRICT keeps users safe; we clear explicitly).` |
| `db/seed.js` | 8 | `* 4. Inserts all 10 sample listings in one transaction.` |
| `db/seed.js` | 197 | `// -- Clear existing listings & reviews (users preserved) ---------------` |
| `db/seed.js` | 200 | `await conn.query("DELETE FROM listings");` |
| `db/seed.js` | 249 | `// -- Insert listings in a transaction ---------------------------------` |
| `db/seed.js` | 257 | `'INSERT INTO listings` |
| `db/seed.js` | 276 | `console.log('Inserted ${sampleListings.length} listings.');` |
| `middleware.js` | 31 | `return res.redirect("/listings");` |
| `middleware.js` | 36 | `return res.redirect('/listings/${id}');` |
| `middleware.js` | 49 | `return res.redirect('/listings/${id}');` |
| `middleware.js` | 54 | `return res.redirect('/listings/${id}');` |
| `middleware.js` | 61 | `* Middleware: only an approved owner may manage listings.` |
| `middleware.js` | 76 | `req.flash("error", "Only approved property or venue owners can add or edit listings.");` |
| `middleware.js` | 77 | `return res.redirect("/listings");` |
| `middleware.js` | 80 | `pending:        "Your owner application is awaiting admin approval. You can add listings once it is approved.",` |
| `middleware.js` | 107 | `return res.redirect("/listings");` |
| `models/listing.js` | 62 | `FROM listings l` |
| `models/listing.js` | 132 | `FROM listings l` |
| `models/listing.js` | 173 | `FROM listings l` |
| `models/listing.js` | 189 | `"SELECT owner_id FROM listings WHERE listing_id = ? LIMIT 1",` |
| `models/listing.js` | 212 | `'INSERT INTO listings` |
| `models/listing.js` | 256 | `'UPDATE listings` |
| `models/listing.js` | 276 | `'UPDATE listings` |
| `models/listing.js` | 296 | `* findByOwnerId – returns all listings owned by a specific user.` |
| `models/listing.js` | 304 | `FROM listings` |
| `models/listing.js` | 329 | `"DELETE FROM listings WHERE listing_id = ?",` |
| `models/listing.js` | 342 | `"SELECT image_filename FROM listings WHERE listing_id = ? LIMIT 1",` |
| `models/user.js` | 221 | `LEFT JOIN listings l ON l.owner_id = u.user_id` |
| `models/user.js` | 254 | `// 2. Fetch all listings owned by user to delete Cloudinary images` |
| `models/user.js` | 256 | `"SELECT image_filename FROM listings WHERE owner_id = ?",` |
| `models/user.js` | 265 | `// 3. Delete listings owned by user (to satisfy FK RESTRICT)` |
| `models/user.js` | 266 | `await pool.execute("DELETE FROM listings WHERE owner_id = ?", [parsed]);` |
| `models/wishlist.js` | 62 | `* Get all listings saved in a user's wishlist.` |
| `models/wishlist.js` | 72 | `JOIN listings l ON l.listing_id = w.listing_id` |
| `routes/dashboard.js` | 48 | `// 4. Owner & Admin: Listings` |
| `routes/dashboard.js` | 50 | `"/listings",` |
| `routes/dashboard.js` | 102 | `"/users/:userId/listings/:listingId",` |
| `routes/landing.js` | 4 | `* Logged-in visitors are redirected to /listings.` |
| `routes/landing.js` | 18 | `return res.redirect("/listings");` |
| `routes/landing.js` | 20 | `let listings = [];` |
| `routes/landing.js` | 22 | `listings = await Listing.findAll();` |
| `routes/landing.js` | 24 | `console.error("Error fetching listings for landing carousel:", err);` |
| `routes/landing.js` | 25 | `listings = [];` |
| `routes/landing.js` | 27 | `res.render("landing.ejs", { listings });` |
| `routes/listing.js` | 8 | `const listingController = require("../controller/listings.js");` |
| `seed/apply-seed.js` | 41 | `"SELECT COUNT(*) AS count FROM listings WHERE owner_id IN (SELECT user_id FROM users WHERE email LIKE '%@seed.wanderlust` |
| `seed/apply-seed.js` | 45 | `console.log('Seeded Listings: ${listingsCount[0].count}');` |
| `seed/generate-seed.js` | 103 | `out.push('-- Cleanup of previous seed run (listings first: owner FK is ON DELETE RESTRICT)');` |
| `seed/generate-seed.js` | 104 | `out.push('DELETE FROM listings WHERE owner_id IN (SELECT user_id FROM users WHERE email LIKE '%@${DOMAIN}');');` |
| `seed/generate-seed.js` | 133 | `out.push('INSERT INTO listings (owner_id, title, description, price, location, country, latitude, longitude, image_url) ` |
| `seed/generate-seed.js` | 139 | `console.log('Wrote seed/seed.sql (10 owners, 50 listings)');` |
| `tests/dashboard_phase4.test.js` | 60 | `it("Owner GET /dashboard -> redirects to /dashboard/listings", async () => {` |
| `tests/dashboard_phase4.test.js` | 68 | `assert.equal(res.headers.location, "/dashboard/listings");` |
| `tests/dashboard_phase4.test.js` | 257 | `// 4. Owner: My Listings` |
| `tests/dashboard_phase4.test.js` | 260 | `it("Approved owner sees only their listings on /dashboard/listings", async () => {` |
| `tests/dashboard_phase4.test.js` | 271 | `const res = await ag.get("/dashboard/listings");` |
| `tests/dashboard_phase4.test.js` | 273 | `assert.match(res.text, /My Listings/);` |
| `tests/dashboard_phase4.test.js` | 274 | `assert.match(res.text, new RegExp('/listings/${lA}'));` |
| `tests/dashboard_phase4.test.js` | 284 | `const res = await ag.get("/dashboard/listings");` |
| `tests/dashboard_phase4.test.js` | 289 | `it("Customer cannot access /dashboard/listings -> 302 redirect", async () => {` |
| `tests/dashboard_phase4.test.js` | 295 | `const res = await ag.get("/dashboard/listings").redirects(0);` |
| `tests/dashboard_phase4.test.js` | 352 | `it("Admin user detail GET /dashboard/users/:id shows user info and owner listings", async () => {` |
| `tests/dashboard_phase4.test.js` | 364 | `assert.match(res.text, /Listings Owned/);` |
| `tests/dashboard_phase4.test.js` | 365 | `assert.match(res.text, new RegExp('/listings/${lid}'));` |
| `tests/owner_approval.test.js` | 79 | `// --- Action: GET /listings/new ---` |
| `tests/owner_approval.test.js` | 80 | `describe("Action: GET /listings/new", { concurrency: 1 }, () => {` |
| `tests/owner_approval.test.js` | 83 | `const res = await ag.get("/listings/new").redirects(0);` |
| `tests/owner_approval.test.js` | 88 | `it("cust -> redirect /listings (M1)", async () => {` |
| `tests/owner_approval.test.js` | 90 | `const res = await ag.get("/listings/new").redirects(0);` |
| `tests/owner_approval.test.js` | 92 | `assert.equal(res.headers.location, "/listings");` |
| `tests/owner_approval.test.js` | 93 | `const page = await ag.get("/listings");` |
| `tests/owner_approval.test.js` | 94 | `assert.match(page.text, /Only approved property or venue owners can add or edit listings/);` |
| `tests/owner_approval.test.js` | 99 | `const res = await ag.get("/listings/new").redirects(0);` |
| `tests/owner_approval.test.js` | 108 | `const res = await ag.get("/listings/new").redirects(0);` |
| `tests/owner_approval.test.js` | 117 | `const res = await ag.get("/listings/new").redirects(0);` |
| `tests/owner_approval.test.js` | 126 | `const res = await ag.get("/listings/new");` |
| `tests/owner_approval.test.js` | 132 | `const res = await ag.get("/listings/new");` |
| `tests/owner_approval.test.js` | 136 | `it("admin -> redirect /listings (M1)", async () => {` |
| `tests/owner_approval.test.js` | 138 | `const res = await ag.get("/listings/new").redirects(0);` |
| `tests/owner_approval.test.js` | 140 | `assert.equal(res.headers.location, "/listings");` |
| `tests/owner_approval.test.js` | 141 | `const page = await ag.get("/listings");` |
| `tests/owner_approval.test.js` | 142 | `assert.match(page.text, /Only approved property or venue owners can add or edit listings/);` |
| `tests/owner_approval.test.js` | 146 | `// --- Action: POST /listings ---` |
| `tests/owner_approval.test.js` | 147 | `describe("Action: POST /listings", { concurrency: 1 }, () => {` |
| `tests/owner_approval.test.js` | 150 | `.post("/listings")` |
| `tests/owner_approval.test.js` | 160 | `const [before] = await dbConn.query("SELECT COUNT(*) as c FROM listings");` |
| `tests/owner_approval.test.js` | 166 | `const [after] = await dbConn.query("SELECT COUNT(*) as c FROM listings");` |
| `tests/owner_approval.test.js` | 170 | `it("cust -> redirect /listings (M1), no upload, DB unchanged", async () => {` |
| `tests/owner_approval.test.js` | 171 | `const [before] = await dbConn.query("SELECT COUNT(*) as c FROM listings");` |
| `tests/owner_approval.test.js` | 175 | `assert.equal(res.headers.location, "/listings");` |
| `tests/owner_approval.test.js` | 177 | `const [after] = await dbConn.query("SELECT COUNT(*) as c FROM listings");` |
| `tests/owner_approval.test.js` | 182 | `const [before] = await dbConn.query("SELECT COUNT(*) as c FROM listings");` |
| `tests/owner_approval.test.js` | 188 | `const [after] = await dbConn.query("SELECT COUNT(*) as c FROM listings");` |
| `tests/owner_approval.test.js` | 193 | `const [before] = await dbConn.query("SELECT COUNT(*) as c FROM listings");` |
| `tests/owner_approval.test.js` | 199 | `const [after] = await dbConn.query("SELECT COUNT(*) as c FROM listings");` |
| `tests/owner_approval.test.js` | 204 | `const [before] = await dbConn.query("SELECT COUNT(*) as c FROM listings");` |
| `tests/owner_approval.test.js` | 210 | `const [after] = await dbConn.query("SELECT COUNT(*) as c FROM listings");` |
| `tests/owner_approval.test.js` | 219 | `const [rows] = await dbConn.query("SELECT * FROM listings WHERE title=?", ["Other Owner Listing"]);` |
| `tests/owner_approval.test.js` | 229 | `const [rows] = await dbConn.query("SELECT * FROM listings WHERE title=?", ["Own Owner Listing"]);` |
| `tests/owner_approval.test.js` | 234 | `it("admin -> redirect /listings (M1), no upload, DB unchanged", async () => {` |
| `tests/owner_approval.test.js` | 235 | `const [before] = await dbConn.query("SELECT COUNT(*) as c FROM listings");` |
| `tests/owner_approval.test.js` | 239 | `assert.equal(res.headers.location, "/listings");` |
| `tests/owner_approval.test.js` | 241 | `const [after] = await dbConn.query("SELECT COUNT(*) as c FROM listings");` |
| `tests/owner_approval.test.js` | 246 | `// --- Action: GET /listings/:id/edit ---` |
| `tests/owner_approval.test.js` | 247 | `describe("Action: GET /listings/:id/edit", { concurrency: 1 }, () => {` |
| `tests/owner_approval.test.js` | 250 | `const res = await ag.get('/listings/${targetListingId}/edit').redirects(0);` |
| `tests/owner_approval.test.js` | 255 | `it("cust -> redirect /listings (M1)", async () => {` |
| `tests/owner_approval.test.js` | 257 | `const res = await ag.get('/listings/${targetListingId}/edit').redirects(0);` |
| `tests/owner_approval.test.js` | 259 | `assert.equal(res.headers.location, "/listings");` |
| `tests/owner_approval.test.js` | 264 | `const res = await ag.get('/listings/${targetListingId}/edit').redirects(0);` |
| `tests/owner_approval.test.js` | 271 | `const res = await ag.get('/listings/${targetListingId}/edit').redirects(0);` |
| `tests/owner_approval.test.js` | 278 | `const res = await ag.get('/listings/${targetListingId}/edit').redirects(0);` |
| `tests/owner_approval.test.js` | 283 | `it("o-appr-other -> redirect /listings/:id (M6: not your listing)", async () => {` |
| `tests/owner_approval.test.js` | 285 | `const res = await ag.get('/listings/${targetListingId}/edit').redirects(0);` |
| `tests/owner_approval.test.js` | 287 | `assert.equal(res.headers.location, '/listings/${targetListingId}');` |
| `tests/owner_approval.test.js` | 288 | `const page = await ag.get('/listings/${targetListingId}');` |
| `tests/owner_approval.test.js` | 294 | `const res = await ag.get('/listings/${targetListingId}/edit');` |
| `tests/owner_approval.test.js` | 298 | `it("admin -> redirect /listings (M1)", async () => {` |
| `tests/owner_approval.test.js` | 300 | `const res = await ag.get('/listings/${targetListingId}/edit').redirects(0);` |
| `tests/owner_approval.test.js` | 302 | `assert.equal(res.headers.location, "/listings");` |
| `tests/owner_approval.test.js` | 306 | `// --- Action: PUT /listings/:id ---` |
| `tests/owner_approval.test.js` | 307 | `describe("Action: PUT /listings/:id", { concurrency: 1 }, () => {` |
| `tests/owner_approval.test.js` | 310 | `.put('/listings/${targetListingId}')` |
| `tests/owner_approval.test.js` | 320 | `const [orig] = await dbConn.query("SELECT * FROM listings WHERE listing_id=?", [targetListingId]);` |
| `tests/owner_approval.test.js` | 326 | `const [after] = await dbConn.query("SELECT * FROM listings WHERE listing_id=?", [targetListingId]);` |
| `tests/owner_approval.test.js` | 330 | `it("cust -> redirect /listings (M1), no upload, DB unchanged", async () => {` |
| `tests/owner_approval.test.js` | 331 | `const [orig] = await dbConn.query("SELECT * FROM listings WHERE listing_id=?", [targetListingId]);` |
| `tests/owner_approval.test.js` | 335 | `assert.equal(res.headers.location, "/listings");` |
| `tests/owner_approval.test.js` | 337 | `const [after] = await dbConn.query("SELECT * FROM listings WHERE listing_id=?", [targetListingId]);` |
| `tests/owner_approval.test.js` | 342 | `const [orig] = await dbConn.query("SELECT * FROM listings WHERE listing_id=?", [targetListingId]);` |
| `tests/owner_approval.test.js` | 348 | `const [after] = await dbConn.query("SELECT * FROM listings WHERE listing_id=?", [targetListingId]);` |
| `tests/owner_approval.test.js` | 353 | `const [orig] = await dbConn.query("SELECT * FROM listings WHERE listing_id=?", [targetListingId]);` |
| `tests/owner_approval.test.js` | 359 | `const [after] = await dbConn.query("SELECT * FROM listings WHERE listing_id=?", [targetListingId]);` |
| `tests/owner_approval.test.js` | 364 | `const [orig] = await dbConn.query("SELECT * FROM listings WHERE listing_id=?", [targetListingId]);` |
| `tests/owner_approval.test.js` | 370 | `const [after] = await dbConn.query("SELECT * FROM listings WHERE listing_id=?", [targetListingId]);` |
| `tests/owner_approval.test.js` | 374 | `it("o-appr-other -> redirect /listings/:id (M6), no upload, DB unchanged", async () => {` |
| `tests/owner_approval.test.js` | 375 | `const [orig] = await dbConn.query("SELECT * FROM listings WHERE listing_id=?", [targetListingId]);` |
| `tests/owner_approval.test.js` | 379 | `assert.equal(res.headers.location, '/listings/${targetListingId}');` |
| `tests/owner_approval.test.js` | 381 | `const [after] = await dbConn.query("SELECT * FROM listings WHERE listing_id=?", [targetListingId]);` |
| `tests/owner_approval.test.js` | 390 | `const [after] = await dbConn.query("SELECT * FROM listings WHERE listing_id=?", [targetListingId]);` |
| `tests/owner_approval.test.js` | 394 | `it("admin -> redirect /listings (M1), no upload, DB unchanged", async () => {` |
| `tests/owner_approval.test.js` | 395 | `const [orig] = await dbConn.query("SELECT * FROM listings WHERE listing_id=?", [targetListingId]);` |
| `tests/owner_approval.test.js` | 399 | `assert.equal(res.headers.location, "/listings");` |
| `tests/owner_approval.test.js` | 401 | `const [after] = await dbConn.query("SELECT * FROM listings WHERE listing_id=?", [targetListingId]);` |
| `tests/owner_approval.test.js` | 406 | `// --- Action: DELETE /listings/:id ---` |
| `tests/owner_approval.test.js` | 407 | `describe("Action: DELETE /listings/:id", { concurrency: 1 }, () => {` |
| `tests/owner_approval.test.js` | 409 | `const [before] = await dbConn.query("SELECT COUNT(*) as c FROM listings WHERE listing_id=?", [targetListingId]);` |
| `tests/owner_approval.test.js` | 411 | `const res = await ag.delete('/listings/${targetListingId}').redirects(0);` |
| `tests/owner_approval.test.js` | 414 | `const [after] = await dbConn.query("SELECT COUNT(*) as c FROM listings WHERE listing_id=?", [targetListingId]);` |
| `tests/owner_approval.test.js` | 418 | `it("cust -> redirect /listings (M1), DB unchanged", async () => {` |
| `tests/owner_approval.test.js` | 419 | `const [before] = await dbConn.query("SELECT COUNT(*) as c FROM listings WHERE listing_id=?", [targetListingId]);` |
| `tests/owner_approval.test.js` | 421 | `const res = await ag.delete('/listings/${targetListingId}').redirects(0);` |
| `tests/owner_approval.test.js` | 423 | `assert.equal(res.headers.location, "/listings");` |
| `tests/owner_approval.test.js` | 424 | `const [after] = await dbConn.query("SELECT COUNT(*) as c FROM listings WHERE listing_id=?", [targetListingId]);` |
| `tests/owner_approval.test.js` | 429 | `const [before] = await dbConn.query("SELECT COUNT(*) as c FROM listings WHERE listing_id=?", [targetListingId]);` |
| `tests/owner_approval.test.js` | 431 | `const res = await ag.delete('/listings/${targetListingId}').redirects(0);` |
| `tests/owner_approval.test.js` | 434 | `const [after] = await dbConn.query("SELECT COUNT(*) as c FROM listings WHERE listing_id=?", [targetListingId]);` |
| `tests/owner_approval.test.js` | 439 | `const [before] = await dbConn.query("SELECT COUNT(*) as c FROM listings WHERE listing_id=?", [targetListingId]);` |
| `tests/owner_approval.test.js` | 441 | `const res = await ag.delete('/listings/${targetListingId}').redirects(0);` |
| `tests/owner_approval.test.js` | 444 | `const [after] = await dbConn.query("SELECT COUNT(*) as c FROM listings WHERE listing_id=?", [targetListingId]);` |
| `tests/owner_approval.test.js` | 449 | `const [before] = await dbConn.query("SELECT COUNT(*) as c FROM listings WHERE listing_id=?", [targetListingId]);` |
| `tests/owner_approval.test.js` | 451 | `const res = await ag.delete('/listings/${targetListingId}').redirects(0);` |
| `tests/owner_approval.test.js` | 454 | `const [after] = await dbConn.query("SELECT COUNT(*) as c FROM listings WHERE listing_id=?", [targetListingId]);` |
| `tests/owner_approval.test.js` | 458 | `it("o-appr-other -> redirect /listings/:id (M6), DB unchanged", async () => {` |
| `tests/owner_approval.test.js` | 459 | `const [before] = await dbConn.query("SELECT COUNT(*) as c FROM listings WHERE listing_id=?", [targetListingId]);` |
| `tests/owner_approval.test.js` | 461 | `const res = await ag.delete('/listings/${targetListingId}').redirects(0);` |
| `tests/owner_approval.test.js` | 463 | `assert.equal(res.headers.location, '/listings/${targetListingId}');` |
| `tests/owner_approval.test.js` | 464 | `const [after] = await dbConn.query("SELECT COUNT(*) as c FROM listings WHERE listing_id=?", [targetListingId]);` |
| `tests/owner_approval.test.js` | 468 | `it("admin -> redirect /listings (M1), DB unchanged", async () => {` |
| `tests/owner_approval.test.js` | 469 | `const [before] = await dbConn.query("SELECT COUNT(*) as c FROM listings WHERE listing_id=?", [targetListingId]);` |
| `tests/owner_approval.test.js` | 471 | `const res = await ag.delete('/listings/${targetListingId}').redirects(0);` |
| `tests/owner_approval.test.js` | 473 | `assert.equal(res.headers.location, "/listings");` |
| `tests/owner_approval.test.js` | 474 | `const [after] = await dbConn.query("SELECT COUNT(*) as c FROM listings WHERE listing_id=?", [targetListingId]);` |
| `tests/owner_approval.test.js` | 480 | `const res = await ag.delete('/listings/${targetListingId}').redirects(0);` |
| `tests/owner_approval.test.js` | 482 | `const [after] = await dbConn.query("SELECT COUNT(*) as c FROM listings WHERE listing_id=?", [targetListingId]);` |
| `tests/owner_approval.test.js` | 578 | `assert.equal(res.headers.location, "/listings");` |
| `tests/owner_approval.test.js` | 638 | `assert.match(resAppr.text, /href="\/listings\/new"/);` |
| `tests/owner_approval.test.js` | 752 | `assert.equal(resCust.headers.location, "/listings");` |
| `tests/owner_approval.test.js` | 763 | `assert.equal(resAdmin.headers.location, "/listings");` |
| `tests/owner_approval.test.js` | 818 | `it("C3: Approve a pending owner -> status approved, verified_at set, owner can immediately GET /listings/new", async () ` |
| `tests/owner_approval.test.js` | 824 | `// Initially blocked from /listings/new` |
| `tests/owner_approval.test.js` | 825 | `const blockRes = await ownerAg.get("/listings/new").redirects(0);` |
| `tests/owner_approval.test.js` | 842 | `const okRes = await ownerAg.get("/listings/new");` |
| `tests/owner_approval.test.js` | 890 | `it("C7: Revoke: reject an approved owner who has listings -> rights revoked, listings still visible", async () => {` |
| `tests/owner_approval.test.js` | 897 | `const preRes = await ownerAg.get("/listings/new");` |
| `tests/owner_approval.test.js` | 907 | `const postRes = await ownerAg.get("/listings/new").redirects(0);` |
| `tests/owner_approval.test.js` | 912 | `const showRes = await request(app).get('/listings/${lid}');` |
| `tests/owner_approval.test.js` | 944 | `assert.equal(res.headers.location, "/listings");` |
| `tests/owner_approval.test.js` | 963 | `it("D1: Navbar 'Add New Listings' visible only for approved owner", async () => {` |
| `tests/owner_approval.test.js` | 965 | `const resAnon = await request(app).get("/listings");` |
| `tests/owner_approval.test.js` | 966 | `assert.doesNotMatch(resAnon.text, /Add New Listings/);` |
| `tests/owner_approval.test.js` | 972 | `const resCust = await agCust.get("/listings");` |
| `tests/owner_approval.test.js` | 973 | `assert.doesNotMatch(resCust.text, /Add New Listings/);` |
| `tests/owner_approval.test.js` | 979 | `const resPend = await agPend.get("/listings");` |
| `tests/owner_approval.test.js` | 980 | `assert.doesNotMatch(resPend.text, /Add New Listings/);` |
| `tests/owner_approval.test.js` | 986 | `const resAppr = await agAppr.get("/listings");` |
| `tests/owner_approval.test.js` | 987 | `assert.match(resAppr.text, /Add New Listings/);` |
| `tests/owner_approval.test.js` | 997 | `const resOwner = await agOwner.get('/listings/${lid}');` |
| `tests/owner_approval.test.js` | 998 | `assert.match(resOwner.text, /href="\/listings\/[0-9]+\/edit"/);` |
| `tests/owner_approval.test.js` | 1004 | `const resOther = await agOther.get('/listings/${lid}');` |
| `tests/owner_approval.test.js` | 1005 | `assert.doesNotMatch(resOther.text, /href="\/listings\/[0-9]+\/edit"/);` |
| `tests/owner_approval.test.js` | 1008 | `it("D3: Public viewing: anon and customer get 200 on /listings and /listings/:id", async () => {` |
| `tests/owner_approval.test.js` | 1012 | `const res1 = await request(app).get("/listings");` |
| `tests/owner_approval.test.js` | 1015 | `const res2 = await request(app).get('/listings/${lid}');` |
| `tests/owner_approval.test.js` | 1023 | `const res = await ag.get("/listings");` |
| `tests/owner_approval.test.js` | 1044 | `// Approved owner -> /listings` |
| `tests/owner_approval.test.js` | 1048 | `assert.equal(res2.headers.location, "/listings");` |
| `tests/owner_approval.test.js` | 1079 | `AND EXISTS (SELECT 1 FROM listings l WHERE l.owner_id = u.user_id)` |
| `tests/owner_approval.test.js` | 1099 | `AND EXISTS (SELECT 1 FROM listings l WHERE l.owner_id = u.user_id)` |
| `tests/owner_approval.test.js` | 1138 | `const res = await request(app).get("/listings");` |
| `tests/owner_approval.test.js` | 1160 | `.post('/listings/${lid}/reviews')` |
| `tests/owner_approval.test.js` | 1171 | `.delete('/listings/${lid}/reviews/${reviews[0].review_id}')` |
| `tests/owner_verification_docs.test.js` | 205 | `assert.match(res.headers.location, /\/listings/);` |
| `tests/owner_verification_docs.test.js` | 410 | `const res = await ownerAg.get("/listings/new").redirects(0);` |
| `tests/owner_verification_docs.test.js` | 415 | `.post("/listings")` |
| `tests/owner_verification_docs.test.js` | 495 | `const listRes = await request(app).get("/listings");` |
| `tests/routes.test.js` | 170 | `CREATE TABLE IF NOT EXISTS listings (` |
| `tests/routes.test.js` | 201 | `REFERENCES listings (listing_id) ON DELETE CASCADE,` |
| `tests/routes.test.js` | 218 | `REFERENCES listings (listing_id) ON DELETE CASCADE,` |
| `tests/routes.test.js` | 239 | `await dbConn.query("DELETE FROM listings");` |
| `tests/routes.test.js` | 283 | `'INSERT INTO listings` |
| `tests/routes.test.js` | 319 | `delete require.cache[require.resolve("../controller/listings")];` |
| `tests/routes.test.js` | 434 | `app.use("/listings", require("../routes/listing"));` |
| `tests/routes.test.js` | 435 | `app.use("/listings/:id/reviews", require("../routes/review"));` |
| `tests/routes.test.js` | 490 | `// Row 2 - GET /listings` |
| `tests/routes.test.js` | 491 | `it("Row 2: GET /listings -> 200, seeded listing appears", async () => {` |
| `tests/routes.test.js` | 492 | `const res = await request(app).get("/listings");` |
| `tests/routes.test.js` | 497 | `// Row 3 - GET /listings/new unauthenticated` |
| `tests/routes.test.js` | 498 | `it("Row 3: GET /listings/new (anon) -> 302 to /login with flash", async () => {` |
| `tests/routes.test.js` | 499 | `const res = await request(app).get("/listings/new").redirects(0);` |
| `tests/routes.test.js` | 504 | `// Row 4 - GET /listings/new logged in` |
| `tests/routes.test.js` | 505 | `it("Row 4: GET /listings/new (logged in) -> 200 with form", async () => {` |
| `tests/routes.test.js` | 508 | `const res = await ag.get("/listings/new");` |
| `tests/routes.test.js` | 513 | `// Row 5 - POST /listings valid` |
| `tests/routes.test.js` | 514 | `it("Row 5: POST /listings (logged in, valid) -> 302 /listings with flash", async () => {` |
| `tests/routes.test.js` | 518 | `.post("/listings")` |
| `tests/routes.test.js` | 527 | `assert.match(res.headers.location, /\/listings/);` |
| `tests/routes.test.js` | 529 | `const [rows] = await dbConn.query("SELECT * FROM listings WHERE title=?", ["New Listing"]);` |
| `tests/routes.test.js` | 534 | `// Row 6 - POST /listings missing title -> 400` |
| `tests/routes.test.js` | 535 | `it("Row 6: POST /listings (missing title) -> 400, no row inserted", async () => {` |
| `tests/routes.test.js` | 538 | `const [before] = await dbConn.query("SELECT COUNT(*) as c FROM listings");` |
| `tests/routes.test.js` | 540 | `.post("/listings")` |
| `tests/routes.test.js` | 548 | `const [after] = await dbConn.query("SELECT COUNT(*) as c FROM listings");` |
| `tests/routes.test.js` | 552 | `// Row 7 - POST /listings no file` |
| `tests/routes.test.js` | 553 | `it("Row 7: POST /listings (no file) -> 302 /listings/new with flash", async () => {` |
| `tests/routes.test.js` | 557 | `.post("/listings")` |
| `tests/routes.test.js` | 565 | `assert.match(res.headers.location, /\/listings\/new/);` |
| `tests/routes.test.js` | 568 | `// Row 8 - POST /listings geocoder returns no feature` |
| `tests/routes.test.js` | 569 | `it("Row 8: POST /listings (geocoder empty) -> 302 /listings/new, no row", async () => {` |
| `tests/routes.test.js` | 573 | `const [before] = await dbConn.query("SELECT COUNT(*) as c FROM listings");` |
| `tests/routes.test.js` | 575 | `.post("/listings")` |
| `tests/routes.test.js` | 585 | `assert.match(res.headers.location, /\/listings\/new/);` |
| `tests/routes.test.js` | 586 | `const [after] = await dbConn.query("SELECT COUNT(*) as c FROM listings");` |
| `tests/routes.test.js` | 590 | `// Row 9 - GET /listings/:id` |
| `tests/routes.test.js` | 591 | `it("Row 9: GET /listings/:id -> 200 with title and price", async () => {` |
| `tests/routes.test.js` | 592 | `const res = await request(app).get('/listings/${listingId}');` |
| `tests/routes.test.js` | 598 | `it("Row 10: GET /listings/:id (null coords) -> 200 no script error", async () => {` |
| `tests/routes.test.js` | 600 | `'INSERT INTO listings (owner_id,title,description,price,location,country,image_url,latitude,longitude)` |
| `tests/routes.test.js` | 605 | `const res = await request(app).get('/listings/${id}');` |
| `tests/routes.test.js` | 610 | `// Row 11 - GET /listings/99999 (unknown)` |
| `tests/routes.test.js` | 611 | `it("Row 11: GET /listings/99999 -> flash redirect or 404, never 500", async () => {` |
| `tests/routes.test.js` | 612 | `const res = await request(app).get("/listings/99999").redirects(5);` |
| `tests/routes.test.js` | 616 | `// Row 12 - GET /listings/abc (invalid id)` |
| `tests/routes.test.js` | 617 | `it("Row 12: GET /listings/abc -> 404 page, never 500", async () => {` |
| `tests/routes.test.js` | 618 | `const res = await request(app).get("/listings/abc");` |
| `tests/routes.test.js` | 623 | `// Row 13 - GET /listings/:id/edit as owner` |
| `tests/routes.test.js` | 624 | `it("Row 13: GET /listings/:id/edit (owner) -> 200 with prefilled fields", async () => {` |
| `tests/routes.test.js` | 627 | `const res = await ag.get('/listings/${listingId}/edit');` |
| `tests/routes.test.js` | 632 | `// Row 14 - GET /listings/:id/edit as non-owner` |
| `tests/routes.test.js` | 633 | `it("Row 14: GET /listings/:id/edit (non-owner) -> 302 with flash", async () => {` |
| `tests/routes.test.js` | 636 | `const res = await ag.get('/listings/${listingId}/edit').redirects(0);` |
| `tests/routes.test.js` | 640 | `// Row 15 - PUT /listings/:id valid` |
| `tests/routes.test.js` | 641 | `it("Row 15: PUT /listings/:id (owner, valid) -> 302 /listings/:id", async () => {` |
| `tests/routes.test.js` | 645 | `.put('/listings/${listingId}?_method=PUT')` |
| `tests/routes.test.js` | 653 | `const [rows] = await dbConn.query("SELECT title FROM listings WHERE listing_id=?", [listingId]);` |
| `tests/routes.test.js` | 662 | `.put('/listings/${listingId}?_method=PUT')` |
| `tests/routes.test.js` | 670 | `const [rows] = await dbConn.query("SELECT owner_id FROM listings WHERE listing_id=?", [listingId]);` |
| `tests/routes.test.js` | 679 | `.put('/listings/${listingId}?_method=PUT')` |
| `tests/routes.test.js` | 694 | `.put('/listings/${listingId}?_method=PUT')` |
| `tests/routes.test.js` | 701 | `const [rows] = await dbConn.query("SELECT latitude, longitude FROM listings WHERE listing_id=?", [listingId]);` |
| `tests/routes.test.js` | 712 | `.put('/listings/${listingId}?_method=PUT')` |
| `tests/routes.test.js` | 720 | `const [rows] = await dbConn.query("SELECT title FROM listings WHERE listing_id=?", [listingId]);` |
| `tests/routes.test.js` | 724 | `// Row 20 - DELETE /listings/:id as owner (cascade)` |
| `tests/routes.test.js` | 725 | `it("Row 20: DELETE /listings/:id (owner) -> listing + reviews deleted", async () => {` |
| `tests/routes.test.js` | 735 | `.delete('/listings/${tempId}?_method=DELETE')` |
| `tests/routes.test.js` | 738 | `const [rows] = await dbConn.query("SELECT * FROM listings WHERE listing_id=?", [tempId]);` |
| `tests/routes.test.js` | 749 | `.delete('/listings/${listingId}?_method=DELETE')` |
| `tests/routes.test.js` | 752 | `const [rows] = await dbConn.query("SELECT * FROM listings WHERE listing_id=?", [listingId]);` |
| `tests/routes.test.js` | 756 | `// Row 22 - POST /listings/:id/reviews (anon) -> 302 to /login (F7)` |
| `tests/routes.test.js` | 759 | `.post('/listings/${listingId}/reviews')` |
| `tests/routes.test.js` | 767 | `it("Row 23: POST review (logged in, valid) -> 302 /listings/:id", async () => {` |
| `tests/routes.test.js` | 771 | `.post('/listings/${listingId}/reviews')` |
| `tests/routes.test.js` | 775 | `assert.match(res.headers.location, new RegExp('/listings/${listingId}'));` |
| `tests/routes.test.js` | 786 | `.post('/listings/${listingId}/reviews')` |
| `tests/routes.test.js` | 798 | `.delete('/listings/${listingId}/reviews/${reviewId}?_method=DELETE')` |
| `tests/routes.test.js` | 817 | `.delete('/listings/${listingId}/reviews/${newReviewId}?_method=DELETE')` |
| `tests/routes.test.js` | 829 | `.delete('/listings/${listingId}/reviews/99999?_method=DELETE')` |
| `tests/routes.test.js` | 879 | `await ag.get("/listings/new").redirects(0); // sets session.redirectUrl` |
| `tests/routes.test.js` | 885 | `// Redirect should be to /listings/new or /listings` |
| `tests/routes.test.js` | 887 | `res.headers.location.includes("/listings/new") ||` |
| `tests/routes.test.js` | 888 | `res.headers.location.includes("/listings")` |
| `tests/routes.test.js` | 938 | `it("R2: GET / (logged in) -> 302 to /listings", async () => {` |
| `tests/routes.test.js` | 944 | `assert.match(res.headers.location, /\/listings/);` |
| `tests/routes.test.js` | 1242 | `const res = await ag.get("/listings");` |
| `tests/routes.test.js` | 1252 | `const res = await ag.get("/listings");` |
| `tests/routes.test.js` | 1261 | `const res = await ag.get("/listings");` |
| `tests/routes.test.js` | 1535 | `'INSERT INTO listings (owner_id,title,description,price,location,country,image_url)` |
| `tests/routes.test.js` | 1540 | `const listings = await Listing.findAll();` |
| `tests/routes.test.js` | 1541 | `const pl = listings.find((l) => l.title === "PriceTest");` |
| `tests/routes.test.js` | 1584 | `'INSERT INTO listings (owner_id,title,description,price,location,country,image_url)` |
| `utils/validateListing.js` | 49 | `.render("listings/new.ejs", { listing: req.body.listing, errors });` |
| `utils/validateReview.js` | 41 | `.render("listings/show.ejs", { listing, errors, review: payload });` |
| `views/dashboard/bookings.ejs` | 21 | `<a href="/listings" class="btn btn-outline-primary px-4 mt-2">` |
| `views/dashboard/bookings.ejs` | 22 | `<i class="fa-solid fa-compass me-2"></i>Browse Vacation Listings` |
| `views/dashboard/listings.ejs` | 5 | `const pageTitle = isAdmin ? 'Manage Listings' : 'My Listings';` |
| `views/dashboard/listings.ejs` | 7 | `? 'View, edit or manage all property listings on WanderLust.'` |
| `views/dashboard/listings.ejs` | 25 | `<a href="/listings/new" class="btn wl-btn-primary px-3 py-2 d-inline-flex align-items-center gap-2">` |
| `views/dashboard/listings.ejs` | 53 | `Your owner application is currently under review. Adding or editing listings will be unlocked as soon as an admin approv` |
| `views/dashboard/listings.ejs` | 81 | `<% if (!listings || listings.length === 0) { %>` |
| `views/dashboard/listings.ejs` | 90 | `<h3 class="h4 fw-bold text-dark mt-3 mb-2">No Listings Found</h3>` |
| `views/dashboard/listings.ejs` | 95 | `<a href="/listings/new" class="btn wl-btn-primary px-4">` |
| `views/dashboard/listings.ejs` | 102 | `<!-- Listings Table (Ref 07) -->` |
| `views/dashboard/listings.ejs` | 116 | `<% for (let listing of listings) { %>` |
| `views/dashboard/listings.ejs` | 127 | `<a href="/listings/<%= listing.id %>" class="fw-bold text-dark text-decoration-none">` |
| `views/dashboard/listings.ejs` | 149 | `href="/listings/<%= listing.id %>"` |
| `views/dashboard/listings.ejs` | 158 | `href="/listings/<%= listing.id %>/edit"` |
| `views/dashboard/user-detail.ejs` | 184 | `<p class="mb-2"><strong>Wishlisted Listings:</strong> <%= wishlistCount %> items saved.</p>` |
| `views/dashboard/user-detail.ejs` | 203 | `<!-- Owner Listings Section -->` |
| `views/dashboard/user-detail.ejs` | 208 | `<i class="fa-solid fa-hotel me-2 text-primary"></i>Listings Owned (<%= listings ? listings.length : 0 %>)` |
| `views/dashboard/user-detail.ejs` | 211 | `<% if (!listings || listings.length === 0) { %>` |
| `views/dashboard/user-detail.ejs` | 213 | `This owner has not created any listings yet.` |
| `views/dashboard/user-detail.ejs` | 228 | `<% for (let l of listings) { %>` |
| `views/dashboard/user-detail.ejs` | 243 | `<a href="/listings/<%= l.id %>" class="btn btn-outline-secondary" title="View Listing">` |
| `views/dashboard/user-detail.ejs` | 246 | `<a href="/listings/<%= l.id %>/edit" class="btn btn-outline-primary" title="Edit Listing">` |
| `views/dashboard/user-detail.ejs` | 251 | `action="/dashboard/users/<%= targetUser.id %>/listings/<%= l.id %>?_method=DELETE"` |
| `views/dashboard/users.ejs` | 191 | `<th>Listings</th>` |
| `views/dashboard/wishlist.ejs` | 15 | `<%= wishlist.length %> <%= wishlist.length === 1 ? 'saved listing' : 'saved listings' %>` |
| `views/dashboard/wishlist.ejs` | 35 | `<a href="/listings" class="btn wl-btn-primary px-4">` |
| `views/dashboard/wishlist.ejs` | 36 | `Explore Listings` |
| `views/dashboard/wishlist.ejs` | 48 | `<a href="/listings/<%= item.id %>" class="d-block w-100 h-100">` |
| `views/dashboard/wishlist.ejs` | 64 | `<a href="/listings/<%= item.id %>" class="text-decoration-none text-dark">` |
| `views/dashboard/wishlist.ejs` | 81 | `<a href="/listings/<%= item.id %>" class="btn wl-btn-primary flex-grow-1 py-2 text-center" style="font-size: 0.88rem;">` |
| `views/error.ejs` | 25 | `<a href="/listings" class="btn wl-btn-outline px-4">` |
| `views/error.ejs` | 26 | `Browse Listings` |
| `views/includes/navbar.ejs` | 28 | `<a class="nav-link" href="/listings">Home</a>` |
| `views/includes/navbar.ejs` | 31 | `<a class="nav-link" href="/listings/new">Add New Listings</a>` |
| `views/landing.ejs` | 4 | `const safeListingsData = (typeof listings !== 'undefined' && Array.isArray(listings)) ? listings : [];` |
| `views/landing.ejs` | 13 | `// Pick up to 5 listings for hero slides (using real DB listings if available, otherwise rich fallbacks)` |
| `views/landing.ejs` | 25 | `<!-- Dynamic Hero Slideshow with Quotes and Highlighted Listings -->` |
| `views/landing.ejs` | 83 | `href="/listings/<%= listing.id %>"` |
| `views/landing.ejs` | 96 | `<span>Verified Listings</span>` |
| `views/landing.ejs` | 111 | `<a href="/listings/<%= listing.id %>" class="text-decoration-none">` |
| `views/landing.ejs` | 216 | `<span class="d-block mt-1 fst-italic">Owner accounts are approved by an admin before you can add listings.</span>` |
| `views/landing.ejs` | 235 | `<% const safeListings = (typeof listings !== 'undefined' && Array.isArray(listings)) ? listings : []; %>` |
| `views/landing.ejs` | 247 | `<a href="/listings" class="fw-semibold text-decoration-none d-flex align-items-center gap-1" style="color: var(--wl-teal` |
| `views/landing.ejs` | 295 | `<!-- Embedded JSON Data of Database Listings for Fast Client-Side Dynamic Switching -->` |
| `views/landing.ejs` | 340 | `function renderCollage(listings, category, offset) {` |
| `views/landing.ejs` | 345 | `? listings` |
| `views/landing.ejs` | 346 | `: listings.filter(l => categorizeListing(l).id === category);` |
| `views/landing.ejs` | 349 | `categoryMatches = listings;` |
| `views/landing.ejs` | 359 | `// If fewer than 5, backfill from remaining listings so collage layout stays balanced` |
| `views/landing.ejs` | 362 | `const others = listings.filter(l => !displayItems.some(d => d.id === l.id));` |
| `views/landing.ejs` | 379 | `link.href = "/listings/" + item.id;` |
| `views/landing.ejs` | 418 | `function updateCategoryCounts(listings) {` |
| `views/landing.ejs` | 419 | `const counts = { all: listings.length, beach: 0, mountain: 0, villa: 0, urban: 0, unique: 0 };` |
| `views/landing.ejs` | 420 | `listings.forEach(l => {` |
| `views/landing.ejs` | 429 | `if (allText) allText.textContent = "View all stays (" + listings.length + ")";` |
| `views/landing.ejs` | 466 | `// Initialize or hydrate from /listings if needed` |
| `views/landing.ejs` | 472 | `// Hydrate via client-side fetch from /listings` |
| `views/landing.ejs` | 473 | `fetch("/listings")` |
| `views/landing.ejs` | 483 | `const href = anchor ? anchor.getAttribute("href") : "/listings";` |
| `views/landing.ejs` | 484 | `const idMatch = href.match(/\/listings\/(\d+)/);` |
| `views/listings/edit.ejs` | 6 | `<a href="/listings" class="text-muted text-decoration-none">Listings</a>` |
| `views/listings/edit.ejs` | 8 | `<a href="/listings/<%= listing.id %>" class="text-muted text-decoration-none"><%= listing.title %></a>` |
| `views/listings/edit.ejs` | 24 | `action="/listings/<%= listing.id %>?_method=PUT"` |
| `views/listings/edit.ejs` | 159 | `<a href="/listings/<%= listing.id %>" class="btn wl-btn-outline px-4">` |
| `views/listings/index.ejs` | 4 | `const safeListings = (typeof alllistings !== 'undefined' && Array.isArray(alllistings)) ? alllistings : ((typeof listing` |
| `views/listings/index.ejs` | 7 | `// Curate 4-5 handpicked luxury stays for the Featured Listings banner` |
| `views/listings/index.ejs` | 25 | `<form id="homeSearchForm" action="/listings" method="GET" class="wl-search-pill">` |
| `views/listings/index.ejs` | 185 | `<!-- 2. Featured Listings Section -->` |
| `views/listings/index.ejs` | 188 | `<h2>Featured Listings</h2>` |
| `views/listings/index.ejs` | 203 | `<a href="/listings/<%= item.id %>" class="d-block w-100 h-100 position-relative text-decoration-none">` |
| `views/listings/index.ejs` | 279 | `<!-- 3. Trending Listings Section (Responsive 4-column Grid) -->` |
| `views/listings/index.ejs` | 282 | `<h3 id="trendingHeading">Trending Listings</h3>` |
| `views/listings/index.ejs` | 288 | `<!-- Listings Grid -->` |
| `views/listings/index.ejs` | 308 | `<a href="/listings/<%= listing.id %>" class="d-block w-100 h-100">` |
| `views/listings/index.ejs` | 342 | `<a href="/listings/<%= listing.id %>" class="text-decoration-none text-dark" title="<%= listing.title %>">` |
| `views/listings/index.ejs` | 369 | `<h4 class="fw-bold text-dark mb-2">No listings found</h4>` |
| `views/listings/new.ejs` | 17 | `action="/listings"` |
| `views/listings/show.ejs` | 7 | `<a href="/listings" class="text-muted text-decoration-none">Listings</a>` |
| `views/listings/show.ejs` | 98 | `<a href="/listings/<%= listing.id %>/edit" class="btn wl-btn-outline btn-sm px-3">` |
| `views/listings/show.ejs` | 104 | `action="/listings/<%= listing.id %>?_method=DELETE"` |
| `views/listings/show.ejs` | 174 | `<a href="/listings" class="btn wl-btn-primary w-100 py-3 mb-2 text-center">` |
| `views/listings/show.ejs` | 215 | `action="/listings/<%= listing.id %>/reviews/<%= review.id %>?_method=DELETE"` |
| `views/listings/show.ejs` | 250 | `action="/listings/<%= listing.id %>/reviews"` |
| `views/owner/status.ejs` | 190 | `We'll update you when your application is reviewed. You will be able to add listings once it is approved.` |
| `views/owner/status.ejs` | 203 | `<div class="small" style="color: #0F7B3F;">You can now publish and manage your hotel and venue listings on WanderLust.</` |
| `views/owner/status.ejs` | 205 | `<a href="/listings/new" class="btn wl-btn-primary btn-sm px-3">` |
| `views/users/signup.ejs` | 121 | `<span>Owner accounts are approved by an admin before you can add listings.</span>` |


### Usage of `owner_profile`

| File | Line | Snippet |
|---|---|---|
| `db/migrate.js` | 4 | `* and the owner_profile table to an existing wanderlust database.` |
| `db/migrate.js` | 96 | `// Step 5: create owner_profile table if missing` |
| `db/migrate.js` | 99 | `WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'owner_profile'',` |
| `db/migrate.js` | 105 | `CREATE TABLE owner_profile (` |
| `db/migrate.js` | 121 | `console.log("Step 5: Created 'owner_profile' table.");` |
| `db/migrate.js` | 123 | `console.log("Step 5: 'owner_profile' table already exists - skipped.");` |
| `db/migrate.js` | 129 | `INSERT INTO owner_profile (owner_id, business_name, business_type, phone, verification_status, verified_at)` |
| `db/migrate.js` | 134 | `AND NOT EXISTS (SELECT 1 FROM owner_profile op WHERE op.owner_id = u.user_id)` |
| `db/migrate.js` | 137 | `'SELECT COUNT(*) AS c FROM owner_profile WHERE verification_status = 'approved''` |
| `db/migrate.js` | 201 | `WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'owner_profile' AND COLUMN_NAME = 'verification_status'',` |
| `db/migrate.js` | 206 | `'ALTER TABLE owner_profile` |
| `db/migrate.js` | 214 | `WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'owner_profile'` |
| `db/migrate.js` | 220 | `await conn.query('ALTER TABLE owner_profile ADD COLUMN verification_note VARCHAR(500) NULL AFTER rejection_reason');` |
| `db/migrate.js` | 221 | `console.log("Step 9b: Added 'verification_note' column to owner_profile.");` |
| `db/migrate.js` | 224 | `await conn.query('ALTER TABLE owner_profile ADD COLUMN documents JSON NULL AFTER verification_note');` |
| `db/migrate.js` | 225 | `console.log("Step 9c: Added 'documents' column to owner_profile.");` |
| `db/seed.js` | 233 | `'INSERT INTO owner_profile (owner_id, business_name, business_type, phone, verification_status, verified_at)` |
| `models/listing.js` | 63 | `LEFT JOIN owner_profile op ON op.owner_id = l.owner_id` |
| `models/ownerProfile.js` | 3 | `* Data-access functions for the owner_profile table.` |
| `models/ownerProfile.js` | 53 | `'INSERT INTO owner_profile` |
| `models/ownerProfile.js` | 68 | `'SELECT * FROM owner_profile WHERE owner_id = ? LIMIT 1',` |
| `models/ownerProfile.js` | 94 | `? 'UPDATE owner_profile` |
| `models/ownerProfile.js` | 99 | `: 'UPDATE owner_profile` |
| `models/ownerProfile.js` | 122 | `'UPDATE owner_profile` |
| `models/ownerProfile.js` | 143 | `'UPDATE owner_profile` |
| `models/ownerProfile.js` | 152 | `'UPDATE owner_profile` |
| `models/ownerProfile.js` | 169 | `FROM owner_profile op` |
| `models/ownerProfile.js` | 194 | `FROM owner_profile'` |
| `models/user.js` | 72 | `LEFT JOIN owner_profile op ON op.owner_id = u.user_id` |
| `models/user.js` | 88 | `LEFT JOIN owner_profile op ON op.owner_id = u.user_id` |
| `models/user.js` | 106 | `LEFT JOIN owner_profile op ON op.owner_id = u.user_id` |
| `models/user.js` | 206 | `LEFT JOIN owner_profile op ON op.owner_id = u.user_id` |
| `models/user.js` | 220 | `LEFT JOIN owner_profile op ON op.owner_id = u.user_id` |
| `models/user.js` | 268 | `// 4. Delete user (cascades to owner_profile, reviews, wishlists)` |
| `seed/generate-seed.js` | 118 | `'INSERT INTO owner_profile (owner_id, business_name, business_type, phone, verification_status, verified_at) VALUES (' +` |
| `tests/dashboard_phase4.test.js` | 326 | `const [rows] = await dbConn.query("SELECT verification_status FROM owner_profile WHERE owner_id = ?", [pend.id]);` |
| `tests/owner_approval.test.js` | 516 | `const [profiles] = await dbConn.query("SELECT * FROM owner_profile WHERE owner_id=?", [users[0].user_id]);` |
| `tests/owner_approval.test.js` | 536 | `const [profiles] = await dbConn.query("SELECT * FROM owner_profile WHERE business_name='Bad'");` |
| `tests/owner_approval.test.js` | 584 | `const [profiles] = await dbConn.query("SELECT * FROM owner_profile WHERE owner_id=?", [users[0].user_id]);` |
| `tests/owner_approval.test.js` | 663 | `const [profiles] = await dbConn.query("SELECT * FROM owner_profile WHERE owner_id=?", [user.id]);` |
| `tests/owner_approval.test.js` | 684 | `const [profiles] = await dbConn.query("SELECT * FROM owner_profile WHERE owner_id=?", [user.id]);` |
| `tests/owner_approval.test.js` | 700 | `const [profiles] = await dbConn.query("SELECT * FROM owner_profile WHERE owner_id=?", [user.id]);` |
| `tests/owner_approval.test.js` | 718 | `const [profiles] = await dbConn.query("SELECT * FROM owner_profile WHERE owner_id=?", [user.id]);` |
| `tests/owner_approval.test.js` | 733 | `const [profiles] = await dbConn.query("SELECT * FROM owner_profile WHERE owner_id=?", [user.id]);` |
| `tests/owner_approval.test.js` | 837 | `const [profiles] = await dbConn.query("SELECT * FROM owner_profile WHERE owner_id=?", [owner.id]);` |
| `tests/owner_approval.test.js` | 854 | `const [profiles] = await dbConn.query("SELECT * FROM owner_profile WHERE owner_id=?", [owner.id]);` |
| `tests/owner_approval.test.js` | 872 | `const [profiles] = await dbConn.query("SELECT * FROM owner_profile WHERE owner_id=?", [owner.id]);` |
| `tests/owner_approval.test.js` | 886 | `const [profiles] = await dbConn.query("SELECT * FROM owner_profile WHERE owner_id=?", [owner.id]);` |
| `tests/owner_approval.test.js` | 920 | `const [profiles] = await dbConn.query("SELECT * FROM owner_profile WHERE owner_id=?", [owner.id]);` |
| `tests/owner_approval.test.js` | 1075 | `INSERT INTO owner_profile (owner_id, business_name, business_type, phone, verification_status, verified_at)` |
| `tests/owner_approval.test.js` | 1080 | `AND NOT EXISTS (SELECT 1 FROM owner_profile op WHERE op.owner_id = u.user_id)` |
| `tests/owner_approval.test.js` | 1083 | `const [p1] = await dbConn.query("SELECT * FROM owner_profile WHERE owner_id=?", [oWithListing.id]);` |
| `tests/owner_approval.test.js` | 1087 | `const [p2] = await dbConn.query("SELECT * FROM owner_profile WHERE owner_id=?", [oNoListing.id]);` |
| `tests/owner_approval.test.js` | 1090 | `const [p3] = await dbConn.query("SELECT * FROM owner_profile WHERE owner_id=?", [cust.id]);` |
| `tests/owner_approval.test.js` | 1095 | `INSERT INTO owner_profile (owner_id, business_name, business_type, phone, verification_status, verified_at)` |
| `tests/owner_approval.test.js` | 1100 | `AND NOT EXISTS (SELECT 1 FROM owner_profile op WHERE op.owner_id = u.user_id)` |
| `tests/owner_approval.test.js` | 1109 | `'INSERT INTO owner_profile (owner_id, business_name, business_type, phone, verification_status, verified_at)` |
| `tests/owner_approval.test.js` | 1118 | `const [rows] = await dbConn.query("SELECT * FROM owner_profile WHERE owner_id=?", [seedUser.id]);` |
| `tests/owner_approval.test.js` | 1123 | `it("F4: Fresh database schema has owner_profile with FK to users", async () => {` |
| `tests/owner_approval.test.js` | 1126 | `WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'owner_profile' AND CONSTRAINT_TYPE = 'FOREIGN KEY'',` |
| `tests/owner_verification_docs.test.js` | 72 | `const [profiles] = await dbConn.query("SELECT * FROM owner_profile WHERE owner_id=?", [users[0].user_id]);` |
| `tests/owner_verification_docs.test.js` | 211 | `const [profiles] = await dbConn.query("SELECT * FROM owner_profile WHERE owner_id=?", [users[0].user_id]);` |
| `tests/owner_verification_docs.test.js` | 281 | `const [profiles] = await dbConn.query("SELECT verification_status FROM owner_profile WHERE owner_id=?", [owner.id]);` |
| `tests/owner_verification_docs.test.js` | 299 | `const [p1] = await dbConn.query("SELECT * FROM owner_profile WHERE owner_id=?", [owner.id]);` |
| `tests/owner_verification_docs.test.js` | 309 | `const [p2] = await dbConn.query("SELECT * FROM owner_profile WHERE owner_id=?", [owner.id]);` |
| `tests/owner_verification_docs.test.js` | 328 | `const [profiles] = await dbConn.query("SELECT verification_status, verification_note FROM owner_profile WHERE owner_id=?` |
| `tests/owner_verification_docs.test.js` | 347 | `const [profiles] = await dbConn.query("SELECT verification_status, verification_note FROM owner_profile WHERE owner_id=?` |
| `tests/owner_verification_docs.test.js` | 376 | `const [profiles] = await dbConn.query("SELECT verification_status FROM owner_profile WHERE owner_id=?", [owner.id]);` |
| `tests/owner_verification_docs.test.js` | 394 | `const [profiles] = await dbConn.query("SELECT verification_status FROM owner_profile WHERE owner_id=?", [approvedOwner.i` |
| `tests/owner_verification_docs.test.js` | 450 | `const [profiles] = await dbConn.query("SELECT * FROM owner_profile WHERE owner_id=?", [owner.id]);` |
| `tests/routes.test.js` | 151 | `CREATE TABLE IF NOT EXISTS owner_profile (` |
| `tests/routes.test.js` | 240 | `await dbConn.query("DELETE FROM owner_profile");` |
| `tests/routes.test.js` | 255 | `/** Helper to create an owner user with an owner_profile */` |
| `tests/routes.test.js` | 272 | `'INSERT INTO owner_profile` |


### Usage of `reviews`

| File | Line | Snippet |
|---|---|---|
| `app.js` | 110 | `app.use("/listings/:id/reviews", reviewRoutes);` |
| `db/seed.js` | 6 | `* 2. Clears reviews and listings (RESTRICT keeps users safe; we clear explicitly).` |
| `db/seed.js` | 197 | `// -- Clear existing listings & reviews (users preserved) ---------------` |
| `db/seed.js` | 199 | `await conn.query("DELETE FROM reviews");` |
| `models/listing.js` | 27 | `* Map a DB row (possibly joined) to the full listing shape without reviews.` |
| `models/listing.js` | 64 | `LEFT JOIN reviews r ON r.listing_id = l.listing_id` |
| `models/listing.js` | 123 | `* Returns the full listing shape including owner and reviews, or null.` |
| `models/listing.js` | 141 | `// Fetch reviews ordered oldest first` |
| `models/listing.js` | 145 | `FROM reviews r` |
| `models/listing.js` | 152 | `listing.reviews = reviewRows.map((r) => ({` |
| `models/listing.js` | 164 | `* findById – used by edit form (no reviews).` |
| `models/listing.js` | 165 | `* Returns listing shape without reviews, or null.` |
| `models/listing.js` | 322 | `* remove – deletes a listing (cascades to reviews).` |
| `models/review.js` | 17 | `"INSERT INTO reviews (listing_id, user_id, rating, comment) VALUES (?, ?, ?, ?)",` |
| `models/review.js` | 30 | `"SELECT * FROM reviews WHERE review_id = ? LIMIT 1",` |
| `models/review.js` | 53 | `"DELETE FROM reviews WHERE review_id = ?",` |
| `models/user.js` | 268 | `// 4. Delete user (cascades to owner_profile, reviews, wishlists)` |
| `routes/review.js` | 7 | `const ReviewController = require("../controller/reviews.js");` |
| `tests/owner_approval.test.js` | 1160 | `.post('/listings/${lid}/reviews')` |
| `tests/owner_approval.test.js` | 1165 | `const [reviews] = await dbConn.query("SELECT * FROM reviews WHERE listing_id=?", [lid]);` |
| `tests/owner_approval.test.js` | 1166 | `assert.equal(reviews.length, 1);` |
| `tests/owner_approval.test.js` | 1167 | `assert.equal(reviews[0].comment, "Great stay!");` |
| `tests/owner_approval.test.js` | 1171 | `.delete('/listings/${lid}/reviews/${reviews[0].review_id}')` |
| `tests/owner_approval.test.js` | 1175 | `const [afterReviews] = await dbConn.query("SELECT * FROM reviews WHERE listing_id=?", [lid]);` |
| `tests/routes.test.js` | 191 | `CREATE TABLE IF NOT EXISTS reviews (` |
| `tests/routes.test.js` | 238 | `await dbConn.query("DELETE FROM reviews");` |
| `tests/routes.test.js` | 320 | `delete require.cache[require.resolve("../controller/reviews")];` |
| `tests/routes.test.js` | 435 | `app.use("/listings/:id/reviews", require("../routes/review"));` |
| `tests/routes.test.js` | 725 | `it("Row 20: DELETE /listings/:id (owner) -> listing + reviews deleted", async () => {` |
| `tests/routes.test.js` | 729 | `"INSERT INTO reviews (listing_id, user_id, rating, comment) VALUES (?,?,?,?)",` |
| `tests/routes.test.js` | 740 | `const [rev] = await dbConn.query("SELECT * FROM reviews WHERE listing_id=?", [tempId]);` |
| `tests/routes.test.js` | 756 | `// Row 22 - POST /listings/:id/reviews (anon) -> 302 to /login (F7)` |
| `tests/routes.test.js` | 759 | `.post('/listings/${listingId}/reviews')` |
| `tests/routes.test.js` | 771 | `.post('/listings/${listingId}/reviews')` |
| `tests/routes.test.js` | 776 | `const [rows] = await dbConn.query("SELECT * FROM reviews WHERE listing_id=?", [listingId]);` |
| `tests/routes.test.js` | 786 | `.post('/listings/${listingId}/reviews')` |
| `tests/routes.test.js` | 798 | `.delete('/listings/${listingId}/reviews/${reviewId}?_method=DELETE')` |
| `tests/routes.test.js` | 801 | `const [rows] = await dbConn.query("SELECT * FROM reviews WHERE review_id=?", [reviewId]);` |
| `tests/routes.test.js` | 809 | `"INSERT INTO reviews (listing_id, user_id, rating, comment) VALUES (?,?,?,?)",` |
| `tests/routes.test.js` | 817 | `.delete('/listings/${listingId}/reviews/${newReviewId}?_method=DELETE')` |
| `tests/routes.test.js` | 820 | `const [rows] = await dbConn.query("SELECT * FROM reviews WHERE review_id=?", [newReviewId]);` |
| `tests/routes.test.js` | 829 | `.delete('/listings/${listingId}/reviews/99999?_method=DELETE')` |
| `tests/routes.test.js` | 1546 | `it("Two reviews created at different times have different created_at (F5)", async () => {` |
| `tests/routes.test.js` | 1550 | `"INSERT INTO reviews (listing_id, user_id, rating, comment) VALUES (?,?,?,?)",` |
| `tests/routes.test.js` | 1556 | `"INSERT INTO reviews (listing_id, user_id, rating, comment) VALUES (?,?,?,?)",` |
| `tests/routes.test.js` | 1560 | `"SELECT created_at FROM reviews WHERE listing_id=? ORDER BY review_id ASC",` |
| `tests/routes.test.js` | 1598 | `"INSERT INTO reviews (listing_id, user_id, rating, comment) VALUES (?,?,?,?)",` |
| `utils/validateReview.js` | 34 | `// F6: Use findByIdWithDetails so reviews + owner are populated` |
| `views/listings/show.ejs` | 184 | `<!-- Reviews Section -->` |
| `views/listings/show.ejs` | 187 | `<i class="fa-regular fa-star me-2 text-warning"></i>Guest Reviews` |
| `views/listings/show.ejs` | 188 | `<span class="text-muted fs-6 fw-normal ms-1">(<%= listing.reviews.length %>)</span>` |
| `views/listings/show.ejs` | 191 | `<% if (listing.reviews.length === 0) { %>` |
| `views/listings/show.ejs` | 192 | `<div class="text-muted py-3">No reviews yet. Be the first to share your experience!</div>` |
| `views/listings/show.ejs` | 195 | `<% for (let review of listing.reviews) { %>` |
| `views/listings/show.ejs` | 215 | `action="/listings/<%= listing.id %>/reviews/<%= review.id %>?_method=DELETE"` |
| `views/listings/show.ejs` | 250 | `action="/listings/<%= listing.id %>/reviews"` |


### Usage of `users`

| File | Line | Snippet |
|---|---|---|
| `config/dashboardSections.js` | 22 | `{ key: "users", label: "Users", icon: "fa-solid fa-users", path: "/dashboard/users" },` |
| `controller/dashboard.js` | 283 | `* GET /dashboard/users (Admin)` |
| `controller/dashboard.js` | 299 | `res.render("dashboard/users.ejs", {` |
| `controller/dashboard.js` | 300 | `users: result.users,` |
| `controller/dashboard.js` | 310 | `activeSection: "users",` |
| `controller/dashboard.js` | 315 | `* GET /dashboard/users/:id (Admin user details)` |
| `controller/dashboard.js` | 321 | `return res.redirect("/dashboard/users");` |
| `controller/dashboard.js` | 327 | `return res.redirect("/dashboard/users");` |
| `controller/dashboard.js` | 350 | `activeSection: "users",` |
| `controller/dashboard.js` | 355 | `* DELETE /dashboard/users/:id (Admin delete user)` |
| `controller/dashboard.js` | 361 | `return res.redirect("/dashboard/users");` |
| `controller/dashboard.js` | 367 | `return res.redirect("/dashboard/users");` |
| `controller/dashboard.js` | 373 | `return res.redirect("/dashboard/users");` |
| `controller/dashboard.js` | 379 | `return res.redirect("/dashboard/users");` |
| `controller/dashboard.js` | 384 | `res.redirect("/dashboard/users");` |
| `controller/dashboard.js` | 388 | `* DELETE /dashboard/users/:userId/listings/:listingId (Admin delete listing)` |
| `controller/dashboard.js` | 396 | `return res.redirect('/dashboard/users/${userId}');` |
| `controller/dashboard.js` | 401 | `res.redirect('/dashboard/users/${userId}');` |
| `controller/user.js` | 13 | `res.render("users/signup.ejs", { selectedRole, BUSINESS_TYPES, values: {}, errors: {} });` |
| `controller/user.js` | 137 | `res.render("users/login.ejs");` |
| `db/ensureAdmin.js` | 43 | `"SELECT user_id, username, email, password_hash FROM users WHERE role = 'admin' LIMIT 1"` |
| `db/ensureAdmin.js` | 49 | `"SELECT user_id FROM users WHERE (username = ? OR email = ?) AND role != 'admin' LIMIT 1",` |
| `db/ensureAdmin.js` | 60 | `"INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, 'admin')",` |
| `db/ensureAdmin.js` | 75 | `"SELECT user_id FROM users WHERE (username = ? OR email = ?) AND user_id != ? LIMIT 1",` |
| `db/ensureAdmin.js` | 84 | `"UPDATE users SET username = ?, email = ? WHERE user_id = ?",` |
| `db/ensureAdmin.js` | 95 | `"UPDATE users SET password_hash = ? WHERE user_id = ?",` |
| `db/migrate.js` | 35 | `WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'',` |
| `db/migrate.js` | 42 | `'ALTER TABLE users` |
| `db/migrate.js` | 46 | `console.log("Step 1: Added 'role' column to users.");` |
| `db/migrate.js` | 55 | `'UPDATE users SET role = 'owner'` |
| `db/migrate.js` | 58 | `console.log("Step 2: Set role='owner' for users who own at least one listing.");` |
| `db/migrate.js` | 66 | `WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'admin_flag'',` |
| `db/migrate.js` | 72 | `'ALTER TABLE users` |
| `db/migrate.js` | 75 | `console.log("Step 3: Added 'admin_flag' generated column to users.");` |
| `db/migrate.js` | 83 | `WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND INDEX_NAME = 'uq_single_admin'',` |
| `db/migrate.js` | 89 | `'ALTER TABLE users ADD UNIQUE KEY uq_single_admin (admin_flag)'` |
| `db/migrate.js` | 117 | `REFERENCES users (user_id) ON DELETE CASCADE,` |
| `db/migrate.js` | 131 | `FROM users u` |
| `db/migrate.js` | 143 | `// Step 7: Phase 4 - Add profile columns to users if missing` |
| `db/migrate.js` | 146 | `WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'` |
| `db/migrate.js` | 153 | `await conn.query('ALTER TABLE users ADD COLUMN profile_picture_url VARCHAR(500) NULL');` |
| `db/migrate.js` | 154 | `console.log("Step 7a: Added 'profile_picture_url' column to users.");` |
| `db/migrate.js` | 157 | `await conn.query('ALTER TABLE users ADD COLUMN profile_picture_public_id VARCHAR(255) NULL');` |
| `db/migrate.js` | 158 | `console.log("Step 7b: Added 'profile_picture_public_id' column to users.");` |
| `db/migrate.js` | 161 | `await conn.query('ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL');` |
| `db/migrate.js` | 162 | `console.log("Step 7c: Added 'phone' column to users.");` |
| `db/migrate.js` | 165 | `await conn.query('ALTER TABLE users ADD COLUMN bio VARCHAR(300) NULL');` |
| `db/migrate.js` | 166 | `console.log("Step 7d: Added 'bio' column to users.");` |
| `db/migrate.js` | 186 | `REFERENCES users (user_id) ON DELETE CASCADE,` |
| `db/seed.js` | 6 | `* 2. Clears reviews and listings (RESTRICT keeps users safe; we clear explicitly).` |
| `db/seed.js` | 197 | `// -- Clear existing listings & reviews (users preserved) ---------------` |
| `db/seed.js` | 209 | `"SELECT user_id FROM users WHERE username = ? LIMIT 1",` |
| `db/seed.js` | 218 | `"UPDATE users SET password_hash = ?, role = 'owner' WHERE username = ?",` |
| `db/seed.js` | 224 | `"INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, 'owner')",` |
| `middleware.js` | 63 | `* blocked users from triggering Cloudinary uploads.` |
| `models/listing.js` | 133 | `LEFT JOIN users u ON u.user_id = l.owner_id` |
| `models/listing.js` | 146 | `JOIN users u ON u.user_id = r.user_id` |
| `models/listing.js` | 174 | `LEFT JOIN users u ON u.user_id = l.owner_id` |
| `models/ownerProfile.js` | 38 | `// joined from users table (present in listByStatus)` |
| `models/ownerProfile.js` | 170 | `JOIN users u ON u.user_id = op.owner_id` |
| `models/user.js` | 46 | `'INSERT INTO users` |
| `models/user.js` | 71 | `FROM users u` |
| `models/user.js` | 87 | `FROM users u` |
| `models/user.js` | 105 | `FROM users u` |
| `models/user.js` | 124 | `'UPDATE users` |
| `models/user.js` | 133 | `'UPDATE users` |
| `models/user.js` | 150 | `"SELECT profile_picture_public_id FROM users WHERE user_id = ? LIMIT 1",` |
| `models/user.js` | 158 | `'UPDATE users` |
| `models/user.js` | 166 | `* List all users with filtering, searching, sorting, and pagination (admin management).` |
| `models/user.js` | 202 | `// Count total matching users` |
| `models/user.js` | 205 | `FROM users u` |
| `models/user.js` | 219 | `FROM users u` |
| `models/user.js` | 230 | `users: rows.map(rowToUser),` |
| `models/user.js` | 247 | `"SELECT profile_picture_public_id FROM users WHERE user_id = ? LIMIT 1",` |
| `models/user.js` | 269 | `const [result] = await pool.execute("DELETE FROM users WHERE user_id = ?", [parsed]);` |
| `routes/dashboard.js` | 35 | `// 3. Wishlist (all authenticated users) & Bookings (customer)` |
| `routes/dashboard.js` | 84 | `"/users",` |
| `routes/dashboard.js` | 90 | `"/users/:id",` |
| `routes/dashboard.js` | 96 | `"/users/:id",` |
| `routes/dashboard.js` | 102 | `"/users/:userId/listings/:listingId",` |
| `seed/apply-seed.js` | 38 | `"SELECT COUNT(*) AS count FROM users WHERE email LIKE '%@seed.wanderlust.test' AND role = 'owner'"` |
| `seed/apply-seed.js` | 41 | `"SELECT COUNT(*) AS count FROM listings WHERE owner_id IN (SELECT user_id FROM users WHERE email LIKE '%@seed.wanderlust` |
| `seed/generate-seed.js` | 104 | `out.push('DELETE FROM listings WHERE owner_id IN (SELECT user_id FROM users WHERE email LIKE '%@${DOMAIN}');');` |
| `seed/generate-seed.js` | 105 | `out.push('DELETE FROM users WHERE email LIKE '%@${DOMAIN}';', '');` |
| `seed/generate-seed.js` | 113 | `'INSERT INTO users (username, email, password_hash, role, phone, bio) VALUES (' +` |
| `tests/dashboard_phase4.test.js` | 35 | `const [rows] = await dbConn.query("SELECT * FROM users WHERE role='admin' LIMIT 1");` |
| `tests/dashboard_phase4.test.js` | 122 | `const [rows] = await dbConn.query("SELECT * FROM users WHERE user_id = ?", [cust.id]);` |
| `tests/dashboard_phase4.test.js` | 147 | `const [rows] = await dbConn.query("SELECT username FROM users WHERE user_id = ?", [userB.id]);` |
| `tests/dashboard_phase4.test.js` | 155 | `"UPDATE users SET profile_picture_url = 'https://example.com/pic.jpg', profile_picture_public_id = 'test_pid' WHERE user` |
| `tests/dashboard_phase4.test.js` | 173 | `const [rows] = await dbConn.query("SELECT profile_picture_url, profile_picture_public_id FROM users WHERE user_id = ?", ` |
| `tests/dashboard_phase4.test.js` | 330 | `it("Admin user management: GET /dashboard/users lists users and supports search", async () => {` |
| `tests/dashboard_phase4.test.js` | 340 | `const resList = await ag.get("/dashboard/users");` |
| `tests/dashboard_phase4.test.js` | 346 | `const resSearch = await ag.get("/dashboard/users?search=alpha");` |
| `tests/dashboard_phase4.test.js` | 352 | `it("Admin user detail GET /dashboard/users/:id shows user info and owner listings", async () => {` |
| `tests/dashboard_phase4.test.js` | 361 | `const res = await ag.get('/dashboard/users/${owner.id}');` |
| `tests/dashboard_phase4.test.js` | 377 | `const delRes = await ag.delete('/dashboard/users/${victim.id}').redirects(0);` |
| `tests/dashboard_phase4.test.js` | 379 | `const [rows] = await dbConn.query("SELECT * FROM users WHERE user_id = ?", [victim.id]);` |
| `tests/dashboard_phase4.test.js` | 383 | `const selfRes = await ag.delete('/dashboard/users/${adm.id}').redirects(0);` |
| `tests/dashboard_phase4.test.js` | 385 | `const [selfRows] = await dbConn.query("SELECT * FROM users WHERE user_id = ?", [adm.id]);` |
| `tests/owner_approval.test.js` | 55 | `const [adminRows] = await dbConn.query("SELECT * FROM users WHERE role='admin' LIMIT 1");` |
| `tests/owner_approval.test.js` | 512 | `const [users] = await dbConn.query("SELECT * FROM users WHERE username='a1owner'");` |
| `tests/owner_approval.test.js` | 513 | `assert.equal(users.length, 1);` |
| `tests/owner_approval.test.js` | 514 | `assert.equal(users[0].role, "owner");` |
| `tests/owner_approval.test.js` | 516 | `const [profiles] = await dbConn.query("SELECT * FROM owner_profile WHERE owner_id=?", [users[0].user_id]);` |
| `tests/owner_approval.test.js` | 534 | `const [users] = await dbConn.query("SELECT * FROM users WHERE username='a2bad'");` |
| `tests/owner_approval.test.js` | 535 | `assert.equal(users.length, 0);` |
| `tests/owner_approval.test.js` | 564 | `const [users] = await dbConn.query("SELECT * FROM users WHERE username='a3fail'");` |
| `tests/owner_approval.test.js` | 565 | `assert.equal(users.length, 0, "User row must not remain after failed profile insert");` |
| `tests/owner_approval.test.js` | 580 | `const [users] = await dbConn.query("SELECT * FROM users WHERE username='a4cust'");` |
| `tests/owner_approval.test.js` | 581 | `assert.equal(users.length, 1);` |
| `tests/owner_approval.test.js` | 582 | `assert.equal(users[0].role, "customer");` |
| `tests/owner_approval.test.js` | 584 | `const [profiles] = await dbConn.query("SELECT * FROM owner_profile WHERE owner_id=?", [users[0].user_id]);` |
| `tests/owner_approval.test.js` | 736 | `const [users] = await dbConn.query("SELECT role FROM users WHERE user_id=?", [user.id]);` |
| `tests/owner_approval.test.js` | 737 | `assert.equal(users[0].role, "owner");` |
| `tests/owner_approval.test.js` | 1077 | `FROM users u` |
| `tests/owner_approval.test.js` | 1097 | `FROM users u` |
| `tests/owner_approval.test.js` | 1123 | `it("F4: Fresh database schema has owner_profile with FK to users", async () => {` |
| `tests/owner_verification_docs.test.js` | 42 | `const [rows] = await dbConn.query("SELECT * FROM users WHERE role='admin' LIMIT 1");` |
| `tests/owner_verification_docs.test.js` | 68 | `const [users] = await dbConn.query("SELECT * FROM users WHERE username='owner_docs1'");` |
| `tests/owner_verification_docs.test.js` | 69 | `assert.equal(users.length, 1);` |
| `tests/owner_verification_docs.test.js` | 70 | `assert.equal(users[0].role, "owner");` |
| `tests/owner_verification_docs.test.js` | 72 | `const [profiles] = await dbConn.query("SELECT * FROM owner_profile WHERE owner_id=?", [users[0].user_id]);` |
| `tests/owner_verification_docs.test.js` | 106 | `const [users] = await dbConn.query("SELECT * FROM users WHERE username='owner_nofiles'");` |
| `tests/owner_verification_docs.test.js` | 107 | `assert.equal(users.length, 0);` |
| `tests/owner_verification_docs.test.js` | 207 | `const [users] = await dbConn.query("SELECT * FROM users WHERE username='normal_cust'");` |
| `tests/owner_verification_docs.test.js` | 208 | `assert.equal(users.length, 1);` |
| `tests/owner_verification_docs.test.js` | 209 | `assert.equal(users[0].role, "customer");` |
| `tests/owner_verification_docs.test.js` | 211 | `const [profiles] = await dbConn.query("SELECT * FROM owner_profile WHERE owner_id=?", [users[0].user_id]);` |
| `tests/routes.test.js` | 132 | `CREATE TABLE IF NOT EXISTS users (` |
| `tests/routes.test.js` | 165 | `REFERENCES users (user_id) ON DELETE CASCADE,` |
| `tests/routes.test.js` | 186 | `REFERENCES users (user_id) ON DELETE RESTRICT,` |
| `tests/routes.test.js` | 203 | `REFERENCES users (user_id) ON DELETE CASCADE,` |
| `tests/routes.test.js` | 216 | `REFERENCES users (user_id) ON DELETE CASCADE,` |
| `tests/routes.test.js` | 241 | `await dbConn.query("DELETE FROM users");` |
| `tests/routes.test.js` | 249 | `"INSERT INTO users (username, email, password_hash, role) VALUES (?,?,?,?)",` |
| `tests/routes.test.js` | 851 | `const [rows] = await dbConn.query("SELECT password_hash, role FROM users WHERE username=?", ["newuser29"]);` |
| `tests/routes.test.js` | 1001 | `const [rows] = await dbConn.query("SELECT role FROM users WHERE username=?", ["r6user"]);` |
| `tests/routes.test.js` | 1022 | `const [rows] = await dbConn.query("SELECT role FROM users WHERE username=?", ["r7user"]);` |
| `tests/routes.test.js` | 1035 | `const [rows] = await dbConn.query("SELECT role FROM users WHERE username=?", ["r8user"]);` |
| `tests/routes.test.js` | 1042 | `const [before] = await dbConn.query("SELECT COUNT(*) as c FROM users WHERE username=?", ["r9admin"]);` |
| `tests/routes.test.js` | 1049 | `const [after] = await dbConn.query("SELECT COUNT(*) as c FROM users WHERE username=?", ["r9admin"]);` |
| `tests/routes.test.js` | 1061 | `const [rows] = await dbConn.query("SELECT * FROM users WHERE username=?", ["r10a"]);` |
| `tests/routes.test.js` | 1072 | `const [rows] = await dbConn.query("SELECT * FROM users WHERE username=?", ["r10b"]);` |
| `tests/routes.test.js` | 1083 | `const [rows] = await dbConn.query("SELECT * FROM users WHERE username=?", ["r10c"]);` |
| `tests/routes.test.js` | 1094 | `const [rows] = await dbConn.query("SELECT * FROM users WHERE username=?", ["r10d"]);` |
| `tests/routes.test.js` | 1106 | `const [rows] = await dbConn.query("SELECT role FROM users WHERE username=?", ["r11user"]);` |
| `tests/routes.test.js` | 1119 | `const [rows] = await dbConn.query("SELECT * FROM users WHERE username=?", ["ab"]);` |
| `tests/routes.test.js` | 1130 | `const [rows] = await dbConn.query("SELECT * FROM users WHERE username=?", ["r12buser"]);` |
| `tests/routes.test.js` | 1141 | `const [rows] = await dbConn.query("SELECT * FROM users WHERE username=?", ["r12cuser"]);` |
| `tests/routes.test.js` | 1148 | `await dbConn.query("DELETE FROM users WHERE role='admin'");` |
| `tests/routes.test.js` | 1151 | `"INSERT INTO users (username, email, password_hash, role) VALUES (?,?,?,'admin')",` |
| `tests/routes.test.js` | 1177 | `await dbConn.query("DELETE FROM users WHERE username='r13admin'");` |
| `tests/routes.test.js` | 1233 | `await dbConn.query("DELETE FROM users WHERE role='admin'");` |
| `tests/routes.test.js` | 1236 | `"INSERT INTO users (username, email, password_hash, role) VALUES (?,?,?,'admin')",` |
| `tests/routes.test.js` | 1276 | `it("R16: ensureAdmin on empty users table -> returns 'created', exactly one admin row", async () => {` |
| `tests/routes.test.js` | 1285 | `const [rows] = await dbConn.query("SELECT * FROM users WHERE role='admin'");` |
| `tests/routes.test.js` | 1293 | `const [rows] = await dbConn.query("SELECT * FROM users WHERE role='admin'");` |
| `tests/routes.test.js` | 1302 | `const [rows] = await dbConn.query("SELECT password_hash FROM users WHERE username='unit_admin'");` |
| `tests/routes.test.js` | 1317 | `"INSERT INTO users (username, email, password_hash, role) VALUES (?,?,?,'customer')",` |
| `tests/routes.test.js` | 1324 | `const [rows] = await dbConn.query("SELECT role FROM users WHERE username='conflict_admin'");` |
| `tests/routes.test.js` | 1364 | `"INSERT INTO users (username, email, password_hash, role) VALUES (?,?,?,'admin')",` |
| `tests/routes.test.js` | 1370 | `"INSERT INTO users (username, email, password_hash, role) VALUES (?,?,?,'admin')",` |
| `tests/routes.test.js` | 1427 | `// Insert two users and a listing owned by user1` |
| `utils/roles.js` | 17 | `/** Human-readable labels shown to users. */` |
| `utils/roles.js` | 32 | `/** Owner approval status labels shown to users. */` |
| `utils/validateUser.js` | 79 | `return res.status(400).render("users/signup.ejs", {` |
| `views/dashboard/user-detail.ejs` | 15 | `<a href="/dashboard/users" class="btn btn-sm btn-outline-secondary">` |
| `views/dashboard/user-detail.ejs` | 16 | `<i class="fa-solid fa-arrow-left me-1"></i>Back to Users` |
| `views/dashboard/user-detail.ejs` | 23 | `action="/dashboard/users/<%= targetUser.id %>?_method=DELETE"` |
| `views/dashboard/user-detail.ejs` | 251 | `action="/dashboard/users/<%= targetUser.id %>/listings/<%= l.id %>?_method=DELETE"` |
| `views/dashboard/users.ejs` | 16 | `Total: <%= totalUsers %> <%= totalUsers === 1 ? 'User' : 'Users' %>` |
| `views/dashboard/users.ejs` | 22 | `<form id="usersFilterForm" action="/dashboard/users" method="GET" class="row g-2 align-items-center">` |
| `views/dashboard/users.ejs` | 154 | `<a href="/dashboard/users" id="btnResetFilters" class="btn wl-btn-outline d-flex align-items-center justify-content-cent` |
| `views/dashboard/users.ejs` | 163 | `<% if (!users || users.length === 0) { %>` |
| `views/dashboard/users.ejs` | 173 | `<h3 class="h4 fw-bold text-dark mt-3 mb-2">No users matched your search criteria</h3>` |
| `views/dashboard/users.ejs` | 177 | `<a href="/dashboard/users" class="btn wl-btn-outline">` |
| `views/dashboard/users.ejs` | 178 | `View All Users` |
| `views/dashboard/users.ejs` | 183 | `<!-- Users Table Container -->` |
| `views/dashboard/users.ejs` | 197 | `<% for (let u of users) { %>` |
| `views/dashboard/users.ejs` | 277 | `href="/dashboard/users/<%= u.id %>"` |
| `views/dashboard/users.ejs` | 315 | `href="/dashboard/users?page=<%= p %>&search=<%= search || '' %>&role=<%= roleFilter || 'all' %>&ownerStatus=<%= ownerSta` |
| `views/dashboard/users.ejs` | 373 | `targetUrl = "/dashboard/users?" + params.toString();` |
| `views/dashboard/users.ejs` | 503 | `triggerFilter("/dashboard/users");` |
| `views/dashboard/users.ejs` | 536 | `form.action = '/dashboard/users/${userId}?_method=DELETE';` |
| `views/landing.ejs` | 99 | `<i class="fa-solid fa-users text-teal-100"></i>` |
| `views/users/signup.ejs` | 43 | `<i class="fa-solid fa-users fs-6"></i>` |


### Usage of `wishlists`

| File | Line | Snippet |
|---|---|---|
| `db/migrate.js` | 169 | `// Step 8: Phase 4 - Create wishlists table if missing` |
| `db/migrate.js` | 172 | `WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'wishlists'',` |
| `db/migrate.js` | 178 | `CREATE TABLE wishlists (` |
| `db/migrate.js` | 193 | `console.log("Step 8: Created 'wishlists' table.");` |
| `db/migrate.js` | 195 | `console.log("Step 8: 'wishlists' table already exists - skipped.");` |
| `models/user.js` | 268 | `// 4. Delete user (cascades to owner_profile, reviews, wishlists)` |
| `models/wishlist.js` | 25 | `"INSERT IGNORE INTO wishlists (user_id, listing_id) VALUES (?, ?)",` |
| `models/wishlist.js` | 40 | `"DELETE FROM wishlists WHERE user_id = ? AND listing_id = ?",` |
| `models/wishlist.js` | 55 | `"SELECT id FROM wishlists WHERE user_id = ? AND listing_id = ? LIMIT 1",` |
| `models/wishlist.js` | 71 | `FROM wishlists w` |
| `models/wishlist.js` | 98 | `"SELECT listing_id FROM wishlists WHERE user_id = ?",` |
| `models/wishlist.js` | 112 | `"SELECT COUNT(*) AS c FROM wishlists WHERE user_id = ?",` |
| `tests/dashboard_phase4.test.js` | 202 | `"SELECT * FROM wishlists WHERE user_id = ? AND listing_id = ?",` |
| `tests/dashboard_phase4.test.js` | 223 | `"SELECT * FROM wishlists WHERE user_id = ? AND listing_id = ?",` |
| `tests/routes.test.js` | 208 | `CREATE TABLE IF NOT EXISTS wishlists (` |
| `tests/routes.test.js` | 237 | `await dbConn.query("DELETE FROM wishlists");` |

