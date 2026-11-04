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
