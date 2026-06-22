require('dotenv/config');
const {Pool} = require('pg');
const pool = new Pool({connectionString: process.env.DATABASE_URL});

(async()=>{
  const c = await pool.connect();
  try {
    console.log('=== VELA DATA INVARIANTS ===\n');
    
    const checks = [
      ['bibliographies', "SELECT count(*) FROM bibliographies WHERE deleted_at IS NULL"],
      ['items', "SELECT count(*) FROM items WHERE deleted_at IS NULL"],
      ['authors', "SELECT count(*) FROM authors WHERE deleted_at IS NULL"],
      ['bibliography_authors', "SELECT count(*) FROM bibliography_authors"],
      ['Dkk authors', "SELECT count(*) FROM authors WHERE lower(name) = 'dkk'"],
      ['unlisted labels', "SELECT count(*) FROM bibliographies WHERE unlisted_authors_label IS NOT NULL AND deleted_at IS NULL"],
      ['items with QR', "SELECT count(*) FROM items WHERE qr_token IS NOT NULL AND deleted_at IS NULL"],
      ['stock mismatches', "SELECT count(*) FROM bibliographies b WHERE b.deleted_at IS NULL AND b.stock <> (SELECT count(*) FROM items i WHERE i.bibliography_id = b.id AND i.status='available' AND i.deleted_at IS NULL)"],
      ['duplicate item_code', "SELECT count(*) FROM (SELECT item_code FROM items GROUP BY item_code HAVING count(*) > 1) t"],
    ];
    
    for (const [name, q] of checks) {
      const r = await c.query(q);
      console.log(`  ${name}: ${r.rows[0].count || r.rows[0].count}`);
    }
    
    // Migration log
    console.log('\n=== MIGRATION LOG ===');
    const migs = await c.query('SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at');
    console.log('Rows:', migs.rows.length);
    migs.rows.forEach(r => console.log(`  ID:${r.id} Hash:${r.hash?.substring(0,25)}... Created:${r.created_at}`));
    
    // Table count
    const tbls = await c.query("SELECT count(*) FROM information_schema.tables WHERE table_schema='public'");
    console.log('\nTables:', tbls.rows[0].count);
    
    // Enum values for import_batch_status
    const enums = await c.query("SELECT e.enumlabel FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid WHERE t.typname='import_batch_status' ORDER BY e.enumsortorder");
    console.log('\nimport_batch_status:', enums.rows.map(r => r.enumlabel));
    
  } finally { c.release(); await pool.end(); }
})()
