const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try { await connection.query('ALTER TABLE DeviceType ADD COLUMN sub_category VARCHAR(100);'); } catch (e) { console.log('sub_category: ' + e.message); }
  try { await connection.query('ALTER TABLE DeviceType ADD COLUMN icon_id VARCHAR(100);'); } catch (e) { console.log('icon_id: ' + e.message); }
  try { await connection.query(`ALTER TABLE DeviceType MODIFY COLUMN category ENUM('COMPUTING', 'NETWORK', 'CCTV', 'PERIPHERAL', 'AUDIOVISUAL', 'POS') NOT NULL DEFAULT 'COMPUTING';`); } catch (e) { console.log('category: ' + e.message); }
  
  console.log('DB manually synced.');
  await connection.end();
}

run();
