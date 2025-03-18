import express, { NextFunction, Request, Response } from "express";
import { Op, Sequelize } from "sequelize";
import i18next from "../Utils/lang";
import Student from "../Models/student_model";
import Teacher from "../Models/teacher_model";
import Payment from "../Models/payment_model";
import Group from "../Models/group_model";
import User from "../Models/user_model";
import { BaseError } from "../Utils/base_error";

async function searchGlobal(req: Request, res: Response, next: NextFunction) {
  let { query, type } = req.query;
  const lang = req.headers["accept-language"] || "uz";

  if (!query || !type) {
    return res.status(400).json({
      error: i18next.t("search.error_missing_query_type", { lng: lang }),
    });
  }

  if (Array.isArray(query)) {
    query = query[0];
  }

  if (typeof query !== "string") {
    return res.status(400).json({
      error: i18next.t("search.error_invalid_format", { lng: lang }),
    });
  }

  query = query.toLowerCase();

  try {
    let searchResults: any = {};

    if (type === "name") {
      searchResults.students = await Student.findAll({
        where: {
          [Op.or]: [
            { first_name: { [Op.iLike]: `%${query}%` } },
            { last_name: { [Op.iLike]: `%${query}%` } },
          ],
        },
      });
      searchResults.teachers = await Teacher.findAll({
        where: {
          [Op.or]: [
            { first_name: { [Op.iLike]: `%${query}%` } },
            { last_name: { [Op.iLike]: `%${query}%` } },
          ],
        },
      });
      searchResults.users = await User.findAll({
        where: {
          [Op.or]: [
            { username: { [Op.iLike]: `%${query}%` } },
            { email: { [Op.iLike]: `%${query}%` } },
          ],
        },
      });
    } else if (type === "payment") {
      const boolQuery = query || true || false;
      searchResults.payments = await Student.findAll({
        where: {
          paid_for_this_month: boolQuery,
        },
      });
    } else if (type === "birth_date") {
      searchResults.students = await Student.findAll({
        where: {
          birth_date: { [Op.eq]: `%${query}%` },
        },
      });
      searchResults.teachers = await Teacher.findAll({
        where: {
          birth_date: { [Op.eq]: `%${query}%` },
        },
      });
    }
    if (
        (!searchResults.students || searchResults.students.length === 0) &&
        (!searchResults.teachers || searchResults.teachers.length === 0) &&
        (!searchResults.users || searchResults.users.length === 0) &&
        (!searchResults.payments || searchResults.payments.length === 0)
      ) {
        return next(BaseError.BadRequest(404, i18next.t("search.not_found_result", { lng: lang })));
      }      
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: i18next.t("search.error_internal_server", { lng: lang }),
    });
  }
}

export default searchGlobal;
