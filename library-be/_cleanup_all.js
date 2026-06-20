require('dotenv/config');
const {Pool} = require('pg');
const pool = new Pool({connectionString: process.env.DATABASE_URL});

(async()=>{
  const c = await pool.connect();
  try {
    // Clean in correct order (child tables first)
    await c.query('DELETE FROM import_bibliography_item_codes');
    await c.query('DELETE FROM import_errors');
    await c.query('DELETE FROM import_item_rows');
    await c.query('DELETE FROM import_bibliography_rows');
    await c.query('DELETE FROM import_batches');
    console.log('Cleaned all import staging data');
    
    // Also clean test bibliographies
    await c.query("DELETE FROM bibliography_authors WHERE bibliography_id IN (SELECT id FROM bibliographies WHERE title LIKE 'SYNTHETIC%' OR title LIKE 'Test%')");
    await c.query("DELETE FROM bibliography_subjects WHERE bibliography_id IN (SELECT id FROM bibliographies WHERE title LIKE 'SYNTHETIC%' OR title LIKE 'Test%')");
    await c.query("DELETE FROM items WHERE bibliography_id IN (SELECT id FROM bibliographies WHERE title LIKE 'SYNTHETIC%' OR title LIKE 'Test%')");
    await c.query("DELETE FROM bibliographies WHERE title LIKE 'SYNTHETIC%' OR title LIKE 'Test%'");
    console.log('Cleaned test data');
    
    // Verify
    const r = await c.query('SELECT count(*) as cnt FROM bibliographies WHERE deleted_at IS NULL');
    console.log('Active bibliographies:', r.rows[0].cnt);
    const r2 = await c.query('SELECT count(*) as cnt FROM items WHERE deleted_at IS NULL');
    console.log('Active items:', r2.rows[0].cnt);
  } finally { c.release(); await pool.end(); }
})()
