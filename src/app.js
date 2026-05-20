const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const xssClean = require("xss-clean");
const { apiLimiter } = require("./middleware/rateLimiter");
const compression = require("compression");
const errorHandler = require("./middleware/error");

const app = express();

// Security & Optimization Middleware
app.use(helmet());
app.use(compression());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use(mongoSanitize());
app.use(xssClean());

// Rate Limiting
app.use(apiLimiter);

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

// Central Error Handler
app.use(errorHandler);

module.exports = app;


