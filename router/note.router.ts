import { Router } from "express";
import { getNotes, createNote, updateNote, deleteNote } from "../controller/note.ctr";
import { RequestHandler } from "express";

const NoteRouter:Router = Router();

NoteRouter.get("/get_notes", getNotes as RequestHandler);
NoteRouter.post("/create_note", createNote as RequestHandler);
NoteRouter.put("/update_note/:id", updateNote as RequestHandler);
NoteRouter.delete("/delete_note/:id", deleteNote as RequestHandler);

export {
    NoteRouter
}
