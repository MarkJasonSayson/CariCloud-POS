import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function runAudit() {
  console.log('=== STARTING MYSQL DATABASE INTEGRITY AUDIT ===');
  
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: process.env.DB_PASSWORD || '11242003Ezekiel',
    database: 'caricloud_db',
    port: 3306
  });

  const connection = await pool.getConnection();

  try {
    // -------------------------------------------------------------
    // TEST 1: MULTI-TENANT ISOLATION AUDIT
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Multi-Tenant Isolation Verification ---');
    
    // Create Owner 1 & Owner 2
    const [owner1Res]: any = await connection.execute(
      'INSERT INTO user (username, password_hash, user_role, subscription_tier) VALUES (?, ?, ?, ?)',
      ['owner_tenant_1', 'hash1', 'ADMIN', 'TIER_1']
    );
    const owner1Id = owner1Res.insertId;

    const [owner2Res]: any = await connection.execute(
      'INSERT INTO user (username, password_hash, user_role, subscription_tier) VALUES (?, ?, ?, ?)',
      ['owner_tenant_2', 'hash2', 'ADMIN', 'TIER_2']
    );
    const owner2Id = owner2Res.insertId;

    // Create Staff user under Owner 1
    const [staff1Res]: any = await connection.execute(
      'INSERT INTO user (parent_owner_id, username, password_hash, user_role, subscription_tier) VALUES (?, ?, ?, ?, ?)',
      [owner1Id, 'staff_tenant_1', 'hash_staff', 'CASHIER', 'TIER_1']
    );
    const staff1Id = staff1Res.insertId;

    // Insert Product for Owner 1 and Product for Owner 2
    const [prod1Res]: any = await connection.execute(
      'INSERT INTO product (user_id, name, category, price_full, price_half, isSoldOut, isAvailable) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [owner1Id, 'Adobo Owner 1', 'Ulam', 120.00, 65.00, 0, 1]
    );
    const prod1Id = prod1Res.insertId;

    const [prod2Res]: any = await connection.execute(
      'INSERT INTO product (user_id, name, category, price_full, price_half, isSoldOut, isAvailable) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [owner2Id, 'Sinigang Owner 2', 'Ulam', 150.00, 80.00, 0, 1]
    );
    const prod2Id = prod2Res.insertId;

    // Create Order Sessions
    const [sess1Res]: any = await connection.execute(
      'INSERT INTO order_session (user_id, session_status) VALUES (?, ?)',
      [staff1Id, 'Closed']
    );
    const sess1Id = sess1Res.insertId;

    const [sess2Res]: any = await connection.execute(
      'INSERT INTO order_session (user_id, session_status) VALUES (?, ?)',
      [owner2Id, 'Open']
    );
    const sess2Id = sess2Res.insertId;

    // Check if staff1 querying product table receives Owner 2's products
    // Currently, server.ts does SELECT * FROM product WHERE isAvailable = 1 without user filtering
    const [allProducts]: any = await connection.execute('SELECT * FROM product WHERE isAvailable = 1');
    console.log(`[Multi-Tenant Query Test] Total products returned without tenant filter: ${allProducts.length}`);
    const containsTenant2Product = allProducts.some((p: any) => p.product_id === prod2Id);
    
    console.log(`[Multi-Tenant Violation Check]: Can Staff 1 (Owner 1) retrieve Owner 2 Product (${prod2Id})? ${containsTenant2Product ? 'YES (SECURITY VIOLATION DETECTED)' : 'NO'}`);

    // Check if staff1 can mutate product of Owner 2
    let mutationAllowed = false;
    try {
      const [updateRes]: any = await connection.execute(
        'UPDATE product SET price_full = ? WHERE product_id = ?',
        [999.00, prod2Id]
      );
      if (updateRes.affectedRows > 0) {
        mutationAllowed = true;
      }
    } catch (err: any) {
      console.error(err.message);
    }
    console.log(`[Multi-Tenant Mutation Check]: Can Staff 1 mutate Owner 2 Product (${prod2Id})? ${mutationAllowed ? 'YES (UNRESTRICTED MUTATION DETECTED)' : 'NO'}`);

    // -------------------------------------------------------------
    // TEST 2: CASCADE VERIFICATION AUDIT
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Cascade Verification (ON DELETE CASCADE) ---');

    // Create Owner 3 for CASCADE test
    const [owner3Res]: any = await connection.execute(
      'INSERT INTO user (username, password_hash, user_role, subscription_tier) VALUES (?, ?, ?, ?)',
      ['owner_cascade_test', 'hash3', 'ADMIN', 'TIER_1']
    );
    const owner3Id = owner3Res.insertId;

    // Create Product for Owner 3
    const [prod3Res]: any = await connection.execute(
      'INSERT INTO product (user_id, name, category, price_full, price_half, isSoldOut, isAvailable) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [owner3Id, 'Caldereta Cascade Test', 'Ulam', 180.00, 95.00, 0, 1]
    );
    const prod3Id = prod3Res.insertId;

    // Create Tax Relief Tracker for Owner 3
    const [tax3Res]: any = await connection.execute(
      'INSERT INTO tax_relief_bplo_tracker (user_id, current_annual_gross, statutory_threshold, bplo_form_format, registration_year) VALUES (?, ?, ?, ?, ?)',
      [owner3Id, 50000.00, 250000.00, 'ANNUAL_GROSS_SWORN_V1', 2026]
    );
    const tax3Id = tax3Res.insertId;

    // Create Order Session for Owner 3
    const [sess3Res]: any = await connection.execute(
      'INSERT INTO order_session (user_id, session_status) VALUES (?, ?)',
      [owner3Id, 'Closed']
    );
    const sess3Id = sess3Res.insertId;

    // Create Transaction referencing session 3 and product 3
    const [trans3Res]: any = await connection.execute(
      'INSERT INTO transaction (session_id, product_id, quantity, portion_size, transaction_subtotal, payment_mode) VALUES (?, ?, ?, ?, ?, ?)',
      [sess3Id, prod3Id, 2, 'Full', 360.00, 'CASH']
    );
    const trans3Id = trans3Res.insertId;

    console.log(`Created test records -> Owner ID: ${owner3Id}, Product ID: ${prod3Id}, Tax Tracker ID: ${tax3Id}, Session ID: ${sess3Id}, Transaction ID: ${trans3Id}`);

    // Attempt to DELETE Owner 3
    let deleteUserSuccess = false;
    let deleteUserErrorTrace = '';

    try {
      console.log(`Executing DELETE FROM user WHERE user_id = ${owner3Id}...`);
      await connection.execute('DELETE FROM user WHERE user_id = ?', [owner3Id]);
      deleteUserSuccess = true;
      console.log('DELETE query executed successfully.');
    } catch (err: any) {
      deleteUserErrorTrace = err.stack || err.message;
      console.error('DELETE query FAILED with error:\n', deleteUserErrorTrace);
    }

    if (deleteUserSuccess) {
      const [prodCheck]: any = await connection.execute('SELECT * FROM product WHERE product_id = ?', [prod3Id]);
      const [taxCheck]: any = await connection.execute('SELECT * FROM tax_relief_bplo_tracker WHERE tracker_id = ?', [tax3Id]);
      const [transCheck]: any = await connection.execute('SELECT * FROM transaction WHERE trans_id = ?', [trans3Id]);

      console.log(`Rows remaining in product: ${prodCheck.length}`);
      console.log(`Rows remaining in tax_relief_bplo_tracker: ${taxCheck.length}`);
      console.log(`Rows remaining in transaction: ${transCheck.length}`);
    }

    // -------------------------------------------------------------
    // TEST 3: TIMESTAMP ACCURACY AUDIT
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Timestamp Accuracy Verification ---');

    const nodeJsServerTimeBefore = new Date();
    
    // Insert test transaction
    const [tsTransRes]: any = await connection.execute(
      'INSERT INTO transaction (session_id, product_id, quantity, portion_size, transaction_subtotal, payment_mode) VALUES (?, ?, ?, ?, ?, ?)',
      [sess1Id, prod1Id, 1, 'Full', 120.00, 'CASH']
    );
    const tsTransId = tsTransRes.insertId;

    const [insertedTransRows]: any = await connection.execute(
      'SELECT trans_id, created_at, NOW() as current_mysql_time, @@system_time_zone, @@time_zone FROM transaction WHERE trans_id = ?',
      [tsTransId]
    );

    const row = insertedTransRows[0];
    const mysqlCreatedAt = new Date(row.created_at);

    console.log(`Node.js Server Time (Local): ${nodeJsServerTimeBefore.toString()}`);
    console.log(`Node.js Server Time (ISO): ${nodeJsServerTimeBefore.toISOString()}`);
    console.log(`MySQL inserted created_at raw string: ${row.created_at}`);
    console.log(`MySQL inserted created_at parsed ISO: ${mysqlCreatedAt.toISOString()}`);
    console.log(`MySQL current NOW(): ${row.current_mysql_time}`);
    console.log(`MySQL system_time_zone: ${row['@@system_time_zone']}, time_zone: ${row['@@time_zone']}`);

    const timeDiffMs = Math.abs(mysqlCreatedAt.getTime() - nodeJsServerTimeBefore.getTime());
    console.log(`Time Difference between Node Server time and DB created_at: ${timeDiffMs} ms (${(timeDiffMs / 1000 / 3600).toFixed(2)} hours)`);

    // Clean up created test users
    console.log('\n--- CLEANUP ---');
    try {
      await connection.execute('DELETE FROM transaction WHERE trans_id IN (?, ?)', [trans3Id, tsTransId]);
      await connection.execute('DELETE FROM order_session WHERE session_id IN (?, ?, ?)', [sess1Id, sess2Id, sess3Id]);
      await connection.execute('DELETE FROM product WHERE product_id IN (?, ?, ?)', [prod1Id, prod2Id, prod3Id]);
      await connection.execute('DELETE FROM tax_relief_bplo_tracker WHERE tracker_id = ?', [tax3Id]);
      await connection.execute('DELETE FROM user WHERE user_id IN (?, ?, ?)', [owner1Id, owner2Id, owner3Id]);
      console.log('Cleanup completed successfully.');
    } catch (err: any) {
      console.warn('Cleanup note:', err.message);
    }

  } catch (globalErr: any) {
    console.error('Global audit error:', globalErr);
  } finally {
    connection.release();
    await pool.end();
    console.log('=== AUDIT COMPLETED ===');
  }
}

runAudit();
