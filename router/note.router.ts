import { Router, RequestHandler } from "express";
import { getNotes, createNote, updateNote, deleteNote } from "../controller/note.ctr";
import { authMiddleware } from "../middlewares/auth-guard.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { accessScopeMiddleware } from "../middlewares/access-scope.middleware";

const NoteRouter: Router = Router();

const secured = [
  authMiddleware,
  roleMiddleware("manager", "director", "superadmin"),
  accessScopeMiddleware,
] as RequestHandler[];

NoteRouter.get("/get_notes", ...secured, getNotes as RequestHandler);
NoteRouter.post("/create_note", ...secured, createNote as RequestHandler);
NoteRouter.put("/update_note/:id", ...secured, updateNote as RequestHandler);
NoteRouter.delete("/delete_note/:id", ...secured, deleteNote as RequestHandler);

export { NoteRouter };