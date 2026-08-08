import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create the connection pool
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: process.env.DB_PASSWORD,
  database: 'caricloud_db',
  port: 3306,
  connectionLimit: 50 // Added to prevent HTTP 500 crashes during concurrent bursts
});

// Test the connection
const testConnection = async () => {
  try {
    const connection = await db.getConnection();
    console.log('Connected to local MySQL database successfully!');
    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error);
  }
};

testConnection();

// THIS IS THE CRITICAL LINE
export default db;