-- Migration 001 Down: Restore JSON array into owner_profile.documents and drop owner_documents

UPDATE owner_profile op
JOIN (
  SELECT owner_id,
         JSON_ARRAYAGG(JSON_OBJECT(
           'url', file_url,
           'publicId', public_id,
           'originalName', original_name,
           'mimeType', mime_type,
           'size', file_size,
           'resourceType', resource_type,
           'uploadedAt', DATE_FORMAT(uploaded_at, '%Y-%m-%dT%H:%i:%s.000Z')
         )) AS docs
  FROM (SELECT * FROM owner_documents ORDER BY owner_id, document_id) o
  GROUP BY owner_id
) d ON d.owner_id = op.owner_id
SET op.documents = d.docs;

DROP TABLE IF EXISTS owner_documents;
