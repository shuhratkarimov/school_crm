import { Op } from "sequelize";
import { BaseError } from "../Utils/base_error";
import { Request, Response, NextFunction } from "express";
import { Group, Student, StudentGroup, Test, TestResult } from "../Models/index";
import jwt, { JwtPayload } from "jsonwebtoken";
import { sendSMS } from "../Utils/sms-service";
import { withBranchScope } from "../Utils/branch_scope.helper";

async function getTeacherTests(req: any, res: Response, next: NextFunction) {
    try {
        const teacherId = req.teacher.id;

        const { month, year } = req.query;
        if (!month || !year) return next(BaseError.BadRequest(400, "Yil va oy kerak"));

        const tests = await Test.findAll({
            where: {
                teacher_id: teacherId,
                created_at: {
                    [Op.gte]: new Date(Number(year), Number(month) - 1, 1),
                    [Op.lt]: new Date(Number(year), Number(month), 1),
                },
            },
            include: [{ model: Group, as: "group" }],
            order: [["created_at", "DESC"]],
        });

        res.json(tests);
    } catch (err) {
        next(err);
    }
}

async function getTestResults(req: any, res: Response, next: NextFunction) {
    try {
        const teacherId = req.teacher.id;
        const { test_id } = req.params;

        const test = await Test.findOne({
            where: { id: test_id, teacher_id: teacherId }, // ✅ ownership
            include: [
                { model: Group, as: "group" },
                {
                    model: TestResult,
                    as: "results",
                    include: [{ model: Student, as: "student" }],
                },
            ],
        });

        if (!test) return next(BaseError.BadRequest(404, "Test topilmadi"));

        res.json(test);
    } catch (err) {
        next(err);
    }
}

async function getTestResultsByAdmin(req: any, res: Response, next: NextFunction) {
    try {
        const { test_id } = req.params;

        const test = await Test.findOne({
            where: { id: test_id }, // ✅ Testda faqat id
            include: [
                {
                    model: Group,
                    as: "group",
                    required: true,
                    where: withBranchScope(req, {}, "branch_id"), // ✅ Group.branch_id bo'yicha filter
                },
                {
                    model: TestResult,
                    as: "results",
                    include: [{ model: Student, as: "student" }],
                },
            ],
        });

        if (!test) return next(BaseError.BadRequest(404, "Test topilmadi"));
        res.json(test);
    } catch (err) {
        next(err);
    }
}

async function getAllTestsByMonthAndYear(req: any, res: Response, next: NextFunction) {
    try {
        const { month, year } = req.query;
        if (!month || !year) return next(BaseError.BadRequest(400, "Yil va oy kerak"));

        const start = new Date(Number(year), Number(month) - 1, 1);
        const end = new Date(Number(year), Number(month), 1);

        const tests = await Test.findAll({
            where: {
                created_at: { [Op.gte]: start, [Op.lt]: end },
            },
            include: [{
                model: Group,
                as: "group",
                required: true,
                // ✅ branch filter group orqali
                where: withBranchScope(req, {}, "branch_id"),
            }],
            order: [["created_at", "DESC"]],
        });

        res.json(tests);
    } catch (err) {
        next(err);
    }
}

async function createTest(req: any, res: Response, next: NextFunction) {
    try {
        const teacherId = req.teacher.id;

        const { group_id, test_number, test_type, total_students, attended_students, average_score, results, date } = req.body;

        if (!group_id || !test_number || !test_type || !results || !date) {
            return next(BaseError.BadRequest(400, "Barcha maydonlar to'ldirilishi kerak"));
        }

        // ✅ Teacher faqat o'z guruhiga test qo'shsin
        const group = await Group.findOne({ where: { id: group_id, teacher_id: teacherId } });
        if (!group) return next(BaseError.BadRequest(403, "Bu guruh sizga tegishli emas"));

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

        const testResults = results.map((r: any) => ({
            test_id: test.id,
            student_id: r.student_id,
            score: r.score,
            attended: r.attended,
        }));

        await TestResult.bulkCreate(testResults);

        res.status(201).json({ message: "Test saqlandi", test });
    } catch (err) {
        next(err);
    }
}

