import http from "http";
import { Server } from "socket.io";
import app from "./index";

const server = http.createServer(app);

const allowedOrigins = [
  "http://admin.intellectualprogress.uz",
  "https://admin.intellectualprogress.uz",
  "http://register.intellectualprogress.uz",
  "https://register.intellectualprogress.uz",
  "http://teacher.intellectualprogress.uz",
  "https://teacher.intellectualprogress.uz",
  "http://193.181.208.209:8080",
  "http://localhost:5173",
];

export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.on("join-user-room", (userId: string) => {
    const roomName = `user:${userId}`;
    socket.join(roomName);
    console.log(`Socket ${socket.id} joined room ${roomName}`);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", socket.id, reason);
  });
});


server.listen(3000, () => {
  console.log("Server running on 3000");
});