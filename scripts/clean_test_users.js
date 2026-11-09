const mysql = require('mysql2/promise');
require('dotenv').config();

async function clean(dbName) {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: dbName,
  });

  await conn.query(`
    DELETE p FROM payments p 
    JOIN bookings b ON b.id = p.booking_id 
    JOIN users u ON u.user_id = b.customer_id 
    WHERE u.username LIKE 'test_%'
  `);
  await conn.query(`DELETE b FROM bookings b JOIN users u ON u.user_id = b.customer_id WHERE u.username LIKE 'test_%'`);
  await conn.query(`DELETE l FROM listings l JOIN users u ON u.user_id = l.owner_id WHERE u.username LIKE 'test_%'`);
  await conn.query(`DELETE FROM users WHERE username LIKE 'test_%'`);
  console.log(`Cleaned test records from ${dbName}`);
  await conn.end();
}

const db = process.argv[2] || 'wanderlust_norm';
clean(db).catch(console.error);
