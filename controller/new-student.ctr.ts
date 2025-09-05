import { Request, Response, NextFunction } from "express";
import NewStudent from "../Models/newstudent_model";
import { BaseError } from "../Utils/base_error";

async function getNewStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const students = await NewStudent.findAll({
      order: [['created_at', 'DESC']]
    });
    res.json(students);
  } catch (error) {
    next(error);
  }
}

async function createNewStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const { first_name, last_name, phone } = req.body;

    if (!first_name || !last_name || !phone) {
      return next(BaseError.BadRequest(400, 'Barcha maydonlar kiritilishi shart'));
    }

    const student = await NewStudent.create({ first_name, last_name, phone });
    res.status(201).json(student);
  } catch (error) {
    next(error);
  }
}

async function updateNewStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { interviewed } = req.body;

    const student = await NewStudent.findByPk(id);
    if (!student) {
      return next(BaseError.BadRequest(404, 'Yangi o`quvchi topilmadi'));
    }

    await student.update({ interviewed });
    res.json(student);
  } catch (error) {
    next(error);
  }
}

async function deleteNewStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const student = await NewStudent.findByPk(id);
    if (!student) {
      return next(BaseError.BadRequest(404, 'Yangi o`quvchi topilmadi'));
    }

    await student.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export { getNewStudents, createNewStudent, updateNewStudent, deleteNewStudent };