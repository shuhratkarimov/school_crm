import { Op } from "sequelize";
import { BaseError } from "../Utils/base_error";
import { Request, Response, NextFunction } from "express";
import { Group, Student, Test, TestResult } from "../Models/index";
import jwt, { JwtPayload } from "jsonwebtoken";

async function getTeacherTests(req: Request, res: Response, next: NextFunction) {
    try {
        const accesstoken = req.cookies.accesstoken;
        if (!accesstoken) return next(BaseError.BadRequest(400, "Token topilmadi"));

        const decoded = jwt.verify(accesstoken, process.env.ACCESS_SECRET_KEY as string) as JwtPayload;
        const teacherId = decoded.id;

        const { month, year } = req.query;
        if (!month || !year) {
            return next(BaseError.BadRequest(400, "Yil va oy kerak"));
        }

        const tests = await Test.findAll({
            where: {
                teacher_id: teacherId,
                created_at: {
                    [Op.gte]: new Date(Number(year), Number(month) - 1, 1),
                    [Op.lt]: new Date(Number(year), Number(month), 1),
                },
            },
            include: [{ model: Group, as: "group" }],
        });

        res.json(tests);
    } catch (err) {
        return next(err);
    }
}

async function getTestResults(req: Request, res: Response, next: NextFunction) {
    try {
        const { test_id } = req.params;

        const test = await Test.findByPk(test_id, {
            include: [
                { model: Group, as: "group" },
                {
                    model: TestResult,
                    as: "results",
                    include: [{ model: Student, as: "student" }],
                },
            ],
        });

        if (!test) {
            return next(BaseError.BadRequest(404, "Test topilmadi"));
        }

        res.json(test);
    } catch (err) {
        return next(err);
    }
}

async function getAllTestsByMonthAndYear(req: Request, res: Response, next: NextFunction) {
    try {
        const { month, year } = req.query;
        if (!month || !year) {
            return next(BaseError.BadRequest(400, "Yil va oy kerak"));
        }

        const tests = await Test.findAll({
            where: {
                created_at: {
                    [Op.gte]: new Date(Number(year), Number(month) - 1, 1),
                    [Op.lt]: new Date(Number(year), Number(month), 1),
                },
            },
            include: [{ model: Group, as: "group" }],
        });
        res.json(tests);
    } catch (err) {
        return next(err);
    }
}


async function createTest(req: Request, res: Response, next: NextFunction) {
    try {
        const accesstoken = req.cookies.accesstoken;
        if (!accesstoken) return next(BaseError.BadRequest(400, "Token topilmadi"));

        const decoded = jwt.verify(accesstoken, process.env.ACCESS_SECRET_KEY as string) as JwtPayload;
        const teacherId = decoded.id;

        const { group_id, test_number, test_type, total_students, attended_students, average_score, results, date, editTimeLimit } = req.body;

        if (!group_id || !test_number || !test_type || !results) {
            return next(BaseError.BadRequest(400, "Barcha maydonlar to'ldirilishi kerak"));
        }

        const test = await Test.create({
            group_id,
            teacher_id: teacherId,
            test_number,
            test_type,
            total_students,
            attended_students,
            average_score,
            date,
        });

        const testResults = results.map((result: any) => ({
            test_id: test.id,
            student_id: result.student_id, // bu UUID string
            score: result.score,
            attended: result.attended,
        }));

        await TestResult.bulkCreate(testResults);

        res.status(201).json({ message: "Test saqlandi", test });
    } catch (err) {
        return next(err);
    }
}

async function updateTest(req: Request, res: Response, next: NextFunction) {
    try {
        const accesstoken = req.cookies.accesstoken;
        if (!accesstoken) return next(BaseError.BadRequest(400, "Token topilmadi"));

        const decoded = jwt.verify(accesstoken, process.env.ACCESS_SECRET_KEY as string) as JwtPayload;
        const teacherId = decoded.id;
        const { test_id } = req.params;

        const { group_id, test_number, test_type, total_students, attended_students, average_score, results, date, editTimeLimit } = req.body;

        const test = await Test.findByPk(test_id);
        if (!test) return next(BaseError.BadRequest(404, "Test topilmadi"));

        const now = new Date();
        if (!test.dataValues.created_at) return next(BaseError.BadRequest(400, "Test yaratilgan vaqt topilmadi"));
        const created = new Date(test.dataValues.created_at as Date);
        const diff = now.getTime() - created.getTime();
        if (diff > editTimeLimit * 3600 * 1000) {
            return next(BaseError.BadRequest(403, `Testni tahrirlash uchun ${editTimeLimit} soat o'tgan`));        }

        await test.update({
            group_id,
            teacher_id: teacherId,
            test_number,
            test_type,
            total_students,
            attended_students,
            average_score,
            date,
        });

        await TestResult.destroy({ where: { test_id } });

        const testResults = results.map((result: any) => ({
            test_id,
            student_id: result.student_id, // UUID
            score: result.score,
            attended: result.attended,
        }));

        await TestResult.bulkCreate(testResults);

        res.json({ message: "Test tahrirlandi" });
    } catch (err) {
        return next(err);
    }
}

async function deleteTest(req: Request, res: Response, next: NextFunction) {
    try {
        const { test_id } = req.params;
        const test = await Test.findByPk(test_id);
        if (!test) return next(BaseError.BadRequest(404, "Test topilmadi"));

        await test.destroy();
        res.status(204).send();
    } catch (err) {
        return next(err);
    }
}

export { getTeacherTests, getTestResults, createTest, updateTest, deleteTest, getAllTestsByMonthAndYear };
