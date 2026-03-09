import { User, Role } from "../Models/user_model";
import bcryptjs from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { BaseError } from "../Utils/base_error";
import { NextFunction, Request, Response } from "express";
import { Branch, Center, UserSettings } from "../Models";
import sequelize from "../config/database.config";

async function checkCpanelAuth(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies.accesstoken;
    if (!token) {
        return res.status(401).json({ message: "Unauthorized at check auth" });
    }
    try {
        jwt.verify(token, process.env.ACCESS_SECRET_KEY as string);
        res.status(200).json({ message: "Authenticated" });
    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
}

async function superadminLogin(req: Request, res: Response, next: NextFunction) {
    try {
        const { email, password } = req.body
        const user = await User.findOne({ where: { email } })
        if (!user) {
            return next(BaseError.BadRequest(404, "User not found"))
        }
        const isPasswordValid = await bcryptjs.compare(password, user.dataValues.password)
        if (!isPasswordValid) {
            return next(BaseError.BadRequest(401, "Invalid password"))
        }
        if (user.dataValues.role !== "superadmin") {
            return next(BaseError.BadRequest(403, "Invalid role"))
        }
        const payload: { id: string; username: string; email: string; role: string } = {
            id: user.dataValues.id,
            username: user.dataValues.username,
            email: user.dataValues.email,
            role: user.dataValues.role,
        };
        const generateAccessToken = (payload: object | null): string => {
            if (!payload) throw new Error("Payload cannot be null");

            const secretKey = process.env.ACCESS_SECRET_KEY;
            if (!secretKey) throw new Error("ACCESS_SECRET_KEY is not defined");

            const expiresIn = process.env.ACCESS_EXPIRING_TIME || "15m";
            return jwt.sign(
                payload,
                secretKey as string,
                { expiresIn } as jwt.SignOptions
            );
        };

        const generateRefreshToken = (payload: object | null): string => {
            if (!payload) throw new Error("Payload cannot be null");

            const secretKey = process.env.REFRESH_SECRET_KEY;
            if (!secretKey) throw new Error("REFRESH_SECRET_KEY is not defined");

            return jwt.sign(
                payload,
                secretKey as string,
                { expiresIn: "7d" } as jwt.SignOptions
            );
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
    } catch (error) {
        next(error)
    }
}

async function getAllBranches(req: Request, res: Response, next: NextFunction) {
    try {
        const branches = await Branch.findAll({
            include: [{ model: Center, as: "center" }, { model: User, as: "manager", attributes: ["id", "username", "email"] }],
        });
        res.status(200).json({ message: "Branches fetched successfully", branches })
    } catch (error) {
        next(error)
    }
}

async function getOneBranch(req: Request, res: Response, next: NextFunction) {
    try {
        const branch = await Branch.findOne({ where: { id: req.params.id } })
        res.status(200).json({ message: "Branch fetched successfully", branch })
    } catch (error) {
        next(error)
    }
}

async function createBranch(req: Request, res: Response, next: NextFunction) {
    try {
        const { name, address, phone, center_id, manager_id } = req.body;

        const branch = await Branch.create({
            name,
            address,
            phone,
            manager_id: manager_id || null,
            center_id: center_id || null,
        });

        res.status(201).json({ message: "Branch created successfully", branch });
    } catch (error) {
        next(error);
    }
}

async function updateBranch(req: Request, res: Response, next: NextFunction) {
    try {
        const { name, address, phone, center_id, manager_id } = req.body;

        const [updated] = await Branch.update(
            { name, address, phone, center_id: center_id || null, manager_id: manager_id || null },
            { where: { id: req.params.id } }
        );

        res.status(200).json({ message: "Branch updated successfully", updated });
    } catch (error) {
        next(error);
    }
}

async function deleteBranch(req: Request, res: Response, next: NextFunction) {
    try {
        const branch = await Branch.destroy({ where: { id: req.params.id } })
        res.status(201).json({ message: "Branch deleted successfully", branch })
    } catch (error) {
        next(error)
    }
}

async function assignDirector(req: Request, res: Response, next: NextFunction) {
    const t = await sequelize.transaction();

    try {
        const { centerId } = req.params;
        const { directorId } = req.body;

        const user = await User.findByPk(directorId, { transaction: t });
        if (!user) {
            await t.rollback();
            return next(BaseError.BadRequest(404, "User not found"));
        }

        await User.update(
            { role: "director", branch_id: null },
            { where: { id: directorId }, transaction: t }
        );

        const [updated] = await Center.update(
            { director_id: directorId },
            { where: { id: centerId }, transaction: t }
        );

        await UserSettings.findOrCreate({
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
    } catch (e) {
        await t.rollback();
        console.error("assignDirector error:", e);
        return next(BaseError.BadRequest(400, "Director not assigned"));
    }
}

async function assignManager(req: Request, res: Response, next: NextFunction) {
    try {
        const { branchId } = req.params;
        const { managerId } = req.body;

        const user = await User.findByPk(managerId);
        if (!user) return next(BaseError.BadRequest(404, "User not found"));

        await User.update({ role: "manager", branch_id: branchId }, { where: { id: managerId } });

        const [updated] = await Branch.update({ manager_id: managerId }, { where: { id: branchId } });

        res.status(200).json({ message: "Manager assigned", updated });
    } catch (e) {
        return next(BaseError.BadRequest(400, "Manager not assigned"))
    }
}

async function getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
        const users = await User.findAll({
            attributes: { exclude: ["password"] }
        });

        res.status(200).json({
            message: "Users fetched successfully",
            users
        });
    } catch (error) {
        return next(BaseError.BadRequest(400, "Users not fetched"))
    }
}

async function getAllCenters(req: Request, res: Response, next: NextFunction) {
    try {
        const centers = await Center.findAll({
            include: [{ model: User, as: "director", attributes: ["id", "username", "email"] }, { model: Branch, as: "branches", attributes: ["id", "name", "address", "phone"], include: [{ model: User, as: "manager", attributes: ["id", "username", "email"] }] }],
        });
        res.status(200).json({ message: "Centers fetched successfully", centers })
    } catch (error) {
        return next(BaseError.BadRequest(400, "Centers not fetched"))
    }
}

async function getAllDirectors(req: Request, res: Response, next: NextFunction) {
    try {
        const directors = await User.findAll({ where: { role: "director" } })
        res.status(200).json({ message: "Directors fetched successfully", directors })
    } catch (error) {
        return next(BaseError.BadRequest(400, "Directors not fetched"))
    }
}

async function updateCenter(req: Request, res: Response, next: NextFunction) {
    try {
        const { name, address, owner, phone, login, password, paymentDate, status } = req.body;

        const [updated] = await Center.update(
            { name, address, owner, phone, login, password, paymentDate, status },
            { where: { id: req.params.id } }
        );

        res.status(200).json({ message: "Center updated successfully", updated });
    } catch (e) {
        return next(BaseError.BadRequest(400, "Center not updated"))
    }
}

async function deleteCenter(req: Request, res: Response, next: NextFunction) {
    try {
        const center = await Center.destroy({ where: { id: req.params.id } })
        res.status(201).json({ message: "Center deleted successfully", center })
    } catch (error) {
        return next(BaseError.BadRequest(400, "Center not deleted"))
    }
}

async function deleteDirector(req: Request, res: Response, next: NextFunction) {
    try {
        const director = await User.destroy({ where: { id: req.params.id } })
        res.status(201).json({ message: "Director deleted successfully", director })
    } catch (error) {
        return next(BaseError.BadRequest(400, "Director not deleted"))
    }
}

async function getOneCenter(req: Request, res: Response, next: NextFunction) {
    try {
        const center = await Center.findOne({ where: { id: req.params.id } })
        res.status(200).json({ message: "Center fetched successfully", center })
    } catch (error) {
        return next(BaseError.BadRequest(400, "Center not fetched"))
    }
}

async function getOneDirector(req: Request, res: Response, next: NextFunction) {
    try {
        const director = await User.findOne({ where: { id: req.params.id } })
        res.status(200).json({ message: "Director fetched successfully", director })
    } catch (error) {
        return next(BaseError.BadRequest(400, "Director not fetched"))
    }
}

async function createCenter(req: Request, res: Response, next: NextFunction) {
    try {
        const { name, address, owner, phone, login, password, paymentDate, status } = req.body;

        const center = await Center.create({
            name,
            address,
            owner,
            phone,
            login,
            password,     // agar centerning alohida panel login/paroli bo‘lsa
            paymentDate,
            status,
        });

        res.status(201).json({ message: "Center created successfully", center });
    } catch (error) {
        return next(BaseError.BadRequest(400, "Center not created"))
    }
}

export const changeRole = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!Object.values(Role).includes(role as Role)) {
            return res.status(400).json({ message: 'Noto‘g‘ri rol' });
        }


        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
        }
        if (role === Role.DIRECTOR) {
            await user.update({ role, branch_id: null });
        } else {
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server xatosi' });
    }
};

