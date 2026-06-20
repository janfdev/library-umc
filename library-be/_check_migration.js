require('dotenv/config');
const {Pool} = require('pg');
const pool = new Pool({connectionString: process.env.DATABASE_URL});

(async()=>{
  const c = await pool.connect();
  try {
    const migs = await c.query('SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at');
    console.log('Migration rows:', migs.rows.length);
    migs.rows.forEach(r => console.log(`  ID:${r.id} Hash:${r.hash?.substring(0,25)}... Created:${r.created_at}`));
    
    // Check data invariants
    const bibs = await c.query('SELECT count(*) FROM bibliographies WHERE deleted_at IS NULL');
    const items = await c.query('SELECT count(*) FROM items WHERE deleted_at IS NULL');
    const authors = await c.query('SELECT count(*) FROM authors WHERE deleted_at IS NULL');
    console.log('\nData: bibs=' + bibs.rows[0].count + ' items=' + items.rows[0].count + ' authors=' + authors.rows[0].count);
  } finally { c.release(); await pool.end(); }
})()
