"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../Models/index");
const base_error_1 = require("../Utils/base_error");
const authMiddleware = async (req, res, next) => {
    const token = req.cookies?.accesstoken;
    if (!token) {
        return next(base_error_1.BaseError.BadRequest(401, "No access token"));
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.ACCESS_SECRET_KEY);
        const user = await index_1.User.findByPk(payload.id);
        if (!user) {
            return next(base_error_1.BaseError.BadRequest(401, "User not found"));
        }
        req.user = {
            id: String(payload.id),
            role: user.dataValues.role,
            first_name: user.dataValues.first_name,
            branch_id: user.dataValues.branch_id,
        };
        next();
    }
    catch (err) {
        return next(base_error_1.BaseError.BadRequest(401, "Invalid token"));
    }
};
exports.authMiddleware = authMiddleware;
