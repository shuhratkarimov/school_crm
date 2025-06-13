"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.verify = verify;
exports.logout = logout;
exports.resendVerificationCode = resendVerificationCode;
const user_model_1 = __importDefault(require("../Models/user_model"));
const base_error_1 = require("../Utils/base_error");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const email_verifier_1 = __importDefault(require("../Utils/email_verifier"));
const lang_1 = __importDefault(require("../Utils/lang"));
dotenv_1.default.config();
user_model_1.default.sync({ force: false });
function register(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const lang = req.headers["accept-language"] || "uz";
            let { username, email, password } = req.body;
            const role = (yield user_model_1.default.count()) === 0 ? "superadmin" : "user";
            const foundUser = yield user_model_1.default.findOne({ where: { email: email } });
            if (foundUser) {
                return next(base_error_1.BaseError.BadRequest(403, lang_1.default.t("already_registered", { lng: lang })));
            }
            const randomCode = Number(Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join(""));
            yield (0, email_verifier_1.default)(username, email, randomCode);
            const encodedPassword = yield bcryptjs_1.default.hash(password, 12);
            yield user_model_1.default.create({
                username,
                email,
                password: encodedPassword,
                verification_code: randomCode,
                role,
                timestamp: new Date(Date.now() + 2000 * 60),
            });
            res.status(201).json({
                message: lang_1.default.t("register_success", { lng: lang, email }),
            });
        }
        catch (error) {
            next(error);
        }
    });
}
function verify(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const lang = req.headers["accept-language"] || "uz";
            const { email, code } = req.body;
            const foundUser = yield user_model_1.default.findOne({ where: { email: email } });
            if (!foundUser) {
                return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("user_not_found", { lng: lang })));
            }
            const userTimestamp = new Date(foundUser.dataValues.timestamp).getTime();
            const now = Date.now();
            if (now <= userTimestamp &&
                Number(code) === Number(foundUser.dataValues.verification_code)) {
                yield foundUser.update({ is_verified: true, verification_code: 0 });
                return res.status(200).json({
                    message: lang_1.default.t("verification_success", { lng: lang }),
                });
            }
            else {
                return next(base_error_1.BaseError.BadRequest(401, lang_1.default.t("verification_failed", { lng: lang })));
            }
        }
        catch (error) {
            next(error);
        }
    });
}
function resendVerificationCode(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const lang = req.headers["accept-language"] || "uz";
            const { email } = req.body;
            const foundUser = yield user_model_1.default.findOne({ where: { email: email } });
            if (!foundUser) {
                return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("not_registered", { lng: lang })));
            }
            if (foundUser.dataValues.is_verified) {
                return next(base_error_1.BaseError.BadRequest(403, lang_1.default.t("already_verified", { lng: lang })));
            }
            const randomCode = Number(Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join(""));
            yield (0, email_verifier_1.default)(foundUser.dataValues.username, email, randomCode);
            foundUser.update({
                verification_code: randomCode,
                timestamp: new Date(Date.now() + 2000 * 60),
            });
            res.status(200).json({
                message: lang_1.default.t("new_code_sent", { lng: lang, email }),
            });
        }
        catch (error) {
            next(error);
        }
    });
}
function login(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const lang = req.headers["accept-language"] || "uz";
            const { email, password } = req.body;
            const foundUser = yield user_model_1.default.findOne({ where: { email: email } });
            if (!foundUser) {
                return next(base_error_1.BaseError.BadRequest(401, lang_1.default.t("not_registered", { lng: lang })));
            }
            const checkPassword = yield bcryptjs_1.default.compare(password, foundUser.dataValues.password);
            if (!checkPassword) {
                return next(base_error_1.BaseError.BadRequest(401, lang_1.default.t("wrong_password", { lng: lang })));
            }
            const payload = {
                username: foundUser.dataValues.username,
                email: foundUser.dataValues.email,
                role: foundUser.dataValues.role,
            };
            const generateAccessToken = (payload) => {
                if (!payload)
                    throw new Error("Payload cannot be null");
                const secretKey = process.env.ACCESS_SECRET_KEY;
                if (!secretKey)
                    throw new Error("ACCESS_SECRET_KEY is not defined");
                const expiresIn = process.env.ACCESS_EXPIRING_TIME || "15m";
                return jsonwebtoken_1.default.sign(payload, secretKey, { expiresIn });
            };
            const generateRefreshToken = (payload) => {
                if (!payload)
                    throw new Error("Payload cannot be null");
                const secretKey = process.env.REFRESH_SECRET_KEY;
                if (!secretKey)
                    throw new Error("REFRESH_SECRET_KEY is not defined");
                return jsonwebtoken_1.default.sign(payload, secretKey, { expiresIn: "7d" });
            };
            const accesstoken = generateAccessToken(payload);
            const refreshtoken = generateRefreshToken(payload);
            if (foundUser.dataValues.is_verified) {
                res.cookie("accesstoken", accesstoken, {
                    httpOnly: true,
                    maxAge: 15 * 60 * 1000,
                });
                res.cookie("refreshtoken", refreshtoken, {
                    httpOnly: true,
                    maxAge: 7 * 24 * 60 * 60 * 1000,
                });
                res
                    .status(200)
                    .json({ message: lang_1.default.t("login_success", { lng: lang }) });
            }
            else {
                next(base_error_1.BaseError.BadRequest(401, lang_1.default.t("not_verified", { lng: lang })));
            }
        }
        catch (error) {
            next(error);
        }
    });
}
function logout(req, res, next) {
    jsonwebtoken_1.default.verify(req.cookies.refreshtoken, process.env.REFRESH_SECRET_KEY);
    res.clearCookie("accesstoken");
    res.clearCookie("refreshtoken");
    res
        .status(200)
        .json({
        message: lang_1.default.t("logout_success", {
            lng: req.headers["accept-language"] || "uz",
        }),
    });
}
