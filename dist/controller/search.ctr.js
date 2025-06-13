"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const lang_1 = __importDefault(require("../Utils/lang"));
const student_model_1 = __importDefault(require("../Models/student_model"));
const teacher_model_1 = __importDefault(require("../Models/teacher_model"));
const user_model_1 = __importDefault(require("../Models/user_model"));
const base_error_1 = require("../Utils/base_error");
async function searchGlobal(req, res, next) {
    let { query, type } = req.query;
    const lang = req.headers["accept-language"] || "uz";
    if (!query || !type) {
        return res.status(400).json({
            error: lang_1.default.t("search.error_missing_query_type", { lng: lang }),
        });
    }
    if (Array.isArray(query)) {
        query = query[0];
    }
    if (typeof query !== "string") {
        return res.status(400).json({
            error: lang_1.default.t("search.error_invalid_format", { lng: lang }),
        });
    }
    query = query.toLowerCase();
    try {
        let searchResults = {};
        if (type === "name") {
            searchResults.students = await student_model_1.default.findAll({
                where: {
                    [sequelize_1.Op.or]: [
                        { first_name: { [sequelize_1.Op.iLike]: `%${query}%` } },
                        { last_name: { [sequelize_1.Op.iLike]: `%${query}%` } },
                    ],
                },
            });
            searchResults.teachers = await teacher_model_1.default.findAll({
                where: {
                    [sequelize_1.Op.or]: [
                        { first_name: { [sequelize_1.Op.iLike]: `%${query}%` } },
                        { last_name: { [sequelize_1.Op.iLike]: `%${query}%` } },
                    ],
                },
            });
            searchResults.users = await user_model_1.default.findAll({
                where: {
                    [sequelize_1.Op.or]: [
                        { username: { [sequelize_1.Op.iLike]: `%${query}%` } },
                        { email: { [sequelize_1.Op.iLike]: `%${query}%` } },
                    ],
                },
            });
        }
        else if (type === "payment") {
            const boolQuery = query || true || false;
            searchResults.payments = await student_model_1.default.findAll({
                where: {
                    paid_for_this_month: boolQuery,
                },
            });
        }
        else if (type === "birth_date") {
            searchResults.students = await student_model_1.default.findAll({
                where: {
                    birth_date: { [sequelize_1.Op.eq]: `%${query}%` },
                },
            });
            searchResults.teachers = await teacher_model_1.default.findAll({
                where: {
                    birth_date: { [sequelize_1.Op.eq]: `%${query}%` },
                },
            });
        }
        if ((!searchResults.students || searchResults.students.length === 0) &&
            (!searchResults.teachers || searchResults.teachers.length === 0) &&
            (!searchResults.users || searchResults.users.length === 0) &&
            (!searchResults.payments || searchResults.payments.length === 0)) {
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("search.not_found_result", { lng: lang })));
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            error: lang_1.default.t("search.error_internal_server", { lng: lang }),
        });
    }
}
exports.default = searchGlobal;
