const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

let io = null;
// In-memory presence tracker: organizationId -> Map(userId -> { socketId, name, role })
const activeUsers = new Map();

/**
 * Initialize Socket.IO server
 */
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  // Authentication Middleware for Socket.IO Connection Handshake
  io.use(async (socket, next) => {
    try {
      // Get token from handshake auth, query, or headers
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication error. Token is missing."));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Fetch user to confirm active state
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) {
        return next(new Error("Authentication error. User is suspended or does not exist."));
      }

      // Attach user details directly to socket
      socket.user = {
        id: user._id.toString(),
        name: user.name,
        role: user.role,
        organizationId: user.organizationId.toString(),
      };

      next();
    } catch (error) {
      console.error("Socket Auth Error:", error.message);
      return next(new Error("Authentication error. Invalid or expired token."));
    }
  });

  // Socket Connection Listener
  io.on("connection", (socket) => {
    const { id: userId, name, role, organizationId } = socket.user;
    
    // 1. Join Organization Room (bulletproof multi-tenant isolation)
    socket.join(organizationId);
    console.log(`User ${name} connected to socket. Joined org room: ${organizationId}`);

    // 2. Presence System: Register User online
    if (!activeUsers.has(organizationId)) {
      activeUsers.set(organizationId, new Map());
    }
    const orgUsers = activeUsers.get(organizationId);
    orgUsers.set(userId, { socketId: socket.id, name, role });

    // Broadcast "user_online" to the organization room (excluding sender)
    socket.to(organizationId).emit("user_online", {
      userId,
      name,
      role,
    });

    // Send the current list of online users in the organization to the newly connected user
    const onlineList = [];
    orgUsers.forEach((details, uid) => {
      onlineList.push({ userId: uid, name: details.name, role: details.role });
    });
    socket.emit("presence_list", onlineList);

    // 3. Handle Disconnection
    socket.on("disconnect", () => {
      console.log(`User ${name} disconnected from socket.`);
      
      const orgUsersMap = activeUsers.get(organizationId);
      if (orgUsersMap) {
        orgUsersMap.delete(userId);
        
        // If no users left in org, remove organization key from tracker
        if (orgUsersMap.size === 0) {
          activeUsers.delete(organizationId);
        }

        // Broadcast "user_offline" to organization room
        socket.to(organizationId).emit("user_offline", {
          userId,
          name,
        });
      }
    });
  });

  return io;
};

/**
 * Helper to emit event to all users inside a specific organization
 */
const broadcastToOrg = (organizationId, eventName, payload) => {
  if (io) {
    io.to(organizationId.toString()).emit(eventName, payload);
    return true;
  }
  return false;
};

/**
 * Helper to emit event to a specific user within their organization
 */
const emitToUser = (organizationId, userId, eventName, payload) => {
  if (io) {
    const orgUsers = activeUsers.get(organizationId.toString());
    if (orgUsers && orgUsers.has(userId.toString())) {
      const { socketId } = orgUsers.get(userId.toString());
      io.to(socketId).emit(eventName, payload);
      return true;
    }
  }
  return false;
};

module.exports = {
  initSocket,
  broadcastToOrg,
  emitToUser,
};
