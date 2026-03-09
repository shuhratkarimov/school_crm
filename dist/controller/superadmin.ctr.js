"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeRole = void 0;
exports.superadminLogin = superadminLogin;
exports.getAllBranches = getAllBranches;
exports.getOneBranch = getOneBranch;
exports.createBranch = createBranch;
exports.updateBranch = updateBranch;
exports.deleteBranch = deleteBranch;
exports.checkCpanelAuth = checkCpanelAuth;
exports.assignDirector = assignDirector;
exports.assignManager = assignManager;
exports.getAllUsers = getAllUsers;
exports.getAllCenters = getAllCenters;
exports.getAllDirectors = getAllDirectors;
exports.updateCenter = updateCenter;
exports.deleteCenter = deleteCenter;
exports.deleteDirector = deleteDirector;
exports.getOneCenter = getOneCenter;
exports.getOneDirector = getOneDirector;
exports.createCenter = createCenter;
exports.fastRegisterUserBySuperadmin = fastRegisterUserBySuperadmin;
exports.updateUserBySuperadmin = updateUserBySuperadmin;
exports.deleteUserBySuperadmin = deleteUserBySuperadmin;
const user_model_1 = require("../Models/user_model");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
const base_error_1 = require("../Utils/base_error");
const Models_1 = require("../Models");
const database_config_1 = __importDefault(require("../config/database.config"));
async function checkCpanelAuth(req, res, next) {
    const token = req.cookies.accesstoken;
    if (!token) {
        return res.status(401).json({ message: "Unauthorized at check auth" });
    }
    try {
        jwt.verify(token, process.env.ACCESS_SECRET_KEY);
        res.status(200).json({ message: "Authenticated" });
    }
    catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
}
async function superadminLogin(req, res, next) {
    try {
        const { email, password } = req.body;
        const user = await user_model_1.User.findOne({ where: { email } });
        if (!user) {
            return next(base_error_1.BaseError.BadRequest(404, "User not found"));
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.dataValues.password);
        if (!isPasswordValid) {
            return next(base_error_1.BaseError.BadRequest(401, "Invalid password"));
        }
        if (user.dataValues.role !== "superadmin") {
            return next(base_error_1.BaseError.BadRequest(403, "Invalid role"));
        }
        const payload = {
            id: user.dataValues.id,
            username: user.dataValues.username,
            email: user.dataValues.email,
            role: user.dataValues.role,
        };
        const generateAccessToken = (payload) => {
            if (!payload)
                throw new Error("Payload cannot be null");
            const secretKey = process.env.ACCESS_SECRET_KEY;
            if (!secretKey)
                throw new Error("ACCESS_SECRET_KEY is not defined");
            const expiresIn = process.env.ACCESS_EXPIRING_TIME || "15m";
            return jwt.sign(payload, secretKey, { expiresIn });
        };
        const generateRefreshToken = (payload) => {
            if (!payload)
                throw new Error("Payload cannot be null");
            const secretKey = process.env.REFRESH_SECRET_KEY;
            if (!secretKey)
                throw new Error("REFRESH_SECRET_KEY is not defined");
            return jwt.sign(payload, secretKey, { expiresIn: "7d" });
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
            .status(200)
            .json({ message: "Login successful" });
    }
    catch (error) {
        next(error);
    }
}
async function getAllBranches(req, res, next) {
    try {
        const branches = await Models_1.Branch.findAll({
            include: [{ model: Models_1.Center, as: "center" }, { model: user_model_1.User, as: "manager", attributes: ["id", "username", "email"] }],
        });
        res.status(200).json({ message: "Branches fetched successfully", branches });
    }
    catch (error) {
        next(error);
    }
}
async function getOneBranch(req, res, next) {
    try {
        const branch = await Models_1.Branch.findOne({ where: { id: req.params.id } });
        res.status(200).json({ message: "Branch fetched successfully", branch });
    }
    catch (error) {
        next(error);
    }
}
async function createBranch(req, res, next) {
    try {
        const { name, address, phone, center_id, manager_id } = req.body;
        const branch = await Models_1.Branch.create({
            name,
            address,
            phone,
            manager_id: manager_id || null,
            center_id: center_id || null,
        });
        res.status(201).json({ message: "Branch created successfully", branch });
    }
    catch (error) {
        next(error);
    }
}
async function updateBranch(req, res, next) {
    try {
        const { name, address, phone, center_id, manager_id } = req.body;
        const [updated] = await Models_1.Branch.update({ name, address, phone, center_id: center_id || null, manager_id: manager_id || null }, { where: { id: req.params.id } });
        res.status(200).json({ message: "Branch updated successfully", updated });
    }
    catch (error) {
        next(error);
    }
}
async function deleteBranch(req, res, next) {
    try {
        const branch = await Models_1.Branch.destroy({ where: { id: req.params.id } });
        res.status(201).json({ message: "Branch deleted successfully", branch });
    }
    catch (error) {
        next(error);
    }
}
async function assignDirector(req, res, next) {
    const t = await database_config_1.default.transaction();
    try {
        const { centerId } = req.params;
        const { directorId } = req.body;
        const user = await user_model_1.User.findByPk(directorId, { transaction: t });
        if (!user) {
            await t.rollback();
            return next(base_error_1.BaseError.BadRequest(404, "User not found"));
        }
        await user_model_1.User.update({ role: "director", branch_id: null }, { where: { id: directorId }, transaction: t });
        const [updated] = await Models_1.Center.update({ director_id: directorId }, { where: { id: centerId }, transaction: t });
        await Models_1.UserSettings.findOrCreate({
            where: { user_id: directorId },
            defaults: {
                email_notifications: true,
                push_notifications: true,
                debt_alerts: true,
                student_registration: true,
                payment_alerts: true,
                teacher_attendance: true,
                daily_report: true,
                weekly_report: true,
            },
            transaction: t,
        });
        await t.commit();
        return res.status(200).json({
            message: "Director assigned",
            updated,
        });
    }
    catch (e) {
        await t.rollback();
        console.error("assignDirector error:", e);
        return next(base_error_1.BaseError.BadRequest(400, "Director not assigned"));
    }
}
async function assignManager(req, res, next) {
    try {
        const { branchId } = req.params;
        const { managerId } = req.body;
        const user = await user_model_1.User.findByPk(managerId);
        if (!user)
            return next(base_error_1.BaseError.BadRequest(404, "User not found"));
        await user_model_1.User.update({ role: "manager", branch_id: branchId }, { where: { id: managerId } });
        const [updated] = await Models_1.Branch.update({ manager_id: managerId }, { where: { id: branchId } });
        res.status(200).json({ message: "Manager assigned", updated });
    }
    catch (e) {
        return next(base_error_1.BaseError.BadRequest(400, "Manager not assigned"));
    }
}
async function getAllUsers(req, res, next) {
    try {
        const users = await user_model_1.User.findAll({
            attributes: { exclude: ["password"] }
        });
        res.status(200).json({
            message: "Users fetched successfully",
            users
        });
    }
    catch (error) {
        return next(base_error_1.BaseError.BadRequest(400, "Users not fetched"));
    }
}
async function getAllCenters(req, res, next) {
    try {
        const centers = await Models_1.Center.findAll({
            include: [{ model: user_model_1.User, as: "director", attributes: ["id", "username", "email"] }, { model: Models_1.Branch, as: "branches", attributes: ["id", "name", "address", "phone"], include: [{ model: user_model_1.User, as: "manager", attributes: ["id", "username", "email"] }] }],
        });
        res.status(200).json({ message: "Centers fetched successfully", centers });
    }
    catch (error) {
        return next(base_error_1.BaseError.BadRequest(400, "Centers not fetched"));
    }
}
async function getAllDirectors(req, res, next) {
    try {
        const directors = await user_model_1.User.findAll({ where: { role: "director" } });
        res.status(200).json({ message: "Directors fetched successfully", directors });
    }
    catch (error) {
        return next(base_error_1.BaseError.BadRequest(400, "Directors not fetched"));
    }
}
async function updateCenter(req, res, next) {
    try {
        const { name, address, owner, phone, login, password, paymentDate, status } = req.body;
        const [updated] = await Models_1.Center.update({ name, address, owner, phone, login, password, paymentDate, status }, { where: { id: req.params.id } });
        res.status(200).json({ message: "Center updated successfully", updated });
    }
    catch (e) {
        return next(base_error_1.BaseError.BadRequest(400, "Center not updated"));
    }
}
async function deleteCenter(req, res, next) {
    try {
        const center = await Models_1.Center.destroy({ where: { id: req.params.id } });
        res.status(201).json({ message: "Center deleted successfully", center });
    }
    catch (error) {
        return next(base_error_1.BaseError.BadRequest(400, "Center not deleted"));
    }
}
async function deleteDirector(req, res, next) {
    try {
        const director = await user_model_1.User.destroy({ where: { id: req.params.id } });
        res.status(201).json({ message: "Director deleted successfully", director });
    }
    catch (error) {
        return next(base_error_1.BaseError.BadRequest(400, "Director not deleted"));
    }
}
async function getOneCenter(req, res, next) {
    try {
        const center = await Models_1.Center.findOne({ where: { id: req.params.id } });
        res.status(200).json({ message: "Center fetched successfully", center });
    }
    catch (error) {
        return next(base_error_1.BaseError.BadRequest(400, "Center not fetched"));
    }
}
async function getOneDirector(req, res, next) {
    try {
        const director = await user_model_1.User.findOne({ where: { id: req.params.id } });
        res.status(200).json({ message: "Director fetched successfully", director });
    }
    catch (error) {
        return next(base_error_1.BaseError.BadRequest(400, "Director not fetched"));
    }
}
async function createCenter(req, res, next) {
    try {
        const { name, address, owner, phone, login, password, paymentDate, status } = req.body;
        const center = await Models_1.Center.create({
            name,
            address,
            owner,
            phone,
            login,
            password, // agar centerning alohida panel login/paroli bo‘lsa
            paymentDate,
            status,
        });
        res.status(201).json({ message: "Center created successfully", center });
    }
    catch (error) {
        return next(base_error_1.BaseError.BadRequest(400, "Center not created"));
    }
}
const changeRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;
        if (!Object.values(user_model_1.Role).includes(role)) {
            return res.status(400).json({ message: 'Noto‘g‘ri rol' });
        }
        const user = await user_model_1.User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
        }
        if (role === user_model_1.Role.DIRECTOR) {
            await user.update({ role, branch_id: null });
        }
        else {
            await user.update({ role });
        }
        if (user.dataValues.id === req.user?.id) { // o‘zini o‘zgartirmaslik
            return res.status(403).json({ message: 'O‘z rolingizni o‘zgartira olmaysiz' });
        }
        res.json({
            message: `Rol ${role} ga o‘zgartirildi`,
            user: {
                id: user.dataValues.id,
                username: user.dataValues.username,
                role: user.dataValues.role,
                branch_id: user.dataValues.branch_id,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server xatosi' });
    }
};
exports.changeRole = changeRole;
async function fastRegisterUserBySuperadmin(req, res, next) {
    try {
        const { username, email, password, branch_id } = req.body;
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await user_model_1.User.create({
            username,
            email,
            password: hashedPassword,
            branch_id,
            is_verified: true,
            role: "manager",
            verification_code: 0
        });
        res.status(201).json({ message: "User created successfully", user });
    }
    catch (error) {
        return next(base_error_1.BaseError.BadRequest(400, "User not created"));
    }
}
async function updateUserBySuperadmin(req, res, next) {
    try {
        const { username, email, password, branch_id } = req.body;
        const updatingFields = {};
        if (username)
            updatingFields.username = username;
        if (email)
            updatingFields.email = email;
        if (branch_id)
            updatingFields.branch_id = branch_id;
        if (password) {
            updatingFields.password = await bcryptjs_1.default.hash(password, 10);
        }
        const [updated] = await user_model_1.User.update(updatingFields, {
            where: { id: req.params.id },
        });
        if (!updated) {
            return next(base_error_1.BaseError.BadRequest(404, "User not found"));
        }
        res.status(200).json({ message: "User updated successfully" });
    }
    catch (error) {
        console.log(error);
        return next(base_error_1.BaseError.BadRequest(400, "User not updated"));
    }
}
async function deleteUserBySuperadmin(req, res, next) {
    try {
        const user = await user_model_1.User.destroy({ where: { id: req.params.id } });
        res.status(201).json({ message: "User deleted successfully", user });
    }
    catch (error) {
        return next(base_error_1.BaseError.BadRequest(400, "User not deleted"));
    }
}
