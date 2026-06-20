require('dotenv/config');
const {Pool} = require('pg');
const pool = new Pool({connectionString: process.env.DATABASE_URL});

(async()=>{
  const c = await pool.connect();
  try {
    const r = await c.query("SELECT e.enumlabel FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid WHERE t.typname='import_row_status' ORDER BY e.enumsortorder");
    console.log('import_row_status values:', r.rows.map(r => r.enumlabel));
  } finally { c.release(); await pool.end(); }
})()
