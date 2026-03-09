import { Request, Response, NextFunction } from "express";
import { Note } from "../Models/note_model";
import { withBranchScope } from "../Utils/branch_scope.helper";
import { BaseError } from "../Utils/base_error";

export const getNotes = async (req: any, res: Response, next: NextFunction) => {
  try {
    const notes = await Note.findAll({
      where: withBranchScope(req),
      order: [["date", "DESC"]],
    });
    res.json(notes);
  } catch (error) {
    next(error);
  }
};

export const createNote = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { title, description, date } = req.body;

    const scope = req.scope;
    // manager: scope.branchIds[0]
    // director/superadmin: payload orqali branch_id yuboring (yoki alohida tanlatib)
    const branch_id = scope?.all ? req.body.branch_id : scope?.branchIds?.[0];

    if (!branch_id) {
      return next(BaseError.BadRequest(400, "branch_id required"));
    }

    const note = await Note.create({ title, description, date, branch_id });
    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, description, date } = req.body;

    const note = await Note.findOne({
      where: withBranchScope(req, { id }),
    });
    if (!note) return res.status(404).json({ message: "Note not found (yoki ruxsat yo‘q)" });

    await note.update({ title, description, date });
    res.json(note);
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const note = await Note.findOne({
      where: withBranchScope(req, { id }),
    });
    if (!note) return res.status(404).json({ message: "Note not found (yoki ruxsat yo‘q)" });

    await note.destroy();
    res.json({ message: "Note deleted" });
  } catch (error) {
    next(error);
  }
};