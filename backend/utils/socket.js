const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io;

exports.initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        "https://portal.lorettocentralschool.edu.in",
        "https://lcs-portal.pages.dev",
        "http://localhost:3000",
        "http://localhost:5173"
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"]
    }
  });

  // Auth Middleware for Socket
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication error"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const { id, role } = socket.data.user;
    
    // Join rooms based on role
    if (role === "admin") socket.join("admin");
    else if (role === "teacher") socket.join("teachers");
    else if (role === "student") {
      socket.join("students");
      socket.join(id); // Individual student room
    }

    console.log(`📡 Socket connected: ${socket.id} (User: ${id}, Role: ${role})`);

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

exports.getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};
