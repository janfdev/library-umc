require('dotenv/config');
const {Pool} = require('pg');
const pool = new Pool({connectionString: process.env.DATABASE_URL});

(async()=>{
  const c = await pool.connect();
  try {
    // Create a separate schema for clean-room testing
    await c.query('DROP SCHEMA IF EXISTS cleanroom CASCADE');
    await c.query('CREATE SCHEMA cleanroom');
    console.log('Created cleanroom schema');
    
    // Verify it's empty
    const r = await c.query("SELECT count(*) FROM information_schema.tables WHERE table_schema='cleanroom'");
    console.log('Tables in cleanroom:', r.rows[0].count);
    
    console.log('\nClean-room environment ready.');
    console.log('NOTE: Using Vela database with separate schema for clean-room test.');
    console.log('This is not a true isolated database, but verifies migration SQL.');
  } finally { c.release(); await pool.end(); }
})()
