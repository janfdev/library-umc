const {Pool} = require('pg');

// Try common local PostgreSQL connection patterns
const attempts = [
  { user: 'postgres', password: '', database: 'postgres' },
  { user: 'postgres', password: 'postgres', database: 'postgres' },
  { user: 'postgres', password: 'admin', database: 'postgres' },
];

(async()=>{
  for (const cfg of attempts) {
    try {
      const pool = new Pool({ host: 'localhost', port: 5432, ...cfg, connectionTimeoutMillis: 3000 });
      const c = await pool.connect();
      const r = await c.query('SELECT current_user, version()');
      console.log('Connected:', r.rows[0].current_user);
      console.log('Version:', r.rows[0].version.substring(0, 60));
      
      // Create cleanroom database
      await c.query('DROP DATABASE IF EXISTS mucilib_cleanroom');
      await c.query('CREATE DATABASE mucilib_cleanroom');
      console.log('Created mucilib_cleanroom');
      
      c.release();
      await pool.end();
      process.exit(0);
    } catch(e) {
      // Try next
    }
  }
  console.log('Could not connect to local PostgreSQL');
  process.exit(1);
})();
