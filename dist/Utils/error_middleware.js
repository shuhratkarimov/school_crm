"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = errorHandler;
const base_error_1 = require("../Utils/base_error");
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = require("jsonwebtoken");
const sequelize_1 = require("sequelize");
const typeorm_1 = require("typeorm");
function errorHandler(err, req, res, next) {
    console.error("Error Middleware Triggered:", err); // Xatolikni logga yozish
    // BaseError sinfidagi xatoliklarni qaytarish
    if (err instanceof base_error_1.BaseError) {
        return res.status(err.status).json({
            success: false,
            message: err.message,
            errors: err.errors || [],
        });
    }
    // Mongoose tomonidan kelgan ValidationError
    if (err instanceof mongoose_1.default.Error.ValidationError) {
        const errorMessages = Object.values(err.errors).map((error) => error.message);
        return res.status(400).json({
            success: false,
            message: "Validation Error",
            errors: errorMessages,
        });
    }
    // MongoDB noyoblik xatosi (Duplicate Key Error)
    if (err.code === 11000) {
        const fields = Object.keys(err.keyValue).join(", ");
        return res.status(400).json({
            success: false,
            message: `Duplicate value for fields: ${fields}`,
            errors: [`Duplicate value for fields: ${fields}`],
        });
    }
    // JWT Token xatolari
    if (err instanceof jsonwebtoken_1.JsonWebTokenError) {
        return res.status(401).json({
            success: false,
            message: "Invalid Token",
        });
    }
    if (err instanceof jsonwebtoken_1.TokenExpiredError) {
        return res.status(401).json({
            success: false,
            message: "Token has expired",
        });
    }
    // JSON parsing xatoliklari
    if (err instanceof SyntaxError && "body" in err) {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON syntax in request body",
            errors: [err.message],
        });
    }
    // PostgreSQL yoki SQL bazalar bilan bog‘liq xatolar (Sequelize, TypeORM)
    if (err instanceof sequelize_1.DatabaseError || err instanceof typeorm_1.QueryFailedError) {
        return res.status(500).json({
            success: false,
            message: "Database error",
            errors: [err.message],
        });
    }
    // Sequelize model validatsiya xatoliklari
    if (err instanceof sequelize_1.ValidationError) {
        const validationErrors = err.errors.map(e => e.message);
        return res.status(400).json({
            success: false,
            message: "Validation Error",
            errors: validationErrors,
        });
    }
    // Unauthorized xatolar
    if (err.status === 403) {
        return res.status(403).json({
            success: false,
            message: "Forbidden: You don't have permission to access this resource",
        });
    }
    if (err.status === 404) {
        return res.status(404).json({
            success: false,
            message: "Resource not found",
        });
    }
    // Rate Limit (429) xatosi
    if (err.status === 429) {
        return res.status(429).json({
            success: false,
            message: "Too many requests, please try again later",
        });
    }
    // CSRF xatoliklari
    if (err.code === "EBADCSRFTOKEN") {
        return res.status(403).json({
            success: false,
            message: "Invalid CSRF token",
        });
    }
    // CORS (Cross-Origin Resource Sharing) xatolari
    if (err.code === "CORS_ERROR") {
        return res.status(403).json({
            success: false,
            message: "CORS policy violation",
        });
    }
    // Service Unavailable (503) xatoliklari
    if (err.status === 503) {
        return res.status(503).json({
            success: false,
            message: "Service temporarily unavailable, please try again later",
        });
    }
    // File Upload xatoliklari (max size, format noto‘g‘ri)
    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
            success: false,
            message: "Uploaded file is too large",
        });
    }
    if (err.code === "INVALID_FILE_TYPE") {
        return res.status(400).json({
            success: false,
            message: "Invalid file type",
        });
    }
    // Timeout (408) xatoliklari
    if (err.status === 408) {
        return res.status(408).json({
            success: false,
            message: "Request timeout",
        });
    }
    // Umumiy yoki noma’lum xatoliklar uchun fallback
    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errors: [err.message || "An unexpected error occurred"],
    });
}
;
