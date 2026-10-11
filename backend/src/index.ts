import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import leadRoutes from "./routes/leadRoutes";
import { initDatabase, isMongoConnected } from "./services/db";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// API Documentation & Discovery route
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Smart Lead Dashboard CRM REST API",
    version: "2.0.0",
    healthCheck: "/api/health",
    endpoints: {
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        me: "GET /api/auth/me",
      },
      leads: {
        list: "GET /api/leads?status=&source=&search=&page=&limit=&sortBy=&sortOrder=",
        getById: "GET /api/leads/:id",
        create: "POST /api/leads",
        update: "PUT /api/leads/:id",
        delete: "DELETE /api/leads/:id (Admin only)",
        addNote: "POST /api/leads/:id/notes",
        analytics: "GET /api/leads/analytics",
        importCSV: "POST /api/leads/import",
        bulkDelete: "POST /api/leads/bulk-delete (Admin only)",
        bulkUpdate: "POST /api/leads/bulk-update",
      },
    },
  });
});

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "healthy",
    environment: process.env.NODE_ENV || "development",
    database: isMongoConnected ? "MongoDB Atlas (Live)" : "Resilient High-Performance Store (Active)",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/leads", leadRoutes);

// 404 Catch-all handler
app.use(notFoundHandler);

// Centralized Global Error Handler
app.use(errorHandler);

// Start Server and Database initialization
async function startServer() {
  await initDatabase();

  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 Smart Lead Dashboard CRM Server`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🩺 Health: http://localhost:${PORT}/api/health`);
    console.log(`=========================================`);
  });
}

startServer().catch((err) => {
  console.error("Fatal Server Startup Error:", err);
});