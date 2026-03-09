"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteRouter = void 0;
const express_1 = require("express");
const note_ctr_1 = require("../controller/note.ctr");
const auth_guard_middleware_1 = require("../middlewares/auth-guard.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const access_scope_middleware_1 = require("../middlewares/access-scope.middleware");
const NoteRouter = (0, express_1.Router)();
exports.NoteRouter = NoteRouter;
const secured = [
    auth_guard_middleware_1.authMiddleware,
    (0, role_middleware_1.roleMiddleware)("manager", "director", "superadmin"),
    access_scope_middleware_1.accessScopeMiddleware,
];
NoteRouter.get("/get_notes", ...secured, note_ctr_1.getNotes);
NoteRouter.post("/create_note", ...secured, note_ctr_1.createNote);
NoteRouter.put("/update_note/:id", ...secured, note_ctr_1.updateNote);
NoteRouter.delete("/delete_note/:id", ...secured, note_ctr_1.deleteNote);
