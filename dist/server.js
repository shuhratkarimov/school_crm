"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const http_1 = __importDefault(require("http"));
const index_1 = __importDefault(require("./index"));
const server = http_1.default.createServer(index_1.default);
// No-op stub: socket.io has been removed, but we keep the API to avoid touching
// every controller that previously emitted real-time notifications.
// Notifications are now polled from the database by the clients.
const noopEmitter = {
    to: () => noopEmitter,
    in: () => noopEmitter,
    emit: () => { },
    fetchSockets: async () => [],
};
exports.io = noopEmitter;
server.listen(3000, () => {
    console.log("Server running on 3000");
});
