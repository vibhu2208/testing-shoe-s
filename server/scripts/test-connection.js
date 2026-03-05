const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
      require: true,
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('🔗 Attempting to connect to AWS RDS PostgreSQL...');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`Port: ${process.env.DB_PORT}`);
    console.log(`Database: ${process.env.DB_NAME}`);
    console.log(`User: ${process.env.DB_USER}`);
    
    await client.connect();
    console.log('✅ Connection successful!');
    
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL Version:', result.rows[0].version);
    
    await client.end();
    console.log('✅ Connection test completed successfully');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error details:', {
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      address: error.address,
      port: error.port
    });
  }
}

testConnection();
