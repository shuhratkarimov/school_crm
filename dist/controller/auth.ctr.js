"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.verify = verify;
exports.logout = logout;
exports.resendVerificationCode = resendVerificationCode;
exports.checkAuth = checkAuth;
exports.checkTeacherAuth = checkTeacherAuth;
exports.changePassword = changePassword;
exports.getProfile = getProfile;
exports.updateProfile = updateProfile;
exports.getMe = getMe;
exports.getAllUsers = getAllUsers;
exports.getOneUser = getOneUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
exports.checkDirectorAuth = checkDirectorAuth;
exports.directorLogin = directorLogin;
const user_model_1 = require("../Models/user_model");
const base_error_1 = require("../Utils/base_error");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const email_verifier_1 = __importDefault(require("../Utils/email_verifier"));
const lang_1 = __importDefault(require("../Utils/lang"));
const Models_1 = require("../Models");
dotenv_1.default.config();
async function checkAuth(req, res, next) {
    const token = req.cookies.accesstoken;
    if (!token) {
        return res.status(401).json({ message: "Unauthorized at check auth" });
    }
    try {
        jsonwebtoken_1.default.verify(token, process.env.ACCESS_SECRET_KEY);
        res.status(200).json({ message: "Authenticated" });
    }
    catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
}
async function checkTeacherAuth(req, res) {
    try {
        const token = req.cookies.accesstoken;
        if (!token)
            return res.status(401).json({ message: "Unauthorized at check teacher auth" });
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_SECRET_KEY);
        const teacher = await Models_1.Teacher.findByPk(decoded.id);
        if (!teacher)
            return res.status(401).json({ message: "Teacher not found" });
        res.status(200).json({ teacher: { id: teacher.dataValues.id, username: teacher.dataValues.username } });
    }
    catch (err) {
        res.status(401).json({ message: "Invalid or expired token" });
    }
}
async function register(req, res, next) {
    try {
        const lang = req.headers["accept-language"] || "uz";
        let { username, email, password } = req.body;
        const role = (await user_model_1.User.count()) === 0 ? "superadmin" : "user";
        const foundUser = await user_model_1.User.findOne({ where: { email: email } });
        if (foundUser) {
            return next(base_error_1.BaseError.BadRequest(403, lang_1.default.t("already_registered", { lng: lang })));
        }
        const randomCode = Number(Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join(""));
        await (0, email_verifier_1.default)(username, email, randomCode);
        const encodedPassword = await bcryptjs_1.default.hash(password, 12);
        await user_model_1.User.create({
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
}
async function verify(req, res, next) {
    try {
        const lang = req.headers["accept-language"] || "uz";
        const { email, code } = req.body;
        const foundUser = await user_model_1.User.findOne({ where: { email: email } });
        if (!foundUser) {
            return next(base_error_1.BaseError.BadRequest(404, "Foydalanuvchi topilmadi"));
        }
        const userTimestamp = new Date(foundUser.dataValues.timestamp).getTime();
        const now = Date.now();
        if (now <= userTimestamp &&
            Number(code) === Number(foundUser.dataValues.verification_code)) {
            await foundUser.update({ is_verified: true, verification_code: 0 });
            return res.status(200).json({
                message: lang_1.default.t("verification_success", { lng: lang }),
            });
        }
        else {
            return next(base_error_1.BaseError.BadRequest(401, "Tasdiqlash kodi xato"));
        }
    }
    catch (error) {
        next(error);
    }
}
async function resendVerificationCode(req, res, next) {
    try {
        const lang = req.headers["accept-language"] || "uz";
        const { email } = req.body;
        const foundUser = await user_model_1.User.findOne({ where: { email: email } });
        if (!foundUser) {
            return next(base_error_1.BaseError.BadRequest(404, "Foydalanuvchi topilmadi"));
        }
        if (foundUser.dataValues.is_verified) {
            return next(base_error_1.BaseError.BadRequest(403, "Foydalanuvchi allaqachon ro'yxatdan o'tgan"));
        }
        const randomCode = Number(Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join(""));
        await (0, email_verifier_1.default)(foundUser.dataValues.username, email, randomCode);
        foundUser.update({
            verification_code: randomCode,
            timestamp: new Date(Date.now() + 2000 * 60),
        });
        res.status(200).json({
            message: "Yangi tasdiqlash kodi yuborildi",
        });
    }
    catch (error) {
        next(error);
    }
}
async function login(req, res, next) {
    try {
        const lang = req.headers["accept-language"] || "uz";
        const { email, password } = req.body;
        const foundUser = await user_model_1.User.findOne({ where: { email: email } });
        if (!foundUser) {
            return next(base_error_1.BaseError.BadRequest(401, "Foydalanuvchi topilmadi"));
        }
        const checkPassword = await bcryptjs_1.default.compare(password, foundUser.dataValues.password);
        if (!checkPassword) {
            return next(base_error_1.BaseError.BadRequest(401, "Noto'g'ri parol"));
        }
        const payload = {
            id: foundUser.dataValues.id,
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
            const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
            res.cookie("accesstoken", accesstoken, {
                httpOnly: true,
                secure: isSecure,
                sameSite: "lax",
                maxAge: 60 * 60 * 1000,
            });
            res.cookie("refreshtoken", refreshtoken, {
                httpOnly: true,
                secure: isSecure,
                sameSite: "lax",
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
}
function logout(req, res, next) {
    try {
        const cookie = req.cookies.refreshtoken;
        if (!cookie)
            return next(base_error_1.BaseError.BadRequest(401, "Token topilmadi"));
        jsonwebtoken_1.default.verify(cookie, process.env.REFRESH_SECRET_KEY);
        const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
        res.clearCookie("accesstoken", {
            httpOnly: true,
            secure: isSecure,
            sameSite: "lax",
            path: "/",
        });
        res.clearCookie("refreshtoken", {
            httpOnly: true,
            secure: isSecure,
            sameSite: "lax",
            path: "/",
        });
        res
            .status(200)
            .json({
            message: lang_1.default.t("logout_success", {
                lng: req.headers["accept-language"] || "uz",
            }),
        });
    }
    catch (error) {
        next(error);
    }
}
async function changePassword(req, res, next) {
    try {
        const { email, oldPassword, newPassword } = req.body;
        const foundUser = await user_model_1.User.findOne({ where: { email: email } });
        if (!foundUser) {
            return next(base_error_1.BaseError.BadRequest(404, "Foydalanuvchi topilmadi"));
        }
        const checkPassword = await bcryptjs_1.default.compare(oldPassword, foundUser.dataValues.password);
        if (!checkPassword) {
            return next(base_error_1.BaseError.BadRequest(401, "Noto'g'ri parol"));
        }
        const encodedPassword = await bcryptjs_1.default.hash(newPassword, 12);
        await foundUser.update({ password: encodedPassword });
        res.status(200).json({ message: "Parol muvaffaqiyatli o'zgartirildi" });
    }
    catch (error) {
        next(error);
    }
}
async function getProfile(req, res, next) {
    try {
        const token = req.cookies.accesstoken;
        if (!token)
            return next(base_error_1.BaseError.BadRequest(401, "Token topilmadi"));
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_SECRET_KEY);
        const user = await user_model_1.User.findByPk(decoded.id);
        if (!user)
            return next(base_error_1.BaseError.BadRequest(404, "Foydalanuvchi topilmadi"));
        res.status(200).json({ user: { id: user.dataValues.id, username: user.dataValues.username, email: user.dataValues.email } });
    }
    catch (err) {
        next(base_error_1.BaseError.BadRequest(401, "Token xato"));
    }
}
async function updateProfile(req, res, next) {
    try {
        const { email, username } = req.body;
        const foundUser = await user_model_1.User.findOne({ where: { email: email } });
        if (!foundUser) {
            return next(base_error_1.BaseError.BadRequest(404, "Foydalanuvchi topilmadi"));
        }
        await foundUser.update({ username: username });
        res.status(200).json({ message: "Foydalanuvchi muvaffaqiyatli o'zgartirildi" });
    }
    catch (error) {
        next(error);
    }
}
async function getMe(req, res) {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: "Unauthorized at getme" });
    }
    res.json({
        id: user.id,
        role: user.role,
        first_name: user.first_name,
    });
}
;
async function getAllUsers(req, res, next) {
    try {
        const users = await user_model_1.User.findAll();
        res.status(200).json({ users });
    }
    catch (error) {
        next(error);
    }
}
async function getOneUser(req, res, next) {
    try {
        const { id } = req.params;
        const user = await user_model_1.User.findByPk(id);
        if (!user)
            return next(base_error_1.BaseError.BadRequest(404, "Foydalanuvchi topilmadi"));
        res.status(200).json({ user });
    }
    catch (error) {
        next(error);
    }
}
async function updateUser(req, res, next) {
    try {
        const { id } = req.params;
        const { username, email } = req.body;
        const user = await user_model_1.User.findByPk(id);
        if (!user)
            return next(base_error_1.BaseError.BadRequest(404, "Foydalanuvchi topilmadi"));
        await user.update({ username: username, email: email });
        res.status(200).json({ message: "Foydalanuvchi muvaffaqiyatli o'zgartirildi" });
    }
    catch (error) {
        next(error);
    }
}
async function deleteUser(req, res, next) {
    try {
        const { id } = req.params;
        const user = await user_model_1.User.findByPk(id);
        if (!user)
            return next(base_error_1.BaseError.BadRequest(404, "Foydalanuvchi topilmadi"));
        await user.destroy();
        res.status(200).json({ message: "Foydalanuvchi muvaffaqiyatli o'chirildi" });
    }
    catch (error) {
        next(error);
    }
}
async function checkDirectorAuth(req, res, next) {
    try {
        const token = req.cookies.accesstoken;
        if (!token)
            return next(base_error_1.BaseError.BadRequest(401, "Unauthorized at check teacher auth"));
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_SECRET_KEY);
        const director = await user_model_1.User.findByPk(decoded.id);
        if (!director)
            return next(base_error_1.BaseError.BadRequest(401, "Director not found"));
        if (director.dataValues.role !== "director") {
            return next(base_error_1.BaseError.BadRequest(401, "You are not director"));
        }
        res.status(200).json({ director: { id: director.dataValues.id, username: director.dataValues.username } });
    }
    catch (err) {
        next(base_error_1.BaseError.BadRequest(401, "Invalid or expired token"));
    }
}
async function directorLogin(req, res, next) {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return next(base_error_1.BaseError.BadRequest(400, "Email and password are required"));
        const foundDirector = await user_model_1.User.findOne({ where: { email } });
        if (!foundDirector) {
            return next(base_error_1.BaseError.BadRequest(401, "Director not found"));
        }
        if (foundDirector.dataValues.role !== "director" && foundDirector.dataValues.role !== "superadmin") {
            return next(base_error_1.BaseError.BadRequest(401, "Forbidden!"));
        }
        const checkPassword = await bcryptjs_1.default.compare(password, foundDirector.dataValues.password);
        if (!checkPassword) {
            return next(base_error_1.BaseError.BadRequest(401, "Invalid password"));
        }
        const payload = {
            id: foundDirector.dataValues.id,
            username: foundDirector.dataValues.username,
            email: foundDirector.dataValues.email,
            role: foundDirector.dataValues.role,
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
        const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
        res.cookie("accesstoken", accesstoken, {
            httpOnly: true,
            secure: isSecure,
            sameSite: "lax",
            maxAge: 60 * 60 * 1000,
        });
        res.cookie("refreshtoken", refreshtoken, {
            httpOnly: true,
            secure: isSecure,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res
            .status(200).send({ message: "Director logged in successfully" });
    }
    catch (error) {
        next(error);
    }
}
