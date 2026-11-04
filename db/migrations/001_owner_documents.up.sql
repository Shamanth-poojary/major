-- Migration 001 Up: 1NF Decomposition of owner_profile.documents into owner_documents child table

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Losslessly move existing JSON document data into owner_documents, preserving ordinality
INSERT INTO owner_documents (owner_id, file_url, public_id, original_name, mime_type, file_size, resource_type, uploaded_at)
SELECT op.owner_id,
       jt.file_url,
       jt.public_id,
       jt.original_name,
       jt.mime_type,
       jt.file_size,
       jt.resource_type,
       COALESCE(jt.uploaded_at, op.created_at)
FROM owner_profile op,
     JSON_TABLE(op.documents, '$[*]' COLUMNS (
       ord           FOR ORDINALITY,
       file_url      VARCHAR(500) PATH '$.url',
       public_id     VARCHAR(255) PATH '$.publicId',
       original_name VARCHAR(255) PATH '$.originalName',
       mime_type     VARCHAR(100) PATH '$.mimeType',
       file_size     INT UNSIGNED PATH '$.size',
       resource_type VARCHAR(50)  PATH '$.resourceType',
       uploaded_at   TIMESTAMP    PATH '$.uploadedAt'
     )) jt
WHERE op.documents IS NOT NULL
ORDER BY op.owner_id, jt.ord;
