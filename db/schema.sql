CREATE DATABASE IF NOT EXISTS wanderlust
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE wanderlust;

CREATE TABLE IF NOT EXISTS users (
  user_id                   INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  username                  VARCHAR(50)   NOT NULL,
  email                     VARCHAR(255)  NOT NULL,
  password_hash             VARCHAR(255)  NOT NULL,
  role                      ENUM('customer','owner','admin') NOT NULL DEFAULT 'customer',
  admin_flag                TINYINT GENERATED ALWAYS AS (IF(role = 'admin', 1, NULL)) STORED,
  profile_picture_url       VARCHAR(500)  NULL,
  profile_picture_public_id VARCHAR(255)  NULL,
  phone                     VARCHAR(20)   NULL,
  bio                       VARCHAR(300)  NULL,
  created_at                TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_single_admin (admin_flag)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS owner_profile (
  owner_id            INT UNSIGNED NOT NULL,
  business_name       VARCHAR(100) NOT NULL,
  business_type       ENUM('hotel_owner','property_owner','venue_owner','event_planner') NOT NULL,
  phone               VARCHAR(20)  NULL,
  verification_status ENUM('pending','approved','rejected','info_requested') NOT NULL DEFAULT 'pending',
  rejection_reason    VARCHAR(500) NULL,
  verification_note   VARCHAR(500) NULL,
  verified_at         TIMESTAMP    NULL,
  created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (owner_id),
  CONSTRAINT fk_owner_profile_user FOREIGN KEY (owner_id)
    REFERENCES users (user_id) ON DELETE CASCADE,
  KEY idx_owner_profile_status (verification_status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS owner_documents (
  document_id   INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  owner_id      INT UNSIGNED  NOT NULL,
  file_url      VARCHAR(500)  NOT NULL,
  public_id     VARCHAR(255)  NULL,
  original_name VARCHAR(255)  NULL,
  mime_type     VARCHAR(100)  NULL,
  file_size     INT UNSIGNED  NULL,
  resource_type VARCHAR(50)   NULL,
  uploaded_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (document_id),
  CONSTRAINT fk_owner_documents_owner FOREIGN KEY (owner_id)
    REFERENCES owner_profile (owner_id) ON DELETE CASCADE,
  KEY idx_owner_documents_owner (owner_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS listings (
  listing_id     INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  owner_id       INT UNSIGNED  NOT NULL,
  title          VARCHAR(255)  NOT NULL,
  description    TEXT          NOT NULL,
  price          DECIMAL(10,2) NOT NULL,
  location       VARCHAR(255)  NOT NULL,
  country        VARCHAR(100)  NOT NULL,
  latitude       DECIMAL(9,6)  NULL,
  longitude      DECIMAL(9,6)  NULL,
  image_url      VARCHAR(500)  NOT NULL,
  image_filename VARCHAR(255)  NULL,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (listing_id),
  CONSTRAINT chk_listing_price CHECK (price >= 0),
  CONSTRAINT chk_listing_lat CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  CONSTRAINT chk_listing_lng CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  CONSTRAINT fk_listing_owner FOREIGN KEY (owner_id)
    REFERENCES users (user_id) ON DELETE RESTRICT,
  KEY idx_listings_owner (owner_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reviews (
  review_id  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  listing_id INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  rating     TINYINT      NOT NULL,
  comment    TEXT         NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (review_id),
  CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_review_listing FOREIGN KEY (listing_id)
    REFERENCES listings (listing_id) ON DELETE CASCADE,
  CONSTRAINT fk_review_user FOREIGN KEY (user_id)
    REFERENCES users (user_id) ON DELETE CASCADE,
  KEY idx_reviews_listing (listing_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS wishlists (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  listing_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_listing (user_id, listing_id),
  CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id)
    REFERENCES users (user_id) ON DELETE CASCADE,
  CONSTRAINT fk_wishlist_listing FOREIGN KEY (listing_id)
    REFERENCES listings (listing_id) ON DELETE CASCADE,
  KEY idx_wishlists_listing (listing_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS room_types (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  listing_id INT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  category ENUM('standard','deluxe','suite','family','dormitory','entire_property','hall','other') NOT NULL DEFAULT 'standard',
  bed_config VARCHAR(100) NULL,
  size_sqft INT UNSIGNED NULL,
  max_guests INT UNSIGNED NOT NULL DEFAULT 2,
  price_per_night DECIMAL(10,2) NOT NULL,
  total_units INT UNSIGNED NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_auto_generated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_room_types_listing FOREIGN KEY (listing_id)
    REFERENCES listings (listing_id) ON DELETE CASCADE,
  CONSTRAINT chk_room_types_price CHECK (price_per_night >= 0),
  CONSTRAINT chk_room_types_units CHECK (total_units >= 0),
  CONSTRAINT chk_room_types_guests CHECK (max_guests > 0),
  KEY idx_room_types_listing (listing_id),
  KEY idx_room_types_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS amenities (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_amenities_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS room_type_amenities (
  room_type_id INT UNSIGNED NOT NULL,
  amenity_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (room_type_id, amenity_id),
  CONSTRAINT fk_rta_room_type FOREIGN KEY (room_type_id)
    REFERENCES room_types (id) ON DELETE CASCADE,
  CONSTRAINT fk_rta_amenity FOREIGN KEY (amenity_id)
    REFERENCES amenities (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS room_type_images (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  room_type_id INT UNSIGNED NOT NULL,
  url VARCHAR(500) NOT NULL,
  public_id VARCHAR(255) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_rti_room_type FOREIGN KEY (room_type_id)
    REFERENCES room_types (id) ON DELETE CASCADE,
  KEY idx_rti_room_type (room_type_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS listing_payment_policy (
  listing_id INT UNSIGNED NOT NULL,
  allow_advance BOOLEAN NOT NULL DEFAULT TRUE,
  advance_type ENUM('fixed','percent') NOT NULL DEFAULT 'percent',
  advance_value DECIMAL(10,2) NOT NULL DEFAULT 25.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (listing_id),
  CONSTRAINT fk_lpp_listing FOREIGN KEY (listing_id)
    REFERENCES listings (listing_id) ON DELETE CASCADE,
  CONSTRAINT chk_lpp_advance_val CHECK (advance_value >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bookings (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_ref VARCHAR(32) NOT NULL,
  customer_id INT UNSIGNED NOT NULL,
  listing_id INT UNSIGNED NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  adults INT UNSIGNED NOT NULL DEFAULT 1,
  children INT UNSIGNED NOT NULL DEFAULT 0,
  contact_phone VARCHAR(20) NOT NULL,
  special_requests TEXT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  advance_required DECIMAL(10,2) NOT NULL,
  status ENUM('pending_payment','confirmed','cancelled','expired','completed') NOT NULL DEFAULT 'pending_payment',
  hold_expires_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bookings_ref (booking_ref),
  CONSTRAINT chk_bookings_dates CHECK (check_out > check_in),
  CONSTRAINT chk_bookings_amounts CHECK (total_amount >= 0 AND advance_required >= 0),
  CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_id)
    REFERENCES users (user_id) ON DELETE RESTRICT,
  CONSTRAINT fk_bookings_listing FOREIGN KEY (listing_id)
    REFERENCES listings (listing_id) ON DELETE RESTRICT,
  KEY idx_bookings_dates (listing_id, check_in, check_out),
  KEY idx_bookings_customer (customer_id),
  KEY idx_bookings_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS booking_rooms (
  booking_id INT UNSIGNED NOT NULL,
  room_type_id INT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (booking_id, room_type_id),
  CONSTRAINT chk_booking_rooms_qty CHECK (quantity > 0),
  CONSTRAINT chk_booking_rooms_price CHECK (unit_price >= 0),
  CONSTRAINT fk_br_booking FOREIGN KEY (booking_id)
    REFERENCES bookings (id) ON DELETE CASCADE,
  CONSTRAINT fk_br_room_type FOREIGN KEY (room_type_id)
    REFERENCES room_types (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id INT UNSIGNED NOT NULL,
  gateway_order_id VARCHAR(64) NOT NULL,
  gateway_payment_id VARCHAR(64) NULL,
  purpose ENUM('advance','balance','full') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method ENUM('card','upi','netbanking') NOT NULL,
  card_network VARCHAR(30) NULL,
  card_last4 VARCHAR(4) NULL,
  status ENUM('created','processing','success','failed') NOT NULL DEFAULT 'created',
  failure_reason VARCHAR(255) NULL,
  idempotency_key VARCHAR(128) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_order (gateway_order_id),
  UNIQUE KEY uq_payments_idempotency (idempotency_key),
  CONSTRAINT chk_payments_amount CHECK (amount >= 0),
  CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id)
    REFERENCES bookings (id) ON DELETE CASCADE,
  KEY idx_payments_booking (booking_id),
  KEY idx_payments_status (status)
) ENGINE=InnoDB;

CREATE OR REPLACE VIEW booking_summary AS
SELECT 
  b.id AS booking_id,
  b.booking_ref,
  b.customer_id,
  b.listing_id,
  b.check_in,
  b.check_out,
  b.adults,
  b.children,
  b.contact_phone,
  b.special_requests,
  b.total_amount,
  b.advance_required,
  b.status AS booking_status,
  b.hold_expires_at,
  b.created_at,
  b.updated_at,
  COALESCE(SUM(CASE WHEN p.status = 'success' THEN p.amount ELSE 0 END), 0.00) AS amount_paid,
  GREATEST(0.00, b.total_amount - COALESCE(SUM(CASE WHEN p.status = 'success' THEN p.amount ELSE 0 END), 0.00)) AS balance_due,
  CASE
    WHEN COALESCE(SUM(CASE WHEN p.status = 'success' THEN p.amount ELSE 0 END), 0.00) = 0 THEN 'unpaid'
    WHEN COALESCE(SUM(CASE WHEN p.status = 'success' THEN p.amount ELSE 0 END), 0.00) >= b.total_amount THEN 'paid'
    ELSE 'partially_paid'
  END AS payment_status
FROM bookings b
LEFT JOIN payments p ON p.booking_id = b.id
GROUP BY b.id;
