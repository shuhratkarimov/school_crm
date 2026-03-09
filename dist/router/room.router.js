"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomRouter = void 0;
const express_1 = require("express");
const room_ctr_1 = require("../controller/room.ctr");
const auth_guard_middleware_1 = require("../middlewares/auth-guard.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const access_scope_middleware_1 = require("../middlewares/access-scope.middleware");
const RoomRouter = (0, express_1.Router)();
exports.RoomRouter = RoomRouter;
const roomAccess = [
    auth_guard_middleware_1.authMiddleware,
    (0, role_middleware_1.roleMiddleware)("manager", "director", "superadmin"),
    access_scope_middleware_1.accessScopeMiddleware,
];
RoomRouter.get("/get_rooms", ...roomAccess, room_ctr_1.getRooms);
RoomRouter.get("/get_one_room/:id", ...roomAccess, room_ctr_1.getOneRoom);
RoomRouter.post("/create_room", ...roomAccess, room_ctr_1.createRoom);
RoomRouter.put("/update_room/:id", ...roomAccess, room_ctr_1.updateRoom);
RoomRouter.delete("/delete_room/:id", ...roomAccess, room_ctr_1.deleteRoom);
RoomRouter.get("/get_available_rooms", ...roomAccess, room_ctr_1.getAvailableRooms);
