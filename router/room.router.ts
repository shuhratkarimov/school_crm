import { RequestHandler, Router } from "express";
import {
  getRooms,
  getOneRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  getAvailableRooms,
} from "../controller/room.ctr";

import { authMiddleware } from "../middlewares/auth-guard.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { accessScopeMiddleware } from "../middlewares/access-scope.middleware";

const RoomRouter: Router = Router();

const roomAccess = [
  authMiddleware,
  roleMiddleware("manager", "director", "superadmin"),
  accessScopeMiddleware,
] as RequestHandler[];

RoomRouter.get("/get_rooms", ...roomAccess, getRooms as RequestHandler);
RoomRouter.get("/get_one_room/:id", ...roomAccess, getOneRoom as RequestHandler);
RoomRouter.post("/create_room", ...roomAccess, createRoom as RequestHandler);
RoomRouter.put("/update_room/:id", ...roomAccess, updateRoom as RequestHandler);
RoomRouter.delete("/delete_room/:id", ...roomAccess, deleteRoom as RequestHandler);
RoomRouter.get("/get_available_rooms", ...roomAccess, getAvailableRooms as RequestHandler);

export { RoomRouter };