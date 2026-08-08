import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function init() {
  try {
    const conn = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      port: 3306
    });
    console.log('Connected to MySQL root without password.');
    await conn.query("ALTER USER 'root'@'localhost' IDENTIFIED BY '11242003Ezekiel';");
    console.log('Updated root password to 11242003Ezekiel');
    await conn.end();
  } catch (err) {
    console.log('Note on password setting:', err.message);
  }

  const db = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: process.env.DB_PASSWORD || '11242003Ezekiel',
    port: 3306
  });

  await db.query('CREATE DATABASE IF NOT EXISTS caricloud_db;');
  await db.query('USE caricloud_db;');

  console.log('Creating tables in caricloud_db...');

  await db.query(`
    CREATE TABLE IF NOT EXISTS user (
      user_id INT AUTO_INCREMENT PRIMARY KEY,
      parent_owner_id INT DEFAULT NULL,
      username VARCHAR(100) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      user_role ENUM('ADMIN', 'CASHIER') NOT NULL DEFAULT 'CASHIER',
      subscription_tier ENUM('TIER_1', 'TIER_2', 'TIER_3') NOT NULL DEFAULT 'TIER_1',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS product (
      product_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL DEFAULT 'Ulam',
      price_full DECIMAL(10,2) NOT NULL,
      price_half DECIMAL(10,2) DEFAULT NULL,
      isSoldOut TINYINT(1) DEFAULT 0,
      isAvailable TINYINT(1) DEFAULT 1,
      description TEXT DEFAULT NULL,
      image TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS order_session (
      session_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      session_status VARCHAR(50) DEFAULT 'Closed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS transaction (
      trans_id INT AUTO_INCREMENT PRIMARY KEY,
      session_id INT NOT NULL,
      receipt_no VARCHAR(100) DEFAULT NULL,
      product_id INT DEFAULT NULL,
      quantity INT NOT NULL DEFAULT 1,
      portion_size VARCHAR(50) DEFAULT 'Full',
      transaction_subtotal DECIMAL(10,2) NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      vat_exempt DECIMAL(10,2) DEFAULT 0.00,
      discount_amount DECIMAL(10,2) DEFAULT 0.00,
      payment_mode VARCHAR(50) NOT NULL DEFAULT 'CASH',
      tendered_amount DECIMAL(10,2) DEFAULT 0.00,
      change_amount DECIMAL(10,2) DEFAULT 0.00,
      customer_id VARCHAR(100) DEFAULT NULL,
      customer_name VARCHAR(255) DEFAULT NULL,
      paymongo_ref VARCHAR(255) DEFAULT NULL,
      cashier_name VARCHAR(100) DEFAULT NULL,
      line_items JSON DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES order_session(session_id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE SET NULL
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS tax_relief_bplo_tracker (
      tracker_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      current_annual_gross DECIMAL(12,2) DEFAULT 0.00,
      statutory_threshold DECIMAL(12,2) DEFAULT 250000.00,
      bplo_form_format VARCHAR(100) DEFAULT 'ANNUAL_GROSS_SWORN_V1',
      registration_year INT DEFAULT 2026,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
    );
  `);

  // Insert default user ID 1 if not present
  const [users] = await db.query('SELECT * FROM user WHERE user_id = 1');
  if (users.length === 0) {
    await db.query(`
      INSERT INTO user (user_id, username, password_hash, user_role, subscription_tier)
      VALUES (1, 'default_owner', 'hash', 'ADMIN', 'TIER_1');
    `);
    console.log('Created default user with ID 1');
  }

  // Insert sample product items if none exist for user 1
  const [prods] = await db.query('SELECT * FROM product WHERE user_id = 1');
  if (prods.length === 0) {
    await db.query(`
      INSERT INTO product (user_id, name, category, price_full, price_half, isSoldOut, isAvailable, description, image) VALUES
      (1, 'Chicken Adobo', 'Ulam', 80.00, 45.00, 0, 1, 'Classic savoury stewed chicken', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'),
      (1, 'Pork Sinigang', 'Ulam', 90.00, 50.00, 0, 1, 'Sour tamarind soup broth', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=400&q=80'),
      (1, 'Steamed Rice', 'Rice', 15.00, NULL, 0, 1, 'Freshly cooked white rice', 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=400&q=80'),
      (1, 'Iced Tea', 'Drinks', 25.00, NULL, 0, 1, 'Refreshing chilled lemon iced tea', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80');
    `);
    console.log('Created sample product items for user 1');
  }

  console.log('Database and tables initialized successfully!');
  await db.end();
}

init();
