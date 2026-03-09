"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNote = exports.updateNote = exports.createNote = exports.getNotes = void 0;
const note_model_1 = require("../Models/note_model");
const branch_scope_helper_1 = require("../Utils/branch_scope.helper");
const base_error_1 = require("../Utils/base_error");
const getNotes = async (req, res, next) => {
    try {
        const notes = await note_model_1.Note.findAll({
            where: (0, branch_scope_helper_1.withBranchScope)(req),
            order: [["date", "DESC"]],
        });
        res.json(notes);
    }
    catch (error) {
        next(error);
    }
};
exports.getNotes = getNotes;
const createNote = async (req, res, next) => {
    try {
        const { title, description, date } = req.body;
        const scope = req.scope;
        // manager: scope.branchIds[0]
        // director/superadmin: payload orqali branch_id yuboring (yoki alohida tanlatib)
        const branch_id = scope?.all ? req.body.branch_id : scope?.branchIds?.[0];
        if (!branch_id) {
            return next(base_error_1.BaseError.BadRequest(400, "branch_id required"));
        }
        const note = await note_model_1.Note.create({ title, description, date, branch_id });
        res.status(201).json(note);
    }
    catch (error) {
        next(error);
    }
};
exports.createNote = createNote;
const updateNote = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, date } = req.body;
        const note = await note_model_1.Note.findOne({
            where: (0, branch_scope_helper_1.withBranchScope)(req, { id }),
        });
        if (!note)
            return res.status(404).json({ message: "Note not found (yoki ruxsat yo‘q)" });
        await note.update({ title, description, date });
        res.json(note);
    }
    catch (error) {
        next(error);
    }
};
exports.updateNote = updateNote;
const deleteNote = async (req, res, next) => {
    try {
        const { id } = req.params;
        const note = await note_model_1.Note.findOne({
            where: (0, branch_scope_helper_1.withBranchScope)(req, { id }),
        });
        if (!note)
            return res.status(404).json({ message: "Note not found (yoki ruxsat yo‘q)" });
        await note.destroy();
        res.json({ message: "Note deleted" });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteNote = deleteNote;
