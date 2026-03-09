"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSchedules = getSchedules;
const index_1 = require("../Models/index");
async function getSchedules(req, res, next) {
    try {
        const lang = req.headers["accept-language"] || "uz";
        const schedules = await index_1.Schedule.findAll({
            include: [
                {
                    model: index_1.Teacher,
                    as: "teacher",
                    attributes: ["first_name", "last_name"]
                },
                {
                    model: index_1.Group,
                    as: "scheduleGroup",
                    attributes: ["group_subject"]
                }
            ]
        });
        res.status(200).json(schedules);
    }
    catch (error) {
        next(error);
    }
}
