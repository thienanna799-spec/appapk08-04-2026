import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'drivergo',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Auto-create database and tables on startup
export async function initDatabase() {
  // First connect without database to create it if needed
  const tempPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: 2,
  });

  const dbName = process.env.DB_NAME || 'drivergo';

  try {
    await tempPool.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${dbName}' ready`);
  } finally {
    await tempPool.end();
  }

  // Now create tables in the database
  const conn = await pool.getConnection();
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(128) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        phone VARCHAR(20),
        photoURL TEXT,
        role ENUM('super_admin','admin','staff','driver') DEFAULT 'driver',
        status ENUM('active','inactive') DEFAULT 'active',
        isActive BOOLEAN DEFAULT true,
        vehicle_type VARCHAR(50),
        license_plate VARCHAR(20),
        working_area VARCHAR(255),
        last_login TIMESTAMP NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(64) PRIMARY KEY,
        customerName VARCHAR(255),
        customerPhone VARCHAR(50),
        address TEXT,
        quantity INT DEFAULT 1,
        deadline VARCHAR(20),
        notes TEXT,
        status ENUM('pending','shipping','completed','cancelled') DEFAULT 'pending',
        driverId VARCHAR(128),
        pickupLat DOUBLE,
        pickupLng DOUBLE,
        deliveryLat DOUBLE,
        deliveryLng DOUBLE,
        startTime TIMESTAMP NULL,
        completeTime TIMESTAMP NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_driver (driverId)
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        driverId VARCHAR(128) NOT NULL,
        startKm DOUBLE,
        endKm DOUBLE,
        startLat DOUBLE,
        startLng DOUBLE,
        endLat DOUBLE,
        endLng DOUBLE,
        checkInTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        checkOutTime TIMESTAMP NULL,
        INDEX idx_driver (driverId),
        INDEX idx_active (driverId, checkOutTime)
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS fuel_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        driverId VARCHAR(128) NOT NULL,
        amount DOUBLE NOT NULL,
        lat DOUBLE,
        lng DOUBLE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_driver (driverId)
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS gps_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        driverId VARCHAR(128) NOT NULL,
        lat DOUBLE NOT NULL,
        lng DOUBLE NOT NULL,
        isWorking BOOLEAN DEFAULT true,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_driver (driverId),
        INDEX idx_time (createdAt)
      )
    `);

    console.log('✅ All tables ready');

    // Migrate: add profile columns to existing users table (safe to re-run)
    const profileColumns = [
      { name: 'phone', def: 'VARCHAR(20) AFTER name' },
      { name: 'status', def: "ENUM('active','inactive') DEFAULT 'active' AFTER role" },
      { name: 'vehicle_type', def: 'VARCHAR(50) AFTER isActive' },
      { name: 'license_plate', def: 'VARCHAR(20) AFTER vehicle_type' },
      { name: 'working_area', def: 'VARCHAR(255) AFTER license_plate' },
      { name: 'last_login', def: 'TIMESTAMP NULL AFTER working_area' },
    ];
    for (const col of profileColumns) {
      try {
        await conn.execute(`ALTER TABLE users ADD COLUMN ${col.name} ${col.def}`);
        console.log(`  ✅ Added column users.${col.name}`);
      } catch (e: any) {
        // Column already exists — ignore (error code 1060)
        if (e.code !== 'ER_DUP_FIELDNAME') {
          console.warn(`  ⚠️ Could not add users.${col.name}:`, e.message);
        }
      }
    }
  } finally {
    conn.release();
  }

  // Seed sample orders if table is empty
  const [rows] = await pool.execute('SELECT COUNT(*) as count FROM orders');
  if ((rows as any)[0].count === 0) {
    await pool.execute(`
      INSERT INTO orders (id, customerName, customerPhone, address, quantity, deadline, notes, status) VALUES
      ('ORD001', 'Nguyễn Văn A', '0901234567', '123 Lê Lợi, Quận 1, HCM', 2, '16:00', 'Giao giờ hành chính', 'pending'),
      ('ORD002', 'Trần Thị B', '0912345678', '456 Nguyễn Huệ, Quận 1, HCM', 1, '17:30', 'Gọi trước khi đến', 'pending'),
      ('ORD003', 'Lê Văn C', '0923456789', '789 Cách Mạng Tháng 8, Quận 3, HCM', 5, '15:00', 'Hàng dễ vỡ', 'pending')
    `);
    console.log('✅ Sample orders seeded');
  }
}

export default pool;
