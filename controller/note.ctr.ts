import { Request, Response, NextFunction } from "express";
import { Note } from "../Models/note_model";

export const getNotes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notes = await Note.findAll({ order: [["date", "DESC"]] });
    res.json(notes);
  } catch (error) {
    next(error);
  }
};

export const createNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, date } = req.body;
    const note = await Note.create({ title, description, date });
    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, description, date } = req.body;
    const note = await Note.findByPk(id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    await note.update({ title, description, date });
    res.json(note);
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const note = await Note.findByPk(id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    await note.destroy();
    res.json({ message: "Note deleted" });
  } catch (error) {
    next(error);
  }
};
