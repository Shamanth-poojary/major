# WanderLust Entity-Relationship Diagram (Normalized 1NF–5NF)

Below is the complete relational model for the WanderLust vacation rental system after the 1NF decomposition of `owner_profile.documents` into `owner_documents` and relational hygiene fixes.

```mermaid
erDiagram
    users {
        int unsigned user_id PK "AUTO_INCREMENT"
        varchar username UK "UNIQUE"
        varchar email UK "UNIQUE"
        varchar password_hash
        enum role "customer | owner | admin"
        tinyint admin_flag UK "GENERATED STORED"
        varchar profile_picture_url
        varchar profile_picture_public_id
        varchar phone
        varchar bio
        timestamp created_at
    }

    owner_profile {
        int unsigned owner_id PK, FK "References users(user_id)"
        varchar business_name
        enum business_type
        varchar phone
        enum verification_status
        varchar rejection_reason
        varchar verification_note
        timestamp verified_at
        timestamp created_at
        timestamp updated_at
    }

    owner_documents {
        int unsigned document_id PK "AUTO_INCREMENT"
        int unsigned owner_id FK "References owner_profile(owner_id)"
        varchar file_url
        varchar public_id
        varchar original_name
        varchar mime_type
        int unsigned file_size
        varchar resource_type
        timestamp uploaded_at
    }

    listings {
        int unsigned listing_id PK "AUTO_INCREMENT"
        int unsigned owner_id FK "References users(user_id)"
        varchar title
        text description
        decimal price "CHECK >= 0"
        varchar location
        varchar country
        decimal latitude "CHECK -90 to 90"
        decimal longitude "CHECK -180 to 180"
        varchar image_url
        varchar image_filename
        timestamp created_at
    }

    reviews {
        int unsigned review_id PK "AUTO_INCREMENT"
        int unsigned listing_id FK "References listings(listing_id)"
        int unsigned user_id FK "References users(user_id)"
        tinyint rating "CHECK 1 to 5"
        text comment
        timestamp created_at
    }

    wishlists {
        int unsigned id PK "AUTO_INCREMENT"
        int unsigned user_id FK "References users(user_id), UNIQUE pair"
        int unsigned listing_id FK "References listings(listing_id), UNIQUE pair"
        timestamp created_at
    }

    users ||--o| owner_profile : "identifying 1:1 subtype"
    owner_profile ||--o{ owner_documents : "1:N child documents (1NF)"
    users ||--o{ listings : "creates / owns"
    listings ||--o{ reviews : "receives"
    users ||--o{ reviews : "authors"
    users ||--o{ wishlists : "saves"
    listings ||--o{ wishlists : "saved in"
```
