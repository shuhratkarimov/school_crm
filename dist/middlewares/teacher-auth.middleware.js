"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.teacherAuthMiddleware = teacherAuthMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const base_error_1 = require("../Utils/base_error");
function teacherAuthMiddleware(req, _res, next) {
    try {
        const token = req.cookies.accesstoken;
        if (!token)
            return next(base_error_1.BaseError.BadRequest(401, "Token topilmadi"));
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_SECRET_KEY);
        if (!decoded?.id)
            return next(base_error_1.BaseError.BadRequest(401, "Token xato"));
        req.teacher = { id: decoded.id };
        return next();
    }
    catch (e) {
        return next(base_error_1.BaseError.BadRequest(401, "Token xato"));
    }
}
