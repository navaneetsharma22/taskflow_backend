const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const { apiLimiter } = require("./middleware/rateLimiter");
const compression = require("compression");
const errorHandler = require("./middleware/error");

const app = express();

// Security & Optimization Middleware
app.use(helmet());
app.use(compression());

app.use(
  cors({
    origin: process.env.CLIENT_URL || false, // SEC-1: Reject if CLIENT_URL is undefined instead of wildcard
    credentials: true,
  }),
);

// Request Correlation ID (ARCH-3)
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader("X-Request-ID", req.id);
  next();
});

// Body Parsing with size limits (HIGH-1)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(cookieParser());

// Input Sanitization
app.use(mongoSanitize());

// Rate Limiting
app.use(apiLimiter);

// Health Check Endpoint (Production Readiness)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Test Route
app.get("/", (req, res) => {
  res.json({
    message: "TaskFlow SaaS API Running",
  });
});

// Mount Routes
app.use("/api/auth", require("./routes/auth/authRoutes"));
app.use("/api/tasks", require("./routes/task/taskRoutes"));
app.use("/api/projects", require("./routes/project/projectRoutes"));
app.use("/api/analytics", require("./routes/analytics/analyticsRoutes"));
app.use("/api/ai", require("./routes/ai/aiRoutes"));
app.use("/api/automations", require("./routes/automation/automationRoutes"));
app.use("/api/organization", require("./routes/organization.routes"));
app.use("/api/organizations", require("./routes/organization.routes"));
app.use("/api/users", require("./routes/user.routes"));

// Central Error Handler
app.use(errorHandler);

module.exports = app;
