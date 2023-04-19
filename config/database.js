const { Pool } = require('pg');

// Create a new connection pool
const pool = new Pool({
    user: process.env.DB_USER, // Your database user
    password: process.env.DB_PASS, // Your database password
    host: process.env.DB_HOST, // Your database host
    port: process.env.DB_PORT, // Your database port
    database: process.env.POSTGRES_DB // Your database name
});

// Test the connection by connecting to the database and logging the result
pool.connect((err, client, done) => {
    if (err) {
        console.error('Error connecting to database:', err.stack);
    } else {
        console.log('Successfully connected to database');
    }
});

// Export the connection pool so it can be used by other parts of your application
module.exports = pool;
