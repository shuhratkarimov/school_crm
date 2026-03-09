"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schedules_ctr_1 = require("../controller/schedules.ctr");
const express_1 = require("express");
const ScheduleRouter = (0, express_1.Router)();
ScheduleRouter.get("/get_schedules", schedules_ctr_1.getSchedules);
exports.default = ScheduleRouter;