async function fastRegisterUserBySuperadmin(req: Request, res: Response, next: NextFunction) {
    try {
        const { username, email, password, branch_id } = req.body;
        const hashedPassword = await bcryptjs.hash(password, 10);

        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            branch_id,
            is_verified: true,
            role: "manager",
            verification_code: 0
        });
        res.status(201).json({ message: "User created successfully", user });
    } catch (error) {
        return next(BaseError.BadRequest(400, "User not created"))
    }
}
async function updateUserBySuperadmin(req: Request, res: Response, next: NextFunction) {
    try {
        const { username, email, password, branch_id } = req.body;

        const updatingFields: any = {};

        if (username) updatingFields.username = username;
        if (email) updatingFields.email = email;
        if (branch_id) updatingFields.branch_id = branch_id;

        if (password) {
            updatingFields.password = await bcryptjs.hash(password, 10);
        }

        const [updated] = await User.update(updatingFields, {
            where: { id: req.params.id },
        });

        if (!updated) {
            return next(BaseError.BadRequest(404, "User not found"));
        }

        res.status(200).json({ message: "User updated successfully" });

    } catch (error) {
        console.log(error)
        return next(BaseError.BadRequest(400, "User not updated"));
    }
}

async function deleteUserBySuperadmin(req: Request, res: Response, next: NextFunction) {
    try {
        const user = await User.destroy({ where: { id: req.params.id } })
        res.status(201).json({ message: "User deleted successfully", user })
    } catch (error) {
        return next(BaseError.BadRequest(400, "User not deleted"))
    }
}


export { superadminLogin, getAllBranches, getOneBranch, createBranch, updateBranch, deleteBranch, checkCpanelAuth, assignDirector, assignManager, getAllUsers, getAllCenters, getAllDirectors, updateCenter, deleteCenter, deleteDirector, getOneCenter, getOneDirector, createCenter, fastRegisterUserBySuperadmin, updateUserBySuperadmin, deleteUserBySuperadmin }