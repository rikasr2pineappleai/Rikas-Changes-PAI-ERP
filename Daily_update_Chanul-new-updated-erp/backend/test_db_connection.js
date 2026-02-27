const mysql = require('mysql2');

// Database configuration from environment variables
const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'pai_erp_qa'
});

console.log('Attempting to connect to database...');
console.log('Host:', process.env.DB_HOST || 'localhost');
console.log('Port:', process.env.DB_PORT || 3306);
console.log('User:', process.env.DB_USER || 'root');
console.log('Database:', process.env.DB_NAME || 'pai_erp_qa');

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL database successfully!');
  connection.end();
});