"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const index_1 = __importDefault(require("./index"));
const server = http_1.default.createServer(index_1.default);
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
exports.io = new socket_io_1.Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
    },
});
exports.io.on("connection", (socket) => {
    socket.on("join-user-room", (userId) => {
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
