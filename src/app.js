const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const xssClean = require("xss-clean");
const rateLimit = require("express-rate-limit");
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
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(limiter);

// Test Route
app.get("/", (req, res) => {
  res.json({
    message: "TaskFlow SaaS API Running",
  });
});

// Central Error Handler
app.use(errorHandler);

module.exports = app;


