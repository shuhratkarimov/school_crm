"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.platformReviewAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const teacher_model_1 = __importDefault(require("../Models/teacher_model"));
const user_model_1 = require("../Models/user_model");
const base_error_1 = require("../Utils/base_error");
const platformReviewAuth = async (req, _res, next) => {
    try {
        const token = req.cookies?.accesstoken;
        if (!token) {
            return next(base_error_1.BaseError.BadRequest(401, 'Token topilmadi'));
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_SECRET_KEY);
        if (!decoded?.id) {
            return next(base_error_1.BaseError.BadRequest(401, 'Token xato'));
        }
        const id = String(decoded.id);
        const teacher = await teacher_model_1.default.findByPk(id);
        if (teacher) {
            req.teacher = { id };
            req.actor = { id };
            req.actorType = 'teacher';
            return next();
        }
        const user = await user_model_1.User.findByPk(id);
        if (user) {
            req.user = {
                id,
                role: user.dataValues.role,
                first_name: user.dataValues.first_name,
                branch_id: user.dataValues.branch_id,
            };
            req.actor = { id };
            req.actorType = 'user';
            return next();
        }
        return next(base_error_1.BaseError.BadRequest(401, 'Foydalanuvchi topilmadi'));
    }
    catch (_error) {
        return next(base_error_1.BaseError.BadRequest(401, 'Token xato'));
    }
};
exports.platformReviewAuth = platformReviewAuth;
