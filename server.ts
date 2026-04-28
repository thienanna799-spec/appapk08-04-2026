import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import db, { initDatabase } from "./db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Initialize database and tables
  await initDatabase();

  const app = express();
  const PORT = Number(process.env.PORT) || 5000;

  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json({ limit: '50mb' }));

  // Request logger (skip noisy socket.io)
  app.use((req: any, res: any, next: any) => {
    if (!req.url.includes('socket.io')) {
      console.log(`📥 ${req.method} ${req.url}`);
    }
    next();
  });

  // Simple auth middleware — extracts user info from Authorization header
  // Accepts Firebase ID tokens (decoded by the frontend) or simple Bearer tokens
  const authenticateToken = async (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token required' });
    }

    try {
      // Decode Firebase ID token (JWT) to extract user info
      // This is a simplified decode — for production, use firebase-admin to verify
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      req.user = {
        uid: payload.user_id || payload.sub,
        email: payload.email,
        name: payload.name,
      };
      next();
    } catch (err) {
      console.error('Token decode error:', err);
      return res.status(403).json({ message: 'Invalid token' });
    }
  };

  // ==================== HEALTH CHECK ====================
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ==================== AUTH ====================
  app.post("/api/auth/verify", authenticateToken, async (req: any, res) => {
    try {
      const { uid, email, name } = req.user;
      const photoURL = req.body.photoURL || null;

      // Upsert user + update last_login
      await db.execute(
        `INSERT INTO users (id, email, name, photoURL, role, isActive, last_login) 
         VALUES (?, ?, ?, ?, 'driver', true, NOW())
         ON DUPLICATE KEY UPDATE name = VALUES(name), photoURL = VALUES(photoURL), last_login = NOW(), updatedAt = NOW()`,
        [uid, email, name, photoURL]
      );

      const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [uid]);
      res.json({ status: "ok", user: (rows as any[])[0] });
    } catch (error) {
      console.error('Auth verify error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // ==================== PROFILE ====================
  app.get("/api/me", authenticateToken, async (req: any, res) => {
    try {
      const { uid, email, name } = req.user;
      let [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [uid]);
      let users = rows as any[];
      
      // Auto-create user if not found (first-time login)
      if (users.length === 0) {
        await db.execute(
          `INSERT INTO users (id, email, name, role, status, isActive, last_login) 
           VALUES (?, ?, ?, 'driver', 'active', true, NOW())`,
          [uid, email, name]
        );
        [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [uid]);
        users = rows as any[];
      }
      
      res.json(users[0]);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.put("/api/me", authenticateToken, async (req: any, res) => {
    try {
      const uid = req.user.uid;
      // Only allow updating these fields — do NOT trust frontend for role/email/id
      const { phone, vehicle_type, license_plate, working_area } = req.body;

      await db.execute(
        `UPDATE users SET phone = ?, vehicle_type = ?, license_plate = ?, working_area = ?, updatedAt = NOW() WHERE id = ?`,
        [phone || null, vehicle_type || null, license_plate || null, working_area || null, uid]
      );

      const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [uid]);
      res.json({ status: "ok", user: (rows as any[])[0] });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // ==================== DASHBOARD ====================
  app.get("/api/driver/dashboard", authenticateToken, async (req: any, res) => {
    try {
      const driverId = req.user.uid;

      // Today's orders count
      const [orderCount] = await db.execute(
        `SELECT COUNT(*) as count FROM orders WHERE (driverId = ? OR status = 'pending') AND DATE(createdAt) = CURDATE()`,
        [driverId]
      );

      // Total KM from sessions
      const [kmTotal] = await db.execute(
        `SELECT COALESCE(SUM(endKm - startKm), 0) as totalKm FROM sessions WHERE driverId = ? AND checkOutTime IS NOT NULL`,
        [driverId]
      );

      // Today's fuel cost
      const [fuelTotal] = await db.execute(
        `SELECT COALESCE(SUM(amount), 0) as totalFuel FROM fuel_logs WHERE driverId = ? AND DATE(createdAt) = CURDATE()`,
        [driverId]
      );

      // Active session
      const [activeSessions] = await db.execute(
        `SELECT * FROM sessions WHERE driverId = ? AND checkOutTime IS NULL LIMIT 1`,
        [driverId]
      );

      res.json({
        orderCount: (orderCount as any[])[0].count,
        totalKm: (kmTotal as any[])[0].totalKm,
        totalFuel: (fuelTotal as any[])[0].totalFuel,
        isWorking: (activeSessions as any[]).length > 0,
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // ==================== ORDERS ====================
  app.get("/api/driver/orders", authenticateToken, async (req: any, res) => {
    try {
      const driverId = req.user.uid;
      const [rows] = await db.execute(
        `SELECT * FROM orders WHERE status = 'pending' OR driverId = ? ORDER BY createdAt DESC`,
        [driverId]
      );
      res.json(rows);
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post("/api/driver/orders/:id/start", authenticateToken, async (req: any, res) => {
    try {
      const orderId = req.params.id;
      const driverId = req.user.uid;
      const { lat, lng } = req.body;

      await db.execute(
        `UPDATE orders SET status = 'shipping', driverId = ?, pickupLat = ?, pickupLng = ?, startTime = NOW(), updatedAt = NOW() WHERE id = ?`,
        [driverId, lat, lng, orderId]
      );
      res.json({ status: "ok" });
    } catch (error) {
      console.error('Start order error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post("/api/driver/orders/:id/complete", authenticateToken, async (req: any, res) => {
    try {
      const orderId = req.params.id;
      const { lat, lng } = req.body;

      await db.execute(
        `UPDATE orders SET status = 'completed', deliveryLat = ?, deliveryLng = ?, completeTime = NOW(), updatedAt = NOW() WHERE id = ?`,
        [lat, lng, orderId]
      );
      res.json({ status: "ok" });
    } catch (error) {
      console.error('Complete order error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // ==================== SESSIONS ====================
  app.get("/api/driver/sessions/active", authenticateToken, async (req: any, res) => {
    try {
      const driverId = req.user.uid;
      const [rows] = await db.execute(
        `SELECT * FROM sessions WHERE driverId = ? AND checkOutTime IS NULL LIMIT 1`,
        [driverId]
      );
      const sessions = rows as any[];
      res.json(sessions.length > 0 ? sessions[0] : null);
    } catch (error) {
      console.error('Active session error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post("/api/driver/sessions/check-in", authenticateToken, async (req: any, res) => {
    try {
      const driverId = req.user.uid;
      const { startKm, lat, lng } = req.body;

      const [result] = await db.execute(
        `INSERT INTO sessions (driverId, startKm, startLat, startLng) VALUES (?, ?, ?, ?)`,
        [driverId, startKm, lat, lng]
      );
      
      const insertId = (result as any).insertId;
      const [rows] = await db.execute('SELECT * FROM sessions WHERE id = ?', [insertId]);
      res.json({ status: "ok", session: (rows as any[])[0] });
    } catch (error) {
      console.error('Check-in error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post("/api/driver/sessions/check-out", authenticateToken, async (req: any, res) => {
    try {
      const { sessionId, endKm, lat, lng } = req.body;

      await db.execute(
        `UPDATE sessions SET endKm = ?, endLat = ?, endLng = ?, checkOutTime = NOW() WHERE id = ?`,
        [endKm, lat, lng, sessionId]
      );
      res.json({ status: "ok", message: "Kết thúc ca làm thành công" });
    } catch (error) {
      console.error('Check-out error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // ==================== FUEL ====================
  app.get("/api/driver/fuel", authenticateToken, async (req: any, res) => {
    try {
      const driverId = req.user.uid;
      const [rows] = await db.execute(
        `SELECT * FROM fuel_logs WHERE driverId = ? ORDER BY createdAt DESC LIMIT 50`,
        [driverId]
      );
      res.json(rows);
    } catch (error) {
      console.error('Get fuel logs error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post("/api/driver/fuel", authenticateToken, async (req: any, res) => {
    try {
      const driverId = req.user.uid;
      const { amount, lat, lng } = req.body;

      await db.execute(
        `INSERT INTO fuel_logs (driverId, amount, lat, lng) VALUES (?, ?, ?, ?)`,
        [driverId, amount, lat, lng]
      );
      res.json({ status: "ok" });
    } catch (error) {
      console.error('Fuel log error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // ==================== GPS ====================
  app.get("/api/driver/gps/history", authenticateToken, async (req: any, res) => {
    try {
      const driverId = req.user.uid;
      const [rows] = await db.execute(
        `SELECT * FROM gps_logs WHERE driverId = ? ORDER BY createdAt DESC LIMIT 100`,
        [driverId]
      );
      res.json(rows);
    } catch (error) {
      console.error('Get GPS logs error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post("/api/driver/gps", authenticateToken, async (req: any, res) => {
    try {
      const driverId = req.user.uid;
      const { lat, lng, isWorking } = req.body;

      await db.execute(
        `INSERT INTO gps_logs (driverId, lat, lng, isWorking) VALUES (?, ?, ?, ?)`,
        [driverId, lat, lng, isWorking ?? true]
      );
      res.json({ status: "ok" });
    } catch (error) {
      console.error('GPS log error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // ==================== SESSIONS HISTORY ====================
  app.get("/api/driver/sessions", authenticateToken, async (req: any, res) => {
    try {
      const driverId = req.user.uid;
      const [rows] = await db.execute(
        `SELECT * FROM sessions WHERE driverId = ? ORDER BY checkInTime DESC LIMIT 30`,
        [driverId]
      );
      res.json(rows);
    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // ==================== STATIC FILES (Production) ====================
  if (process.env.NODE_ENV === "production") {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 DriverGo API running on http://localhost:${PORT}`);
    console.log(`📡 Endpoints: /api/health, /api/driver/*`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
