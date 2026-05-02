import http from "http";
import app from "./index";

const server = http.createServer(app);

// No-op stub: socket.io has been removed, but we keep the API to avoid touching
// every controller that previously emitted real-time notifications.
// Notifications are now polled from the database by the clients.
const noopEmitter = {
  to: () => noopEmitter,
  in: () => noopEmitter,
  emit: () => {},
  fetchSockets: async () => [],
};

export const io: any = noopEmitter;

server.listen(3000, () => {
  console.log("Server running on 3000");
});
