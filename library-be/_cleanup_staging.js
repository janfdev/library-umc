require('dotenv/config');
const {Pool} = require('pg');
const pool = new Pool({connectionString: process.env.DATABASE_URL});

(async()=>{
  const c = await pool.connect();
  try {
    const r = await c.query("SELECT count(*) as cnt FROM import_batches WHERE status='uploading'");
    console.log('Uploading batches:', r.rows[0].cnt);
    const r2 = await c.query('SELECT count(*) as cnt FROM import_item_rows');
    console.log('Staging rows:', r2.rows[0].cnt);
    // Clean up
    await c.query('DELETE FROM import_item_rows');
    await c.query('DELETE FROM import_batches');
    console.log('Cleaned up');
  } finally { c.release(); await pool.end(); }
})()
