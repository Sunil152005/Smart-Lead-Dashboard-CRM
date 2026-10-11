"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const leadRoutes_1 = __importDefault(require("./routes/leadRoutes"));
const db_1 = require("./services/db");
const errorHandler_1 = require("./middlewares/errorHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
}));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
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
        database: db_1.isMongoConnected ? "MongoDB Atlas (Live)" : "Resilient High-Performance Store (Active)",
        timestamp: new Date().toISOString(),
    });
});
// API Routes
app.use("/api/auth", authRoutes_1.default);
app.use("/api/leads", leadRoutes_1.default);
// 404 Catch-all handler
app.use(errorHandler_1.notFoundHandler);
// Centralized Global Error Handler
app.use(errorHandler_1.errorHandler);
// Start Server and Database initialization
async function startServer() {
    await (0, db_1.initDatabase)();
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
