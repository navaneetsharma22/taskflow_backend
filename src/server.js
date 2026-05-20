require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

// Connect to Database
connectDB();

const { initSocket } = require("./sockets/socketServer");

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
});

// Initialize real-time Socket.IO server
initSocket(server);

const { initScheduler } = require("./jobs/scheduler");

// Initialize and start automation scheduler
initScheduler();

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
