const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');

async function main() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'wanderlust_user';
  const password = process.env.DB_PASSWORD || '';
  const dbName = `${process.env.DB_NAME || 'wanderlust'}_norm`;

  console.log(`Connecting to ${dbName} for Phase 2 & 2b analysis...`);
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database: dbName,
  });

  // 1. Check grants for R13
  const [grants] = await conn.query('SHOW GRANTS FOR CURRENT_USER()');
  console.log('Grants retrieved.');

  // 2. Run orphan scans for all foreign keys (R2)
  const [fks] = await conn.query(
    `SELECT k.table_name, k.column_name, k.referenced_table_name, k.referenced_column_name,
            r.update_rule, r.delete_rule, k.constraint_name
     FROM information_schema.key_column_usage k
     JOIN information_schema.referential_constraints r
       ON r.constraint_schema = k.table_schema AND r.constraint_name = k.constraint_name
     WHERE k.table_schema = ? AND k.referenced_table_name IS NOT NULL`,
    [dbName]
  );

  const orphanResults = [];
  for (const fk of fks) {
    const q = `SELECT COUNT(*) as c FROM \`${fk.TABLE_NAME}\` c
               LEFT JOIN \`${fk.REFERENCED_TABLE_NAME}\` p
                 ON p.\`${fk.REFERENCED_COLUMN_NAME}\` = c.\`${fk.COLUMN_NAME}\`
               WHERE p.\`${fk.REFERENCED_COLUMN_NAME}\` IS NULL AND c.\`${fk.COLUMN_NAME}\` IS NOT NULL`;
    const [res] = await conn.query(q);
    orphanResults.push({
      table: fk.TABLE_NAME,
      col: fk.COLUMN_NAME,
      refTable: fk.REFERENCED_TABLE_NAME,
      refCol: fk.REFERENCED_COLUMN_NAME,
      orphans: res[0].c,
      query: q,
    });
  }

  // 3. Test H1 & H2: location -> country, location -> coordinates on listings
  const [locCountryVariants] = await conn.query(
    `SELECT location, COUNT(DISTINCT country) as cnt, GROUP_CONCAT(DISTINCT country) as countries
     FROM listings GROUP BY location HAVING cnt > 1`
  );
  const [locSpellingVariants] = await conn.query(
    `SELECT LOWER(TRIM(location)) as norm, COUNT(DISTINCT location) as variants, GROUP_CONCAT(DISTINCT location) as origs
     FROM listings GROUP BY norm HAVING variants > 1`
  );
  const [countrySpellingVariants] = await conn.query(
    `SELECT LOWER(TRIM(country)) as norm, COUNT(DISTINCT country) as variants, GROUP_CONCAT(DISTINCT country) as origs
     FROM listings GROUP BY norm HAVING variants > 1`
  );
  const [locCoordVariants] = await conn.query(
    `SELECT location, COUNT(DISTINCT CONCAT(latitude, ',', longitude)) as cnt
     FROM listings GROUP BY location HAVING cnt > 1`
  );
  const [repeatLocPairs] = await conn.query(
    `SELECT location, country, COUNT(*) as cnt FROM listings GROUP BY location, country HAVING cnt > 1 ORDER BY cnt DESC LIMIT 10`
  );

  // 4. Test H3: business_type on owner_profile
  const [bTypes] = await conn.query(
    `SELECT business_type, COUNT(*) as count FROM owner_profile GROUP BY business_type`
  );

  // 5. Test H4: owner_profile status & rejection_reason
  const [ownerStatuses] = await conn.query(
    `SELECT verification_status, COUNT(*) as count, COUNT(rejection_reason) as with_reason
     FROM owner_profile GROUP BY verification_status`
  );

  // 6. Test H5: duplicated columns in owner_profile
  const [opCols] = await conn.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = ? AND table_name = 'owner_profile'`,
    [dbName]
  );
  const opColNames = opCols.map((c) => c.COLUMN_NAME);

  // 7. Test H6: users profilePictureUrl vs profilePicturePublicId
  const [usersPics] = await conn.query(
    `SELECT COUNT(*) as total,
            COUNT(profile_picture_url) as with_url,
            COUNT(profile_picture_public_id) as with_pub_id
     FROM users`
  );

  // 8. Test H7 / R11: subtype integrity (owner_profile for non-owner)
  const [orphanOwnerProfiles] = await conn.query(
    `SELECT op.owner_id, u.role FROM owner_profile op JOIN users u ON u.user_id = op.owner_id WHERE u.role <> 'owner'`
  );

  // 9. Test H8: multiple reviews per user per listing, rating bounds
  const [dupReviews] = await conn.query(
    `SELECT user_id, listing_id, COUNT(*) as cnt FROM reviews GROUP BY user_id, listing_id HAVING cnt > 1`
  );
  const [outOfBoundsRatings] = await conn.query(
    `SELECT COUNT(*) as cnt FROM reviews WHERE rating < 1 OR rating > 5`
  );
  const [listingReviewCols] = await conn.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = ? AND table_name = 'listings' AND column_name LIKE '%rating%'`,
    [dbName]
  );

  // 10. Test H9: wishlists duplicate user_id, listing_id & PK
  const [dupWishlists] = await conn.query(
    `SELECT user_id, listing_id, COUNT(*) as cnt FROM wishlists GROUP BY user_id, listing_id HAVING cnt > 1`
  );
  const [wishlistPK] = await conn.query(
    `SELECT k.column_name FROM information_schema.table_constraints t
     JOIN information_schema.key_column_usage k ON k.constraint_name = t.constraint_name AND k.table_name = t.table_name AND k.table_schema = t.table_schema
     WHERE t.table_schema = ? AND t.table_name = 'wishlists' AND t.constraint_type = 'PRIMARY KEY'`,
    [dbName]
  );

  // 11. Test H10: listing price column type
  const [priceCol] = await conn.query(
    `SELECT column_type, is_nullable, column_default FROM information_schema.columns
     WHERE table_schema = ? AND table_name = 'listings' AND column_name = 'price'`,
    [dbName]
  );

  // 12. Test H11: owner_documents and multi-valued items
  const [docCols] = await conn.query(
    `SELECT column_name, column_type FROM information_schema.columns
     WHERE table_schema = ? AND table_name = 'owner_documents'`,
    [dbName]
  );

  // 13. Test 1NF: atomicity on text columns (check for comma/pipe delimited lists or JSON)
  const [textCols] = await conn.query(
    `SELECT table_name, column_name FROM information_schema.columns
     WHERE table_schema = ? AND data_type IN ('varchar', 'text', 'mediumtext')
       AND table_name NOT IN ('sessions')`,
    [dbName]
  );
  const atomicityFindings = [];
  for (const c of textCols) {
    if (['password_hash', 'image_url', 'public_id', 'url', 'special_requests', 'rejection_reason', 'description', 'notes', 'file_name', 'original_filename'].includes(c.COLUMN_NAME)) {
      continue;
    }
    const [found] = await conn.query(
      `SELECT COUNT(*) as c FROM \`${c.TABLE_NAME}\`
       WHERE \`${c.COLUMN_NAME}\` LIKE '%,%' OR \`${c.COLUMN_NAME}\` LIKE '%;%' OR \`${c.COLUMN_NAME}\` LIKE '%|%'`
    );
    if (found[0].c > 0) {
      atomicityFindings.push({
        table: c.TABLE_NAME,
        column: c.COLUMN_NAME,
        matches: found[0].c,
      });
    }
  }

  // 14. Password storage security check (R12)
  const [plainPasswords] = await conn.query(
    `SELECT COUNT(*) as c FROM users WHERE password_hash NOT LIKE '$2%' AND password_hash NOT LIKE '$argon2%'`
  );

  const findingsSummary = {
    orphanResults,
    locCountryVariants,
    locSpellingVariants,
    countrySpellingVariants,
    locCoordVariants,
    repeatLocPairs,
    bTypes,
    ownerStatuses,
    opColNames,
    usersPics: usersPics[0],
    orphanOwnerProfiles,
    dupReviews,
    outOfBoundsRatings: outOfBoundsRatings[0].c,
    listingReviewCols,
    dupWishlists,
    wishlistPK: wishlistPK.map((k) => k.COLUMN_NAME),
    priceCol: priceCol[0],
    docCols,
    atomicityFindings,
    plainPasswords: plainPasswords[0].c,
    grants: grants.map((g) => Object.values(g)[0]),
  };

  const auditDir = path.join(__dirname, '..', 'docs', 'db-audit');
  fs.writeFileSync(
    path.join(auditDir, 'raw_findings.json'),
    JSON.stringify(findingsSummary, null, 2),
    'utf8'
  );
  console.log('Raw findings saved to raw_findings.json!');

  await conn.end();
}

main().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
