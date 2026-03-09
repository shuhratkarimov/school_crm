import { Request, Response, NextFunction } from "express";
import NewStudent from "../Models/newstudent_model";
import { BaseError } from "../Utils/base_error";
import { RegistrationLink } from "../Models/registration_link_model";
import { withBranchScope } from "../Utils/branch_scope.helper"

async function getNewStudents(req: any, res: Response, next: NextFunction) {
  try {
    const students = await NewStudent.findAll({
      where: withBranchScope(req),
      order: [["created_at", "DESC"]],
    });
    res.json(students);
  } catch (error) {
    next(error);
  }
}

async function registerNewStudentPublic(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.params;
    const { first_name, last_name, phone } = req.body;

    if (!first_name?.trim() || !last_name?.trim() || !phone?.trim()) {
      return next(BaseError.BadRequest(400, "Barcha maydonlar kiritilishi shart"));
    }

    const link = await RegistrationLink.findOne({
      where: { token },
      attributes: ["subject", "branch_id"],
    });
    if (!link) return next(BaseError.BadRequest(404, "Link topilmadi"));

    const student = await NewStudent.create({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      phone,
      subject: link.get("subject"),
      branch_id: link.get("branch_id"),
    });

    return res.status(201).json(student);
  } catch (e) {
    next(e);
  }
}

async function updateNewStudent(req: any, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { interviewed } = req.body;

    const student = await NewStudent.findOne({
      where: withBranchScope(req, { id }),
    });

    if (!student) {
      return next(BaseError.BadRequest(404, "Yangi o`quvchi topilmadi (yoki ruxsat yo‘q)"));
    }

    await student.update({ interviewed });
    res.json(student);
  } catch (error) {
    next(error);
  }
}

async function deleteNewStudent(req: any, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const student = await NewStudent.findOne({
      where: withBranchScope(req, { id }),
    });

    if (!student) {
      return next(BaseError.BadRequest(404, "Yangi o`quvchi topilmadi (yoki ruxsat yo‘q)"));
    }

    await student.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export { getNewStudents, registerNewStudentPublic, updateNewStudent, deleteNewStudent };