async function updateTest(req: Request, res: Response, next: NextFunction) {
    try {
        const accesstoken = req.cookies.accesstoken;
        if (!accesstoken) return next(BaseError.BadRequest(400, "Token topilmadi"));

        const decoded = jwt.verify(accesstoken, process.env.ACCESS_SECRET_KEY as string) as JwtPayload;
        const teacherId = decoded.id;
        const { test_id } = req.params;

        const { group_id, test_number, test_type, total_students, attended_students, average_score, results, date, editTimeLimit, is_sent } = req.body;

        const test = await Test.findOne({ where: { id: test_id, teacher_id: teacherId } });
        if (!test) return next(BaseError.BadRequest(404, "Test topilmadi"));

        const now = new Date();
        if (!test.dataValues.created_at) return next(BaseError.BadRequest(400, "Test yaratilgan vaqt topilmadi"));
        const created = new Date(test.dataValues.created_at as Date);
        const diff = now.getTime() - created.getTime();
        if (diff > editTimeLimit * 3600 * 1000) {
            return next(BaseError.BadRequest(403, `Testni tahrirlash uchun ${editTimeLimit} soat o'tgan`));
        }

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

async function deleteTest(req: any, res: Response, next: NextFunction) {
    try {
        const teacherId = req.teacher.id;
        const { test_id } = req.params;

        const test = await Test.findOne({ where: { id: test_id, teacher_id: teacherId } });
        if (!test) return next(BaseError.BadRequest(404, "Test topilmadi"));

        await test.destroy();
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

async function getStudentsByTest(testId: string) {
    const test = await Test.findByPk(testId);
    if (!test) throw new Error("Test topilmadi");

    const studentsDatas = await StudentGroup.findAll({
        where: { group_id: test.group_id },
    });

    const studentIds = studentsDatas.map(s => s.dataValues.student_id);

    return await Student.findAll({
        where: { id: studentIds },
        attributes: ["id", "parents_phone_number"],
    });
}

const sendTestResultsToParents = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { test_id } = req.params;
        const test = await Test.findByPk(test_id);
        if (!test) return next(BaseError.BadRequest(404, "Test topilmadi"));

        const students = await getStudentsByTest(test_id);
        if (!students?.length) return next(BaseError.BadRequest(404, "O‘quvchilar topilmadi"));

        const results = await TestResult.findAll({
            where: { test_id },
            include: [{ model: Student, as: "student" }]
        });

        const isSmsSent = results.every(result => result.is_sent);
        if (isSmsSent) return next(BaseError.BadRequest(400, "Ushbu test uchun SMSlar allaqachon yuborilgan"));
        for (const result of results) {
            const message = result.attended ? `Hurmatli ${result.student.father_name ? result.student.father_name : 'ota-ona!'}, Farzandingiz ${result.student.last_name} ${result.student.first_name} markaz tomonidan o'tkazilgan testda ${result.score} ball olganligini ma'lum qilamiz\nHurmat bilan Intellectual Progress o'quv markazi jamoasi.` : `Hurmatli ${result.student.father_name ? result.student.father_name : 'ota-ona!'}, Farzandingiz ${result.student.last_name} ${result.student.first_name} markaz tomonidan o'tkazilgan testda qatnashmaganligini ma'lum qilamiz\nHurmat bilan Intellectual Progress o'quv markazi jamoasi.`;
            await sendSMS(
                result.student.id,
                result.student.parents_phone_number,
                message
            );

            result.is_sent = true;
            await result.save();
        }

        return res.json({ message: "SMSlar yuborildi" });
    } catch (err) {
        return next(err);
    }
};

export { getTeacherTests, getTestResultsByAdmin, getTestResults, createTest, updateTest, deleteTest, getAllTestsByMonthAndYear, sendTestResultsToParents };
